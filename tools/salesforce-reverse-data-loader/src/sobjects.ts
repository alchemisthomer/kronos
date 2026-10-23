/**
 * Pre-determined default sobject list for CRM-oriented security assessments.
 * Matches the four objects the PCM incident attacker probed. Users override
 * with --sobjects, extend with --append-sobjects, or replace with
 * --use-describe (which pulls the full list the authenticated user can see).
 */
export const DEFAULT_SOBJECTS = ['Account', 'Contact', 'Lead', 'Opportunity'] as const;

export function resolveSobjectList(opts: {
  explicitList: string[] | null;
  appendList: string[] | null;
  describedList: string[] | null;
}): { list: string[]; source: 'default' | 'explicit' | 'describe' | 'default+append' | 'explicit+append' | 'describe+append' } {
  let base: string[];
  let source: 'default' | 'explicit' | 'describe';

  if (opts.describedList) {
    base = [...opts.describedList];
    source = 'describe';
  } else if (opts.explicitList && opts.explicitList.length) {
    base = [...opts.explicitList];
    source = 'explicit';
  } else {
    base = [...DEFAULT_SOBJECTS];
    source = 'default';
  }

  if (opts.appendList && opts.appendList.length) {
    const seen = new Set(base);
    for (const s of opts.appendList) if (!seen.has(s)) base.push(s);
    return { list: base, source: `${source}+append` as const };
  }
  return { list: base, source };
}

export function parseSobjectCsv(arg: string | undefined): string[] | null {
  if (!arg) return null;
  return arg
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
