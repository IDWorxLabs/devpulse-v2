# DevPulse V2 — Rebuild Blueprint

**Authority:** GF7 OMEGA Constitution V1  
**Status:** Phase 0 — Architecture only (no implementation)  
**Principle:** Prove the foundation before adding capability

---

## Purpose

This blueprint defines **what gets built, in what order, and what is explicitly forbidden** until stability gates pass. V1 failed by building everything simultaneously and connecting it with patch modules.

---

## Rebuild Philosophy

| V1 approach | V2 approach |
|-------------|-------------|
| Add feature → extend manifest → add connect module | Add feature → prove budget → register owner |
| Validator proves correctness | Browser proves correctness |
| Diagnostics gate startup | Diagnostics serve startup |
| Multiple answer authorities | Single answer authority |
| 3600+ script boot groups | ≤ 6 eager modules |
| Patch-over-patch | Extract or reject |

---

## Phase 0 — Constitutional Foundation (CURRENT)

**Status:** IN PROGRESS  
**Deliverables:** Architecture law documents only  
**Code:** None

| Output | Status |
|--------|--------|
| `DEVPULSE_V2_CONSTITUTION.md` | Required |
| All `DEVPULSE_V2_*_LAWS.md` | Required |
| `DEVPULSE_V2_REBUILD_BLUEPRINT.md` | Required |
| `OWNERSHIP_REGISTRY.json` | Created at Phase 1 start |
| Browser verification harness | Phase 1 prerequisite |

**Gate to Phase 1:** Constitution complete + founder approval

---

## Phase 1 — Foundation (ONLY THESE SYSTEMS)

**Goal:** A stable, fast, honest chat control system with visible operator context.

### Allowed systems (exhaustive list)

| # | System | Purpose | Owner domain |
|---|--------|---------|--------------|
| 1 | **Shell** | Minimal frame, layout, navigation chrome | `shell_owner` |
| 2 | **Chat** | Primary interface — submit, answer, display | `chat_submit_owner`, `answer_authority_owner` |
| 3 | **Inline Operator Feed** | Visible execution context within conversation | `operator_feed_writer` |
| 4 | **Task Governor** | All scheduling, budgets, pressure response | `task_governor` |

**That is the complete Phase 1 system list. Nothing else.**

### Phase 1 architecture

```
┌─────────────────────────────────────────────┐
│                   SHELL                      │
│  ┌─────────────────────────────────────────┐│
│  │              CHAT SURFACE                ││
│  │  ┌───────────────────────────────────┐  ││
│  │  │     Inline Operator Feed          │  ││
│  │  └───────────────────────────────────┘  ││
│  └─────────────────────────────────────────┘│
│                                              │
│  Task Governor (background scheduler)        │
└─────────────────────────────────────────────┘
```

### Phase 1 explicit prohibitions

The following are **constitutionally blocked** until Phase 1 stability gate passes:

| System | Reason deferred |
|--------|-----------------|
| **UVL** (Unified Verification Lab) | Caused startup freeze, false readiness, validator/browser fork |
| **Project Vault** | Competing answer authority, template leaks |
| **Replay** | Requires stable execution signals not yet available |
| **Self Vision** | Intelligence scan on critical path |
| **Founder Notifications** | Duplicate notification/approval paths |
| **Console Intelligence** | Console noise, duplicate diagnostics |
| **Reality Replay** | Depends on replay + vault + UVL |
| **Mobile Command** | Separate surface before core stable |
| **World 2 Builder** | Requires proven foundation (Phase 5+) |

**No stubs. No placeholders. No `#ifdef` flags. These systems do not exist in the repo.**

### Phase 1 module budget

| Category | Maximum |
|----------|---------|
| Eager modules | 6 |
| Total modules | 20 |
| Total lines | 8000 |
| Globals | 15 |
| Lazy groups | 1 (post-Phase 1 gate only) |

### Phase 1 stability gate

All must pass for **30 consecutive days**:

| Metric | Target |
|--------|--------|
| Cold `firstClickReadyAt` | ≤ 2000 ms |
| Warm first answer byte | ≤ 3000 ms |
| Zero P0 browser failures | Required |
| Zero validator/browser path forks | Required |
| Zero CRITICAL pressure events on normal startup | Required |
| Operator Feed visible on 100% of chat turns with events | Required |
| Complexity debt ledger empty | Required |

---

## Phase 2 — Ground Truth (after Phase 1 gate)

**Prerequisite:** Phase 1 stable 30 days

| System | Introduction rule |
|--------|-------------------|
| Project Vault (read-only) | Must register as answer authority competitor — router resolves via registry precedence, not load order |
| UVL (minimal) | Hot-path shell only; no sync panel render; no pre-run blocking gates |
| Startup readiness display | Display only — no gates |

**Still prohibited:** Replay, Self Vision, Console Intelligence, Mobile Command, World 2

---

## Phase 3 — Diagnostics & Intelligence (after Phase 2 gate)

| System | Rule |
|--------|------|
| Full UVL | Background-only derive; post-run diagnostics |
| Console intelligence | Single diagnostic owner; no duplicate globals |
| Self Vision | Task Governor IDLE tier only |
| Founder Notifications | Single notification owner |

**Still prohibited:** Replay, Reality Replay, Mobile Command, World 2

---

## Phase 4 — History & Replay (after Phase 3 gate)

| System | Rule |
|--------|------|
| Session replay | Single timeline owner |
| Reality replay | Requires execution chain signals from Operator Feed |
| Execution history | One store, one writer |

**Still prohibited:** Mobile Command, World 2 Builder

---

## Phase 5 — Expansion (after Phase 4 gate)

| System | Rule |
|--------|------|
| Mobile Command | Separate surface, shared Task Governor |
| World 2 sandbox | Isolated per World 2 Laws |
| World 2 Builder | Human approval required; no constitutional edits |

---

## Recommended Phase 1 Build Order

Build in this exact sequence. Do not parallelize across systems.

### Step 1 — Task Governor (build first, even though it's infrastructure)

**Why first:** Every subsequent system registers with it. Building shell/chat without governor recreates V1 ad-hoc scheduling.

| Deliverable | Gate |
|-------------|------|
| Register/Schedule/Preempt/BudgetRemaining/PressureLevel | Unit test |
| Pressure detection (long task observer) | Simulated long task triggers ELEVATED |
| Startup budget counter | Rejects work when exhausted |

### Step 2 — Shell

**Why second:** Visible frame proves startup laws before chat complexity.

| Deliverable | Gate |
|-------------|------|
| Minimal layout (chat area + feed area) | `shellVisibleAt` ≤ 800 ms |
| No sync script tags beyond bootstrap | Manifest scan |
| Focus management | Chat input focusable ≤ 1500 ms |

### Step 3 — Chat (submit + answer authority)

**Why third:** Core product value; proves answer authority singularity.

| Deliverable | Gate |
|-------------|------|
| Submit handler | Accepts input ≤ 2000 ms from load |
| Single answer authority module | Registry entry |
| No post-interceptors | Static analysis |
| Honest stub → real answer | Browser test |
| First answer byte ≤ 3000 ms | Browser test (warm) |

### Step 4 — Inline Operator Feed

**Why fourth:** Depends on chat surface for inline mount; proves visibility laws.

| Deliverable | Gate |
|-------------|------|
| Feed writer API | Single global publish function |
| Inline renderer in chat turn | Visible without expand/tab |
| No phantom approvals | Event must reference active turn |
| Direct answer turns show feed | No `hideFeedOnDirectAnswer` flag |

### Step 5 — Browser Verification Harness

**Why last in Phase 1:** Tests the complete foundation.

| Test | Pass criteria |
|------|---------------|
| Cold startup | All timing gates |
| Warm startup | No regression > 10% |
| Submit during boot | Chat accepts, responds |
| Diagnostic failure | Chat still works |
| Answer authority | Single owner in trace |
| Operator Feed | Visible inline |
| Validator alignment | Same entry point as browser |

### Step 6 — Phase 1 Stability Soak

30-day monitoring before Phase 2 begins.

---

## Directory Structure (Phase 1)

```
DevPulse-V2/
├── architecture/          # Constitutional law (this directory)
│   ├── DEVPULSE_V2_CONSTITUTION.md
│   ├── DEVPULSE_V2_*_LAWS.md
│   ├── OWNERSHIP_REGISTRY.json    (Phase 1 start)
│   └── COMPLEXITY_DEBT.md         (Phase 1 start)
├── src/
│   ├── shell/             # Layer 0
│   ├── chat/              # Layer 1
│   ├── operator-feed/     # Layer 1
│   ├── task-governor/     # Layer 2
│   └── answer-authority/  # Layer 3
├── tests/
│   └── browser/           # Supreme verification
└── (no world2/, no uvl/, no vault/, no replay/)
```

---

## Anti-Patterns Checklist (reject any PR that includes)

- [ ] Connect module pattern (`*_connect_vN.js`)
- [ ] Manifest extension without size check
- [ ] Validator entry point ≠ browser entry point
- [ ] Post-answer interceptor
- [ ] Sync script tag after Phase 0
- [ ] Diagnostic on startup critical path
- [ ] Second answer authority
- [ ] Hidden Operator Feed
- [ ] Feature flag forking authority paths
- [ ] Phase 2+ code in Phase 1 repo

---

## Success Definition

DevPulse V2 Phase 1 is successful when a founder can:

1. Open DevPulse and type within 2 seconds
2. Ask a question and see an honest answer within 3 seconds
3. See what DevPulse is doing inline in the conversation
4. Trust that the answer came from one known authority
5. Know that no background audit delayed their interaction

Everything else waits.

---

## Related Documents

- `DEVPULSE_V2_CONSTITUTION.md` — Master authority
- `DEVPULSE_V2_STARTUP_LAWS.md` — Timing gates
- `DEVPULSE_V2_SYSTEM_LAWS.md` — Chat and diagnostic laws
- `DEVPULSE_V2_OWNERSHIP_LAWS.md` — Registry
- `DEVPULSE_V2_WORLD2_LAWS.md` — Future isolation rules
