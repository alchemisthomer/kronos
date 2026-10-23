import { CRITICAL_PERMISSION_FIELDS } from './query.ts';

export interface EffectiveObjectPermission {
  sobject: string;
  read: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  view_all_records: boolean;
  modify_all_records: boolean;
  sources: Array<{ parent_id: string; parent_name: string; is_profile_implicit: boolean }>;
}

export interface EffectiveFieldPermission {
  sobject: string;
  field: string;
  read: boolean;
  edit: boolean;
  source_count: number;
}

export interface PermissionSourceSummary {
  parent_id: string;
  parent_name: string;
  kind: 'profile' | 'permissionset';
  is_custom: boolean;
  is_namespaced: boolean;
  critical_permissions_true: string[];
}

export interface Anomaly {
  class: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
  evidence: Record<string, unknown>;
}

export interface UserPermissionsAnalysis {
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    profile_id: string;
    profile_name: string;
    user_role_id: string | null;
    user_role_name: string | null;
    is_active: boolean;
    user_type: string;
    last_login_date: string | null;
    last_password_change_date: string | null;
    created_date: string;
    manager_name: string | null;
  };
  permission_sources: {
    profile: PermissionSourceSummary;
    permissionsets: PermissionSourceSummary[];
    total_source_count: number;
  };
  critical_permissions_effective: string[];   // union across profile + all PSs
  effective_object_permissions: EffectiveObjectPermission[];
  effective_field_permissions_by_sobject: Record<string, EffectiveFieldPermission[]>;
  totals: {
    permissionset_count: number;
    permissionset_custom_count: number;
    permissionset_namespaced_count: number;
    object_permission_count: number;
    field_permission_count: number;
    sobjects_with_view_all_records: number;
    sobjects_with_modify_all_records: number;
    sobjects_with_delete: number;
  };
  anomalies: Anomaly[];
}

export function analyzeUserPermissions(input: {
  userRow: Record<string, unknown>;
  profileRow: Record<string, unknown>;
  permissionSetAssignments: Record<string, unknown>[];
  permissionSetsDetail: Record<string, unknown>[];
  objectPermissions: Record<string, unknown>[];
  fieldPermissions: Record<string, unknown>[];
  profileImplicitPsId: string | null;
}): UserPermissionsAnalysis {
  const {
    userRow, profileRow, permissionSetAssignments, permissionSetsDetail,
    objectPermissions, fieldPermissions, profileImplicitPsId,
  } = input;

  const user = extractUser(userRow);
  const profileSource = extractProfileSource(profileRow);
  const psSources = permissionSetsDetail.map((ps) => extractPsSource(ps));

  // Critical permissions union: any TRUE on profile OR any assigned PS.
  const criticalEffective = new Set<string>();
  for (const p of profileSource.critical_permissions_true) criticalEffective.add(p);
  for (const ps of psSources) for (const p of ps.critical_permissions_true) criticalEffective.add(p);

  // Aggregate object permissions across all ParentIds.
  const effectiveObjectPerms = aggregateObjectPermissions(objectPermissions, profileImplicitPsId);

  // Aggregate field permissions, grouped by sobject.
  const effectiveFieldPerms = aggregateFieldPermissions(fieldPermissions);

  const totals = {
    permissionset_count: permissionSetAssignments.length,
    permissionset_custom_count: psSources.filter((p) => p.is_custom).length,
    permissionset_namespaced_count: psSources.filter((p) => p.is_namespaced).length,
    object_permission_count: objectPermissions.length,
    field_permission_count: fieldPermissions.length,
    sobjects_with_view_all_records: effectiveObjectPerms.filter((o) => o.view_all_records).length,
    sobjects_with_modify_all_records: effectiveObjectPerms.filter((o) => o.modify_all_records).length,
    sobjects_with_delete: effectiveObjectPerms.filter((o) => o.delete).length,
  };

  const anomalies = detectAnomalies({
    user, profileSource, psSources, criticalEffective, effectiveObjectPerms, totals,
  });

  return {
    user,
    permission_sources: {
      profile: profileSource,
      permissionsets: psSources,
      total_source_count: 1 + psSources.length,
    },
    critical_permissions_effective: [...criticalEffective].sort(),
    effective_object_permissions: effectiveObjectPerms,
    effective_field_permissions_by_sobject: effectiveFieldPerms,
    totals,
    anomalies,
  };
}

function extractUser(row: Record<string, unknown>): UserPermissionsAnalysis['user'] {
  const profile = row['Profile'] as Record<string, unknown> | undefined;
  const role = row['UserRole'] as Record<string, unknown> | undefined;
  const manager = row['Manager'] as Record<string, unknown> | undefined;
  return {
    id: String(row['Id'] ?? ''),
    username: String(row['Username'] ?? ''),
    name: String(row['Name'] ?? ''),
    email: String(row['Email'] ?? ''),
    profile_id: String(row['ProfileId'] ?? ''),
    profile_name: profile ? String(profile['Name'] ?? '') : '',
    user_role_id: (row['UserRoleId'] as string) ?? null,
    user_role_name: role ? String(role['Name'] ?? '') : null,
    is_active: Boolean(row['IsActive']),
    user_type: String(row['UserType'] ?? ''),
    last_login_date: (row['LastLoginDate'] as string) ?? null,
    last_password_change_date: (row['LastPasswordChangeDate'] as string) ?? null,
    created_date: String(row['CreatedDate'] ?? ''),
    manager_name: manager ? String(manager['Name'] ?? '') : null,
  };
}

function extractProfileSource(row: Record<string, unknown>): PermissionSourceSummary {
  const criticalTrue = CRITICAL_PERMISSION_FIELDS.filter((p) => row[p] === true);
  return {
    parent_id: String(row['Id'] ?? ''),
    parent_name: String(row['Name'] ?? ''),
    kind: 'profile',
    is_custom: false,
    is_namespaced: false,
    critical_permissions_true: [...criticalTrue],
  };
}

function extractPsSource(row: Record<string, unknown>): PermissionSourceSummary {
  const criticalTrue = CRITICAL_PERMISSION_FIELDS.filter((p) => row[p] === true);
  const ns = row['NamespacePrefix'];
  return {
    parent_id: String(row['Id'] ?? ''),
    parent_name: String(row['Label'] ?? row['Name'] ?? ''),
    kind: 'permissionset',
    is_custom: row['IsCustom'] === true,
    is_namespaced: typeof ns === 'string' && ns.length > 0,
    critical_permissions_true: [...criticalTrue],
  };
}

function aggregateObjectPermissions(
  rows: Record<string, unknown>[],
  profileImplicitPsId: string | null,
): EffectiveObjectPermission[] {
  const bySobject = new Map<string, EffectiveObjectPermission>();
  for (const r of rows) {
    const sobject = String(r['SobjectType'] ?? '');
    if (!sobject) continue;
    const parentId = String(r['ParentId'] ?? '');
    const parent = r['Parent'] as Record<string, unknown> | undefined;
    const parentName = parent ? String(parent['Name'] ?? '') : parentId;
    const isProfileImplicit = parentId === profileImplicitPsId;

    let e = bySobject.get(sobject);
    if (!e) {
      e = {
        sobject,
        read: false, create: false, edit: false, delete: false,
        view_all_records: false, modify_all_records: false,
        sources: [],
      };
      bySobject.set(sobject, e);
    }
    e.read = e.read || r['PermissionsRead'] === true;
    e.create = e.create || r['PermissionsCreate'] === true;
    e.edit = e.edit || r['PermissionsEdit'] === true;
    e.delete = e.delete || r['PermissionsDelete'] === true;
    e.view_all_records = e.view_all_records || r['PermissionsViewAllRecords'] === true;
    e.modify_all_records = e.modify_all_records || r['PermissionsModifyAllRecords'] === true;
    e.sources.push({
      parent_id: parentId,
      parent_name: parentName,
      is_profile_implicit: isProfileImplicit,
    });
  }
  return [...bySobject.values()].sort((a, b) => a.sobject.localeCompare(b.sobject));
}

function aggregateFieldPermissions(
  rows: Record<string, unknown>[],
): Record<string, EffectiveFieldPermission[]> {
  // Map key: sobject.field
  const byKey = new Map<string, EffectiveFieldPermission>();
  for (const r of rows) {
    const sobject = String(r['SobjectType'] ?? '');
    const field = String(r['Field'] ?? '');
    if (!sobject || !field) continue;
    const key = `${sobject}::${field}`;
    let e = byKey.get(key);
    if (!e) {
      e = { sobject, field, read: false, edit: false, source_count: 0 };
      byKey.set(key, e);
    }
    e.read = e.read || r['PermissionsRead'] === true;
    e.edit = e.edit || r['PermissionsEdit'] === true;
    e.source_count++;
  }
  const bySobject: Record<string, EffectiveFieldPermission[]> = {};
  for (const e of byKey.values()) {
    if (!bySobject[e.sobject]) bySobject[e.sobject] = [];
    bySobject[e.sobject]!.push(e);
  }
  for (const key of Object.keys(bySobject)) {
    bySobject[key]!.sort((a, b) => a.field.localeCompare(b.field));
  }
  return bySobject;
}

function detectAnomalies(ctx: {
  user: UserPermissionsAnalysis['user'];
  profileSource: PermissionSourceSummary;
  psSources: PermissionSourceSummary[];
  criticalEffective: Set<string>;
  effectiveObjectPerms: EffectiveObjectPermission[];
  totals: UserPermissionsAnalysis['totals'];
}): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const has = (p: string) => ctx.criticalEffective.has(p);

  // 1. ModifyAllData on a non-admin-named profile.
  if (has('PermissionsModifyAllData') &&
      !/System Administrator|Admin/i.test(ctx.profileSource.parent_name)) {
    anomalies.push({
      class: 'admin-permission-not-admin-profile',
      severity: 'high',
      detail: `User has ModifyAllData but base Profile is "${ctx.profileSource.parent_name}" — verify a PermissionSet grant is intentional.`,
      evidence: { profile: ctx.profileSource.parent_name },
    });
  }

  // 2. API + ModifyAllData — the classic data-exfil primitive.
  if (has('PermissionsModifyAllData') && has('PermissionsApiEnabled')) {
    anomalies.push({
      class: 'api-plus-modify-all-data',
      severity: 'critical',
      detail: 'User has both ApiEnabled and ModifyAllData. Compromise of this account permits arbitrary data pulls and mutations via Salesforce APIs.',
      evidence: {},
    });
  }

  // 3. BulkApiHardDelete — bypasses recycle bin.
  if (has('PermissionsBulkApiHardDelete')) {
    anomalies.push({
      class: 'bulk-api-hard-delete-granted',
      severity: 'high',
      detail: 'User can permanently delete records via Bulk API (bypasses recycle bin, unrecoverable).',
      evidence: {},
    });
  }

  // 4. ExportReport — data-exfil vector.
  if (has('PermissionsExportReport')) {
    anomalies.push({
      class: 'report-export-granted',
      severity: 'medium',
      detail: 'User can export reports. Combined with broad record read access, this is a data-exfil vector.',
      evidence: {},
    });
  }

  // 5. ManageUsers — permission escalation via user reset/creation.
  if (has('PermissionsManageUsers')) {
    anomalies.push({
      class: 'manage-users-granted',
      severity: 'high',
      detail: 'User can create, modify, and deactivate other users — permission-escalation vector via user provisioning.',
      evidence: {},
    });
  }

  // 6. AssignPermissionSets — permission escalation via self-elevation.
  if (has('PermissionsAssignPermissionSets')) {
    anomalies.push({
      class: 'assign-permission-sets-granted',
      severity: 'critical',
      detail: 'User can assign PermissionSets — including to themselves. Direct self-escalation vector.',
      evidence: {},
    });
  }

  // 7. AuthorApex + ModifyAllData — arbitrary code execution with system data access.
  if (has('PermissionsAuthorApex') && has('PermissionsModifyAllData')) {
    anomalies.push({
      class: 'apex-authoring-with-modify-all',
      severity: 'critical',
      detail: 'User can author Apex code AND ModifyAllData. Compromise permits arbitrary server-side code execution with unrestricted data access.',
      evidence: {},
    });
  }

  // 8. High PermissionSet count.
  if (ctx.totals.permissionset_count >= 20) {
    anomalies.push({
      class: 'high-permissionset-count',
      severity: 'medium',
      detail: `User assigned ${ctx.totals.permissionset_count} PermissionSets. High counts indicate over-fitted permissions; hard to audit.`,
      evidence: { count: ctx.totals.permissionset_count },
    });
  }

  // 9. Broad ViewAllRecords across many sobjects.
  if (ctx.totals.sobjects_with_view_all_records >= 20) {
    anomalies.push({
      class: 'view-all-records-broad',
      severity: 'high',
      detail: `User has ViewAllRecords on ${ctx.totals.sobjects_with_view_all_records} sobjects — sharing rules do not restrict this user's read scope.`,
      evidence: { count: ctx.totals.sobjects_with_view_all_records },
    });
  }

  // 10. ModifyAllRecords broad.
  if (ctx.totals.sobjects_with_modify_all_records >= 5) {
    anomalies.push({
      class: 'modify-all-records-broad',
      severity: 'high',
      detail: `User can Modify all records on ${ctx.totals.sobjects_with_modify_all_records} sobjects — sharing rules do not restrict this user's write scope.`,
      evidence: { count: ctx.totals.sobjects_with_modify_all_records },
    });
  }

  // 11. Impersonation.
  if (has('PermissionsImpersonateUsers')) {
    anomalies.push({
      class: 'user-impersonation-granted',
      severity: 'critical',
      detail: 'User can log in as any other user (impersonate). Detection of unauthorized activity becomes ambiguous.',
      evidence: {},
    });
  }

  // 12. Stale password (> 365 days since last change) if active.
  if (ctx.user.is_active && ctx.user.last_password_change_date) {
    const ageDays = (Date.now() - Date.parse(ctx.user.last_password_change_date)) / 86_400_000;
    if (ageDays > 365) {
      anomalies.push({
        class: 'stale-password',
        severity: 'medium',
        detail: `Password last changed ${Math.round(ageDays)} days ago on an active user.`,
        evidence: { days_since_change: Math.round(ageDays) },
      });
    }
  }

  // 13. Active but never logged in — orphaned identity.
  if (ctx.user.is_active && !ctx.user.last_login_date) {
    anomalies.push({
      class: 'active-user-never-logged-in',
      severity: 'medium',
      detail: 'User account is active but has never logged in. Possible orphaned identity or stale provisioning.',
      evidence: {},
    });
  }

  return anomalies;
}
