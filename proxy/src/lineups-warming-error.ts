export class LineupsWarmingError extends Error {
  constructor() {
    super('Predicted lineups cache is still warming');
    this.name = 'LineupsWarmingError';
  }
}
