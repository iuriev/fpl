/**
 * Squad screen — placeholder.
 * To be implemented in Phase 2.
 */

import React from 'react';

export interface SquadScreenProps {
  teamId: number;
}

export const SquadScreen: React.FC<SquadScreenProps> = ({ teamId }) => {
  return <div>Squad Screen (teamId: {teamId}) — to be implemented</div>;
};

SquadScreen.displayName = 'SquadScreen';
