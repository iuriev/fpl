import React, { useState } from 'react';

import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, showPasswordToggle, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = showPasswordToggle && type === 'password'
      ? (showPassword ? 'text' : 'password')
      : type;

    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label} htmlFor={props.id}>{label}</label>}
        <div className={styles.inputRow}>
          <input
            ref={ref}
            className={`${styles.input} ${error ? styles.hasError : ''} ${showPasswordToggle ? styles.hasToggle : ''} ${className || ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${props.id}-error` : undefined}
            type={resolvedType}
            {...props}
          />
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              className={styles.toggleButton}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
        {error && (
          <div className={styles.error} id={`${props.id}-error`}>
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
