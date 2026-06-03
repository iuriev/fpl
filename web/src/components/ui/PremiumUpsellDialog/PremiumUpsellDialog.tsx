import React, { useEffect, useId, useRef } from 'react';

import { Button } from '@/components/ui/Button/Button';
import { copy } from '@/lib/copy';
import type { PremiumUpsellScreen } from '@/lib/premium-upsell/PremiumUpsellContext';

import styles from './PremiumUpsellDialog.module.css';

export interface PremiumUpsellDialogProps {
  open: boolean;
  variant: PremiumUpsellScreen;
  onClose: () => void;
}

function variantCopy(variant: PremiumUpsellScreen) {
  if (variant === 'predictions') {
    return {
      title: copy.premiumUpsellPredictionsTitle,
      lead: copy.premiumUpsellPredictionsLead,
      benefits: [
        copy.premiumUpsellPredictionsBenefit1,
        copy.premiumUpsellPredictionsBenefit2,
        copy.premiumUpsellPredictionsBenefit3,
      ],
      premium: copy.premiumUpsellTransferPremium,
    };
  }
  return {
    title: copy.premiumUpsellTransferTitle,
    lead: copy.premiumUpsellTransferLead,
    benefits: [
      copy.premiumUpsellTransferBenefit1,
      copy.premiumUpsellTransferBenefit2,
      copy.premiumUpsellTransferBenefit3,
    ],
    premium: copy.premiumUpsellTransferPremium,
  };
}

export const PremiumUpsellDialog: React.FC<PremiumUpsellDialogProps> = ({
  open,
  variant,
  onClose,
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const leadId = useId();
  const text = variantCopy(variant);

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

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={leadId}
      onClick={handleBackdropClick}
    >
      <div className={styles.content}>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={onClose}
          aria-label={copy.premiumUpsellClose}
        >
          ✕
        </button>
        <span className={styles.icon} aria-hidden="true">
          ⭐
        </span>
        <h2 id={titleId} className={styles.title}>
          {text.title}
        </h2>
        <p id={leadId} className={styles.lead}>
          {text.lead}
        </p>
        <ul className={styles.benefits}>
          {text.benefits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className={styles.tierPremium}>{text.premium}</p>
        <div className={styles.actions}>
          <Button onClick={onClose}>{copy.premiumUpsellCta}</Button>
          <button type="button" className={styles.laterBtn} onClick={onClose}>
            {copy.premiumUpsellDismiss}
          </button>
        </div>
      </div>
    </dialog>
  );
};

PremiumUpsellDialog.displayName = 'PremiumUpsellDialog';
