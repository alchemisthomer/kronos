# Raw Evidence Withheld From Open-Source Publication

The founding-incident archive originally contained a `raw-data/` folder with
cloud-provider API dumps (CloudTrail events, CloudFormation stacks, IAM state,
workflow run metadata, and daily cost data). These artifacts have not been
published in this repository.

**Why:** the raw JSON contains hundreds of resource identifiers, ARNs, account
references, and correlations that would take orders of magnitude more effort
to sanitize safely than the narrative documents. The forensic value of the
raw evidence beyond what is captured in the narratives is small; the
risk of a missed identifier leaking into public data is not.

**What remains available:** the sanitized narrative documents in this folder
capture the shape, timing, decision points, and outcomes of the incident
faithfully. Anyone reading them can reconstruct the causal chain and design
implications without needing the raw dumps.

**For auditors:** the unsanitized raw evidence is preserved privately by the
Steward and can be made available under appropriate confidentiality terms.
Contact via the maintainer information in the repository README.
