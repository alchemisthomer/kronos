import jsforce from 'jsforce';
import type { SalesforceCredentials } from '../../_shared/salesforce/auth.ts';

/**
 * The Permissions* fields we care about on Profile and PermissionSet.
 * Salesforce has ~200 such fields; this is the security-relevant subset
 * that maps to attack-surface concerns. Extend when catalog entries call for it.
 */
export const CRITICAL_PERMISSION_FIELDS = [
  // System-wide privilege escalation
  'PermissionsModifyAllData',
  'PermissionsViewAllData',
  'PermissionsViewAllUsers',
  'PermissionsManageUsers',
  'PermissionsAssignPermissionSets',
  'PermissionsManageProfilesPermissionsets',
  'PermissionsManagePasswordPolicies',
  'PermissionsManageIpAddresses',
  'PermissionsManageSharing',
  'PermissionsViewSetup',
  'PermissionsCustomizeApplication',
  'PermissionsAuthorApex',
  'PermissionsModifyMetadata',
  'PermissionsManageDataIntegrations',
  'PermissionsManageRemoteAccess',
  'PermissionsManageAuthProviders',
  'PermissionsManageSessionPermissionSets',
  'PermissionsResetPasswords',
  'PermissionsImpersonateUsers',
  // API / bulk / export
  'PermissionsApiEnabled',
  'PermissionsBulkApiHardDelete',
  'PermissionsApiUserOnly',
  'PermissionsExportReport',
  'PermissionsRunReports',
  'PermissionsManageReportsInPubFolders',
  'PermissionsScheduleReports',
  // Data destruction
  'PermissionsDeleteContent',
  'PermissionsDeleteActivatedContact',
  'PermissionsPurgeCategoryPrivateFeed',
  // Direct-database / dev
  'PermissionsUseTemplatedApp',
  'PermissionsInstallPackaging',
  'PermissionsPublishPackaging',
  // Feature-gated
  'PermissionsMassInlineEdit',
  'PermissionsTransferAnyLead',
  'PermissionsTransferAnyCase',
  'PermissionsTransferAnyEntity',
  // Data-loader-adjacent
  'PermissionsBulkMacrosAllowed',
  'PermissionsDataExport',
  // Audit / compliance
  'PermissionsViewEventLogFiles',
  'PermissionsViewSetupAndConfig',
] as const;

const USER_QUERY_FIELDS = [
  'Id', 'Username', 'Name', 'FirstName', 'LastName', 'Email',
  'ProfileId', 'Profile.Name', 'Profile.UserType',
  'UserRoleId', 'UserRole.Name',
  'IsActive', 'UserType', 'Alias',
  'LastLoginDate', 'LastPasswordChangeDate', 'CreatedDate',
  'ManagerId', 'Manager.Name', 'Manager.Email',
  'FederationIdentifier', 'CommunityNickname',
] as const;

const PSA_QUERY_FIELDS = [
  'Id', 'PermissionSetId', 'AssigneeId',
  'PermissionSet.Name', 'PermissionSet.Label', 'PermissionSet.Type',
  'PermissionSet.IsCustom', 'PermissionSet.NamespacePrefix',
  'PermissionSet.Description', 'PermissionSet.IsOwnedByProfile',
] as const;

const OBJECT_PERM_FIELDS = [
  'Id', 'ParentId', 'Parent.Name', 'Parent.IsOwnedByProfile',
  'SobjectType',
  'PermissionsRead', 'PermissionsCreate', 'PermissionsEdit', 'PermissionsDelete',
  'PermissionsViewAllRecords', 'PermissionsModifyAllRecords',
] as const;

const FIELD_PERM_FIELDS = [
  'Id', 'ParentId', 'SobjectType', 'Field',
  'PermissionsRead', 'PermissionsEdit',
] as const;

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
  creds: SalesforceCredentials,
  loginUrl: string,
  apiVersion: string,
): Promise<Session> {
  const conn = new jsforce.Connection({ loginUrl, version: apiVersion });
  const userInfo = await conn.login(creds.username, creds.password + creds.securityToken);
  return {
    conn,
    callerUserId: userInfo.id,
    organizationId: userInfo.organizationId,
    instanceUrl: conn.instanceUrl,
    loginUrl,
    apiVersion,
    apiCalls: 1,
  };
}

export async function closeSession(s: Session): Promise<void> {
  try { await s.conn.logout(); } catch { /* best-effort */ }
}

/**
 * Run a SOQL query and exhaust nextRecordsUrl. Session-scoped API-call
 * counter incremented.
 */
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

function escapeSoqlLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function inClause(ids: string[]): string {
  return ids.map((id) => `'${escapeSoqlLiteral(id)}'`).join(',');
}

export async function queryUser(s: Session, userId: string): Promise<Record<string, unknown> | null> {
  const rows = await runQuery(s, `SELECT ${USER_QUERY_FIELDS.join(', ')} FROM User WHERE Id = '${escapeSoqlLiteral(userId)}'`);
  return rows[0] ?? null;
}

export async function queryProfileWithPermissions(
  s: Session,
  profileId: string,
): Promise<Record<string, unknown> | null> {
  const fields = ['Id', 'Name', 'UserType', 'Description', ...CRITICAL_PERMISSION_FIELDS];
  const rows = await runQuery(
    s,
    `SELECT ${fields.join(', ')} FROM Profile WHERE Id = '${escapeSoqlLiteral(profileId)}'`,
  );
  return rows[0] ?? null;
}

/**
 * Every Profile has an implicit PermissionSet whose ProfileId = the profile.
 * That implicit PS is what actually owns the Profile's ObjectPermissions
 * and FieldPermissions in the ObjectPermissions/FieldPermissions sobjects.
 * Returns the PS Id we need for the object/field permissions queries.
 */
export async function queryImplicitPermissionSetForProfile(
  s: Session,
  profileId: string,
): Promise<string | null> {
  const rows = await runQuery(
    s,
    `SELECT Id FROM PermissionSet WHERE ProfileId = '${escapeSoqlLiteral(profileId)}'`,
  );
  return (rows[0]?.['Id'] as string) ?? null;
}

export async function queryPermissionSetAssignments(
  s: Session,
  userId: string,
): Promise<Record<string, unknown>[]> {
  return runQuery(
    s,
    `SELECT ${PSA_QUERY_FIELDS.join(', ')} FROM PermissionSetAssignment WHERE AssigneeId = '${escapeSoqlLiteral(userId)}'`,
  );
}

export async function queryPermissionSetsDetail(
  s: Session,
  permissionSetIds: string[],
): Promise<Record<string, unknown>[]> {
  if (permissionSetIds.length === 0) return [];
  const fields = [
    'Id', 'Name', 'Label', 'Type', 'IsCustom', 'IsOwnedByProfile',
    'NamespacePrefix', 'Description', 'ProfileId',
    ...CRITICAL_PERMISSION_FIELDS,
  ];
  return runQuery(
    s,
    `SELECT ${fields.join(', ')} FROM PermissionSet WHERE Id IN (${inClause(permissionSetIds)})`,
  );
}

export async function queryObjectPermissions(
  s: Session,
  permissionSetIds: string[],
): Promise<Record<string, unknown>[]> {
  if (permissionSetIds.length === 0) return [];
  return runQuery(
    s,
    `SELECT ${OBJECT_PERM_FIELDS.join(', ')} FROM ObjectPermissions WHERE ParentId IN (${inClause(permissionSetIds)})`,
  );
}

export async function queryFieldPermissions(
  s: Session,
  permissionSetIds: string[],
): Promise<Record<string, unknown>[]> {
  if (permissionSetIds.length === 0) return [];
  return runQuery(
    s,
    `SELECT ${FIELD_PERM_FIELDS.join(', ')} FROM FieldPermissions WHERE ParentId IN (${inClause(permissionSetIds)})`,
  );
}
