export function parseTargetGameweeks(argv: string[]): number[] {
  const gws: number[] = [];

  for (const arg of argv) {
    if (arg === '--' || arg.startsWith('-')) continue;
    if (arg.startsWith('--gw=')) {
      for (const part of arg.slice(5).split(',')) {
        const n = parseInt(part.trim(), 10);
        if (!isNaN(n) && n >= 1 && n <= 38) gws.push(n);
      }
      continue;
    }
    const range = /^(\d+)-(\d+)$/.exec(arg);
    if (range) {
      const start = parseInt(range[1]!, 10);
      const end = parseInt(range[2]!, 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let gw = start; gw <= end; gw++) {
          if (gw >= 1 && gw <= 38) gws.push(gw);
        }
      }
      continue;
    }
    const n = parseInt(arg, 10);
    if (!isNaN(n) && n >= 1 && n <= 38) gws.push(n);
  }

  const unique = [...new Set(gws)].sort((a, b) => a - b);
  if (unique.length === 0) {
    throw new Error(
      'Provide gameweek(s): e.g. `10 11 12`, `10-14`, or `--gw=10,11,12` (1–38)'
    );
  }
  return unique;
}

export function gameweekRangeLabel(gws: number[]): string {
  if (gws.length === 1) return String(gws[0]);
  const contiguous = gws.every((gw, i) => i === 0 || gw === gws[i - 1]! + 1);
  if (contiguous) return `${gws[0]}-${gws.at(-1)}`;
  return gws.join('-');
}
