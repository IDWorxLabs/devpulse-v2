# Development Workspace Policy

**Effective:** 2026-07-06  
**Authority:** Engineering Protection Operation  
**Status:** Permanent policy recommendation

---

## Purpose

Establish a two-workspace model that preserves months of engineering investment while enabling aggressive, fearless refactoring in a dedicated development environment.

---

## Workspace Model

### Protected Baseline

| Attribute | Value |
|-----------|-------|
| **Current path** | `C:\Users\Richa\Desktop\DevPulse-V2` |
| **Recommended rename** | `C:\Users\Richa\Desktop\AiDevEngine-Protected-Baseline` |
| **Role** | Recovery, comparison, rollback, historical reference |
| **Development** | **Prohibited** — read-only reference |
| **Updates** | Only after validated milestones (see below) |

### Development Workspace

| Attribute | Value |
|-----------|-------|
| **Recommended path** | `C:\Users\Richa\Desktop\AiDevEngine-Development` |
| **Role** | All future engineering, refactoring, experimentation |
| **Updates** | Continuous — commit freely |
| **Cleanup** | Generated artifacts may be deleted per cleanup report |

---

## Phase 2 — Establishing the Protected Baseline

### Step 1: Snapshot current state

Before any cleanup or duplication:

1. Ensure all valuable engineering work is committed (or explicitly documented as in-progress)
2. Create the protected baseline copy:

```powershell
# Full copy including git history
Copy-Item -Recurse "C:\Users\Richa\Desktop\DevPulse-V2" "C:\Users\Richa\Desktop\AiDevEngine-Protected-Baseline"
```

3. Mark the protected copy as read-only reference (policy, not filesystem enforcement):

```powershell
# Optional: create a marker file
Set-Content "C:\Users\Richa\Desktop\AiDevEngine-Protected-Baseline\.PROTECTED-BASELINE" "Do not develop here. Reference only. Created 2026-07-06."
```

### Step 2: Protected baseline rules

- **No** feature development
- **No** refactoring
- **No** validator experiments
- **No** cleanup of generated artifacts (preserves historical state)
- **Yes** to: diff comparison, rollback source, milestone snapshots
- **Yes** to: running validators for evidence comparison (read-only assessment)

---

## Phase 3 — Creating the Development Workspace

### Step 1: Duplicate repository

```powershell
Copy-Item -Recurse "C:\Users\Richa\Desktop\DevPulse-V2" "C:\Users\Richa\Desktop\AiDevEngine-Development"
```

### Step 2: Clean development workspace (optional, recommended)

Follow `03-CLEANUP-RECOMMENDATION-REPORT.md` in the development copy only:

1. Delete `.generated-builder-workspaces/` (~16.6 GB)
2. Delete stale `.aidev-projects/` instances
3. Delete validator proof dot-directories
4. Apply `.gitignore` and `.cursorignore` improvements
5. Run `npm install`
6. Run core validators to confirm health

### Step 3: Point Cursor to development workspace

Open `C:\Users\Richa\Desktop\AiDevEngine-Development` as the primary Cursor workspace. Keep the protected baseline closed unless comparing.

### Step 4: Git remote (optional)

Both copies share the same git history. Development workspace continues on `main` or a dedicated `development` branch. Protected baseline stays pinned at milestone commits.

---

## Milestone-Based Baseline Updates

The protected baseline is updated **only** after validated milestones:

| Milestone | Trigger | Validation required |
|-----------|---------|---------------------|
| Constitutional completion | APOP + AEP fully validated | `validate:constitutional-architecture-v1`, `validate:aep-compliance-audit` |
| Major engine implementation | New authority/engine shipped | Engine-specific validator PASS |
| Release candidate | All core validators green | Full validator suite |
| Cloud milestone | Cloud execution path validated | Cloud execution validators |
| Launch readiness milestone | Launch council passes | Launch readiness + founder testing validators |

### Baseline update procedure

1. Development workspace reaches milestone — all required validators pass
2. Commit and tag: `git tag baseline-vX.Y-milestone-name`
3. Copy development workspace over protected baseline (or reset protected to tag)
4. Document milestone in `architecture/engineering-protection-audit/BASELINE-MILESTONES.md`

---

## Phase 7 — Development Policy Rules

1. **All engineering happens in `AiDevEngine-Development`** — never in the protected baseline
2. **Commit frequently** — 102 uncommitted `src/` files is unacceptable risk
3. **Run validators before merging milestones** — evidence-driven, not assumption-driven
4. **Clean generated artifacts monthly** — prevent 16 GB recurrence
5. **Never commit generated projects** — expand `.gitignore` to exclude `.aidev-projects/`, proof dirs
6. **Tag milestones** — protected baseline updates are tagged events, not casual copies
7. **Compare, don't mutate** — use `diff` against protected baseline for regression analysis

---

## Phase 8 — Engineering Safety Rules

```
Large refactor planned
        ↓
Work in Development workspace only
        ↓
Run affected validators
        ↓
Run regression validators (E2E, typecheck, constitutional)
        ↓
Milestone passes
        ↓
Tag + update Protected Baseline
```

**Never:**
- Experiment directly on protected baseline
- Delete source to "clean up"
- Skip validation before baseline update
- Force-push to protected baseline remote (if shared)

**Always:**
- Keep protected baseline copyable in <5 minutes (exclude 16 GB artifacts)
- Document what changed at each milestone
- Preserve constitutional documents in both workspaces

---

## Naming Convention

| Item | Name | Notes |
|------|------|-------|
| Protected folder | `AiDevEngine-Protected-Baseline` | Enclosing folder only |
| Development folder | `AiDevEngine-Development` | Enclosing folder only |
| Inside repo | No renames | `src/`, engines, modules unchanged |
| Git remote | Unchanged | Same repository origin |

---

## Current State Action Items

| # | Action | Priority |
|---|--------|----------|
| 1 | Commit 102 modified `src/` files in dev workspace | **Critical** |
| 2 | Create protected baseline copy | **High** |
| 3 | Create development workspace copy | **High** |
| 4 | Clean generated artifacts in dev copy only | **High** |
| 5 | Apply ignore strategy (report 06) | **Medium** |
| 6 | Open Cursor on development workspace | **Medium** |
