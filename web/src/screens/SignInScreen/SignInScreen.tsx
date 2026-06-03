import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { authClient, AuthError } from '@/auth/auth-client';
import { useCurrentUser } from '@/auth/AuthContext';
import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { copy } from '@/lib/copy';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';

import styles from './SignInScreen.module.css';

interface LocationState {
  returnTo?: string;
  verificationSent?: boolean;
  verificationEmail?: string;
  passwordReset?: boolean;
}

export const SignInScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refetch } = useCurrentUser();
  const { clearDemoMode } = useMyTeam();

  const locationState = location.state as LocationState | null;
  const passwordResetSuccess = locationState?.passwordReset ?? false;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(locationState?.verificationSent ?? false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const sheetEmail = locationState?.verificationEmail ?? '';

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const emailEl = emailRef.current;
    const passwordEl = passwordRef.current;

    const onEmailAutofill = (e: AnimationEvent) => {
      const val = (e.target as HTMLInputElement).value;
      if (val) setEmail(val);
    };
    const onPasswordAutofill = (e: AnimationEvent) => {
      const val = (e.target as HTMLInputElement).value;
      if (val) setPassword(val);
    };

    emailEl?.addEventListener('animationstart', onEmailAutofill);
    passwordEl?.addEventListener('animationstart', onPasswordAutofill);

    // Fallback: animationstart doesn't fire reliably in all Chrome versions.
    // Read DOM values directly after a short delay to catch autofill that
    // happened without triggering the CSS animation.
    const timer = setTimeout(() => {
      if (emailRef.current?.value) setEmail(emailRef.current.value);
      if (passwordRef.current?.value) setPassword(passwordRef.current.value);
    }, 500);

    return () => {
      emailEl?.removeEventListener('animationstart', onEmailAutofill);
      passwordEl?.removeEventListener('animationstart', onPasswordAutofill);
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // DOM .value reflects browser autofill even when React state lags behind
    const emailValue = emailRef.current?.value || email || '';
    const passwordValue = passwordRef.current?.value || password || '';
    if (!emailValue.trim() || !passwordValue.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await authClient.signIn(emailValue, passwordValue);
      clearDemoMode();
      await refetch();
      const returnTo = locationState?.returnTo || '/';
      navigate(returnTo, { replace: true });
    } catch (err) {
      const authErr = err as AuthError;
      const isUnverified =
        authErr.statusCode === 403 ||
        authErr.message?.toLowerCase().includes('verif');
      setError(isUnverified ? copy.signInUnverifiedEmailError : (authErr.message || 'Sign in failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendError(null);
    setResendSent(false);
    try {
      const res = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sheetEmail }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setResendError((body as { message?: string }).message || 'Failed to resend');
      } else {
        setResendSent(true);
      }
    } catch {
      setResendError('Network error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const res = await fetch('/api/auth/sign-in/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'google', callbackURL: `${window.location.origin}/` }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const handleTryDemo = () => {
    navigate('/entry', { state: { demo: true } });
  };

  return (
    <>
    <BottomSheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      title={copy.verifyEmailHeadline}
    >
      <div className={styles.verifySheetBody}>
        <p className={styles.verifySheetText}>
          We sent a verification link to <strong>{sheetEmail}</strong>. Open it to activate your account.
        </p>
        {resendError && <p className={styles.errorMessage}>{resendError}</p>}
        {resendSent && <p className={styles.successMessage}>{copy.verifyEmailResent}</p>}
        <Button className={styles.verifySheetBtn} onClick={handleResend} disabled={resendLoading} loading={resendLoading}>
          {copy.verifyEmailResend}
        </Button>
        <a href="/sign-up" className={styles.verifySheetFooterLink}>{copy.verifyEmailWrongEmail}</a>
      </div>
    </BottomSheet>
    <div className={styles.container}>
      <div className={styles.content}>
        {passwordResetSuccess && (
          <div className={styles.successMessage}>{copy.signInPasswordResetBanner}</div>
        )}
        <h1 className={styles.headline}>
          {copy.signInHeadline || 'Sign In'}
        </h1>
        <p className={styles.subtitle}>{copy.signInSubtitle || 'Access your FPL dashboard'}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            ref={emailRef}
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
            disabled={isSubmitting}
            required
          />

          <Input
            ref={passwordRef}
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
            disabled={isSubmitting}
            showPasswordToggle
            required
          />

          {error && <div className={styles.errorMessage}>{error}</div>}

          <Button type="submit" variant="secondary" disabled={isSubmitting} loading={isSubmitting}>
            {copy.signInSubmit || 'Sign In'}
          </Button>
        </form>

        <Link to="/forgot-password" className={styles.forgotLink}>
          {copy.signInForgotPassword}
        </Link>

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
          <Link to="/sign-up" viewTransition className={styles.link}>
            {copy.signInSignUp || 'Sign up'}
          </Link>
        </p>
      </div>
    </div>
    </>
  );
};

SignInScreen.displayName = 'SignInScreen';
