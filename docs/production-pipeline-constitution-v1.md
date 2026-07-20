# Production Pipeline Constitution V1

**Status:** RATIFIED (2026-07-09) — **AMENDED** (Amendment Set 1, 2026-07-09; Amendment Set 2, 2026-07-09). Current version: **V1.2** (see §PPC-2300, Constitution Versioning). Architecture/documentation only: no generator, GPCA, CBGA, Product Faithfulness, AEO, EIAA, or VERE behavior is changed by this document or by any amendment to it.

**Purpose:** This constitution resolves the recurring architectural problem identified by *Production Generation Architecture Audit V1*: different systems independently derive identity, modules, routes, navigation, copy, sample data, metadata, repairs, and preview evidence, so fixing one generator's bug does not prevent the next generator from making the same class of mistake. This document defines **one enforced model** that every current and future production stage must follow, gives every rule a **permanent, referenceable ID**, and establishes **who is responsible for enforcing it**.

This is a constitution, not a patch. It does not change what any system does today. It defines what every system **must** do from this point forward.

---

## How This Document Is Organized

This document has three parts with different authority:

| Part | Contents | Binding? |
|---|---|---|
| **Part 1 — Production Pipeline Constitution** | Timeless architectural rules (PPC-1xx–PPC-15xx), each with a permanent ID and standard metadata. | **Yes — this is the binding law.** |
| **Part 2 — Production Generation Architecture Audit** | Historical findings (Root Causes A–H) explaining *why* Part 1's rules exist. | **No — informative/historical only.** |
| **Part 3 — Implementation Roadmap** | Future implementation milestones (Tiers 0–6) that would bring production code into conformance with Part 1. | **No — informative only. Never constitutional law.** A milestone's absence from, or position in, this roadmap never excuses a Part 1 violation, and completing a roadmap tier is not itself what makes a rule binding — the rules in Part 1 are already binding today, independent of whether any system yet conforms to them. |

Prior to Amendment Set 1, this document mixed rules, historical audit findings, and roadmap planning into one undifferentiated list of numbered sections. That structure made it ambiguous whether a "rule" was binding law or a future intention. Amendment Set 1 (Amendment 8) separates these permanently.

---

## The Enforced Pipeline Model

```
Prompt
  → Canonical Product Contract
  → Contract-Bound Generation Plan   (CBGA-repaired build plan: modules, routes, navigation, identity)
  → Generator Inputs                  (the ONLY thing generators may read for product meaning)
  → Workspace Artifacts                (files actually written to disk)
  → GPCA Audit                         (must be re-run after every mutation, not just once)
  → Preview                            (may only start against a workspace GPCA just audited)
  → Final Result                       (must distinguish real repair from evidence-only repair)
```

**The one rule that generates every other rule in this document:**

> Once the Canonical Product Contract exists and CBGA has repaired the generation plan from it, **no stage downstream of CBGA may independently re-derive product identity, modules, navigation, routes, copy, or feature meaning.** Downstream stages may only *consume* what CBGA approved, or *fail*. They may never *guess* a replacement.

---

# PART 1 — Production Pipeline Constitution

**Everything in this Part is binding law.** Every rule below carries a permanent ID (Amendment 2) and standard metadata (Amendment 3). Nothing in this Part may be silently renumbered, deleted, or reinterpreted — only amended through the Governance process (§PPC-1500).

## Rule ID Convention (Amendment 2)

Every constitutional rule receives a permanent identifier of the form `PPC-<hundred-block><sequence>`. IDs are **never renumbered and never reused**, even if a rule is later deprecated (§PPC-1500). Rules are grouped into fixed hundred-blocks so that a bare ID immediately communicates its category:

| Block | Section | Contents |
|---|---|---|
| **PPC-1xx** | §PPC-100 | Authority Ownership |
| **PPC-2xx** | §PPC-200 | Immutable Artifacts |
| **PPC-3xx** | §PPC-300 | Stage Permissions & Read/Write/Mutate Boundaries |
| **PPC-4xx** | §PPC-400 | Generator Rules |
| **PPC-5xx** | §PPC-500 | Repair Rules |
| **PPC-6xx** | §PPC-600 | Re-Audit Rules |
| **PPC-7xx** | §PPC-700 | Continuation Rules |
| **PPC-8xx** | §PPC-800 | Traceability Rules |
| **PPC-9xx** | §PPC-900 | Classification Rules |
| **PPC-10xx** | §PPC-1000 | Preview Rules |
| **PPC-11xx** | §PPC-1100 | Final Result Rules |
| **PPC-12xx** | §PPC-1200 | Constitutional Invariants |
| **PPC-13xx** | §PPC-1300 | Canonical Pipeline State Machine |
| **PPC-14xx** | §PPC-1400 | Constitution Enforcement Authority (PPCEA) |
| **PPC-15xx** | §PPC-1500 | Constitution Governance |
| **PPC-16xx** | §PPC-1600 | Single Source of Truth Registry *(Amendment Set 2)* |
| **PPC-17xx** | §PPC-1700 | Canonical Pipeline Data Contract *(Amendment Set 2)* |
| **PPC-18xx** | §PPC-1800 | Generator Interface Standard *(Amendment Set 2)* |
| **PPC-19xx** | §PPC-1900 | Authority Interface Standard *(Amendment Set 2)* |
| **PPC-20xx** | §PPC-2000 | Constitutional Capability Registry *(Amendment Set 2)* |
| **PPC-21xx** | §PPC-2100 | Violation Taxonomy *(Amendment Set 2)* |
| **PPC-22xx** | §PPC-2200 | Constitutional Dependency Graph *(Amendment Set 2)* |
| **PPC-23xx** | §PPC-2300 | Constitution Versioning *(Amendment Set 2)* |
| **PPC-24xx** | §PPC-2400 | Constitutional Test Matrix *(Amendment Set 2)* |

Future production violations must be reported by rule ID, not free-form prose — e.g. `Violation: PPC-204 — Generator independently derived navigation`, never `"Generator was not allowed to derive navigation."` A rule ID is a stable citation that survives rewordings of the prose around it; the prose may be clarified over time (via amendment), but the ID it clarifies never changes.

## Rule Metadata Standard (Amendment 3)

Every constitutional rule is documented with the following six standard fields. This is a documentation standard only — no production system is required to expose these fields today, but any future implementation (including PPCEA, §PPC-1400) should expose them directly rather than re-inventing an equivalent schema.

| Field | Description |
|---|---|
| **Rule ID** | Permanent identifier in the form `PPC-<group><sequence>`. Never renumbered, never reused, even after deprecation. |
| **Owner** | The authority accountable for upholding the rule. For rules constraining a specific stage, the owner is that stage; for cross-stage invariants, the owner is PPCEA (§PPC-1400) once implemented, or each authority is self-accountable until then. |
| **Validator** | The concrete mechanism that would detect a violation today (an existing GPCA/CBGA/milestone validator) or `PPCEA (planned)` if no automated check exists yet. |
| **Severity** | `BLOCKING` (must prevent build/preview from proceeding), `STRUCTURAL` (an architectural violation that must be fixed but is not itself a live safety gate), or `ADVISORY` (documentation/consistency guidance without an automatic gate). |
| **Auto-fix Eligibility** | `YES` (a registered repair category, §PPC-500, may deterministically fix a violation), `NO` (requires regeneration or a human/architectural decision), or `PARTIAL`. |
| **Rationale** | A one-line reason the rule exists — expandable into the full Purpose/History/Expected-Failure-Prevented format (see "Rule Documentation Format," below) as historical record accumulates. |

For the largest tables in this Part (Authority Ownership, Classification Rules, Continuation Rules), the Owner/Severity/Auto-fix fields are folded into the existing table columns rather than duplicated in six separate columns, to keep those tables readable; the underlying schema is identical (see `src/production-pipeline-constitution-v1/production-pipeline-constitution.ts`, `RULE_REGISTRY`, for the fully expanded machine-readable form of every rule in this Part).

---

## §PPC-100 — Authority Ownership

Exactly one stage owns each concept below. Every other stage is a **consumer**, never a second author. *(Severity: STRUCTURAL for all rows in this section. Auto-fix: NO. Validator: PPCEA (planned), unless noted.)*

| ID | Concept | Owning Stage | Consumers (read-only) |
|---|---|---|---|
| PPC-101 | Product identity (name, purpose) | **CBGA** (repairs the Canonical Product Contract's identity into the build plan) | Blueprint generator, modular feature generator, materialization engine, GPCA |
| PPC-102 | Product purpose / primary concepts | **Product Faithfulness (Canonical Product Contract)** | CBGA, GPCA |
| PPC-103 | Product concepts | **Product Faithfulness (Canonical Product Contract)** | CBGA, GPCA |
| PPC-104 | Module plan | **CBGA** (repairs the proposed module plan against the contract) | Materialization engine, blueprint generator, GPCA |
| PPC-105 | Feature plan (per-module feature set) | **Prompt-Bounded Module Plan**, repaired by CBGA | Modular feature generator |
| PPC-106 | Route plan | **CBGA** | Blueprint generator, router generator, GPCA |
| PPC-107 | Navigation plan | **CBGA** (`CbgaGenerationReport.navigationPlan`) | Blueprint product-surface generator, GPCA |
| PPC-108 | Visible copy (headings, labels, summaries) | **Blueprint contract-copy derivation** (`deriveBlueprintContractCopy`), fed by CBGA-repaired identity/module plan | Blueprint generator's rendering functions only |
| PPC-109 | Sample / seed / demo data | **Modular feature generator**, only when explicitly tagged DEMO_DATA provenance — never treated as product evidence | GPCA (must classify separately from navigation/business content) |
| PPC-110 | Validation data (form rules, messages) | **Modular feature generator**, derived from the approved module/field definition | GPCA (classification only) |
| PPC-111 | Manifest (blueprint-manifest.json, build-manifest.json) | **Materialization engine** (write-once per build, from approved plan) | GPCA, downstream tooling |
| PPC-112 | Workspace files | **Materialization engine** (initial write); **named repair systems** (post-write mutation, see §PPC-500) | GPCA, dev server, preview |
| PPC-113 | Preview evidence | **Live Preview Gate**, sourced from a **fresh** GPCA report | End user / interaction proof |
| PPC-114 | Repair authority | **AEO** dispatches; only registered repair capabilities may mutate files (see §PPC-500) | GPCA (must re-audit after) |
| PPC-115 | Mutation authority | Materialization engine (initial write) + explicitly registered repair capabilities only. **No other code path may write to a workspace directory.** | — |
| PPC-116 | Final build result | **Build outcome policy / AEE final report** | API response, chat response, UI |

**Consequence (Invariant PPC-1201):** If a concept in this table is not being computed by its owning stage, that is a constitutional violation, regardless of whether the result happens to be correct today.

---

## §PPC-200 — Immutable Artifacts

The following artifacts become **immutable** the moment they are approved within a build. "Immutable" means: downstream systems may read them, project them, or fail because of them — but may never re-derive a different value for the same field, and may never silently rewrite them without going through the owning stage again. *(Severity: BLOCKING. Auto-fix: NO. Validator: PPCEA (planned).)*

| ID | Artifact | Approved by | Immutable from |
|---|---|---|---|
| PPC-201 | `CanonicalProductContract` | Product Faithfulness (`buildCanonicalProductContract`) | The moment it is returned to the orchestrator |
| PPC-202 | CBGA-repaired generation plan (`CbgaGenerationReport` + patched build plan) | CBGA (`applyContractBoundGenerationToBuildPlan`) | The moment CBGA returns its report |
| PPC-203 | Approved module plan (`modulePlan.approvedModuleIds`) | CBGA | Same as PPC-202 |
| PPC-204 | Approved route plan (`modulePlan.routes`) | CBGA | Same as PPC-202 |
| PPC-205 | Approved navigation plan (`navigationPlan`) | CBGA | Same as PPC-202 |
| PPC-206 | Approved surface/copy plan (`deriveBlueprintContractCopy` output) | Blueprint contract-copy derivation, itself fed only by the CBGA-approved plan | The moment it is computed for this build |
| PPC-207 | Approved provenance map (`BLUEPRINT_PRODUCT_SURFACE_PROVENANCE`, blueprint artifact provenance) | Materialization engine, at write time | The moment the file is written |

**Consequence:** once these exist for a build, a generator that computes its own app title, its own module list, or its own navigation label set instead of reading the immutable artifact is — by definition, regardless of whether its output happens to match — in violation of this constitution.

---

## §PPC-300 — Stage Permissions & Read/Write/Mutate Boundaries (Amendment 4)

For every production stage, this section defines explicit **May Read / Must Never Read / May Write / Must Never Write / May Mutate / Must Never Mutate** boundaries, plus whether inference, fallback, and preview activation are permitted. *(Severity: BLOCKING. Auto-fix: NO. Validator: PPCEA (planned).)* This supersedes the informal "allowed/forbidden inputs/outputs" framing used before Amendment Set 1 with an explicit, unambiguous boundary per stage.

### PPC-301 — Intent Understanding / Prompt Extraction

- **May Read:** Raw prompt only.
- **Must Never Read:** Prior workspace state; a prior build's contract.
- **May Write:** Draft extraction (candidate app name, candidate domain, candidate modules) — explicitly a **draft**, never authoritative.
- **Must Never Write:** Anything labeled "final" or "approved".
- **May Mutate:** Nothing.
- **Must Never Mutate:** Any workspace file.
- **Inference:** Allowed (this is the only stage where inference is the whole point). **Fallback:** Allowed (deterministic fallback for unparseable prompts). **Preview:** Not allowed.

### PPC-302 — Product Faithfulness (Canonical Product Contract)

- **May Read:** Raw prompt; optional architecture/PIM context.
- **Must Never Read:** Existing workspace files.
- **May Write:** `CanonicalProductContract`.
- **Must Never Write:** Module/route/navigation plans (not its job).
- **May Mutate:** Nothing.
- **Must Never Mutate:** Any workspace file.
- **Inference:** Allowed, but must be the single canonical inference. **Fallback:** Allowed (neutral-identity fallback when evidence is genuinely ambiguous). **Preview:** Not allowed.

### PPC-303 — CBGA

- **May Read:** `CanonicalProductContract` (required, never optional); proposed build plan.
- **Must Never Read:** Raw prompt directly for identity (must go through the contract).
- **May Write:** Repaired build plan; `navigationPlan`; `modulePlan`; `routePlan`; repaired identity.
- **Must Never Write:** Anything that bypasses the contract.
- **May Mutate:** The proposed build plan (plan-level repair only, pre-materialization).
- **Must Never Mutate:** Already-materialized workspace files (CBGA runs before materialization).
- **Inference:** Not allowed — CBGA repairs against the contract, it does not invent new identity. **Fallback:** Allowed only for structurally-unrecognized modules (slug-as-label), never for identity. **Preview:** Not allowed.

### PPC-304 — Materialization / Blueprint / Modular Generators

- **May Read:** CBGA-repaired build plan (required, non-optional); approved navigation labels; approved provenance.
- **Must Never Read:** Raw prompt as a product-meaning source (a package-metadata string is the only exception); existing workspace file *content* as evidence.
- **May Write:** Workspace files; manifests.
- **Must Never Write:** A second, independently-derived contract/feature-contract for the same product.
- **May Mutate:** Nothing pre-existing — this is the first-write stage (see §PPC-500 for post-write mutation by repair systems).
- **Must Never Mutate:** Files GPCA has already audited, without triggering re-audit (§PPC-600).
- **Inference:** Not allowed. **Fallback:** **Not allowed** — if the approved plan is missing something, generation must fail, not synthesize a replacement. **Preview:** Not allowed.

### PPC-305 — GPCA

- **May Read:** Canonical contract; CBGA report; build plan; current on-disk generated files.
- **Must Never Read:** A cached/stale report, treated as if it were current.
- **May Write:** Compliance report; gate outcome.
- **Must Never Write:** Anything to the workspace.
- **May Mutate:** Nothing — ever.
- **Must Never Mutate:** Anything.
- **Inference:** Not allowed. **Fallback:** Not allowed. **Preview:** GPCA gates preview; it does not activate it.

### PPC-306 — Repair Systems (AEO-dispatched)

- **May Read:** The specific failure class they are registered for; read access to workspace.
- **Must Never Read:** A GPCA verdict as data to be silently overwritten.
- **May Write:** File writes (real-mutation repairs) *or* in-memory evidence updates (evidence-only repairs) — never both conflated in one repair action.
- **Must Never Write:** A GPCA "ALLOWED" verdict produced without GPCA re-running.
- **May Mutate:** Workspace files, but only for capabilities explicitly registered as file-mutating (§PPC-500).
- **Must Never Mutate:** Files outside the specific failure class they are registered for.
- **Inference:** Not allowed. **Fallback:** Not allowed. **Preview:** Not allowed (repair systems don't gate preview themselves).

### PPC-307 — Live Preview Gate

- **May Read:** The most recent GPCA report; current workspace path.
- **Must Never Read:** A GPCA report older than the last workspace mutation, treated as current.
- **May Write:** Unlock / lock decision.
- **Must Never Write:** An unlock decision based on pipeline evidence alone, without GPCA.
- **May Mutate:** Nothing.
- **Must Never Mutate:** Anything.
- **Inference:** Not allowed. **Fallback:** Not allowed. **Preview:** Yes — this is its purpose, gated on a fresh GPCA report.

### PPC-308 — Preview / Dev Server

- **May Read:** The approved `workspaceDir`.
- **Must Never Read:** A different/stale workspace path.
- **May Write:** Running preview URL / process.
- **Must Never Write:** Product content of any kind — the dev server serves, it does not generate.
- **May Mutate:** Nothing.
- **Must Never Mutate:** Anything in the workspace it serves.
- **Inference:** Not allowed. **Fallback:** Not allowed. **Preview:** Yes.

---

## §PPC-400 — Generator Rules

These apply to every generator: the blueprint generator, the modular feature generator, the materialization engine, and any future generator. *(Owner: Materialization / Blueprint / Modular Generators. Severity: BLOCKING. Auto-fix: NO. Validator: PPCEA (planned), except PPC-403 — see below.)*

| ID | Rule |
|---|---|
| PPC-401 | **Generators must consume approved inputs.** A generator's contract-shaped parameters must be non-optional in intent even where the type system currently allows `?`. Any `??`/`||` fallback to a prompt-re-derivation function on a contract-shaped parameter is a constitutional violation, not a convenience. |
| PPC-402 | **Generators may not derive identity from raw prompt.** App name, product domain, and product purpose must come from the CBGA-repaired plan. A generator that calls its own prompt-parsing function to get an app name (in place of, or in addition to, the plan's) violates this constitution even if the two happen to agree today. |
| PPC-403 | **Generators may not derive navigation from file existence.** A nav item may only be visible if it is present in the CBGA-approved `navigationPlan`. The mere on-disk existence of a page file (`ProfilePage.tsx`, `SettingsPage.tsx`, etc., which may exist for unrelated structural reasons) is never navigation evidence. *(Validator: Contract-Bound Navigation Shell Fix V1 validator — existing, partial coverage — plus PPCEA (planned) for full coverage.)* |
| PPC-404 | **Generators may not invent sample records without provenance.** Any seed/demo/sample data must be explicitly tagged with a DEMO_DATA (or equivalent) provenance marker distinguishable from real business content, so downstream classification (§PPC-900) and GPCA rendered-content evidence can tell them apart. |
| PPC-405 | **Generators may not emit default shell product labels unconditionally.** Default-shell navigation/action labels (Activity, Alerts, Profile, Settings, Help, Feedback, Legal, or any future equivalent) may only render when present in the CBGA-approved navigation plan. |
| PPC-406 | **Generators may not use profile templates as product truth.** A profile-keyed copy template (e.g. "CRM pipeline copy" for a `crm` profile) is a last-resort structural fallback, never a substitute for contract-derived copy when contract-derived copy is available. |
| PPC-407 | **Generators may not use stale workspace files as evidence.** A generator deciding what to write must never read the *content* of previously-generated files to infer product meaning; it may only read the current build's approved plan. (Reading file *paths* for cleanup/sanitization purposes is permitted; reading file *content* for meaning is not.) |
| PPC-408 | **Generators may not mutate a workspace after GPCA without triggering re-audit.** Any generator or repair system that writes to a workspace directory after GPCA's post-materialization report has been produced is responsible for triggering a fresh GPCA audit before that workspace may be served to preview (see §PPC-600). |

---

## §PPC-500 — Repair Rules

Six repair categories exist. Every current or future repair capability must declare which one it is and follow that category's rules. *(Owner: AEO (dispatch) + the specific repair capability. Validator: PPCEA (planned).)*

| ID | Category | Allowed scope | Forbidden scope | Can mutate files? | GPCA re-audit required after? | PF re-audit required after? | Preview may proceed after? | Severity | Auto-fix |
|---|---|---|---|---|---|---|---|---|---|
| PPC-501 | **Evidence-only repair** (e.g. Product Faithfulness V2 stage-evidence reconciliation) | Reconciling in-memory audit/report objects when the same evidence already exists elsewhere in the build's own evidence set | Claiming a concept was "fixed" when no file changed; relabeling a build outcome as if regeneration occurred | **No** | No | No | Unaffected — preview status must not change because of an evidence-only repair | STRUCTURAL | NO |
| PPC-502 | **Generation repair** (e.g. CBGA plan repair) | Repairing the *plan* before materialization | Repairing already-materialized files directly | No (plan-level only, pre-write) | Not applicable | Not applicable | Not applicable | STRUCTURAL | PARTIAL |
| PPC-503 | **Workspace repair** (e.g. workspace-materialization-stabilizer) | Structural workspace fixes (missing config files, malformed manifests) | Rewriting product content, copy, navigation, or identity | **Yes** | **Yes — mandatory** | Only if product content changed | Only after GPCA re-audit passes | BLOCKING | PARTIAL |
| PPC-504 | **Compiler repair** (e.g. AEE build-autofix loop) | Fixing TypeScript/build errors in already-generated files | Introducing new product content, new navigation, new copy | **Yes** | **Yes — mandatory** | Only if product content changed | Only after GPCA re-audit passes | BLOCKING | PARTIAL |
| PPC-505 | **Runtime repair** (e.g. autonomous recovery / npm retry) | Re-running a failed command | Modifying source file content | Only indirectly (`node_modules`, build artifacts) | No | No | Unaffected | STRUCTURAL | PARTIAL |
| PPC-506 | **Missing-capability repair** (e.g. Engineering Intelligence Runtime, Capability Evolution Runtime) | Generating a genuinely new capability/module GPCA/AEO proved the generator cannot produce | Bypassing GPCA to add the capability, or adding it without contract justification | **Yes** | **Yes — mandatory** | **Yes — mandatory** | Only after both re-audits pass | BLOCKING | PARTIAL |

**Universal rule:** any repair category marked "Can mutate files? Yes" **must** trigger a fresh GPCA audit before preview may proceed. Any repair category marked "No" must never be described, logged, or reported as having "fixed" or "repaired" the *application* — only the *evidence/report*.

---

## §PPC-600 — Re-Audit Rules

GPCA's post-materialization report must be treated as **perishable**, not permanent. It is valid only for the exact workspace state it audited. *(Owner: GPCA. Severity: BLOCKING. Auto-fix: NO. Validator: PPCEA (planned) — no production trigger currently enforces all seven uniformly; see Root Cause C, Part 2.)* GPCA must re-run:

| ID | Trigger |
|---|---|
| PPC-601 | After materialization — the first, baseline audit (already correctly wired today). |
| PPC-602 | After workspace stabilizer writes — any file the stabilizer creates/repairs invalidates the prior report. |
| PPC-603 | After build autofix writes — compiler-repair file patches invalidate the prior report. |
| PPC-604 | After engineering intelligence writes — missing-capability-repair file generation invalidates the prior report. |
| PPC-605 | After capability evolution writes — AEL's runtime module generation invalidates the prior report. |
| PPC-606 | After continuation workspace reuse — before any materialization-skip decision is trusted, GPCA must audit the *complete* set of existing product and blueprint artifacts (not a partial file list — see §PPC-700). |
| PPC-607 | Immediately before preview activation — the final gate must test the *current* GPCA state, never a report object captured earlier in the same request, if any mutation could have occurred since it was captured. |

**Constitutional rule:** a GPCA report is invalidated by any file write to its audited `workspaceDir`, from any source, for any reason. "The report said ALLOWED ten minutes ago" is never a valid basis for activating preview if anything wrote to the workspace since.

---

## §PPC-700 — Continuation Rules

*(Owner: One-Prompt Build Orchestrator, continuation branch. Severity: BLOCKING. Auto-fix: NO. Validator: PPCEA (planned).)*

| ID | Rule |
|---|---|
| PPC-701 | **Existing workspace cannot be trusted by presence alone.** `workspaceHasGeneratedFeatureModules()` returning true means "materialization is not strictly required," not "this workspace is compliant." Compliance must still be proven by a fresh GPCA audit every time. |
| PPC-702 | **The file list GPCA audits on continuation must include every generated product and blueprint artifact** — not just feature modules and `App.tsx`. Any enumerator that omits `src/blueprint/**` (or any future top-level generated directory) is constitutionally incomplete, because GPCA cannot audit content it never reads. *(This is the exact gap documented as Root Cause H, Part 2.)* |
| PPC-703 | **Stale workspace files must not become generation evidence.** A continuation build may *serve* existing files once they pass audit, but must never *read their content* to decide what a fresh build plan should contain (see PPC-407). |
| PPC-704 | **The same module ID with a different meaning across builds must force regeneration or revalidation.** If a new prompt's approved plan reuses a module ID that already exists on disk from a prior, different prompt, the system must not assume the old file content is still correct — it must either regenerate that module or explicitly revalidate its content against the new plan before continuation is allowed. |
| PPC-705 | **Continuation must use the same constitution as fresh builds.** There is no "lighter" compliance tier for continuation. Every rule in this document applies identically whether materialization ran this request or was skipped. |

---

## §PPC-800 — Traceability Rules

Every generated artifact must be able to prove the following ancestry chain, in order, with no link skipped:

```
Prompt
  → CanonicalProductContract
  → CBGA plan
  → generator input
  → file/content output
  → GPCA evidence
  → preview evidence
```

| ID | Rule | Owner | Severity | Auto-fix | Rationale |
|---|---|---|---|---|---|
| PPC-801 | Every generated artifact must prove the full ancestry chain above, in order, with no link skipped. **If any link is missing, generation must fail** — GPCA must not allow the build to proceed on the strength of a partial chain. | GPCA | BLOCKING | NO | A partial ancestry chain is indistinguishable from a fabricated one; both must be treated as a failure, not a pass. |
| PPC-802 | Ancestry must be provable by **emitted provenance** (a tag recording which approved-plan field a generator used), not solely by re-derived heuristics. | Generators (emit) + GPCA (consume) | STRUCTURAL | NO | Heuristic-only traceability (plan lookup, word overlap) is the exact mechanism behind Root Cause D (Part 2). See Roadmap Tier 5. |
| PPC-803 | Heuristic matching (plan-membership lookup, word-overlap scoring) remains an acceptable **secondary, defense-in-depth** check, but must never be the *only* mechanism proving traceability once emitted provenance is available for a given artifact class. | GPCA | STRUCTURAL | NO | Demotes (never deletes) heuristic matching, preserving defense-in-depth while removing it as a single point of failure. |

---

## §PPC-900 — Classification Rules

The following boundaries must be classified by **distinct, non-overlapping signals** — never by a single shared extractor applied uniformly to an entire file. *(Severity: STRUCTURAL. Auto-fix: NO.)*

| ID | Boundary | Rule | Validator |
|---|---|---|---|
| PPC-901 | **Infrastructure vs product** | Infrastructure may contain zero business identity (no product-specific nouns, headings, or button text). A file with any business-facing prose is product or mixed, never infrastructure, regardless of how much structural/routing code it also contains. | Infrastructure vs Product Boundary Authority V1 (existing) |
| PPC-902 | **Navigation vs sample data** | A `label` field is navigation only if it is part of a navigation data structure the generator explicitly marks as such (e.g. `shellPrimaryNavItems`, `navigationPlan`-sourced). A `label` field inside a feature module's record/seed data is never navigation, even if it uses the same field name. | PPCEA (planned) |
| PPC-903 | **Module content vs navigation** | A module's internal display name (used inside its own feature UI) is module content. Only the CBGA-approved `navigationPlan` entries are navigation. The two must not be conflated even when their string values happen to match. | PPCEA (planned) |
| PPC-904 | **Preview entries vs business records** | Anything explicitly generated as demonstration/seed/sample content (PPC-404) must carry a distinguishing marker and must never be evaluated as if it were real business content during faithfulness or compliance auditing. | PPCEA (planned) |
| PPC-905 | **Pages vs features** | A page (a top-level routed screen) and a feature module (a reusable, contract-bound unit of functionality) are different artifact kinds. Classification must be able to distinguish them, not collapse both into a single "PRODUCT" bucket with no further distinction. | PPCEA (planned) |
| PPC-906 | **Metadata vs product evidence** | Build metadata (manifests, package.json, provenance JSON) is never evidence of product content, and product content is never build metadata. Metadata files must be excluded from content-based product/infrastructure classification entirely. | PPCEA (planned) |
| PPC-907 | **Shell structure vs visible product copy** | The container (nav slot, layout, routing logic) is shell structure. The strings rendered inside it are visible product copy. A file may contain both, but the classification of "does this file need contract-derived content" must be evaluated per-string, not per-file, wherever the two are mixed. | PPCEA (planned) |

---

## §PPC-1000 — Preview Rules

Preview may activate only when **all** of the following hold simultaneously. *(Owner: Live Preview Gate. Severity: BLOCKING. Auto-fix: NO. Validator: PPCEA (planned).)*

| ID | Rule |
|---|---|
| PPC-1001 | **GPCA report is fresh** — produced after the most recent write to the workspace, not merely "produced earlier this request." |
| PPC-1002 | **Workspace has not been mutated after GPCA** — if it has, re-audit (§PPC-600) must complete and pass before this rule is satisfied. |
| PPC-1003 | **Preview path equals audited workspace path** — the directory the dev server serves must be byte-identical (same resolved absolute path) to the directory GPCA's report was built against. |
| PPC-1004 | **Live Preview Gate has current GPCA evidence** — the gate's required-evidence set must include a live reference to the current GPCA report, not rely solely on other pipeline evidence sources (Intent Understanding, Prompt Faithfulness, Launch Readiness) that do not themselves re-verify compliance. |
| PPC-1005 | **Interaction proof tests the audited app, not stale server output** — any interaction/route-reachability proof must run against the same server instance serving the just-audited workspace, not a reused process that may be serving a different build's bundle. |

**If any of these five conditions is false, preview must not activate — regardless of how many other stages report success.**

---

## §PPC-1100 — Final Result Rules

The final build result must use **distinct, non-overlapping labels** for the following outcomes. No two of these may ever be reported with the same label. *(Owner: Build outcome policy / AEE final report. Severity: STRUCTURAL. Auto-fix: NO. Validator: PPCEA (planned).)*

| ID | Label | Description |
|---|---|---|
| PPC-1101 | `BUILT_SUCCESSFULLY` | Materialized, GPCA-compliant, preview-verified. |
| PPC-1102 | `BUILT_BUT_CONTRACT_BLOCKED` | GPCA blocked before materialization/preview could be attempted (`GENERATION_PIPELINE_NON_COMPLIANT`). |
| PPC-1103 | `BUILT_BUT_PREVIEW_BLOCKED` | Materialization succeeded and was GPCA-compliant, but the Live Preview Gate could not unlock (e.g. build/runtime failure). |
| PPC-1104 | `BUILT_AFTER_REAL_REPAIR` | A repair category with "Can mutate files: Yes" (§PPC-500) ran, files changed, and a fresh GPCA (and, if applicable, Product Faithfulness) re-audit passed afterward. |
| PPC-1105 | `FAILED_AFTER_EVIDENCE_ONLY_REPAIR` | An evidence-only repair ran (report/evidence objects updated) but the underlying failure was not actually resolved because no file changed; must never be reported using the same label as PPC-1104. |
| PPC-1106 | `FAILED_MISSING_CAPABILITY` | AEO/EIAA correctly determined the generator lacks a capability the contract requires, and no auto-repair path exists. |
| PPC-1107 | `FAILED_CONSTITUTION_VIOLATION` | A generator produced output this constitution forbids (e.g. independently-derived identity, unapproved navigation, stale-content reuse) — distinct from a GPCA content-quality block; identifies an *architectural* violation, not merely a low-quality result. |

**Constitutional rule:** it is a violation of this document for any reporting layer (API result, chat response, dashboard) to describe outcome PPC-1105 using language that implies PPC-1104 occurred (e.g. "repaired," "fixed," "resolved") when no workspace file actually changed.

---

## §PPC-1200 — Constitutional Invariants (Amendment 6)

The rules above are numerous and may be individually amended over time. The invariants below are **timeless architectural truths** that must survive any such amendment — a future amendment may change *how* a rule enforces an invariant, but may never remove the invariant itself without explicitly repealing it through Governance (§PPC-1500). *(Owner: PPCEA (planned); self-accountable per-authority until implemented. Severity: BLOCKING. Auto-fix: NO.)*

| ID | Invariant | Underlying rule group |
|---|---|---|
| PPC-1201 | Exactly one owner exists for every product concept. | §PPC-100 (Authority Ownership) |
| PPC-1202 | Every generated artifact has one ancestry chain. | §PPC-800 (Traceability Rules) |
| PPC-1203 | Every workspace mutation invalidates the previous GPCA report. | §PPC-600 (Re-Audit Rules) |
| PPC-1204 | Generators consume only approved inputs. | §PPC-400 (Generator Rules) |
| PPC-1205 | Preview never occurs without a fresh GPCA audit. | §PPC-1000 (Preview Rules) |
| PPC-1206 | Every repair is classified into exactly one repair category. | §PPC-500 (Repair Rules) |
| PPC-1207 | **No Parallel Truth** *(Amendment Set 2)*: a production fact may exist in exactly one authoritative form; every downstream stage must reference that authoritative source, never independently reconstruct an equivalent fact. | §PPC-1600 (Single Source of Truth Registry), §PPC-1700 (Canonical Pipeline Data Contract) |
| PPC-1208 | Every constitutional violation belongs to exactly one primary Violation Taxonomy category. *(Amendment Set 2)* | §PPC-2100 (Violation Taxonomy) |

**PPC-1207 — No Parallel Truth — is one of this constitution's highest-level principles.** One Product Identity. One Navigation Plan. One Module Plan. One Route Plan. One Feature Contract. One Workspace. One GPCA Report. One Preview Proof. One Capability Request. Independent reconstruction of an existing production fact — even one that happens to compute the same value today — is constitutionally forbidden; it must consume the authoritative object instead (§PPC-1600, §PPC-1700).

---

## §PPC-1300 — Canonical Pipeline State Machine (Amendment 5)

Every build — fresh or continuation — must be modelable as a traversal of the following state machine. *(Owner: One-Prompt Build Orchestrator / GPCA / Live Preview Gate as noted. Severity: BLOCKING unless noted. Auto-fix: NO. Validator: PPCEA (planned).)*

### PPC-1301 — Canonical states

```
NEW
  ↓
INTENT_RESOLVED
  ↓
CONTRACT_APPROVED
  ↓
PLAN_APPROVED
  ↓
GENERATION_ALLOWED
  ↓
WORKSPACE_MATERIALIZED
  ↓
GPCA_VERIFIED
  ↓
PREVIEW_VERIFIED
  ↓
COMPLETED
```

Terminal blocked states, reachable from the states noted in PPC-1302: `CONTRACT_BLOCKED` (PPC-1102), `PREVIEW_BLOCKED` (PPC-1103), `MISSING_CAPABILITY` (PPC-1106), `CONSTITUTION_VIOLATED` (PPC-1107).

### PPC-1302 — Legal transitions

| From | To | Condition |
|---|---|---|
| `NEW` | `INTENT_RESOLVED` | Intent Understanding produces a draft extraction. |
| `INTENT_RESOLVED` | `CONTRACT_APPROVED` | Product Faithfulness approves the `CanonicalProductContract`. |
| `CONTRACT_APPROVED` | `PLAN_APPROVED` | CBGA repairs and approves the generation plan. |
| `CONTRACT_APPROVED` | `CONTRACT_BLOCKED` | CBGA cannot produce a constitutionally-valid plan from the contract. |
| `PLAN_APPROVED` | `GENERATION_ALLOWED` | All §PPC-300 pre-materialization permissions are satisfied. |
| `GENERATION_ALLOWED` | `WORKSPACE_MATERIALIZED` | Generators write workspace files from the approved plan only. |
| `WORKSPACE_MATERIALIZED` | `GPCA_VERIFIED` | GPCA audits the current workspace and passes. |
| `WORKSPACE_MATERIALIZED` | `CONTRACT_BLOCKED` | GPCA audits the current workspace and blocks (`GENERATION_PIPELINE_NON_COMPLIANT`). |
| `GPCA_VERIFIED` | `PREVIEW_VERIFIED` | Live Preview Gate unlocks and interaction proof passes against the audited workspace. |
| `GPCA_VERIFIED` | `PREVIEW_BLOCKED` | Dev server/build fails, or interaction proof fails, after a compliant audit. |
| `PREVIEW_VERIFIED` | `COMPLETED` | Final result recorded. |
| `WORKSPACE_MATERIALIZED` | `WORKSPACE_MATERIALIZED` | A file-mutating repair (§PPC-500, "Can mutate files: Yes") writes to the workspace; state **regresses** here even if the pipeline had already reached `GPCA_VERIFIED` or later (PPC-1304). |
| `GPCA_VERIFIED` | `MISSING_CAPABILITY` | AEO/EIAA determines a required capability is missing and no auto-repair path exists. |
| `WORKSPACE_MATERIALIZED` | `CONSTITUTION_VIOLATED` | A generator is proven to have violated §PPC-400 (e.g. independent identity derivation), even where GPCA content checks alone would not have caught it. |

### PPC-1303 — Illegal transitions (must never occur)

| From | To | Reason |
|---|---|---|
| `PLAN_APPROVED` | `PREVIEW_VERIFIED` | Skips `GENERATION_ALLOWED`, `WORKSPACE_MATERIALIZED`, and `GPCA_VERIFIED` — **preview without generation is illegal.** |
| `GENERATION_ALLOWED` | `GPCA_VERIFIED` | Skips `WORKSPACE_MATERIALIZED` — GPCA cannot audit content that was never written. |
| `WORKSPACE_MATERIALIZED` | `PREVIEW_VERIFIED` | Skips `GPCA_VERIFIED` — preview must never activate against an unaudited workspace (PPC-1001). |
| `GPCA_VERIFIED` | `COMPLETED` | Skips `PREVIEW_VERIFIED` — a compliant workspace that was never preview-verified is not "completed" (PPC-1101 requires preview-verified). |
| `NEW` | `CONTRACT_APPROVED` | Skips `INTENT_RESOLVED` — the contract must be built from resolved intent, not directly from an unresolved request. |
| `GPCA_VERIFIED` | `GPCA_VERIFIED` (after mutation) | Re-entering `GPCA_VERIFIED` after any mutation without first regressing through `WORKSPACE_MATERIALIZED` for a fresh audit is a stale-evidence transition (PPC-1203). |
| `WORKSPACE_MATERIALIZED` (continuation) | `GPCA_VERIFIED` | On a continuation build, illegal unless backed by a fresh audit of the **complete** current file list (PPC-702) — an audit against a partial file list does not satisfy this edge. |

### PPC-1304 — Mutation forces state regression

Any file-mutating action taken while in or after `WORKSPACE_MATERIALIZED` regresses the state machine back to `WORKSPACE_MATERIALIZED`, regardless of which later state the pipeline had already reached. `GPCA_VERIFIED` and `PREVIEW_VERIFIED` may only be re-entered via a fresh traversal of their normal legal transitions. This directly operationalizes Invariant PPC-1203.

Any future implementation must obey this state machine; an implementation that reaches `PREVIEW_VERIFIED` or `COMPLETED` through a path not listed in PPC-1302 is, by definition, in violation of PPC-1303.

---

## §PPC-1400 — Constitution Enforcement Authority (PPCEA) (Amendment 1)

The constitution previously defined rules but not who enforces them. This section closes that gap.

**PPC-1401 — Existence and mandate.** This constitution establishes a new architectural authority: the **Production Pipeline Constitution Enforcement Authority (PPCEA)**. PPCEA is **not** a production implementation today — it is an architectural authority defined by this constitution, whose future responsibility is to verify that every production authority operates within the limits this constitution defines, citing violations by permanent rule ID (e.g. `PPC-204`) rather than free-form prose. PPCEA's *implementation* is deferred to a future milestone (see Part 3, Roadmap); its constitutional *ownership and mandate* are **not** deferred — they exist now, by virtue of this section.

**PPC-1402 — Validation scope.** PPCEA will eventually validate:

- Product Faithfulness
- CBGA
- Blueprint Generator
- Modular Feature Generator
- Materialization Engine
- GPCA
- Live Preview Gate
- Repair Systems
- Final Reporting

**PPC-1403 — Non-replacement.** PPCEA does **not** replace any authority. It validates that authorities obey the constitution; it does not perform product faithfulness scoring, contract-bound generation, compliance auditing, repair, or preview activation itself. It reads; until a future constitutional amendment explicitly grants it gating power, it never mutates, generates, repairs, or gates on its own authority.

Future milestones may implement PPCEA (see Roadmap Tier 1+ dependencies, Part 3), but this constitution establishes its ownership **now** — no other authority may claim the role of "the thing that verifies constitutional compliance across stages" without superseding this section via the Governance process (§PPC-1500).

---

## Rule Documentation Format (Amendment 7)

Every constitutional rule may eventually carry a full historical record with three fields:

- **Purpose** — why the rule exists, in one sentence.
- **History** — the specific documented incident(s) (cross-referenced to Part 2, the Architecture Audit) that led to the rule being written.
- **Expected Failure Prevented** — the named failure class the rule exists to prevent.

**This format is defined now; it does not require filling in every rule's historical record today.** Two worked examples are provided below to establish the pattern future amendments should follow when documenting a rule's history:

> **PPC-402 — Generators may not derive identity from raw prompt**
> - **Purpose:** Prevent independent identity derivation outside the CBGA-repaired plan.
> - **History:** Introduced after *Production Generation Architecture Audit V1* Root Cause B documented repeated identity drift (e.g. "Calculator / Arithmetic Utility" and "reusable components where" outputs traced to independent `extractAppName`/UFCI computations disagreeing with the CBGA-repaired identity) across four consecutive prior milestones.
> - **Expected Failure Prevented:** Identity Drift.

> **PPC-702 — The continuation file list must include every generated artifact**
> - **Purpose:** Prevent continuation builds from auditing an incomplete file list.
> - **History:** Introduced after *Production Generation Architecture Audit V1* Root Cause H documented that the continuation-path file enumerator omitted `src/blueprint/**`, allowing a non-compliant navigation shell to reach preview undetected on continuation builds even after Contract-Bound Navigation Shell Fix V1 shipped for fresh materialization.
> - **Expected Failure Prevented:** Continuation Compliance Bypass.

---

## §PPC-1500 — Constitution Governance (Amendment 9)

*(Owner: This constitution's maintainers. Severity: STRUCTURAL. Auto-fix: NO. Validator: `validate-production-pipeline-constitution-v2.ts`, documentation-completeness only.)*

| ID | Rule |
|---|---|
| PPC-1501 | **Amendment introduction.** Any amendment must state which existing rule IDs it modifies, extends, or supersedes, versus which rule IDs are newly added. An amendment may **never** silently renumber an existing rule ID. |
| PPC-1502 | **Ratification.** An amendment becomes ratified for this document the moment it is merged into `docs/production-pipeline-constitution-v1.md` with a corresponding Amendment Log entry (date, amendment-set name, summary). Ratification of a rule is independent of, and not conditioned on, any production authority already conforming to it — conformance is tracked separately via the Implementation Roadmap (Part 3), which is explicitly non-binding. |
| PPC-1503 | **Deprecation.** A rule may be marked `DEPRECATED` — **never deleted** — when superseded by a newer rule. Its text is retained with an explicit "Superseded by: `<new rule ID>`" annotation. |
| PPC-1504 | **Historical traceability.** Deprecated/superseded rules remain visible in this document (moved to a Superseded Rules appendix if the active tables would otherwise become unreadable). They are never silently removed, preserving full historical traceability. |
| PPC-1505 | **ID permanence.** Rule IDs are **never reused**, even after deprecation. The next new rule introduced into an existing hundred-block group always takes the next unused sequence number within that group; a new rule category takes the next unused hundred-block. |
| PPC-1506 | **Proposal** *(Amendment Set 2)*. Any contributor may propose a new rule by drafting the concept, the gap it closes (ideally citing a Part 2 root cause or a new documented incident), and the proposed rule text in the standard Rule Metadata Standard shape. A proposal is not a rule until it completes Review (PPC-1507) and Ratification (PPC-1502). |
| PPC-1507 | **Review** *(Amendment Set 2)*. An amendment is reviewed against four checks before ratification: (a) it does not silently renumber an existing rule ID (PPC-1501); (b) every new rule is placed in the correct hundred-block per the Rule ID Convention, or a new hundred-block is used if none fits; (c) every new rule carries the full six-field Rule Metadata Standard; (d) a validator script proves the amendment's documentation completeness before merge. |
| PPC-1508 | **Version release** *(Amendment Set 2)*. A new constitution version (§PPC-2300) is released only when an amendment set completes Ratification (PPC-1502); the released version's Major/Minor/Patch fields are assigned per the Constitution Versioning policy (§PPC-2300), and the prior current version is marked `SUPERSEDED`, never deleted. |
| PPC-1509 | **Archival** *(Amendment Set 2)*. Superseded rules and superseded constitution versions are archived, not deleted: a rule is archived into this document's Superseded Rules appendix (PPC-1504) with its original ID, statement, and "Superseded by" annotation preserved verbatim; a superseded constitution version is archived into the Constitution Versioning table (§PPC-2300) with its "Superseded By" field pointing at the version that replaced it. |

### Amendment Log

| Amendment Set | Date | Summary |
|---|---|---|
| **V1 Ratification** | 2026-07-09 | Initial ratification: the Enforced Pipeline Model, Authority Ownership, Immutable Artifacts, Stage Permissions, Generator/Repair/Re-Audit/Continuation/Traceability/Classification/Preview/Final Result Rules, the eight-root-cause Architecture Audit mapping, and the Tier 0-6 Implementation Roadmap. |
| **Amendment Set 1** | 2026-07-09 | Added the Constitution Enforcement Authority (PPCEA, §PPC-1400); permanent rule IDs across every section (PPC-1xx–PPC-15xx); the Rule Metadata Standard; explicit Read/Write/Mutate boundaries per stage (§PPC-300); the Canonical Pipeline State Machine (§PPC-1300); Constitutional Invariants (§PPC-1200); the Rule Documentation Format with two worked examples; Constitution Governance and this Amendment Log (§PPC-1500); and restructured the document into three parts (Constitution / Architecture Audit / Roadmap) so the roadmap is explicitly non-binding. |
| **Amendment Set 2** | 2026-07-09 | Added the Single Source of Truth Registry (§PPC-1600); the Canonical Pipeline Data Contract (§PPC-1700); the Generator Interface Standard (§PPC-1800) and Authority Interface Standard (§PPC-1900); the Constitutional Capability Registry (§PPC-2000); the Violation Taxonomy (§PPC-2100); the Constitutional Dependency Graph (§PPC-2200); Constitution Versioning (§PPC-2300); the No Parallel Truth invariant (PPC-1207) and a Violation Taxonomy completeness invariant (PPC-1208); the Constitutional Test Matrix (§PPC-2400, mechanically derived from the rule registry); and extended Constitution Governance with Proposal, Review, Version Release, and Archival rules (PPC-1506–PPC-1509). |

No rule ID has ever been renumbered or reused. This table will only ever grow.

---

## §PPC-1600 — Single Source of Truth Registry (Amendment Set 2)

Every production concept has **exactly one constitutional owner**. This registry generalizes §PPC-100 (Authority Ownership) into a single definitive ownership map spanning every object the pipeline produces — not only the concepts §PPC-100 already enumerated — so "who owns this?" always has exactly one answer. *(Severity: BLOCKING. Auto-fix: NO.)*

| ID | Concept | Constitutional Owner | Consumers | May Mutate | Validator | Pipeline Stage |
|---|---|---|---|---|---|---|
| PPC-1601 | Canonical Product Contract | Product Faithfulness (`buildCanonicalProductContract`) | CBGA, GPCA, PPCEA (planned) | Product Faithfulness, once, at creation. Immutable thereafter (PPC-201). | Product Faithfulness milestone validators | CONTRACT_APPROVED |
| PPC-1602 | Navigation Plan | CBGA (`CbgaGenerationReport.navigationPlan`) | Blueprint product-surface generator, GPCA, Infrastructure vs Product Boundary Authority | CBGA, once, during plan repair. Immutable thereafter (PPC-205). | Contract-Bound Navigation Shell Fix V1 / Contract-Bound Root Navigation Authority V1 validators | PLAN_APPROVED |
| PPC-1603 | Route Plan | CBGA (`modulePlan.routes`) | Blueprint generator, router generator, GPCA | CBGA, once, during plan repair. Immutable thereafter (PPC-204). | PPCEA (planned) | PLAN_APPROVED |
| PPC-1604 | Module Plan | CBGA (`modulePlan.approvedModuleIds`) | Materialization engine, blueprint generator, GPCA | CBGA, once, during plan repair. Immutable thereafter (PPC-203). | PPCEA (planned) | PLAN_APPROVED |
| PPC-1605 | Blueprint Surface | Blueprint contract-copy derivation (`deriveBlueprintContractCopy`), fed only by the CBGA-approved plan | Blueprint generator's rendering functions | Blueprint contract-copy derivation, once per build. Immutable thereafter (PPC-206). | Blueprint Generator Contract-Bound Replacement V1 / Blueprint Content Decomposition V1 | PLAN_APPROVED |
| PPC-1606 | Workspace | Materialization engine (initial write) + explicitly registered repair capabilities (post-write mutation only) | GPCA, dev server, preview | Materialization engine (first write); registered repair capabilities (§PPC-500, post-write only). | PPCEA (planned) | WORKSPACE_MATERIALIZED |
| PPC-1607 | Rendered Content | GPCA rendered-content collector (read-only extraction from the current workspace) | GPCA scoring/detectors, Infrastructure vs Product Boundary Authority | Nobody — a derived, read-only view recomputed fresh on every audit, never itself an authored artifact. | GPCA Rendered Content Evidence Expansion V1 validator | GPCA_VERIFIED |
| PPC-1608 | GPCA Report | GPCA (`buildGpcaPostMaterializationReport`) | Live Preview Gate, AEO, final build result | GPCA only, by re-running against the current workspace (§PPC-600). A stale report is replaced, never edited in place. | Production Pipeline Constitution Adoption Phase 1 validator | GPCA_VERIFIED |
| PPC-1609 | Preview Proof | Live Preview Gate (interaction proof against the audited workspace) | Final build result, end user | Live Preview Gate only, and only by re-running against a freshly GPCA-verified workspace. | PPCEA (planned) | PREVIEW_VERIFIED |
| PPC-1610 | Product Identity | CBGA (repairs the Canonical Product Contract identity into the build plan) | Blueprint generator, modular feature generator, materialization engine, GPCA | CBGA, once, during plan repair. Immutable thereafter (PPC-202). | Production Generator Contract Consumption Fix V1 validator | PLAN_APPROVED |
| PPC-1611 | Sample Data | Modular feature generator, only when explicitly tagged DEMO_DATA provenance | GPCA (classification only, never as business-content evidence) | Modular feature generator, at write time only. | PPCEA (planned) | WORKSPACE_MATERIALIZED |
| PPC-1612 | Manifest | Materialization engine (write-once per build, from the approved plan) | GPCA, downstream tooling | Materialization engine, once, at initial write. Never rewritten independently by a later stage. | PPCEA (planned) | WORKSPACE_MATERIALIZED |
| PPC-1613 | Feature Contract | Universal Feature Contract Intelligence (UFCI), itself bound to the CBGA-repaired plan — never an independently-derived second contract | Modular feature generator | UFCI, once per build, derived only from the CBGA-repaired plan. | Production Contract Consumption Trace V1 (trace-only) | PLAN_APPROVED |
| PPC-1614 | Diagnostics | The authority that detected the condition (GPCA for compliance diagnostics, AEO for engineering diagnostics) | AEO, AEE, final build result, operator-facing reporting | The originating authority only, on its own next run. | PPCEA (planned) | GPCA_VERIFIED |
| PPC-1615 | Repair Plan | AEO (dispatches to the specific registered repair capability for the diagnosed failure class) | The dispatched repair capability, GPCA (must re-audit after execution) | AEO, per repair cycle; the executing capability may only act within the scope AEO dispatched. | PPCEA (planned) | WORKSPACE_MATERIALIZED |
| PPC-1616 | Capability Request | EIAA / Missing-capability repair (§PPC-506) — raised only after GPCA/AEO prove the generator genuinely lacks the capability | Capability Evolution Runtime, GPCA (must re-audit after fulfillment), final build result (PPC-1106) | EIAA, once per diagnosed gap; never fabricated by a stage other than the one that proved the gap. | PPCEA (planned) | GPCA_VERIFIED |

**Consequence:** if a concept in this table is authored anywhere other than its Constitutional Owner — even by a stage whose independently-computed value happens to agree today — that is an Ownership Violation (Violation Taxonomy VT-01, §PPC-2100).

---

## §PPC-1700 — Canonical Pipeline Data Contract (Amendment Set 2)

Every immutable object that flows through the production pipeline, in producer order. Future implementations must **consume** these objects instead of independently reconstructing equivalent information (Invariant PPC-1207, No Parallel Truth). *(Severity: BLOCKING. Auto-fix: NO.)*

```
Raw Prompt
  → Canonical Product Contract
  → CBGA Generation Report
  → Approved Generation Plan
  → Blueprint Product Surface
  → Materialized Workspace
  → GPCA Compliance Report
  → Preview Proof
  → Engineering Report
```

| ID | Object | Owner | Producer | Immutable Fields | Provenance |
|---|---|---|---|---|---|
| PPC-1701 | Raw Prompt | Intent Understanding (read-only boundary) | The requesting user/API caller | The literal prompt text, for the lifetime of this build request | Origin of the entire build; every downstream object must be traceable back to this exact string (§PPC-800). |
| PPC-1702 | Canonical Product Contract | Product Faithfulness | `buildCanonicalProductContract` | `productIdentity`, `productPurpose`, `productConcepts` | Derived solely from Raw Prompt (+ optional architecture/PIM context); immutable the moment returned (PPC-201). |
| PPC-1703 | CBGA Generation Report | CBGA | `applyContractBoundGenerationToBuildPlan` | `navigationPlan`, `modulePlan`, `routePlan`, repaired identity | Derived solely from the Canonical Product Contract; immutable the moment returned (PPC-202). |
| PPC-1704 | Approved Generation Plan | CBGA (patched build plan) | Same call as PPC-1703 — the plan is the build-plan-shaped projection of the report | `approvedModuleIds`, `routes`, navigation-plan-derived labels | Same as PPC-1703 — two views of one immutable artifact, never two independently-produced objects. |
| PPC-1705 | Blueprint Product Surface | Blueprint contract-copy derivation | `deriveBlueprintContractCopy` | `headline`, `tagline`, core nav labels, welcome/home copy | Derived solely from the Approved Generation Plan; immutable the moment computed for this build (PPC-206). |
| PPC-1706 | Materialized Workspace | Materialization engine (initial write); registered repair systems (post-write) | `materializeGeneratedApplication` / `buildUniversalMaterializedWorkspaceFiles` | Provenance map, as of the moment each file is written | Derived solely from the Blueprint Product Surface + Approved Generation Plan; mutation after first write must be attributable to a named repair capability (§PPC-500). |
| PPC-1707 | GPCA Compliance Report | GPCA | `buildGpcaPostMaterializationReport` | The report object itself, for the exact workspace state it audited | Perishable — invalidated by any subsequent workspace mutation (PPC-1203). |
| PPC-1708 | Preview Proof | Live Preview Gate | Live Preview Gate unlock + interaction proof | The proof object itself, for the exact GPCA report + workspace path it was produced against | Derived solely from a GPCA Compliance Report fresh relative to the workspace it references (PPC-1001–1002). |
| PPC-1709 | Engineering Report | Build outcome policy / AEE final report | AEE final reporting layer | The final result label (§PPC-1100), once recorded | Derived solely from the Preview Proof (success path) or the earliest blocking report (failure path) — never independently re-assessed from raw pipeline state. |

---

## §PPC-1800 — Generator Interface Standard (Amendment Set 2)

Every generator (existing or future) must document itself in this exact schema. *(Owner: Materialization / Blueprint / Modular Generators. Severity: STRUCTURAL/BLOCKING as noted. Auto-fix: NO. Validator: PPCEA (planned).)*

| Field | Description |
|---|---|
| **Inputs** | The exact set of parameters the generator accepts, named and typed — never an untyped "context bag". |
| **Consumed Contracts** | Which immutable Pipeline Data Contract objects (§PPC-1700) the generator reads from. Every field used for product meaning must trace back to one of these. |
| **Outputs** | The exact artifacts produced (files, in-memory structures) and their shape. |
| **Generated Artifacts** | The concrete list of files/records this generator is responsible for producing, so ownership of any single output file is never ambiguous between two generators. |
| **Produced Provenance** | The provenance tags this generator emits recording which approved-plan field it used for each artifact (feeds §PPC-800). |
| **Produced Diagnostics** | What this generator reports when it cannot produce a required artifact from its Consumed Contracts (feeds Missing-capability repair, §PPC-506). |
| **Mutation Scope** | The exact file/directory scope this generator is permitted to write to; writing outside this scope is a violation regardless of correctness. |
| **Validation** | The concrete validator(s) that check this generator's conformance to its own declared interface. |
| **Failure Modes** | The named ways this generator is allowed to fail (e.g. `MISSING_CAPABILITY`) — inventing a fallback in place of a declared failure mode is itself a violation (PPC-304, PPC-401). |

| ID | Rule |
|---|---|
| PPC-1801 | Every generator (existing or future) must declare, in the schema above, its Inputs, Consumed Contracts, Outputs, Generated Artifacts, Produced Provenance, Produced Diagnostics, Mutation Scope, Validation, and Failure Modes. |
| PPC-1802 | **No generator may derive information outside its declared Consumed Contracts.** A generator reading raw prompt text, stale workspace file content, or another generator's output for product meaning violates this rule even where PPC-401/PPC-402/PPC-407 do not separately name the exact input. |

---

## §PPC-1900 — Authority Interface Standard (Amendment Set 2)

Every authority (existing or future) must document itself in this exact schema. *(Owner: PPCEA (planned); each authority is self-documenting until PPCEA exists. Severity: STRUCTURAL. Auto-fix: NO.)*

| Field | Description |
|---|---|
| **Reads** | The exact set of pipeline objects (§PPC-1700) this authority reads. |
| **Writes** | The exact set of pipeline objects this authority is the producer of, if any. |
| **Mutates** | Whether, and under what exact registered scope, this authority is permitted to mutate workspace files (§PPC-500). |
| **Blocks** | The exact conditions under which this authority prevents the pipeline from advancing, and the terminal/blocked state it produces (§PPC-1300). |
| **Repairs** | Whether this authority dispatches or performs repairs, and which repair category (§PPC-500) each repair action belongs to. |
| **Produces Report** | The concrete report object this authority returns, and which §PPC-1700 data-contract row (if any) it corresponds to. |
| **Produces Violations** | Whether this authority emits constitutional-violation records, and by which Violation Taxonomy category (§PPC-2100) they are classified. |
| **Produces Diagnostics** | The diagnostic detail this authority emits to help downstream repair/reporting stages act on its findings. |
| **Produces Capability Requests** | Whether this authority can raise a Capability Request (§PPC-506) when it proves a generator lacks a required capability. |
| **Validator** | The concrete validator script(s) that check this authority's own conformance to this constitution. |
| **Constitution Rules Enforced** | The exact list of PPC-nnn rule IDs this authority is the designated Owner/Validator for. |

| ID | Rule |
|---|---|
| PPC-1901 | Every authority (existing or future) must document itself in the eleven-field schema above. |
| PPC-1902 | A future authority must conform to this interface, and must be entered into the Constitutional Capability Registry (§PPC-2000), before any production stage may dispatch to it. |

---

## §PPC-2000 — Constitutional Capability Registry (Amendment Set 2)

Every production capability must be registered exactly once. This is the canonical registry of production capabilities; a capability absent from it has no constitutional standing to mutate, gate, or repair anything (PPC-1902). *(Severity: STRUCTURAL. Validator: see per-row.)*

| ID | Capability | Owner | Pipeline Stage | AutoFix Eligible | Engineering-Intelligence Eligible | Current Status |
|---|---|---|---|---|---|---|
| PPC-2001 | GPCA | GPCA | GPCA_VERIFIED | NO | No | IMPLEMENTED |
| PPC-2002 | CBGA | CBGA | PLAN_APPROVED | PARTIAL | No | IMPLEMENTED |
| PPC-2003 | AEO | AEO | WORKSPACE_MATERIALIZED (repair loop) | PARTIAL | Yes | IMPLEMENTED |
| PPC-2004 | EIAA | EIAA | GPCA_VERIFIED (missing-capability path) | PARTIAL | Yes | IMPLEMENTED |
| PPC-2005 | Build Reality AutoFix (AEE build-autofix loop) | AEE | WORKSPACE_MATERIALIZED (repair loop) | PARTIAL | No | IMPLEMENTED |
| PPC-2006 | Engineering Intelligence Runtime | Engineering Intelligence Runtime | WORKSPACE_MATERIALIZED (repair loop) | PARTIAL | Yes | IMPLEMENTED |
| PPC-2007 | VERE | VERE | Not currently wired into the enforced pipeline model | NO | No | NOT_WIRED |
| PPC-2008 | Product Faithfulness | Product Faithfulness | CONTRACT_APPROVED | PARTIAL | No | IMPLEMENTED |
| PPC-2009 | Infrastructure vs Product Boundary Authority | Infrastructure vs Product Boundary Authority | GPCA_VERIFIED (classification input) | NO | No | IMPLEMENTED |
| PPC-2010 | Blueprint Generator | Blueprint Generator | WORKSPACE_MATERIALIZED | NO | No | IMPLEMENTED (PARTIAL — Root Cause G trade-off) |
| PPC-2011 | Materialization (Universal App Materialization Engine) | Materialization engine | WORKSPACE_MATERIALIZED | NO | No | IMPLEMENTED |
| PPC-2012 | Preview Gate (Live Preview Gate) | Live Preview Gate | PREVIEW_VERIFIED | NO | No | IMPLEMENTED |

---

## §PPC-2100 — Violation Taxonomy (Amendment Set 2)

Every constitutional violation belongs to **exactly one primary category** (Invariant PPC-1208). Future validators should report a taxonomy ID (e.g. `VT-03`), not free-form prose. *(Severity: STRUCTURAL. Auto-fix: NO.)*

| Taxonomy ID | Rule ID | Category | Description | Example Rule IDs |
|---|---|---|---|---|
| VT-01 | PPC-2101 | Ownership Violation | A concept in the Single Source of Truth Registry (§PPC-1600) or Authority Ownership table (§PPC-100) is authored by more than one stage, or by a stage that is not its registered owner. | PPC-101, PPC-1201 |
| VT-02 | PPC-2102 | Traceability Violation | A generated artifact is missing a link in the ancestry chain (§PPC-800), or its ancestry cannot be proven by emitted provenance or heuristic matching. | PPC-801, PPC-802 |
| VT-03 | PPC-2103 | Generator Violation | A generator derives information outside its declared Consumed Contracts (§PPC-1800), or otherwise violates a Generator Rule (§PPC-400). | PPC-401, PPC-402, PPC-1802 |
| VT-04 | PPC-2104 | Pipeline Violation | A build's progress does not correspond to a legal transition in the Canonical Pipeline State Machine (§PPC-1300). | PPC-1302, PPC-1303 |
| VT-05 | PPC-2105 | Repair Violation | A repair action is not classified into exactly one Repair Category (§PPC-500), or acts outside its category's allowed scope. | PPC-501, PPC-1206 |
| VT-06 | PPC-2106 | Preview Violation | Preview activates while one or more of the five Preview Rules (§PPC-1000) is false. | PPC-1001, PPC-1002, PPC-1205 |
| VT-07 | PPC-2107 | Runtime Violation | A runtime stage serves content from, or executes against, a workspace path other than the one GPCA most recently audited. | PPC-308, PPC-1003 |
| VT-08 | PPC-2108 | Mutation Violation | A workspace file is written by a code path that is not the materialization engine's first write or an explicitly registered repair capability. | PPC-115, PPC-304, PPC-408 |
| VT-09 | PPC-2109 | Governance Violation | An amendment renumbers or reuses an existing rule ID, skips Review, or is not recorded in the Amendment Log (§PPC-1500). | PPC-1501, PPC-1505, PPC-1507 |
| VT-10 | PPC-2110 | Capability Violation | A capability not present in the Constitutional Capability Registry (§PPC-2000) mutates, gates, or repairs production state. | PPC-1902 |
| VT-11 | PPC-2111 | State Machine Violation | A build reaches `PREVIEW_VERIFIED` or `COMPLETED` via a transition listed in PIPELINE_ILLEGAL_TRANSITIONS (§PPC-1303). | PPC-1303, PPC-1304 |

---

## §PPC-2200 — Constitutional Dependency Graph (Amendment Set 2)

Makes illegal execution order obvious: e.g. **GPCA depends on Materialization depends on CBGA depends on the Canonical Product Contract.** An authority run before its dependencies are satisfied is, by definition, operating on incomplete evidence. *(Severity: STRUCTURAL. Auto-fix: NO. Validator: PPCEA (planned).)*

| ID | Authority | Depends On | Required Before | Forbidden Dependencies |
|---|---|---|---|---|
| PPC-2201 | Product Faithfulness | Raw Prompt | CBGA | Materialized Workspace (must never read prior workspace content for identity) |
| PPC-2202 | CBGA | Canonical Product Contract | Materialization / Blueprint / Modular Generators | Raw Prompt directly (must go through the Canonical Product Contract) |
| PPC-2203 | Materialization / Blueprint Generator | CBGA Generation Report, Approved Generation Plan, Blueprint Product Surface | GPCA | Raw Prompt as a product-meaning source; existing workspace file content as evidence |
| PPC-2204 | GPCA | Materialized Workspace, Canonical Product Contract, CBGA Generation Report | Live Preview Gate | A cached/stale GPCA report treated as current |
| PPC-2205 | Live Preview Gate | GPCA Compliance Report (fresh) | Final build result (`BUILT_SUCCESSFULLY` path) | A GPCA report older than the last workspace mutation |
| PPC-2206 | Repair Systems (AEO-dispatched) | GPCA Compliance Report, AEO dispatch | GPCA re-audit (if the repair mutated files) | The right to relabel a GPCA verdict without GPCA re-running |
| PPC-2207 | AEO | GPCA Compliance Report, AEE | The specific repair capability it dispatches to | Dispatching to a capability absent from the Constitutional Capability Registry (§PPC-2000) |
| PPC-2208 | EIAA | GPCA Compliance Report, AEO diagnosis of a genuine capability gap | Engineering Intelligence Runtime / Capability Evolution Runtime | Raising a Capability Request without a prior GPCA/AEO-proved gap |

---

## §PPC-2300 — Constitution Versioning (Amendment Set 2)

Rule IDs are never reused (PPC-1505); this section versions the **document itself**, independent of individual rule IDs, so whole amendment sets remain traceable across releases. *(Severity: STRUCTURAL/BLOCKING as noted.)*

**Versioning policy:**

- **Major version** increments only for a restructuring that changes the meaning of existing rule IDs' groupings (e.g. Amendment Set 1's three-part split).
- **Minor version** increments for a ratified amendment set that adds rules without restructuring (e.g. this Amendment Set 2).
- **Patch version** increments for a wording clarification that changes no rule's substantive meaning.
- Rule IDs are never renumbered or reused (PPC-1505) regardless of which version field changes (PPC-2302).
- Exactly one version has Historical Status `CURRENT` at any time (PPC-2303); every prior version is `SUPERSEDED`, never deleted.

| Version | Ratification Date | Superseded By | Historical Status | Summary |
|---|---|---|---|---|
| V1.0 | 2026-07-09 | V1.1 | SUPERSEDED | Initial ratification (Amendment Log: "V1 Ratification"). |
| V1.1 | 2026-07-09 | V1.2 | SUPERSEDED | Amendment Set 1 (Amendment Log: "Amendment Set 1"). |
| **V1.2** | 2026-07-09 | — | **CURRENT** | Amendment Set 2 (Amendment Log: "Amendment Set 2") — this version. |

| ID | Rule |
|---|---|
| PPC-2301 | Every constitution version carries a Major.Minor.Patch triple, a Ratification Date, a Superseded-By pointer (or none if current), and a Historical Status of `CURRENT`, `SUPERSEDED`, or `DRAFT`. |
| PPC-2302 | Version-increment semantics are as described in the versioning policy above; rule IDs themselves are never renumbered or reused regardless of which version field changes. |
| PPC-2303 | **Exactly one constitution version has Historical Status `CURRENT` at any time**; every prior version's Historical Status is `SUPERSEDED` and its Superseded-By field names the version that replaced it. No version is ever deleted from the version history. |

---

## §PPC-2400 — Constitutional Test Matrix (Amendment Set 2)

Deliberately **derived mechanically** from the Rule Registry (never a second, independently-maintained list) so the matrix can never drift out of sync with the rules it describes — No Parallel Truth (PPC-1207) applied to the matrix's own construction. Provides `Rule → Implementation → Validator → Coverage` traceability for **every** rule in the document, not merely a hand-picked sample. *(Owner: this constitution's maintainers. Severity: STRUCTURAL.)*

| Rule ID | Validator | Coverage | Implementation Status |
|---|---|---|---|
| PPC-303 (example) | Contract-Bound Generation Authority v4 validator chain | COMPLETE | IMPLEMENTED |
| PPC-403 (example) | Contract-Bound Navigation Shell Fix V1 validator (partial coverage) | PARTIAL | PARTIAL |
| PPC-606 (example) | Production Pipeline Constitution Adoption Phase 1 validator | COMPLETE | IMPLEMENTED |
| PPC-702 (example) | Production Pipeline Constitution Adoption Phase 1 validator | COMPLETE | IMPLEMENTED |
| PPC-901 (example) | Infrastructure vs Product Boundary Authority V1 (existing) | COMPLETE | IMPLEMENTED |
| PPC-1101…PPC-1107 (example) | PPCEA (planned) | NONE | NOT_IMPLEMENTED |

*(The full matrix — one row per rule ID currently in `RULE_REGISTRY`, 167 rows as of Amendment Set 2 — is generated by `buildConstitutionalTestMatrix(RULE_REGISTRY)` in `src/production-pipeline-constitution-v1/production-pipeline-constitution.ts`, exported as `CONSTITUTIONAL_TEST_MATRIX`. The table above shows a representative sample; the module is the source of truth, not this markdown excerpt, consistent with PPC-2401 and the No Parallel Truth principle.)*

| ID | Rule |
|---|---|
| PPC-2401 | Every constitutional rule ID in the Rule Registry must have a corresponding row in the Constitutional Test Matrix, mapping Rule ID → Validator → Coverage Status → Implementation Status → Owner → Pipeline Stage. The matrix is generated mechanically, never hand-maintained as a second list. |

---

# PART 2 — Production Generation Architecture Audit

**Everything in this Part is historical evidence explaining *why* Part 1's rules exist. It is informative only — it is not itself constitutional law; only Part 1 is binding.**

Each of the eight systemic root causes identified by *Production Generation Architecture Audit V1* is mapped below to the constitutional rule that prevents it, the production stages it affects, what implementing that rule actually requires, and which future milestone should enforce it.

### A. Contract inputs are optional everywhere

- **Constitutional rule:** PPC-304 (Stage Permissions — Materialization/Blueprint/Modular Generators: "Fallback allowed? No"); PPC-401.
- **Production stages affected:** `materializeGeneratedApplication`, `buildUniversalMaterializedWorkspaceFiles`, `buildUniversalFeatureContract`, `resolvePromptBoundedModulePlan`.
- **Implementation implication:** every contract-shaped parameter that is currently `?`-optional with a `?? resolvePromptFaithfulBuildPlan(...)`-style fallback must either become required, or the fallback path must itself be classified and logged as a constitutional violation (PPC-1107) rather than silently succeeding.
- **Suggested milestone:** *Contract Parameter Enforcement V1* — not scheduled by this document; see Roadmap Tier 3/4.

### B. Multiple independent identity computations

- **Constitutional rule:** PPC-101 (Authority Ownership — Product identity: CBGA is the sole owner); PPC-402.
- **Production stages affected:** `extractAppName`, `extractPromptAppTitle`, `buildCanonicalProductContract`'s `productIdentity`, CBGA's identity repair, `buildFeatureAppRouterTsx`'s headline-split, UFCI's `productName`.
- **Implementation implication:** collapse the ~6 independent identity-deriving functions into calls to a single resolved value (the CBGA-repaired identity), threaded the same way `approvedNavigationLabels` was threaded in the Contract-Bound Navigation Shell Fix.
- **Suggested milestone:** *Identity Computation Collapse V1* — see Roadmap Tier 3.

### C. GPCA audits a snapshot, not an invariant

- **Constitutional rule:** PPC-601 through PPC-607 (all seven Re-Audit triggers); PPC-1001–PPC-1002.
- **Production stages affected:** workspace stabilizer, AEE build-autofix loop, Engineering Intelligence Runtime, AEL capability-evolution runtime, the orchestrator's final pre-preview gate.
- **Implementation implication:** every file-mutating stage after the first GPCA audit must call `buildGpcaPostMaterializationReport` again before control returns to the orchestrator's preview-activation path; the "final hard gate" must consult a report guaranteed fresh, not a variable captured hundreds of lines earlier.
- **Suggested milestone:** *GPCA Invariant Enforcement V1* — see Roadmap Tier 1.

### D. Traceability is plan lookup and word overlap, not provenance

- **Constitutional rule:** PPC-802 (emitted provenance as primary), PPC-803 (heuristic matching as secondary only).
- **Production stages affected:** `contract-traceability.ts` (`navigationTraceability`, `surfaceTraceability`), `rendered-content-fingerprints.ts` (`referencesContractVocabulary`).
- **Implementation implication:** GPCA must be extended to read the provenance tags generators already emit (e.g. `BLUEPRINT_PRODUCT_SURFACE_PROVENANCE`) as the primary traceability signal, keeping plan-lookup/word-overlap as a fallback for artifact classes that don't yet emit provenance.
- **Suggested milestone:** *Provenance-Backed Traceability V1* — see Roadmap Tier 5.

### E. Regex-shape-specific extraction bugs

- **Constitutional rule:** PPC-801/PPC-802 (provenance over heuristic re-derivation); implicitly, §PPC-900 requires classification not to silently miss content due to syntax shape.
- **Production stages affected:** `extractQuotedFieldValues`, `extractNavigationLabels`, `extractAllVisibleTextNodes`, and every other regex-based extractor in `rendered-content-fingerprints.ts`.
- **Implementation implication:** replace field-shape-specific regexes with either a single shared literal-value extractor tolerant of quoting/key style, or minimal structural (AST-based) extraction for the fixed set of files GPCA reads.
- **Suggested milestone:** *Structural Extraction Replacement V1* — see Roadmap Tier 4.

### F. Repairs patch evidence, not reality

- **Constitutional rule:** PPC-501 (Evidence-only repair category); PPC-1105 and the constitutional rule forbidding mislabeling (§PPC-1100).
- **Production stages affected:** Product Faithfulness V2's `repairAndReaudit`, build-result-normalizer relabeling, AEE preview-gate synthesis, AEE failure-reason/profile-mismatch suppression.
- **Implementation implication:** audit every "repair" code path's *reporting* language; ensure none of them use "repaired"/"fixed"/"resolved" wording when no file changed.
- **Suggested milestone:** *Evidence-Only Repair Labeling Clarity V1* — see Roadmap Tier 6.

### G. Infrastructure/product boundary tension

- **Constitutional rule:** PPC-901 (Infrastructure vs product), PPC-907 (Shell structure vs visible product copy).
- **Production stages affected:** Welcome/Onboarding/Auth/Profile/Settings/Help/Feedback/Legal blueprint pages; the ~15 downstream authorities that require these files to exist.
- **Implementation implication:** this is a known, accepted, previously-scoped trade-off (Blueprint Generator Contract-Bound Replacement V1's explicit PARTIAL status). The constitution does not mandate removing these files; it mandates that per-string classification (PPC-907) eventually be applied so contract-derivable strings within these files stop being counted as "generic residue" once they are made contract-derived, without requiring the files themselves to disappear.
- **Suggested milestone:** No new milestone mandated by this document; remains an accepted, documented trade-off unless a future milestone chooses to coordinate the ~15-consumer file-removal project referenced in the existing Capability Matrix.

### H. Continuation-path GPCA audits incomplete file list

- **Constitutional rule:** PPC-702 (file list must include all generated product and blueprint artifacts).
- **Production stages affected:** `listExistingWorkspaceGeneratedFilePaths` in `one-prompt-build-orchestrator.ts`.
- **Implementation implication:** the enumerator must be extended to include `src/blueprint/**` (and any other top-level generated directory) so continuation-path GPCA audits actually see `AppShell.tsx`/`product-surface.ts` content, closing the gap that could silently bypass the Contract-Bound Navigation Shell Fix V1 on continuation builds.
- **Suggested milestone:** *Continuation File-List Completeness Fix V1* — see Roadmap Tier 0 (highest priority — smallest, most isolated, closes a gap in the most recently-shipped milestone).

---

# PART 3 — Implementation Roadmap

**This Part is informative only. It must never be interpreted as constitutional law.** A tier's position in this roadmap, or its absence from it, never excuses a Part 1 violation — every rule in Part 1 is binding today, independent of implementation sequencing. This roadmap exists solely to help future milestones sequence *how* production code is brought into conformance with Part 1, in an order that avoids one fix masking or undoing another.

This roadmap sequences enforcement of this constitution. Tiers are ordered by dependency: each tier either closes a hole that would otherwise silently undo a later tier's guarantee, or reduces the noise that would otherwise make a later tier's fix look unnecessary or its validation inconclusive.

### Tier 0 — Close the continuation file-list gap

- **Objective:** Make continuation-path GPCA audits see every generated product and blueprint artifact, not just feature modules and `App.tsx`.
- **Affected files/systems:** `listExistingWorkspaceGeneratedFilePaths` (`one-prompt-build-orchestrator.ts`).
- **Why it must come before later tiers:** every other tier assumes GPCA's audit is looking at complete evidence. If the file list is incomplete, no amount of improving *how* GPCA reasons about evidence (Tiers 4-5) or *when* it re-runs (Tier 1) will matter for the files it never reads in the first place.
- **Expected downstream blockers eliminated:** silent continuation-path bypass of any nav/shell-content compliance rule, including the just-shipped Contract-Bound Navigation Shell Fix V1.
- **Validation strategy:** a dedicated validator proving the enumerator's output set includes every path the fresh-materialization path's `engineResult.generatedFiles` would include for an equivalent build, for at least the blueprint directory.
- **Enforces rule(s):** PPC-702, PPC-606.

### Tier 1 — Make GPCA a final invariant after every post-audit mutation

- **Objective:** Re-run GPCA's post-materialization audit after every stage proven capable of mutating the workspace after the first audit (stabilizer, build-autofix, Engineering Intelligence, AEL), and make the final pre-preview gate consult a guaranteed-fresh report.
- **Affected files/systems:** `one-prompt-build-orchestrator.ts` (the sequence from workspace stabilization through preview activation), `workspace-materialization-stabilizer-v1`, `aee-build-autofix-loop.ts`, `engineering-intelligence-runtime`, `autonomous-engineering-loop`.
- **Why it must come before later tiers:** this closes the specific mechanism by which a compliant build can still serve non-compliant content — the exact reason previously-fixed root causes keep appearing to "come back." Fixing generator content (Tiers 2-5) is pointless if a later stage can silently undo the fix before preview.
- **Expected downstream blockers eliminated:** the entire class of "GPCA said ALLOWED but the browser shows something else" bugs.
- **Validation strategy:** a validator that simulates a post-audit mutation and proves the orchestrator either re-audits before preview or blocks preview, for each of the four mutating stages.
- **Enforces rule(s):** PPC-602–PPC-605, PPC-607, PPC-1002, PPC-1304.

### Tier 2 — Remove self-inflicted placeholder/template text blocks

- **Objective:** Remove the literal word "placeholder" (and equivalent always-generic wording GPCA's own rendered-content fingerprints already match) from Settings/Legal/Profile/Help Center shell pages.
- **Affected files/systems:** `universal-app-blueprint-generator.ts` (the relevant `build*Page` functions).
- **Why it must come before later tiers:** it is small, isolated, and un-blocks real builds failing today for a reason unrelated to product faithfulness — clearing this noise makes it possible to tell, once Tiers 3-5 land, whether a build failure is architectural or just this leftover wording.
- **Expected downstream blockers eliminated:** GPCA's own `RENDERED_CONTENT_BLOCKED_PLACEHOLDER_APPLICATION`-class self-block on builds that are otherwise compliant.
- **Validation strategy:** re-run the existing GPCA Rendered Content Evidence validator's fingerprint checks against the modified page output; confirm zero placeholder-fingerprint matches remain.
- **Enforces rule(s):** PPC-901, PPC-907.

### Tier 3 — Collapse parallel identity computations

- **Objective:** Make every site that currently re-derives app name/product identity/domain from the raw prompt instead consume the single CBGA-repaired identity.
- **Affected files/systems:** `prompt-feature-extractor.ts` (`extractAppName`), `prompt-app-metadata.ts` (`extractPromptAppTitle`), `modular-feature-module-generator.ts` (`buildFeatureAppRouterTsx`'s headline-split), `universal-feature-contract-builder.ts` (`productName`).
- **Why it must come before later tiers:** this is the direct fix for the exact bug class ("Calculator / Arithmetic Utility," "reusable components where," assistive-shell-when-not-assistive) that has consumed the last four milestones one instance at a time. Doing this before Tier 4/5 means those tiers are extending/hardening a genuinely single-source system, not five independently-extraction-buggy ones.
- **Expected downstream blockers eliminated:** the entire recurring "wrong product identity/domain in one specific generator" bug class — not just today's known instance, but every future one shaped like it.
- **Validation strategy:** a validator asserting that all identity-consuming call sites resolve to the same value for a representative set of synthetic prompts, and that none of them independently re-run prompt-parsing for identity when the CBGA-repaired value is available.
- **Enforces rule(s):** PPC-101, PPC-402, PPC-401.

### Tier 4 — Replace regex extraction with structural extraction

- **Objective:** Replace GPCA's field-shape-specific regexes (`label:` vs `"label":`, `heading:`, `pageTitle:`, multiline visible text) with a single shared, shape-tolerant extraction approach.
- **Affected files/systems:** `rendered-content-fingerprints.ts` (all `extract*` functions), `rendered-content-collector.ts`.
- **Why it must come before later tiers:** Tier 5's provenance-based traceability still needs *some* extraction layer for artifact classes that don't yet emit provenance tags; fixing extraction's shape-sensitivity now means Tier 5 is built on a reliable secondary signal, not one with known, recurring blind spots.
- **Expected downstream blockers eliminated:** the "same bug, different field" recurrence pattern (the exact class of issue found and fixed once for navigation `label:` in Contract-Bound Navigation Shell Fix V1, and found again for 5+ other fields in this audit).
- **Validation strategy:** a validator exercising every extractor against both quoting/key-style variants (unquoted TS, JSON-quoted, single/double/backtick) for every field currently extracted, proving all variants are captured.
- **Enforces rule(s):** PPC-803, §PPC-900.

### Tier 5 — Move traceability from heuristic matching to emitted provenance

- **Objective:** Make GPCA consume generators' emitted provenance tags as the primary traceability signal, with plan-lookup/word-overlap retained only as defense-in-depth for artifact classes without provenance.
- **Affected files/systems:** `contract-traceability.ts`, the blueprint/modular generators' provenance-emission code.
- **Why it must come before Tier 6, and after Tiers 0-4:** this is the architecturally "correct" fix but has the largest blast radius (touches GPCA's own traceability/scoring code). Sequencing it last among the substantive tiers ensures Tiers 0-4 have already removed most of the false-positive/negative pressure that currently makes it hard to tell whether this tier's redesign is solving the residual problem or re-introducing a new one.
- **Expected downstream blockers eliminated:** false-pass traceability (substring collisions, single-word overlap, empty-set-scores-100%) and false-fail traceability (exact-string matching breaking on label normalization, JSX-wrapped content invisible to static regex).
- **Validation strategy:** a validator comparing traceability outcomes under the new provenance-based mechanism against the old heuristic mechanism across the audit's documented false-pass/false-fail scenarios, proving the new mechanism resolves them without weakening any currently-correct block.
- **Enforces rule(s):** PPC-802, PPC-803.

### Tier 6 — Clarify evidence-only repair wording

- **Objective:** Ensure no reporting layer (API result, chat response, dashboard, build-result normalizer) describes an evidence-only repair using language that implies real file regeneration occurred.
- **Affected files/systems:** `generation-faithfulness-repair.ts`, `build-result-normalizer.ts`, `aee-preview-contract.ts`, `aee-production-response.ts`.
- **Why it comes last:** this is a trust/observability cleanup, not a compliance-bypass risk (GPCA itself is never fooled by evidence-only repairs, per the audit). It has no dependency relationship with the other tiers and does not block or get blocked by any of them; it is sequenced last purely because it is lowest-severity, not because it depends on anything above.
- **Expected downstream blockers eliminated:** operator/user-facing false confidence that a build was "repaired" when nothing on disk changed.
- **Validation strategy:** a validator asserting that every code path reachable when `applied: false` (or equivalent evidence-only-repair marker) is set never emits "repaired"/"fixed"/"resolved" wording in its corresponding PPC-1105 label.
- **Enforces rule(s):** PPC-501, PPC-1105.

### Beyond Tier 6 — PPCEA implementation

Implementing the Production Pipeline Constitution Enforcement Authority (§PPC-1400) itself is intentionally **not** numbered as one of Tiers 0-6: PPCEA's job is to check conformance to the *other* rules, so implementing it before Tiers 0-5 land would give it very little to validate correctly and a great deal to validate against known-non-conformant behavior. The suggested sequencing is: implement PPCEA only after Tier 5 (Provenance-Backed Traceability) lands, since PPCEA's most valuable checks (traceability-by-provenance, per-stage read/write/mutate boundary enforcement) depend on that data actually being emitted.

---

## Relationship to Existing Authorities

This constitution does not replace, weaken, or duplicate GPCA, CBGA, Product Faithfulness, AEO, EIAA, or VERE. It is a **rulebook that those authorities' future milestones must implement against** — it does not itself audit, gate, repair, or generate anything. The optional support module and validators created alongside this document verify that this document itself is complete and internally consistent; they do not verify production behavior, and they do not run any existing authority's validator chain.

Amendment Set 2 (§PPC-1600–§PPC-2400) is the same kind of artifact: the Single Source of Truth Registry, Canonical Pipeline Data Contract, Generator/Authority Interface Standards, Constitutional Capability Registry, Violation Taxonomy, Dependency Graph, Versioning, and Constitutional Test Matrix are all **standards future milestones must implement against**, not new production authorities. Nothing in Amendment Set 2 reads from, writes to, imports from, or is imported by GPCA, CBGA, Product Faithfulness, AEO, EIAA, VERE, the Blueprint Generator, the Materialization engine, the Build Orchestrator, the runtime, preview, or any repair system.
