import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useGameweeks, usePlayerPool, useSquad } from '@/api/queries';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { Button } from '@/components/ui/Button/Button';
import { HelpTour } from '@/components/ui/HelpTour/HelpTour';
import { TeamNavDrawer } from '@/components/ui/TeamNavDrawer/TeamNavDrawer';
import { copy, interpolate } from '@/lib/copy';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';
import { useRequestPremiumUpsell } from '@/lib/premium-upsell/PremiumUpsellContext';
import {
  applySwapsToSquad,
  augmentPoolWithSuggested,
  buildFreeHitSubs,
  buildFreeHitSwaps,
  calcBank,
  calcTransferCost,
  poolPlayerToSquadPlayer,
  squadIdsAfterSwaps,
} from '@/lib/transfer-draft';
import {
  ApiTransferDraftRepository,
  resolveTransferDraft,
  type TransferDraftRepository,
} from '@/lib/transfer-draft-repository';
import type {
  ChipStatuses,
  PlayerPosition,
  PoolPlayer,
  SquadPlayer,
  TransferChip,
  TransferDraft,
  TransferSwap,
} from '@/types';

type PlanChip = TransferChip | 'bboost' | '3xc';

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

const DEFAULT_CHIP_STATUSES: ChipStatuses = {
  wildcard: { status: 'available' },
  freehit:  { status: 'available' },
  bboost:   { status: 'available' },
  '3xc':    { status: 'available' },
};

const draftRepo: TransferDraftRepository = new ApiTransferDraftRepository();

export const TransferScreen: React.FC<TransferScreenProps> = ({ teamId }) => {
  const { isDemoMode } = useMyTeam();
  const navLinksMode = isDemoMode ? 'demo' : 'full';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: gameweeks } = useGameweeks();
  const currentGw = gameweeks?.current ?? null;
  const nextGw = gameweeks?.next ?? null;

  const {
    data: squadData,
    isLoading: squadLoading,
    isError: squadError,
    refetch,
  } = useSquad(teamId, currentGw);
  const { data: poolData, isLoading: poolLoading } = usePlayerPool();

  const [draft, setDraft] = useState<TransferDraft | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [planChip, setPlanChip] = useState<PlanChip>('none');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [isTransfersOpen, setIsTransfersOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const draftSourceRef = useRef<'saved' | 'fresh'>('fresh');
  const chipInitializedRef = useRef(false);
  const upsellRequestedRef = useRef(false);
  const requestPremiumUpsell = useRequestPremiumUpsell();

  useEffect(() => {
    let cancelled = false;
    chipInitializedRef.current = false;
    upsellRequestedRef.current = false;

    const load = async () => {
      if (nextGw === null) {
        if (!cancelled) {
          setDraft(null);
          setDraftReady(false);
        }
        return;
      }

      if (!cancelled) setDraftReady(false);

      if (isDemoMode) {
        if (!cancelled) {
          setDraft(makeDefaultDraft(teamId, nextGw));
          setPlanChip('none');
          draftSourceRef.current = 'fresh';
          setDraftReady(true);
        }
        return;
      }

      const { draft: resolved, staleGw, fromSaved } = await resolveTransferDraft(
        teamId,
        nextGw,
        draftRepo,
      );

      if (cancelled) return;

      if (staleGw !== null) {
        setToast(interpolate(copy.transfersStaleToast, { n: staleGw }));
      }

      if (resolved) {
        setDraft(resolved);
        setPlanChip(resolved.chip);
        draftSourceRef.current = fromSaved ? 'saved' : 'fresh';
      } else {
        setDraft(makeDefaultDraft(teamId, nextGw));
        setPlanChip('none');
        draftSourceRef.current = 'fresh';
      }
      setDraftReady(true);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [teamId, nextGw, isDemoMode]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const persistDraft = useCallback(
    (d: TransferDraft) => {
      if (isDemoMode) return;
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void draftRepo.save(d).catch(() => {});
      }, 300);
    },
    [isDemoMode],
  );

  const updateDraft = useCallback(
    (updater: (prev: TransferDraft) => TransferDraft, silent = false) => {
      if (!silent) setIsDirty(true);
      setDraft((prev) => {
        const next = updater(prev ?? makeDefaultDraft(teamId, nextGw ?? 0));
        persistDraft(next);
        return next;
      });
    },
    [teamId, nextGw, persistDraft]
  );

  useEffect(() => {
    if (!squadData || chipInitializedRef.current) return;
    chipInitializedRef.current = true;
    const s = squadData.chipStatuses;
    const initial: PlanChip =
      s.wildcard.status === 'active' ? 'wildcard' :
      s.freehit.status  === 'active' ? 'freehit'  :
      s.bboost.status   === 'active' ? 'bboost'   :
      s['3xc'].status   === 'active' ? '3xc'      :
      'none';
    if (draftSourceRef.current === 'fresh') {
      setPlanChip(initial);
      updateDraft(
        (d) => ({
          ...d,
          freeTransfers: squadData.summary.freeTransfers,
          ...(initial === 'wildcard' || initial === 'freehit'
            ? { chip: initial as TransferChip }
            : {}),
        }),
        true
      );
    } else {
      updateDraft((d) => ({ ...d, freeTransfers: squadData.summary.freeTransfers }), true);
    }
  }, [squadData, updateDraft]);

  const initialChip = useMemo<PlanChip>(() => {
    if (!squadData) return 'none';
    const s = squadData.chipStatuses;
    if (s.wildcard.status === 'active') return 'wildcard';
    if (s.freehit.status === 'active') return 'freehit';
    if (s.bboost.status === 'active') return 'bboost';
    if (s['3xc'].status === 'active') return '3xc';
    return 'none';
  }, [squadData]);

  const originalSquad: SquadPlayer[] = useMemo(() => {
    if (!squadData) return [];
    return [...squadData.starters, ...squadData.bench];
  }, [squadData]);

  const allPoolPlayers = useMemo(() => poolData?.players ?? [], [poolData]);
  const [aiSuggestedPlayers, setAiSuggestedPlayers] = useState<
    Array<{ id: number; position: PlayerPosition; nowCost: number }>
  >([]);
  const effectivePoolPlayers = useMemo(
    () => augmentPoolWithSuggested(allPoolPlayers, aiSuggestedPlayers),
    [allPoolPlayers, aiSuggestedPlayers]
  );

  const displaySquad = useMemo(() => {
    if (!draft) return originalSquad;
    const swapMap = new Map(
      draft.swaps.map((s) => {
        const inPlayer = effectivePoolPlayers.find((p) => p.id === s.inId);
        return [s.outId, inPlayer] as const;
      })
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
  }, [originalSquad, draft, effectivePoolPlayers]);

  const displayStarters = useMemo(
    () => displaySquad.filter((_, i) => i < (squadData?.starters.length ?? 11)),
    [displaySquad, squadData]
  );
  const displayBench = useMemo(
    () => displaySquad.slice(squadData?.starters.length ?? 11),
    [displaySquad, squadData]
  );

  const inPlayerIds = useMemo(() => new Set(draft?.swaps.map((s) => s.inId) ?? []), [draft]);

  const allPlayerCosts = useMemo(() => {
    const out = originalSquad.map((p) => ({
      id: p.id,
      nowCost: p.nowCost,
      sellPrice: p.sellPrice,
    }));
    const ins = effectivePoolPlayers.map((p) => ({ id: p.id, nowCost: p.nowCost }));
    return [...out, ...ins];
  }, [originalSquad, effectivePoolPlayers]);

  const initialBank = squadData?.summary.bank ?? 0;
  const currentBank = useMemo(() => {
    if (!draft) return initialBank;
    if (draft.chip === 'freehit' && draft.freeHitTotalBudget != null) {
      const squadCost = displaySquad.reduce((sum, p) => sum + p.nowCost, 0);
      return draft.freeHitTotalBudget - squadCost;
    }
    if (draft.chip === 'freehit' || draft.chip === 'wildcard') {
      const squadValue = originalSquad.reduce(
        (sum, p) => sum + (p.sellPrice ?? p.nowCost),
        0,
      );
      const squadCost = displaySquad.reduce((sum, p) => sum + p.nowCost, 0);
      return initialBank + squadValue - squadCost;
    }
    return calcBank(initialBank, draft.swaps, allPlayerCosts);
  }, [draft, initialBank, originalSquad, displaySquad, allPlayerCosts]);
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
    ? allPoolPlayers.filter((p) => p.position === outPlayer.position)
    : [];

  const poolLookup = useMemo(() => new Map(allPoolPlayers.map((p) => [p.id, p])), [allPoolPlayers]);

  const squadPlayerIds = useMemo(() => new Set(displaySquad.map((p) => p.id)), [displaySquad]);

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
          newSwaps = d.swaps.filter(
            (s) => s.inId !== selectedPlayerId && s.outId !== selectedPlayerId
          );
        } else {
          newSwaps = d.swaps
            .map((s) => (s.inId === selectedPlayerId ? { outId: s.outId, inId: inPlayer.id } : s))
            .filter((s) => s.outId !== selectedPlayerId);
        }
      } else {
        newSwaps = [
          ...d.swaps.filter((s) => s.outId !== selectedPlayerId),
          { outId: selectedPlayerId, inId: inPlayer.id },
        ];
      }
      return { ...d, swaps: newSwaps };
    });
    setSelectedPlayerId(null);
  };

  const handleUndo = (outId: number) => {
    updateDraft((d) => ({ ...d, swaps: d.swaps.filter((s) => s.outId !== outId) }));
    if (draft?.swaps.length === 1 && draft.swaps[0].outId === outId) {
      setIsTransfersOpen(false);
    }
  };

  const handleReset = () => {
    setAiSuggestedPlayers([]);
    setPlanChip(initialChip);
    updateDraft((d) => ({
      ...d,
      swaps: [],
      subs: [],
      chip: (initialChip === 'wildcard' || initialChip === 'freehit') ? initialChip : 'none',
    }));
  };

  const handleSave = () => {
    if (!draft || isDemoMode) return;
    void draftRepo.save(draft).then(() => setIsDirty(false));
  };

  const handleAiFreeHit = useCallback(async () => {
    if (nextGw === null) return;
    setIsAiLoading(true);
    try {
      const res = await fetch(`/api/squad/${teamId}/free-hit-suggest?gw=${nextGw}`);
      if (!res.ok) throw new Error('request failed');
      const data = (await res.json()) as {
        orderedSquad: number[];
        players: Array<{ id: number; position: PlayerPosition; nowCost: number }>;
        totalBudget: number;
        remainingBudget: number;
      };
      if (data.orderedSquad.length !== 15) throw new Error('incomplete squad');
      setAiSuggestedPlayers(data.players);
      const pool = augmentPoolWithSuggested(allPoolPlayers, data.players);
      const positionById = new Map(pool.map((p) => [p.id, p.position]));
      for (const p of originalSquad) {
        if (!positionById.has(p.id)) positionById.set(p.id, p.position);
      }
      const swaps = buildFreeHitSwaps(originalSquad, data.orderedSquad, positionById);
      const startersCount = squadData?.starters.length ?? 11;
      const squadAfterSwaps = applySwapsToSquad(originalSquad, swaps, pool);
      const targetSet = new Set(data.orderedSquad);
      const afterSwapIds = squadIdsAfterSwaps(originalSquad, swaps, pool);
      if (afterSwapIds.size !== 15 || [...targetSet].some((id) => !afterSwapIds.has(id))) {
        throw new Error('incomplete swaps');
      }
      const subs = buildFreeHitSubs(squadAfterSwaps, data.orderedSquad, startersCount);
      if (swaps.length === 0 && subs.length === 0) {
        setToast(interpolate(copy.aiFreehitNoGain, { gw: String(nextGw) }));
      } else {
        setPlanChip('freehit');
        updateDraft((d) => ({
          ...d,
          chip: 'freehit',
          swaps,
          subs,
          freeHitTotalBudget: data.totalBudget,
        }));
      }
    } catch {
      setToast(copy.aiFreehitError);
    } finally {
      setIsAiLoading(false);
    }
  }, [teamId, nextGw, updateDraft, originalSquad, allPoolPlayers, squadData]);

  const handleChipToggle = (chip: PlanChip) => {
    setPlanChip((prev) => {
      const next = prev === chip ? 'none' : chip;
      if (next === 'wildcard' || next === 'freehit' || next === 'none') {
        updateDraft((d) => ({ ...d, chip: next as TransferChip }));
      } else {
        updateDraft((d) => ({ ...d, chip: 'none' }));
      }
      return next;
    });
  };

  const isLoading = squadLoading || poolLoading || !draftReady || !draft;
  const hasNoSquad = !isLoading && !squadError && !squadData;

  useEffect(() => {
    if (isLoading || squadError || !squadData || displaySquad.length === 0) return;
    if (upsellRequestedRef.current) return;
    upsellRequestedRef.current = true;
    requestPremiumUpsell('transfer');
  }, [isLoading, squadError, squadData, displaySquad.length, requestPremiumUpsell]);

  const handleCloseTour = () => {
    setShowTour(false);
    setIsTransfersOpen(false);
    localStorage.setItem('fpl_tour_seen_transfer_v1', 'true');
  };

  const handleTourStepChange = (_step: number) => {
    setIsTransfersOpen(false);
  };

  return (
    <div className={`${styles.screen}${showTour ? ` ${styles.screen_tourOpen}` : ''}`}>
      <TeamNavDrawer
        teamId={teamId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navLinksMode={navLinksMode}
      />

      {draft && (
          <TransferHeader
            bank={currentBank}
            freeTransfers={draft.freeTransfers}
            cost={transferCost}
            planChip={planChip}
            chipStatuses={squadData?.chipStatuses ?? DEFAULT_CHIP_STATUSES}
            nextGw={nextGw}
            onMenuOpen={() => setDrawerOpen(true)}
            onChipToggle={handleChipToggle}
            onHelp={() => setShowTour(true)}
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
              onSubCancel={cancelSub}
            />
          </div>

          <TransferActionBar
            onOpenTransfers={() => setIsTransfersOpen(true)}
            onReset={handleReset}
            onSave={handleSave}
            onAiFreeHit={() => { void handleAiFreeHit(); }}
            hasSwaps={(draft?.swaps.length ?? 0) > 0}
            hasChanges={(draft?.swaps.length ?? 0) > 0 || (draft?.subs.length ?? 0) > 0 || planChip !== initialChip}
            isDirty={isDirty}
            isAiLoading={isAiLoading}
            freehitAvailable={squadData?.chipStatuses.freehit.status === 'available'}
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
          targetGw={nextGw}
          onSelect={handleSelectReplacement}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}

      {draft && (
        <BottomSheet
          open={isTransfersOpen}
          onClose={() => setIsTransfersOpen(false)}
          title={copy.transfersPendingTitle}
        >
          <SwapsStrip
            swaps={draft.swaps}
            nameMap={nameMap}
            costMap={costMap}
            freeTransfers={draft.freeTransfers}
            onUndo={handleUndo}
            hideTitle={true}
          />
        </BottomSheet>
      )}

      <HelpTour open={showTour} onClose={handleCloseTour} onStepChange={handleTourStepChange} />
    </div>
  );
};

TransferScreen.displayName = 'TransferScreen';
