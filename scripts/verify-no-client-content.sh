#!/usr/bin/env bash
# verify-no-client-content.sh
#
# Scan for client-identifying content patterns known to leak from real
# engagements. Exits nonzero if any hit. Called by:
#   - .githooks/pre-commit (blocks the local commit)
#   - .github/workflows/content-isolation.yml (fails CI on PRs)
#   - manual invocation by operators before push
#
# Usage:
#   scripts/verify-no-client-content.sh                # scan every tracked file
#   scripts/verify-no-client-content.sh --staged       # scan git-staged files only
#   scripts/verify-no-client-content.sh --diff <ref>   # scan files changed vs <ref>
#
# See SECURITY.md for the isolation policy; CLAUDE.md for the operator-agent
# playbook when a hit is found.

set -uo pipefail

MODE="${1:-tree}"
REF="${2:-}"

# ── build file list per mode ────────────────────────────────────────
case "$MODE" in
  --staged|staged)
    FILES=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null)
    ;;
  --diff|diff)
    if [ -z "$REF" ]; then
      echo "ERROR: --diff requires a ref (e.g. origin/brain/2.7.x.x)" >&2
      exit 2
    fi
    FILES=$(git diff --name-only --diff-filter=ACMR "$REF"...HEAD 2>/dev/null)
    ;;
  --tree|tree|"")
    FILES=$(git ls-files)
    ;;
  --help|-h)
    grep '^#' "$0" | sed 's/^# \?//' ; exit 0
    ;;
  *)
    echo "ERROR: unknown mode '$MODE'. See --help." >&2
    exit 2
    ;;
esac

if [ -z "$FILES" ]; then
  echo "verify-no-client-content: no files to scan."
  exit 0
fi

# ── whitelist: dummy identifiers used in framework examples are OK ─
# These match the placeholder values that examples in docs/, methodology/,
# and tool READMEs are expected to use. Extend this list only when adding a
# new documented dummy placeholder.
WHITELIST_ORG_ID='00D000000000000AAA|00D00000000000000|00D00000000000AAA|00D000000000000|00DXX0000000000'
WHITELIST_USER_ID='005000000000000AAA|00500000000000000|005000000000000|005XX00000000000'
WHITELIST_HOSTS='(example|acme|my-org|mycompany|example-corp)\.my\.(salesforce|site)\.com'
WHITELIST_CREDS='credentials/salesforce\.example\.json'

# ── patterns that MUST NOT appear in a framework commit ─────────────
FAILURES=0

check_pattern() {
  local label="$1"
  local pattern="$2"
  local whitelist="$3"
  local guidance="$4"

  local violations=""
  for f in $FILES; do
    [ -f "$f" ] || continue
    # Skip the validator itself (contains the patterns as literals).
    [ "$f" = "scripts/verify-no-client-content.sh" ] && continue
    [ "$f" = ".githooks/pre-commit" ] && continue

    # Grep for the pattern; filter out any lines matching whitelist.
    local hits
    if [ -n "$whitelist" ]; then
      hits=$(grep -nE "$pattern" "$f" 2>/dev/null | grep -vE "$whitelist" || true)
    else
      hits=$(grep -nE "$pattern" "$f" 2>/dev/null || true)
    fi

    if [ -n "$hits" ]; then
      violations+="  ❌ $f"$'\n'
      while IFS= read -r line; do
        violations+="       $line"$'\n'
      done <<< "$hits"
    fi
  done

  if [ -n "$violations" ]; then
    echo ""
    echo "=== $label ==="
    printf '%s' "$violations"
    echo "  → $guidance"
    FAILURES=$((FAILURES + 1))
  fi
}

check_pattern \
  "Salesforce org Id (00D... 15+ chars)" \
  '\b00D[a-zA-Z0-9]{12,15}\b' \
  "$WHITELIST_ORG_ID" \
  "Replace real org Id with dummy '00D000000000000AAA' or remove the reference."

check_pattern \
  "Salesforce user Id (005... 15+ chars)" \
  '\b005[a-zA-Z0-9]{12,15}\b' \
  "$WHITELIST_USER_ID" \
  "Replace real user Id with dummy '005000000000000AAA' or remove the reference."

check_pattern \
  "Salesforce tenant hostname (*.my.salesforce.com / *.my.site.com)" \
  '[a-zA-Z0-9][a-zA-Z0-9-]*\.my\.(salesforce|site)\.com' \
  "$WHITELIST_HOSTS" \
  "Replace real tenant hostname with 'example.my.salesforce.com' or 'acme.my.salesforce.com'."

# Real credential file staged as a FILE (not a text mention of the path).
# The path may legitimately appear in README/manifest/code as documentation
# for where the operator should drop their own credentials.
for f in $FILES; do
  case "$f" in
    */credentials/*.example.json) continue ;;  # example templates are OK
    */credentials/salesforce.json|*/credentials/creds.json|*/credentials/prod.json|*/credentials/live.json|credentials/salesforce.json|credentials/creds.json)
      if [ -z "${CRED_HEADER:-}" ]; then
        echo ""
        echo "=== Real credential file staged ==="
        CRED_HEADER=1
      fi
      echo "  ❌ $f is a credential file — must never be committed."
      FAILURES=$((FAILURES + 1))
      ;;
  esac
done
if [ -n "${CRED_HEADER:-}" ]; then
  echo "  → Only *.example.json is permitted under credentials/. Delete the file and rely on the tool's gitignored default path."
fi

# Root-level engagement folder (should be blocked by .gitignore, but double-check).
if echo "$FILES" | grep -qE '^engagement/'; then
  echo ""
  echo "=== Root-level engagement/ folder ==="
  echo "$FILES" | grep -E '^engagement/' | sed 's/^/  ❌ /'
  echo "  → Real engagements live in adopter repos, not this framework repo."
  echo "  → Move the engagement folder to an operator-private workspace and delete from here."
  FAILURES=$((FAILURES + 1))
fi

# ── result ──────────────────────────────────────────────────────────
if [ $FAILURES -eq 0 ]; then
  echo "verify-no-client-content: OK — scanned $(echo "$FILES" | wc -l | tr -d ' ') file(s), no client-identifying content detected."
  exit 0
fi

echo ""
echo "verify-no-client-content: FAIL — $FAILURES violation class(es) detected."
echo ""
echo "Framework repo isolation is enforced structurally. See SECURITY.md for the policy"
echo "and CLAUDE.md §'Escalation protocol' for what to do next."
echo ""
echo "NEVER bypass this check with --no-verify or by disabling CI. Fix the content."
exit 1
