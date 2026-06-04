import React from 'react';

import { BottomSheet } from '@/components/ui/BottomSheet/BottomSheet';
import { copy } from '@/lib/copy';

import fixtureStyles from './FixtureCell.module.css';
import styles from './FixturesCalendarHelpSheet.module.css';

const FDR_LEGEND: { level: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { level: 1, label: copy.fixturesCalendarHelpFdr1 },
  { level: 2, label: copy.fixturesCalendarHelpFdr2 },
  { level: 3, label: copy.fixturesCalendarHelpFdr3 },
  { level: 4, label: copy.fixturesCalendarHelpFdr4 },
  { level: 5, label: copy.fixturesCalendarHelpFdr5 },
];

const REST_LEGEND: { className: string; sample: string; label: string }[] = [
  { className: fixtureStyles.restTight, sample: '2d', label: copy.fixturesCalendarHelpRestTight },
  {
    className: fixtureStyles.restModerate,
    sample: '5d',
    label: copy.fixturesCalendarHelpRestModerate,
  },
  { className: fixtureStyles.restEasy, sample: '8d', label: copy.fixturesCalendarHelpRestEasy },
  {
    className: fixtureStyles.restTbc,
    sample: copy.fixturesCalendarRestDaysTbc,
    label: copy.fixturesCalendarHelpRestTbc,
  },
];

const TAB_ITEMS = [
  copy.fixturesCalendarHelpTabOfficial,
  copy.fixturesCalendarHelpTabOverall,
  copy.fixturesCalendarHelpTabDefensive,
  copy.fixturesCalendarHelpTabAttacking,
  copy.fixturesCalendarHelpTabRestDays,
];

export interface FixturesCalendarHelpSheetProps {
  open: boolean;
  onClose: () => void;
}

export const FixturesCalendarHelpSheet: React.FC<FixturesCalendarHelpSheetProps> = ({
  open,
  onClose,
}) => (
  <BottomSheet open={open} onClose={onClose} title={copy.fixturesCalendarHelpTitle}>
    <div className={styles.body}>
      <section className={styles.section}>
        <p className={styles.text}>{copy.fixturesCalendarHelpIntro}</p>
        <p className={styles.text}>{copy.fixturesCalendarHelpCell}</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{copy.fixturesCalendarHelpTabsHeading}</h3>
        <ul className={styles.list}>
          {TAB_ITEMS.map((item) => (
            <li key={item} className={styles.listItem}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{copy.fixturesCalendarHelpSpecialHeading}</h3>
        <ul className={styles.list}>
          <li className={styles.listItem}>{copy.fixturesCalendarHelpDgw}</li>
          <li className={styles.listItem}>{copy.fixturesCalendarHelpBgw}</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{copy.fixturesCalendarHelpFdrHeading}</h3>
        <div className={styles.legend}>
          {FDR_LEGEND.map(({ level, label }) => (
            <div key={level} className={styles.legendRow}>
              <span
                className={`${fixtureStyles.chip} ${fixtureStyles[`fdr${level}`]} ${styles.swatch}`}
                aria-hidden="true"
              >
                {level}
              </span>
              <span className={styles.legendLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.heading}>{copy.fixturesCalendarHelpRestHeading}</h3>
        <div className={styles.legend}>
          {REST_LEGEND.map(({ className, sample, label }) => (
            <div key={label} className={styles.legendRow}>
              <span className={`${fixtureStyles.chip} ${className} ${styles.swatch}`} aria-hidden="true">
                {sample}
              </span>
              <span className={styles.legendLabel}>{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  </BottomSheet>
);

FixturesCalendarHelpSheet.displayName = 'FixturesCalendarHelpSheet';
