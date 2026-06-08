# DevPulse V2 — Phase 1 Stability Soak Foundation

**GF7 OMEGA — Repeated Phase 1 Validation V1**  
**System ID:** `phase_1_stability_soak`  
**Phase:** 1

---

## Purpose

The constitutional Phase 1 gate requires **30 consecutive calendar days** of stability. This foundation does **not** wait 30 days or fake elapsed time.

It provides a **soak runner** that repeatedly verifies the Phase 1 stack in immediate cycles so founders can prove:

- Startup, shell, chat, inline feed, and browser verification repeat cleanly
- Pass/warn/fail totals are tracked honestly
- Simulated browser limitations are disclosed
- Phase 2 readiness is `REAL_BROWSER_REQUIRED` until a real browser runner is attached

---

## What This Does NOT Do

- Does not claim 30-day stability complete
- Does not sleep or simulate elapsed days
- Does not replace existing `validate:*` scripts
- Does not create a second browser harness
- Does not build Trust Engine, Project Vault, or Phase 2 systems

---

## Soak Runner (Default: 3 Cycles)

Each cycle programmatically verifies:

1. Foundation Enforcement (build gate + constitutional validation)
2. Task Governor (P0 before P3)
3. Shell boot
4. Chat Authority mount + submit + answer
5. Inline Operator Feed (5 foundation events)
6. Browser Verification Harness

No long waits between cycles.

---

## Phase 2 Readiness States

| State | Meaning |
|-------|---------|
| `NOT_READY` | One or more soak cycles failed |
| `REAL_BROWSER_REQUIRED` | Repeated cycles pass/warn but only simulated browser |
| `FOUNDATION_READY` | Real browser runner attached and cycles stable |

At foundation stage, expect **`REAL_BROWSER_REQUIRED`** after successful soak — not false completion.

---

## Usage

```typescript
import { createDevPulseV2Phase1StabilitySoakAuthority } from './src/stability-soak/index.js';

const soak = createDevPulseV2Phase1StabilitySoakAuthority();
const state = await soak.runSoak(3);
console.log(soak.formatReport());
```

---

## Validation

```bash
npm run validate:phase-1-soak
npm run validate:browser-harness
npm run validate:inline-operator-feed
npm run validate:chat-authority
npm run validate:shell
npm run validate:task-governor
npm run validate:foundation
```

Pass token:

```
DEVPULSE_V2_PHASE_1_STABILITY_SOAK_FOUNDATION_V1_PASS
```

---

## Related Documents

- `DEVPULSE_V2_REBUILD_BLUEPRINT.md` — 30-day stability gate
- `DEVPULSE_V2_BROWSER_VERIFICATION_HARNESS_FOUNDATION.md`
