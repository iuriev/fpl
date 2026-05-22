import React from 'react';

import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'link' | 'pill';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', disabled = false, loading = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={styles[variant]}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
