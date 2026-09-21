#!/usr/bin/env -S npx tsx
/**
 * salesforce-rest-user-permissions — Kronos tool v0.1.0
 *
 * Enumerate one Salesforce user's effective permissions across their
 * Profile, PermissionSet assignments, ObjectPermissions, and FieldPermissions.
 * Answers "why does this user have the access they have" — the natural
 * complement to salesforce-reverse-data-loader (which answers "what can
 * this user pull") and salesforce-rest-user-loginhistory (which answers
 * "how and when do they authenticate").
 *
 * Read-only. Requires "Manage Users" or "View Setup and Configuration" on
 * the calling user to introspect a different user's permissions.
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
import { analyzeUserPermissions } from './analyze.ts';
import { toCsv } from '../../_shared/salesforce/csv.ts';
import {
  closeSession,
  openSession,
  queryFieldPermissions,
  queryImplicitPermissionSetForProfile,
  queryObjectPermissions,
  queryPermissionSetAssignments,
  queryPermissionSetsDetail,
  queryProfileWithPermissions,
  queryUser,
  type Session,
} from './query.ts';
import { renderMarkdown } from './report.ts';

const TOOL_ID = 'salesforce-rest-user-permissions';
const TOOL_VERSION = '0.1.0';

interface ParsedArgs {
  userId: string | null;
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
      userId: null,
      credentials: '', loginUrl: '', apiVersion: '',
      outputDir: '', analysisJsonOut: '', analysisMdOut: '',
      describe: true,
    };
  }

  if (!values['user-id']) {
    process.stderr.write(`[${TOOL_ID}] --user-id is required. See --help.\n`);
    process.exit(2);
  }

  const outputDir = resolve(values['output-dir']!);
  const slug = values['user-id']!.toLowerCase();
  return {
    userId: values['user-id']!,
    credentials: resolve(values.credentials!),
    loginUrl: values['login-url']!,
    apiVersion: values['api-version']!,
    outputDir,
    analysisJsonOut: values['analysis-json']
      ? resolve(values['analysis-json'])
      : join(outputDir, `user-${slug}-permissions-analysis.json`),
    analysisMdOut: values['analysis-md']
      ? resolve(values['analysis-md'])
      : join(outputDir, `user-${slug}-permissions-analysis.md`),
    describe: false,
  };
}

function printHelp(): void {
  process.stderr.write(
    [
      `${TOOL_ID} v${TOOL_VERSION}`,
      '',
      'Enumerate a Salesforce user\'s effective permissions and detect anomalies.',
      '',
      'Usage:',
      '  npx tsx src/index.ts --user-id <18-char id> [options]',
      '',
      'Required:',
      '  --user-id <id>            Target Salesforce user Id (15 or 18 chars starting with 005).',
      '',
      'Connection:',
      '  --credentials <path>      JSON creds file (default: ../salesforce-rest-query-csv/credentials/salesforce.json)',
      '  --login-url <url>         (default: https://login.salesforce.com)',
      '  --api-version <ver>       (default: 64.0)',
      '',
      'Output:',
      '  --output-dir <dir>        (default: ./output)',
      '  --analysis-json <path>    (default: <output-dir>/user-<slug>-permissions-analysis.json)',
      '  --analysis-md <path>      (default: <output-dir>/user-<slug>-permissions-analysis.md)',
      '',
      '  --describe                Print tool metadata as JSON and exit.',
      '  -h, --help                Show this help.',
      '',
      'Permission requirements on the calling Salesforce user:',
      '  * Reading own permissions: allowed by default.',
      '  * Reading another user\'s permissions: requires "Manage Users" OR "View Setup and',
      '    Configuration" OR PermissionSet grants for User, Profile, PermissionSet,',
      '    PermissionSetAssignment, ObjectPermissions, FieldPermissions Read access.',
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
        endpoints: ['/services/data/v{apiVersion}/query'],
        sobjects_queried: [
          'User', 'Profile', 'PermissionSet', 'PermissionSetAssignment',
          'ObjectPermissions', 'FieldPermissions',
        ],
        authorization_ceiling_max: 2,
        argv: [
          { name: 'user-id', type: 'string', required: true },
          { name: 'credentials', type: 'path' },
          { name: 'login-url', type: 'string', default: 'https://login.salesforce.com' },
          { name: 'api-version', type: 'string', default: '64.0' },
          { name: 'output-dir', type: 'path', default: './output' },
          { name: 'analysis-json', type: 'path' },
          { name: 'analysis-md', type: 'path' },
        ],
        outputs: [
          { name: 'user-record', format: 'csv', channel: 'file' },
          { name: 'profile-record', format: 'csv', channel: 'file' },
          { name: 'permissionset-assignments', format: 'csv', channel: 'file' },
          { name: 'permissionsets-detail', format: 'csv', channel: 'file' },
          { name: 'object-permissions', format: 'csv', channel: 'file' },
          { name: 'field-permissions', format: 'csv', channel: 'file' },
          { name: 'analysis-json', format: 'json', channel: 'file' },
          { name: 'analysis-md', format: 'markdown', channel: 'file' },
          { name: 'run-manifest', format: 'json', channel: 'stdout-final-line' },
        ],
        analysis_dimensions: [
          'critical-permissions-effective (union across Profile + all PSs)',
          'effective-object-permissions (aggregated per sobject)',
          'effective-field-permissions (aggregated per field)',
          'permission-source-summary (profile + per-PS)',
          'totals (PS count, object-perm count, ViewAllRecords count, etc.)',
          'anomalies (13 heuristic detectors: admin-permission-not-admin-profile,'
          + ' api-plus-modify-all-data, bulk-api-hard-delete-granted, report-export-granted,'
          + ' manage-users-granted, assign-permission-sets-granted, apex-authoring-with-modify-all,'
          + ' high-permissionset-count, view-all-records-broad, modify-all-records-broad,'
          + ' user-impersonation-granted, stale-password, active-user-never-logged-in)',
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
    creds = loadCredentials({
      credentialsPath: args.credentials,
      loginUrlOverride: args.loginUrl,
    });
    const effectiveLoginUrl = creds.loginUrl ?? args.loginUrl;
    log(`Logging in as ${creds.username} against ${effectiveLoginUrl}...`);
    session = await openSession(creds, effectiveLoginUrl, args.apiVersion);
    log(`Session: instance=${session.instanceUrl}, org=${session.organizationId}, caller=${session.callerUserId}`);

    // Query 1: target user.
    log(`Querying User ${args.userId}...`);
    const userRow = await queryUser(session, args.userId!);
    if (!userRow) {
      throw new Error(`No User found with Id ${args.userId}. Verify the id and that the caller has read access to User records.`);
    }
    const profileId = String(userRow['ProfileId'] ?? '');
    if (!profileId) throw new Error('User has no ProfileId — cannot enumerate permissions.');

    // Query 2: profile with critical permissions.
    log(`Querying Profile ${profileId}...`);
    const profileRow = await queryProfileWithPermissions(session, profileId);
    if (!profileRow) throw new Error(`No Profile found with Id ${profileId}.`);

    // Query 3: implicit PS for the profile (needed to query ObjectPermissions).
    log(`Resolving implicit PermissionSet for Profile...`);
    const implicitPsId = await queryImplicitPermissionSetForProfile(session, profileId);
    if (!implicitPsId) log(`  (warn: no implicit PS resolved for profile; object-permissions from profile will be missing)`);

    // Query 4: PermissionSet assignments for the user.
    log(`Querying PermissionSetAssignments...`);
    const assignments = await queryPermissionSetAssignments(session, args.userId!);
    log(`  ${assignments.length} PermissionSet(s) assigned.`);

    // Query 5: PermissionSet details for assigned PSs.
    const assignedPsIds = assignments
      .map((a) => String(a['PermissionSetId'] ?? ''))
      .filter((id) => id.length > 0);
    log(`Querying PermissionSet detail for ${assignedPsIds.length} assigned PS(s)...`);
    const psDetail = await queryPermissionSetsDetail(session, assignedPsIds);

    // Query 6: object permissions across all applicable ParentIds
    // (implicit-profile PS + assigned PSs).
    const allApplicablePsIds = implicitPsId ? [implicitPsId, ...assignedPsIds] : assignedPsIds;
    log(`Querying ObjectPermissions across ${allApplicablePsIds.length} permission source(s)...`);
    const objectPerms = await queryObjectPermissions(session, allApplicablePsIds);
    log(`  ${objectPerms.length} ObjectPermission row(s).`);

    // Query 7: field permissions.
    log(`Querying FieldPermissions across ${allApplicablePsIds.length} permission source(s)...`);
    const fieldPerms = await queryFieldPermissions(session, allApplicablePsIds);
    log(`  ${fieldPerms.length} FieldPermission row(s).`);

    // Analyze.
    const analysis = analyzeUserPermissions({
      userRow,
      profileRow,
      permissionSetAssignments: assignments,
      permissionSetsDetail: psDetail,
      objectPermissions: objectPerms,
      fieldPermissions: fieldPerms,
      profileImplicitPsId: implicitPsId,
    });
    log(
      `Analysis: ${analysis.critical_permissions_effective.length} critical permissions effective, ` +
      `${analysis.effective_object_permissions.length} object permission rollups, ` +
      `${analysis.anomalies.length} anomal${analysis.anomalies.length === 1 ? 'y' : 'ies'}.`,
    );

    // Write raw CSVs (one per queried table).
    mkdirSync(args.outputDir, { recursive: true });
    const slug = args.userId!.toLowerCase();
    const artifactSpecs: Array<{ name: string; path: string; content: string; description: string }> = [
      {
        name: 'user-record',
        path: join(args.outputDir, `user-${slug}-user.csv`),
        content: toCsv([userRow]),
        description: 'Target user record.',
      },
      {
        name: 'profile-record',
        path: join(args.outputDir, `user-${slug}-profile.csv`),
        content: toCsv([profileRow]),
        description: 'Profile record with tracked critical permission fields.',
      },
      {
        name: 'permissionset-assignments',
        path: join(args.outputDir, `user-${slug}-permissionset-assignments.csv`),
        content: toCsv(assignments),
        description: `PermissionSetAssignments (${assignments.length} rows).`,
      },
      {
        name: 'permissionsets-detail',
        path: join(args.outputDir, `user-${slug}-permissionsets-detail.csv`),
        content: toCsv(psDetail),
        description: `PermissionSet details for assigned PSs (${psDetail.length} rows).`,
      },
      {
        name: 'object-permissions',
        path: join(args.outputDir, `user-${slug}-object-permissions.csv`),
        content: toCsv(objectPerms),
        description: `ObjectPermissions across all applicable PSs (${objectPerms.length} rows).`,
      },
      {
        name: 'field-permissions',
        path: join(args.outputDir, `user-${slug}-field-permissions.csv`),
        content: toCsv(fieldPerms),
        description: `FieldPermissions across all applicable PSs (${fieldPerms.length} rows).`,
      },
    ];

    const artifacts: Array<Record<string, unknown>> = [];
    for (const a of artifactSpecs) {
      writeFileSync(a.path, a.content, 'utf8');
      const sha = createHash('sha256').update(a.content, 'utf8').digest('hex');
      artifacts.push({
        path: a.path,
        format: 'csv',
        sha256: sha,
        bytes: Buffer.byteLength(a.content, 'utf8'),
        description: a.description,
      });
    }

    // Write analysis JSON + MD.
    const analysisJson = JSON.stringify(analysis, null, 2) + '\n';
    mkdirSync(dirname(args.analysisJsonOut), { recursive: true });
    writeFileSync(args.analysisJsonOut, analysisJson, 'utf8');
    artifacts.push({
      path: args.analysisJsonOut,
      format: 'json',
      sha256: createHash('sha256').update(analysisJson, 'utf8').digest('hex'),
      bytes: Buffer.byteLength(analysisJson, 'utf8'),
      description: 'Structured analysis (dashboard-consumable).',
    });

    const analysisMd = renderMarkdown(analysis, {
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      generated_at: new Date().toISOString(),
      organization_id: session.organizationId,
      instance_url: session.instanceUrl,
      api_version: args.apiVersion,
    });
    mkdirSync(dirname(args.analysisMdOut), { recursive: true });
    writeFileSync(args.analysisMdOut, analysisMd, 'utf8');
    artifacts.push({
      path: args.analysisMdOut,
      format: 'markdown',
      sha256: createHash('sha256').update(analysisMd, 'utf8').digest('hex'),
      bytes: Buffer.byteLength(analysisMd, 'utf8'),
      description: 'Human-readable analysis.',
    });

    log(`Wrote ${artifacts.length} artifact(s).`);

    const completed_at = new Date().toISOString();
    const runManifest = {
      status: 'ok' as const,
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      invoked_at,
      completed_at,
      params: paramsForManifest,
      artifacts,
      metrics: {
        api_calls: session.apiCalls,
        permissionsets_assigned: assignments.length,
        object_permission_rows: objectPerms.length,
        field_permission_rows: fieldPerms.length,
        critical_permissions_effective: analysis.critical_permissions_effective.length,
        anomaly_count: analysis.anomalies.length,
        anomalies_critical: analysis.anomalies.filter((a) => a.severity === 'critical').length,
        anomalies_high: analysis.anomalies.filter((a) => a.severity === 'high').length,
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
    const runManifest = {
      status: 'error' as const,
      tool: TOOL_ID,
      tool_version: TOOL_VERSION,
      invoked_at,
      completed_at,
      params: paramsForManifest,
      artifacts: [] as Array<Record<string, unknown>>,
      metrics: { api_calls: session?.apiCalls ?? 0 },
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
  } finally {
    if (session) await closeSession(session);
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
      return { code: 'insufficient-access', message: err.message };
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
