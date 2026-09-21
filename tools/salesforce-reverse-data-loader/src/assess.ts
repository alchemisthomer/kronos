import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { detectCompoundFields, toCsv } from '../../_shared/salesforce/csv.ts';
import {
  countRows,
  describeSobject,
  enumerateFields,
  probeAccess,
  runQuery,
  type Session,
} from './session.ts';

export interface SobjectAssessment {
  sobject: string;
  access:
    | { granted: true; probeRecords: number }
    | { granted: false; code: string; message: string };
  row_count: number | null;
  describe: {
    granted: boolean;
    code?: string;
    message?: string;
    field_count?: number;
    custom_field_count?: number;
    compound_field_names?: string[];
    describe_json_path?: string;
    fields_txt_path?: string;
    fields_txt_sha256?: string;
  } | null;
  fields_all_sample: {
    field_count: number;
    compound_detected: string[];
    sample_csv_path: string;
    sample_csv_sha256: string;
    sample_csv_bytes: number;
    sample_row_count: number;
  } | null;
  drift: {
    describe_only: string[];  // fields in describe but not in FIELDS(ALL) — silent drops
    fields_all_only: string[]; // in FIELDS(ALL) but not describe — vanishingly rare
    matched: number;
    finding: 'clean' | 'silent-field-drop';
  } | null;
  extract: {
    csv_path: string;
    sha256: string;
    bytes: number;
    row_count: number;
    api_calls: number;
    fields_selected: number;
  } | null;
  errors: Array<{ phase: string; code: string; message: string }>;
}

/**
 * Assess one sobject: access probe → row count → describe (authoritative)
 * → FIELDS(ALL) sample (secondary + drift check). Never extracts data.
 */
export async function assessSobject(
  session: Session,
  sobject: string,
  outputDir: string,
  log: (m: string) => void,
): Promise<SobjectAssessment> {
  const result: SobjectAssessment = {
    sobject,
    access: { granted: false, code: 'unknown', message: '' },
    row_count: null,
    describe: null,
    fields_all_sample: null,
    drift: null,
    extract: null,
    errors: [],
  };

  // Phase 1: access probe
  log(`[${sobject}] probing access...`);
  const access = await probeAccess(session, sobject);
  result.access = access;
  if (!access.granted) {
    log(`[${sobject}] access DENIED (${access.code}): ${access.message}`);
    return result;
  }

  // Phase 2: row count
  try {
    log(`[${sobject}] counting rows...`);
    const count = await countRows(session, sobject);
    result.row_count = count;
    log(`[${sobject}] row count = ${count.toLocaleString()}`);
  } catch (err) {
    result.errors.push({ phase: 'count', code: 'count-failed', message: (err as Error).message });
    log(`[${sobject}] count failed: ${(err as Error).message}`);
  }

  // Phase 3: describe (authoritative)
  log(`[${sobject}] describing (authoritative field source)...`);
  const desc = await describeSobject(session, sobject);
  if (desc.granted) {
    mkdirSync(outputDir, { recursive: true });
    const describeJson = JSON.stringify(desc.describe, null, 2) + '\n';
    const describePath = join(outputDir, `${sobject.toLowerCase()}-describe.json`);
    writeFileSync(describePath, describeJson, 'utf8');

    const fieldsTxt = [...desc.field_names].sort().join('\n') + '\n';
    const fieldsTxtPath = join(outputDir, `${sobject.toLowerCase()}-fields.txt`);
    writeFileSync(fieldsTxtPath, fieldsTxt, 'utf8');

    result.describe = {
      granted: true,
      field_count: desc.field_names.length,
      custom_field_count: desc.custom_field_names.length,
      compound_field_names: desc.compound_field_names,
      describe_json_path: describePath,
      fields_txt_path: fieldsTxtPath,
      fields_txt_sha256: createHash('sha256').update(fieldsTxt, 'utf8').digest('hex'),
    };
    log(
      `[${sobject}] describe: ${desc.field_names.length} fields (${desc.custom_field_names.length} custom, ` +
        `${desc.compound_field_names.length} compound) → ${describePath}`,
    );
  } else {
    result.describe = { granted: false, code: desc.code, message: desc.message };
    log(`[${sobject}] describe DENIED (${desc.code}): ${desc.message}`);
  }

  // Phase 4: FIELDS(ALL) sample (secondary evidence)
  try {
    log(`[${sobject}] sampling with FIELDS(ALL) LIMIT 200 (secondary evidence)...`);
    const enumeration = await enumerateFields(session, sobject);
    const sampleFields = collectFieldNames(enumeration.records);
    const compound = detectCompoundFields(enumeration.records);
    const csv = toCsv(enumeration.records);
    const samplePath = join(outputDir, `${sobject.toLowerCase()}-fields200.csv`);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(samplePath, csv, 'utf8');
    result.fields_all_sample = {
      field_count: sampleFields.length,
      compound_detected: compound,
      sample_csv_path: samplePath,
      sample_csv_sha256: createHash('sha256').update(csv, 'utf8').digest('hex'),
      sample_csv_bytes: Buffer.byteLength(csv, 'utf8'),
      sample_row_count: enumeration.records.length,
    };
    log(`[${sobject}] FIELDS(ALL) sample: ${sampleFields.length} fields → ${samplePath}`);

    // Drift analysis: compare describe vs FIELDS(ALL).
    if (result.describe?.granted) {
      const descSet = new Set(await readFieldList(result.describe.fields_txt_path!));
      const sampleSet = new Set(sampleFields);
      const describe_only = [...descSet].filter((f) => !sampleSet.has(f)).sort();
      const fields_all_only = [...sampleSet].filter((f) => !descSet.has(f)).sort();
      const matched = [...descSet].filter((f) => sampleSet.has(f)).length;
      result.drift = {
        describe_only,
        fields_all_only,
        matched,
        finding: describe_only.length === 0 && fields_all_only.length === 0 ? 'clean' : 'silent-field-drop',
      };
      if (result.drift.finding === 'silent-field-drop') {
        log(
          `[${sobject}] ⚠ SILENT-FIELD-DROP: FIELDS(ALL) missed ${describe_only.length} fields ` +
            `(${describe_only.slice(0, 5).join(', ')}${describe_only.length > 5 ? ', …' : ''})`,
        );
      } else {
        log(`[${sobject}] drift check clean: describe and FIELDS(ALL) agree on ${matched} fields`);
      }
    }
  } catch (err) {
    result.errors.push({
      phase: 'fields-all-sample',
      code: 'field-enumeration-failed',
      message: (err as Error).message,
    });
    log(`[${sobject}] FIELDS(ALL) sample failed: ${(err as Error).message}`);
  }

  return result;
}

/**
 * Full data extraction using the authoritative describe field list.
 * At API version 61+, compound fields can coexist with their components
 * in the same SELECT — no stripping needed. The tool no longer strips.
 */
export async function extractSobject(
  session: Session,
  assessment: SobjectAssessment,
  outputDir: string,
  extractLimit: number | null,
  log: (m: string) => void,
): Promise<void> {
  const sobject = assessment.sobject;
  if (!assessment.access.granted) {
    log(`[${sobject}] skip extract (access denied)`);
    return;
  }
  // Prefer describe field list; fall back to FIELDS(ALL) sample if describe was denied.
  let fieldList: string[];
  let source: 'describe' | 'fields-all-fallback';
  if (assessment.describe?.granted && assessment.describe.fields_txt_path) {
    fieldList = await readFieldList(assessment.describe.fields_txt_path);
    source = 'describe';
  } else if (assessment.fields_all_sample) {
    // Fallback: read fields from the sample CSV header. Compound-strip since
    // we can't be sure about API version behavior in this path.
    fieldList = await readFieldsFromCsvHeader(assessment.fields_all_sample.sample_csv_path);
    fieldList = fieldList.filter((f) => !assessment.fields_all_sample!.compound_detected.includes(f));
    source = 'fields-all-fallback';
    log(`[${sobject}] extract fallback: no describe available, using FIELDS(ALL) sample (compound-stripped)`);
  } else {
    log(`[${sobject}] skip extract (no field source available)`);
    return;
  }

  const soql =
    `SELECT ${fieldList.join(',')} FROM ${sobject}` +
    (extractLimit != null ? ` LIMIT ${extractLimit}` : '');

  log(
    `[${sobject}] EXTRACTING ${fieldList.length} fields via ${source}` +
      `${extractLimit != null ? ` LIMIT ${extractLimit}` : ' (unbounded)'}`,
  );

  try {
    const qres = await runQuery(session, soql);
    const csv = toCsv(qres.records);
    const outPath = join(outputDir, `${sobject.toLowerCase()}-extract.csv`);
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outPath, csv, 'utf8');
    assessment.extract = {
      csv_path: outPath,
      sha256: createHash('sha256').update(csv, 'utf8').digest('hex'),
      bytes: Buffer.byteLength(csv, 'utf8'),
      row_count: qres.records.length,
      api_calls: qres.apiCalls,
      fields_selected: fieldList.length,
    };
    log(
      `[${sobject}] extracted ${qres.records.length.toLocaleString()} rows ` +
        `(${assessment.extract.bytes.toLocaleString()} bytes, ${qres.apiCalls} api calls) → ${outPath}`,
    );
  } catch (err) {
    assessment.errors.push({
      phase: 'extract',
      code: 'extract-failed',
      message: (err as Error).message,
    });
    log(`[${sobject}] extract failed: ${(err as Error).message}`);
  }
}

async function readFieldList(path: string): Promise<string[]> {
  const { readFileSync } = await import('node:fs');
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function readFieldsFromCsvHeader(path: string): Promise<string[]> {
  const { readFileSync } = await import('node:fs');
  const first = readFileSync(path, 'utf8').split('\n')[0] ?? '';
  return first.split(',').map((s) => s.trim()).filter(Boolean);
}

function collectFieldNames(records: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const rec of records) {
    for (const k of Object.keys(rec)) {
      if (k === 'attributes') continue;
      if (!seen.has(k)) {
        seen.add(k);
        ordered.push(k);
      }
    }
  }
  return ordered;
}
