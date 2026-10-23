#!/usr/bin/env -S npx tsx
/**
 * salesforce-rest-sobjects-describe — Kronos tool v0.1.0
 *
 * Tier-2 API-endpoint primitive. Fetches the authoritative metadata
 * description for one Salesforce sobject via:
 *   GET /services/data/v{apiVersion}/sobjects/{name}/describe
 *
 * This is the ground truth for what fields, relationships, record types,
 * and permissions the authenticated user can see on the sobject. Compare
 * against FIELDS(ALL) results to catch scanner drift (silent field drops).
 *
 * Standard I/O contract per tools/README.md. Params in via argv; results
 * out as files on disk + run manifest on the final line of stdout.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import jsforce from 'jsforce';

import {
  CredentialError,
  loadCredentials,
  redactCredentials,
  type SalesforceCredentials,
} from '../../_shared/salesforce/auth.ts';

const TOOL_ID = 'salesforce-rest-sobjects-describe';
const TOOL_VERSION = '0.1.0';

interface ParsedArgs {
  sobject: string;
  credentials: string;
  loginUrl: string;
  apiVersion: string;
  outputDir: string;
  output: string;
  fieldsOut: string | null;
  describe: boolean;
}

function parseCliArgs(): ParsedArgs {
  const { values } = parseArgs({
    strict: true,
    allowPositionals: false,
    options: {
      sobject: { type: 'string' },
      credentials: {
        type: 'string',
        default: '../salesforce-rest-query-csv/credentials/salesforce.json',
      },
      'login-url': { type: 'string', default: 'https://login.salesforce.com' },
      'api-version': { type: 'string', default: '64.0' },
      'output-dir': { type: 'string', default: './output' },
      output: { type: 'string' },
      'fields-out': { type: 'string' },
      describe: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false, short: 'h' },
    },
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (values.describe) {
    return {
      sobject: '',
      credentials: '',
      loginUrl: '',
      apiVersion: '',
      outputDir: '',
      output: '',
      fieldsOut: null,
      describe: true,
    };
  }

  if (!values.sobject) {
    process.stderr.write(
      `[${TOOL_ID}] --sobject is required. See --help.\n`,
    );
    process.exit(2);
  }

  const outputDir = resolve(values['output-dir']!);
  const defaultOutput = join(outputDir, `${values.sobject.toLowerCase()}-describe.json`);
  return {
    sobject: values.sobject,
    credentials: resolve(values.credentials!),
    loginUrl: values['login-url']!,
    apiVersion: values['api-version']!,
    outputDir,
    output: values.output ? resolve(values.output) : defaultOutput,
    fieldsOut: values['fields-out'] ? resolve(values['fields-out']) : null,
    describe: false,
  };
}

function printHelp(): void {
  process.stderr.write(
    [
      `${TOOL_ID} v${TOOL_VERSION}`,
      '',
      'Fetch authoritative sobject metadata via /sobjects/{name}/describe.',
      '',
      'Usage:',
      '  npx tsx src/index.ts --sobject <Name> [options]',
      '',
      'Required:',
      '  --sobject <name>          Sobject API name, e.g. "Account", "Contact", "MyCustom__c".',
      '',
      'Optional:',
      '  --output <path>           Full describe JSON output path.',
      '                            (default: <output-dir>/<sobject-lower>-describe.json)',
      '  --fields-out <path>       If set, also write plain field-name list (one per line, sorted).',
      '  --output-dir <dir>        Directory for default outputs. (default: ./output)',
      '  --credentials <path>      JSON creds file.',
      '                            (default: ../salesforce-rest-query-csv/credentials/salesforce.json)',
      '  --login-url <url>         (default: https://login.salesforce.com)',
      '  --api-version <ver>       (default: 60.0)',
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
        tier: 2,
        api_family: 'salesforce.rest',
        endpoint: '/services/data/v{apiVersion}/sobjects/{sobject}/describe',
        authorization_ceiling_max: 2,
        argv: [
          { name: 'sobject', type: 'string', required: true },
          { name: 'output', type: 'path', default: '<output-dir>/<sobject-lower>-describe.json' },
          { name: 'fields-out', type: 'path', default: null },
          { name: 'output-dir', type: 'path', default: './output' },
          { name: 'credentials', type: 'path', default: '../salesforce-rest-query-csv/credentials/salesforce.json' },
          { name: 'login-url', type: 'string', default: 'https://login.salesforce.com' },
          { name: 'api-version', type: 'string', default: '60.0' },
        ],
        outputs: [
          { name: 'describe-json', format: 'json', channel: 'file' },
          { name: 'fields-list', format: 'text', channel: 'file', description: 'Optional; one field name per line, sorted.' },
          { name: 'run-manifest', format: 'json', channel: 'stdout-final-line' },
        ],
      },
      null,
      2,
    ) + '\n',
  );
}

interface DescribeSummary {
  sobject: string;
  label: string;
  custom: boolean;
  createable: boolean;
  updateable: boolean;
  deletable: boolean;
  queryable: boolean;
  field_count: number;
  custom_field_count: number;
  compound_field_names: string[];
  child_relationship_count: number;
  record_type_count: number;
}

async function main(): Promise<number> {
  const invoked_at = new Date().toISOString();
  const args = parseCliArgs();

  if (args.describe) {
    describeTool();
    return 0;
  }

  let creds: SalesforceCredentials | null = null;
  let conn: jsforce.Connection | null = null;
  let sessionId: string | undefined;
  const paramsForManifest: Record<string, unknown> = {
    sobject: args.sobject,
    credentials: args.credentials,
    'login-url': args.loginUrl,
    'api-version': args.apiVersion,
    'output-dir': args.outputDir,
    output: args.output,
    'fields-out': args.fieldsOut,
  };

  try {
    creds = loadCredentials({
      credentialsPath: args.credentials,
      loginUrlOverride: args.loginUrl,
    });
    const effectiveLoginUrl = creds.loginUrl ?? args.loginUrl;
    log(`Logging in as ${creds.username} against ${effectiveLoginUrl}...`);
    conn = new jsforce.Connection({ loginUrl: effectiveLoginUrl, version: args.apiVersion });
    const userInfo = await conn.login(creds.username, creds.password + creds.securityToken);
    sessionId = conn.accessToken ?? undefined;
    log(`Session opened: instance=${conn.instanceUrl}, org=${userInfo.organizationId}`);

    log(`Describing sobject "${args.sobject}"...`);
    const desc: any = await conn.sobject(args.sobject).describe();

    // Write full describe JSON.
    mkdirSync(dirname(args.output), { recursive: true });
    const descJson = JSON.stringify(desc, null, 2) + '\n';
    writeFileSync(args.output, descJson, 'utf8');
    const descHash = createHash('sha256').update(descJson, 'utf8').digest('hex');
    log(`Wrote full describe → ${args.output} (${Buffer.byteLength(descJson, 'utf8').toLocaleString()} bytes)`);

    // Optional: plain field-name list.
    let fieldsFileArtifact: null | {
      path: string;
      sha256: string;
      bytes: number;
    } = null;
    const fields: Array<{ name: string; type: string; custom: boolean; compoundFieldName?: string | null }> =
      desc.fields ?? [];
    const fieldNames = fields.map((f) => f.name).sort();

    if (args.fieldsOut) {
      const listText = fieldNames.join('\n') + '\n';
      mkdirSync(dirname(args.fieldsOut), { recursive: true });
      writeFileSync(args.fieldsOut, listText, 'utf8');
      fieldsFileArtifact = {
        path: args.fieldsOut,
        sha256: createHash('sha256').update(listText, 'utf8').digest('hex'),
        bytes: Buffer.byteLength(listText, 'utf8'),
      };
      log(`Wrote field-name list → ${args.fieldsOut} (${fieldNames.length} fields)`);
    }

    // Summary metrics.
    const compoundNames = [
      ...new Set(
        fields
          .filter((f) => (f.type ?? '').toLowerCase() === 'address' || (f.type ?? '').toLowerCase() === 'location')
          .map((f) => f.name),
      ),
    ].sort();
    const summary: DescribeSummary = {
      sobject: desc.name,
      label: desc.label,
      custom: !!desc.custom,
      createable: !!desc.createable,
      updateable: !!desc.updateable,
      deletable: !!desc.deletable,
      queryable: !!desc.queryable,
      field_count: fields.length,
      custom_field_count: fields.filter((f) => f.custom).length,
      compound_field_names: compoundNames,
      child_relationship_count: (desc.childRelationships ?? []).length,
      record_type_count: (desc.recordTypeInfos ?? []).length,
    };
    log(
      `Summary: ${summary.field_count} fields (${summary.custom_field_count} custom, ` +
        `${summary.compound_field_names.length} compound), ` +
        `${summary.child_relationship_count} child relationships, ` +
        `${summary.record_type_count} record types.`,
    );

    const completed_at = new Date().toISOString();
    const artifacts = [
      {
        path: args.output,
        format: 'json',
        sha256: descHash,
        bytes: Buffer.byteLength(descJson, 'utf8'),
        description: `Full ${args.sobject} describe response from /sobjects/${args.sobject}/describe.`,
      },
    ];
    if (fieldsFileArtifact) {
      artifacts.push({
        path: fieldsFileArtifact.path,
        format: 'text',
        sha256: fieldsFileArtifact.sha256,
        bytes: fieldsFileArtifact.bytes,
        description: `Sorted field-name list (${fieldNames.length} fields), one per line.`,
      });
    }

    const runManifest = {
      status: 'ok' as const,
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      invoked_at,
      completed_at,
      params: paramsForManifest,
      artifacts,
      metrics: {
        fields: summary.field_count,
        custom_fields: summary.custom_field_count,
        compound_fields: summary.compound_field_names.length,
        child_relationships: summary.child_relationship_count,
        record_types: summary.record_type_count,
        describe_bytes: Buffer.byteLength(descJson, 'utf8'),
        api_calls: 2,
      },
      target: {
        login_url: effectiveLoginUrl,
        instance_url: conn.instanceUrl,
        organization_id: userInfo.organizationId,
        api_version: args.apiVersion,
        sobject: args.sobject,
      },
      credentials: { source: creds.source, source_path: creds.sourcePath },
      summary,
      error: null,
    };

    process.stdout.write(JSON.stringify(runManifest) + '\n');

    try {
      await conn.logout();
    } catch {
      /* best-effort */
    }
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
      metrics: { api_calls: conn ? 1 : 0 },
      target: {
        login_url: creds?.loginUrl ?? args.loginUrl,
        api_version: args.apiVersion,
        sobject: args.sobject,
      },
      credentials: creds
        ? { source: creds.source, source_path: creds.sourcePath }
        : { source: 'none' },
      error: { code, message: safe },
    };
    process.stdout.write(JSON.stringify(runManifest) + '\n');
    if (conn) {
      try {
        await conn.logout();
      } catch {
        /* best-effort */
      }
    }
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
    if (anyErr.errorCode === 'NOT_FOUND' || /NOT_FOUND/.test(err.message)) {
      return { code: 'sobject-not-found', message: err.message };
    }
    if (/INSUFFICIENT_ACCESS/.test(err.message)) {
      return { code: 'insufficient-access', message: err.message };
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
