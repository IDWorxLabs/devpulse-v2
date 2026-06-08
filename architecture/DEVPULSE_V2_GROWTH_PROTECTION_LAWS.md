# DevPulse V2 — Growth Protection Laws

**Authority:** GF7 OMEGA Constitution V1  
**Scope:** Module size, dependencies, architecture drift, complexity, and anti-monolith enforcement

---

## Purpose

V1 grew by patch-over-patch connect modules, manifest inflation (92 scripts in one runtime group), and duplicate prevention reports that were advisory only. These laws make growth **measurable, bounded, and reversible**.

---

## LAW G-1 — Module Size Limits

| Metric | Limit | Action on exceed |
|--------|-------|------------------|
| Lines per module | 400 | Mandatory extraction before merge |
| Lines per module (hard) | 600 | **Merge blocked** |
| Functions per module | 25 | Extract helpers to owned submodules |
| Eager manifest modules (Phase 0) | 6 | **Merge blocked** |
| Lazy group size | 20 | Split into subgroups |
| Lazy group size (hard) | 50 | **Merge blocked** |

**V1 violation:** Monolithic cognition architecture layers, oversized control center modules, 92-script runtime groups.

---

## LAW G-2 — Extraction Requirements

When a module approaches 300 lines or acquires a second domain concern, extraction is **mandatory** — not optional refactoring.

### Extraction triggers (any one)

1. Module serves two registry domains
2. Module contains both UI render and business logic
3. Module adds a "connect" or "bridge" suffix
4. Module imports from more than 5 sibling modules
5. Module adds synchronous work > 16 ms

### Extraction rules

- Extracted module gets registry entry
- Parent module becomes thin coordinator only
- No extraction via copy-paste — move and update imports
- Extracted modules must pass ownership review

**Prohibited V1 pattern:** `*_connect_v15.js` through `*_connect_v20.js` — sequential connect modules instead of extraction.

---

## LAW G-3 — Dependency Rules

| Rule | Detail |
|------|--------|
| Acyclic dependencies | Circular imports **blocked** by CI |
| Max depth | 4 levels from entry point |
| Max fan-out | 8 direct imports per module |
| Upward imports prohibited | Lower layers cannot import UI/shell |
| Cross-domain imports | Require registry justification |
| Runtime dynamic import | Must register with Task Governor |

### Layer model (Phase 1)

```
Layer 0: Shell (render only)
Layer 1: Chat + Operator Feed (user-facing)
Layer 2: Task Governor (scheduling)
Layer 3: Answer authority (single module)
Layer 4+: PROHIBITED in Phase 1
```

Higher layers may not exist until phase gate passed.

---

## LAW G-4 — Architecture Drift Detection

Automated drift detection runs on every PR.

| Signal | Detection method | Threshold |
|--------|------------------|-----------|
| Manifest inflation | Count eager/lazy modules vs baseline | +1 eager = fail |
| New global binding | Scan for `window.__DEVPULSE_*` additions | Must be in registry |
| New connect module | Filename pattern `*connect*` | **Auto-fail** |
| Duplicate domain | Registry competitor scan | Any duplicate = fail |
| Sync script tag after Phase 0 | HTML/template scan | **Auto-fail** |
| Validator path fork | Entry point comparison | Mismatch = fail |

Drift report published as PR comment. Two drift failures in one sprint trigger architecture review.

---

## LAW G-5 — Complexity Scoring

Each module receives a complexity score on PR:

| Factor | Points |
|--------|--------|
| Lines > 200 | +2 per 100 lines |
| Functions > 15 | +3 |
| Cyclomatic complexity > 10 per function | +5 |
| Cross-domain imports | +5 each |
| Sync work registration | +10 |
| Global state write | +3 each |
| Missing registry entry | +20 |

| Score | Action |
|-------|--------|
| 0–10 | Normal merge |
| 11–20 | Review required |
| 21–30 | Extraction plan required before merge |
| 31+ | **Merge blocked** |

---

## LAW G-6 — Ownership Tracking

Growth protection integrates with Ownership Registry.

| Event | Registry action |
|-------|-----------------|
| New module | Add entry before merge |
| Module extraction | Update entries, mark `supersedes` |
| Module deletion | Remove entry, verify no orphan imports |
| Phase promotion | Add phase field, verify prior phase stable |
| Connect attempt | **Reject** — no registry entry allowed for connect pattern |

---

## LAW G-7 — Growth Warning Thresholds

| Metric | Warning | Block |
|--------|---------|-------|
| Total V2 modules | 20 | 30 |
| Total V2 lines | 8000 | 12000 |
| Lazy groups | 3 | 5 |
| Globals (`__DEVPULSE_V2_*`) | 15 | 25 |
| Browser test count | — | Must increase with each new owner |
| Startup module count | 6 | 6 (hard) |

Warnings require written justification in PR. Blocks are automatic.

---

## LAW G-8 — No Patch-Over-Patch Growth

| Prohibited pattern | Required alternative |
|--------------------|---------------------|
| New connect module per feature | Extend owned module or extract |
| `#if` feature flags for competing paths | Single path, registry amendment |
| "Safe" duplicate for rollback | Git revert, not parallel code |
| Lazy group extension without split | Split when group > 20 |
| Validator-only fix | Browser-first fix |

**V1 violation:** V15–V20 connect reports each extended `safe_real_main_route_runtime_v11` with 4–7 scripts rather than restructuring.

---

## LAW G-9 — Phase Boundary Enforcement

Code for future phases is **prohibited** in the repository until prior phase stability gate passes.

| Phase 1 repo must NOT contain | Enforcement |
|--------------------------------|-------------|
| UVL modules | Directory scan |
| Project Vault modules | Directory scan |
| Replay modules | Directory scan |
| World 2 builder | Directory scan |
| Console intelligence | Directory scan |
| Mobile command | Directory scan |

Stubs and placeholders are also prohibited — they become drift vectors.

---

## LAW G-10 — Complexity Debt Ledger

File: `architecture/COMPLEXITY_DEBT.md` (maintained per sprint)

Tracks:
- Modules over 300 lines with extraction deadline
- Open drift violations
- Deferred extractions with owner and date
- Phase gate blockers

Debt items unresolved after 2 sprints block new feature work.

---

## Verification Requirements

Every PR must pass:

1. Module size scan
2. Dependency acyclicity check
3. Complexity score under threshold
4. Drift detection clean
5. Registry completeness
6. Phase boundary scan (no forbidden directories)

---

## Related Documents

- `DEVPULSE_V2_OWNERSHIP_LAWS.md` — Registry requirements
- `DEVPULSE_V2_STARTUP_LAWS.md` — Eager manifest limits
- `DEVPULSE_V2_REBUILD_BLUEPRINT.md` — Phase stability gates
