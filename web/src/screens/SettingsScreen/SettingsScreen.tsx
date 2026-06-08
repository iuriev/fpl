import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authClient } from '@/auth/auth-client';
import { useCurrentUser } from '@/auth/AuthContext';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { copy } from '@/lib/copy';
import { useMyTeam } from '@/lib/my-team/MyTeamContext';

import styles from './SettingsScreen.module.css';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, refetch } = useCurrentUser();
  const { myTeamId, isDemoMode } = useMyTeam();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      await refetch();
      navigate('/', { replace: true });
    } catch {
      setIsSigningOut(false);
    }
  };

  const showAccount = Boolean(user) && !isDemoMode;
  const userInitial = user ? (user.name || user.email).charAt(0).toUpperCase() : '';

  return (
    <div className={styles.screen}>
      <ScreenHeader
        title={copy.settingsTitle}
        backTo="/"
        backLabel={copy.settingsBack}
      />

      <main className={styles.content}>
        {showAccount && user && (
          <section className={styles.accountSection} aria-label={copy.settingsAccountLabel}>
            <div className={styles.accountRow}>
              <div className={styles.userAvatar} aria-hidden="true">
                {userInitial}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name || user.email}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
              <button
                type="button"
                className={styles.signOutBtn}
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {copy.drawerSignOut}
              </button>
            </div>
            {myTeamId !== null && (
              <div className={styles.accountRow}>
                <div className={styles.teamBadge} aria-hidden="true">
                  #
                </div>
                <div className={styles.teamInfo}>
                  <span className={styles.teamIdLabel}>{copy.settingsTeamLabel}</span>
                  <span className={styles.teamIdNumber}>{myTeamId}</span>
                </div>
                <button
                  type="button"
                  className={styles.changeTeamBtn}
                  onClick={() => navigate('/entry')}
                >
                  {copy.drawerChangeTeam}
                </button>
              </div>
            )}
          </section>
        )}

        <section className={styles.section} aria-labelledby="settings-about-heading">
          <h2 id="settings-about-heading" className={styles.sectionTitle}>
            {copy.settingsAboutTitle}
          </h2>
          <p className={styles.body}>{copy.settingsAboutBody}</p>
        </section>

        <section className={styles.section} aria-labelledby="settings-contact-heading">
          <h2 id="settings-contact-heading" className={styles.sectionTitle}>
            {copy.settingsContactTitle}
          </h2>
          <a className={styles.contactLink} href={`mailto:${copy.settingsContactEmail}`}>
            {copy.settingsContactEmail}
          </a>
        </section>

      </main>
    </div>
  );
};

SettingsScreen.displayName = 'SettingsScreen';
