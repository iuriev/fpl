export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < headers.length) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = parts[j]?.trim() ?? '';
    });
    rows.push(row);
  }
  return rows;
}
