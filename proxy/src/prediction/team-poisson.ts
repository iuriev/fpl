import type { EplMatchRow, TeamPoissonFit } from './types';

function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

function clampLambda(logLam: number): number {
  return Math.exp(Math.max(-5, Math.min(5, logLam)));
}

export function fitTeamPoisson(matches: EplMatchRow[]): TeamPoissonFit {
  const teams = [
    ...new Set(matches.flatMap((m) => [m.homeSlug, m.awaySlug])),
  ].sort();
  const attack = new Map<string, number>();
  const defence = new Map<string, number>();
  for (const t of teams) {
    attack.set(t, 0);
    defence.set(t, 0);
  }

  let mu = Math.log(
    matches.reduce((s, m) => s + m.fthg + m.ftag, 0) / (2 * matches.length),
  );
  let homeAdv = 0.2;

  for (let iter = 0; iter < 120; iter++) {
    const attGrad = new Map<string, number>();
    const defGrad = new Map<string, number>();
    let muGrad = 0;
    let hGrad = 0;

    for (const m of matches) {
      const logLh = mu + homeAdv + (attack.get(m.homeSlug) ?? 0) + (defence.get(m.awaySlug) ?? 0);
      const logLa = mu + (attack.get(m.awaySlug) ?? 0) + (defence.get(m.homeSlug) ?? 0);
      const lamH = clampLambda(logLh);
      const lamA = clampLambda(logLa);

      muGrad += m.fthg - lamH + (m.ftag - lamA);
      hGrad += m.fthg - lamH;
      attGrad.set(m.homeSlug, (attGrad.get(m.homeSlug) ?? 0) + (m.fthg - lamH));
      defGrad.set(m.awaySlug, (defGrad.get(m.awaySlug) ?? 0) + (m.fthg - lamH));
      attGrad.set(m.awaySlug, (attGrad.get(m.awaySlug) ?? 0) + (m.ftag - lamA));
      defGrad.set(m.homeSlug, (defGrad.get(m.homeSlug) ?? 0) + (m.ftag - lamA));
    }

    const lr = 0.02 / matches.length;
    mu += lr * muGrad;
    homeAdv += lr * hGrad;
    for (const t of teams) {
      attack.set(t, (attack.get(t) ?? 0) + lr * (attGrad.get(t) ?? 0));
      defence.set(t, (defence.get(t) ?? 0) + lr * (defGrad.get(t) ?? 0));
    }

    const attMean = [...attack.values()].reduce((a, b) => a + b, 0) / teams.length;
    const defMean = [...defence.values()].reduce((a, b) => a + b, 0) / teams.length;
    for (const t of teams) {
      attack.set(t, (attack.get(t) ?? 0) - attMean);
      defence.set(t, (defence.get(t) ?? 0) - defMean);
    }
  }

  return { mu, homeAdv, attack, defence, teams };
}

function getAttack(fit: TeamPoissonFit, team: string): number {
  return fit.attack.get(team) ?? 0;
}

function getDefence(fit: TeamPoissonFit, team: string): number {
  return fit.defence.get(team) ?? 0;
}

export function lambdaHome(fit: TeamPoissonFit, home: string, away: string): number {
  return clampLambda(
    fit.mu + fit.homeAdv + getAttack(fit, home) + getDefence(fit, away),
  );
}

export function lambdaAway(fit: TeamPoissonFit, home: string, away: string): number {
  return clampLambda(fit.mu + getAttack(fit, away) + getDefence(fit, home));
}

export function csProbHome(fit: TeamPoissonFit, home: string, away: string): number {
  return poissonPmf(0, lambdaAway(fit, home, away));
}

export function csProbAway(fit: TeamPoissonFit, home: string, away: string): number {
  return poissonPmf(0, lambdaHome(fit, home, away));
}
