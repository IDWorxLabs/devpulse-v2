# DevPulse V2 — Ownership Laws

**Authority:** GF7 OMEGA Constitution V1  
**Scope:** Feature ownership, answer authority, source of truth, and duplicate prevention

---

## Purpose

V1 accumulated duplicate systems, competing answer authorities, and shadow paths that passed validators while failing browsers. These laws enforce **one owner per concern** with a mandatory registry.

---

## LAW O-1 — One Feature, One Owner

Every feature has exactly one owning module. No shared ownership. No "connect" modules that bridge duplicates.

| Feature domain | Owner type | Registry field |
|----------------|------------|----------------|
| Chat submit | `chat_submit_owner` | module ID |
| Chat answer | `answer_authority_owner` | module ID |
| Operator Feed write | `operator_feed_writer` | module ID |
| Task scheduling | `task_governor` | singleton |
| Startup readiness display | `startup_readiness_owner` | module ID |
| Shell render | `shell_owner` | module ID |

**Prohibited V1 patterns:**
- `*_connect_vN.js` bridge modules
- Parallel orchestrators for the same domain
- "Safe real" runtime groups that duplicate main route

---

## LAW O-2 — One Answer, One Authority

For any user message, exactly one module is the **Final Answer Authority**. The chain must be linear and documented.

```
User message
  → [single router with declared precedence]
  → [single answer authority]
  → [renderer — no mutation]
  → Browser
```

| Rule | Detail |
|------|--------|
| No post-authority interceptors | CCIR-style recovery **prohibited** |
| Early-return paths register as authority | Vault matchers must be in registry |
| Renderer does not transform answer text | Display only |
| Authority must run quality gate OR declare exemption | Exemption requires registry entry |

**V1 violation:** Three competing authorities — Project Vault Reality, V2 Verification Loop, CCIR Recovered Intelligence — with order-dependent outcomes.

---

## LAW O-3 — One Source of Truth

Each data domain has one write owner and one storage location.

| Domain | V2 Phase 1 owner | Storage |
|--------|------------------|---------|
| Conversation turns | Chat surface module | Session store (single API) |
| Operator Feed events | Operator Feed writer | Feed store (single API) |
| Task queue state | Task Governor | In-memory + optional persist |
| Startup phase | Startup controller | Telemetry key |
| Diagnostic history | **Deferred** — not Phase 1 | — |

**Prohibited:**
- Duplicate `localStorage` writers for same key
- Global function rebinding (V1 backend_integrity clobbered control center globals)
- Multiple `__DEVPULSE_*_LAST` keys for same semantic state

**V1 violation:** `devpulse_control_center_backend_integrity_v1.js` clobbered patched globals from control center, restoring `console.warn` paths.

---

## LAW O-4 — No Duplicate Intelligence Systems

DevPulse V2 Phase 1 has **one** chat intelligence path. Expansions require registry amendment.

| Prohibited duplicate | V1 example |
|---------------------|------------|
| Second chat orchestrator | CCIR + V2 + Vault |
| Second intent classifier on answer path | V1 classify + vault matcher |
| Second quality judge | Judge skipped on vault path |
| Second verification loop | Validator-only loop |
| Second "central brain" | Cognition stack layers |

Future intelligence layers (Phase 2+) must **extend** the single router, not parallel it.

---

## LAW O-5 — No Duplicate Operator Feeds

Exactly one Operator Feed system exists, inline with chat.

| Rule | Detail |
|------|--------|
| One feed writer API | All modules call `publishOperatorEvent()` |
| One feed renderer | Inline in conversation surface |
| No grouped phantom approvals | Connector sweeps prohibited |
| No console-only feed | Feed must be user-visible |

**V1 violation:** Connector sweep published global approval events; UCS grouped them as `waiting_approval` unrelated to active turn.

---

## LAW O-6 — No Duplicate Audits

One audit scheduler (Task Governor DIAGNOSTIC tier). One result store.

| Prohibited | Required |
|------------|----------|
| Multiple self-diagnostic entry points | Single diagnostic module (Phase 3+) |
| Parallel preflight scanners | Single preflight owner (Phase 3+) |
| Audit-on-route-open | Audit-on-idle only |
| Duplicate history save implementations | One `saveDiagnosticToHistory` |

---

## LAW O-7 — No Duplicate Timelines

Session timeline, execution history, and replay signals each have one owner — when introduced in later phases.

Phase 1: **No timeline system.** Chat turn history is sufficient.

| System | Phase | Owner |
|--------|-------|-------|
| Chat turn list | 1 | Chat surface |
| Execution timeline | 3+ | TBD at phase gate |
| Replay session store | 4+ | TBD at phase gate |
| UVL run history | 3+ | TBD at phase gate |

**Prohibited in Phase 1:** Any timeline, replay, or run history module.

---

## LAW O-8 — No Duplicate Reality Systems

"Reality" (ground truth about project state) has one authority when Project Vault arrives in Phase 2+.

Phase 1: Chat answers from **direct response generation** only — no vault reality, no UVL truth injection, no template grounding.

**V1 violation:** Project Vault Reality short-circuited V2 stack with template prose claiming "grounded in Project Vault reality."

---

## LAW O-9 — Ownership Registry Requirements

File: `architecture/OWNERSHIP_REGISTRY.json` (created at first Phase 1 implementation)

### Required fields per entry

```json
{
  "domain": "chat_answer",
  "owner_module": "devpulse_v2_chat_answer_authority",
  "owner_function": "generateAnswer",
  "entry_point": "submitChatMessage",
  "precedence": 1,
  "phase": 1,
  "supersedes": null,
  "prohibited_competitors": [],
  "browser_test": "tests/browser/answer_authority.spec"
}
```

### Registry rules

1. **No code merge** without registry entry for new owners
2. **Competing entry detection** — CI fails if two entries claim same domain
3. **Precedence is explicit** — router reads registry, not implicit file load order
4. **Amendment log** — ownership transfers require dated entry with reason
5. **Validator entry point** must match registry `entry_point` exactly

---

## LAW O-10 — No Shadow Paths

Every path to a user-visible outcome must be in the registry and tested from browser entry point.

| Shadow path type | V1 example | V2 status |
|------------------|------------|-----------|
| Validator-only entry | `routeDevPulseMainChatIntelligenceCoreV2V1` direct | **Prohibited** |
| Browser-only post-hook | `recoverCommandCenterChatResponseV1` | **Prohibited** |
| Lazy-load authority change | Vault binding loads post-interaction | **Prohibited** — authority fixed at Phase 1 |
| Sync vs async load split | CCIR sync, V2 lazy | **Prohibited** — load order documented and identical in tests |

---

## LAW O-11 — Ownership Transfer Protocol

Transferring ownership requires:

1. Registry amendment with `supersedes` field
2. Removal of competing module from manifest (not deprecated-in-place)
3. Browser verification of new chain
4. 30-day sunset on old owner (hard delete, not `#if` flag)

**Prohibited:** Leaving old owner loaded "just in case"; feature flags that fork authority.

---

## Verification Requirements

1. Registry completeness check — all Phase 1 domains covered
2. Competitor scan — no duplicate domain entries
3. Browser path test — same entry point as registry
4. Validator alignment test — validator uses registry entry point only
5. Global clobber scan — no duplicate global bindings for owned functions

---

## Related Documents

- `DEVPULSE_V2_SYSTEM_LAWS.md` — Answer authority and path fork laws
- `DEVPULSE_V2_GROWTH_PROTECTION_LAWS.md` — Module size and extraction
- `DEVPULSE_V2_REBUILD_BLUEPRINT.md` — Phase 1 scope
