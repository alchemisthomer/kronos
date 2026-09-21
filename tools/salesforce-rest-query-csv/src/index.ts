#!/usr/bin/env -S npx tsx
/**
 * salesforce-rest-query-csv — Kronos tool v0.1.0
 *
 * Params in: CLI argv (see manifest.yaml `invocation.argv`).
 * Results out:
 *   - CSV artifact written to --output path.
 *   - Run manifest JSON printed as the FINAL line of stdout.
 *   - Human-readable logs to stderr.
 * See tools/README.md §Standard I/O contract.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  CredentialError,
  loadCredentials,
  redactCredentials,
  type SalesforceCredentials,
} from './auth.ts';
import { toCsv } from './csv.ts';
import { runQuery } from './query.ts';
import {
  fileBytes,
  sha256File,
  sha256String,
  type RunManifest,
  type RunManifestArtifact,
} from './run-manifest.ts';

const TOOL_ID = 'salesforce-rest-query-csv';
const TOOL_VERSION = '0.1.0';

interface ParsedArgs {
  query: string;
  output: string;
  credentials: string;
  loginUrl: string;
  apiVersion: string;
  manifestOut: string | null;
  describe: boolean;
}

function parseCliArgs(): ParsedArgs {
  const { values } = parseArgs({
    strict: true,
    allowPositionals: false,
    options: {
      query: { type: 'string', default: 'SELECT FIELDS(ALL) FROM Account LIMIT 200' },
      output: { type: 'string', default: './output/query.csv' },
      credentials: { type: 'string', default: './credentials/salesforce.json' },
      'login-url': { type: 'string', default: 'https://login.salesforce.com' },
      'api-version': { type: 'string', default: '64.0' },
      'manifest-out': { type: 'string' },
      describe: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false, short: 'h' },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  return {
    query: values.query!,
    output: resolve(values.output!),
    credentials: resolve(values.credentials!),
    loginUrl: values['login-url']!,
    apiVersion: values['api-version']!,
    manifestOut: values['manifest-out'] ? resolve(values['manifest-out']) : null,
    describe: values.describe === true,
  };
}

function printHelp(): void {
  process.stderr.write(
    [
      `${TOOL_ID} v${TOOL_VERSION}`,
      '',
      'Execute a SOQL statement against Salesforce REST /query and write CSV.',
      '',
      'Usage:',
      '  npx tsx src/index.ts [options]',
      '',
      'Options:',
      '  --query <soql>            SOQL statement.',
      '                            (default: "SELECT FIELDS(ALL) FROM Account LIMIT 200")',
      '  --output <path>           CSV output path. (default: ./output/query.csv)',
      '  --credentials <path>      JSON creds file. (default: ./credentials/salesforce.json)',
      '  --login-url <url>         (default: https://login.salesforce.com)',
      '  --api-version <ver>       (default: 60.0)',
      '  --manifest-out <path>     Optional: also write run manifest to this file.',
      '  --describe                Print tool metadata as JSON and exit.',
      '  -h, --help                Show this help.',
      '',
      'Credentials JSON schema:',
      '  { "username": "...", "password": "...", "securityToken": "...", "loginUrl"?: "..." }',
      '',
      'Env fallback (used only if the credentials file is absent):',
      '  KRONOS_SF_USERNAME, KRONOS_SF_PASSWORD, KRONOS_SF_SECURITY_TOKEN, KRONOS_SF_LOGIN_URL',
      '',
    ].join('\n'),
  );
}

function describeTool(): void {
  const description = {
    tool: TOOL_ID,
    tool_version: TOOL_VERSION,
    binding_layer: 1,
    api_family: 'salesforce.rest',
    endpoint: '/services/data/v{apiVersion}/query',
    authorization_ceiling_max: 2,
    argv: [
      { name: 'query', type: 'string', default: 'SELECT FIELDS(ALL) FROM Account LIMIT 200' },
      { name: 'output', type: 'path', default: './output/query.csv' },
      { name: 'credentials', type: 'path', default: './credentials/salesforce.json' },
      { name: 'login-url', type: 'string', default: 'https://login.salesforce.com' },
      { name: 'api-version', type: 'string', default: '60.0' },
      { name: 'manifest-out', type: 'path', default: null },
    ],
    outputs: [
      { name: 'csv-recordset', format: 'csv', channel: 'file' },
      { name: 'run-manifest', format: 'json', channel: 'stdout' },
    ],
  };
  process.stdout.write(JSON.stringify(description, null, 2) + '\n');
}

async function main(): Promise<number> {
  const invoked_at = new Date().toISOString();
  const args = parseCliArgs();

  if (args.describe) {
    describeTool();
    return 0;
  }

  const params: Record<string, unknown> = {
    query: args.query,
    output: args.output,
    credentials: args.credentials,
    'login-url': args.loginUrl,
    'api-version': args.apiVersion,
    'manifest-out': args.manifestOut,
  };

  let creds: SalesforceCredentials | null = null;
  let sessionId: string | undefined;

  try {
    creds = loadCredentials({
      credentialsPath: args.credentials,
      loginUrlOverride: args.loginUrl,
    });

    const effectiveLoginUrl = creds.loginUrl ?? args.loginUrl;

    log(`Logging in as ${creds.username} against ${effectiveLoginUrl} (creds: ${creds.source}).`);

    const result = await runQuery({
      credentials: creds,
      loginUrl: effectiveLoginUrl,
      apiVersion: args.apiVersion,
      soql: args.query,
    });
    sessionId = result.sessionId;

    log(
      `Query returned ${result.records.length} record(s) ` +
        `(totalSize=${result.totalSize}, apiCalls=${result.apiCalls}, instance=${result.instanceUrl}).`,
    );

    const csv = toCsv(result.records);
    mkdirSync(dirname(args.output), { recursive: true });
    writeFileSync(args.output, csv, 'utf8');

    const csvHash = sha256File(args.output);
    const artifacts: RunManifestArtifact[] = [
      {
        path: args.output,
        format: 'csv',
        sha256: csvHash.sha256,
        bytes: csvHash.bytes,
        description: 'SOQL result set as CSV. Column set is the union of all record keys.',
      },
    ];

    const completed_at = new Date().toISOString();
    const manifest: RunManifest = {
      status: 'ok',
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      invoked_at,
      completed_at,
      params,
      artifacts,
      metrics: {
        records: result.records.length,
        totalSize: result.totalSize,
        api_calls: result.apiCalls,
        csv_bytes: csvHash.bytes,
      },
      target: {
        login_url: effectiveLoginUrl,
        instance_url: result.instanceUrl,
        organization_id: result.organizationId,
        api_version: args.apiVersion,
      },
      credentials: {
        source: creds.source,
        source_path: creds.sourcePath,
      },
      error: null,
    };

    if (args.manifestOut) {
      mkdirSync(dirname(args.manifestOut), { recursive: true });
      writeFileSync(args.manifestOut, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      log(`Run manifest also written to ${args.manifestOut}.`);
    }

    // Standard-I/O contract: final line of stdout is the run-manifest JSON.
    process.stdout.write(JSON.stringify(manifest) + '\n');
    return 0;
  } catch (err) {
    const completed_at = new Date().toISOString();
    const { code, message } = classifyError(err);
    const safeMessage = redactCredentials(message, creds, sessionId);

    log(`ERROR [${code}] ${safeMessage}`);

    const manifest: RunManifest = {
      status: 'error',
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      invoked_at,
      completed_at,
      params,
      artifacts: [],
      metrics: {},
      target: {
        login_url: creds?.loginUrl ?? args.loginUrl,
        api_version: args.apiVersion,
      },
      credentials: creds
        ? { source: creds.source, source_path: creds.sourcePath }
        : { source: 'none' },
      error: { code, message: safeMessage },
    };

    process.stdout.write(JSON.stringify(manifest) + '\n');
    return 1;
  }
}

function classifyError(err: unknown): { code: string; message: string } {
  if (err instanceof CredentialError) return { code: err.code, message: err.message };
  if (err instanceof Error) {
    const anyErr = err as Error & { errorCode?: string; name?: string };
    if (anyErr.errorCode === 'INVALID_LOGIN' || /INVALID_LOGIN/.test(err.message)) {
      return { code: 'login-failed', message: err.message };
    }
    if (anyErr.errorCode === 'MALFORMED_QUERY' || /MALFORMED_QUERY/.test(err.message)) {
      return { code: 'query-malformed', message: err.message };
    }
    if (anyErr.errorCode === 'INSUFFICIENT_ACCESS' || /INSUFFICIENT_ACCESS/.test(err.message)) {
      return { code: 'insufficient-access', message: err.message };
    }
    return { code: 'runtime-error', message: err.message };
  }
  return { code: 'unknown-error', message: String(err) };
}

function log(msg: string): void {
  process.stderr.write(`[${TOOL_ID}] ${msg}\n`);
}

// Fingerprint the tool artifact identity so future orchestrator can attest.
void sha256String; // keep import used; will be referenced when we hash source-tree at build time
void fileBytes;

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`[${TOOL_ID}] FATAL: ${String(err)}\n`);
    process.exit(1);
  },
);
