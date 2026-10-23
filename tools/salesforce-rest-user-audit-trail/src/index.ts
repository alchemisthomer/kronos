#!/usr/bin/env -S npx tsx
/**
 * salesforce-rest-user-audit-trail — Kronos tool v0.1.0
 *
 * Queries SetupAuditTrail entries attributed to a target user and derives
 * an analysis: timeline, action-class breakdown, section breakdown, delegate
 * activity, high-privilege-action count, bursty-activity detection, off-hours
 * patterns.
 *
 * Requires "View Setup and Configuration" on the calling user to read
 * SetupAuditTrail.
 *
 * Standard I/O contract per tools/README.md.
 */

import jsforce from 'jsforce';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import {
  CredentialError, loadCredentials, redactCredentials,
  type SalesforceCredentials,
} from '../../_shared/salesforce/auth.ts';
import { toCsv } from '../../_shared/salesforce/csv.ts';

const TOOL_ID = 'salesforce-rest-user-audit-trail';
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

/**
 * High-privilege Section names in SetupAuditTrail. These sections cover
 * changes that alter the org's security posture, permission grants, or
 * data-integrity controls. A user active in these sections is either a
 * legitimate admin or a compromised admin — either way, worth noting.
 */
const HIGH_PRIV_SECTION_PATTERNS = [
  /Manage Users/i,
  /Permission Set/i,
  /Profile/i,
  /Sharing/i,
  /Roles/i,
  /Security Controls/i,
  /Trusted IP Ranges/i,
  /Single Sign-On/i,
  /Authentication/i,
  /Session/i,
  /Connected Apps/i,
  /OAuth/i,
  /Apex/i,
  /Metadata/i,
  /Setup Audit Trail/i,   // meta: modifying audit trail itself
  /Named Credentials/i,
];

/**
 * Action patterns that classify the direction of change (create vs modify vs delete).
 * Salesforce's `Action` field is free-form; these are heuristics.
 */
function classifyAction(action: string): 'create' | 'modify' | 'delete' | 'read' | 'other' {
  if (/^(created?|added|inserted|new|installed)/i.test(action)) return 'create';
  if (/^(deleted?|removed|uninstalled)/i.test(action)) return 'delete';
  if (/^(changed|modified|updated|edited|enabled|disabled|activated|deactivated|assigned)/i.test(action)) return 'modify';
  if (/^(viewed|accessed|downloaded|exported)/i.test(action)) return 'read';
  return 'other';
}

interface Anomaly {
  class: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
  evidence: Record<string, unknown>;
}

interface Analysis {
  kronos_analysis_kind: 'user-audit-trail';
  user: { id: string; username: string; name: string; is_active: boolean };
  window: {
    earliest_action: string | null;
    latest_action: string | null;
    span_days: number | null;
    total_actions: number;
  };
  action_class_counts: { create: number; modify: number; delete: number; read: number; other: number };
  by_section: Array<{ section: string; count: number; is_high_privilege: boolean }>;
  by_action: Array<{ action: string; count: number }>;
  delegate_activity: {
    count: number;
    delegates: Array<{ delegate_username: string; count: number }>;
  };
  patterns: {
    off_hours_action_count: number;      // outside 06:00-20:00 UTC
    weekend_action_count: number;        // Sat/Sun
    burst_events_count: number;          // consecutive actions < 60s apart
    logins_per_day: Record<string, number>;
  };
  anomalies: Anomaly[];
}

async function analyze(session: Session, userId: string, sinceIso: string | null, limit: number | null, log: (m: string) => void): Promise<Analysis> {
  const userRows = await runQuery(session, `SELECT Id, Username, Name, IsActive FROM User WHERE Id = '${esc(userId)}'`);
  const userRow = userRows[0];
  if (!userRow) throw new Error(`No User found with Id ${userId}.`);
  const user = {
    id: String(userRow['Id']),
    username: String(userRow['Username'] ?? ''),
    name: String(userRow['Name'] ?? ''),
    is_active: Boolean(userRow['IsActive']),
  };

  const where: string[] = [`CreatedById = '${esc(userId)}'`];
  if (sinceIso) where.push(`CreatedDate >= ${sinceIso}`);
  const limitClause = limit ? ` LIMIT ${limit}` : '';
  log(`Querying SetupAuditTrail (${where.join(' AND ')})...`);
  const rows = await runQuery(session,
    `SELECT Id, Action, Section, Display, CreatedById, CreatedDate, DelegateUser, ResponsibleNamespacePrefix
     FROM SetupAuditTrail WHERE ${where.join(' AND ')} ORDER BY CreatedDate DESC${limitClause}`);
  log(`  ${rows.length} audit-trail entries.`);

  const actionCounts = { create: 0, modify: 0, delete: 0, read: 0, other: 0 };
  const bySectionMap = new Map<string, number>();
  const byActionMap = new Map<string, number>();
  const delegateMap = new Map<string, number>();
  const times: number[] = [];
  const perDay: Record<string, number> = {};
  let offHours = 0;
  let weekend = 0;

  for (const r of rows) {
    const action = String(r['Action'] ?? '');
    const section = String(r['Section'] ?? '(unknown)');
    const delegate = (r['DelegateUser'] as string) ?? '';
    const dateStr = String(r['CreatedDate'] ?? '');
    const t = Date.parse(dateStr);

    actionCounts[classifyAction(action)]++;
    bySectionMap.set(section, (bySectionMap.get(section) ?? 0) + 1);
    byActionMap.set(action, (byActionMap.get(action) ?? 0) + 1);
    if (delegate) delegateMap.set(delegate, (delegateMap.get(delegate) ?? 0) + 1);

    if (Number.isFinite(t)) {
      times.push(t);
      const d = new Date(t);
      const dayKey = d.toISOString().slice(0, 10);
      perDay[dayKey] = (perDay[dayKey] ?? 0) + 1;
      const h = d.getUTCHours();
      if (h < 6 || h >= 20) offHours++;
      const wd = d.getUTCDay();
      if (wd === 0 || wd === 6) weekend++;
    }
  }

  times.sort((a, b) => a - b);
  const bursts: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const gap = (times[i]! - times[i - 1]!) / 1000;
    if (gap > 0 && gap < 60) bursts.push(gap);
  }

  const bySection = [...bySectionMap.entries()]
    .map(([section, count]) => ({
      section, count,
      is_high_privilege: HIGH_PRIV_SECTION_PATTERNS.some((re) => re.test(section)),
    }))
    .sort((a, b) => b.count - a.count);

  const byAction = [...byActionMap.entries()]
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  const delegates = [...delegateMap.entries()]
    .map(([delegate_username, count]) => ({ delegate_username, count }))
    .sort((a, b) => b.count - a.count);

  const highPrivCount = bySection.filter((s) => s.is_high_privilege).reduce((n, s) => n + s.count, 0);
  const anomalies: Anomaly[] = [];
  if (highPrivCount >= 20) {
    anomalies.push({
      class: 'high-privilege-action-activity',
      severity: 'high',
      detail: `${highPrivCount} actions in high-privilege Setup sections (Users, Permission Sets, Profiles, Sharing, Security). Legitimate admin OR compromised admin.`,
      evidence: { high_privilege_action_count: highPrivCount },
    });
  }
  if (delegates.length > 0) {
    anomalies.push({
      class: 'delegate-actions-observed',
      severity: 'medium',
      detail: `${delegates.length} distinct delegate(s) acted on this user's behalf across ${delegates.reduce((n, d) => n + d.count, 0)} action(s). Verify delegation is authorized.`,
      evidence: { delegates },
    });
  }
  if (rows.length >= 50 && weekend / rows.length > 0.15) {
    anomalies.push({
      class: 'weekend-admin-activity',
      severity: 'medium',
      detail: `${weekend} of ${rows.length} actions on weekends (${((weekend / rows.length) * 100).toFixed(1)}%). Weekend admin activity is unusual for most business roles.`,
      evidence: { weekend_count: weekend, total: rows.length },
    });
  }
  if (rows.length >= 50 && offHours / rows.length > 0.25) {
    anomalies.push({
      class: 'off-hours-admin-activity',
      severity: 'low',
      detail: `${offHours} of ${rows.length} actions outside 06:00-20:00 UTC (${((offHours / rows.length) * 100).toFixed(1)}%).`,
      evidence: { off_hours_count: offHours, total: rows.length },
    });
  }
  if (bursts.length >= 10) {
    anomalies.push({
      class: 'burst-admin-activity',
      severity: 'medium',
      detail: `${bursts.length} consecutive action pairs less than 60s apart. Bulk-change pattern — possible automation or scripted admin action.`,
      evidence: { burst_count: bursts.length, min_gap_sec: Math.min(...bursts) },
    });
  }
  if (actionCounts.delete >= 20) {
    anomalies.push({
      class: 'many-delete-actions',
      severity: 'high',
      detail: `${actionCounts.delete} delete/remove/uninstall actions. Elevated destructive activity — verify each was authorized.`,
      evidence: { delete_count: actionCounts.delete },
    });
  }

  return {
    kronos_analysis_kind: 'user-audit-trail',
    user,
    window: {
      earliest_action: times.length ? new Date(times[0]!).toISOString() : null,
      latest_action: times.length ? new Date(times[times.length - 1]!).toISOString() : null,
      span_days: times.length ? Math.round((times[times.length - 1]! - times[0]!) / 86_400_000) : null,
      total_actions: rows.length,
    },
    action_class_counts: actionCounts,
    by_section: bySection,
    by_action: byAction,
    delegate_activity: { count: delegates.reduce((n, d) => n + d.count, 0), delegates },
    patterns: {
      off_hours_action_count: offHours,
      weekend_action_count: weekend,
      burst_events_count: bursts.length,
      logins_per_day: perDay,
    },
    anomalies,
  };
}

function renderMarkdown(a: Analysis, meta: { tool: string; tool_version: string; generated_at: string; organization_id: string; instance_url: string; api_version: string }): string {
  const L: string[] = [];
  L.push(`# Salesforce User Audit Trail Analysis`);
  L.push('');
  L.push(`- **Generated:** ${meta.generated_at}`);
  L.push(`- **Tool:** \`${meta.tool}\` v${meta.tool_version}`);
  L.push(`- **Org:** \`${meta.organization_id}\` @ \`${meta.instance_url}\``);
  L.push(`- **API version:** ${meta.api_version}`);
  L.push('');
  L.push(`## User`);
  L.push(`- Name: ${a.user.name}`);
  L.push(`- Username: \`${a.user.username}\``);
  L.push(`- Active: ${a.user.is_active ? '✅' : '❌'}`);
  L.push('');
  L.push(`## Window`);
  L.push(`- Total actions: **${a.window.total_actions}**`);
  L.push(`- Earliest: ${a.window.earliest_action ?? '—'}`);
  L.push(`- Latest: ${a.window.latest_action ?? '—'}`);
  L.push(`- Span: ${a.window.span_days ?? '—'} days`);
  L.push('');
  L.push(`## Action classification`);
  L.push(`- Create: ${a.action_class_counts.create}`);
  L.push(`- Modify: ${a.action_class_counts.modify}`);
  L.push(`- Delete: ${a.action_class_counts.delete}`);
  L.push(`- Read: ${a.action_class_counts.read}`);
  L.push(`- Other: ${a.action_class_counts.other}`);
  L.push('');
  L.push(`## Anomalies`);
  if (a.anomalies.length === 0) L.push(`_None flagged._`);
  else for (const an of a.anomalies) L.push(`- **${an.severity.toUpperCase()}** \`${an.class}\` — ${an.detail}`);
  L.push('');
  L.push(`## By section (top 20)`);
  L.push(`| Section | Count | High-privilege |`);
  L.push(`|---|---:|:-:|`);
  for (const s of a.by_section.slice(0, 20)) L.push(`| ${s.section} | ${s.count} | ${s.is_high_privilege ? '⚠' : ''} |`);
  L.push('');
  L.push(`## Top actions (top 20)`);
  L.push(`| Action | Count |`);
  L.push(`|---|---:|`);
  for (const act of a.by_action.slice(0, 20)) L.push(`| ${act.action} | ${act.count} |`);
  L.push('');
  L.push(`## Delegate activity`);
  if (a.delegate_activity.count === 0) L.push(`_No delegate actions._`);
  else {
    L.push(`| Delegate | Count |`);
    L.push(`|---|---:|`);
    for (const d of a.delegate_activity.delegates) L.push(`| \`${d.delegate_username}\` | ${d.count} |`);
  }
  L.push('');
  L.push(`## Patterns`);
  L.push(`- Off-hours actions (outside 06:00-20:00 UTC): ${a.patterns.off_hours_action_count}`);
  L.push(`- Weekend actions: ${a.patterns.weekend_action_count}`);
  L.push(`- Burst events (< 60s between consecutive): ${a.patterns.burst_events_count}`);
  return L.join('\n');
}

function printHelp(): void {
  process.stderr.write([
    `${TOOL_ID} v${TOOL_VERSION}`, '',
    'Enumerate SetupAuditTrail entries for a user\'s admin/setup actions.', '',
    'Options: --user-id <id> [--since ISO8601] [--limit N] [--describe] [-h|--help]', '',
  ].join('\n'));
}

function describeTool(): void {
  process.stdout.write(JSON.stringify({
    tool: TOOL_ID, tool_version: TOOL_VERSION,
    binding_layer: 1, tier: 2, api_family: 'salesforce.rest',
    endpoint: '/services/data/v{apiVersion}/query',
    sobjects_queried: ['User', 'SetupAuditTrail'],
    authorization_ceiling_max: 2,
    argv: [
      { name: 'user-id', type: 'string', required: true },
      { name: 'since', type: 'string', required: false, description: 'ISO 8601 lower bound.' },
      { name: 'limit', type: 'number', required: false },
    ],
    analysis_dimensions: [
      'window (earliest/latest/span/total)',
      'action-class-counts (create/modify/delete/read/other)',
      'by-section (with high-privilege flag)',
      'by-action (top 50)',
      'delegate-activity',
      'patterns (off-hours, weekend, bursts, per-day)',
      'anomalies (6 heuristics: high-privilege-action-activity, delegate-actions-observed,'
        + ' weekend-admin-activity, off-hours-admin-activity, burst-admin-activity, many-delete-actions)',
    ],
  }, null, 2) + '\n');
}

async function main(): Promise<number> {
  const invoked_at = new Date().toISOString();
  const { values } = parseArgs({
    strict: true, allowPositionals: false,
    options: {
      'user-id': { type: 'string' },
      since: { type: 'string' },
      limit: { type: 'string' },
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
  if (!values['user-id']) { process.stderr.write(`[${TOOL_ID}] --user-id required.\n`); return 2; }

  const userId = values['user-id']!;
  const outputDir = resolve(values['output-dir']!);
  const slug = userId.toLowerCase();
  const paramsForManifest: Record<string, unknown> = {
    'user-id': userId, since: values.since ?? null, limit: values.limit ? Number(values.limit) : null,
    credentials: resolve(values.credentials!),
    'login-url': values['login-url'], 'api-version': values['api-version'], 'output-dir': outputDir,
  };

  let creds: SalesforceCredentials | null = null;
  let session: Session | null = null;
  try {
    creds = loadCredentials({ credentialsPath: resolve(values.credentials!), loginUrlOverride: values['login-url']! });
    session = await openSession(creds, creds.loginUrl ?? values['login-url']!, values['api-version']!);

    const analysis = await analyze(session, userId, values.since ?? null, values.limit ? Number(values.limit) : null, log);
    log(`Analysis: actions=${analysis.window.total_actions}, sections=${analysis.by_section.length}, anomalies=${analysis.anomalies.length}`);

    mkdirSync(outputDir, { recursive: true });
    const artifacts: Array<Record<string, unknown>> = [];
    const write = (fn: string, content: string, desc: string, format = 'csv'): void => {
      const p = join(outputDir, fn);
      writeFileSync(p, content, 'utf8');
      artifacts.push({ path: p, format, sha256: createHash('sha256').update(content).digest('hex'), bytes: Buffer.byteLength(content, 'utf8'), description: desc });
    };
    // Raw CSV of the audit trail — reconstruct records to include Action/Section/Display; skip DelegateUser sensitive re-emission
    // (already in analysis) — write summary artifacts only.
    const aj = JSON.stringify(analysis, null, 2) + '\n';
    write(`user-${slug}-audit-trail-analysis.json`, aj, 'Structured audit-trail analysis.', 'json');
    const md = renderMarkdown(analysis, { tool: TOOL_ID, tool_version: TOOL_VERSION, generated_at: new Date().toISOString(), organization_id: session.organizationId, instance_url: session.instanceUrl, api_version: values['api-version']! });
    write(`user-${slug}-audit-trail-analysis.md`, md, 'Human-readable audit-trail analysis.', 'markdown');

    process.stdout.write(JSON.stringify({
      status: 'ok', tool: TOOL_ID, tool_version: TOOL_VERSION,
      invoked_at, completed_at: new Date().toISOString(),
      params: paramsForManifest, artifacts,
      metrics: {
        api_calls: session.apiCalls,
        total_actions: analysis.window.total_actions,
        sections_touched: analysis.by_section.length,
        high_privilege_sections: analysis.by_section.filter((s) => s.is_high_privilege).length,
        delegate_action_count: analysis.delegate_activity.count,
        anomaly_count: analysis.anomalies.length,
      },
      target: { instance_url: session.instanceUrl, organization_id: session.organizationId, target_user_id: userId, caller_user_id: session.callerUserId },
      credentials: { source: creds.source, source_path: creds.sourcePath },
      error: null,
    }) + '\n');
    return 0;
  } catch (err) {
    const { code, message } = classifyError(err);
    const safe = redactCredentials(message, creds, session?.conn.accessToken ?? undefined);
    log(`ERROR [${code}] ${safe}`);
    process.stdout.write(JSON.stringify({
      status: 'error', tool: TOOL_ID, tool_version: TOOL_VERSION, invoked_at, completed_at: new Date().toISOString(),
      params: paramsForManifest, artifacts: [], metrics: { api_calls: session?.apiCalls ?? 0 },
      target: { target_user_id: userId }, credentials: creds ? { source: creds.source, source_path: creds.sourcePath } : { source: 'none' },
      error: { code, message: safe },
    }) + '\n');
    return 1;
  } finally { if (session) try { await session.conn.logout(); } catch { /* */ } }
}

function classifyError(err: unknown): { code: string; message: string } {
  if (err instanceof CredentialError) return { code: err.code, message: err.message };
  if (err instanceof Error) {
    if (/INVALID_LOGIN/.test(err.message)) return { code: 'login-failed', message: err.message };
    if (/INSUFFICIENT_ACCESS/.test(err.message)) return { code: 'insufficient-access', message: err.message };
    return { code: 'runtime-error', message: err.message };
  }
  return { code: 'unknown-error', message: String(err) };
}

function log(msg: string): void { process.stderr.write(`[${TOOL_ID}] ${msg}\n`); }

main().then((code) => process.exit(code), (err) => { process.stderr.write(`[${TOOL_ID}] FATAL: ${err}\n`); process.exit(1); });
