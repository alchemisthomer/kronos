export interface RoleChainEntry {
  id: string;
  name: string;
  developer_name: string | null;
  parent_role_id: string | null;
  depth_from_target: number;   // 0 = target's own role, 1 = immediate parent, ...
}

export interface GroupSummary {
  group_id: string;
  name: string;
  developer_name: string | null;
  type: string;
  does_include_bosses: boolean;
  related_id: string | null;   // for Queue: related sobject; for Role: the role id
}

export interface SobjectShareSummary {
  sobject: string;
  share_row_count: number;
  unique_records_shared: number;
  by_row_cause: Record<string, number>;
  by_access_level: Record<string, number>;
  by_recipient_kind: Record<'user' | 'group', number>;
  truncated: boolean;          // true if the sample-limit was hit
}

export interface Anomaly {
  class: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
  evidence: Record<string, unknown>;
}

export interface UserSharesAnalysis {
  kronos_analysis_kind: 'user-shares';
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
  };
  role_hierarchy: {
    self_role_id: string | null;
    chain_ascending: RoleChainEntry[];       // target → root
    subordinate_role_ids: string[];          // roles below target in hierarchy
    chain_depth: number;
    subordinate_count: number;
  };
  groups: {
    direct_memberships: GroupSummary[];
    by_type: Record<string, number>;
    total_recipient_ids_for_shares: string[]; // user + all groups user is in
  };
  sobject_shares: SobjectShareSummary[];
  totals: {
    role_chain_depth: number;
    subordinate_role_count: number;
    direct_group_count: number;
    queue_membership_count: number;
    total_share_recipient_count: number;
    total_share_rows: number;
    total_unique_records_shared: number;
    sobjects_probed: number;
    sobjects_with_shares: number;
  };
  anomalies: Anomaly[];
}

export function analyzeUserShares(input: {
  userRow: Record<string, unknown>;
  allRoles: Record<string, unknown>[];
  groupMemberships: Record<string, unknown>[];
  sharesBySobject: Map<string, Record<string, unknown>[]>;
  shareSampleLimit: number;
}): UserSharesAnalysis {
  const { userRow, allRoles, groupMemberships, sharesBySobject, shareSampleLimit } = input;

  const user = extractUser(userRow);
  const roleHierarchy = buildRoleHierarchy(allRoles, user.user_role_id);
  const groups = summarizeGroupMemberships(groupMemberships, user.id);
  const sobjectShares = summarizeSharesBySobject(sharesBySobject, shareSampleLimit);

  const totals = {
    role_chain_depth: roleHierarchy.chain_ascending.length,
    subordinate_role_count: roleHierarchy.subordinate_role_ids.length,
    direct_group_count: groups.direct_memberships.length,
    queue_membership_count: groups.by_type['Queue'] ?? 0,
    total_share_recipient_count: groups.total_recipient_ids_for_shares.length,
    total_share_rows: sobjectShares.reduce((n, s) => n + s.share_row_count, 0),
    total_unique_records_shared: sobjectShares.reduce((n, s) => n + s.unique_records_shared, 0),
    sobjects_probed: sobjectShares.length,
    sobjects_with_shares: sobjectShares.filter((s) => s.share_row_count > 0).length,
  };

  const anomalies = detectAnomalies({ user, roleHierarchy, groups, sobjectShares, totals });

  return {
    kronos_analysis_kind: 'user-shares',
    user,
    role_hierarchy: {
      self_role_id: user.user_role_id,
      chain_ascending: roleHierarchy.chain_ascending,
      subordinate_role_ids: roleHierarchy.subordinate_role_ids,
      chain_depth: roleHierarchy.chain_ascending.length,
      subordinate_count: roleHierarchy.subordinate_role_ids.length,
    },
    groups,
    sobject_shares: sobjectShares,
    totals,
    anomalies,
  };
}

function extractUser(row: Record<string, unknown>): UserSharesAnalysis['user'] {
  const profile = row['Profile'] as Record<string, unknown> | undefined;
  const role = row['UserRole'] as Record<string, unknown> | undefined;
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
  };
}

function buildRoleHierarchy(
  allRoles: Record<string, unknown>[], selfRoleId: string | null,
): { chain_ascending: RoleChainEntry[]; subordinate_role_ids: string[] } {
  const byId = new Map<string, Record<string, unknown>>();
  const childrenOf = new Map<string, string[]>();
  for (const r of allRoles) {
    const id = String(r['Id'] ?? '');
    if (id) byId.set(id, r);
    const parentId = (r['ParentRoleId'] as string) ?? null;
    if (parentId) {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      childrenOf.get(parentId)!.push(id);
    }
  }

  // Ascending chain: self → parent → ... → root.
  const chain: RoleChainEntry[] = [];
  let cur = selfRoleId;
  let depth = 0;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const r = byId.get(cur);
    if (!r) break;
    chain.push({
      id: cur,
      name: String(r['Name'] ?? ''),
      developer_name: (r['DeveloperName'] as string) ?? null,
      parent_role_id: (r['ParentRoleId'] as string) ?? null,
      depth_from_target: depth++,
    });
    cur = (r['ParentRoleId'] as string) ?? null;
  }

  // Subordinate roles: BFS down from self.
  const subs: string[] = [];
  if (selfRoleId) {
    const queue = [selfRoleId];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const id = queue.shift()!;
      const kids = childrenOf.get(id) ?? [];
      for (const k of kids) {
        if (!visited.has(k)) {
          visited.add(k);
          subs.push(k);
          queue.push(k);
        }
      }
    }
  }

  return { chain_ascending: chain, subordinate_role_ids: subs };
}

function summarizeGroupMemberships(
  rows: Record<string, unknown>[], userId: string,
): UserSharesAnalysis['groups'] {
  const direct: GroupSummary[] = [];
  const byType: Record<string, number> = {};
  const recipientIds = new Set<string>();
  recipientIds.add(userId);
  for (const r of rows) {
    const g = r['Group'] as Record<string, unknown> | undefined;
    const groupId = String(r['GroupId'] ?? '');
    if (groupId) recipientIds.add(groupId);
    direct.push({
      group_id: groupId,
      name: g ? String(g['Name'] ?? '') : '',
      developer_name: g && typeof g['DeveloperName'] === 'string' ? (g['DeveloperName'] as string) : null,
      type: g && typeof g['Type'] === 'string' ? (g['Type'] as string) : '',
      does_include_bosses: g?.['DoesIncludeBosses'] === true,
      related_id: g && typeof g['RelatedId'] === 'string' ? (g['RelatedId'] as string) : null,
    });
    const t = g && typeof g['Type'] === 'string' ? (g['Type'] as string) : 'Unknown';
    byType[t] = (byType[t] ?? 0) + 1;
  }
  return {
    direct_memberships: direct,
    by_type: byType,
    total_recipient_ids_for_shares: [...recipientIds],
  };
}

function summarizeSharesBySobject(
  sharesBySobject: Map<string, Record<string, unknown>[]>,
  sampleLimit: number,
): SobjectShareSummary[] {
  const out: SobjectShareSummary[] = [];
  for (const [sobject, rows] of sharesBySobject.entries()) {
    const byRowCause: Record<string, number> = {};
    const byAccess: Record<string, number> = {};
    const byRecipientKind: Record<'user' | 'group', number> = { user: 0, group: 0 };
    const uniqueParents = new Set<string>();
    const parentField = sobject.endsWith('__c')
      ? 'ParentId'
      : `${sobject}Id`;
    for (const r of rows) {
      const cause = String(r['RowCause'] ?? 'Unknown');
      byRowCause[cause] = (byRowCause[cause] ?? 0) + 1;
      const access = String(r['AccessLevel'] ?? 'Unknown');
      byAccess[access] = (byAccess[access] ?? 0) + 1;
      const uog = String(r['UserOrGroupId'] ?? '');
      byRecipientKind[uog.startsWith('005') ? 'user' : 'group']++;
      const parent = String(r[parentField] ?? '');
      if (parent) uniqueParents.add(parent);
    }
    out.push({
      sobject,
      share_row_count: rows.length,
      unique_records_shared: uniqueParents.size,
      by_row_cause: byRowCause,
      by_access_level: byAccess,
      by_recipient_kind: byRecipientKind,
      truncated: rows.length >= sampleLimit,
    });
  }
  return out;
}

function detectAnomalies(ctx: {
  user: UserSharesAnalysis['user'];
  roleHierarchy: { chain_ascending: RoleChainEntry[]; subordinate_role_ids: string[] };
  groups: UserSharesAnalysis['groups'];
  sobjectShares: SobjectShareSummary[];
  totals: UserSharesAnalysis['totals'];
}): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // 1. Very deep role hierarchy above the user (inherits access from many parent roles).
  if (ctx.roleHierarchy.chain_ascending.length >= 6) {
    anomalies.push({
      class: 'deep-role-parent-chain',
      severity: 'low',
      detail: `User's role is ${ctx.roleHierarchy.chain_ascending.length} levels deep — they inherit access shared by every parent role.`,
      evidence: { chain: ctx.roleHierarchy.chain_ascending.map((r) => r.name) },
    });
  }

  // 2. Broad subordinate visibility (RoleAndSubordinates rules cascade down).
  if (ctx.roleHierarchy.subordinate_role_ids.length >= 20) {
    anomalies.push({
      class: 'broad-subordinate-visibility',
      severity: 'medium',
      detail: `User's role has ${ctx.roleHierarchy.subordinate_role_ids.length} subordinate roles — RoleAndSubordinates sharing rules grant this user broad downstream visibility.`,
      evidence: { subordinate_count: ctx.roleHierarchy.subordinate_role_ids.length },
    });
  }

  // 3. High group count.
  if (ctx.groups.direct_memberships.length >= 15) {
    anomalies.push({
      class: 'high-group-membership-count',
      severity: 'medium',
      detail: `User is a direct member of ${ctx.groups.direct_memberships.length} groups. Wide group membership can accumulate implicit access grants hard to audit.`,
      evidence: { count: ctx.groups.direct_memberships.length },
    });
  }

  // 4. Membership in AllInternalUsers (or equivalent org-wide group).
  const allInternal = ctx.groups.direct_memberships.find(
    (g) => /AllInternalUsers|AllUsers|Organization/i.test(g.name),
  );
  if (allInternal) {
    anomalies.push({
      class: 'org-wide-group-membership',
      severity: 'medium',
      detail: `User is a member of "${allInternal.name}" — an org-wide group. Anything shared with this group is visible to this user.`,
      evidence: { group: allInternal },
    });
  }

  // 5. Manual shares outweigh rule-driven shares — indicates ad-hoc sharing.
  for (const s of ctx.sobjectShares) {
    const manual = s.by_row_cause['Manual'] ?? 0;
    const total = s.share_row_count;
    if (total >= 100 && manual / total > 0.5) {
      anomalies.push({
        class: 'manual-share-heavy',
        severity: 'medium',
        detail: `${s.sobject}: ${manual} of ${total} shares are "Manual" (${((manual / total) * 100).toFixed(0)}%). Ad-hoc sharing at scale is an audit and revocation risk.`,
        evidence: { sobject: s.sobject, manual_count: manual, total },
      });
    }
  }

  // 6. Any sobject share sample was truncated → true share count is unknown.
  for (const s of ctx.sobjectShares) {
    if (s.truncated) {
      anomalies.push({
        class: 'share-sample-truncated',
        severity: 'low',
        detail: `${s.sobject}: share sample hit the query limit (${s.share_row_count} rows returned). True share count is higher — rerun with a larger --sample-limit for full picture.`,
        evidence: { sobject: s.sobject, sample_limit_hit: true },
      });
    }
  }

  // 7. AllRecords AccessLevel granted broadly.
  for (const s of ctx.sobjectShares) {
    const allAccess = s.by_access_level['All'] ?? 0;
    if (allAccess >= 100) {
      anomalies.push({
        class: 'full-access-shares-broad',
        severity: 'high',
        detail: `${s.sobject}: ${allAccess} share rows granted with AccessLevel="All" (full read/edit/delete/transfer). Broad All-access sharing is a data-exfil primitive.`,
        evidence: { sobject: s.sobject, all_access_count: allAccess },
      });
    }
  }

  return anomalies;
}
