import type { LoginAnalysis } from './analyze.ts';

export function renderMarkdown(
  a: LoginAnalysis,
  meta: {
    tool: string;
    tool_version: string;
    generated_at: string;
    target_user_id: string | null;
    organization_id: string;
    instance_url: string;
    soql: string;
    api_version: string;
  },
): string {
  const L: string[] = [];
  L.push(`# Salesforce LoginHistory Analysis`);
  L.push('');
  L.push(`- **Generated:** ${meta.generated_at}`);
  L.push(`- **Tool:** \`${meta.tool}\` v${meta.tool_version}`);
  L.push(`- **Org:** \`${meta.organization_id}\` @ \`${meta.instance_url}\``);
  L.push(`- **API version:** ${meta.api_version}`);
  L.push(`- **Target user:** ${meta.target_user_id ? `\`${meta.target_user_id}\`` : 'all users'}`);
  L.push(`- **SOQL:** \`${meta.soql}\``);
  L.push('');
  L.push(`## Window`);
  L.push(`- Total logins: **${a.window.total_logins.toLocaleString()}**`);
  if (a.window.earliest_login) L.push(`- Earliest: \`${a.window.earliest_login}\``);
  if (a.window.latest_login) L.push(`- Latest: \`${a.window.latest_login}\``);
  if (a.window.span_days !== null) L.push(`- Span: **${a.window.span_days} days**`);
  L.push('');
  L.push(`## Outcomes`);
  L.push(`- Success: **${a.outcomes.success_count.toLocaleString()}**`);
  L.push(`- Failure: **${a.outcomes.failure_count.toLocaleString()}**`);
  if (Object.keys(a.outcomes.failure_by_status).length) {
    L.push(`- Failure breakdown:`);
    for (const [status, n] of Object.entries(a.outcomes.failure_by_status)) {
      L.push(`  - \`${status}\`: ${n}`);
    }
  }
  L.push('');
  L.push(`## Identities`);
  L.push(`- Unique users: **${a.identities.unique_user_count}**`);
  if (a.identities.logins_per_user.length) {
    L.push('');
    L.push('| User id | Username | Profile | Logins |');
    L.push('|---|---|---|---:|');
    for (const u of a.identities.logins_per_user.slice(0, 10)) {
      L.push(`| \`${u.user_id}\` | ${u.username ?? '—'} | ${u.profile ?? '—'} | ${u.count} |`);
    }
    if (a.identities.logins_per_user.length > 10) {
      L.push(`| … (+${a.identities.logins_per_user.length - 10} more) | | | |`);
    }
  }
  L.push('');
  L.push(`## Network`);
  L.push(`- Unique source IPs: **${a.network.unique_source_ip_count}**`);
  L.push(`- Unique /24 prefixes: ${a.network.unique_ip_prefix_count}`);
  if (a.network.top_source_ips.length) {
    L.push('');
    L.push('| Source IP | Logins |');
    L.push('|---|---:|');
    for (const ip of a.network.top_source_ips.slice(0, 10)) {
      L.push(`| \`${ip.source_ip}\` | ${ip.count} |`);
    }
  }
  L.push('');
  L.push(`## Geography`);
  L.push(`- Unique countries: **${a.geography.unique_country_count}**`);
  L.push(`- Unique cities: ${a.geography.unique_city_count}`);
  if (a.geography.countries.length) {
    L.push('');
    L.push('| Country | ISO | Logins |');
    L.push('|---|---|---:|');
    for (const c of a.geography.countries) {
      L.push(`| ${c.country ?? '—'} | ${c.country_iso} | ${c.count} |`);
    }
  }
  L.push('');
  L.push(`## Channel`);
  L.push('');
  L.push(`### Login types`);
  for (const [k, v] of sortByCount(a.channel.login_type_counts)) L.push(`- \`${k}\`: ${v}`);
  L.push('');
  L.push(`### API types`);
  for (const [k, v] of sortByCount(a.channel.api_type_counts)) L.push(`- \`${k}\`: ${v}`);
  L.push('');
  L.push(`### TLS protocols`);
  for (const [k, v] of sortByCount(a.channel.tls_protocol_counts)) L.push(`- \`${k}\`: ${v}`);
  L.push('');
  L.push(`### UI vs API ratio`);
  L.push(`- UI-flavored sessions: ${a.channel.ui_vs_api_ratio.ui}`);
  L.push(`- API-flavored sessions: ${a.channel.ui_vs_api_ratio.api}`);
  L.push('');
  L.push(`## Patterns`);
  L.push(`- Off-hours logins (outside 06:00-20:00 UTC): **${a.patterns.off_hours_login_count}**`);
  L.push(`- Burst events (< 60s between consecutive logins): **${a.patterns.burst_intervals_seconds.length}**`);
  L.push('');
  L.push(`## Anomalies`);
  if (a.anomalies.length === 0) {
    L.push(`- No anomalies flagged by v0.1 heuristics.`);
  } else {
    for (const an of a.anomalies) {
      L.push(`- **${an.severity.toUpperCase()}** \`${an.class}\` — ${an.detail}`);
    }
  }
  return L.join('\n');
}

function sortByCount(o: Record<string, number>): Array<[string, number]> {
  return Object.entries(o).sort((a, b) => b[1] - a[1]);
}
