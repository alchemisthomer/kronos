import type { UserPermissionsAnalysis } from './analyze.ts';

export function renderMarkdown(
  a: UserPermissionsAnalysis,
  meta: {
    tool: string;
    tool_version: string;
    generated_at: string;
    organization_id: string;
    instance_url: string;
    api_version: string;
  },
): string {
  const L: string[] = [];
  L.push(`# Salesforce User Permissions Analysis`);
  L.push('');
  L.push(`- **Generated:** ${meta.generated_at}`);
  L.push(`- **Tool:** \`${meta.tool}\` v${meta.tool_version}`);
  L.push(`- **Org:** \`${meta.organization_id}\` @ \`${meta.instance_url}\``);
  L.push(`- **API version:** ${meta.api_version}`);
  L.push('');
  L.push(`## User`);
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---|`);
  L.push(`| Name | ${a.user.name} |`);
  L.push(`| Username | \`${a.user.username}\` |`);
  L.push(`| Email | \`${a.user.email}\` |`);
  L.push(`| User Id | \`${a.user.id}\` |`);
  L.push(`| Profile | ${a.user.profile_name} (\`${a.user.profile_id}\`) |`);
  L.push(`| Role | ${a.user.user_role_name ?? '—'} |`);
  L.push(`| User type | ${a.user.user_type} |`);
  L.push(`| Active | ${a.user.is_active ? '✅' : '❌'} |`);
  L.push(`| Manager | ${a.user.manager_name ?? '—'} |`);
  L.push(`| Last login | ${a.user.last_login_date ?? 'never'} |`);
  L.push(`| Password last changed | ${a.user.last_password_change_date ?? '—'} |`);
  L.push(`| Created | ${a.user.created_date} |`);
  L.push('');

  L.push(`## Totals`);
  L.push('');
  L.push(`| Metric | Value |`);
  L.push(`|---|---:|`);
  L.push(`| PermissionSets assigned | ${a.totals.permissionset_count} |`);
  L.push(`| ...of which custom | ${a.totals.permissionset_custom_count} |`);
  L.push(`| ...of which namespaced (from a managed package) | ${a.totals.permissionset_namespaced_count} |`);
  L.push(`| Object-permission rows | ${a.totals.object_permission_count} |`);
  L.push(`| Field-permission rows | ${a.totals.field_permission_count} |`);
  L.push(`| Sobjects with ViewAllRecords | **${a.totals.sobjects_with_view_all_records}** |`);
  L.push(`| Sobjects with ModifyAllRecords | **${a.totals.sobjects_with_modify_all_records}** |`);
  L.push(`| Sobjects with Delete | ${a.totals.sobjects_with_delete} |`);
  L.push('');

  L.push(`## Anomalies`);
  L.push('');
  if (a.anomalies.length === 0) {
    L.push(`_No anomalies flagged by v0.1 heuristics._`);
  } else {
    for (const an of a.anomalies) {
      L.push(`- **${an.severity.toUpperCase()}** \`${an.class}\` — ${an.detail}`);
    }
  }
  L.push('');

  L.push(`## Critical permissions effective (union across Profile + all PermissionSets)`);
  L.push('');
  if (a.critical_permissions_effective.length === 0) {
    L.push(`_None of the tracked critical permission flags are set for this user._`);
  } else {
    for (const p of a.critical_permissions_effective) L.push(`- \`${p}\``);
  }
  L.push('');

  L.push(`## Permission sources`);
  L.push('');
  L.push(`### Profile: ${a.permission_sources.profile.parent_name}`);
  L.push('');
  L.push(`- Id: \`${a.permission_sources.profile.parent_id}\``);
  if (a.permission_sources.profile.critical_permissions_true.length) {
    L.push(`- Critical permissions granted here:`);
    for (const p of a.permission_sources.profile.critical_permissions_true) {
      L.push(`  - \`${p}\``);
    }
  } else {
    L.push(`- No tracked critical permissions granted by this profile.`);
  }
  L.push('');

  if (a.permission_sources.permissionsets.length === 0) {
    L.push(`### PermissionSets: (none assigned)`);
  } else {
    L.push(`### PermissionSets (${a.permission_sources.permissionsets.length})`);
    L.push('');
    for (const ps of a.permission_sources.permissionsets) {
      const flags: string[] = [];
      if (ps.is_custom) flags.push('custom');
      if (ps.is_namespaced) flags.push('namespaced');
      const flagStr = flags.length ? ` _(${flags.join(', ')})_` : '';
      L.push(`- **${ps.parent_name}**${flagStr} — \`${ps.parent_id}\``);
      for (const p of ps.critical_permissions_true) {
        L.push(`  - \`${p}\``);
      }
    }
  }
  L.push('');

  L.push(`## Effective object permissions (${a.effective_object_permissions.length} sobjects)`);
  L.push('');
  L.push(`| Sobject | R | C | E | D | ViewAll | ModifyAll | Sources |`);
  L.push(`|---|:-:|:-:|:-:|:-:|:-:|:-:|---:|`);
  for (const o of a.effective_object_permissions) {
    L.push(
      `| \`${o.sobject}\` | ${bit(o.read)} | ${bit(o.create)} | ${bit(o.edit)} | ${bit(o.delete)} | ` +
      `${bit(o.view_all_records)} | ${bit(o.modify_all_records)} | ${o.sources.length} |`,
    );
  }
  L.push('');

  L.push(`## Effective field permissions`);
  L.push('');
  const sobjectsWithFieldPerms = Object.keys(a.effective_field_permissions_by_sobject).sort();
  if (sobjectsWithFieldPerms.length === 0) {
    L.push(`_No field-level permissions found (all field access inherited from object-level perms)._`);
  } else {
    L.push(`Field-level grants exist on **${sobjectsWithFieldPerms.length}** sobjects. Full detail in the field-permissions CSV artifact; below is a per-sobject count.`);
    L.push('');
    L.push(`| Sobject | Fields granted |`);
    L.push(`|---|---:|`);
    for (const sobj of sobjectsWithFieldPerms) {
      L.push(`| \`${sobj}\` | ${a.effective_field_permissions_by_sobject[sobj]!.length} |`);
    }
  }
  return L.join('\n');
}

function bit(v: boolean): string {
  return v ? '✅' : '·';
}
