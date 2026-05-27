import { useMemo, useState } from 'react';

import type { SquadPlayer, TransferDraft } from '@/types';

function isFormationValid(starters: SquadPlayer[]): boolean {
  let def = 0,
    mid = 0,
    fwd = 0;
  for (const p of starters) {
    if (p.position === 'DEF') def++;
    else if (p.position === 'MID') mid++;
    else if (p.position === 'FWD') fwd++;
  }
  return def >= 3 && def <= 5 && mid >= 2 && mid <= 5 && fwd >= 1 && fwd <= 3;
}

function computeValidTargets(
  selectedId: number,
  displayStarters: SquadPlayer[],
  displayBench: SquadPlayer[]
): Set<number> {
  const allPlayers = [...displayStarters, ...displayBench];
  const selected = allPlayers.find((p) => p.id === selectedId);
  if (!selected) return new Set();

  const selectedIsStarter = displayStarters.some((p) => p.id === selectedId);
  const candidates = selectedIsStarter ? displayBench : displayStarters;
  const valid = new Set<number>();

  for (const candidate of candidates) {
    if (selected.position === 'GK' || candidate.position === 'GK') {
      if (selected.position === 'GK' && candidate.position === 'GK') {
        valid.add(candidate.id);
      }
      continue;
    }

    const newStarters = displayStarters.map((p) => {
      if (selectedIsStarter && p.id === selected.id) return candidate;
      if (!selectedIsStarter && p.id === candidate.id) return selected;
      return p;
    });

    if (isFormationValid(newStarters)) {
      valid.add(candidate.id);
    }
  }

  return valid;
}

export function useSubMode(
  displayStarters: SquadPlayer[],
  displayBench: SquadPlayer[],
  updateDraft: (updater: (d: TransferDraft) => TransferDraft) => void
) {
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);

  const validSubTargets = useMemo(
    () =>
      selectedSubId !== null
        ? computeValidTargets(selectedSubId, displayStarters, displayBench)
        : new Set<number>(),
    [selectedSubId, displayStarters, displayBench]
  );

  const handleSubIconClick = (id: number) => {
    setSelectedSubId((prev) => (prev === id ? null : id));
  };

  const handleSubTargetClick = (targetId: number) => {
    if (selectedSubId === null) return;

    const selectedIsStarter = displayStarters.some((p) => p.id === selectedSubId);
    const fieldId = selectedIsStarter ? selectedSubId : targetId;
    const benchId = selectedIsStarter ? targetId : selectedSubId;

    updateDraft((d) => {
      const undoIdx = d.subs.findIndex((s) => s.fieldId === benchId && s.benchId === fieldId);
      if (undoIdx !== -1) {
        return { ...d, subs: d.subs.filter((_, i) => i !== undoIdx) };
      }
      return { ...d, subs: [...d.subs, { fieldId, benchId }] };
    });

    setSelectedSubId(null);
  };

  const cancelSub = () => setSelectedSubId(null);

  return { selectedSubId, validSubTargets, handleSubIconClick, handleSubTargetClick, cancelSub };
}
