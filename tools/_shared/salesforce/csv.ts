/**
 * Shared CSV writer for kronos framework-shipped salesforce tools.
 *
 * Column set is the union of top-level keys across all records (excluding
 * the "attributes" wrapper jsforce attaches). Nested values (relationship
 * records, arrays) are JSON-serialized into a single cell — SOQL
 * relationship queries and picklist multi-selects survive without losing
 * information. Deterministic column order matches first-seen order.
 *
 * Nested "attributes" objects (jsforce sobject-type metadata) are
 * recursively stripped so serialized JSON in a cell is data, not metadata.
 *
 * `detectCompoundFields()` inspects a FIELDS(ALL) response for cells whose
 * value is a JSON object — those are Salesforce compound fields (Address,
 * Location, Name-compound). The reverse-data-loader uses this to detect
 * compound fields dynamically rather than hardcoding a list.
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

/**
 * From a set of records returned by `SELECT FIELDS(ALL) FROM X LIMIT 200`,
 * identify field names whose value is a JSON object in at least one record.
 * These are Salesforce compound fields (Address, Location, Name-compound)
 * which historically could not appear in a SELECT alongside their
 * component fields at older API versions.
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
