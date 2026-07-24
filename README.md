# kronos

> Adversarial assurance for AI-built systems — a governance-gated, filesystem-native methodology for proving that software is safe to run.

**Status:** pre-alpha. Design converging. Runner, oauth-server, actions, and templates all pending scaffold once the design review completes.

---

<p align="center">
  <img src="docs/inception/images/day-of-binding.jpg" width="450" alt="AWS Budget alert screenshot: 3:09 AM on 2026-07-17. AWS Budgets notification stating the account has a budget exceeding your alert threshold, with actual month cost shown as $131,831,457,005.91. Account identifiers redacted with solid black bars."/>
</p>

<p align="center"><em>2026-07-17, 3:09 AM.<br/>The moment Kronos was named.</em></p>

The full story of why this bill was never real, why an empty AWS account cannot generate 120 petabytes of NAT-gateway traffic per day, and why that impossibility is the load-bearing insight of Kronos: [`docs/inception/00-founding-incident.md`](docs/inception/00-founding-incident.md).

## What kronos is

**kronos** is a discipline for proving that software is safe to run — through structured, authorized, evidence-preserving attempts to break it. It works on any target system, in any language, on any runtime, at any deployment surface. A project adopts kronos by copying a small folder tree into its repository and running the discipline:

- Every meaningful adversarial evaluation of a system is one **engagement**.
- An engagement lives in a single markdown document that travels through a kanban of folders: `00_scope/` → `01_authorized/` → `02_planning/` → `03_ready/` → `04_running/` → `05_evidence/` → `06_shipped/`, with `07_aborted/` for engagements that never close.
- The document has two halves: a **governance half** (target boundary, authorization artifact, rules of engagement) authored by the human approver, and an **execution half** (target model, attack matrix, oracles, evidence, findings, scorecard delta) authored by the AI agent.
- The engagement **closes** only when every planned attack has run, every oracle has evaluated, every finding has been written, and the scorecard has been updated in the target's repository.

The discipline is intentionally folder-and-file-based. It works with `git` on any host, doesn't require a database or a runtime service to persist findings, and can be adopted by any team without adopting any framework's stack choices.

## Why kronos is not only a security tool

Kronos treats **security, cost, availability, data integrity, operational discipline, response readiness, and compliance drift** as peer classes of vulnerability. Any of them can end a company; all of them deserve deterministic, reproducible verdicts. The framework's primary artifact — the **kronos scorecard** — renders the target's assurance posture across all of these dimensions as a single matrix, with the load-bearing property that its top maturity levels are only reachable via adversarial proof.

The founding incident linked above was not a security compromise. It was a cloud-provider billing pipeline defect that surfaced a phantom $131,831,457,005.91 charge on the operator's launch day. No security tool would have caught it; a physical-plausibility oracle would have caught it within hours. Kronos treats the class of vulnerability the founding incident revealed as a first-class concern.

## The dialectic with eos

Kronos and [eos](https://github.com/alchemisthomer/eos) are complementary methodologies. Eos attests — it produces evidence that a system does what its designers claim it does. Kronos falsifies — it produces evidence that a system's claims can (or cannot) be broken under adversarial pressure. Neither framework is complete alone. A system that has been attested but never adversarially challenged has claims that are internally coherent but empirically untested. A system that has been adversarially challenged but never attested has defenses that hold but no coherent statement of what they defend.

Both frameworks operate independently. When co-installed in the same target, they integrate bidirectionally: a kronos finding that falsifies an eos-attested claim auto-files a new backlog cycle in the eos kanban; the kronos scorecard reads the eos cycle folder to determine which dimensions have reached the L3 threshold that adversarial proof can then take to L4 or L5.

## What this repository contains

| Path | Contents |
|---|---|
| [`methodology/`](methodology/) | The operating manual, the seven novel claims, the engagement document template, the maturity scorecard model, the tool binding contract, and the industry-standards alignment |
| [`runner/`](runner/) | (Pending scaffold) A React/TypeScript reference viewer that reads any GitHub repository's `kronos/engagement/**` folder tree via the GitHub REST API and renders the kanban plus the scorecard in the browser. Edits land as pull requests. Independent of the technology of the project under evaluation |
| [`oauth-server/`](oauth-server/) | (Pending scaffold) A small standalone Node/Express service that completes the GitHub App user-to-server OAuth code-for-token exchange on behalf of the browser viewer. Required only when the viewer is deployed with GitHub App OAuth enabled (viewer works PAT-only without it) |
| [`actions/`](actions/) | (Pending scaffold) Reusable GitHub Actions: kanban structure validator, authorization artifact validator, evidence hash verifier, scorecard consistency check, first-signal-stop enforcer, production authorization guard, eos backlog auto-file |
| [`templates/`](templates/) | Copy-in scaffolds for adopting projects: the eight-stage engagement kanban tree, the engagement document template, the target scorecard configuration |
| [`docs/`](docs/) | Architecture decision records, examples of kronos applied to real projects, the founding incident case study and sanitized archive |
| [`DESIGN.md`](DESIGN.md) | The wide-net vision document currently in cross-LLM design review |

## Installation

Adoption is by filesystem copy today (matching eos's pattern). From the root of the project you're adopting kronos into:

```bash
# Bring in the engagement kanban tree.
cp -r path/to/kronos/templates/engagement         ./kronos/engagement

# Bring in the operating manual so contributors can find the discipline.
cp    path/to/kronos/methodology/OPERATING-MANUAL.md ./kronos/README.md
```

Then edit `./kronos/engagement/SCORECARD.md` to set your target's slug, display name, and primary repository. The first engagement is authored in `./kronos/engagement/00_scope/` using the template.

An `npx kronos init` scaffolder is planned for a later revision. The filesystem-copy default is deliberate — the methodology is portable across every stack, so the primary adoption path shouldn't couple adopters to any one runtime (Node, Python, Go, or otherwise).

## Ethics gate

Kronos operates only under authorized adversarial assessment when operated by CloudPremise LLC and its explicit customers. The framework itself is dual-use, in the same sense as Metasploit, Burp Suite, sqlmap, and Nmap: any tool capable of testing the defenses of a system on behalf of that system's owner is equally capable of attacking that system on behalf of an adversary. This is a permanent property of adversarial-testing frameworks; it cannot be engineered away.

Kronos addresses this property structurally rather than pretending it does not exist:

- The framework requires a signed authorization artifact for every active engagement. This is a first-class primitive with mandatory fields.
- CloudPremise LLC operates only under signed authorization. Unauthorized use by any party is the responsibility of that party.
- The framework does not include, and will not include, any capability whose only rational purpose is malicious use with no authorized-defensive counterpart.

See [`methodology/SEVEN-CLAIMS.md`](methodology/SEVEN-CLAIMS.md) §7 for the full dual-use discipline.

## The reference viewer

The runner in [`runner/`](runner/) (pending scaffold) will be a React/TypeScript SPA that reads any GitHub repository's `kronos/engagement/**` folder tree via the GitHub REST API and renders the kanban plus the maturity scorecard in the browser. It intentionally knows nothing about the technology of the project under evaluation — it reads folders, markdown, and YAML frontmatter, and it commits edits back as pull requests. No backend, no database, no state store outside the repository. Point it at any GitHub repository you can read (public repos work anonymously), and it renders that project's kanban and scorecard.

## The seven novel properties

The kronos engagement methodology is the conjunction of seven properties that, taken together, are not present in any prior software assurance methodology the author is aware of:

1. Presumption-of-failure as governance discipline
2. Dialectic with attestation as complementary epistemic backbone
3. Executive maturity scorecard driven by adversarial proof
4. Git-native evidence bus with public-by-default findings
5. Adversarial coevolution through system-agnostic threat catalog
6. Per-engagement production-safety mode as commercial primitive
7. Dual-use with explicit authorization discipline and legal-liability boundary

See [`methodology/SEVEN-CLAIMS.md`](methodology/SEVEN-CLAIMS.md) for the conceptual-level description. A potential eighth claim — kronos's positioning as *the adversarial verification layer beneath every industry certification* — is flagged for consideration during cross-LLM design review; see [`methodology/INDUSTRY-ALIGNMENT.md`](methodology/INDUSTRY-ALIGNMENT.md).

A more detailed disclosure will be maintained in `PATENT-DISCLOSURE-DRAFT.md` (to be authored after design review converges) for eventual review by IP counsel. Contributions to this repository are subject to the AGPL-3.0 patent grant (§11).

## License

[GNU Affero General Public License v3.0](LICENSE). Deployments that expose modified versions of this code over a network must make the modified source available under the same license.

## Reference implementation

The flagship implementation of kronos is against the [olympus-616](https://github.com/olympus-616/olympus-616) platform. Its installed engagement history — every shipped adversarial evaluation, every open engagement, every scorecard state — lives inside that project at `foundation/kronos/engagement/` and is not part of this repository. See [`docs/examples/olympus-616.md`](docs/examples/olympus-616.md) for how kronos is applied there.

## Name

The spelling is intentional. Κρόνος (Kronos, the Titan) is not Χρόνος (Chronos, time). Kronos preceded the Olympians and devoured his own children so that only what was truly integral survived the reckoning. That is kronos's relationship to the systems it evaluates: it attacks them so what ships is worthy.
