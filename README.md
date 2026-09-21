# kronos

> A claim-centric assurance control plane that continuously reconciles system claims against observed reality and executes bounded, authorized challenges to determine which claims survive — under what conditions, with what coverage, confidence, and freshness.

---

> ⚠️ **THIS REPOSITORY IS A FRAMEWORK TEMPLATE, NOT AN ENGAGEMENT WORKSPACE.**
>
> This repo ships the kronos methodology, tools, templates, and reference documentation. It is **public** and **AGPL-3.0**. **Real engagement content — target-org identifiers, individuals under test, incident narratives, per-attack matrices for real clients, extract data — must NOT be committed here.**
>
> Engagements live in adopter repos: the client's own repo, a private operator-owned repo, or a local operator workspace. See [`SECURITY.md`](SECURITY.md) for the isolation policy, [`CLAUDE.md`](CLAUDE.md) for the operator-agent guidance, and [Installation](#installation) below for the copy-into-adopter-repo adoption pattern.

---

**Status:** pre-alpha. Design in cross-LLM review (v0.4 post-Gemini). Runner, oauth-server, and actions all pending scaffold. First salesforce toolset (four tools) ships in `tools/`.

**Kronos does not certify that software is safe. It makes assurance claims testable, challengeable, and auditable.**

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
| [`methodology/`](methodology/) | The operating manual, the inventive concepts, the engagement document template, the maturity scorecard model, the tool binding contract, the plausibility monitor and capacity model, and the industry-standards alignment |
| [`tools/`](tools/) | Framework-shipped reference tools (currently: four Salesforce tools). Each tool is a self-contained subdirectory with `manifest.yaml`, source, and README |
| [`templates/`](templates/) | Copy-in scaffolds for adopting projects: the eight-stage engagement kanban tree, the engagement document template, the target scorecard configuration |
| [`docs/`](docs/) | Architecture decision records, examples of kronos applied to real projects, the founding incident case study and sanitized archive |
| [`runner/`](runner/) | (Pending scaffold) A React/TypeScript reference viewer |
| [`oauth-server/`](oauth-server/) | (Pending scaffold) GitHub App OAuth code-for-token exchange for the viewer |
| [`actions/`](actions/) | (Pending scaffold) Reusable GitHub Actions |
| [`DESIGN.md`](DESIGN.md) | The wide-net vision document driving the current design review |
| [`CLAUDE.md`](CLAUDE.md) | Guidance for AI operators (Claude Code and equivalents) working in this repository |
| [`SECURITY.md`](SECURITY.md) | Client-data isolation policy for contributors |

## What this repository does NOT contain — and must never contain

- **Engagement folders for real targets.** The `engagement/` folder tree, when it exists on disk in a clone of this repo, MUST live in an adopter's fork/clone/private repo, never here.
- **Any client-identifying content** in any file that becomes a commit: target names, target org identifiers, user emails, user Ids, incident narratives.
- **Credentials of any kind** — no `credentials/salesforce.json`, no `.env` with real values, no session tokens, no API keys.
- **Extract CSVs or any raw record data** pulled from a real target.
- **Example engagements in `docs/examples/`** use dummy target slugs (`acme`, `example-corp`) and dummy identifiers only.

Repeat exposure of client-identifying material on this public repository is a customer-contract breach. See [`SECURITY.md`](SECURITY.md) for the enforcement mechanism.

## Installation

Adoption is by filesystem copy today (matching eos's pattern). **The critical rule: copy INTO the adopter's own repo, never into this framework repo.**

From the root of the project you're adopting kronos into (which is NOT this repo):

```bash
# Bring in the engagement kanban tree.
cp -r path/to/kronos/templates/engagement         ./kronos/engagement

# Bring in the operating manual so contributors can find the discipline.
cp    path/to/kronos/methodology/OPERATING-MANUAL.md ./kronos/README.md
```

Then edit `./kronos/engagement/SCORECARD.md` to set your target's slug, display name, and primary repository. The first engagement is authored in `./kronos/engagement/00_scope/` using the template.

**Kronos operators (CloudPremise, third-party pen-testers) who need a workspace for a client engagement should create a separate private repo per client** — either client-owned or operator-owned — and copy the templates there. Never scaffold `engagement/` in this framework repo.

An `npx kronos init` scaffolder is planned for a later revision. The filesystem-copy default is deliberate — the methodology is portable across every stack, so the primary adoption path shouldn't couple adopters to any one runtime (Node, Python, Go, or otherwise).

## Ethics gate

Kronos operates only under authorized adversarial assessment when operated by CloudPremise LLC and its explicit customers. The framework itself is dual-use, in the same sense as Metasploit, Burp Suite, sqlmap, and Nmap: any tool capable of testing the defenses of a system on behalf of that system's owner is equally capable of attacking that system on behalf of an adversary. This is a permanent property of adversarial-testing frameworks; it cannot be engineered away.

Kronos addresses this property structurally rather than pretending it does not exist:

- The framework requires a signed authorization artifact for every active engagement. This is a first-class primitive with mandatory fields.
- CloudPremise LLC operates only under signed authorization. Unauthorized use by any party is the responsibility of that party.
- The framework does not include, and will not include, any capability whose only rational purpose is malicious use with no authorized-defensive counterpart.

See [`methodology/INVENTIVE-CONCEPT-CANDIDATES.md`](methodology/INVENTIVE-CONCEPT-CANDIDATES.md) §7 for the full dual-use discipline.

## The reference viewer

The runner in [`runner/`](runner/) (pending scaffold) will be a React/TypeScript SPA that reads any GitHub repository's `kronos/engagement/**` folder tree via the GitHub REST API and renders the kanban plus the maturity scorecard in the browser. It intentionally knows nothing about the technology of the project under evaluation — it reads folders, markdown, and YAML frontmatter, and it commits edits back as pull requests. No backend, no database, no state store outside the repository. Point it at any GitHub repository you can read (public repos work anonymously), and it renders that project's kanban and scorecard.

## Novel properties

See [`methodology/INVENTIVE-CONCEPT-CANDIDATES.md`](methodology/INVENTIVE-CONCEPT-CANDIDATES.md) for the candidate-differentiator disclosure with explicit prior-art acknowledgment. Renamed from `SEVEN-CLAIMS.md` in v0.2 per ChatGPT design review to avoid unqualified novelty claims.

A more detailed disclosure will be maintained in `PATENT-DISCLOSURE-DRAFT.md` (to be authored after design review converges) for eventual review by IP counsel. Contributions to this repository are subject to the AGPL-3.0 patent grant (§11).

## IP posture (deferred hybrid — see `methodology/INVENTIVE-CONCEPT-CANDIDATES.md`)

Kronos is licensed under GNU AGPL v3 today, published in public, and its findings are opt-in-disclosable per finding. The strategic question of whether specific technical mechanisms warrant patent protection is **deferred pending IP counsel review**. The operator has elected hybrid framing — the framework is described using both patent-claim and open-source-moat language in parallel; downstream resolution will narrow one direction, both, or neither.

The framework's structural properties (git-native governance, AGPL license, open catalog, community contribution flow) remain in place regardless of the IP resolution. Contributors to the repository accept the AGPL-3.0 patent grant (§11) as part of the contribution agreement.

## License

[GNU Affero General Public License v3.0](LICENSE). Deployments that expose modified versions of this code over a network must offer corresponding source to those network users. The license does not restrict use, does not detect forks, and does not shield operators from liability for unauthorized activity — it is a copyleft license, not an authorization control.

## Name

The spelling is intentional. Κρόνος (Kronos, the Titan) is not Χρόνος (Chronos, time). Kronos preceded the Olympians and devoured his own children so that only what was truly integral survived the reckoning. That is kronos's relationship to the systems it evaluates: it attacks them so what ships is worthy.
