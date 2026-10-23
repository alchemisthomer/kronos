# salesforce-rest-sobjects-describe

Kronos tool. Fetches the authoritative field/metadata description for one Salesforce sobject via `/services/data/v{ver}/sobjects/{name}/describe`.

- **Binding layer:** 1 (structured subprocess adapter, per [`methodology/TOOL-BINDING.md`](../../methodology/TOOL-BINDING.md) §Layer 1).
- **Tier:** 2 (API-endpoint primitive).
- **API family:** `salesforce.rest`
- **Endpoint:** `/services/data/v{apiVersion}/sobjects/{sobject}/describe`
- **Impact class:** I1 (non-mutating active). Read-only.
- **Authorization ceiling max:** 2.

## Why this tool exists

Salesforce's `FIELDS(ALL)` SOQL macro silently omits fields the sobject actually exposes — the exclusion set differs per sobject, per API version. See finding **KRONOS-TOOL-001** in the reverse-data-loader engagement evidence. The describe endpoint is the ground truth. Every kronos operation that needs the *complete* field list for an sobject should call this tool (or the describe function it wraps).

Standalone uses beyond field enumeration:
- Record-type inventory (`recordTypeInfos`).
- Relationship mapping (`childRelationships`).
- Per-field permissions (`updateable`, `createable`, `filterable`, `custom`, `type`).
- Trigger inventory (`triggerable`).
- Sharing/queue metadata (`sharedWithGroup`, `implementedInterfaces`).

## Install

```bash
cd tools/salesforce-rest-sobjects-describe
npm install
```

## Run

```bash
# Describe Contact, writing full JSON and a sorted field-name list.
npx tsx src/index.ts --sobject Contact --fields-out ./output/contact-fields.txt

# Same, targeting a sandbox.
npx tsx src/index.ts --sobject Contact --login-url https://test.salesforce.com

# Just print tool metadata.
npx tsx src/index.ts --describe
```

## Standard I/O contract

Per [`tools/README.md`](../README.md) §Standard I/O contract:

- **Params in:** CLI argv.
- **Artifacts on disk:** `<sobject-lower>-describe.json` (full response, typically 100 KB – 1 MB per sobject). Optional `--fields-out` writes a plain sorted text list.
- **Run manifest:** final line of stdout, includes summary (field_count, custom_field_count, compound_field_names, child_relationship_count, record_type_count).
- **Logs:** stderr, credential-redacted.
- **Exit code:** `0` ok, `1` error.

## Error codes

- `credentials-missing / -malformed / -incomplete`
- `login-failed` (INVALID_LOGIN)
- `sobject-not-found` (NOT_FOUND on the endpoint)
- `insufficient-access` (user lacks describe permission on this sobject)
- `runtime-error`

## Version and provenance

- Tool version: **0.1.0**.
- Framework methodology: kronos v0.4.
- Golden-target conformance: **not yet verified**.
