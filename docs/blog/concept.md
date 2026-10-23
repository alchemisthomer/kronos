# The concept — Reckonings as the voice of the Devourer

> *Kronos was the Titan who devoured his own children so that only what was truly integral would survive the reckoning. The children he swallowed became the pantheon. The ones that returned from his belly ruled. The ones that didn't were never meant to.*

Reckonings is the public writing of Kronos. This document explains why it exists, what it is for, and what it will never be. It is read-first for anyone adding a post, reviewing a post, or writing new tooling against the blog.

## Why Reckonings has to exist outside its host

Kronos is positioned at `beta.olympus-grid.com/kronos`. That URL belongs to the Olympus-Grid platform. The storefront is olympus-grid metadata, the content pipeline is not.

If Reckonings used olympus-grid Salesforce objects to persist posts, then olympus-grid — the system most likely to be the target of a Kronos finding — would be the gatekeeper of what Kronos is allowed to say about it. A publishing system owned by the party under evaluation is not a publishing system. It is a comment card.

Reckonings instead lives as plain markdown in a public GitHub repository (`alchemisthomer/kronos`) under AGPL-3.0. The iris plugin reads directly from `raw.githubusercontent.com`. The content path never traverses olympus-grid Apex, platform events, or ledger. Olympus-grid can throttle the iris bundle it serves, but it cannot block, edit, or redact a post. If olympus-grid is turned off tomorrow, Reckonings is still a git tree. If GitHub is turned off tomorrow, Reckonings is still a git tree — somewhere.

That is the point of a Titan. He is before, and after, the Olympians.

## Why every change is a commit

A post is a commit. A retraction is a commit. A doctrine change is a commit. The git history of `docs/blog/` is the history of what Kronos has said, in order, with authorship, timestamps, signatures, and reviewers. That history is the audit trail. It is tamper-evident by construction, because it is a public git tree with signed commits.

This matches the EOS discipline (`foundation/eos`) in which every cycle is a folder-move and every feature is a tracked file. In EOS, the state of work is the state of the file tree. In Reckonings, the state of what has been said is the state of the file tree. Both disciplines refuse the premise that "what the system claims" and "what the system has recorded about what it claims" can diverge.

The practical consequence: there is no "publish" action separate from "commit." A merged commit is a published post. A retracted post is a commit that sets `status: retracted` and prepends a retraction notice. Nothing is ever deleted. If a post was wrong, the record of being wrong is the record. Kronos does not quietly fix errors.

## Why the storefront is cosmetic

The iris plugin at `beta.olympus-grid.com/kronos` is React code served from a Salesforce static resource. It fetches markdown from GitHub and renders it. It renders search, listings, filters by primitive and claim and target, scorecard-delta views, and permalinks. It does not host the content, store it, cache it beyond CDN TTLs, or mediate it.

That means the plugin is replaceable. If a second surface wants to render Reckonings — a static site at `kronos.olympus-grid.ai`, a terminal client, a reader inside another system — it reads the same tree and renders the same posts. The storefront is a template. The repo is the archive.

It also means the plugin can be rebuilt from scratch without losing a single post, because the posts aren't in it.

## The self-disclosure rule

Kronos's mandate is to reckon with every target it is authorized to touch, including the operator that funds it. The Steward owns olympus-grid, kronos, and the authority to publish findings about either. Explicit standing permission has been granted for Kronos to publish olympus-grid findings on this blog, subject to a coordinated-disclosure protocol:

1. **Finding is written** in the appropriate engagement repo (not this public template) and reviewed by the Steward.
2. **Fix is landed or scheduled** on the target. If scheduled, the Steward may authorize publication with the schedule disclosed; the default is to wait until the fix is live.
3. **Target reckoning is drafted** in this repo under `docs/blog/posts/` with `kind: target`. The post names the finding, the primitive, the oracle used, the evidence location (`engagement_ref` points at the private engagement repo), and the scorecard delta.
4. **Steward signs the PR** with an explicit statement that publication is authorized.
5. **Merge publishes.**

For clients other than olympus-grid, step 4 is replaced by the client's own written sanction, stored in their engagement folder as `AUTHORIZATION.md`. No client finding ships on Reckonings without that authorization — not because the client controls what Kronos finds, but because the operator does not break trust with clients to accumulate publication credit.

For *incident reckonings* — commentary on another system's publicly-disclosed breach — no sanction is required beyond the Steward's PR review. The subject is a public event; the primitive is a shared pattern; the post names the breached party only as the occasion for discussing the pattern.

## Why only three kinds of post

Reckonings is not a general-purpose blog. It is a surface for one discipline. The three kinds — incident, target, doctrine — map directly to the three ways Kronos's claim set can advance:

- An **incident reckoning** advances a claim by discovering a new primitive the claim set must now cover, or by validating that an existing claim already covers the newly-visible failure.
- A **target reckoning** advances a claim by executing against a target and recording the scorecard delta.
- A **doctrine reckoning** advances the claim set itself — the taxonomy of what Kronos measures.

If a piece of writing does not do one of those three things, it is not advancing the discipline. It is marketing, or essay, or news aggregation. Those genres have other homes. Reckonings is the written record of the discipline moving. Nothing else.

## Why the tone is what it is

Kronos is the devourer. The language of Reckonings leans mythic because the operator's actual posture is adversarial toward every system it touches, including the one that pays for it. Softening that posture into "we help teams improve their security" is a lie: Kronos is not here to help teams. Kronos is here to find out which claims survive the reckoning and devour the rest.

The mythic language is also a filter. A reader who finds "Reckonings" and "the Devourer" off-putting is a reader who will be more off-put by what the posts actually say. The language serves as a self-selecting entrance.

That said, the posts themselves are precise. "Devourer" is the frame; the body of a post is primitive names, oracle definitions, scorecard deltas, and evidence pointers. The mythic register is reserved for the entrance (the storefront's hero copy), the kind-of-post labels, and the retraction notices. Inside a post, the reader is given facts.

## Why Reckonings will never be a product

The storefront is not sold. The blog is not monetized. There is no sponsorship, no advertisement, no "powered by Kronos" badge. Reckonings is a cost center for the operator and that is correct, because its value is to make the discipline legible to parties who have not been engaged yet. A paying reader is a reader with a conflict. Kronos does not accept conflicts.

The kronos *platform* is the product. Reckonings is the storefront's story — written in the operator's own voice, published on the operator's own terms, hostile to the operator's own system when the operator's own system has it coming.

## What success looks like

A year from now, Reckonings has:

- A dense enough corpus that primitive names and claim ids are shared vocabulary with the reader.
- At least one target reckoning that publishes a finding against olympus-grid itself, demonstrating that the self-disclosure rule is not decorative.
- A doctrine reckoning that retires a claim because the primitive it covered turned out to be false ontology — evidence that Kronos moves against its own taxonomy, not just against targets.
- No sponsored content, no mailing list, no roadmap post, no "year in review."

If Reckonings a year from now has any of the second set and none of the first, the Steward should shut it down. A blog that does marketing in the voice of a Titan is worse than no blog at all.
