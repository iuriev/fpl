export function profileStatLabel(identifier: string, value: number): string {
  switch (identifier) {
    case 'minutes':
      return `${value} mins`;
    case 'goals_scored':
      return value === 1 ? '1 goal' : `${value} goals`;
    case 'assists':
      return value === 1 ? '1 assist' : `${value} assists`;
    case 'clean_sheets':
      return 'Clean sheet';
    case 'bonus':
      return `${value} bonus`;
    case 'saves':
      return `${value} saves`;
    case 'penalties_saved':
      return 'Penalty saved';
    case 'penalties_missed':
      return 'Penalty missed';
    case 'own_goals':
      return value === 1 ? 'Own goal' : `${value} own goals`;
    case 'yellow_cards':
      return 'Yellow card';
    case 'red_cards':
      return 'Red card';
    case 'defensive_contribution':
      return `Defcon ${value}`;
    default:
      return `${identifier} ${value}`;
  }
}
