#!/usr/bin/env -S npx tsx
/**
 * salesforce-rest-user-loginhistory — Kronos tool v0.1.0
 *
 * Query the LoginHistory sobject for one Salesforce user (or all users)
 * and derive an analysis: timeline, source-IP diversity, geographic
 * distribution, channel breakdown, burst-pattern detection, weak-TLS,
 * off-hours prevalence, and cross-country logins.
 *
 * Tier-2 API-endpoint primitive with tier-3 analysis attached. Read-only.
 *
 * NOTE: requires the querying user to have "Manage Users" or equivalent
 * permission to read LoginHistory for other users. A regular user can
 * typically only read their own login history.
 *
 * Standard I/O contract per tools/README.md.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  CredentialError,
  loadCredentials,
  redactCredentials,
  type SalesforceCredentials,
} from '../../_shared/salesforce/auth.ts';
import { analyzeLoginHistory } from './analyze.ts';
import { toCsv } from '../../_shared/salesforce/csv.ts';
import { queryLoginHistory } from './query.ts';
import { renderMarkdown } from './report.ts';

const TOOL_ID = 'salesforce-rest-user-loginhistory';
const TOOL_VERSION = '0.1.0';

interface ParsedArgs {
  userId: string | null;
  since: string | null;
  until: string | null;
  limit: number | null;
  credentials: string;
  loginUrl: string;
  apiVersion: string;
  outputDir: string;
  csvOut: string;
  analysisJsonOut: string;
  analysisMdOut: string;
  describe: boolean;
}

function parseCliArgs(): ParsedArgs {
  const { values } = parseArgs({
    strict: true,
    allowPositionals: false,
    options: {
      'user-id': { type: 'string' },
      since: { type: 'string' },
      until: { type: 'string' },
      limit: { type: 'string' },
      credentials: {
        type: 'string',
        default: '../salesforce-rest-query-csv/credentials/salesforce.json',
      },
      'login-url': { type: 'string', default: 'https://login.salesforce.com' },
      'api-version': { type: 'string', default: '64.0' },
      'output-dir': { type: 'string', default: './output' },
      'csv-out': { type: 'string' },
      'analysis-json': { type: 'string' },
      'analysis-md': { type: 'string' },
      describe: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false, short: 'h' },
    },
  });

  if (values.help) { printHelp(); process.exit(0); }
  if (values.describe) {
    return {
      userId: null, since: null, until: null, limit: null,
      credentials: '', loginUrl: '', apiVersion: '',
      outputDir: '', csvOut: '', analysisJsonOut: '', analysisMdOut: '',
      describe: true,
    };
  }

  const outputDir = resolve(values['output-dir']!);
  const slug = values['user-id'] ? values['user-id'].toLowerCase() : 'all-users';
  return {
    userId: values['user-id'] ?? null,
    since: values.since ?? null,
    until: values.until ?? null,
    limit: values.limit ? Number(values.limit) : null,
    credentials: resolve(values.credentials!),
    loginUrl: values['login-url']!,
    apiVersion: values['api-version']!,
    outputDir,
    csvOut: values['csv-out']
      ? resolve(values['csv-out'])
      : join(outputDir, `loginhistory-${slug}.csv`),
    analysisJsonOut: values['analysis-json']
      ? resolve(values['analysis-json'])
      : join(outputDir, `loginhistory-${slug}-analysis.json`),
    analysisMdOut: values['analysis-md']
      ? resolve(values['analysis-md'])
      : join(outputDir, `loginhistory-${slug}-analysis.md`),
    describe: false,
  };
}

function printHelp(): void {
  process.stderr.write(
    [
      `${TOOL_ID} v${TOOL_VERSION}`,
      '',
      'Query Salesforce LoginHistory + derive analysis (IPs, geos, TLS, anomalies).',
      '',
      'Usage:',
      '  npx tsx src/index.ts [--user-id <id>] [options]',
      '',
      'Scope (target subset):',
      '  --user-id <18-char id>   Restrict to one user. Omit to query all users (requires admin perms).',
      '  --since <ISO 8601>       Only LoginTime >= this instant. Example: 2026-06-01T00:00:00Z',
      '  --until <ISO 8601>       Only LoginTime < this instant.',
      '  --limit <n>              Row cap. Default: unbounded (follows nextRecordsUrl).',
      '',
      'Connection:',
      '  --credentials <path>     JSON creds file (default: ../salesforce-rest-query-csv/credentials/salesforce.json)',
      '  --login-url <url>        (default: https://login.salesforce.com)',
      '  --api-version <ver>      (default: 64.0)',
      '',
      'Output:',
      '  --output-dir <dir>       (default: ./output)',
      '  --csv-out <path>         (default: <output-dir>/loginhistory-<user-slug>.csv)',
      '  --analysis-json <path>   (default: <output-dir>/loginhistory-<user-slug>-analysis.json)',
      '  --analysis-md <path>     (default: <output-dir>/loginhistory-<user-slug>-analysis.md)',
      '',
      '  --describe               Print tool metadata as JSON and exit.',
      '  -h, --help               Show this help.',
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
        tier: 2,
        api_family: 'salesforce.rest',
        endpoint: '/services/data/v{apiVersion}/query (LoginHistory sobject)',
        authorization_ceiling_max: 2,
        argv: [
          { name: 'user-id', type: 'string', required: false, description: 'Restrict to one user; omit for org-wide.' },
          { name: 'since', type: 'string', required: false, description: 'ISO 8601 lower bound for LoginTime.' },
          { name: 'until', type: 'string', required: false, description: 'ISO 8601 upper bound for LoginTime.' },
          { name: 'limit', type: 'number', required: false, description: 'Row cap; default unbounded.' },
          { name: 'credentials', type: 'path' },
          { name: 'login-url', type: 'string', default: 'https://login.salesforce.com' },
          { name: 'api-version', type: 'string', default: '64.0' },
          { name: 'output-dir', type: 'path', default: './output' },
          { name: 'csv-out', type: 'path' },
          { name: 'analysis-json', type: 'path' },
          { name: 'analysis-md', type: 'path' },
        ],
        outputs: [
          { name: 'loginhistory-csv', format: 'csv', channel: 'file' },
          { name: 'analysis-json', format: 'json', channel: 'file' },
          { name: 'analysis-md', format: 'markdown', channel: 'file' },
          { name: 'run-manifest', format: 'json', channel: 'stdout-final-line' },
        ],
        analysis_dimensions: [
          'window (earliest/latest/span)',
          'outcomes (success vs failure by status)',
          'identities (per-user login count)',
          'network (source IPs + /24 prefixes)',
          'geography (countries + cities)',
          'channel (login type, api type, TLS, application, UI-vs-API ratio)',
          'patterns (off-hours, burst intervals, per-hour histogram)',
          'anomalies (heuristic: multi-country, IP diversity, bursts, failure rate, off-hours prevalence, weak TLS)',
        ],
      },
      null,
      2,
    ) + '\n',
  );
}

async function main(): Promise<number> {
  const invoked_at = new Date().toISOString();
  const args = parseCliArgs();

  if (args.describe) { describeTool(); return 0; }

  const paramsForManifest: Record<string, unknown> = {
    'user-id': args.userId,
    since: args.since,
    until: args.until,
    limit: args.limit,
    credentials: args.credentials,
    'login-url': args.loginUrl,
    'api-version': args.apiVersion,
    'output-dir': args.outputDir,
    'csv-out': args.csvOut,
    'analysis-json': args.analysisJsonOut,
    'analysis-md': args.analysisMdOut,
  };

  let creds: SalesforceCredentials | null = null;
  let sessionId: string | undefined;

  try {
    creds = loadCredentials({
      credentialsPath: args.credentials,
      loginUrlOverride: args.loginUrl,
    });
    const effectiveLoginUrl = creds.loginUrl ?? args.loginUrl;
    log(`Logging in as ${creds.username} against ${effectiveLoginUrl}...`);

    const result = await queryLoginHistory({
      credentials: creds,
      loginUrl: effectiveLoginUrl,
      apiVersion: args.apiVersion,
      userId: args.userId ?? undefined,
      sinceIso: args.since ?? undefined,
      untilIso: args.until ?? undefined,
      limit: args.limit,
    });
    sessionId = result.sessionId;

    log(`SOQL: ${result.soql}`);
    log(`Returned ${result.records.length} record(s) (totalSize=${result.totalSize}, apiCalls=${result.apiCalls}, instance=${result.instanceUrl}).`);

    // Write CSV.
    const csv = toCsv(result.records);
    mkdirSync(dirname(args.csvOut), { recursive: true });
    writeFileSync(args.csvOut, csv, 'utf8');
    const csvHash = createHash('sha256').update(csv, 'utf8').digest('hex');
    log(`CSV → ${args.csvOut}`);

    // Analyze.
    const analysis = analyzeLoginHistory(result.records);
    log(
      `Analysis: ${analysis.identities.unique_user_count} user(s), ` +
      `${analysis.network.unique_source_ip_count} IP(s), ` +
      `${analysis.geography.unique_country_count} countr${analysis.geography.unique_country_count === 1 ? 'y' : 'ies'}, ` +
      `${analysis.anomalies.length} anomal${analysis.anomalies.length === 1 ? 'y' : 'ies'}.`,
    );

    const analysisJson = JSON.stringify(analysis, null, 2) + '\n';
    mkdirSync(dirname(args.analysisJsonOut), { recursive: true });
    writeFileSync(args.analysisJsonOut, analysisJson, 'utf8');
    const analysisJsonHash = createHash('sha256').update(analysisJson, 'utf8').digest('hex');
    log(`Analysis JSON → ${args.analysisJsonOut}`);

    const analysisMd = renderMarkdown(analysis, {
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      generated_at: new Date().toISOString(),
      target_user_id: args.userId,
      organization_id: result.organizationId,
      instance_url: result.instanceUrl,
      soql: result.soql,
      api_version: args.apiVersion,
    });
    mkdirSync(dirname(args.analysisMdOut), { recursive: true });
    writeFileSync(args.analysisMdOut, analysisMd, 'utf8');
    const analysisMdHash = createHash('sha256').update(analysisMd, 'utf8').digest('hex');
    log(`Analysis MD → ${args.analysisMdOut}`);

    const completed_at = new Date().toISOString();
    const runManifest = {
      status: 'ok' as const,
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      invoked_at,
      completed_at,
      params: paramsForManifest,
      artifacts: [
        {
          path: args.csvOut,
          format: 'csv',
          sha256: csvHash,
          bytes: Buffer.byteLength(csv, 'utf8'),
          description: `LoginHistory raw records (${result.records.length} rows).`,
        },
        {
          path: args.analysisJsonOut,
          format: 'json',
          sha256: analysisJsonHash,
          bytes: Buffer.byteLength(analysisJson, 'utf8'),
          description: 'Derived analysis (structured, dashboard-consumable).',
        },
        {
          path: args.analysisMdOut,
          format: 'markdown',
          sha256: analysisMdHash,
          bytes: Buffer.byteLength(analysisMd, 'utf8'),
          description: 'Derived analysis (human-readable).',
        },
      ],
      metrics: {
        records: result.records.length,
        totalSize: result.totalSize,
        api_calls: result.apiCalls,
        unique_users: analysis.identities.unique_user_count,
        unique_ips: analysis.network.unique_source_ip_count,
        unique_countries: analysis.geography.unique_country_count,
        anomaly_count: analysis.anomalies.length,
      },
      target: {
        login_url: effectiveLoginUrl,
        instance_url: result.instanceUrl,
        organization_id: result.organizationId,
        api_version: args.apiVersion,
        target_user_id: args.userId,
      },
      credentials: { source: creds.source, source_path: creds.sourcePath },
      error: null,
    };

    process.stdout.write(JSON.stringify(runManifest) + '\n');
    return 0;
  } catch (err) {
    const completed_at = new Date().toISOString();
    const { code, message } = classifyError(err);
    const safe = redactCredentials(message, creds, sessionId);
    log(`ERROR [${code}] ${safe}`);

    const runManifest = {
      status: 'error' as const,
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      invoked_at,
      completed_at,
      params: paramsForManifest,
      artifacts: [] as Array<Record<string, unknown>>,
      metrics: {},
      target: {
        login_url: creds?.loginUrl ?? args.loginUrl,
        api_version: args.apiVersion,
        target_user_id: args.userId,
      },
      credentials: creds
        ? { source: creds.source, source_path: creds.sourcePath }
        : { source: 'none' },
      error: { code, message: safe },
    };
    process.stdout.write(JSON.stringify(runManifest) + '\n');
    return 1;
  }
}

function classifyError(err: unknown): { code: string; message: string } {
  if (err instanceof CredentialError) return { code: err.code, message: err.message };
  if (err instanceof Error) {
    const anyErr = err as Error & { errorCode?: string };
    if (anyErr.errorCode === 'INVALID_LOGIN' || /INVALID_LOGIN/.test(err.message)) {
      return { code: 'login-failed', message: err.message };
    }
    if (/INSUFFICIENT_ACCESS/.test(err.message)) {
      return { code: 'insufficient-access-for-loginhistory', message: err.message };
    }
    if (anyErr.errorCode === 'MALFORMED_QUERY' || /MALFORMED_QUERY/.test(err.message)) {
      return { code: 'query-malformed', message: err.message };
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
