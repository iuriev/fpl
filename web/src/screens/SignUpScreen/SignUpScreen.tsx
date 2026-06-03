import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authClient, AuthError } from '@/auth/auth-client';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { copy } from '@/lib/copy';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';

import styles from './SignUpScreen.module.css';

export const SignUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { clearDemoMode } = useMyTeam();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authClient.signUp(email, password, name);
      clearDemoMode();
      navigate('/sign-in', { replace: true, state: { verificationSent: true, verificationEmail: email } });
    } catch (err) {
      const authErr = err as AuthError;
      setError(authErr.message || 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const res = await fetch('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'google', callbackURL: `${window.location.origin}/` }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.headline}>
          {copy.signUpHeadline || 'Create Account'}
        </h1>
        <p className={styles.subtitle}>{copy.signUpSubtitle || 'Join FPL Squad Viewer'}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            id="name"
            type="text"
            name="name"
            autoComplete="name"
            placeholder={copy.signUpNamePlaceholder || 'Your name'}
            label={copy.signUpNameLabel || 'Name'}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            required
          />

          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="username"
            placeholder={copy.signUpEmailPlaceholder || 'Email'}
            label={copy.signUpEmailLabel || 'Email'}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            required
          />

          <Input
            id="new-password"
            type="password"
            name="new-password"
            autoComplete="new-password"
            placeholder={copy.signUpPasswordPlaceholder || 'Password'}
            label={copy.signUpPasswordLabel || 'Password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            showPasswordToggle
            required
          />

          {error && <div className={styles.errorMessage}>{error}</div>}

          <Button
            type="submit"
            disabled={!name.trim() || !email.trim() || !password.trim() || isSubmitting}
            loading={isSubmitting}
          >
            {copy.signUpSubmit || 'Create Account'}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>{copy.signUpDivider || 'or'}</span>
        </div>

        <Button variant="secondary" onClick={handleGoogleSignUp} disabled={isSubmitting}>
          {copy.signUpGoogle || 'Sign up with Google'}
        </Button>

        <p className={styles.footer}>
          {copy.signUpHaveAccount || 'Already have an account?'}{' '}
          <Link to="/sign-in" viewTransition className={styles.link}>
            {copy.signUpSignIn || 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
};

SignUpScreen.displayName = 'SignUpScreen';
