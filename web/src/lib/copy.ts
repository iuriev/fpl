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
  entryHeadlineLine1: 'Your squad.',
  entryHeadlineAccent: 'Every gameweek.',
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
  squadEmptyHeading: 'No squad yet',
  squadEmptySubtext: 'No squad available for Gameweek {GW}. Use the arrows to jump to a later gameweek.',
  squadJumpToCurrent: 'Jump to current GW →',
  squadNotFound: "We couldn't find a team with that ID. Please check and try again.",

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

  // View toggle
  viewPitch: 'Pitch',
  viewList: 'List',
  viewToggleLabel: 'View mode',

  // List view section headers
  listGroupGK: 'Goalkeeper',
  listGroupDEF: 'Defenders',
  listGroupMID: 'Midfielders',
  listGroupFWD: 'Forwards',
  listGroupBench: 'Bench',

  // List view column headers
  listColPts: 'Pts',
  listColMP: 'MP',
  listColGS: 'GS',
  listColA: 'A',
  listColCS: 'CS',
  listColGC: 'GC',
  listColOG: 'OG',
  listColPS: 'PS',
  listColPM: 'PM',
  listColYC: 'YC',
  listColRC: 'RC',
  listColS: 'S',
  listColBonus: 'Bonus',

  // List view column legend (full names)
  listLegendHeading: 'Key',
  listLegendPts: 'Points',
  listLegendMP: 'Minutes played',
  listLegendGS: 'Goals scored',
  listLegendA: 'Assists',
  listLegendCS: 'Clean sheets',
  listLegendGC: 'Goals conceded',
  listLegendOG: 'Own goals',
  listLegendPS: 'Penalties saved',
  listLegendPM: 'Penalties missed',
  listLegendYC: 'Yellow cards',
  listLegendRC: 'Red cards',
  listLegendS: 'Saves',
  listLegendBonus: 'Bonus points',
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
