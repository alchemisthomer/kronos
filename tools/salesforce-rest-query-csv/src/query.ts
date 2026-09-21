import jsforce from 'jsforce';
import type { SalesforceCredentials } from './auth.ts';

export interface RunQueryOptions {
  credentials: SalesforceCredentials;
  loginUrl: string;
  apiVersion: string;
  soql: string;
}

export interface RunQueryResult {
  records: Record<string, unknown>[];
  totalSize: number;
  instanceUrl: string;
  organizationId: string;
  sessionId: string;
  apiCalls: number;
}

/**
 * Log in via SOAP username-password flow and execute a SOQL statement
 * against the standard REST /query endpoint. Follows nextRecordsUrl to
 * exhaust the result set (FIELDS(ALL) queries cap at LIMIT 200 and will
 * not paginate; general SOQL will).
 */
export async function runQuery(opts: RunQueryOptions): Promise<RunQueryResult> {
  const conn = new jsforce.Connection({
    loginUrl: opts.loginUrl,
    version: opts.apiVersion,
  });

  const userInfo = await conn.login(
    opts.credentials.username,
    opts.credentials.password + opts.credentials.securityToken,
  );

  let apiCalls = 1; // login costs 1 call
  const records: Record<string, unknown>[] = [];
  let totalSize = 0;

  try {
    let result = await conn.query(opts.soql);
    apiCalls++;
    totalSize = result.totalSize;
    records.push(...(result.records as Record<string, unknown>[]));

    while (!result.done && result.nextRecordsUrl) {
      result = await conn.queryMore(result.nextRecordsUrl);
      apiCalls++;
      records.push(...(result.records as Record<string, unknown>[]));
    }

    return {
      records,
      totalSize,
      instanceUrl: conn.instanceUrl,
      organizationId: userInfo.organizationId,
      sessionId: conn.accessToken ?? '',
      apiCalls,
    };
  } finally {
    // Best-effort logout; failure to invalidate the session is not fatal.
    try {
      await conn.logout();
    } catch {
      // ignore
    }
  }
}
