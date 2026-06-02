import React, { useState } from 'react';

import { api } from '@/api/client';
import { copy, interpolate } from '@/lib/copy';
import { useWatchlistRepository } from '@/lib/watchlist-repository';

import styles from './WatchlistScreen.module.css';

type Phase = 'idle' | 'validating' | 'preview' | 'error';

export interface AddManagerInputProps {
  onAdded: () => void;
  onLimitReached: () => void;
}

export const AddManagerInput: React.FC<AddManagerInputProps> = ({ onAdded, onLimitReached }) => {
  const repo = useWatchlistRepository();
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<{ id: number; name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(input.trim(), 10);
    if (!id || id <= 0) {
      setErrorMsg(copy.watchlistAddErrorNotFound);
      setPhase('error');
      return;
    }

    setPhase('validating');
    setErrorMsg('');

    try {
      const entry = await api.getEntry(id);
      setPreview({ id, name: `${entry.managerName} (${entry.teamName})` });
      setPhase('preview');
    } catch {
      setErrorMsg(copy.watchlistAddErrorNotFound);
      setPhase('error');
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;
    const result = await repo.add(preview.id);
    if (result === 'ok') {
      setInput('');
      setPhase('idle');
      setPreview(null);
      onAdded();
    } else if (result === 'duplicate') {
      setErrorMsg(copy.watchlistAddDuplicate);
      setPhase('error');
      setPreview(null);
    } else {
      setPhase('idle');
      setPreview(null);
      onLimitReached();
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setPhase('idle');
  };

  return (
    <div className={styles.addSection}>
      <form className={styles.addForm} onSubmit={handleSubmit}>
        <input
          className={styles.addInput}
          type="text"
          inputMode="numeric"
          value={input}
          onChange={(e) => { setInput(e.target.value); setPhase('idle'); setErrorMsg(''); }}
          placeholder={copy.watchlistAddInputPlaceholder}
          aria-label={copy.watchlistAddInputPlaceholder}
          disabled={phase === 'validating' || phase === 'preview'}
        />
        <button
          className={styles.addBtn}
          type="submit"
          disabled={phase === 'validating' || phase === 'preview' || !input.trim()}
        >
          {phase === 'validating' ? copy.watchlistAddValidating : copy.watchlistAddButton}
        </button>
      </form>

      {phase === 'preview' && preview && (
        <div className={styles.addPreview}>
          <span>{interpolate(copy.watchlistAddConfirm, { name: preview.name })}</span>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            {copy.watchlistAddConfirmButton}
          </button>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            {copy.watchlistAddCancelButton}
          </button>
        </div>
      )}

      {phase === 'error' && errorMsg && (
        <p className={styles.addError} role="alert">{errorMsg}</p>
      )}
    </div>
  );
};

AddManagerInput.displayName = 'AddManagerInput';
