export const HIDDEN_STATS = new Set(['goals_conceded', 'bps']);

export function chipColorKey(identifier: string): string {
  switch (identifier) {
    case 'goals_scored': return 'chipGoal';
    case 'assists': return 'chipAssist';
    case 'clean_sheets':
    case 'saves':
    case 'defensive_contribution': return 'chipDefensive';
    case 'bonus': return 'chipBonus';
    case 'minutes': return 'chipPositive';
    case 'penalties_saved': return 'chipPositive';
    default: return 'chipNegative';
  }
}

export function formatStatLabel(identifier: string, value: number, points: number): string {
  const pts = points > 0 ? `+${points}` : String(points);
  switch (identifier) {
    case 'minutes': return `Played ${value} mins ${pts}`;
    case 'goals_scored': return `${value === 1 ? '1 goal' : `${value} goals`} ${pts}`;
    case 'assists': return `${value === 1 ? '1 assist' : `${value} assists`} ${pts}`;
    case 'clean_sheets': return `Clean sheet ${pts}`;
    case 'bonus': return `${value} bonus`;
    case 'saves': return `${value} saves ${pts}`;
    case 'penalties_saved': return `Penalty saved ${pts}`;
    case 'own_goals': return `${value === 1 ? 'Own goal' : `${value} own goals`} ${pts}`;
    case 'penalties_missed': return `Penalty missed ${pts}`;
    case 'yellow_cards': return `Yellow card ${pts}`;
    case 'red_cards': return `Red card ${pts}`;
    case 'defensive_contribution': return `Defensive ${pts}`;
    default: return `${identifier} ${pts}`;
  }
}
