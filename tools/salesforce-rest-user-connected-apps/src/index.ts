#!/usr/bin/env -S npx tsx
/**
 * salesforce-rest-user-connected-apps — Kronos tool v0.1.0
 *
 * Enumerate a user's OAuth grants (OauthToken sobject) and third-party
 * account links (ThirdPartyAccountLink sobject). Each active grant is a
 * potential compromise vector — a stolen token bypasses password/2FA.
 *
 * Requires "Manage OAuth Consumers" or "View Setup and Configuration" to
 * read OauthToken for other users. Own-user reads work by default in most
 * orgs.
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

const TOOL_ID = 'salesforce-rest-user-connected-apps';
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
  let result;
  try { result = await s.conn.query(soql); } catch (err) {
    // Some orgs restrict OauthToken/ThirdPartyAccountLink; caller decides.
    throw err;
  }
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

interface OAuthTokenRecord {
  token_id: string;
  app_name: string;
  app_menu_item_id: string | null;
  created_date: string;
  last_used_date: string | null;
  use_count: number;
  delete_token: string | null;
  request_token: string | null;
}

interface ThirdPartyLinkRecord {
  link_id: string;
  provider_type: string | null;
  provider_developer_name: string | null;
  remote_identifier: string;
  sso_used: boolean;
}

interface AppSummary {
  app_name: string;
  token_count: number;
  first_created: string;
  most_recently_used: string | null;
  total_use_count: number;
  is_dev_tool: boolean;
}

interface Anomaly {
  class: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
  evidence: Record<string, unknown>;
}

interface Analysis {
  kronos_analysis_kind: 'user-connected-apps';
  user: { id: string; username: string; name: string; is_active: boolean };
  oauth_tokens: OAuthTokenRecord[];
  third_party_links: ThirdPartyLinkRecord[];
  by_app: AppSummary[];
  totals: {
    active_token_count: number;
    distinct_app_count: number;
    third_party_link_count: number;
    total_use_count_across_tokens: number;
    stale_token_count: number;         // last used > 90 days
    never_used_token_count: number;
  };
  anomalies: Anomaly[];
}

const DEV_TOOL_APP_PATTERNS = [
  /Workbench/i,
  /Salesforce Inspector/i,
  /Data Loader/i,
  /Postman/i,
  /VS Code/i,
  /SFDX/i,
  /CLI/i,
];

async function analyze(session: Session, userId: string, log: (m: string) => void): Promise<Analysis> {
  const userRows = await runQuery(session,
    `SELECT Id, Username, Name, IsActive FROM User WHERE Id = '${esc(userId)}'`);
  const userRow = userRows[0];
  if (!userRow) throw new Error(`No User found with Id ${userId}.`);
  const user = {
    id: String(userRow['Id']),
    username: String(userRow['Username'] ?? ''),
    name: String(userRow['Name'] ?? ''),
    is_active: Boolean(userRow['IsActive']),
  };

  // OAuthToken
  log(`Querying OauthToken for user...`);
  let oauthRows: Record<string, unknown>[] = [];
  try {
    oauthRows = await runQuery(session,
      `SELECT Id, AppName, AppMenuItemId, CreatedDate, LastUsedDate, UseCount, DeleteToken, RequestToken
       FROM OauthToken WHERE UserId = '${esc(userId)}' ORDER BY LastUsedDate DESC NULLS LAST`);
    log(`  ${oauthRows.length} OAuth token(s).`);
  } catch (err) {
    log(`  OauthToken query failed (${(err as Error).message}); continuing.`);
  }

  const oauthTokens: OAuthTokenRecord[] = oauthRows.map((r) => ({
    token_id: String(r['Id'] ?? ''),
    app_name: String(r['AppName'] ?? '(unknown)'),
    app_menu_item_id: (r['AppMenuItemId'] as string) ?? null,
    created_date: String(r['CreatedDate'] ?? ''),
    last_used_date: (r['LastUsedDate'] as string) ?? null,
    use_count: Number(r['UseCount'] ?? 0),
    delete_token: (r['DeleteToken'] as string) ?? null,
    request_token: (r['RequestToken'] as string) ?? null,
  }));

  // ThirdPartyAccountLink
  log(`Querying ThirdPartyAccountLink for user...`);
  let tpalRows: Record<string, unknown>[] = [];
  try {
    tpalRows = await runQuery(session,
      `SELECT Id, ThirdPartyAccountLinkKey, ProviderType, Provider.DeveloperName, RemoteIdentifier, SsoProviderId
       FROM ThirdPartyAccountLink WHERE UserId = '${esc(userId)}'`);
    log(`  ${tpalRows.length} third-party link(s).`);
  } catch (err) {
    log(`  ThirdPartyAccountLink query failed (${(err as Error).message}); continuing.`);
  }

  const thirdPartyLinks: ThirdPartyLinkRecord[] = tpalRows.map((r) => ({
    link_id: String(r['Id'] ?? ''),
    provider_type: (r['ProviderType'] as string) ?? null,
    provider_developer_name: ((r['Provider'] as any)?.DeveloperName as string) ?? null,
    remote_identifier: String(r['RemoteIdentifier'] ?? ''),
    sso_used: r['SsoProviderId'] != null,
  }));

  // Per-app rollup
  const byAppMap = new Map<string, AppSummary>();
  for (const t of oauthTokens) {
    let s = byAppMap.get(t.app_name);
    if (!s) {
      s = {
        app_name: t.app_name,
        token_count: 0,
        first_created: t.created_date,
        most_recently_used: null,
        total_use_count: 0,
        is_dev_tool: DEV_TOOL_APP_PATTERNS.some((re) => re.test(t.app_name)),
      };
      byAppMap.set(t.app_name, s);
    }
    s.token_count++;
    s.total_use_count += t.use_count;
    if (t.last_used_date && (!s.most_recently_used || t.last_used_date > s.most_recently_used)) {
      s.most_recently_used = t.last_used_date;
    }
    if (t.created_date < s.first_created) s.first_created = t.created_date;
  }
  const byApp = [...byAppMap.values()].sort((a, b) => b.token_count - a.token_count);

  // Totals + anomalies
  const now = Date.now();
  const staleThresholdMs = 90 * 86_400_000;
  let staleCount = 0;
  let neverUsedCount = 0;
  let totalUse = 0;
  for (const t of oauthTokens) {
    totalUse += t.use_count;
    if (t.use_count === 0) neverUsedCount++;
    if (t.last_used_date && now - Date.parse(t.last_used_date) > staleThresholdMs) staleCount++;
  }

  const anomalies: Anomaly[] = [];
  if (staleCount >= 3) {
    anomalies.push({
      class: 'stale-oauth-token-accumulation',
      severity: 'medium',
      detail: `${staleCount} OAuth tokens last used > 90 days ago but still exist. Revoke them.`,
      evidence: { stale_count: staleCount },
    });
  }
  if (neverUsedCount >= 3) {
    anomalies.push({
      class: 'never-used-oauth-tokens',
      severity: 'medium',
      detail: `${neverUsedCount} OAuth tokens exist with UseCount=0. Indicates abandoned auth attempts or reconnaissance.`,
      evidence: { never_used_count: neverUsedCount },
    });
  }
  const highUseExternal = byApp.filter((a) => !a.is_dev_tool && a.total_use_count >= 1000);
  for (const a of highUseExternal) {
    anomalies.push({
      class: 'high-use-external-app',
      severity: 'low',
      detail: `App "${a.app_name}" has ${a.total_use_count} total API calls across ${a.token_count} token(s). External integration marker — verify it's authorized.`,
      evidence: { app: a },
    });
  }
  const devToolPresent = byApp.some((a) => a.is_dev_tool);
  if (devToolPresent) {
    const tools = byApp.filter((a) => a.is_dev_tool).map((a) => a.app_name);
    anomalies.push({
      class: 'developer-tool-oauth-grants',
      severity: 'low',
      detail: `User has OAuth grants for developer tools (${tools.join(', ')}). Legitimate for admins/devs; suspicious for end-users.`,
      evidence: { dev_tools: tools },
    });
  }
  const tokenChurn = byApp.filter((a) => a.token_count >= 5);
  for (const a of tokenChurn) {
    anomalies.push({
      class: 'oauth-token-churn',
      severity: 'medium',
      detail: `App "${a.app_name}" has ${a.token_count} tokens for this user. Multiple active tokens per app indicate session churn or token-leak-and-refresh pattern.`,
      evidence: { app: a },
    });
  }

  return {
    kronos_analysis_kind: 'user-connected-apps',
    user,
    oauth_tokens: oauthTokens,
    third_party_links: thirdPartyLinks,
    by_app: byApp,
    totals: {
      active_token_count: oauthTokens.length,
      distinct_app_count: byApp.length,
      third_party_link_count: thirdPartyLinks.length,
      total_use_count_across_tokens: totalUse,
      stale_token_count: staleCount,
      never_used_token_count: neverUsedCount,
    },
    anomalies,
  };
}

function renderMarkdown(a: Analysis, meta: { tool: string; tool_version: string; generated_at: string; organization_id: string; instance_url: string; api_version: string }): string {
  const L: string[] = [];
  L.push(`# Salesforce User Connected Apps Analysis`);
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
  L.push(`## Totals`);
  L.push(`| Metric | Value |`);
  L.push(`|---|---:|`);
  L.push(`| Active OAuth tokens | **${a.totals.active_token_count}** |`);
  L.push(`| Distinct apps | ${a.totals.distinct_app_count} |`);
  L.push(`| Third-party account links | ${a.totals.third_party_link_count} |`);
  L.push(`| Total UseCount across tokens | ${a.totals.total_use_count_across_tokens} |`);
  L.push(`| Stale tokens (>90d) | ${a.totals.stale_token_count} |`);
  L.push(`| Never-used tokens | ${a.totals.never_used_token_count} |`);
  L.push('');
  L.push(`## Anomalies`);
  if (a.anomalies.length === 0) L.push(`_None flagged._`);
  else for (const an of a.anomalies) L.push(`- **${an.severity.toUpperCase()}** \`${an.class}\` — ${an.detail}`);
  L.push('');
  L.push(`## By app (${a.by_app.length})`);
  if (a.by_app.length === 0) L.push(`_No OAuth tokens found._`);
  else {
    L.push(`| App | Tokens | Total UseCount | Most recently used | Dev tool |`);
    L.push(`|---|---:|---:|---|:-:|`);
    for (const app of a.by_app) L.push(`| ${app.app_name} | ${app.token_count} | ${app.total_use_count} | ${app.most_recently_used ?? '—'} | ${app.is_dev_tool ? '✅' : ''} |`);
  }
  L.push('');
  L.push(`## Third-party account links (${a.third_party_links.length})`);
  if (a.third_party_links.length === 0) L.push(`_None._`);
  else {
    L.push(`| Provider | Type | Remote id | SSO |`);
    L.push(`|---|---|---|:-:|`);
    for (const l of a.third_party_links) L.push(`| ${l.provider_developer_name ?? '—'} | \`${l.provider_type ?? ''}\` | \`${l.remote_identifier}\` | ${l.sso_used ? '✅' : ''} |`);
  }
  return L.join('\n');
}

function printHelp(): void {
  process.stderr.write([
    `${TOOL_ID} v${TOOL_VERSION}`, '',
    'Enumerate a user\'s OAuth grants and third-party account links.', '',
    'Usage: npx tsx src/index.ts --user-id <id> [options]', '',
  ].join('\n'));
}

function describeTool(): void {
  process.stdout.write(JSON.stringify({
    tool: TOOL_ID, tool_version: TOOL_VERSION,
    binding_layer: 1, tier: 2, api_family: 'salesforce.rest',
    endpoint: '/services/data/v{apiVersion}/query',
    sobjects_queried: ['User', 'OauthToken', 'ThirdPartyAccountLink'],
    authorization_ceiling_max: 2,
    argv: [{ name: 'user-id', type: 'string', required: true }],
    analysis_dimensions: [
      'oauth-tokens (per grant)',
      'by-app (rollup with dev-tool detection)',
      'third-party-links',
      'anomalies (5 heuristics: stale-oauth-token-accumulation, never-used-oauth-tokens,'
        + ' high-use-external-app, developer-tool-oauth-grants, oauth-token-churn)',
    ],
  }, null, 2) + '\n');
}

async function main(): Promise<number> {
  const invoked_at = new Date().toISOString();
  const { values } = parseArgs({
    strict: true, allowPositionals: false,
    options: {
      'user-id': { type: 'string' },
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
    'user-id': userId, credentials: resolve(values.credentials!),
    'login-url': values['login-url'], 'api-version': values['api-version'], 'output-dir': outputDir,
  };

  let creds: SalesforceCredentials | null = null;
  let session: Session | null = null;
  try {
    creds = loadCredentials({ credentialsPath: resolve(values.credentials!), loginUrlOverride: values['login-url']! });
    session = await openSession(creds, creds.loginUrl ?? values['login-url']!, values['api-version']!);
    log(`Session: instance=${session.instanceUrl}`);

    const analysis = await analyze(session, userId, log);
    log(`Analysis: tokens=${analysis.totals.active_token_count}, apps=${analysis.totals.distinct_app_count}, anomalies=${analysis.anomalies.length}`);

    mkdirSync(outputDir, { recursive: true });
    const artifacts: Array<Record<string, unknown>> = [];
    const write = (filename: string, content: string, desc: string, format = 'csv'): void => {
      const path = join(outputDir, filename);
      writeFileSync(path, content, 'utf8');
      artifacts.push({ path, format, sha256: createHash('sha256').update(content).digest('hex'), bytes: Buffer.byteLength(content, 'utf8'), description: desc });
    };
    write(`user-${slug}-oauth-tokens.csv`, toCsv(analysis.oauth_tokens as unknown as Record<string, unknown>[]), `OAuth tokens (${analysis.oauth_tokens.length}).`);
    write(`user-${slug}-third-party-links.csv`, toCsv(analysis.third_party_links as unknown as Record<string, unknown>[]), `Third-party account links (${analysis.third_party_links.length}).`);
    const aj = JSON.stringify(analysis, null, 2) + '\n';
    write(`user-${slug}-connected-apps-analysis.json`, aj, 'Structured analysis.', 'json');
    const md = renderMarkdown(analysis, { tool: TOOL_ID, tool_version: TOOL_VERSION, generated_at: new Date().toISOString(), organization_id: session.organizationId, instance_url: session.instanceUrl, api_version: values['api-version']! });
    write(`user-${slug}-connected-apps-analysis.md`, md, 'Human-readable analysis.', 'markdown');

    process.stdout.write(JSON.stringify({
      status: 'ok', tool: TOOL_ID, tool_version: TOOL_VERSION,
      invoked_at, completed_at: new Date().toISOString(),
      params: paramsForManifest, artifacts,
      metrics: {
        api_calls: session.apiCalls,
        active_token_count: analysis.totals.active_token_count,
        distinct_app_count: analysis.totals.distinct_app_count,
        third_party_link_count: analysis.totals.third_party_link_count,
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
