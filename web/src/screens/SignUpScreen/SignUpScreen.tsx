import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authClient, AuthError } from '@/auth/auth-client';
import { useCurrentUser } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { copy } from '@/lib/copy';

import styles from './SignUpScreen.module.css';

export const SignUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { refetch } = useCurrentUser();

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
      await refetch();
      navigate('/', { replace: true });
    } catch (err) {
      const authErr = err as AuthError;
      setError(authErr.message || 'Sign up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = () => {
    window.location.href = `/api/auth/sign-in/social/google?callbackURL=${window.location.origin}/`;
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
          <a href="/sign-in" className={styles.link}>
            {copy.signUpSignIn || 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
};

SignUpScreen.displayName = 'SignUpScreen';
