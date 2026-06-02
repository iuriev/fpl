import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { authClient, AuthError } from '@/auth/auth-client';
import { useCurrentUser } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { copy } from '@/lib/copy';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';

import styles from './SignInScreen.module.css';

interface LocationState {
  returnTo?: string;
}

export const SignInScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refetch } = useCurrentUser();
  const { clearDemoMode } = useMyTeam();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authClient.signIn(email, password);
      clearDemoMode();
      await refetch();
      const returnTo = (location.state as LocationState)?.returnTo || '/';
      navigate(returnTo, { replace: true });
    } catch (err) {
      const authErr = err as AuthError;
      setError(authErr.message || 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `/api/auth/sign-in/social/google?callbackURL=${window.location.origin}/`;
  };

  const handleTryDemo = () => {
    navigate('/entry', { state: { demo: true } });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.headline}>
          {copy.signInHeadline || 'Sign In'}
        </h1>
        <p className={styles.subtitle}>{copy.signInSubtitle || 'Access your FPL dashboard'}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="username"
            placeholder={copy.signInEmailPlaceholder || 'Email'}
            label={copy.signInEmailLabel || 'Email'}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            onAnimationStart={(e) => {
              const val = e.currentTarget.value;
              if (val) setEmail(val);
            }}
            disabled={isSubmitting}
            required
          />

          <Input
            id="current-password"
            type="password"
            name="current-password"
            autoComplete="current-password"
            placeholder={copy.signInPasswordPlaceholder || 'Password'}
            label={copy.signInPasswordLabel || 'Password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            onAnimationStart={(e) => {
              const val = e.currentTarget.value;
              if (val) setPassword(val);
            }}
            disabled={isSubmitting}
            required
          />

          {error && <div className={styles.errorMessage}>{error}</div>}

          <Button type="submit" variant="secondary" disabled={!email.trim() || !password.trim() || isSubmitting} loading={isSubmitting}>
            {copy.signInSubmit || 'Sign In'}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>{copy.signInDivider || 'or'}</span>
        </div>

        <Button variant="secondary" onClick={handleGoogleSignIn} disabled={isSubmitting}>
          {copy.signInGoogle || 'Sign in with Google'}
        </Button>

        <Button
          variant="secondary"
          className={styles.demoBtn}
          onClick={handleTryDemo}
          disabled={isSubmitting}
        >
          {copy.signInTryDemo}
        </Button>

        <p className={styles.footer}>
          {copy.signInNoAccount || "Don't have an account?"}{' '}
          <a href="/sign-up" className={styles.link}>
            {copy.signInSignUp || 'Sign up'}
          </a>
        </p>
      </div>
    </div>
  );
};

SignInScreen.displayName = 'SignInScreen';
