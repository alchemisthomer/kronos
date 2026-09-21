// Duplicated from ../../salesforce-rest-query-csv/src/csv.ts for v0.1.
// TODO: hoist to tools/_shared/salesforce/csv.ts.

export function toCsv(records: Record<string, unknown>[]): string {
  if (records.length === 0) return '';
  const columns = collectColumns(records);
  const lines: string[] = [];
  lines.push(columns.map(escapeCell).join(','));
  for (const record of records) {
    lines.push(columns.map((col) => escapeCell(record[col])).join(','));
  }
  return lines.join('\n') + '\n';
}

function collectColumns(records: Record<string, unknown>[]): string[] {
  const seen = new Map<string, number>();
  let ord = 0;
  for (const rec of records) {
    for (const k of Object.keys(rec)) {
      if (k === 'attributes') continue;
      if (!seen.has(k)) seen.set(k, ord++);
    }
  }
  return [...seen.keys()];
}

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const raw = typeof v === 'object' ? JSON.stringify(stripAttrs(v)) : String(v);
  if (/[",\r\n]/.test(raw)) return '"' + raw.replace(/"/g, '""') + '"';
  return raw;
}

function stripAttrs(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripAttrs);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'attributes') continue;
      out[k] = stripAttrs(v);
    }
    return out;
  }
  return value;
}
