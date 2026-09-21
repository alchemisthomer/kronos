# salesforce-reverse-data-loader

Kronos tool. Reproduces what a compromised or over-privileged Salesforce user could pull from an org — the reverse of Data Loader, run from the *attacker's* seat to characterize what data was reachable.

- **Binding layer:** 1 (structured subprocess adapter, per [`methodology/TOOL-BINDING.md`](../../methodology/TOOL-BINDING.md) §Layer 1).
- **API family:** `salesforce.rest`
- **Endpoints used:** `/services/data/v{apiVersion}/sobjects` (optional, `--use-describe`), `/services/data/v{apiVersion}/query` (probe / count / fields / extract).
- **Impact class:** I1 (non-mutating active). Read-only.
- **Authorization ceiling max:** 2 (controlled). Extract mode should only be used under an engagement that explicitly authorizes data extraction.
- **Auth mechanism (v0.1):** SOAP username-password with security token, via the primitive `salesforce-rest-query-csv` tool's shared credential file.

## Two modes

### `assess` (default) — "here is the exposure"

For each sobject in the target list, in one session:

1. **Access probe** — `SELECT Id FROM <sobject> LIMIT 1`. Records whether the user has any read access.
2. **Row count** — `SELECT COUNT() FROM <sobject>`. Records how many rows exist.
3. **Field enumeration** — `SELECT FIELDS(ALL) FROM <sobject> LIMIT 200`. Records every field the user can read; detects compound fields automatically.

Outputs:
- `output/<sobject>-fields200.csv` — the 200-row sample per sobject.
- `output/assessment-report.json` — machine-readable exposure report.
- `output/assessment-report.md` — human-readable exposure report.

**No records are extracted.** This is the mode for assessment engagements where the goal is to characterize risk without exfiltrating data.

### `extract` (`--extract-data`) — "here is the actual data they got"

Runs assess mode PLUS, per accessible sobject:

4. **Full extraction** — `SELECT <every visible field, compounds stripped> FROM <sobject>` (with optional `--extract-limit`).

Additional outputs:
- `output/<sobject>-extract.csv` — every row this user can see, every field they can see.

**Only run this mode when the engagement's authorization artifact explicitly permits data extraction.** Use case: PCM's incident recreation — the customer explicitly asked us to reproduce what an attacker actually pulled, so that the incident post-mortem has fidelity.

## Install

```bash
cd tools/salesforce-reverse-data-loader
npm install
```

Requires Node.js ≥ 22.

## Configure credentials

Credentials are shared with the primitive `salesforce-rest-query-csv` tool. If you've already set up the primitive, this tool works with no additional setup. Otherwise:

```bash
cp ../salesforce-rest-query-csv/credentials/salesforce.example.json ../salesforce-rest-query-csv/credentials/salesforce.json
$EDITOR ../salesforce-rest-query-csv/credentials/salesforce.json
```

Point `--credentials` at any other path if needed. When we hoist credentials to `tools/_shared/salesforce/credentials/`, this default updates.

## Run

```bash
# Assess mode, default sobject list (Account, Contact, Lead, Opportunity):
npx tsx src/index.ts

# Assess a custom sobject list:
npx tsx src/index.ts --sobjects "Account,Case,User,PermissionSet"

# Assess the default set PLUS extras:
npx tsx src/index.ts --append-sobjects "Case,ContentDocument"

# Enumerate every sobject the user can see:
npx tsx src/index.ts --use-describe

# EXTRACT mode — pull all records per sobject.
# Use ONLY when engagement authorization permits data extraction.
npx tsx src/index.ts --extract-data

# Extract with a per-sobject row cap:
npx tsx src/index.ts --extract-data --extract-limit 10000
```

Get machine-readable tool metadata:

```bash
npx tsx src/index.ts --describe
```

Full help:

```bash
npx tsx src/index.ts --help
```

## Standard I/O contract

Per [`tools/README.md`](../README.md) §Standard I/O contract:

- **Params in:** CLI argv only.
- **Artifacts on disk:** assessment report (JSON + Markdown) + per-sobject sample CSVs + (if `--extract-data`) per-sobject extract CSVs.
- **Run manifest:** final line of stdout, standard schema.
- **Logs:** human-readable to stderr, credential-redacted.
- **Exit code:** `0` on ok, `1` on error.

## Sobject-list resolution

| Flag combination | Result |
|---|---|
| (none) | Default: `Account, Contact, Lead, Opportunity` |
| `--sobjects a,b,c` | Explicit `a,b,c` (default is ignored) |
| `--append-sobjects x,y` | Default + `x,y` |
| `--sobjects a,b --append-sobjects x` | `a,b,x` |
| `--use-describe` | Every queryable sobject the user can see via `/sobjects` |
| `--use-describe --append-sobjects x` | Described list + `x` |

If `--use-describe` is set but the user lacks the API-enabled permission, the describe call fails, the failure is logged, and the tool falls back to the default-or-explicit list.

## Compound-field handling

Salesforce compound fields (`BillingAddress`, `ShippingAddress`, `Name` on Person Accounts, `Address` on Lead, `MailingAddress`/`OtherAddress` on Contact, geolocation fields, etc.) cannot be selected in the same SOQL as their component fields — Salesforce returns `Address fields cannot be mixed with their component fields`. `FIELDS(ALL)` sidesteps this, but a hand-listed SELECT does not.

This tool detects compound fields automatically by inspecting the FIELDS(ALL) response for cell values that are JSON objects. Detected compounds are:

- Reported in the assessment (`fields.compound_detected` per sobject).
- Stripped from the extract SOQL, so extraction doesn't fail with `MALFORMED_QUERY`.
- Logged in the extract's `fields_stripped_as_compound` list.

## What this tool does NOT do

- **Does not sign the run manifest.** Provenance signing is a harness/orchestrator concern.
- **Does not analyze** the extracted data (e.g., "flag rows this user shouldn't have seen"). Analysis is a future oracle/report tool that consumes the JSON assessment report.
- **Does not run in a container.** Manifest declares `sandbox.recommended: process`; container publication deferred.
- **Does not mutate any Salesforce data.**
- **Does not audit sharing rules.** The exposure it reports is the *effective* read access under the current session; it does not attempt to enumerate every sharing rule that produced that access.

## Interpreting the report

- **`sobjects_accessible` vs. `sobjects_denied`** — a denied probe is a valid finding, not an error. Denial codes: `insufficient-access`, `sobject-invalid-or-hidden`, `api-disabled`, `query-error`.
- **`total_rows_visible`** — sum of `SELECT COUNT()` across accessible sobjects. This is the *raw scope of exposure*, not necessarily the volume the attacker pulled.
- **`fields.count` reaching 200** — Salesforce's response ceiling for `FIELDS(ALL) LIMIT 200` is not always documented in a simple way. A field count of exactly 200 warrants suspicion that the true accessible field set is larger and the response truncated. Cross-check via `/sobjects/<name>/describe` (future sibling tool) will resolve this.
- **`compound_detected`** — every compound listed here is stripped from any extract SOQL. Their component fields (e.g., `BillingStreet`, `BillingCity`) are still included in both the sample and the extract.

## Version and provenance

- Tool version: **0.1.0**.
- Framework methodology: kronos v0.4.
- Golden-target conformance: **not yet verified**.
