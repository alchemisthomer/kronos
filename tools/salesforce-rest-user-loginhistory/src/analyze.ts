/**
 * Analysis primitives for a LoginHistory record set. Every function is pure
 * and takes the records array as input. Outputs are structured for a future
 * kronos user-profile dashboard AND for delivery to a customer in
 * human-readable form.
 */

export interface LoginAnalysis {
  window: {
    earliest_login: string | null;
    latest_login: string | null;
    span_days: number | null;
    total_logins: number;
  };
  outcomes: {
    success_count: number;
    failure_count: number;
    failure_by_status: Record<string, number>;
  };
  identities: {
    unique_user_count: number;
    logins_per_user: Array<{ user_id: string; username: string | null; profile: string | null; count: number }>;
  };
  network: {
    unique_source_ip_count: number;
    top_source_ips: Array<{ source_ip: string; count: number }>;
    unique_ip_prefix_count: number;
  };
  geography: {
    unique_country_count: number;
    countries: Array<{ country_iso: string; country: string | null; count: number }>;
    unique_city_count: number;
  };
  channel: {
    login_type_counts: Record<string, number>;
    api_type_counts: Record<string, number>;
    application_counts: Record<string, number>;
    tls_protocol_counts: Record<string, number>;
    ui_vs_api_ratio: { ui: number; api: number };
  };
  patterns: {
    off_hours_login_count: number;         // logins outside 06:00-20:00 UTC
    burst_intervals_seconds: number[];     // consecutive login gaps < 60s, forensic-friendly
    logins_per_hour_utc: Record<string, number>; // "00" through "23"
    logins_per_day_utc: Record<string, number>;  // "YYYY-MM-DD" → count
  };
  anomalies: Array<{
    class: string;
    severity: 'low' | 'medium' | 'high';
    detail: string;
    evidence: Record<string, unknown>;
  }>;
}

export function analyzeLoginHistory(records: Record<string, unknown>[]): LoginAnalysis {
  const analysis: LoginAnalysis = {
    window: { earliest_login: null, latest_login: null, span_days: null, total_logins: records.length },
    outcomes: { success_count: 0, failure_count: 0, failure_by_status: {} },
    identities: { unique_user_count: 0, logins_per_user: [] },
    network: { unique_source_ip_count: 0, top_source_ips: [], unique_ip_prefix_count: 0 },
    geography: { unique_country_count: 0, countries: [], unique_city_count: 0 },
    channel: {
      login_type_counts: {},
      api_type_counts: {},
      application_counts: {},
      tls_protocol_counts: {},
      ui_vs_api_ratio: { ui: 0, api: 0 },
    },
    patterns: {
      off_hours_login_count: 0,
      burst_intervals_seconds: [],
      logins_per_hour_utc: {},
      logins_per_day_utc: {},
    },
    anomalies: [],
  };

  if (records.length === 0) return analysis;

  const times: number[] = [];
  const perUser = new Map<string, { username: string | null; profile: string | null; count: number }>();
  const perIp = new Map<string, number>();
  const perPrefix = new Set<string>();
  const perCountry = new Map<string, { country: string | null; count: number }>();
  const cities = new Set<string>();

  for (const r of records) {
    const loginTimeRaw = r['LoginTime'];
    const loginTime = typeof loginTimeRaw === 'string' ? Date.parse(loginTimeRaw) : NaN;
    if (Number.isFinite(loginTime)) times.push(loginTime);

    // Outcomes.
    const status = String(r['Status'] ?? '');
    if (status === 'Success') analysis.outcomes.success_count++;
    else if (status) {
      analysis.outcomes.failure_count++;
      analysis.outcomes.failure_by_status[status] = (analysis.outcomes.failure_by_status[status] ?? 0) + 1;
    }

    // Identities.
    const userId = String(r['UserId'] ?? '');
    if (userId) {
      const users = r['Users'] as Record<string, unknown> | undefined;
      const username = users && typeof users['Username'] === 'string' ? (users['Username'] as string) : null;
      const profile = users && users['Profile'] && typeof (users['Profile'] as any).Name === 'string'
        ? ((users['Profile'] as any).Name as string) : null;
      const entry = perUser.get(userId) ?? { username, profile, count: 0 };
      entry.count++;
      if (!entry.username && username) entry.username = username;
      if (!entry.profile && profile) entry.profile = profile;
      perUser.set(userId, entry);
    }

    // Network.
    const ip = String(r['SourceIp'] ?? '');
    if (ip) {
      perIp.set(ip, (perIp.get(ip) ?? 0) + 1);
      const prefix = ip.includes('.') ? ip.split('.').slice(0, 3).join('.') + '.0/24' : ip;
      perPrefix.add(prefix);
    }

    // Geography.
    const geo = r['LoginGeo'] as Record<string, unknown> | undefined;
    if (geo) {
      const iso = typeof geo['CountryIso'] === 'string' ? (geo['CountryIso'] as string) : '';
      const country = typeof geo['Country'] === 'string' ? (geo['Country'] as string) : null;
      if (iso) {
        const c = perCountry.get(iso) ?? { country, count: 0 };
        c.count++;
        if (!c.country && country) c.country = country;
        perCountry.set(iso, c);
      }
      const city = typeof geo['City'] === 'string' ? (geo['City'] as string) : '';
      if (city) cities.add(city);
    }

    // Channel.
    const loginType = String(r['LoginType'] ?? 'Unknown');
    analysis.channel.login_type_counts[loginType] = (analysis.channel.login_type_counts[loginType] ?? 0) + 1;
    const apiType = String(r['ApiType'] ?? 'Unknown');
    analysis.channel.api_type_counts[apiType] = (analysis.channel.api_type_counts[apiType] ?? 0) + 1;
    const app = String(r['Application'] ?? 'Unknown');
    analysis.channel.application_counts[app] = (analysis.channel.application_counts[app] ?? 0) + 1;
    const tls = String(r['TlsProtocol'] ?? 'Unknown');
    analysis.channel.tls_protocol_counts[tls] = (analysis.channel.tls_protocol_counts[tls] ?? 0) + 1;

    // Rough UI-vs-API classification via LoginType.
    if (/Application|Remote Access 2\.0|SAML|OAuth/i.test(loginType) && !/API/i.test(loginType)) {
      analysis.channel.ui_vs_api_ratio.ui++;
    } else {
      analysis.channel.ui_vs_api_ratio.api++;
    }

    // Patterns.
    if (Number.isFinite(loginTime)) {
      const d = new Date(loginTime);
      const hour = String(d.getUTCHours()).padStart(2, '0');
      analysis.patterns.logins_per_hour_utc[hour] = (analysis.patterns.logins_per_hour_utc[hour] ?? 0) + 1;
      const day = d.toISOString().slice(0, 10);
      analysis.patterns.logins_per_day_utc[day] = (analysis.patterns.logins_per_day_utc[day] ?? 0) + 1;
      const h = d.getUTCHours();
      if (h < 6 || h >= 20) analysis.patterns.off_hours_login_count++;
    }
  }

  // Timeline fields.
  if (times.length) {
    times.sort((a, b) => a - b);
    const earliest = times[0]!;
    const latest = times[times.length - 1]!;
    analysis.window.earliest_login = new Date(earliest).toISOString();
    analysis.window.latest_login = new Date(latest).toISOString();
    analysis.window.span_days = Math.round((latest - earliest) / 86_400_000);
    // Burst detection: gaps < 60s between consecutive logins.
    for (let i = 1; i < times.length; i++) {
      const gapSec = (times[i]! - times[i - 1]!) / 1000;
      if (gapSec > 0 && gapSec < 60) analysis.patterns.burst_intervals_seconds.push(gapSec);
    }
  }

  // Identity aggregates.
  analysis.identities.unique_user_count = perUser.size;
  analysis.identities.logins_per_user = [...perUser.entries()]
    .map(([user_id, v]) => ({ user_id, username: v.username, profile: v.profile, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  // Network aggregates.
  analysis.network.unique_source_ip_count = perIp.size;
  analysis.network.unique_ip_prefix_count = perPrefix.size;
  analysis.network.top_source_ips = [...perIp.entries()]
    .map(([source_ip, count]) => ({ source_ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Geography aggregates.
  analysis.geography.unique_country_count = perCountry.size;
  analysis.geography.countries = [...perCountry.entries()]
    .map(([iso, v]) => ({ country_iso: iso, country: v.country, count: v.count }))
    .sort((a, b) => b.count - a.count);
  analysis.geography.unique_city_count = cities.size;

  // Anomaly detection — heuristic v0.1.
  detectAnomalies(analysis);

  return analysis;
}

function detectAnomalies(a: LoginAnalysis): void {
  // 1. Login from more than one country.
  if (a.geography.unique_country_count > 1) {
    a.anomalies.push({
      class: 'multi-country-login',
      severity: 'high',
      detail: `Logins observed from ${a.geography.unique_country_count} distinct countries. Non-travel accounts should log in from one country.`,
      evidence: { countries: a.geography.countries },
    });
  }
  // 2. Login from many source IPs.
  if (a.network.unique_source_ip_count >= 10) {
    a.anomalies.push({
      class: 'high-ip-diversity',
      severity: a.network.unique_source_ip_count >= 25 ? 'high' : 'medium',
      detail: `${a.network.unique_source_ip_count} distinct source IPs across ${a.network.unique_ip_prefix_count} /24 prefixes.`,
      evidence: { top_source_ips: a.network.top_source_ips },
    });
  }
  // 3. Burst logins (very-close-in-time consecutive logins).
  if (a.patterns.burst_intervals_seconds.length >= 5) {
    a.anomalies.push({
      class: 'burst-login-pattern',
      severity: 'medium',
      detail: `${a.patterns.burst_intervals_seconds.length} consecutive login pairs less than 60s apart — possible automation or session-instability.`,
      evidence: {
        burst_count: a.patterns.burst_intervals_seconds.length,
        min_gap_seconds: Math.min(...a.patterns.burst_intervals_seconds),
      },
    });
  }
  // 4. Failure spikes.
  const totalNonSuccess = a.outcomes.failure_count;
  if (totalNonSuccess >= 5 && totalNonSuccess / a.window.total_logins > 0.1) {
    a.anomalies.push({
      class: 'elevated-failure-rate',
      severity: totalNonSuccess / a.window.total_logins > 0.3 ? 'high' : 'medium',
      detail: `${totalNonSuccess} failed logins (${((totalNonSuccess / a.window.total_logins) * 100).toFixed(1)}% of total).`,
      evidence: { failure_by_status: a.outcomes.failure_by_status },
    });
  }
  // 5. Off-hours prevalence.
  if (a.patterns.off_hours_login_count >= 5 && a.patterns.off_hours_login_count / a.window.total_logins > 0.25) {
    a.anomalies.push({
      class: 'off-hours-login-prevalence',
      severity: 'low',
      detail: `${a.patterns.off_hours_login_count} logins outside 06:00-20:00 UTC (${((a.patterns.off_hours_login_count / a.window.total_logins) * 100).toFixed(1)}% of total).`,
      evidence: { off_hours_count: a.patterns.off_hours_login_count, total: a.window.total_logins },
    });
  }
  // 6. Old / weak TLS observed.
  const tlsKeys = Object.keys(a.channel.tls_protocol_counts);
  const weakTls = tlsKeys.filter((k) => /^TLS 1\.[01]$|^SSL/i.test(k));
  if (weakTls.length > 0) {
    a.anomalies.push({
      class: 'weak-tls-observed',
      severity: 'high',
      detail: `Login sessions negotiated weak TLS: ${weakTls.join(', ')}. Modern minimum is TLS 1.2.`,
      evidence: { weak_tls: weakTls.map((k) => ({ protocol: k, count: a.channel.tls_protocol_counts[k] })) },
    });
  }
}
