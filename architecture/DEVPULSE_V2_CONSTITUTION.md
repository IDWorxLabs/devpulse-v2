# DevPulse V2 Constitution

**GF7 OMEGA — Architectural Law Authority V1**  
**Effective:** 2026-06-08  
**Status:** FOUNDING DOCUMENT — All DevPulse V2 work is subordinate to this constitution

---

## Preamble

DevPulse V1 accumulated capability faster than architecture could bear. The result was a system that passed validators while failing founders: 20+ second clickability delays, 30+ second answer delays, startup freezes, invisible execution, duplicate intelligence paths, and patch-over-patch growth that no audit could unwind.

DevPulse V2 begins with law, not code. No UI, chat system, AI system, operator feed, Project Vault, UVL, World 2, diagnostics, replay, intelligence, memory, console integration, or builder system may be created until this constitution is ratified and its specialized law documents are in force.

**This document is the supreme authority for architectural enforcement.** Specialized law documents provide enforcement detail. The Rebuild Blueprint provides phase sequencing. World 2 Laws govern the isolated builder zone. No automated system may amend this constitution.

### Document Hierarchy (Amendment 2026-06-08)

| Level | Authority | Documents | Governs |
|-------|-----------|-----------|---------|
| 1 — Strategic | Founder vision | `DEVPULSE_V2_FOUNDER_VISION.md`, `DEVPULSE_V2_PRODUCT_NORTH_STAR.md`, `DEVPULSE_V2_FINAL_STATE_ROADMAP.md` | Identity, mission, destination, UX ideals |
| 2 — Architectural | This constitution | `DEVPULSE_V2_CONSTITUTION.md`, `DEVPULSE_V2_*_LAWS.md`, `DEVPULSE_V2_REBUILD_BLUEPRINT.md` | Enforcement, budgets, ownership, phases |
| 3 — Implementation | Code and tests | Source, modules, browser verification | Execution within law |

Strategic documents define **why** and **where**. Architectural documents define **how** and **when**. Implementation executes within both. When strategic intent and architectural phase conflict, phase gates defer capability — they do not redefine mission.

All intelligence systems derive purpose from Level 1 documents. All code derives constraints from Level 2 documents.

---

## SECTION 1 — Lessons From V1

These are confirmed architectural failures from V1 traces, audits, and browser investigations. Each lesson maps to enforceable V2 law.

### 1.1 Startup Freezes

**What happened:** Boot groups loaded 3600+ scripts; deferred groups added 125+ more; coverage recovery and preflight scans ran on the main thread during startup. Chrome displayed "page unresponsive" dialogs.

**Root cause:** No startup budget, no phase gates, no Task Governor. Every subsystem scheduled its own work from route open.

**V2 protection:** `DEVPULSE_V2_STARTUP_LAWS.md` — Laws ST-4, ST-10, ST-11, ST-12; `DEVPULSE_V2_PERFORMANCE_LAWS.md` — Laws P-10, P-8

---

### 1.2 20+ Second Clickability Delays

**What happened:** UVL route opened with synchronous panel render + timing inspector mount. Deferred loader batches and `loadParityScripts` blocked input for 15–30 seconds despite visible shell paint.

**Root cause:** V2 hot-path optimization painted buttons but not main-thread ownership. Visual decoy: UI appeared clickable while long tasks stacked.

**V2 protection:** Laws ST-2, ST-3; P-1, P-6. Shell visible ≠ shell interactive — both are measured separately.

---

### 1.3 30+ Second Answer Delays

**What happened:** Chat intelligence loaded lazily; CCIR post-interceptor ran after V2; Project Vault intercept changed authority mid-session; quality judge skipped on vault-direct path.

**Root cause:** Multiple answer authorities with load-order-dependent precedence; answer path not prioritized over diagnostics.

**V2 protection:** System Laws S-2, S-9; Performance Law P-9; Ownership Laws O-2, O-4

---

### 1.4 Validator Passes While Browser Reality Fails

**What happened:** Validators called `routeDevPulseMainChatIntelligenceCoreV2V1` directly with V2 loaded synchronously. Browser path ran `submitDevPulseChatGoalV1` → CCIR (sync) → V2 (lazy) → recovery overwrite. Same question, different final owner, different answer.

**Root cause:** Validator path fork — different entry point, different module load order, missing post-interceptors in tests.

**V2 protection:** System Laws S-3, S-9; Ownership Laws O-10. Browser reality is supreme; validator mismatch is P0.

---

### 1.5 Monolith Growth

**What happened:** `safe_real_main_route_runtime_v11` grew to 92 scripts. Individual modules exceeded hundreds of lines. Cognition architecture stacked layers in single derive chains.

**Root cause:** No module size limits; connect modules extended manifests instead of extracting.

**V2 protection:** Growth Protection Laws G-1, G-2, G-8

---

### 1.6 Duplicate Systems

**What happened:** CCIR recovery layer parallel to V2 intelligence. Project Vault Reality parallel to answer verification loop. Backend integrity clobbered control center globals. Multiple notification and approval paths.

**Root cause:** Features added as bridges rather than owned modules; no competitor detection.

**V2 protection:** Ownership Laws O-4 through O-8; System Law S-7

---

### 1.7 Duplicate Ownership

**What happened:** Final Answer Authority varied by question type and load state: Project Vault Reality, Verification Loop, CCIR Recovered Intelligence, or V2 clarify fallback — sometimes skipping quality judge entirely.

**Root cause:** No ownership registry; implicit precedence via file load order in `routeIncomingMessageV1`.

**V2 protection:** Ownership Laws O-1, O-2, O-9

---

### 1.8 Audit Overload

**What happened:** UVL preflight scanned 106 dependencies; coverage recovery loaded thousands of scripts; timing inspector rebuilt HTML every poll; readiness gates counted post-run diagnostics as pre-run blockers.

**Root cause:** Audits treated as gates rather than background information.

**V2 protection:** System Laws S-4; Startup Laws ST-7, ST-8; Performance Laws P-2, P-5

---

### 1.9 Console Noise

**What happened:** Duplicate `saveDiagnosticToHistory` implementations; unpatched backend_integrity module restored `console.warn` paths; five fresh warnings after repair because clobbered globals persisted.

**Root cause:** Duplicate implementations loaded via manifest without dedup scan.

**V2 protection:** Ownership Law O-3, O-6; Growth Law G-4 (global clobber detection)

---

### 1.10 Invisible Execution

**What happened:** Operator Feed events grouped into unrelated `taskStatus: waiting_approval` on active turn. Direct answer turns hid feed via `isDirectAnswerTurn`. Users could not see what DevPulse was doing.

**Root cause:** Feed treated as task queue metadata rather than inline conversation element.

**V2 protection:** System Law S-5; Rebuild Blueprint Step 4

---

### 1.11 Operator Feed Not Visible

**What happened:** Connector sweep published global approval events not tied to active question. Feed content existed in state but not in visible inline surface.

**Root cause:** Feed writer and feed renderer owned by different concerns; no visibility requirement.

**V2 protection:** System Law S-5; Ownership Law O-5

---

### 1.12 Too Many Startup Scripts

**What happened:** Connect modules V15–V20 each added 4–7 scripts to production manifest. Interactive boot group contained 3600+ scripts. Script count treated as progress metric.

**Root cause:** No eager manifest cap; connect pattern instead of extraction.

**V2 protection:** Startup Law ST-5, ST-12; Growth Law G-1

---

### 1.13 Excessive Synchronous Work

**What happened:** `deriveDevPulseUvlRunTimingIntelligenceV1` built 10-gate inspector tables synchronously. `getReportPreviewText()` called on every status tick. Full panel innerHTML replace on every poll.

**Root cause:** No main-thread budget per operation; polling without signature-based skip.

**V2 protection:** Performance Laws P-1, P-5, P-6

---

### 1.14 Architecture Drift

**What happened:** Each feature added via connect module to existing runtime group. Load order changed answer authority. Deferred vs boot vs safe_real routes diverged. Readiness gates became overbroad (INTERACTIVE_BOOT_LOADING blocking at 92%).

**Root cause:** No drift detection; no phase boundaries; no registry.

**V2 protection:** Growth Laws G-4, G-9; Ownership Law O-9; Rebuild Blueprint phase gates

---

### 1.15 Patch-Over-Patch Growth

**What happened:** V15–V20 connect reports each extended manifest rather than restructuring. uiYield and batch size patches addressed symptoms. Backend_integrity repaired globals that were immediately clobbered by duplicate module load.

**Root cause:** Pressure to ship features without architectural budget to pay down debt.

**V2 protection:** Growth Law G-8; Complexity Debt Ledger G-10

---

### 1.16 Lack of Hard Architectural Guardrails

**What happened:** "Duplicate prevention" appeared in connect report templates but was not CI-enforced. Validator PASS was treated as ship criteria. No startup budget, no ownership registry, no phase gates.

**Root cause:** Architecture was advisory documentation, not enforced law.

**V2 protection:** This constitution and all specialized law documents with mandatory CI enforcement specified therein.

---

## SECTION 2 — Startup Laws

**Full detail:** `DEVPULSE_V2_STARTUP_LAWS.md`

### Summary of non-negotiable startup rules

| Rule | Requirement |
|------|-------------|
| UI visible before diagnostics | Shell paint ≤ 800 ms |
| UI clickable before diagnostics | First click ≤ 2000 ms |
| Chat usable before diagnostics | Submit works before any audit completes |
| Maximum startup budget | 800 ms total main-thread blocking |
| Mandatory lazy loading | ≤ 6 eager modules |
| Background initialization | Task Governor scheduled, yielding, cancellable |
| No diagnostic blocks startup | UVL, preflight, coverage recovery forbidden on critical path |
| No audit blocks startup | Audits begin Phase 3 only |
| No intelligence scan blocks startup | Scans post-interaction via governor |
| Startup phases | 0: Shell → 1: Chat → 2: Background → 3: Diagnostics |
| Startup budget enforcement | Automatic deferral when exhausted |

---

## SECTION 3 — Chat Laws

Chat laws are embedded in System Laws and Performance Laws. This section consolidates them as constitutional authority.

### CH-1 — Chat Is the Primary DevPulse Interface

All surfaces subordinate to chat. Navigation, diagnostics, and status exist to support conversation.

### CH-2 — Chat Answer Generation Has Priority Over All Diagnostics

Answer tier (`ANSWER`) preempts all other Task Governor queues. No diagnostic, audit, or scan may execute during answer generation.

### CH-3 — Visible Answer Must Appear Before Audits

User sees answer text before any post-answer audit runs. Audits attach to the turn via Operator Feed after render — never before first byte.

### CH-4 — Operator Feed Must Be Visible Inline

Feed renders within the conversation surface. No tab, modal, or expand-required default. Every substantive operator event on an active turn is visible.

### CH-5 — Chat Remains Functional Even If Diagnostics Fail

Diagnostic failure degrades background enrichment only. Chat submit, answer generation, and feed display continue unaffected.

### CH-6 — No Audit May Delay Visible Answers

Audits scheduled at FEED or DIAGNOSTIC tier after answer render. An audit that exceeds 16 ms must yield. Audit failure logged to feed, not blocking.

**V1 violations addressed:** CCIR overwriting V2 answers; vault intercept skipping judge; feed hidden on direct answers; 30 s answer delays from lazy load + recovery chain.

---

## SECTION 4 — Ownership Laws

**Full detail:** `DEVPULSE_V2_OWNERSHIP_LAWS.md`

### Summary

| Rule | Requirement |
|------|-------------|
| One feature = one owner | Registry entry mandatory |
| One answer = one authority | Linear chain, no post-interceptors |
| One source of truth | Single write owner per domain |
| No duplicate intelligence systems | Single chat intelligence path |
| No duplicate operator feeds | Single writer, single inline renderer |
| No duplicate audits | Single diagnostic scheduler (Phase 3+) |
| No duplicate timelines | Phase 1: chat turns only |
| No duplicate reality systems | Phase 1: no vault/UVL truth |
| Ownership registry | `architecture/OWNERSHIP_REGISTRY.json` |
| No shadow paths | Validator entry = browser entry |

---

## SECTION 5 — Performance Laws

**Full detail:** `DEVPULSE_V2_PERFORMANCE_LAWS.md`

### Summary

| Rule | Budget |
|------|--------|
| Main-thread budget (startup) | 800 ms total, 50 ms max long task |
| Main-thread budget (answer) | 200 ms total, 30 ms max long task |
| Background work budget | Tiered queues via Task Governor |
| Queue system | Single Task Governor authority |
| Task governor | Phase 0 mandatory module |
| Render budget | No full innerHTML replace on poll; ≤ 50 nodes/tick |
| Maximum blocking thresholds | Auto-preempt at 200 ms long task; CRITICAL at 5 s sustained |
| Automatic pressure detection | PerformanceObserver + rAF + input delay |
| Automatic pressure prevention | Reject/defer at registration time |

---

## SECTION 6 — Growth Protection Laws

**Full detail:** `DEVPULSE_V2_GROWTH_PROTECTION_LAWS.md`

### Summary

| Rule | Limit |
|------|-------|
| Module size | 400 lines (extract); 600 hard block |
| Extraction requirements | Mandatory at 300 lines or second domain |
| Dependency rules | Acyclic, max depth 4, layer model enforced |
| Architecture drift detection | Automated PR scan |
| Complexity scoring | 31+ blocks merge |
| Ownership tracking | Registry integration |
| Growth warning thresholds | 20 modules warn, 30 block |
| Phase boundary enforcement | No Phase 2+ code in Phase 1 repo |

---

## SECTION 7 — Browser Reality Laws

Browser reality is the supreme verification authority. These laws consolidate and elevate System Law S-3.

### BR-1 — Browser Reality Outranks Validator Reality

A browser FAIL overrides any number of validator PASS results. Release gates require browser green.

### BR-2 — All Major Systems Require Browser Verification

Phase 1 browser tests required for: Shell, Chat, Operator Feed, Task Governor, Answer Authority.

### BR-3 — Startup Timing Verification

Cold and warm load measured in real browser:
- `shellVisibleAt` ≤ 800 ms
- `firstClickReadyAt` ≤ 2000 ms
- `startupCompleteAt` ≤ 5000 ms

### BR-4 — Clickability Verification

Input event test: keydown → handler fires ≤ 100 ms after `firstClickReadyAt` declared. Send button receives click and triggers submit.

### BR-5 — Answer Latency Verification

Warm path: submit → first answer byte visible ≤ 3000 ms. Cold path: ≤ 5000 ms. Measured in browser with Performance API.

### BR-6 — Operator Feed Verification

Given operator event during active turn: feed item visible in DOM within 100 ms. No expand/tab required. Direct answer turns included.

### BR-7 — Validator Alignment

Validators must call the exact registry `entry_point` with the exact production module load order. Mismatch is CI failure.

**V1 violation:** Validators reported Quality Judge score 81 and verification PASS while browser showed vault template prose from a different authority chain.

---

## SECTION 8 — World 2 Laws

**Full detail:** `DEVPULSE_V2_WORLD2_LAWS.md`

### Summary

| Rule | Requirement |
|------|-------------|
| World 2 isolation | Separate namespace, state, manifest, governor |
| Builder safety | Proposal → diff → human approval → dry run → apply |
| Verification | Sandbox browser test before any promotion |
| Rollback | Pre-apply snapshot; auto-revert on failure |
| No autonomous constitutional modification | `architecture/` is CI-protected from automated edits |
| Phase gate | World 2 prohibited until Phase 5 prerequisites met |

---

## SECTION 9 — DevPulse V2 Foundation Plan

**Full detail:** `DEVPULSE_V2_REBUILD_BLUEPRINT.md`

### Phase 1 — Foundation (ONLY)

| System | Status |
|--------|--------|
| Shell | Allowed |
| Chat | Allowed |
| Inline Operator Feed | Allowed |
| Task Governor | Allowed |

### Phase 1 — Explicitly Prohibited

Until Phase 1 stability gate passes (30 consecutive days, all metrics green):

- UVL
- Project Vault
- Replay
- Self Vision
- Founder Notifications
- Console Intelligence
- Reality Replay
- Mobile Command
- World 2 Builder

**No stubs. No placeholders. No feature flags.** These do not exist in the V2 repository during Phase 1.

### Recommended build order

1. Task Governor
2. Shell
3. Chat (single answer authority)
4. Inline Operator Feed
5. Browser verification harness
6. 30-day stability soak

---

## Strategic Vision Documents

| Document | Scope |
|----------|-------|
| `DEVPULSE_V2_FOUNDER_VISION.md` | Identity, mission, immutable principles |
| `DEVPULSE_V2_PRODUCT_NORTH_STAR.md` | Ideal user experience and product feel |
| `DEVPULSE_V2_FINAL_STATE_ROADMAP.md` | Complete DevPulse destination |

## Specialized Law Documents

| Document | Scope |
|----------|-------|
| `DEVPULSE_V2_SYSTEM_LAWS.md` | Foundational system rules |
| `DEVPULSE_V2_STARTUP_LAWS.md` | Boot sequence and budgets |
| `DEVPULSE_V2_PERFORMANCE_LAWS.md` | Main-thread and queue budgets |
| `DEVPULSE_V2_OWNERSHIP_LAWS.md` | Registry and authority |
| `DEVPULSE_V2_GROWTH_PROTECTION_LAWS.md` | Anti-monolith enforcement |
| `DEVPULSE_V2_WORLD2_LAWS.md` | Isolated builder zone |
| `DEVPULSE_V2_REBUILD_BLUEPRINT.md` | Phase plan and build order |

---

## Amendment Protocol

1. Founder explicitly requests amendment
2. All affected law documents updated in same changeset
3. Phase gates re-evaluated
4. Dated amendment entry appended to this document
5. **No automated system may perform steps 1–4**

---

# Founder Report

## 1. Biggest V1 Architectural Mistakes

1. **Validator/browser path fork** — The single most damaging mistake. Validators proved a system that did not exist in the browser. Founders saw routing leaks and template answers while reports showed PASS.

2. **Multiple competing answer authorities** — Project Vault, V2 Intelligence, CCIR recovery, and Verification Loop fought for final ownership based on load order, not declared precedence. Quality gates were skipped on whichever path won.

3. **Main-thread monopolization at startup** — 3600+ scripts, synchronous panel renders, and overlapping idle work made the UI a visual decoy. Paint ≠ interactivity, but V1 measured only paint.

4. **Diagnostics as gates** — UVL readiness, preflight scans, and boot group loading blocked user interaction. Audits became the product instead of serving it.

5. **Connect-module growth pattern** — Features added by extending manifests with bridge scripts (V15–V20) instead of extraction. Created monolith runtime groups immune to rollback.

6. **Invisible execution** — Operator Feed existed in state but not in the user's view. Founders could not see what DevPulse was doing during the long waits.

## 2. Highest-Risk Rebuild Traps

1. **Building UVL or Project Vault in Phase 1** — These systems caused the worst V1 failures. Adding them before chat is proven stable guarantees repetition.

2. **Validator-first development** — Writing Node VM tests before browser tests recreates the path fork on day one.

3. **Skipping Task Governor** — Building shell and chat with ad-hoc `setTimeout` loaders recreates startup avalanche. Governor must be first.

4. **Adding post-answer interceptors "for safety"** — CCIR was a safety layer that became the primary bug. One authority, no overrides.

5. **Connect modules for speed** — The temptation to bridge new features into existing manifests instead of registering owners will reintroduce monolith growth within weeks.

6. **Treating shell paint as startup success** — Measuring visibility without clickability and answer latency repeats the V2 hot-path regression.

7. **Phase boundary erosion** — "Just a stub" for Vault or UVL becomes loaded code that changes answer authority mid-session.

## 3. Non-Negotiable V2 Protections

1. **Browser reality is supreme** — No release without browser green. Validator mismatch is P0.

2. **One answer, one authority** — Registry-enforced linear chain. No post-interceptors. Ever.

3. **800 ms startup budget** — Hard cap on main-thread blocking. Automatic deferral.

4. **≤ 6 eager modules** — Everything else lazy-loaded through Task Governor.

5. **Chat works before diagnostics exist** — Submit at T+500 ms must succeed.

6. **Operator Feed inline and visible** — No hidden execution.

7. **Phase 1 four-system limit** — Shell, Chat, Feed, Governor. Nothing else in repo.

8. **Constitutional immutability for automated systems** — Architecture law is human-amended only.

9. **No connect modules** — Extract or reject. CI-enforced.

10. **Task Governor owns all scheduling** — No ad-hoc loaders.

## 4. Recommended Phase 1 Build Order

| Step | System | Why this order |
|------|--------|----------------|
| 1 | **Task Governor** | Infrastructure that prevents V1 scheduling chaos |
| 2 | **Shell** | Proves startup timing laws with minimal surface |
| 3 | **Chat + Answer Authority** | Core product; single owner from day one |
| 4 | **Inline Operator Feed** | Visible execution; depends on chat mount |
| 5 | **Browser Verification Harness** | Proves all laws before any Phase 2 work |
| 6 | **30-day stability soak** | Gate before any deferred system |

**Do not begin Phase 2 until all Phase 1 metrics hold for 30 consecutive days.**

---

*Ratified by GF7 OMEGA architectural authority. No DevPulse V2 code shall precede this document.*
