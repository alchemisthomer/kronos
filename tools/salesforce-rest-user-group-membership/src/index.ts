#!/usr/bin/env -S npx tsx
/**
 * salesforce-rest-user-group-membership — Kronos tool v0.1.0
 *
 * Traverses the Salesforce group graph from a target user's perspective:
 *   1. Direct GroupMember rows for the user.
 *   2. Transitive membership — any Regular/Role/Territory group that
 *      contains one of the user's direct groups (public groups nest).
 *   3. Queue memberships and each Queue's associated sobjects (via
 *      QueueSobject) — reveals which sobjects the user can process as
 *      part of a queue-based workflow.
 *
 * Complements salesforce-rest-user-shares (which uses group ids as share
 * recipients) by explaining WHERE those group memberships come from and
 * how deep the group graph goes.
 *
 * Standard I/O contract per tools/README.md.
 */

import jsforce from 'jsforce';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  CredentialError, loadCredentials, redactCredentials,
  type SalesforceCredentials,
} from '../../_shared/salesforce/auth.ts';
import { toCsv } from '../../_shared/salesforce/csv.ts';

const TOOL_ID = 'salesforce-rest-user-group-membership';
const TOOL_VERSION = '0.1.0';

interface Session {
  conn: jsforce.Connection;
  callerUserId: string;
  organizationId: string;
  instanceUrl: string;
  loginUrl: string;
  apiVersion: string;
  apiCalls: number;
}

async function openSession(creds: SalesforceCredentials, loginUrl: string, apiVersion: string): Promise<Session> {
  const conn = new jsforce.Connection({ loginUrl, version: apiVersion });
  const userInfo = await conn.login(creds.username, creds.password + creds.securityToken);
  return {
    conn, callerUserId: userInfo.id, organizationId: userInfo.organizationId,
    instanceUrl: conn.instanceUrl, loginUrl, apiVersion, apiCalls: 1,
  };
}

async function runQuery(s: Session, soql: string): Promise<Record<string, unknown>[]> {
  const records: Record<string, unknown>[] = [];
  let result = await s.conn.query(soql);
  s.apiCalls++;
  records.push(...(result.records as Record<string, unknown>[]));
  while (!result.done && result.nextRecordsUrl) {
    result = await s.conn.queryMore(result.nextRecordsUrl);
    s.apiCalls++;
    records.push(...(result.records as Record<string, unknown>[]));
  }
  return records;
}

function esc(s: string): string { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function inList(ids: string[]): string { return ids.map((id) => `'${esc(id)}'`).join(','); }

interface GroupNode {
  id: string;
  name: string;
  developer_name: string | null;
  type: string;
  does_include_bosses: boolean;
  related_id: string | null;   // for Role/Territory: the related record id
  depth: number;               // 0 = direct, 1 = 1 hop transitive, etc.
  reached_via: string[];       // ids of the group(s) that included this one
}

interface QueueSobject {
  queue_id: string;
  queue_name: string;
  sobject_type: string;
}

interface Anomaly {
  class: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
  evidence: Record<string, unknown>;
}

interface Analysis {
  kronos_analysis_kind: 'user-group-membership';
  user: {
    id: string;
    username: string;
    name: string;
    is_active: boolean;
    user_role_id: string | null;
    user_role_name: string | null;
  };
  direct_groups: GroupNode[];
  transitive_groups: GroupNode[];
  queues: {
    memberships: GroupNode[];        // groups of Type='Queue' the user is in
    queue_sobjects: QueueSobject[];  // per-queue sobject associations
    sobjects_reachable_via_queue: string[];
  };
  totals: {
    direct_group_count: number;
    transitive_group_count: number;
    total_effective_group_count: number;
    queue_membership_count: number;
    unique_sobjects_via_queues: number;
    max_transitive_depth: number;
  };
  anomalies: Anomaly[];
}

async function analyze(session: Session, userId: string, maxDepth: number, log: (m: string) => void): Promise<Analysis> {
  // 1. User
  const userRows = await runQuery(session,
    `SELECT Id, Username, Name, IsActive, UserRoleId, UserRole.Name FROM User WHERE Id = '${esc(userId)}'`);
  const userRow = userRows[0];
  if (!userRow) throw new Error(`No User found with Id ${userId}.`);
  const user = {
    id: String(userRow['Id']),
    username: String(userRow['Username'] ?? ''),
    name: String(userRow['Name'] ?? ''),
    is_active: Boolean(userRow['IsActive']),
    user_role_id: (userRow['UserRoleId'] as string) ?? null,
    user_role_name: (userRow['UserRole'] as any)?.Name ?? null,
  };

  // 2. Direct group memberships
  log(`querying direct GroupMember for user...`);
  const directRows = await runQuery(session,
    `SELECT Id, GroupId, Group.Name, Group.DeveloperName, Group.Type, Group.DoesIncludeBosses, Group.RelatedId
     FROM GroupMember WHERE UserOrGroupId = '${esc(userId)}'`);
  log(`  ${directRows.length} direct membership(s).`);

  const directGroups: GroupNode[] = directRows.map((r) => {
    const g = r['Group'] as any;
    return {
      id: String(r['GroupId'] ?? ''),
      name: String(g?.Name ?? ''),
      developer_name: g?.DeveloperName ?? null,
      type: String(g?.Type ?? ''),
      does_include_bosses: g?.DoesIncludeBosses === true,
      related_id: g?.RelatedId ?? null,
      depth: 0,
      reached_via: [],
    };
  });

  // 3. Transitive traversal: BFS. At each level, query GroupMember
  //    WHERE UserOrGroupId IN (:groups_at_this_level) to find groups that
  //    include them as members. Cap at maxDepth to avoid runaway.
  const visited = new Set(directGroups.map((g) => g.id));
  const transitive: GroupNode[] = [];
  let frontier = directGroups.map((g) => g.id);
  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    log(`  BFS depth ${depth}: expanding ${frontier.length} group(s)...`);
    const nextRows = await runQuery(session,
      `SELECT Id, GroupId, UserOrGroupId, Group.Name, Group.DeveloperName, Group.Type,
              Group.DoesIncludeBosses, Group.RelatedId
       FROM GroupMember WHERE UserOrGroupId IN (${inList(frontier)})`);
    const nextFrontier: string[] = [];
    for (const r of nextRows) {
      const gid = String(r['GroupId'] ?? '');
      if (!gid || visited.has(gid)) continue;
      visited.add(gid);
      const g = r['Group'] as any;
      transitive.push({
        id: gid,
        name: String(g?.Name ?? ''),
        developer_name: g?.DeveloperName ?? null,
        type: String(g?.Type ?? ''),
        does_include_bosses: g?.DoesIncludeBosses === true,
        related_id: g?.RelatedId ?? null,
        depth,
        reached_via: [String(r['UserOrGroupId'] ?? '')],
      });
      nextFrontier.push(gid);
    }
    log(`    +${nextFrontier.length} new group(s) at depth ${depth}.`);
    frontier = nextFrontier;
  }

  // 4. Queue-sobject associations: for every Queue group the user is (directly or transitively) in.
  const allGroups = [...directGroups, ...transitive];
  const queues = allGroups.filter((g) => g.type === 'Queue');
  let queueSobjects: QueueSobject[] = [];
  if (queues.length > 0) {
    log(`querying QueueSobject for ${queues.length} queue(s)...`);
    const qRows = await runQuery(session,
      `SELECT Id, QueueId, Queue.Name, SobjectType FROM QueueSobject WHERE QueueId IN (${inList(queues.map((q) => q.id))})`);
    queueSobjects = qRows.map((r) => ({
      queue_id: String(r['QueueId'] ?? ''),
      queue_name: String((r['Queue'] as any)?.Name ?? ''),
      sobject_type: String(r['SobjectType'] ?? ''),
    }));
    log(`  ${queueSobjects.length} queue-sobject association(s).`);
  }

  const uniqueSobjectsViaQueue = [...new Set(queueSobjects.map((q) => q.sobject_type))].sort();

  const anomalies: Anomaly[] = [];
  const totalGroups = directGroups.length + transitive.length;
  if (transitive.length >= 10) {
    anomalies.push({
      class: 'deep-transitive-group-graph',
      severity: 'medium',
      detail: `User is transitively a member of ${transitive.length} additional groups via nested public-group membership.`,
      evidence: { direct: directGroups.length, transitive: transitive.length, total: totalGroups },
    });
  }
  if (totalGroups >= 30) {
    anomalies.push({
      class: 'very-high-total-group-count',
      severity: 'high',
      detail: `User effectively belongs to ${totalGroups} groups (direct + transitive). Any share to any of these groups is visible to this user.`,
      evidence: { total: totalGroups },
    });
  }
  const orgWide = allGroups.find((g) => /AllInternalUsers|AllUsers|Organization/i.test(g.name));
  if (orgWide) {
    anomalies.push({
      class: 'org-wide-group-membership',
      severity: 'medium',
      detail: `User is a member of "${orgWide.name}" — org-wide group. Anything shared with this group is visible to this user.`,
      evidence: { group: orgWide },
    });
  }
  if (queues.length >= 5) {
    anomalies.push({
      class: 'high-queue-membership',
      severity: 'low',
      detail: `User is a member of ${queues.length} queues, providing work-item access to ${uniqueSobjectsViaQueue.length} sobject types.`,
      evidence: { queue_count: queues.length, sobjects: uniqueSobjectsViaQueue },
    });
  }
  for (const g of allGroups) {
    if (g.does_include_bosses) {
      anomalies.push({
        class: 'group-includes-role-bosses',
        severity: 'low',
        detail: `Group "${g.name}" has DoesIncludeBosses=true — all users above the group's role in the hierarchy inherit its membership.`,
        evidence: { group: g },
      });
      break; // one representative example is enough for the analysis surface
    }
  }

  return {
    kronos_analysis_kind: 'user-group-membership',
    user,
    direct_groups: directGroups,
    transitive_groups: transitive,
    queues: {
      memberships: queues,
      queue_sobjects: queueSobjects,
      sobjects_reachable_via_queue: uniqueSobjectsViaQueue,
    },
    totals: {
      direct_group_count: directGroups.length,
      transitive_group_count: transitive.length,
      total_effective_group_count: totalGroups,
      queue_membership_count: queues.length,
      unique_sobjects_via_queues: uniqueSobjectsViaQueue.length,
      max_transitive_depth: transitive.length ? Math.max(...transitive.map((g) => g.depth)) : 0,
    },
    anomalies,
  };
}

function renderMarkdown(a: Analysis, meta: { tool: string; tool_version: string; generated_at: string; organization_id: string; instance_url: string; api_version: string }): string {
  const L: string[] = [];
  L.push(`# Salesforce User Group Membership Analysis`);
  L.push('');
  L.push(`- **Generated:** ${meta.generated_at}`);
  L.push(`- **Tool:** \`${meta.tool}\` v${meta.tool_version}`);
  L.push(`- **Org:** \`${meta.organization_id}\` @ \`${meta.instance_url}\``);
  L.push(`- **API version:** ${meta.api_version}`);
  L.push('');
  L.push(`## User`);
  L.push(`- Name: ${a.user.name}`);
  L.push(`- Username: \`${a.user.username}\``);
  L.push(`- Role: ${a.user.user_role_name ?? '—'}`);
  L.push(`- Active: ${a.user.is_active ? '✅' : '❌'}`);
  L.push('');
  L.push(`## Totals`);
  L.push(`| Metric | Value |`);
  L.push(`|---|---:|`);
  L.push(`| Direct groups | ${a.totals.direct_group_count} |`);
  L.push(`| Transitive groups | ${a.totals.transitive_group_count} |`);
  L.push(`| **Total effective groups** | **${a.totals.total_effective_group_count}** |`);
  L.push(`| Queue memberships | ${a.totals.queue_membership_count} |`);
  L.push(`| Unique sobjects via queues | ${a.totals.unique_sobjects_via_queues} |`);
  L.push(`| Max transitive depth | ${a.totals.max_transitive_depth} |`);
  L.push('');
  L.push(`## Anomalies`);
  if (a.anomalies.length === 0) L.push(`_None flagged._`);
  else for (const an of a.anomalies) L.push(`- **${an.severity.toUpperCase()}** \`${an.class}\` — ${an.detail}`);
  L.push('');
  L.push(`## Direct group memberships (${a.direct_groups.length})`);
  if (a.direct_groups.length === 0) L.push(`_None._`);
  else {
    L.push(`| Group | Type | IncludesBosses |`);
    L.push(`|---|---|:-:|`);
    for (const g of a.direct_groups) L.push(`| ${g.name} | \`${g.type}\` | ${g.does_include_bosses ? '✅' : ''} |`);
  }
  L.push('');
  L.push(`## Transitive group memberships (${a.transitive_groups.length})`);
  if (a.transitive_groups.length === 0) L.push(`_None — no group nesting reaches this user._`);
  else {
    L.push(`| Group | Type | Depth | Reached via |`);
    L.push(`|---|---|---:|---|`);
    for (const g of a.transitive_groups) L.push(`| ${g.name} | \`${g.type}\` | ${g.depth} | \`${g.reached_via.join(', ')}\` |`);
  }
  L.push('');
  L.push(`## Queue → Sobject map (${a.queues.queue_sobjects.length} associations)`);
  if (a.queues.queue_sobjects.length === 0) L.push(`_User is in no queues._`);
  else {
    L.push(`| Queue | Sobject |`);
    L.push(`|---|---|`);
    for (const qs of a.queues.queue_sobjects) L.push(`| ${qs.queue_name} | \`${qs.sobject_type}\` |`);
  }
  return L.join('\n');
}

function printHelp(): void {
  process.stderr.write([
    `${TOOL_ID} v${TOOL_VERSION}`, '',
    'Traverse the Salesforce group graph from a target user\'s perspective.', '',
    'Usage:', '  npx tsx src/index.ts --user-id <id> [options]', '',
    'Options:',
    '  --user-id <id>            REQUIRED. Target Salesforce user Id.',
    '  --max-transitive-depth <n> Cap on BFS depth for group nesting (default: 5).',
    '  --credentials <path>      (default: ../salesforce-rest-query-csv/credentials/salesforce.json)',
    '  --login-url <url>         (default: https://login.salesforce.com)',
    '  --api-version <ver>       (default: 64.0)',
    '  --output-dir <dir>        (default: ./output)',
    '  --describe                Print tool metadata as JSON and exit.',
    '  -h, --help                Show this help.', '',
  ].join('\n'));
}

function describeTool(): void {
  process.stdout.write(JSON.stringify({
    tool: TOOL_ID, tool_version: TOOL_VERSION,
    binding_layer: 1, tier: 2, api_family: 'salesforce.rest',
    endpoint: '/services/data/v{apiVersion}/query',
    sobjects_queried: ['User', 'GroupMember (+ Group)', 'QueueSobject'],
    authorization_ceiling_max: 2,
    argv: [
      { name: 'user-id', type: 'string', required: true },
      { name: 'max-transitive-depth', type: 'number', default: 5 },
      { name: 'credentials', type: 'path' },
      { name: 'login-url', type: 'string', default: 'https://login.salesforce.com' },
      { name: 'api-version', type: 'string', default: '64.0' },
      { name: 'output-dir', type: 'path', default: './output' },
    ],
    outputs: [
      { name: 'analysis-json', format: 'json', channel: 'file' },
      { name: 'analysis-md', format: 'markdown', channel: 'file' },
      { name: 'per-source-csvs', format: 'csv', channel: 'file' },
      { name: 'run-manifest', format: 'json', channel: 'stdout-final-line' },
    ],
    analysis_dimensions: [
      'direct-group-memberships (from GroupMember)',
      'transitive-group-memberships (BFS through nested public groups)',
      'queue-memberships + queue-to-sobject mapping (via QueueSobject)',
      'totals',
      'anomalies (5 heuristics: deep-transitive-group-graph, very-high-total-group-count,'
        + ' org-wide-group-membership, high-queue-membership, group-includes-role-bosses)',
    ],
  }, null, 2) + '\n');
}

async function main(): Promise<number> {
  const invoked_at = new Date().toISOString();
  const { values } = parseArgs({
    strict: true, allowPositionals: false,
    options: {
      'user-id': { type: 'string' },
      'max-transitive-depth': { type: 'string' },
      credentials: { type: 'string', default: '../salesforce-rest-query-csv/credentials/salesforce.json' },
      'login-url': { type: 'string', default: 'https://login.salesforce.com' },
      'api-version': { type: 'string', default: '64.0' },
      'output-dir': { type: 'string', default: './output' },
      describe: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false, short: 'h' },
    },
  });
  if (values.help) { printHelp(); return 0; }
  if (values.describe) { describeTool(); return 0; }
  if (!values['user-id']) {
    process.stderr.write(`[${TOOL_ID}] --user-id is required.\n`); return 2;
  }

  const userId = values['user-id']!;
  const maxDepth = values['max-transitive-depth'] ? Number(values['max-transitive-depth']) : 5;
  const outputDir = resolve(values['output-dir']!);
  const credentialsPath = resolve(values.credentials!);
  const loginUrl = values['login-url']!;
  const apiVersion = values['api-version']!;
  const slug = userId.toLowerCase();
  const analysisJsonOut = join(outputDir, `user-${slug}-group-membership-analysis.json`);
  const analysisMdOut = join(outputDir, `user-${slug}-group-membership-analysis.md`);

  const paramsForManifest: Record<string, unknown> = {
    'user-id': userId, 'max-transitive-depth': maxDepth,
    credentials: credentialsPath, 'login-url': loginUrl, 'api-version': apiVersion,
    'output-dir': outputDir,
  };

  let creds: SalesforceCredentials | null = null;
  let session: Session | null = null;

  try {
    creds = loadCredentials({ credentialsPath, loginUrlOverride: loginUrl });
    const effectiveLoginUrl = creds.loginUrl ?? loginUrl;
    log(`Logging in as ${creds.username} against ${effectiveLoginUrl}...`);
    session = await openSession(creds, effectiveLoginUrl, apiVersion);

    const analysis = await analyze(session, userId, maxDepth, log);
    log(`Analysis: direct=${analysis.totals.direct_group_count}, transitive=${analysis.totals.transitive_group_count}, queues=${analysis.totals.queue_membership_count}, anomalies=${analysis.anomalies.length}`);

    mkdirSync(outputDir, { recursive: true });
    const artifacts: Array<Record<string, unknown>> = [];
    const write = (name: string, filename: string, content: string, desc: string, format = 'csv'): void => {
      const path = join(outputDir, filename);
      writeFileSync(path, content, 'utf8');
      artifacts.push({ path, format, sha256: createHash('sha256').update(content).digest('hex'), bytes: Buffer.byteLength(content, 'utf8'), description: desc });
    };

    write('direct-groups', `user-${slug}-direct-groups.csv`, toCsv(analysis.direct_groups as unknown as Record<string, unknown>[]), `Direct GroupMember rows (${analysis.direct_groups.length}).`);
    write('transitive-groups', `user-${slug}-transitive-groups.csv`, toCsv(analysis.transitive_groups as unknown as Record<string, unknown>[]), `Transitive group nodes (${analysis.transitive_groups.length}).`);
    write('queue-sobjects', `user-${slug}-queue-sobjects.csv`, toCsv(analysis.queues.queue_sobjects as unknown as Record<string, unknown>[]), `Queue → Sobject associations (${analysis.queues.queue_sobjects.length}).`);

    const analysisJson = JSON.stringify(analysis, null, 2) + '\n';
    mkdirSync(dirname(analysisJsonOut), { recursive: true });
    writeFileSync(analysisJsonOut, analysisJson, 'utf8');
    artifacts.push({ path: analysisJsonOut, format: 'json', sha256: createHash('sha256').update(analysisJson).digest('hex'), bytes: Buffer.byteLength(analysisJson, 'utf8'), description: 'Structured analysis.' });

    const analysisMd = renderMarkdown(analysis, {
      tool: TOOL_ID, tool_version: TOOL_VERSION,
      generated_at: new Date().toISOString(),
      organization_id: session.organizationId,
      instance_url: session.instanceUrl,
      api_version: apiVersion,
    });
    writeFileSync(analysisMdOut, analysisMd, 'utf8');
    artifacts.push({ path: analysisMdOut, format: 'markdown', sha256: createHash('sha256').update(analysisMd).digest('hex'), bytes: Buffer.byteLength(analysisMd, 'utf8'), description: 'Human-readable analysis.' });

    process.stdout.write(JSON.stringify({
      status: 'ok', tool: TOOL_ID, tool_version: TOOL_VERSION,
      invoked_at, completed_at: new Date().toISOString(),
      params: paramsForManifest, artifacts,
      metrics: {
        api_calls: session.apiCalls,
        direct_group_count: analysis.totals.direct_group_count,
        transitive_group_count: analysis.totals.transitive_group_count,
        total_group_count: analysis.totals.total_effective_group_count,
        queue_count: analysis.totals.queue_membership_count,
        anomaly_count: analysis.anomalies.length,
      },
      target: { login_url: session.loginUrl, instance_url: session.instanceUrl, organization_id: session.organizationId, api_version: apiVersion, target_user_id: userId, caller_user_id: session.callerUserId },
      credentials: { source: creds.source, source_path: creds.sourcePath },
      error: null,
    }) + '\n');
    return 0;
  } catch (err) {
    const completed_at = new Date().toISOString();
    const { code, message } = classifyError(err);
    const safe = redactCredentials(message, creds, session?.conn.accessToken ?? undefined);
    log(`ERROR [${code}] ${safe}`);
    process.stdout.write(JSON.stringify({
      status: 'error', tool: TOOL_ID, tool_version: TOOL_VERSION,
      invoked_at, completed_at, params: paramsForManifest,
      artifacts: [], metrics: { api_calls: session?.apiCalls ?? 0 },
      target: { login_url: creds?.loginUrl ?? loginUrl, api_version: apiVersion, target_user_id: userId },
      credentials: creds ? { source: creds.source, source_path: creds.sourcePath } : { source: 'none' },
      error: { code, message: safe },
    }) + '\n');
    return 1;
  } finally {
    if (session) { try { await session.conn.logout(); } catch { /* best-effort */ } }
  }
}

function classifyError(err: unknown): { code: string; message: string } {
  if (err instanceof CredentialError) return { code: err.code, message: err.message };
  if (err instanceof Error) {
    const anyErr = err as Error & { errorCode?: string };
    if (anyErr.errorCode === 'INVALID_LOGIN' || /INVALID_LOGIN/.test(err.message)) return { code: 'login-failed', message: err.message };
    if (/INSUFFICIENT_ACCESS/.test(err.message)) return { code: 'insufficient-access', message: err.message };
    return { code: 'runtime-error', message: err.message };
  }
  return { code: 'unknown-error', message: String(err) };
}

function log(msg: string): void { process.stderr.write(`[${TOOL_ID}] ${msg}\n`); }

main().then(
  (code) => process.exit(code),
  (err) => { process.stderr.write(`[${TOOL_ID}] FATAL: ${String(err)}\n`); process.exit(1); },
);
