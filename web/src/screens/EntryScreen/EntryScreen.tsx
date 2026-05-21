/**
 * Entry screen — team ID input and validation.
 * States: idle, invalid, submitting, not-found, unreachable, success.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components';
import { copy } from '@/lib/copy';
import { api, ApiError } from '@/api/client';
import styles from './EntryScreen.module.css';

export interface EntryScreenProps {
  onSubmit?: (teamId: number) => void;
  /**
   * Story demo only: pre-populate error state for visual testing.
   * Not used in production.
   */
  _storyError?: string | null;
  /**
   * Story demo only: pre-populate input value for visual testing.
   * Not used in production.
   */
  _storyInputValue?: string;
  /**
   * Story demo only: simulate submitting state for visual testing.
   * Not used in production.
   */
  _storyIsSubmitting?: boolean;
}

export const EntryScreen: React.FC<EntryScreenProps> = ({
  onSubmit,
  _storyError,
  _storyInputValue,
  _storyIsSubmitting,
}) => {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState(_storyInputValue ?? '');
  const [error, setError] = useState<string | null>(_storyError ?? null);
  const [isSubmitting, setIsSubmitting] = useState(_storyIsSubmitting ?? false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTeamId(value);
    // Clear error on input change
    if (error) setError(null);
  };

  const validateInput = (value: string): boolean => {
    if (!value.trim()) {
      setError(copy.entryErrorEmpty);
      return false;
    }

    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) {
      setError(copy.entryErrorInvalid);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateInput(teamId)) {
      return;
    }

    const id = Number(teamId);
    setIsSubmitting(true);

    try {
      await api.getEntry(id);

      if (onSubmit) {
        onSubmit(id);
      } else {
        navigate(`/?teamId=${id}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 'not-found') {
          setError(copy.entryErrorNotFound);
        } else if (err.statusCode === 'unreachable') {
          setError(copy.entryErrorUnreachable);
        } else {
          setError(copy.entryErrorUnreachable);
        }
      } else {
        setError(copy.entryErrorUnreachable);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.headline}>{copy.entryHeadline}</h1>
        <p className={styles.subtitle}>{copy.appSubtitle}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            id="team-id"
            type="text"
            inputMode="numeric"
            placeholder={copy.entryInputPlaceholder}
            label={copy.entryInputLabel}
            value={teamId}
            onChange={handleInputChange}
            disabled={isSubmitting}
            error={error || undefined}
          />

          <Button type="submit" disabled={!teamId.trim() || isSubmitting} loading={isSubmitting}>
            {copy.entrySubmit}
          </Button>
        </form>

        <p className={styles.helper}>{copy.entryHelper}</p>
      </div>
    </div>
  );
};

EntryScreen.displayName = 'EntryScreen';
