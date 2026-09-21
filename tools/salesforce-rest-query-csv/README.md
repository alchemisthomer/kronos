# salesforce-rest-query-csv

Kronos tool. Executes a SOQL statement against a Salesforce org's standard REST API `/query` endpoint and writes the result set as CSV.

- **Binding layer:** 1 (structured subprocess adapter, per [`methodology/TOOL-BINDING.md`](../../methodology/TOOL-BINDING.md) §Layer 1).
- **API family:** `salesforce.rest`
- **Endpoint:** `/services/data/v{apiVersion}/query`
- **Impact class:** I1 (non-mutating active). Read-only.
- **Authorization ceiling max:** 2 (controlled). Refuses engagements above ceiling 2 until the tool author re-signs the manifest.
- **Auth mechanism (v0.1):** SOAP username-password login with security token. Future variants will accept OAuth JWT / connected-app bearer tokens.

This tool is one of many that will target the Salesforce REST API. Sibling tools targeting other output shapes (`-json`) or other reconnaissance modes (`-recon` for FLS-drift cross-check) will live alongside it in this directory.

---

## Install

```bash
cd tools/salesforce-rest-query-csv
npm install
```

Requires Node.js ≥ 22. Uses [`jsforce`](https://jsforce.github.io/) for the Salesforce transport.

## Configure credentials

**Recommended (file):** copy the example and fill in real values. The `credentials/` directory is gitignored except for the example file.

```bash
cp credentials/salesforce.example.json credentials/salesforce.json
$EDITOR credentials/salesforce.json
```

Schema:

```json
{
  "username": "user@example.com",
  "password": "your-password-without-the-security-token",
  "securityToken": "your-25-char-security-token",
  "loginUrl": "https://login.salesforce.com"
}
```

`loginUrl` is optional in the file (defaults to `--login-url` argv → `https://login.salesforce.com`). Use `https://test.salesforce.com` for a sandbox.

**Alternate (env):** if `credentials/salesforce.json` is absent, the tool falls back to these environment variables:

```
KRONOS_SF_USERNAME
KRONOS_SF_PASSWORD
KRONOS_SF_SECURITY_TOKEN
KRONOS_SF_LOGIN_URL     (optional; overridden by --login-url)
```

Neither mechanism is the long-term answer. See [`methodology/TOOL-BINDING.md`](../../methodology/TOOL-BINDING.md) §Sandbox and isolation for the target credential-handoff model (ephemeral scoped credentials via secure channel or secret-broker reference).

## Run

```bash
# Default: SELECT FIELDS(ALL) FROM Account LIMIT 200 → ./output/query.csv
npm start

# Custom query and output path:
npm start -- \
  --query "SELECT Id, Name, Industry FROM Account WHERE CreatedDate = LAST_N_DAYS:30" \
  --output ./output/recent-accounts.csv

# Also emit the run manifest to a file (in addition to stdout):
npm start -- \
  --output ./output/accounts.csv \
  --manifest-out ./output/accounts.run.json
```

Get the argv/output description as machine-readable JSON:

```bash
npm run describe
```

## Standard I/O contract

Per [`tools/README.md`](../README.md) §Standard I/O contract:

- **Params in:** CLI argv only.
- **Artifacts:** CSV written to `--output`. If `--manifest-out` is set, run manifest also written there.
- **Run manifest:** printed as the **final line of stdout** as a single JSON object:
  ```json
  {
    "status": "ok",
    "tool": "salesforce-rest-query-csv",
    "tool_version": "0.1.0",
    "invoked_at": "2026-...",
    "completed_at": "2026-...",
    "params": { ... },
    "artifacts": [{ "path": "...", "format": "csv", "sha256": "...", "bytes": 12345, "description": "..." }],
    "metrics": { "records": 200, "totalSize": 200, "api_calls": 3, "csv_bytes": 12345 },
    "target": { "login_url": "...", "instance_url": "...", "organization_id": "00D...", "api_version": "60.0" },
    "credentials": { "source": "file", "source_path": "..." },
    "error": null
  }
  ```
- **Logs:** human-readable, stderr only.
- **Exit code:** `0` on `status: ok`, `1` on `status: error`.

Error `code` values:
- `credentials-missing`, `credentials-malformed`, `credentials-incomplete` — cred issues.
- `login-failed` — Salesforce rejected the credentials (INVALID_LOGIN).
- `query-malformed` — SOQL is invalid (MALFORMED_QUERY).
- `insufficient-access` — the authenticated user lacks access to a queried field/object.
- `runtime-error` — anything else.

The tool redacts the password, security token, and session id from any error message before writing to stderr or the manifest.

## CSV shape

- Columns are the union of top-level record keys across all rows, in first-seen order.
- The jsforce `attributes` wrapper is stripped from every row and from every nested relationship record.
- Nested values (relationship records, arrays) are JSON-serialized into a single cell.
- Null and undefined become empty cells.

For a `SELECT FIELDS(ALL) FROM Account LIMIT 200` result, this yields one column per Account field visible to the authenticated user under current FLS. A field that is not visible does not appear in the response and therefore does not appear as a column — **this silent drop is exactly the pattern the `-recon` sibling variant is intended to catch**, by cross-checking against the Tooling API's authoritative sobject describe.

## What this tool does NOT do

- **Does not paginate FIELDS(ALL).** The Salesforce API caps FIELDS(ALL) at LIMIT 200 by design; no pagination is possible for that function. Generic SOQL DOES paginate here (the tool follows `nextRecordsUrl` until `done: true`).
- **Does not reconcile FLS drift.** Reconciliation lives in the framework harness (out of scope for v0.1). See manifest.yaml `enumeration` block for the declared contract.
- **Does not sign the run manifest.** Execution-attestation signing per [`methodology/TOOL-BINDING.md`](../../methodology/TOOL-BINDING.md) §Execution provenance signing is a framework concern; this tool provides the pre-signature payload.
- **Does not run in a container.** Manifest declares `sandbox.recommended: process`; container image publication is deferred to v0.2.
- **Does not mutate any Salesforce data.** SOQL SELECT only.

## Development

```bash
npm start -- --help          # usage
npm run describe             # tool metadata as JSON
```

TypeScript is executed via [tsx](https://github.com/privatenumber/tsx) at runtime; no build step. `tsconfig.json` is strict-mode with `noUncheckedIndexedAccess`.

## Version and provenance

- Tool version: **0.1.0** (see `manifest.yaml` and `package.json`).
- Framework methodology: kronos v0.4 (per methodology/README.md).
- Golden-target conformance: **not yet verified**. The framework's `tool-verify` action does not yet exist.
