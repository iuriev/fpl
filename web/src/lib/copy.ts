/**
 * Centralized UI copy (English).
 * Structured for future i18n.
 * Components never inline raw strings — always use these constants.
 */

export const copy = {
  // App titles and headers
  appTitle: 'FPL Squad Viewer',
  appSubtitle: 'See your FPL squad and points - just enter your team ID',

  // Entry screen
  entryHeadline: 'Your squad. Every gameweek.',
  entryHelper: 'Find your team ID in the FPL URL: fantasy.premierleague.com/entry/{ID}/event/{GW}',
  entryInputLabel: 'Team ID',
  entryInputPlaceholder: 'Enter your team ID',
  entrySubmit: 'View squad',

  // Entry validation
  entryErrorEmpty: 'Please enter a team ID',
  entryErrorInvalid: 'Team ID must be a positive number',
  entryErrorNotFound: "We couldn't find a team with that ID. Please check and try again.",
  entryErrorUnreachable: "Couldn't reach the FPL servers. Please try again.",

  // Squad screen
  squadChangeTeam: 'Change',
  squadGameweekLabel: 'Gameweek',
  squadLoadError: "Couldn't load this gameweek",
  squadRetry: 'Try again',
  squadEmpty: 'No squad available for Gameweek {GW}',

  // Summary strip
  summaryTotal: 'TOTAL',
  summaryAverage: 'AVERAGE',
  summaryHighest: 'HIGHEST',
  summaryRank: 'RANK',
  summaryTransfers: 'TRANSFERS',
  summaryPlaceholder: '-',

  // Positions
  positionGK: 'GK',
  positionDEF: 'DEF',
  positionMID: 'MID',
  positionFWD: 'FWD',

  // Player status
  statusCaptain: 'C',
  statusViceCaptain: 'V',
  statusDoubtful: 'Doubtful',
  statusInjured: 'Injured',
  statusSuspended: 'Suspended',
  statusUnavailable: 'Unavailable',

  // Loading states
  loadingPlaceholder: 'Loading...',

  // Common actions
  closeButton: 'Close',
};

/**
 * Interpolate copy strings.
 * Usage: interpolate(copy.squadEmpty, { GW: '15' })
 */
export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/{(\w+)}/g, (_, key) => String(values[key] ?? ''));
}
