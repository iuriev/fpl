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
  squadGameweekLabel: 'GW',
  squadLoadError: "Couldn't load this GW",
  squadRetry: 'Try again',
  squadEmpty: 'No squad available for GW {GW}',
  squadEmptyHeading: 'No squad yet',
  squadEmptySubtext:
    'No squad available for GW {GW}. Use the arrows to jump to a later GW.',
  squadJumpToCurrent: 'Jump to current GW →',
  squadNotFound: "We couldn't find a team with that ID. Please check and try again.",

  // Active chips
  chipActiveSuffix:   'ACTIVE',
  chipWildcard:       'Wildcard',
  chipTripleCaptain:  'Triple Captain',
  chipFreeHit:        'Free Hit',
  chipBenchBoost:     'Bench Boost',

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
  teamInfoGwHistory: 'GW History',
  teamInfoDrawerLabel: 'Team information',
  teamInfoOpenDrawer: 'Open team info',

  // Gameweek history screen
  historyTitle: 'GW History',
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
  historyEmpty: 'No GWs played yet',
  historyLoadError: "Couldn't load GW history",
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

  // Team of the Week screen
  teamOfTheWeekTitle: 'Team of the Week',
  teamOfTheWeekBack: 'Squad',
  teamOfTheWeekLoadError: "Couldn't load the Team of the Week",
  teamOfTheWeekRetry: 'Try again',
  teamOfTheWeekNotAvailable: 'Team of the Week not available yet for this GW',
  teamOfTheWeekNavLink: 'Team of the Week',

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

  // Transfer planner screen
  transfersBack: 'Squad',
  transfersTitle: 'Transfers',
  transfersNavLink: 'Transfer Planner',
  transfersBank: 'Bank',
  transfersFree: 'Free',
  transfersCost: 'Cost',
  transfersWildcard: 'WC',
  transfersFreeHit: 'FH',
  transfersBenchBoost: 'BB',
  transfersTripleCaptain: 'TC',
  transfersWildcardActive: 'Wildcard active',
  transfersFreeHitActive: 'Free Hit active — squad reverts after GW{n}',
  transfersFreeHitActiveFinal: 'Free Hit active',
  transfersBenchBoostActive: 'Bench Boost — transfers cost normally',
  transfersTripleCaptainActive: 'Triple Captain — transfers cost normally',
  chipUsedAriaLabel: 'Already played',
  chipBlockedUsed:   '{name} already played in GW{gw}',
  chipBlockedNoGw:   '{name} already played this season',
  transfersPendingTitle: 'Planned transfers',
  transfersPendingEmpty: 'Tap a player to start planning',
  transfersReset: 'Reset',
  transfersSavePlan: 'Save Plan',
  transfersUndoSwap: 'Undo',
  transfersFreeEditable: 'Free transfers (tap to edit)',
  transfersLoadError: "Couldn't load transfers data",
  transfersRetry: 'Try again',
  transfersNoSquad: 'No squad found — play at least one gameweek to use the transfer planner',
  transfersBudgetDisclaimer:
    "Selling prices are approximate. The actual price may differ if a player's value changed since you bought them.",
  transfersPickerTitle: 'Replace {name}',
  transfersPickerSubtitle: '{position} · selling for £{cost}m',
  transfersPickerSearch: 'Search players…',
  transfersSortPts: 'Pts',
  transfersSortPrice: 'Price',
  transfersSortForm: 'Form',
  transfersSortGwPts: 'GW pts',
  transfersSortSel: 'OWN%',
  transfersSortXPts: 'xPts',
  transfersAlreadyThree: '3 already',
  transfersNFree: '{n} of {m} free used',
  transfersSavedToast: 'Plan saved',
  transfersStaleToast: 'Your saved plan was for GW{n} which has passed. Starting fresh.',
  transfersSortButton: 'Sort',
  transfersPositionAll: 'ALL',
  transfersColPlayer: 'Player',
  transfersColFix: 'Fix',
  transfersColOwnership: 'OWN%',
  transfersColOwnershipTitle: 'Ownership percentage',
  transfersColPts: 'Pts',
  transfersColXPts: 'xPts',
  transfersColCost: 'Cost',

  // Player info popup
  playerInfoOpen: 'Player info',
  playerInfoUpcomingFixtures: 'Upcoming Fixtures',

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

  // Guest squad view (viewing another manager's team)
  squadGuestBack: 'Back',

  // Watchlist screen
  watchlistTitle: 'Managers Watchlist',
  watchlistBack: 'Squad',
  watchlistNavLink: 'Managers Watchlist',
  watchlistCapacity: '{n}/{max} following',
  watchlistEmptyHeading: 'No managers followed yet',
  watchlistEmptySubtext: 'Add managers below to track their GW performance.',
  watchlistAddInputPlaceholder: 'Enter team ID…',
  watchlistAddButton: 'Follow',
  watchlistAddValidating: 'Checking…',
  watchlistAddConfirm: 'Follow {name}?',
  watchlistAddConfirmButton: 'Confirm',
  watchlistAddCancelButton: 'Cancel',
  watchlistAddErrorNotFound: 'Team not found. Check the ID and try again.',
  watchlistAddErrorNetwork: "Couldn't reach FPL servers. Try again.",
  watchlistAddDuplicate: 'Already following this manager.',
  watchlistAddLimit: 'Watchlist full ({max}/{max}). Remove a manager to add another.',
  watchlistRemoveAriaLabel: 'Unfollow {name}',
  watchlistFollowButton: 'Follow',
  watchlistFollowingButton: 'Following',
  watchlistUnfollowButton: 'Unfollow',
  watchlistFollowLimitToast: 'Watchlist full ({max}/{max}).',
  watchlistFromLeaguesHeading: 'From My Leagues',
  watchlistFromLeaguesNoTeam: 'Open your squad first to browse your leagues.',
  watchlistFromLeaguesLoadError: "Couldn't load leagues.",
  watchlistFromLeaguesStandingsLoadError: "Couldn't load standings.",
  watchlistFromLeaguesLoadMore: 'Load more',
  watchlistColManager: 'Manager',
  watchlistColGwPts: 'GW',
  watchlistColGwRank: 'GW Rk',
  watchlistColOverallRank: 'OR',
  watchlistColRankDelta: 'Δ Rank',
  watchlistColTransfers: 'Transfers made',
  watchlistColCaptain: 'Cap',
  watchlistColViceCaptain: 'VC',
  watchlistColLatestIn: 'In',
  watchlistColXfrCost: 'Transfer fee',
  watchlistColSquadValue: 'Squad',
  watchlistColBank: 'Bank',
  watchlistTransferCostFree: 'Free',
  watchlistUnfollow: 'Unfollow',
  watchlistLoadError: 'Failed to load',
  watchlistRowErrorRemove: 'Remove',

  // Premium gate sheet
  premiumSheetUpgrade: 'Upgrade to Premium',
  premiumSheetComingSoon: 'Coming soon',
  premiumSheetDismiss: 'Maybe later',
  premiumSheetFreeTier: 'Free',
  premiumSheetPremiumTier: 'Premium ✦',
  premiumWatchlistTitle: 'Follow more managers',
  premiumWatchlistDescription: "You've reached the free plan limit. Upgrade to track more managers and unlock features.",
  premiumWatchlistFreeLabel: '2 managers',
  premiumWatchlistPremiumLabel: '10 managers',

  // Transfer help tour
  tourHelpButton: 'Open tour',
  tourSkip: '✕ Skip',
  tourNext: 'Next',
  tourBack: 'Back',
  tourFinish: 'Got it!',
  tourStep1Title: 'Chip Badges',
  tourStep1Text: 'Wildcard (WC) and Free Hit (FH) allow unlimited transfers. Bench Boost (BB) and Triple Captain (TC) provide scoring bonuses.',
  tourStep2Title: 'Bank & Cost',
  tourStep2Text: 'Track your remaining budget, available free transfers, and the point cost of your planned moves.',
  tourStep4Title: 'Player Stats',
  tourStep4Text: 'View ownership and other key stats to help you decide on transfers.',
  tourStep5Title: 'Fixture Difficulty',
  tourStep5Text: 'Colour-coded chips show the next opponent. Green is easy, maroon is hard (FDR 1-5).',
  tourStep6Title: 'Substitutions',
  tourStep6Text: 'Use the swap icon to move players between your starting XI and the bench.',
  tourStep9Title: 'Save Your Plan',
  tourStep9Text: "These players only score if a starter doesn't play. Order matters for auto-subs! Reset clears your draft. Save Plan stores it in this browser for later.",

  // Gameweek review screen
  reviewTitle: 'GW Review',
  reviewBack: 'Squad',
  reviewNavLink: 'Last GW Review',
  reviewGwPts: 'GW points',
  reviewVsAvg: 'vs avg',
  reviewAvg: 'avg',
  reviewHighest: 'highest',
  reviewGwRank: 'GW rank',
  reviewPlayersSection: 'Players — sorted by points',
  reviewBenchSection: 'Bench',
  reviewBenchWasted: '{pts} points left on bench',
  reviewBenchNone: 'Nothing left on bench',
  reviewNoAutosubs: 'No automatic substitutions',
  reviewBenchDivider: 'Bench',
  reviewTransfersSection: 'Transfers this GW',
  reviewNoTransfers: 'Rolled transfer — squad unchanged',
  reviewTransferOut: 'OUT',
  reviewTransferIn: 'IN',
  reviewTransferHit: '−{cost} pts transfer hit',
  reviewWhatIfSection: 'What if you made no transfers?',
  reviewWhatIfActual: 'Your score',
  reviewWhatIfWithTransfers: 'with transfers',
  reviewWhatIfHypothetical: 'Without transfers',
  reviewWhatIfGain: 'Transfers gained you {n} points',
  reviewWhatIfLoss: 'Transfers cost you {n} points',
  reviewWhatIfBreakEven: 'Transfers broke even this week',
  reviewLoadError: "Couldn't load gameweek review",
  reviewRetry: 'Try again',
  reviewNoGw: 'No completed GWs yet',
};

/**
 * Interpolate copy strings.
 * Usage: interpolate(copy.squadEmpty, { GW: '15' })
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/{(\w+)}/g, (_, key) => String(values[key] ?? ''));
}
