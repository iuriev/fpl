import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { authClient, AuthError } from '@/auth/auth-client';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { copy, interpolate } from '@/lib/copy';

import styles from './ForgotPasswordScreen.module.css';

export const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await authClient.requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      const authErr = err as AuthError;
      setError(authErr.message || copy.forgotPasswordError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.headline}>{copy.forgotPasswordHeadline}</h1>
        <p className={styles.subtitle}>{copy.forgotPasswordSubtitle}</p>

        {!submitted ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder={copy.forgotPasswordEmailPlaceholder}
              label={copy.forgotPasswordEmailLabel}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              required
            />

            {error && <div className={styles.errorMessage}>{error}</div>}

            <Button type="submit" variant="secondary" disabled={isSubmitting} loading={isSubmitting}>
              {copy.forgotPasswordSubmit}
            </Button>
          </form>
        ) : (
          <div className={styles.successMessage}>
            {interpolate(copy.forgotPasswordSuccessMessage, { email })}
          </div>
        )}

        <Link to="/sign-in" className={styles.link}>
          {copy.forgotPasswordBackToSignIn}
        </Link>
      </div>
    </div>
  );
};

ForgotPasswordScreen.displayName = 'ForgotPasswordScreen';
