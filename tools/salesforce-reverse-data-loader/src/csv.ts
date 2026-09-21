// Duplicated from ../../salesforce-rest-query-csv/src/csv.ts for v0.1.
// TODO: hoist to tools/_shared/salesforce/csv.ts when a third tool needs it.

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
  let ordinal = 0;
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (key === 'attributes') continue;
      if (!seen.has(key)) seen.set(key, ordinal++);
    }
  }
  return [...seen.keys()];
}

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw =
    typeof value === 'object' ? JSON.stringify(stripAttributes(value)) : String(value);
  if (/[",\r\n]/.test(raw)) {
    return '"' + raw.replace(/"/g, '""') + '"';
  }
  return raw;
}

function stripAttributes(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripAttributes);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'attributes') continue;
      out[k] = stripAttributes(v);
    }
    return out;
  }
  return value;
}

/**
 * From a set of records returned by `SELECT FIELDS(ALL) FROM X LIMIT 200`,
 * identify field names whose value is a JSON object in at least one record.
 * These are Salesforce compound fields (Address, Location, Name-compound)
 * which cannot appear in a SELECT alongside their component fields.
 */
export function detectCompoundFields(records: Record<string, unknown>[]): string[] {
  const compound = new Set<string>();
  for (const record of records) {
    for (const [k, v] of Object.entries(record)) {
      if (k === 'attributes') continue;
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        compound.add(k);
      }
    }
  }
  return [...compound].sort();
}
