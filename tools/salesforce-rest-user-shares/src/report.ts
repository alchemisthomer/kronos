import type { UserSharesAnalysis } from './analyze.ts';

export function renderMarkdown(
  a: UserSharesAnalysis,
  meta: {
    tool: string; tool_version: string; generated_at: string;
    organization_id: string; instance_url: string; api_version: string;
  },
): string {
  const L: string[] = [];
  L.push(`# Salesforce User Shares Analysis`);
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
  L.push(`| Profile | ${a.user.profile_name} |`);
  L.push(`| Role | ${a.user.user_role_name ?? '—'} |`);
  L.push(`| Active | ${a.user.is_active ? '✅' : '❌'} |`);
  L.push('');

  L.push(`## Totals`);
  L.push('');
  L.push(`| Metric | Value |`);
  L.push(`|---|---:|`);
  L.push(`| Role chain depth | ${a.totals.role_chain_depth} |`);
  L.push(`| Subordinate roles | ${a.totals.subordinate_role_count} |`);
  L.push(`| Direct group memberships | ${a.totals.direct_group_count} |`);
  L.push(`| Queue memberships | ${a.totals.queue_membership_count} |`);
  L.push(`| Share recipient ids | ${a.totals.total_share_recipient_count} |`);
  L.push(`| Total share rows sampled | ${a.totals.total_share_rows} |`);
  L.push(`| Total unique records shared | ${a.totals.total_unique_records_shared} |`);
  L.push(`| Sobjects probed / with shares | ${a.totals.sobjects_probed} / ${a.totals.sobjects_with_shares} |`);
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

  L.push(`## Role hierarchy — ascending chain from user`);
  L.push('');
  if (a.role_hierarchy.chain_ascending.length === 0) {
    L.push(`_User has no assigned role._`);
  } else {
    for (const r of a.role_hierarchy.chain_ascending) {
      const indent = '  '.repeat(r.depth_from_target);
      L.push(`${indent}- ${r.depth_from_target === 0 ? '**' : ''}${r.name}${r.depth_from_target === 0 ? '** (self)' : ''} — \`${r.id}\``);
    }
  }
  L.push('');
  L.push(`**Subordinate role count:** ${a.role_hierarchy.subordinate_count}`);
  L.push('');

  L.push(`## Group memberships`);
  L.push('');
  if (a.groups.direct_memberships.length === 0) {
    L.push(`_User has no direct group memberships._`);
  } else {
    L.push(`### By type`);
    for (const [t, c] of Object.entries(a.groups.by_type).sort((x, y) => y[1] - x[1])) {
      L.push(`- \`${t}\`: ${c}`);
    }
    L.push('');
    L.push(`### Direct memberships`);
    L.push('');
    L.push(`| Group name | Type | Includes bosses | Group Id |`);
    L.push(`|---|---|:-:|---|`);
    for (const g of a.groups.direct_memberships) {
      L.push(`| ${g.name} | \`${g.type}\` | ${g.does_include_bosses ? '✅' : ''} | \`${g.group_id}\` |`);
    }
  }
  L.push('');

  L.push(`## Per-sobject shares (sampled)`);
  L.push('');
  if (a.sobject_shares.length === 0) {
    L.push(`_No sobjects probed for shares._`);
  } else {
    L.push(`| Sobject | Share rows | Unique records | Truncated | Top RowCause | Top AccessLevel |`);
    L.push(`|---|---:|---:|:-:|---|---|`);
    for (const s of a.sobject_shares) {
      const topRc = topKey(s.by_row_cause);
      const topAl = topKey(s.by_access_level);
      L.push(`| \`${s.sobject}\` | ${s.share_row_count} | ${s.unique_records_shared} | ${s.truncated ? '⚠' : ''} | ${topRc} | ${topAl} |`);
    }
  }

  return L.join('\n');
}

function topKey(o: Record<string, number>): string {
  const entries = Object.entries(o).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return '—';
  return `\`${entries[0]![0]}\` (${entries[0]![1]})`;
}
