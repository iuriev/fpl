import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useGameweeks, usePlayerPool, useSquad } from '@/api/queries';
import { Button } from '@/components/ui/Button/Button';
import { copy, interpolate } from '@/lib/copy';
import {
  calcBank,
  calcTransferCost,
  clearDraft,
  loadDraft,
  poolPlayerToSquadPlayer,
  saveDraft,
} from '@/lib/transfer-draft';
import type { PlayerPosition, PoolPlayer, SquadPlayer, TransferChip, TransferDraft, TransferSwap } from '@/types';

import { PlayerPickerSheet } from './PlayerPickerSheet';
import { SwapsStrip } from './SwapsStrip';
import { TransferActionBar } from './TransferActionBar';
import { TransferHeader } from './TransferHeader';
import { TransferPitch } from './TransferPitch';
import styles from './TransferScreen.module.css';
import { useSubMode } from './useSubMode';

export interface TransferScreenProps {
  teamId: number;
}

function makeDefaultDraft(teamId: number, targetGw: number): TransferDraft {
  return {
    teamId,
    targetGw,
    savedAt: new Date().toISOString(),
    freeTransfers: 1,
    chip: 'none',
    swaps: [],
    subs: [],
  };
}

export const TransferScreen: React.FC<TransferScreenProps> = ({ teamId }) => {
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { data: gameweeks } = useGameweeks();
  const currentGw = gameweeks?.current ?? null;
  const nextGw = currentGw !== null ? currentGw + 1 : null;

  const { data: squadData, isLoading: squadLoading, isError: squadError, refetch } =
    useSquad(teamId, currentGw);
  const { data: poolData, isLoading: poolLoading } = usePlayerPool();

  const [draft, setDraft] = useState<TransferDraft | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [staleToast, setStaleToast] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!staleToast) return;
    const t = setTimeout(() => setStaleToast(null), 5000);
    return () => clearTimeout(t);
  }, [staleToast]);

  useEffect(() => {
    if (nextGw === null) return;
    const saved = loadDraft(teamId, nextGw);
    if (saved) {
      setDraft(saved);
    } else {
      const prevRaw = localStorage.getItem(`fpl-transfer-draft-${teamId}`);
      if (prevRaw) {
        try {
          const prev = JSON.parse(prevRaw) as TransferDraft;
          setStaleToast(interpolate(copy.transfersStaleToast, { n: prev.targetGw }));
        } catch {
          // ignore malformed JSON
        }
      }
      setDraft(makeDefaultDraft(teamId, nextGw));
    }
  }, [teamId, nextGw]);

  const persistDraft = useCallback((d: TransferDraft) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDraft(d), 300);
  }, []);

  const updateDraft = useCallback(
    (updater: (prev: TransferDraft) => TransferDraft) => {
      setDraft((prev) => {
        const next = updater(prev ?? makeDefaultDraft(teamId, nextGw ?? 0));
        persistDraft(next);
        return next;
      });
    },
    [teamId, nextGw, persistDraft],
  );

  const originalSquad: SquadPlayer[] = useMemo(() => {
    if (!squadData) return [];
    return [...squadData.starters, ...squadData.bench];
  }, [squadData]);

  const allPoolPlayers: PoolPlayer[] = poolData?.players ?? [];

  const displaySquad = useMemo(() => {
    if (!draft) return originalSquad;
    const swapMap = new Map(
      draft.swaps.map((s) => {
        const inPlayer = allPoolPlayers.find((p) => p.id === s.inId);
        return [s.outId, inPlayer] as const;
      }),
    );
    let squad = originalSquad.map((p) => {
      const replacement = swapMap.get(p.id);
      if (replacement) {
        const newPlayer = poolPlayerToSquadPlayer(replacement);
        return { ...newPlayer, isCaptain: p.isCaptain, isViceCaptain: p.isViceCaptain };
      }
      return p;
    });
    for (const sub of draft.subs) {
      const fieldIdx = squad.findIndex((p) => p.id === sub.fieldId);
      const benchIdx = squad.findIndex((p) => p.id === sub.benchId);
      if (fieldIdx !== -1 && benchIdx !== -1) {
        squad = [...squad];
        [squad[fieldIdx], squad[benchIdx]] = [squad[benchIdx], squad[fieldIdx]];
      }
    }
    return squad;
  }, [originalSquad, draft, allPoolPlayers]);

  const displayStarters = useMemo(
    () => displaySquad.filter((_, i) => i < (squadData?.starters.length ?? 11)),
    [displaySquad, squadData],
  );
  const displayBench = useMemo(
    () => displaySquad.slice(squadData?.starters.length ?? 11),
    [displaySquad, squadData],
  );

  const inPlayerIds = useMemo(
    () => new Set(draft?.swaps.map((s) => s.inId) ?? []),
    [draft],
  );

  const allPlayerCosts = useMemo(() => {
    const out = originalSquad.map((p) => ({ id: p.id, nowCost: p.nowCost }));
    const ins = allPoolPlayers.map((p) => ({ id: p.id, nowCost: p.nowCost }));
    return [...out, ...ins];
  }, [originalSquad, allPoolPlayers]);

  const initialBank = squadData?.summary.bank ?? 0;
  const currentBank = draft ? calcBank(initialBank, draft.swaps, allPlayerCosts) : initialBank;
  const transferCost = draft
    ? calcTransferCost(draft.swaps.length, draft.freeTransfers, draft.chip)
    : 0;

  const outPlayer = useMemo(() => {
    if (selectedPlayerId === null) return undefined;
    const match = allPoolPlayers.find((p) => p.id === selectedPlayerId);
    if (match) return match;
    const sqp = originalSquad.find((s) => s.id === selectedPlayerId);
    if (!sqp) return undefined;
    return allPoolPlayers.find((p) => p.webName === sqp.name);
  }, [selectedPlayerId, allPoolPlayers, originalSquad]);

  const candidates = outPlayer
    ? outPlayer.position === 'GK'
      ? allPoolPlayers.filter((p) => p.position === 'GK')
      : allPoolPlayers.filter((p) => p.position !== 'GK')
    : [];

  const poolLookup = useMemo(
    () => new Map(allPoolPlayers.map((p) => [p.id, p])),
    [allPoolPlayers],
  );

  const isOutfield = outPlayer ? outPlayer.position !== 'GK' : false;

  const squadPlayerIds = useMemo(
    () => new Set(displaySquad.map((p) => p.id)),
    [displaySquad],
  );

  const squadTeamCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of displaySquad) {
      counts.set(p.teamId, (counts.get(p.teamId) ?? 0) + 1);
    }
    return counts;
  }, [displaySquad]);

  const squadPositionCounts = useMemo(() => {
    const counts = new Map<PlayerPosition, number>();
    for (const p of displaySquad) {
      counts.set(p.position, (counts.get(p.position) ?? 0) + 1);
    }
    return counts;
  }, [displaySquad]);

  const availableBudget = useMemo(() => {
    if (!outPlayer) return currentBank;
    const chainSwap = draft?.swaps.find((s) => s.inId === outPlayer.id);
    if (chainSwap) return currentBank + outPlayer.nowCost;
    return currentBank + (originalSquad.find((s) => s.id === outPlayer.id)?.nowCost ?? 0);
  }, [outPlayer, currentBank, draft, originalSquad]);

  const nameMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of originalSquad) m.set(p.id, p.name);
    for (const p of allPoolPlayers) m.set(p.id, p.webName);
    return m;
  }, [originalSquad, allPoolPlayers]);

  const costMap = useMemo(() => {
    const m = new Map<number, number>();
    for (const p of allPlayerCosts) m.set(p.id, p.nowCost);
    return m;
  }, [allPlayerCosts]);

  const { selectedSubId, validSubTargets, handleSubIconClick, handleSubTargetClick, cancelSub } =
    useSubMode(displayStarters, displayBench, updateDraft);

  const handlePlayerClick = (id: number) => {
    if (selectedSubId !== null) return;
    setSelectedPlayerId(id);
  };

  const handleSelectReplacement = (inPlayer: PoolPlayer) => {
    if (selectedPlayerId === null) return;
    updateDraft((d) => {
      const chainSwap = d.swaps.find((s) => s.inId === selectedPlayerId);
      let newSwaps: TransferSwap[];
      if (chainSwap) {
        if (inPlayer.id === chainSwap.outId) {
          newSwaps = d.swaps.filter((s) => s.inId !== selectedPlayerId && s.outId !== selectedPlayerId);
        } else {
          newSwaps = d.swaps
            .map((s) => (s.inId === selectedPlayerId ? { outId: s.outId, inId: inPlayer.id } : s))
            .filter((s) => s.outId !== selectedPlayerId);
        }
      } else {
        newSwaps = [...d.swaps.filter((s) => s.outId !== selectedPlayerId), { outId: selectedPlayerId, inId: inPlayer.id }];
      }
      return { ...d, swaps: newSwaps };
    });
    setSelectedPlayerId(null);
  };

  const handleUndo = (outId: number) => {
    updateDraft((d) => ({ ...d, swaps: d.swaps.filter((s) => s.outId !== outId) }));
  };

  const handleReset = () => updateDraft((d) => ({ ...d, swaps: [] }));

  const handleSave = () => {
    if (draft) saveDraft(draft);
  };

  const handleChipToggle = (chip: 'wildcard' | 'freehit') => {
    updateDraft((d) => ({ ...d, chip: d.chip === chip ? 'none' : (chip as TransferChip) }));
  };

  const handleFreeTransfersChange = (n: number) => {
    updateDraft((d) => ({ ...d, freeTransfers: n }));
  };

  const isLoading = squadLoading || poolLoading || !draft;
  const hasNoSquad = !squadLoading && !squadError && !squadData;

  return (
    <div className={styles.screen}>
      {draft && (
        <TransferHeader
          bank={currentBank}
          freeTransfers={draft.freeTransfers}
          cost={transferCost}
          chip={draft.chip}
          nextGw={nextGw}
          onBack={() => navigate(`/?teamId=${teamId}`)}
          onChipToggle={handleChipToggle}
          onFreeTransfersChange={handleFreeTransfersChange}
        />
      )}

      {isLoading && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.loadingPlaceholder}</p>
        </div>
      )}

      {squadError && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.transfersLoadError}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            {copy.transfersRetry}
          </Button>
        </div>
      )}

      {hasNoSquad && (
        <div className={styles.stateCenter}>
          <p className={styles.stateText}>{copy.transfersNoSquad}</p>
        </div>
      )}

      {!isLoading && !squadError && squadData && displaySquad.length > 0 && (
        <>
          <div
            className={`${styles.pitchArea} ${selectedPlayerId !== null ? styles.pitchArea_dimmed : ''}`}
          >
            <TransferPitch
              starters={displayStarters}
              bench={displayBench}
              outPlayerId={selectedPlayerId}
              inPlayerIds={inPlayerIds}
              onPlayerClick={handlePlayerClick}
              poolLookup={poolLookup}
              selectedSubId={selectedSubId}
              validSubTargets={validSubTargets}
              onSubIconClick={handleSubIconClick}
              onSubTargetClick={handleSubTargetClick}
            />
          </div>

          {draft && (
            <SwapsStrip
              swaps={draft.swaps}
              nameMap={nameMap}
              costMap={costMap}
              freeTransfers={draft.freeTransfers}
              onUndo={handleUndo}
            />
          )}

          <TransferActionBar
            onReset={handleReset}
            onSave={handleSave}
            hasSwaps={(draft?.swaps.length ?? 0) > 0}
          />
        </>
      )}

      {outPlayer && (
        <PlayerPickerSheet
          key={outPlayer.id}
          open={selectedPlayerId !== null}
          outPlayer={outPlayer}
          candidates={candidates}
          availableBudget={availableBudget}
          squadTeamCounts={squadTeamCounts}
          squadPositionCounts={squadPositionCounts}
          squadPlayerIds={squadPlayerIds}
          isOutfield={isOutfield}
          onSelect={handleSelectReplacement}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {staleToast && (
        <div className={styles.toast} role="status">
          {staleToast}
        </div>
      )}
    </div>
  );
};

TransferScreen.displayName = 'TransferScreen';
