import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { authClient, AuthError } from '@/auth/auth-client';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { copy } from '@/lib/copy';

import styles from './ResetPasswordScreen.module.css';

export const ResetPasswordScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError(copy.resetPasswordMismatchError);
      return;
    }

    if (!newPassword.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await authClient.resetPassword(token!, newPassword);
      navigate('/sign-in', { replace: true, state: { passwordReset: true } });
    } catch (err) {
      const authErr = err as AuthError;
      setError(authErr.message || copy.resetPasswordError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.headline}>{copy.resetPasswordHeadline}</h1>

          <div className={styles.errorMessage}>{copy.resetPasswordInvalidToken}</div>

          <Link to="/forgot-password" className={styles.link}>
            {copy.resetPasswordRequestNew}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.headline}>{copy.resetPasswordHeadline}</h1>
        <p className={styles.subtitle}>{copy.resetPasswordSubtitle}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            id="new-password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            placeholder={copy.resetPasswordNewPlaceholder}
            label={copy.resetPasswordNewLabel}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            showPasswordToggle
            required
          />

          <Input
            id="confirm-password"
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            placeholder={copy.resetPasswordConfirmPlaceholder}
            label={copy.resetPasswordConfirmLabel}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError(null);
            }}
            error={confirmPassword && newPassword !== confirmPassword ? copy.resetPasswordMismatchError : undefined}
            disabled={isSubmitting}
            showPasswordToggle
            required
          />

          {error && <div className={styles.errorMessage}>{error}</div>}

          <Button type="submit" variant="secondary" disabled={isSubmitting} loading={isSubmitting}>
            {copy.resetPasswordSubmit}
          </Button>
        </form>

        <Link to="/sign-in" className={styles.link}>
          {copy.resetPasswordBackToSignIn}
        </Link>
      </div>
    </div>
  );
};

ResetPasswordScreen.displayName = 'ResetPasswordScreen';
