#!/usr/bin/env -S npx tsx
/**
 * salesforce-reverse-data-loader — Kronos tool v0.1.0
 *
 * Reproduces what a compromised or over-privileged Salesforce user could
 * pull. Two modes:
 *   - assess (default): probe access + count rows + enumerate fields.
 *     No data extraction. Produces an exposure report.
 *   - extract (--extract-data): assess plus pull all records per sobject.
 *     Explicit opt-in; produces both the report and per-sobject CSVs.
 *
 * Standard I/O contract per tools/README.md. Params via argv; results are
 * artifacts on disk + run manifest as the final line of stdout.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  CredentialError,
  loadCredentials,
  redactCredentials,
  type SalesforceCredentials,
} from './auth.ts';
import {
  assessSobject,
  extractSobject,
  type SobjectAssessment,
} from './assess.ts';
import {
  writeJson,
  writeMarkdown,
  type AssessmentReport,
} from './report.ts';
import {
  parseSobjectCsv,
  resolveSobjectList,
} from './sobjects.ts';
import {
  closeSession,
  listSobjects,
  openSession,
  type Session,
} from './session.ts';

const TOOL_ID = 'salesforce-reverse-data-loader';
const TOOL_VERSION = '0.1.0';

interface ParsedArgs {
  sobjects: string[] | null;
  appendSobjects: string[] | null;
  useDescribe: boolean;
  credentials: string;
  loginUrl: string;
  apiVersion: string;
  outputDir: string;
  reportJson: string;
  reportMd: string;
  extractData: boolean;
  extractLimit: number | null;
  describe: boolean;
}

function parseCliArgs(): ParsedArgs {
  const { values } = parseArgs({
    strict: true,
    allowPositionals: false,
    options: {
      sobjects: { type: 'string' },
      'append-sobjects': { type: 'string' },
      'use-describe': { type: 'boolean', default: false },
      credentials: {
        type: 'string',
        // Default points at the primitive tool's cred directory. When we hoist
        // credentials/ to tools/_shared/salesforce/, this default updates.
        default: '../salesforce-rest-query-csv/credentials/salesforce.json',
      },
      'login-url': { type: 'string', default: 'https://login.salesforce.com' },
      'api-version': { type: 'string', default: '64.0' },
      'output-dir': { type: 'string', default: './output' },
      'report-json': { type: 'string' },
      'report-md': { type: 'string' },
      'extract-data': { type: 'boolean', default: false },
      'extract-limit': { type: 'string' },
      describe: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false, short: 'h' },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const outputDir = resolve(values['output-dir']!);
  return {
    sobjects: parseSobjectCsv(values.sobjects),
    appendSobjects: parseSobjectCsv(values['append-sobjects']),
    useDescribe: values['use-describe'] === true,
    credentials: resolve(values.credentials!),
    loginUrl: values['login-url']!,
    apiVersion: values['api-version']!,
    outputDir,
    reportJson: values['report-json']
      ? resolve(values['report-json'])
      : join(outputDir, 'assessment-report.json'),
    reportMd: values['report-md']
      ? resolve(values['report-md'])
      : join(outputDir, 'assessment-report.md'),
    extractData: values['extract-data'] === true,
    extractLimit: values['extract-limit'] ? Number(values['extract-limit']) : null,
    describe: values.describe === true,
  };
}

function printHelp(): void {
  process.stderr.write(
    [
      `${TOOL_ID} v${TOOL_VERSION}`,
      '',
      'Audit what a Salesforce user can access. Optionally extract that data.',
      '',
      'Usage:',
      '  npx tsx src/index.ts [options]',
      '',
      'Sobject selection (choose one; --append-sobjects extends any):',
      '  --sobjects <csv>          Explicit list, e.g. "Account,Contact,MyCustom__c".',
      '                            Default: Account,Contact,Lead,Opportunity',
      '  --append-sobjects <csv>   Additional sobjects on top of the base list.',
      '  --use-describe            Enumerate every sobject the user can see via',
      '                            /sobjects (requires API Enabled). Failure is',
      '                            captured as a finding.',
      '',
      'Data extraction (default OFF — assess mode does not pull records):',
      '  --extract-data            Pull all records per accessible sobject.',
      '                            Writes <sobject>-extract.csv per sobject.',
      '                            Use only when engagement authorization permits.',
      '  --extract-limit <n>       Cap rows per sobject during extract (default: unbounded).',
      '',
      'Connection:',
      '  --credentials <path>      JSON creds file.',
      '                            (default: ../salesforce-rest-query-csv/credentials/salesforce.json)',
      '  --login-url <url>         (default: https://login.salesforce.com)',
      '  --api-version <ver>       (default: 60.0)',
      '',
      'Output:',
      '  --output-dir <dir>        Where per-sobject CSVs go. (default: ./output)',
      '  --report-json <path>      JSON report path. (default: <output-dir>/assessment-report.json)',
      '  --report-md <path>        Markdown report path. (default: <output-dir>/assessment-report.md)',
      '',
      '  --describe                Print tool metadata as JSON and exit.',
      '  -h, --help                Show this help.',
      '',
    ].join('\n'),
  );
}

function describeTool(): void {
  process.stdout.write(
    JSON.stringify(
      {
        tool: TOOL_ID,
        tool_version: TOOL_VERSION,
        binding_layer: 1,
        api_family: 'salesforce.rest',
        endpoints: [
          '/services/data/v{apiVersion}/sobjects (--use-describe)',
          '/services/data/v{apiVersion}/query (probe / count / fields / extract)',
        ],
        authorization_ceiling_max: 2,
        modes: [
          { name: 'assess', description: 'Probe access, count rows, enumerate fields. Default.' },
          { name: 'extract', description: 'Additionally pull all records. Enabled by --extract-data.' },
        ],
        argv: [
          { name: 'sobjects', type: 'string', default: null, description: 'Comma-separated sobject list; overrides default.' },
          { name: 'append-sobjects', type: 'string', default: null, description: 'Additional sobjects added to the base list.' },
          { name: 'use-describe', type: 'boolean', default: false, description: 'Enumerate every visible sobject via /sobjects.' },
          { name: 'extract-data', type: 'boolean', default: false, description: 'Pull full records per accessible sobject.' },
          { name: 'extract-limit', type: 'number', default: null, description: 'Row cap per sobject during extract.' },
          { name: 'credentials', type: 'path' },
          { name: 'login-url', type: 'string', default: 'https://login.salesforce.com' },
          { name: 'api-version', type: 'string', default: '60.0' },
          { name: 'output-dir', type: 'path', default: './output' },
          { name: 'report-json', type: 'path', default: '<output-dir>/assessment-report.json' },
          { name: 'report-md', type: 'path', default: '<output-dir>/assessment-report.md' },
        ],
        outputs: [
          { name: 'assessment-report', format: 'json', channel: 'file+stdout' },
          { name: 'assessment-report', format: 'markdown', channel: 'file' },
          { name: 'sobject-sample', format: 'csv', channel: 'file', description: 'Per sobject: FIELDS(ALL) LIMIT 200.' },
          { name: 'sobject-extract', format: 'csv', channel: 'file', description: 'Per sobject: full extraction (extract mode only).' },
          { name: 'run-manifest', format: 'json', channel: 'stdout-final-line' },
        ],
      },
      null,
      2,
    ) + '\n',
  );
}

async function main(): Promise<number> {
  const startedMs = Date.now();
  const invoked_at = new Date().toISOString();
  const args = parseCliArgs();

  if (args.describe) {
    describeTool();
    return 0;
  }

  let creds: SalesforceCredentials | null = null;
  let session: Session | null = null;

  const paramsForManifest: Record<string, unknown> = {
    sobjects: args.sobjects,
    'append-sobjects': args.appendSobjects,
    'use-describe': args.useDescribe,
    'extract-data': args.extractData,
    'extract-limit': args.extractLimit,
    credentials: args.credentials,
    'login-url': args.loginUrl,
    'api-version': args.apiVersion,
    'output-dir': args.outputDir,
    'report-json': args.reportJson,
    'report-md': args.reportMd,
  };

  try {
    creds = loadCredentials({
      credentialsPath: args.credentials,
      loginUrlOverride: args.loginUrl,
    });
    const effectiveLoginUrl = creds.loginUrl ?? args.loginUrl;

    log(`Logging in as ${creds.username} against ${effectiveLoginUrl}...`);
    session = await openSession(creds, effectiveLoginUrl, args.apiVersion);
    log(`Session opened: instance=${session.instanceUrl}, org=${session.organizationId}`);

    // Resolve sobject list.
    let describedList: string[] | null = null;
    if (args.useDescribe) {
      log(`Enumerating all visible sobjects via /sobjects (--use-describe)...`);
      const desc = await listSobjects(session);
      if (desc.granted) {
        describedList = desc.queryable;
        log(`Describe returned ${desc.names.length} total sobjects, ${desc.queryable.length} queryable.`);
      } else {
        log(`--use-describe FAILED (${desc.code}): ${desc.message}`);
        log(`Falling back to default/explicit sobject list.`);
      }
    }

    const { list: sobjects, source } = resolveSobjectList({
      explicitList: args.sobjects,
      appendList: args.appendSobjects,
      describedList,
    });
    log(`Assessing ${sobjects.length} sobject(s) [source=${source}]: ${sobjects.join(', ')}`);
    if (args.extractData) {
      log(`EXTRACT MODE — will pull records for every accessible sobject after assessment.`);
    }

    // Assess phase.
    const results: SobjectAssessment[] = [];
    for (const sobject of sobjects) {
      const r = await assessSobject(session, sobject, args.outputDir, log);
      results.push(r);
    }

    // Extract phase (if requested).
    if (args.extractData) {
      for (const r of results) {
        await extractSobject(session, r, args.outputDir, args.extractLimit, log);
      }
    }

    // Build report.
    const completed_at = new Date().toISOString();
    const timing_ms = Date.now() - startedMs;
    const summary = summarize(results);
    const report: AssessmentReport = {
      generated_at: completed_at,
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      mode: args.extractData ? 'extract' : 'assess',
      user: {
        username: creds.username,
        user_id: session.userId,
        organization_id: session.organizationId,
        instance_url: session.instanceUrl,
        login_url: session.loginUrl,
        api_version: session.apiVersion,
      },
      sobject_source: source,
      sobjects_targeted: sobjects,
      results,
      summary,
      timing_ms,
      api_calls_total: session.apiCalls,
    };

    writeJson(report, args.reportJson);
    writeMarkdown(report, args.reportMd);
    log(`Report → JSON: ${args.reportJson}`);
    log(`Report → MD:   ${args.reportMd}`);

    const runManifest = {
      status: 'ok' as const,
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      invoked_at,
      completed_at,
      params: paramsForManifest,
      artifacts: collectArtifacts(report, args),
      metrics: {
        sobjects_probed: summary.sobjects_probed,
        sobjects_accessible: summary.sobjects_accessible,
        sobjects_denied: summary.sobjects_denied,
        total_rows_visible: summary.total_rows_visible,
        total_extract_rows: summary.total_extract_rows,
        total_extract_bytes: summary.total_extract_bytes,
        api_calls: session.apiCalls,
        timing_ms,
      },
      target: {
        login_url: session.loginUrl,
        instance_url: session.instanceUrl,
        organization_id: session.organizationId,
        api_version: session.apiVersion,
      },
      credentials: { source: creds.source, source_path: creds.sourcePath },
      error: null,
    };
    process.stdout.write(JSON.stringify(runManifest) + '\n');
    return 0;
  } catch (err) {
    const completed_at = new Date().toISOString();
    const { code, message } = classifyError(err);
    const safeMessage = redactCredentials(message, creds, session?.conn.accessToken ?? undefined);
    log(`ERROR [${code}] ${safeMessage}`);

    const runManifest = {
      status: 'error' as const,
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      invoked_at,
      completed_at,
      params: paramsForManifest,
      artifacts: [] as Array<Record<string, unknown>>,
      metrics: {
        api_calls: session?.apiCalls ?? 0,
        timing_ms: Date.now() - startedMs,
      },
      target: {
        login_url: session?.loginUrl ?? args.loginUrl,
        api_version: args.apiVersion,
      },
      credentials: creds
        ? { source: creds.source, source_path: creds.sourcePath }
        : { source: 'none' },
      error: { code, message: safeMessage },
    };
    process.stdout.write(JSON.stringify(runManifest) + '\n');
    return 1;
  } finally {
    if (session) await closeSession(session);
  }
}

function summarize(results: SobjectAssessment[]): AssessmentReport['summary'] {
  const summary = {
    sobjects_probed: results.length,
    sobjects_accessible: 0,
    sobjects_denied: 0,
    total_rows_visible: 0,
    total_fields_authoritative: 0,
    total_custom_fields_authoritative: 0,
    total_extract_rows: 0,
    total_extract_bytes: 0,
    silent_field_drop_findings: 0,
  };
  for (const r of results) {
    if (r.access.granted) summary.sobjects_accessible++;
    else summary.sobjects_denied++;
    if (r.row_count) summary.total_rows_visible += r.row_count;
    if (r.describe?.granted) {
      summary.total_fields_authoritative += r.describe.field_count ?? 0;
      summary.total_custom_fields_authoritative += r.describe.custom_field_count ?? 0;
    }
    if (r.drift?.finding === 'silent-field-drop') {
      summary.silent_field_drop_findings++;
    }
    if (r.extract) {
      summary.total_extract_rows += r.extract.row_count;
      summary.total_extract_bytes += r.extract.bytes;
    }
  }
  return summary;
}

function collectArtifacts(
  report: AssessmentReport,
  args: ParsedArgs,
): Array<{ path: string; format: string; description: string }> {
  const arts: Array<{ path: string; format: string; description: string }> = [
    { path: args.reportJson, format: 'json', description: 'Machine-readable assessment report.' },
    { path: args.reportMd, format: 'markdown', description: 'Human-readable assessment report.' },
  ];
  for (const r of report.results) {
    if (r.describe?.granted && r.describe.describe_json_path)
      arts.push({
        path: r.describe.describe_json_path,
        format: 'json',
        description: `${r.sobject}: authoritative describe metadata (${r.describe.field_count} fields).`,
      });
    if (r.describe?.granted && r.describe.fields_txt_path)
      arts.push({
        path: r.describe.fields_txt_path,
        format: 'text',
        description: `${r.sobject}: sorted field-name list.`,
      });
    if (r.fields_all_sample)
      arts.push({
        path: r.fields_all_sample.sample_csv_path,
        format: 'csv',
        description: `${r.sobject}: FIELDS(ALL) LIMIT 200 sample (${r.fields_all_sample.sample_row_count} rows).`,
      });
    if (r.extract)
      arts.push({
        path: r.extract.csv_path,
        format: 'csv',
        description: `${r.sobject}: full extraction (${r.extract.row_count} rows, ${r.extract.bytes} bytes).`,
      });
  }
  return arts;
}

function classifyError(err: unknown): { code: string; message: string } {
  if (err instanceof CredentialError) return { code: err.code, message: err.message };
  if (err instanceof Error) {
    const anyErr = err as Error & { errorCode?: string };
    if (anyErr.errorCode === 'INVALID_LOGIN' || /INVALID_LOGIN/.test(err.message)) {
      return { code: 'login-failed', message: err.message };
    }
    return { code: 'runtime-error', message: err.message };
  }
  return { code: 'unknown-error', message: String(err) };
}

function log(msg: string): void {
  process.stderr.write(`[${TOOL_ID}] ${msg}\n`);
}

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`[${TOOL_ID}] FATAL: ${String(err)}\n`);
    process.exit(1);
  },
);
