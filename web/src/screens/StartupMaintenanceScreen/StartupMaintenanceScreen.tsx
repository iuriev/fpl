import { copy } from '@/lib/copy';
import { startupProgressPercent } from '@/lib/startup-readiness/startup-progress';
import { useStartupReadiness } from '@/lib/startup-readiness/StartupReadinessContext';

import styles from './StartupMaintenanceScreen.module.css';

export function StartupMaintenanceScreen() {
  const { health } = useStartupReadiness();
  const progress = startupProgressPercent(health);

  return (
    <main className={styles.page} aria-busy="true">
      <div className={styles.content}>
        <p className={styles.eyebrow}>{copy.appTitle}</p>
        <h1 className={styles.title}>{copy.startupMaintenanceTitle}</h1>
        <p className={styles.body}>{copy.startupMaintenanceBody}</p>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label={copy.startupMaintenanceProgressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress ?? undefined}
          aria-valuetext={progress != null ? `${progress}%` : undefined}
        >
          <div
            className={progress != null ? styles.progressFill : styles.progressIndeterminate}
            style={progress != null ? { width: `${progress}%` } : undefined}
          />
        </div>
      </div>
    </main>
  );
}

StartupMaintenanceScreen.displayName = 'StartupMaintenanceScreen';
