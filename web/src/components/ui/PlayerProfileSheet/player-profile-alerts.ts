import { copy } from '@/lib/copy';
import type { PlayerProfileLineupAlerts, PlayerProfileResponse, PlayerStatus } from '@/types';

export type AvailabilityAlertLine = {
  key: string;
  text: string;
  variant: 'warn' | 'error' | 'info';
};

function fplStatusLabel(status: PlayerStatus): string {
  const labels: Partial<Record<PlayerStatus, string>> = {
    d: copy.statusDoubtful,
    i: copy.statusInjured,
    s: copy.statusSuspended,
    u: copy.statusUnavailable,
    n: copy.statusUnavailable,
  };
  return labels[status] ?? '';
}

function fplStatusVariant(status: PlayerStatus): 'warn' | 'error' | null {
  if (status === 'd') return 'warn';
  if (status === 'i' || status === 's' || status === 'u' || status === 'n') return 'error';
  return null;
}

export function buildAvailabilityAlerts(
  player: PlayerProfileResponse['player'],
  lineupAlerts?: PlayerProfileLineupAlerts
): AvailabilityAlertLine[] {
  const lines: AvailabilityAlertLine[] = [];

  if (lineupAlerts?.injuryWarning) {
    lines.push({
      key: 'lineup-injury',
      text: copy.predictedLineupsInjuryWarning,
      variant: 'warn',
    });
  }

  if (lineupAlerts?.benchRisk) {
    lines.push({
      key: 'lineup-bench',
      text: copy.predictedLineupsBenchRisk,
      variant: 'warn',
    });
  }

  if (!lineupAlerts?.injuryWarning && player.status !== 'a') {
    const label = fplStatusLabel(player.status);
    const variant = fplStatusVariant(player.status);
    if (label && variant) {
      lines.push({ key: 'fpl-status', text: label, variant });
    }
  }

  const chance = lineupAlerts?.chanceOfPlaying;
  if (chance != null && player.status !== 'a') {
    lines.push({
      key: 'chance',
      text: `${chance}% chance of playing`,
      variant: 'info',
    });
  }

  const news = player.news.trim();
  if (news) {
    lines.push({ key: 'news', text: news, variant: 'info' });
  }

  return lines;
}
