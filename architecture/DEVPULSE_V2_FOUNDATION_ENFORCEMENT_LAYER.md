# DevPulse V2 — Foundation Enforcement Layer

**GF7 OMEGA — Enforcement Authority V1**  
**Status:** Phase 1 prerequisite — must pass before any app implementation

---

## Why This Layer Exists

DevPulse V1 failed not from lack of capability but from lack of **enforceable guardrails**. Validators passed while browsers failed. Connect modules inflated manifests to 92 scripts. Multiple answer authorities competed by load order. Diagnostics blocked chat for 30+ seconds. Features shipped before the foundation was stable.

DevPulse V2 begins with **constitutional law** (architecture documents) and **machine-checkable enforcement** (this layer). Law without enforcement is advisory — V1 proved that.

This layer converts strategic vision, constitutional law, and specialized law documents into **rules that code cannot merge without passing**.

---

## What V1 Mistakes It Prevents

| V1 failure | Enforcement mechanism |
|------------|----------------------|
| Startup overload (3600+ scripts) | `startupBudgetMs`, `maxEagerModules` |
| 20+ s clickability delays | `firstClickableBudgetMs` |
| Duplicate answer authorities | `singleAnswerAuthority`, duplicate detection |
| Duplicate truth sources | `singleSourceOfTruth`, ownership registry |
| Duplicate operator feeds | Operator feed owner singularity check |
| Hidden execution / validator-only paths | `hiddenExecutionPatterns`, path scan |
| Connect-module inflation | `connectModulesForbidden`, pattern detection |
| Diagnostics blocking chat | `diagnosticsCannotBlockChat`, startup path check |
| Validator green / browser red | `browserRealitySupreme`, verification requirement |
| Phase 2+ features in Phase 1 | Phase gate + forbidden system list |
| World 2 modifying constitutional law | `world2CannotModifyLaw`, protected path scan |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Strategic Vision (Level 1)                  │
│  Founder Vision · Product North Star · Final State     │
└────────────────────────┬────────────────────────────────┘
                         │ informs purpose
┌────────────────────────▼────────────────────────────────┐
│              Constitutional Law (Level 2)                │
│  Constitution · Startup · Performance · Ownership ·    │
│  Growth · World 2 · Rebuild Blueprint                    │
└────────────────────────┬────────────────────────────────┘
                         │ encoded as
┌────────────────────────▼────────────────────────────────┐
│         Foundation Enforcement Layer (THIS)              │
│  law-registry · ownership-registry · phase-gate ·       │
│  constitutional-validator · build-gate · founder-report  │
└────────────────────────┬────────────────────────────────┘
                         │ gates
┌────────────────────────▼────────────────────────────────┐
│              Implementation (Level 3)                    │
│  Shell · Chat · Operator Feed · Task Governor · …       │
└─────────────────────────────────────────────────────────┘
```

---

## Module Reference

### `src/foundation/law-registry.ts`

Exports `DEV_PULSE_V2_LAWS` — machine-readable thresholds and lists:

- `startupBudgetMs: 800`
- `firstClickableBudgetMs: 2000`
- `maxEagerModules: 6`
- Boolean law flags (`chatBeforeDiagnostics`, `browserRealitySupreme`, etc.)
- `phase1AllowedSystems` and `phase1ForbiddenSystems`
- Pattern matchers for connect modules and hidden paths

**Single source of truth for numeric and list-based law values.**

### `src/foundation/ownership-registry.ts`

Defines one owner per domain:

| Domain | Owner module |
|--------|--------------|
| `startup_scheduling` | `devpulse_v2_task_governor` |
| `chat_answer_authority` | `devpulse_v2_chat_answer_authority` |
| `chat_rendering` | `devpulse_v2_chat_surface` |
| `inline_operator_feed` | `devpulse_v2_operator_feed` |
| `background_task_budgeting` | `devpulse_v2_task_governor` |
| `browser_verification_harness` | `devpulse_v2_browser_verification_harness` |
| `law_enforcement` | `devpulse_v2_foundation_enforcement` |
| `phase_gate` | `devpulse_v2_phase_gate` |
| `performance_gate` | `devpulse_v2_task_governor` |
| `growth_protection` | `devpulse_v2_foundation_enforcement` |
| `world2_isolation` | `devpulse_v2_world2_isolation_gate` (Phase 5) |

Functions: `getDevPulseV2Owner`, `assertSingleOwner`, `listDevPulseV2Owners`.

### `src/foundation/phase-gate.ts`

`assertSystemAllowedInCurrentPhase(systemId, phase)` — returns allowed/denied with violation detail including `lawReference` and `recommendedAction`.

Phase 1 allows only:
- `foundation_enforcement`
- `task_governor`
- `shell`
- `chat`
- `inline_operator_feed`
- `browser_verification_harness`

### `src/foundation/constitutional-validator.ts`

`runDevPulseV2ConstitutionalValidation(input)` — validates a build or architecture packet against all machine-checkable laws. Returns:

```typescript
{
  passed: boolean,
  violationCount: number,
  violations: Violation[],
  warnings: Warning[],
  summary: string
}
```

### `src/foundation/build-gate.ts`

`runDevPulseV2BuildGate(buildPacket)` — unified pre-build checkpoint:

1. Read intended systems from `buildPacket`
2. Run phase gate
3. Run ownership checks
4. Run constitutional validation
5. Return PASS / FAIL with `buildAllowed` flag

**If FAIL: do not approve build.**

### `src/foundation/founder-report.ts`

`formatFounderGateReport(result)` — founder-readable report with verdict, violations, affected systems, risk level, and repair actions.

---

## How Future Builds Must Use the Build Gate

Before any implementation PR merges:

```typescript
import { runDevPulseV2BuildGate } from './src/foundation/build-gate.js';
import { formatFounderGateReportText } from './src/foundation/founder-report.js';

const result = runDevPulseV2BuildGate({
  phase: 1,
  systems: ['shell', 'chat'],
  eagerModuleCount: 4,
  startupBudgetMs: 400,
  firstClickableBudgetMs: 1200,
  answerAuthorities: ['devpulse_v2_chat_answer_authority'],
  browserVerificationPresent: true,
  buildStage: 'phase1_impl',
});

console.log(formatFounderGateReportText(result));

if (!result.buildAllowed) {
  process.exit(1);
}
```

### Build packet fields

| Field | Purpose |
|-------|---------|
| `phase` | Current DevPulse phase (1–5) |
| `systems` | Systems intended in this build |
| `eagerModuleCount` | Phase 0 eager manifest size |
| `startupBudgetMs` | Declared startup blocking budget |
| `firstClickableBudgetMs` | Declared clickability timing |
| `answerAuthorities` | Modules claiming final answer ownership |
| `truthSources` | Domain → owner list (max 1 per domain) |
| `operatorFeedOwners` | Feed writer claims |
| `modulePaths` | Paths scanned for connect/hidden patterns |
| `connectModulePaths` | Explicit connect-module paths |
| `diagnosticsOnStartupPath` | Whether diagnostics block startup |
| `browserVerificationPresent` | Browser harness included |
| `world2LawModificationAttempt` | World 2 law edit detection |
| `buildStage` | `foundation` \| `phase1_impl` \| `release` |

---

## CLI Validation

Run before every implementation session:

```bash
npm run validate:foundation
```

Expected output includes:

```
DEVPULSE_V2_FOUNDATION_ENFORCEMENT_LAYER_V1_PASS
```

### Scenarios validated

1. Valid Phase 1 build packet → PASS
2. Forbidden system (`project_vault`) → FAIL
3. Duplicate answer authority → FAIL
4. Eager modules > 6 → FAIL
5. Startup budget > 800 ms → FAIL
6. Connect module attempt → FAIL
7. Browser verification missing → WARN (foundation) / FAIL (release)
8. World 2 law modification → FAIL

---

## Why This Must Run Before Every Future Implementation

1. **Law without enforcement repeats V1** — V1 had duplicate prevention in report templates, not CI.
2. **Phase boundaries erode under pressure** — "Just a stub" for Project Vault becomes a loaded authority fork.
3. **Ownership drift is silent** — Without registry checks, connect modules reappear within weeks.
4. **Browser reality requires explicit gate** — Validators alone will recreate false green.
5. **Founder trust requires readable reports** — Violations must explain law, risk, and repair.

---

## Pass Token

When all CLI scenarios pass:

```
DEVPULSE_V2_FOUNDATION_ENFORCEMENT_LAYER_V1_PASS
```

This token confirms the enforcement layer is operational. **Shell, Chat, Operator Feed, and Task Governor implementation may begin only after this token is produced.**

---

## Related Documents

- `DEVPULSE_V2_CONSTITUTION.md`
- `DEVPULSE_V2_FOUNDER_VISION.md`
- `DEVPULSE_V2_REBUILD_BLUEPRINT.md`
- `DEVPULSE_V2_OWNERSHIP_LAWS.md`
