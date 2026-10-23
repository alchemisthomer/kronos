# 01_authorized/

Engagements here have a signed authorization artifact but have not yet been decomposed into attacks. The operator has locked §2 (authorization), §3 (rules of engagement), and §4 (threat model class). The document is now the working contract.

**Entry:** authorization artifact validated and signed → `git mv` from `../00_scope/`.

**Exit criterion:** agent begins §6-§8 decomposition → `git mv` to `../02_planning/`.

The framework's `authorization-artifact-validator` action fires on any push touching this stage. Invalid or expired authorizations block the PR.
