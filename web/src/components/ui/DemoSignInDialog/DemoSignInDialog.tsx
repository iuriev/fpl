import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button/Button';
import { copy } from '@/lib/copy';

import styles from './DemoSignInDialog.module.css';

export interface DemoSignInDialogProps {
  open: boolean;
  onClose: () => void;
}

export const DemoSignInDialog: React.FC<DemoSignInDialogProps> = ({ open, onClose }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose();
  };

  const handleSignIn = () => {
    onClose();
    navigate('/sign-in');
  };

  const handleSignUp = () => {
    onClose();
    navigate('/sign-up');
  };

  return (
    <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick}>
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">🔒</span>
        <h2 className={styles.title}>{copy.demoGateTitle}</h2>
        <p className={styles.body}>{copy.demoGateBody}</p>
        <div className={styles.actions}>
          <Button onClick={handleSignIn}>{copy.demoGateSignIn}</Button>
          <Button variant="secondary" onClick={handleSignUp}>{copy.demoGateSignUp}</Button>
        </div>
        <button type="button" className={styles.dismissBtn} onClick={onClose} aria-label={copy.demoGateDismiss}>
          ✕
        </button>
      </div>
    </dialog>
  );
};

DemoSignInDialog.displayName = 'DemoSignInDialog';
