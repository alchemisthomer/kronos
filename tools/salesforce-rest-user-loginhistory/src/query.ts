import jsforce from 'jsforce';
import type { SalesforceCredentials } from '../../_shared/salesforce/auth.ts';

/**
 * LoginHistory fields we query. Order = column order in the output CSV.
 * Related objects reached via relationship fields:
 *   - Users.Username (login identity via UserId)
 *   - LoginGeo.CountryIso / City / PostalCode / Latitude / Longitude
 */
export const LOGIN_HISTORY_FIELDS = [
  'Id',
  'UserId',
  'Users.Username',
  'Users.Name',
  'Users.Profile.Name',
  'LoginTime',
  'SourceIp',
  'LoginType',
  'LoginUrl',
  'AuthenticationServiceId',
  'AuthenticationMethodReference',
  'LoginGeoId',
  'LoginGeo.CountryIso',
  'LoginGeo.Country',
  'LoginGeo.City',
  'LoginGeo.PostalCode',
  'LoginGeo.Latitude',
  'LoginGeo.Longitude',
  'Browser',
  'Platform',
  'Application',
  'Status',
  'ApiType',
  'ApiVersion',
  'ClientVersion',
  'TlsProtocol',
  'CipherSuite',
] as const;

export interface QueryLoginHistoryOptions {
  credentials: SalesforceCredentials;
  loginUrl: string;
  apiVersion: string;
  userId?: string;        // if omitted, queries every user's history (requires admin perms)
  sinceIso?: string;      // ISO 8601; if set, filters LoginTime >= this
  untilIso?: string;      // ISO 8601; if set, filters LoginTime < this
  limit?: number | null;  // null = unbounded (follow nextRecordsUrl)
}

export interface QueryResult {
  records: Record<string, unknown>[];
  totalSize: number;
  apiCalls: number;
  instanceUrl: string;
  organizationId: string;
  soql: string;
  sessionId: string;
}

export async function queryLoginHistory(
  opts: QueryLoginHistoryOptions,
): Promise<QueryResult> {
  const conn = new jsforce.Connection({
    loginUrl: opts.loginUrl,
    version: opts.apiVersion,
  });
  const userInfo = await conn.login(
    opts.credentials.username,
    opts.credentials.password + opts.credentials.securityToken,
  );

  const soql = buildSoql(opts);
  let apiCalls = 1;
  const records: Record<string, unknown>[] = [];

  try {
    let result = await conn.query(soql);
    apiCalls++;
    records.push(...(result.records as Record<string, unknown>[]));
    while (!result.done && result.nextRecordsUrl) {
      result = await conn.queryMore(result.nextRecordsUrl);
      apiCalls++;
      records.push(...(result.records as Record<string, unknown>[]));
    }
    return {
      records,
      totalSize: result.totalSize,
      apiCalls,
      instanceUrl: conn.instanceUrl,
      organizationId: userInfo.organizationId,
      soql,
      sessionId: conn.accessToken ?? '',
    };
  } finally {
    try { await conn.logout(); } catch { /* best-effort */ }
  }
}

function buildSoql(opts: QueryLoginHistoryOptions): string {
  const where: string[] = [];
  if (opts.userId) where.push(`UserId = '${escapeSoqlLiteral(opts.userId)}'`);
  if (opts.sinceIso) where.push(`LoginTime >= ${opts.sinceIso}`);
  if (opts.untilIso) where.push(`LoginTime < ${opts.untilIso}`);
  const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const limitClause = opts.limit != null ? ` LIMIT ${opts.limit}` : '';
  return (
    `SELECT ${LOGIN_HISTORY_FIELDS.join(', ')} ` +
    `FROM LoginHistory${whereClause} ORDER BY LoginTime DESC${limitClause}`
  );
}

/**
 * SOQL literal escaping — Id values are alphanumeric, but defense-in-depth
 * against a maliciously-crafted --user-id argv value.
 */
function escapeSoqlLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
