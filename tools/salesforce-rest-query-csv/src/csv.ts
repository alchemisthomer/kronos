/**
 * Convert a Salesforce SOQL record set into a CSV string.
 *
 * Column set is the union of top-level keys across all records (excluding
 * the "attributes" wrapper jsforce attaches). Nested values (objects,
 * arrays) are JSON-serialized into a single cell — SOQL relationship
 * queries and picklist multi-selects survive this way without losing
 * information. Downstream oracle authors get deterministic column order.
 */
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
  const seen = new Map<string, number>(); // preserves first-seen order
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

/**
 * Recursively strip jsforce "attributes" wrappers from nested relationship
 * records so serialized JSON in a cell is data, not metadata.
 */
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
