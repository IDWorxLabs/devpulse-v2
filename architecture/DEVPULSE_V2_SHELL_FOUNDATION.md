# DevPulse V2 — Shell Foundation

**GF7 OMEGA — Visible Surface Foundation V1**  
**System ID:** `shell`  
**Phase:** 1  
**Status:** First user-facing runtime surface

---

## Why the Shell Exists

DevPulse V1 proved that capability without a responsive surface is worthless. Users waited 15–30 seconds to click. UI painted while the main thread was frozen. Validators passed; browsers failed.

The Shell Foundation exists to prove **DevPulse V2 is architecturally different** before Chat, Operator Feed, or any intelligence system is built.

The shell must demonstrate:

1. DevPulse opens quickly
2. DevPulse becomes clickable quickly
3. DevPulse remains responsive under scheduling load
4. Constitutional startup targets are tracked
5. All startup work flows through Task Governor

---

## Why Chat Is Not Built Yet

Chat is the primary interface — but only after the shell proves timing and scheduling discipline. Building chat on a frozen or unmeasured shell would repeat V1's failure mode: a chat input that exists but cannot be used.

**Order:** Shell → Chat → Operator Feed (per Rebuild Blueprint).

---

## Why Operator Feed Is Not Built Yet

The Operator Feed requires an inline conversation surface. The shell provides **placeholder regions only** — no feed logic, no phantom approvals, no hidden task metadata.

```
[ Chat Surface Placeholder ]
[ Operator Feed Placeholder ]
```

These are visual commitments to layout, not implementations.

---

## V1 Startup Failures That Influenced Design

| V1 failure | Shell Foundation response |
|------------|---------------------------|
| 20+ s clickability delay | Clickable target ≤ 2000 ms, tracked explicitly |
| Paint without interactivity | Separate `VISIBLE` vs `CLICKABLE` states |
| 3600+ script boot avalanche | No eager loading groups; governor P0/P1 only |
| Sync panel render on route open | No diagnostics, no network, no data loading |
| Hidden startup chains | All startup tasks via Task Governor, auditable |

---

## Why Clickability Matters More Than Paint

V1 optimized paint. Users saw buttons but could not interact for 30 seconds. **Paint is not startup success. Clickability is.**

The shell tracks:

- `shellVisibleAt` — first paint milestone
- `shellClickableAt` — first interactive milestone
- `visibleMs` / `clickableMs` — computed from `startupStartedAt`

Constitutional targets:

| Milestone | Target |
|-----------|--------|
| Visible | ≤ 800 ms |
| Clickable | ≤ 2000 ms |

Exceeding targets records a **warning** and may set status to `DEGRADED` — it does not silently pass.

---

## Why Task Governor Owns Startup Scheduling

Every shell startup action schedules through Task Governor:

| Task | Priority |
|------|----------|
| Mark visible | P0 `P0_VISIBLE_USER_PATH` |
| Mark clickable | P1 `P1_CORE_INTERACTION` |
| Mark ready | P1 `P1_CORE_INTERACTION` |

**Prohibited at startup:** P3 heavy background, P4 idle-only, diagnostics, lazy module avalanches.

The shell is the first proof that Task Governor can boot a visible surface responsibly.

---

## Module Reference

| Module | Responsibility |
|--------|----------------|
| `shell-authority.ts` | Sole shell owner — readiness, status, boot orchestration |
| `clickability-tracker.ts` | `markShellVisible`, `markShellClickable`, timing report |
| `shell-surface.ts` | Minimal HTML surface — placeholders only |
| `shell-report.ts` | Founder-readable timing and target report |

### Ownership

Domain: `shell_authority`  
Owner: `devpulse_v2_shell_authority.createDevPulseV2ShellAuthority`

No other module may claim shell authority.

### Shell states

| Status | Meaning |
|--------|---------|
| `BOOTING` | Startup in progress |
| `VISIBLE` | Surface painted |
| `CLICKABLE` | Primary control ready |
| `READY` | Shell foundation complete |
| `DEGRADED` | Constitutional timing targets exceeded |

---

## Usage

```typescript
import {
  createDevPulseV2ShellAuthority,
  formatShellReportFromAuthority,
} from './src/shell/index.js';

const shell = createDevPulseV2ShellAuthority();
await shell.bootShell();

console.log(formatShellReportFromAuthority(shell));
console.log(shell.getSurfaceHtml());
```

---

## Build Gate

```typescript
runDevPulseV2BuildGate({
  phase: 1,
  systems: ['shell'],
  eagerModuleCount: 2,
  answerAuthorities: [],
  browserVerificationPresent: false,
  buildStage: 'foundation',
});
```

---

## Validation

```bash
npm run validate:shell
npm run validate:task-governor
npm run validate:foundation
```

Pass token:

```
DEVPULSE_V2_SHELL_FOUNDATION_V1_PASS
```

---

## Next Step

Shell Foundation must pass before **Chat Authority** implementation begins. Chat will mount into the placeholder region — not replace shell authority.

---

## Related Documents

- `DEVPULSE_V2_STARTUP_LAWS.md`
- `DEVPULSE_V2_TASK_GOVERNOR_FOUNDATION.md`
- `DEVPULSE_V2_REBUILD_BLUEPRINT.md`
