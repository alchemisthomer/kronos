#!/usr/bin/env -S npx tsx
/**
 * salesforce-rest-user-shares — Kronos tool v0.1.0
 *
 * Enumerate the sharing grants that give one user access to records beyond
 * their explicit ObjectPermissions: role hierarchy (self + parents +
 * subordinates), direct group memberships (by type: Regular / Queue / Role
 * / RoleAndSubordinates / etc.), and per-sobject *Share rows granting to
 * either the user or any group they're a member of.
 *
 * Read-only. Sharing rule DEFINITIONS live in Setup metadata (Metadata
 * API); this tool sees the MATERIALIZED shares in the *Share sobjects,
 * which is the REST-queryable answer to "what shares affect this user".
 *
 * Standard I/O contract per tools/README.md.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  CredentialError, loadCredentials, redactCredentials,
  type SalesforceCredentials,
} from '../../_shared/salesforce/auth.ts';
import { toCsv } from '../../_shared/salesforce/csv.ts';
import { analyzeUserShares } from './analyze.ts';
import {
  DEFAULT_SHARE_SAMPLE_LIMIT, DEFAULT_SHARE_SOBJECTS,
  closeSession, openSession, queryAllRoles, queryGroupMemberships,
  querySharesForSobject, queryUser, type Session,
} from './query.ts';
import { renderMarkdown } from './report.ts';

const TOOL_ID = 'salesforce-rest-user-shares';
const TOOL_VERSION = '0.1.0';

interface ParsedArgs {
  userId: string | null;
  sobjects: string[];
  sampleLimit: number;
  credentials: string;
  loginUrl: string;
  apiVersion: string;
  outputDir: string;
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
      sobjects: { type: 'string' },
      'sample-limit': { type: 'string' },
      credentials: {
        type: 'string',
        default: '../salesforce-rest-query-csv/credentials/salesforce.json',
      },
      'login-url': { type: 'string', default: 'https://login.salesforce.com' },
      'api-version': { type: 'string', default: '64.0' },
      'output-dir': { type: 'string', default: './output' },
      'analysis-json': { type: 'string' },
      'analysis-md': { type: 'string' },
      describe: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false, short: 'h' },
    },
  });

  if (values.help) { printHelp(); process.exit(0); }
  if (values.describe) {
    return {
      userId: null, sobjects: [], sampleLimit: DEFAULT_SHARE_SAMPLE_LIMIT,
      credentials: '', loginUrl: '', apiVersion: '', outputDir: '',
      analysisJsonOut: '', analysisMdOut: '', describe: true,
    };
  }
  if (!values['user-id']) {
    process.stderr.write(`[${TOOL_ID}] --user-id is required. See --help.\n`);
    process.exit(2);
  }

  const sobjects = values.sobjects
    ? values.sobjects.split(',').map((s) => s.trim()).filter(Boolean)
    : [...DEFAULT_SHARE_SOBJECTS];
  const sampleLimit = values['sample-limit'] ? Number(values['sample-limit']) : DEFAULT_SHARE_SAMPLE_LIMIT;
  const outputDir = resolve(values['output-dir']!);
  const slug = values['user-id']!.toLowerCase();
  return {
    userId: values['user-id']!,
    sobjects,
    sampleLimit,
    credentials: resolve(values.credentials!),
    loginUrl: values['login-url']!,
    apiVersion: values['api-version']!,
    outputDir,
    analysisJsonOut: values['analysis-json']
      ? resolve(values['analysis-json'])
      : join(outputDir, `user-${slug}-shares-analysis.json`),
    analysisMdOut: values['analysis-md']
      ? resolve(values['analysis-md'])
      : join(outputDir, `user-${slug}-shares-analysis.md`),
    describe: false,
  };
}

function printHelp(): void {
  process.stderr.write(
    [
      `${TOOL_ID} v${TOOL_VERSION}`,
      '',
      'Enumerate the sharing grants that give this user access to records beyond ObjectPermissions.',
      '',
      'Usage:',
      '  npx tsx src/index.ts --user-id <id> [options]',
      '',
      'Required:',
      '  --user-id <id>            Target Salesforce user Id (15 or 18 chars, starts with 005).',
      '',
      'Optional:',
      '  --sobjects <csv>          Sobjects to probe for shares (default: Account,Contact,Lead,Opportunity,Case).',
      '  --sample-limit <n>        Cap rows per sobject share query (default: 2000).',
      '  --credentials <path>      (default: ../salesforce-rest-query-csv/credentials/salesforce.json)',
      '  --login-url <url>         (default: https://login.salesforce.com)',
      '  --api-version <ver>       (default: 64.0)',
      '  --output-dir <dir>        (default: ./output)',
      '  --analysis-json <path>    (default: <output-dir>/user-<slug>-shares-analysis.json)',
      '  --analysis-md <path>      (default: <output-dir>/user-<slug>-shares-analysis.md)',
      '  --describe                Print tool metadata as JSON and exit.',
      '  -h, --help                Show this help.',
      '',
    ].join('\n'),
  );
}

function describeTool(): void {
  process.stdout.write(JSON.stringify({
    tool: TOOL_ID,
    tool_version: TOOL_VERSION,
    binding_layer: 1,
    tier: 2,
    api_family: 'salesforce.rest',
    endpoint: '/services/data/v{apiVersion}/query',
    sobjects_queried: [
      'User', 'UserRole', 'GroupMember (+ Group)',
      '<default: AccountShare, ContactShare, LeadShare, OpportunityShare, CaseShare>',
    ],
    authorization_ceiling_max: 2,
    argv: [
      { name: 'user-id', type: 'string', required: true },
      { name: 'sobjects', type: 'csv', default: DEFAULT_SHARE_SOBJECTS.join(',') },
      { name: 'sample-limit', type: 'number', default: DEFAULT_SHARE_SAMPLE_LIMIT },
      { name: 'credentials', type: 'path' },
      { name: 'login-url', type: 'string', default: 'https://login.salesforce.com' },
      { name: 'api-version', type: 'string', default: '64.0' },
      { name: 'output-dir', type: 'path', default: './output' },
      { name: 'analysis-json', type: 'path' },
      { name: 'analysis-md', type: 'path' },
    ],
    outputs: [
      { name: 'user-record', format: 'csv', channel: 'file' },
      { name: 'all-roles', format: 'csv', channel: 'file' },
      { name: 'group-memberships', format: 'csv', channel: 'file' },
      { name: '<sobject>-shares-sampled', format: 'csv', channel: 'file' },
      { name: 'analysis-json', format: 'json', channel: 'file' },
      { name: 'analysis-md', format: 'markdown', channel: 'file' },
      { name: 'run-manifest', format: 'json', channel: 'stdout-final-line' },
    ],
    analysis_dimensions: [
      'role-hierarchy (ascending chain + subordinate role Ids)',
      'group-memberships (direct + by type)',
      'sobject-shares (per-sobject count + RowCause + AccessLevel + recipient-kind breakdown)',
      'totals',
      'anomalies (7 heuristics: deep-role-parent-chain, broad-subordinate-visibility,'
        + ' high-group-membership-count, org-wide-group-membership, manual-share-heavy,'
        + ' share-sample-truncated, full-access-shares-broad)',
    ],
  }, null, 2) + '\n');
}

async function main(): Promise<number> {
  const invoked_at = new Date().toISOString();
  const args = parseCliArgs();
  if (args.describe) { describeTool(); return 0; }

  const paramsForManifest: Record<string, unknown> = {
    'user-id': args.userId,
    sobjects: args.sobjects,
    'sample-limit': args.sampleLimit,
    credentials: args.credentials,
    'login-url': args.loginUrl,
    'api-version': args.apiVersion,
    'output-dir': args.outputDir,
    'analysis-json': args.analysisJsonOut,
    'analysis-md': args.analysisMdOut,
  };

  let creds: SalesforceCredentials | null = null;
  let session: Session | null = null;

  try {
    creds = loadCredentials({ credentialsPath: args.credentials, loginUrlOverride: args.loginUrl });
    const effectiveLoginUrl = creds.loginUrl ?? args.loginUrl;
    log(`Logging in as ${creds.username} against ${effectiveLoginUrl}...`);
    session = await openSession(creds, effectiveLoginUrl, args.apiVersion);
    log(`Session: instance=${session.instanceUrl}, org=${session.organizationId}, caller=${session.callerUserId}`);

    // Q1: user
    log(`Querying User ${args.userId}...`);
    const userRow = await queryUser(session, args.userId!);
    if (!userRow) throw new Error(`No User found with Id ${args.userId}.`);

    // Q2: all roles (for hierarchy traversal)
    log(`Querying UserRole (all)...`);
    const allRoles = await queryAllRoles(session);
    log(`  ${allRoles.length} role(s) in org.`);

    // Q3: user's direct GroupMember rows
    log(`Querying GroupMember for user...`);
    const groupMemberships = await queryGroupMemberships(session, args.userId!);
    log(`  ${groupMemberships.length} direct group membership(s).`);

    // Recipient ids = user + all group ids they're in
    const groupIds = groupMemberships
      .map((g) => String(g['GroupId'] ?? ''))
      .filter(Boolean);
    const recipientIds = [args.userId!, ...groupIds];
    log(`  recipient-id set for share queries: ${recipientIds.length}`);

    // Q4..N: per-sobject share queries
    const sharesBySobject = new Map<string, Record<string, unknown>[]>();
    for (const sobject of args.sobjects) {
      log(`Querying ${sobject}Share (recipients=${recipientIds.length}, limit=${args.sampleLimit})...`);
      const rows = await querySharesForSobject(session, sobject, recipientIds, args.sampleLimit);
      log(`  ${rows.length} share row(s) for ${sobject}.`);
      sharesBySobject.set(sobject, rows);
    }

    // Analyze
    const analysis = analyzeUserShares({
      userRow, allRoles, groupMemberships, sharesBySobject,
      shareSampleLimit: args.sampleLimit,
    });
    log(
      `Analysis: role-chain=${analysis.role_hierarchy.chain_depth}, ` +
      `subordinates=${analysis.role_hierarchy.subordinate_count}, ` +
      `groups=${analysis.groups.direct_memberships.length}, ` +
      `shares=${analysis.totals.total_share_rows}, ` +
      `anomalies=${analysis.anomalies.length}`,
    );

    // Write per-source raw CSVs.
    mkdirSync(args.outputDir, { recursive: true });
    const slug = args.userId!.toLowerCase();
    const artifacts: Array<Record<string, unknown>> = [];
    const writeArtifact = (name: string, filename: string, content: string, description: string, format = 'csv'): void => {
      const path = join(args.outputDir, filename);
      writeFileSync(path, content, 'utf8');
      artifacts.push({
        path, format,
        sha256: createHash('sha256').update(content, 'utf8').digest('hex'),
        bytes: Buffer.byteLength(content, 'utf8'),
        description,
      });
    };

    writeArtifact('user-record', `user-${slug}-user.csv`, toCsv([userRow]), 'Target user record.');
    writeArtifact('all-roles', `user-${slug}-all-roles.csv`, toCsv(allRoles), `All UserRole records in org (${allRoles.length}).`);
    writeArtifact('group-memberships', `user-${slug}-group-memberships.csv`, toCsv(groupMemberships), `Direct GroupMember rows for user (${groupMemberships.length}).`);
    for (const [sobject, rows] of sharesBySobject.entries()) {
      writeArtifact(
        `${sobject.toLowerCase()}-shares`,
        `user-${slug}-${sobject.toLowerCase()}-shares.csv`,
        toCsv(rows),
        `${sobject}Share rows sampled (${rows.length}).`,
      );
    }

    // Analysis JSON + MD
    const analysisJson = JSON.stringify(analysis, null, 2) + '\n';
    mkdirSync(dirname(args.analysisJsonOut), { recursive: true });
    writeFileSync(args.analysisJsonOut, analysisJson, 'utf8');
    artifacts.push({
      path: args.analysisJsonOut, format: 'json',
      sha256: createHash('sha256').update(analysisJson, 'utf8').digest('hex'),
      bytes: Buffer.byteLength(analysisJson, 'utf8'),
      description: 'Structured shares analysis (dashboard-consumable).',
    });

    const analysisMd = renderMarkdown(analysis, {
      tool: TOOL_ID, tool_version: TOOL_VERSION,
      generated_at: new Date().toISOString(),
      organization_id: session.organizationId,
      instance_url: session.instanceUrl,
      api_version: args.apiVersion,
    });
    mkdirSync(dirname(args.analysisMdOut), { recursive: true });
    writeFileSync(args.analysisMdOut, analysisMd, 'utf8');
    artifacts.push({
      path: args.analysisMdOut, format: 'markdown',
      sha256: createHash('sha256').update(analysisMd, 'utf8').digest('hex'),
      bytes: Buffer.byteLength(analysisMd, 'utf8'),
      description: 'Human-readable shares analysis.',
    });

    log(`Wrote ${artifacts.length} artifact(s).`);

    const runManifest = {
      status: 'ok' as const,
      tool: TOOL_ID, tool_version: TOOL_VERSION,
      invoked_at, completed_at: new Date().toISOString(),
      params: paramsForManifest,
      artifacts,
      metrics: {
        api_calls: session.apiCalls,
        role_chain_depth: analysis.totals.role_chain_depth,
        subordinate_role_count: analysis.totals.subordinate_role_count,
        direct_group_count: analysis.totals.direct_group_count,
        total_share_rows: analysis.totals.total_share_rows,
        total_unique_records_shared: analysis.totals.total_unique_records_shared,
        anomaly_count: analysis.anomalies.length,
      },
      target: {
        login_url: session.loginUrl,
        instance_url: session.instanceUrl,
        organization_id: session.organizationId,
        api_version: session.apiVersion,
        target_user_id: args.userId,
        caller_user_id: session.callerUserId,
      },
      credentials: { source: creds.source, source_path: creds.sourcePath },
      error: null,
    };
    process.stdout.write(JSON.stringify(runManifest) + '\n');
    return 0;
  } catch (err) {
    const completed_at = new Date().toISOString();
    const { code, message } = classifyError(err);
    const safe = redactCredentials(message, creds, session?.conn.accessToken ?? undefined);
    log(`ERROR [${code}] ${safe}`);
    process.stdout.write(JSON.stringify({
      status: 'error' as const,
      tool: TOOL_ID, tool_version: TOOL_VERSION,
      invoked_at, completed_at,
      params: paramsForManifest,
      artifacts: [] as Array<Record<string, unknown>>,
      metrics: { api_calls: session?.apiCalls ?? 0 },
      target: {
        login_url: creds?.loginUrl ?? args.loginUrl,
        api_version: args.apiVersion,
        target_user_id: args.userId,
      },
      credentials: creds ? { source: creds.source, source_path: creds.sourcePath } : { source: 'none' },
      error: { code, message: safe },
    }) + '\n');
    return 1;
  } finally {
    if (session) await closeSession(session);
  }
}

function classifyError(err: unknown): { code: string; message: string } {
  if (err instanceof CredentialError) return { code: err.code, message: err.message };
  if (err instanceof Error) {
    const anyErr = err as Error & { errorCode?: string };
    if (anyErr.errorCode === 'INVALID_LOGIN' || /INVALID_LOGIN/.test(err.message)) return { code: 'login-failed', message: err.message };
    if (/INSUFFICIENT_ACCESS/.test(err.message)) return { code: 'insufficient-access', message: err.message };
    if (anyErr.errorCode === 'MALFORMED_QUERY' || /MALFORMED_QUERY/.test(err.message)) return { code: 'query-malformed', message: err.message };
    return { code: 'runtime-error', message: err.message };
  }
  return { code: 'unknown-error', message: String(err) };
}

function log(msg: string): void { process.stderr.write(`[${TOOL_ID}] ${msg}\n`); }

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`[${TOOL_ID}] FATAL: ${String(err)}\n`);
    process.exit(1);
  },
);
