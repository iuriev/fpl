export function formatPriceTenths(tenths: number): string {
  return `£${(tenths / 10).toFixed(1)}m`;
}

export function formatChangeTenths(tenths: number): string {
  const sign = tenths > 0 ? '+' : '';
  return `${sign}${(tenths / 10).toFixed(1)}`;
}

export function formatTransferCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}
