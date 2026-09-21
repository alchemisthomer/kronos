import jsforce from 'jsforce';
import type { SalesforceCredentials } from '../../_shared/salesforce/auth.ts';

/** Default sobjects to probe for record shares. Extendable via CLI. */
export const DEFAULT_SHARE_SOBJECTS = [
  'Account', 'Contact', 'Lead', 'Opportunity', 'Case',
] as const;

/** Cap per-sobject share rows fetched to keep runs bounded on large orgs. */
export const DEFAULT_SHARE_SAMPLE_LIMIT = 2000;

export interface Session {
  conn: jsforce.Connection;
  callerUserId: string;
  organizationId: string;
  instanceUrl: string;
  loginUrl: string;
  apiVersion: string;
  apiCalls: number;
}

export async function openSession(
  creds: SalesforceCredentials, loginUrl: string, apiVersion: string,
): Promise<Session> {
  const conn = new jsforce.Connection({ loginUrl, version: apiVersion });
  const userInfo = await conn.login(creds.username, creds.password + creds.securityToken);
  return {
    conn,
    callerUserId: userInfo.id,
    organizationId: userInfo.organizationId,
    instanceUrl: conn.instanceUrl,
    loginUrl, apiVersion, apiCalls: 1,
  };
}

export async function closeSession(s: Session): Promise<void> {
  try { await s.conn.logout(); } catch { /* best-effort */ }
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

export async function queryUser(s: Session, userId: string): Promise<Record<string, unknown> | null> {
  const rows = await runQuery(
    s,
    `SELECT Id, Username, Name, Email, ProfileId, Profile.Name, UserRoleId, UserRole.Name, IsActive
     FROM User WHERE Id = '${esc(userId)}'`,
  );
  return rows[0] ?? null;
}

/**
 * Query all UserRole records in the org (typically a small table, up to ~500
 * per Salesforce limits). Enables role-hierarchy traversal in analyze.ts
 * without recursive SOQL (which isn't supported).
 */
export async function queryAllRoles(s: Session): Promise<Record<string, unknown>[]> {
  return runQuery(
    s,
    `SELECT Id, Name, DeveloperName, ParentRoleId, ParentRole.Name, RollupDescription,
            PortalType, OpportunityAccessForAccountOwner, CaseAccessForAccountOwner,
            ContactAccessForAccountOwner
     FROM UserRole ORDER BY Name`,
  );
}

/**
 * Direct GroupMember rows for the user. Also queries the Group table for
 * each group's Type so callers know which are Regular / Queue / Role /
 * RoleAndSubordinates / RoleAndSubordinatesInternal / etc.
 */
export async function queryGroupMemberships(
  s: Session, userId: string,
): Promise<Record<string, unknown>[]> {
  return runQuery(
    s,
    `SELECT Id, GroupId, Group.Name, Group.DeveloperName, Group.Type,
            Group.DoesIncludeBosses, Group.RelatedId
     FROM GroupMember WHERE UserOrGroupId = '${esc(userId)}'`,
  );
}

/**
 * Per-sobject share query. Each Share sobject follows the convention
 * <SObject>Share with fields UserOrGroupId, RowCause, AccessLevel + one
 * per-record identifier (e.g. AccountId on AccountShare).
 *
 * `recipientIds` is the union of user id + all group ids the user is a
 * member of — Shares granting to any of these give access to the user.
 * Result capped by `sampleLimit` to bound run cost on massive orgs.
 */
export async function querySharesForSobject(
  s: Session,
  sobject: string,
  recipientIds: string[],
  sampleLimit: number,
): Promise<Record<string, unknown>[]> {
  if (recipientIds.length === 0) return [];
  const parentField = sobject.endsWith('__c')
    ? 'ParentId'          // custom object shares use ParentId
    : `${sobject}Id`;     // standard object shares use <SObject>Id
  const shareSobject = sobject.endsWith('__c')
    ? sobject.replace(/__c$/, '__Share')
    : `${sobject}Share`;
  try {
    return await runQuery(
      s,
      `SELECT Id, ${parentField}, UserOrGroupId, RowCause, AccessLevel
       FROM ${shareSobject}
       WHERE UserOrGroupId IN (${inList(recipientIds)})
       ORDER BY RowCause, ${parentField}
       LIMIT ${sampleLimit}`,
    );
  } catch (err) {
    // Sobject may not have sharing enabled (public read/write) or share
    // sobject may not exist. Returning empty lets the caller record this
    // as "no shares queryable" rather than tool-error.
    const msg = (err as Error).message ?? String(err);
    if (/INVALID_TYPE|does not support/i.test(msg)) return [];
    throw err;
  }
}
