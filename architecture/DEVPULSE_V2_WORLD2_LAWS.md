# DevPulse V2 — World 2 Laws

**Authority:** GF7 OMEGA Constitution V1  
**Scope:** World 2 isolation zone, builder safety, verification, rollback, and constitutional protection

---

## Purpose

World 2 is DevPulse's isolated experimentation and builder zone — where automated systems may propose and test changes without contaminating the production DevPulse foundation. V1 blurred this boundary until builder outputs, connect modules, and patch chains modified production paths directly.

World 2 is **not available in Phase 1**. These laws govern its eventual introduction.

---

## LAW W2-1 — World 2 Isolation

World 2 is a **separate execution environment** from DevPulse production runtime.

| Boundary | Requirement |
|----------|-------------|
| Code namespace | `world2/` directory tree — never imports from production shell |
| Production code | Must not import from `world2/` |
| State store | Separate storage keys (`__WORLD2_*` only) |
| Module manifest | Separate manifest — not appended to production groups |
| Network | Separate API routes or sandboxed endpoints |
| Task scheduling | Separate governor instance or explicitly sandboxed queue |

**Prohibited:** World 2 modules in production lazy groups; World 2 connect modules; World 2 patches applied to production without gate.

**V1 violation:** Connect modules V15–V20 modified production `safe_real_main_route_runtime_v11` directly.

---

## LAW W2-2 — Builder Safety Requirements

When World 2 Builder is introduced (Phase 5+, after foundation proven), it must satisfy:

### Pre-execution gates

1. **Proposal only** — builder outputs a proposal artifact, not direct mutation
2. **Human approval** — no autonomous apply without explicit founder approval
3. **Diff preview** — full diff visible in Operator Feed before any action
4. **Scope limit** — builder may only modify files within declared scope
5. **Constitutional lock** — builder cannot target `architecture/` or law modules

### Execution constraints

| Constraint | Detail |
|------------|--------|
| Dry run first | Mandatory |
| Rollback artifact | Generated before apply |
| Apply window | Time-boxed; auto-revert on timeout |
| Concurrent builds | Max 1 |
| Production touch | **Prohibited** — builder runs in World 2 sandbox only |

---

## LAW W2-3 — Verification Requirements

World 2 outputs must pass verification before any promotion to production.

| Verification stage | Method |
|--------------------|--------|
| Static analysis | Complexity + ownership scan |
| Sandbox browser test | Full browser verification in World 2 env |
| Diff review | Human or governed approval |
| Regression test | Production browser tests still pass |
| Performance budget | World 2 changes must not regress production budgets |

Promotion from World 2 to production is a **manual, gated merge** — never automatic.

---

## LAW W2-4 — Rollback Requirements

Every World 2 execution must produce rollback capability.

| Requirement | Detail |
|-------------|--------|
| Pre-apply snapshot | File state or git ref recorded |
| Rollback command | Single command restores prior state |
| Rollback test | Verified in sandbox before apply |
| Failure auto-rollback | Apply failure triggers automatic revert |
| Audit trail | Operator Feed entry for apply and rollback |

**V1 violation:** Patch chains and connect modules had no unified rollback — fixes required new connect modules.

---

## LAW W2-5 — No Autonomous Modification of Constitutional Laws

The following are **immutable by automated systems**:

- `architecture/DEVPULSE_V2_CONSTITUTION.md`
- `architecture/DEVPULSE_V2_*_LAWS.md`
- `architecture/DEVPULSE_V2_REBUILD_BLUEPRINT.md`
- `architecture/OWNERSHIP_REGISTRY.json` (automated edits blocked)

### Amendment protocol (human only)

1. Founder explicitly requests amendment
2. Amendment documented with dated entry in Constitution
3. All law documents updated consistently
4. Phase gates re-evaluated
5. No builder, agent, or World 2 process may perform steps 1–4

**Hard rule:** Any automated PR touching `architecture/` is **auto-rejected** by CI.

---

## LAW W2-6 — World 2 Phase Gate

World 2 Builder is prohibited until:

| Prerequisite | Metric |
|--------------|--------|
| Phase 1 stable | 30 consecutive days, zero P0 browser failures |
| Phase 2 stable | UVL/Project Vault pass browser gates |
| Phase 3 stable | Diagnostics do not regress chat performance |
| Phase 4 stable | Replay verified in browser |
| Task Governor mature | Pressure prevention proven under load |
| Ownership Registry complete | All production domains registered |

Estimated earliest: **Phase 5** — not before.

---

## LAW W2-7 — World 2 Data Isolation

| Data type | World 2 storage | Production storage |
|-----------|-----------------|-------------------|
| Chat history | `world2_chat_*` | `devpulse_v2_chat_*` |
| Operator events | `world2_feed_*` | `devpulse_v2_feed_*` |
| Build artifacts | `world2_builds/` | **None** — never in production tree |
| Test results | `world2_test_*` | Production test store |

Cross-contamination is a P0 incident.

---

## LAW W2-8 — World 2 Observability

World 2 must be observable from production **read-only** — not controllable.

| Surface | Access |
|---------|--------|
| Operator Feed | World 2 events tagged `[World2]` |
| Status indicator | Read-only badge in shell (Phase 5+) |
| Production chat | Cannot invoke World 2 builder |
| Console | Separate World 2 console namespace |

---

## LAW W2-9 — Failure Containment

World 2 failure must never degrade production.

| Failure | Production behavior |
|---------|----------------------|
| World 2 crash | No impact — production unaware |
| World 2 infinite loop | Sandbox timeout kills process |
| World 2 memory leak | Sandbox resource limit |
| World 2 bad promotion attempt | CI blocks merge |

---

## Verification Requirements (when World 2 launches)

1. Import boundary scan — no cross-tree imports
2. Storage key isolation test
3. Builder dry-run test
4. Rollback test
5. Constitutional immutability test — automated edit attempt must fail
6. Production regression test — World 2 activity does not affect production metrics

---

## Related Documents

- `DEVPULSE_V2_CONSTITUTION.md` — Amendment authority
- `DEVPULSE_V2_GROWTH_PROTECTION_LAWS.md` — Phase boundary enforcement
- `DEVPULSE_V2_REBUILD_BLUEPRINT.md` — Phase 5 World 2 introduction
