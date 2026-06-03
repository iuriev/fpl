import React from 'react';

import { copy } from '@/lib/copy';
import { readDonationUrl } from '@/lib/donation/readDonationUrl';

import styles from './DonationBanner.module.css';

export const DonationBanner: React.FC = () => {
  const url = readDonationUrl();
  if (!url) return null;

  return (
    <a
      className={styles.banner}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={copy.donationBannerTitle}
    >
      <span className={styles.inner}>
        <span className={styles.title}>{copy.donationBannerTitle}</span>
        <span className={styles.subtitle}>{copy.donationBannerSubtitle}</span>
      </span>
    </a>
  );
};

DonationBanner.displayName = 'DonationBanner';
