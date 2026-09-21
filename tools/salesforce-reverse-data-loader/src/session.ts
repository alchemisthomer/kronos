import jsforce from 'jsforce';
import type { SalesforceCredentials } from './auth.ts';

/**
 * A live authenticated Salesforce session that this tool holds open for
 * the duration of a run — many queries against one session, one login cost.
 */
export interface Session {
  conn: jsforce.Connection;
  userId: string;
  organizationId: string;
  instanceUrl: string;
  loginUrl: string;
  apiVersion: string;
  apiCalls: number;
}

export async function openSession(
  creds: SalesforceCredentials,
  loginUrl: string,
  apiVersion: string,
): Promise<Session> {
  const conn = new jsforce.Connection({ loginUrl, version: apiVersion });
  const userInfo = await conn.login(creds.username, creds.password + creds.securityToken);
  return {
    conn,
    userId: userInfo.id,
    organizationId: userInfo.organizationId,
    instanceUrl: conn.instanceUrl,
    loginUrl,
    apiVersion,
    apiCalls: 1, // login
  };
}

export async function closeSession(session: Session): Promise<void> {
  try {
    await session.conn.logout();
  } catch {
    // best-effort
  }
}

/**
 * Run a SOQL statement against /query and exhaust nextRecordsUrl.
 * Returns all records in memory (jsforce holds them anyway).
 */
export async function runQuery(
  session: Session,
  soql: string,
): Promise<{ records: Record<string, unknown>[]; totalSize: number; apiCalls: number }> {
  let calls = 0;
  const records: Record<string, unknown>[] = [];
  let result = await session.conn.query(soql);
  calls++;
  records.push(...(result.records as Record<string, unknown>[]));
  while (!result.done && result.nextRecordsUrl) {
    result = await session.conn.queryMore(result.nextRecordsUrl);
    calls++;
    records.push(...(result.records as Record<string, unknown>[]));
  }
  session.apiCalls += calls;
  return { records, totalSize: result.totalSize, apiCalls: calls };
}

/**
 * SELECT COUNT() FROM {sobject}. Returns the number of rows visible to
 * the authenticated user. Uses jsforce.query which returns { totalSize }
 * with an empty records array for aggregate queries.
 */
export async function countRows(session: Session, sobject: string): Promise<number> {
  const result = await session.conn.query(`SELECT COUNT() FROM ${sobject}`);
  session.apiCalls++;
  return result.totalSize;
}

/**
 * Probe access via SELECT Id FROM {sobject} LIMIT 1. Returns
 * { granted: true } on success, { granted: false, code, message } on
 * any Salesforce error (INSUFFICIENT_ACCESS, INVALID_TYPE, etc.).
 * A denied probe is a valid finding, not a tool error.
 */
export async function probeAccess(
  session: Session,
  sobject: string,
): Promise<
  | { granted: true; probeRecords: number }
  | { granted: false; code: string; message: string }
> {
  try {
    const result = await session.conn.query(`SELECT Id FROM ${sobject} LIMIT 1`);
    session.apiCalls++;
    return { granted: true, probeRecords: result.records.length };
  } catch (err) {
    session.apiCalls++;
    return classifyDenial(err);
  }
}

/**
 * SELECT FIELDS(ALL) FROM {sobject} LIMIT 200 — the field-enumeration
 * primitive. Returns up to 200 records; caller extracts the field set
 * from the union of record keys.
 */
export async function enumerateFields(
  session: Session,
  sobject: string,
): Promise<{ records: Record<string, unknown>[]; totalSize: number }> {
  const result = await session.conn.query(`SELECT FIELDS(ALL) FROM ${sobject} LIMIT 200`);
  session.apiCalls++;
  return {
    records: result.records as Record<string, unknown>[],
    totalSize: result.totalSize,
  };
}

/**
 * GET /services/data/v{version}/sobjects/{name}/describe — authoritative
 * per-field metadata for one sobject. Returns the full describe object
 * on success, or a denial reason on failure. This is the ground truth
 * for field enumeration; FIELDS(ALL) is an APPROXIMATION with known
 * silent-drop behavior (per-org, per-API-version).
 */
export async function describeSobject(
  session: Session,
  sobject: string,
): Promise<
  | { granted: true; describe: any; field_names: string[]; custom_field_names: string[]; compound_field_names: string[] }
  | { granted: false; code: string; message: string }
> {
  try {
    const desc: any = await session.conn.sobject(sobject).describe();
    session.apiCalls++;
    const fields: Array<{ name: string; type?: string; custom?: boolean }> = desc.fields ?? [];
    const field_names = fields.map((f) => f.name);
    const custom_field_names = fields.filter((f) => f.custom).map((f) => f.name);
    const compound_field_names = [
      ...new Set(
        fields
          .filter((f) => {
            const t = (f.type ?? '').toLowerCase();
            return t === 'address' || t === 'location';
          })
          .map((f) => f.name),
      ),
    ].sort();
    return { granted: true, describe: desc, field_names, custom_field_names, compound_field_names };
  } catch (err) {
    session.apiCalls++;
    return classifyDenial(err);
  }
}

/**
 * GET /services/data/v{version}/sobjects/ — list every sobject the
 * authenticated user is allowed to see the metadata of. This itself
 * requires the "API Enabled" permission; failure is a valid finding.
 */
export async function listSobjects(
  session: Session,
): Promise<
  | { granted: true; names: string[]; queryable: string[] }
  | { granted: false; code: string; message: string }
> {
  try {
    const global: any = await session.conn.describeGlobal();
    session.apiCalls++;
    const all: Array<{ name: string; queryable: boolean; deprecatedAndHidden?: boolean }> =
      global.sobjects ?? [];
    const names = all.map((s) => s.name).sort();
    const queryable = all
      .filter((s) => s.queryable && !s.deprecatedAndHidden)
      .map((s) => s.name)
      .sort();
    return { granted: true, names, queryable };
  } catch (err) {
    session.apiCalls++;
    return classifyDenial(err);
  }
}

function classifyDenial(err: unknown): { granted: false; code: string; message: string } {
  const anyErr = err as { errorCode?: string; name?: string; message?: string };
  const message = anyErr.message ?? String(err);
  if (/INSUFFICIENT_ACCESS/.test(message) || anyErr.errorCode === 'INSUFFICIENT_ACCESS') {
    return { granted: false, code: 'insufficient-access', message };
  }
  if (/INVALID_TYPE|sObject type .* is not supported/.test(message)) {
    return { granted: false, code: 'sobject-invalid-or-hidden', message };
  }
  if (/API_DISABLED_FOR_ORG/.test(message)) {
    return { granted: false, code: 'api-disabled', message };
  }
  return { granted: false, code: 'query-error', message };
}
