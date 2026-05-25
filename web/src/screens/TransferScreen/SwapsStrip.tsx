import React from 'react';
import { copy, interpolate } from '@/lib/copy';
import type { TransferSwap } from '@/types';
import styles from './SwapsStrip.module.css';

export interface SwapsStripProps {
  swaps: TransferSwap[];
  nameMap: Map<number, string>;
  costMap: Map<number, number>;
  freeTransfers: number;
  onUndo: (outId: number) => void;
}

function formatDelta(outCost: number, inCost: number): string {
  const delta = inCost - outCost;
  const sign = delta >= 0 ? '+' : '-';
  return `${sign}£${(Math.abs(delta) / 10).toFixed(1)}m`;
}

export const SwapsStrip: React.FC<SwapsStripProps> = ({
  swaps,
  nameMap,
  costMap,
  freeTransfers,
  onUndo,
}) => {
  const overLimit = Math.max(0, swaps.length - freeTransfers);
  const labelVariant =
    swaps.length === 0 ? 'neutral' : overLimit === 0 ? 'green' : overLimit === 1 ? 'amber' : 'red';

  return (
    <div className={styles.strip}>
      <div className={`${styles.header} ${styles[`header_${labelVariant}`]}`}>
        <span className={styles.title}>{copy.transfersPendingTitle}</span>
        {swaps.length > 0 && (
          <span className={styles.count}>
            {interpolate(copy.transfersNFree, { n: swaps.length, m: freeTransfers })}
          </span>
        )}
      </div>

      {swaps.length === 0 ? (
        <p className={styles.empty}>{copy.transfersPendingEmpty}</p>
      ) : (
        <ul className={styles.list}>
          {swaps.map((swap) => {
            const outName = nameMap.get(swap.outId) ?? '?';
            const inName = nameMap.get(swap.inId) ?? '?';
            const outCost = costMap.get(swap.outId) ?? 0;
            const inCost = costMap.get(swap.inId) ?? 0;
            return (
              <li key={swap.outId} className={styles.row}>
                <span className={styles.outName}>{outName}</span>
                <span className={styles.arrow} aria-hidden="true">→</span>
                <span className={styles.inName}>{inName}</span>
                <span className={styles.delta}>{formatDelta(outCost, inCost)}</span>
                <button
                  className={styles.undoBtn}
                  onClick={() => onUndo(swap.outId)}
                  aria-label={`${copy.transfersUndoSwap} ${outName} → ${inName}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

SwapsStrip.displayName = 'SwapsStrip';
