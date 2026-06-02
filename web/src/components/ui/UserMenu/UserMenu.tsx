import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { authClient } from '@/auth/auth-client';
import { useCurrentUser } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button/Button';

import styles from './UserMenu.module.css';

export const UserMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, refetch } = useCurrentUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) return null;

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

  const displayName = user.name || user.email;

  return (
    <div className={styles.container}>
      <div className={styles.userInfo}>
        <div className={styles.avatar}>{displayName.charAt(0).toUpperCase()}</div>
        <div className={styles.name}>{displayName}</div>
      </div>
      <Button variant="secondary" onClick={handleSignOut} disabled={isSigningOut}>
        Sign out
      </Button>
    </div>
  );
};

UserMenu.displayName = 'UserMenu';
