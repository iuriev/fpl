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

  // Team info panel
  teamInfoOverallPts: 'Overall pts',
  teamInfoOverallRank: 'Overall rank',
  teamInfoGwPts: 'GW pts',
  teamInfoTotalPlayers: 'Total players',
  teamInfoGwHistory: 'Gameweek History',
  teamInfoDrawerLabel: 'Team information',
  teamInfoOpenDrawer: 'Open team info',

  // Gameweek history screen
  historyTitle: 'Gameweek History',
  historyThisSeason: 'This Season',
  historyColGW: 'GW',
  historyColOR: 'OR',
  historyColOP: 'OP',
  historyColGWR: 'GWR',
  historyColGWP: 'GWP',
  historyColPB: 'PB',
  historyColTM: 'TM',
  historyColTC: 'TC',
  historyColValue: '£m',
  historyEmpty: 'No gameweeks played yet',
  historyLoadError: "Couldn't load gameweek history",
  historyRetry: 'Try again',
  historyBack: 'Squad',

  // Leagues stats screen
  statsTitle: 'My Stats',
  statsBack: 'Squad',
  statsGeneralLeagues: 'General Leagues',
  statsH2HLeagues: 'Head-to-Head Leagues',
  statsNoLeagues: 'No leagues found',
  statsLoadError: "Couldn't load league standings",
  statsRetry: 'Try again',
  statsMyStats: 'My Stats',

  // Dream Team screen
  dreamTeamTitle: 'Dream Team',
  dreamTeamBack: 'Squad',
  dreamTeamLoadError: "Couldn't load the Dream Team",
  dreamTeamRetry: 'Try again',
  dreamTeamNotAvailable: 'Dream Team not available yet for this gameweek',
  dreamTeamNavLink: 'Dream Team',

  // Top Players screen
  topPlayersTitle: 'Top Players',
  topPlayersBack: 'Squad',
  topPlayersTabGw: 'This GW',
  topPlayersTabSeason: 'Season',
  topPlayersLoadError: "Couldn't load top players",
  topPlayersRetry: 'Try again',
  topPlayersNavLink: 'Top Players',
  topPlayersTabTeam: 'By Team',
  topPlayersTeamSelectLabel: 'Select team',
  topPlayersTeamLoadError: "Couldn't load team players",

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
