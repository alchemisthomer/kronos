import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { SobjectAssessment } from './assess.ts';

export interface AssessmentReport {
  generated_at: string;
  tool: string;
  tool_version: string;
  mode: 'assess' | 'extract';
  user: {
    username: string;
    user_id: string;
    organization_id: string;
    instance_url: string;
    login_url: string;
    api_version: string;
  };
  sobject_source: string;
  sobjects_targeted: string[];
  results: SobjectAssessment[];
  summary: {
    sobjects_probed: number;
    sobjects_accessible: number;
    sobjects_denied: number;
    total_rows_visible: number;
    total_fields_authoritative: number;
    total_custom_fields_authoritative: number;
    total_extract_rows: number;
    total_extract_bytes: number;
    silent_field_drop_findings: number;
  };
  timing_ms: number;
  api_calls_total: number;
}

export function writeJson(report: AssessmentReport, path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(report, null, 2) + '\n', 'utf8');
}

export function writeMarkdown(report: AssessmentReport, path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, renderMarkdown(report), 'utf8');
}

export function renderMarkdown(report: AssessmentReport): string {
  const L: string[] = [];
  L.push(`# Salesforce Access Assessment — Reverse Data Loader`);
  L.push('');
  L.push(`- **Generated:** ${report.generated_at}`);
  L.push(`- **Tool:** \`${report.tool}\` v${report.tool_version}`);
  L.push(`- **Mode:** \`${report.mode}\`${report.mode === 'extract' ? ' ⚠ full data extracted' : ''}`);
  L.push(`- **User:** \`${report.user.username}\` (id \`${report.user.user_id}\`)`);
  L.push(`- **Org:** \`${report.user.organization_id}\` @ \`${report.user.instance_url}\``);
  L.push(`- **API version:** ${report.user.api_version}`);
  L.push(`- **Sobject source:** \`${report.sobject_source}\``);
  L.push(`- **Sobjects targeted (${report.sobjects_targeted.length}):** ${report.sobjects_targeted.map((s) => `\`${s}\``).join(', ')}`);
  L.push('');
  L.push(`## Summary`);
  L.push('');
  L.push(`| Metric | Value |`);
  L.push(`|---|---|`);
  L.push(`| Sobjects probed | ${report.summary.sobjects_probed} |`);
  L.push(`| Sobjects accessible | ${report.summary.sobjects_accessible} |`);
  L.push(`| Sobjects denied | ${report.summary.sobjects_denied} |`);
  L.push(`| Total rows visible (sum) | ${report.summary.total_rows_visible.toLocaleString()} |`);
  L.push(`| Total fields visible (describe-authoritative) | ${report.summary.total_fields_authoritative.toLocaleString()} |`);
  L.push(`| Total custom fields visible | ${report.summary.total_custom_fields_authoritative.toLocaleString()} |`);
  L.push(`| Silent-field-drop findings | ${report.summary.silent_field_drop_findings} |`);
  if (report.mode === 'extract') {
    L.push(`| Total rows extracted | ${report.summary.total_extract_rows.toLocaleString()} |`);
    L.push(`| Total bytes extracted | ${report.summary.total_extract_bytes.toLocaleString()} |`);
  }
  L.push(`| Wall time | ${(report.timing_ms / 1000).toFixed(2)} s |`);
  L.push(`| Salesforce API calls | ${report.api_calls_total} |`);
  L.push('');
  L.push(`## Per-sobject results`);
  L.push('');
  for (const r of report.results) {
    L.push(`### ${r.sobject}`);
    L.push('');
    if (!r.access.granted) {
      L.push(`- Access: **DENIED** — code \`${r.access.code}\``);
      L.push(`- Reason: ${r.access.message}`);
      L.push('');
      continue;
    }
    L.push(`- Access: ✅ granted`);
    if (r.row_count !== null) {
      L.push(`- Total rows visible: **${r.row_count.toLocaleString()}**`);
    }
    if (r.describe?.granted) {
      L.push(`- Describe (authoritative): **${r.describe.field_count} fields** (${r.describe.custom_field_count} custom, ${r.describe.compound_field_names?.length ?? 0} compound)`);
      L.push(`  - Metadata: \`${r.describe.describe_json_path}\``);
      L.push(`  - Field list: \`${r.describe.fields_txt_path}\``);
    } else if (r.describe) {
      L.push(`- Describe DENIED (\`${r.describe.code}\`): ${r.describe.message}`);
    }
    if (r.fields_all_sample) {
      L.push(`- FIELDS(ALL) LIMIT 200 sample: ${r.fields_all_sample.field_count} fields, ${r.fields_all_sample.sample_row_count} rows`);
      L.push(`  - Path: \`${r.fields_all_sample.sample_csv_path}\`, sha256 \`${r.fields_all_sample.sample_csv_sha256.slice(0, 12)}…\``);
    }
    if (r.drift) {
      if (r.drift.finding === 'silent-field-drop') {
        L.push(`- **DRIFT FINDING: silent-field-drop** — FIELDS(ALL) omits ${r.drift.describe_only.length} field(s) that describe exposes:`);
        for (const f of r.drift.describe_only.slice(0, 20)) L.push(`  - \`${f}\``);
        if (r.drift.describe_only.length > 20) L.push(`  - … (+${r.drift.describe_only.length - 20} more)`);
        if (r.drift.fields_all_only.length > 0) {
          L.push(`  - FIELDS(ALL) also returned ${r.drift.fields_all_only.length} field(s) not in describe: ${r.drift.fields_all_only.map((f) => `\`${f}\``).join(', ')}`);
        }
      } else {
        L.push(`- Drift check: ✅ clean (describe and FIELDS(ALL) agree on ${r.drift.matched} fields)`);
      }
    }
    if (r.extract) {
      L.push(`- **Full extract:** \`${r.extract.csv_path}\``);
      L.push(`  - **${r.extract.row_count.toLocaleString()} rows**, ${r.extract.bytes.toLocaleString()} bytes, ${r.extract.fields_selected} fields, ${r.extract.api_calls} api calls`);
      L.push(`  - sha256 \`${r.extract.sha256.slice(0, 12)}…\``);
    }
    if (r.errors.length > 0) {
      L.push(`- Errors:`);
      for (const e of r.errors) L.push(`  - \`${e.phase}\`: \`${e.code}\` — ${e.message}`);
    }
    L.push('');
  }
  return L.join('\n');
}
