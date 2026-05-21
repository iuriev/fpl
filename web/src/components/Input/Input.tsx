/**
 * Input component.
 * Mono value, height 56, radius 12.
 * Error state: red border + soft red glow + tinted value.
 * All values via CSS variables.
 */

import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          className={`${styles.input} ${error ? styles.hasError : ''} ${className || ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
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
