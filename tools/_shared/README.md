# tools/_shared/

Shared code across framework-shipped kronos tools. This directory exists specifically to prevent the duplication that led to the same file (`auth.ts`, `csv.ts`) living in 5+ tool directories.

## Structure

```
_shared/
  salesforce/
    auth.ts   — Salesforce credential loading + redaction
    csv.ts    — CSV writer + compound-field detection
```

## Consumption

Tools import from here via relative path:

```typescript
import {
  loadCredentials, redactCredentials, CredentialError,
  type SalesforceCredentials,
} from '../../_shared/salesforce/auth.ts';

import { toCsv, detectCompoundFields } from '../../_shared/salesforce/csv.ts';
```

Every tool that depends on `_shared/*` must have `"allowImportingTsExtensions": true` in its `tsconfig.json` (already the case for the four salesforce user-scoped tools) and no build step (the `.ts` imports work at runtime via tsx).

## Rules

- **No tool-specific code lives here.** If a helper is only used by one tool, keep it in that tool's `src/`.
- **Semantic changes require testing every consumer.** If you modify `_shared/salesforce/auth.ts`, run `--describe` on every tool that imports it (`grep -l "_shared/salesforce/auth"` gives the consumers).
- **Adding a new file here requires a rationale in the file's docblock.** Explain what problem this abstraction solves and which tools depend on it.

## Adding a new shared module

1. Create the file at `_shared/<vendor>/<module>.ts` — group by vendor so different SDK conventions don't collide.
2. Update at least two consumers before landing. A single-consumer "shared" module isn't shared yet.
3. Add the module to this README's Structure section.
