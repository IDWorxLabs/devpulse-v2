# DevPulse V2 — System Laws

**Authority:** GF7 OMEGA Constitution V1  
**Status:** ENFORCED — All V2 systems must comply before merge  
**Supersedes:** All V1 implicit conventions, connect-module patterns, and validator-only contracts

---

## Purpose

These are the foundational system laws governing every DevPulse V2 subsystem. They define what DevPulse is, what it is not, and the non-negotiable boundaries between user-facing systems and background systems.

---

## LAW S-1 — Chat Is Primary Interface

DevPulse V2 is a **chat-first control system**. Every other surface (Operator Feed, diagnostics, status indicators) exists to support chat — not replace it.

| Requirement | Enforcement |
|-------------|-------------|
| Chat input is always the first interactive element after shell paint | Browser timing gate |
| No modal, panel, audit, or diagnostic may capture focus before chat | Focus audit in browser verification |
| Navigation to secondary surfaces must not unload or disable chat | Integration test |

**V1 violation:** UVL workspace, readiness inspectors, and boot gates competed with chat for main-thread time and focus.

---

## LAW S-2 — Answer Authority Singularity

Exactly **one module** owns the final answer for any user message. No post-processing layer may overwrite a verified answer.

| Rule | Detail |
|------|--------|
| One question → one authority chain | Documented in Ownership Registry |
| No post-route interceptors | CCIR-style recovery layers are **prohibited** in V2 |
| Early-return shortcuts must declare authority | Vault-style matchers must register as answer owners |
| Validator path must equal browser path | Same entry point, same module load order |

**V1 violation:** `routeIncomingMessageV1` allowed Project Vault, V2 Intelligence, and CCIR to compete; CCIR overwrote V2 answers; validators called V2 directly and reported false green.

---

## LAW S-3 — Browser Reality Is Supreme Law

Browser-verified behavior outranks all internal validators, headless simulations, and Node VM traces.

| Hierarchy | Rank |
|-----------|------|
| Browser timing + clickability + answer latency | 1 (supreme) |
| Browser functional verification | 2 |
| Headless / VM validators | 3 (advisory only) |

A validator PASS with browser FAIL is a **system failure**, not a test quirk.

**V1 violation:** Validators loaded V2 synchronously while browser loaded it lazily; CCIR stack present in browser but absent in validators.

---

## LAW S-4 — Diagnostics Are Subordinate

Diagnostics, audits, intelligence scans, UVL checks, and readiness gates are **background citizens**. They may inform; they may never govern startup, chat, or answer delivery.

| Prohibited | Required |
|------------|----------|
| Diagnostic blocks startup | Diagnostics run after Phase 1 shell is interactive |
| Audit delays visible answer | Audits attach after answer render |
| Readiness gate blocks chat submit | Chat works at 0% readiness |
| Intelligence scan on critical path | Scans scheduled via Task Governor |

**V1 violation:** UVL readiness gates blocked interaction at ~77–92%; timing inspector and preflight scans ran synchronously on route open.

---

## LAW S-5 — Operator Feed Is Inline and Visible

The Operator Feed is not a hidden task queue, not a grouped approval state, and not a console-only stream.

| Requirement | Detail |
|-------------|--------|
| Inline with chat turn | Visible in the same conversation surface |
| Real work only | No connector-sweep phantom approvals |
| Direct answer turns still show feed | `isDirectAnswerTurn` must not hide substantive operator events |
| Failure visibility | Feed shows diagnostic failures the user can act on |

**V1 violation:** Operator Feed connector sweep published global approval events grouped as `waiting_approval`; direct answers hid feed work.

---

## LAW S-6 — Task Governor Owns All Background Work

No subsystem may schedule main-thread or background work without Task Governor registration.

| Registration includes | Governor decides |
|----------------------|----------------|
| Owner module ID | Priority tier |
| Estimated cost (ms) | Queue placement |
| Blocking vs non-blocking | Preemption under pressure |
| Startup phase eligibility | Deferral or cancellation |

**V1 violation:** Deferred loader, coverage recovery, preflight scan, and timing inspector all started in overlapping idle slices without central coordination.

---

## LAW S-7 — One Source of Truth Per Domain

Each domain has exactly one authoritative store and one write owner.

| Domain | Single owner required |
|--------|----------------------|
| Chat answers | Answer Authority Registry |
| Operator events | Operator Feed writer |
| Session diagnostics | Diagnostic history (one implementation) |
| Readiness state | Startup readiness signal (one derive path) |
| Project context | Deferred to Phase 2+ — not Phase 1 |

**V1 violation:** Duplicate `saveDiagnosticToHistory`, duplicate backend heartbeat paths, multiple readiness derive owners.

---

## LAW S-8 — Explicit Phase Gates

Features outside the current phase are **architecturally prohibited**, not merely deprioritized.

Phase 1 allowed systems only:
- Shell
- Chat
- Inline Operator Feed
- Task Governor

All other systems (UVL, Project Vault, Replay, Self Vision, Founder Notifications, Console Intelligence, Reality Replay, Mobile Command, World 2 Builder) are **constitutionally blocked** until Phase 1 stability is proven.

See `DEVPULSE_V2_REBUILD_BLUEPRINT.md` for phase definitions.

---

## LAW S-9 — No Silent Path Forks

Every code path that can produce a user-visible outcome must be:
1. Named in the Ownership Registry
2. Reachable from the same browser entry point as validators
3. Covered by browser verification tests

**Prohibited patterns:**
- Validator-only entry points
- Browser-only post-interceptors
- Lazy-load paths that change answer authority
- Sync vs async load splits between test and production

**V1 violation:** `routeDevPulseMainChatIntelligenceCoreV2V1` direct in validators vs `submitDevPulseChatGoalV1` + CCIR in browser.

---

## LAW S-10 — Failure Must Be Visible and Honest

DevPulse must never show routing narration, placeholder intelligence, or template leaks as final answers.

| Prohibited output | Required instead |
|-------------------|------------------|
| "I will route through recovered intelligence…" | Honest clarify or grounded answer |
| Validator PASS masking browser failure | Browser FAIL blocks release |
| Silent fallback to stale path | Explicit "system unavailable" with feed entry |

**V1 violation:** CCIR unknown-intent fallback injected routing-only strings as `directAnswer`.

---

## Compliance

Any PR touching DevPulse V2 must cite which System Laws it satisfies or introduces risk to. Violations require explicit constitutional amendment — see `DEVPULSE_V2_WORLD2_LAWS.md` for amendment rules.

**Related documents:**
- `DEVPULSE_V2_CONSTITUTION.md` — Master authority document
- `DEVPULSE_V2_STARTUP_LAWS.md` — Startup phase enforcement
- `DEVPULSE_V2_PERFORMANCE_LAWS.md` — Budget and pressure laws
- `DEVPULSE_V2_OWNERSHIP_LAWS.md` — Registry and authority rules
- `DEVPULSE_V2_GROWTH_PROTECTION_LAWS.md` — Anti-monolith rules
- `DEVPULSE_V2_WORLD2_LAWS.md` — Isolated builder zone rules
- `DEVPULSE_V2_REBUILD_BLUEPRINT.md` — Phase plan and build order
