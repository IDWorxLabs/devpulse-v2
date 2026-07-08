# Generated Artifact Report

**Audit date:** 2026-07-06  
**Repository:** `DevPulse-V2`

---

## Purpose

Identify all runtime-generated content, assess regenerability, and distinguish artifacts from engineering source.

---

## Tier 1 — Critical Volume (Immediate Health Impact)

### `.generated-builder-workspaces/`

| Attribute | Value |
|-----------|-------|
| Disk usage | **~16,684 MB (~16.6 GB)** |
| File count | **~730,545** |
| Subdirectories | **4,414** |
| Git tracked | No (`.gitignore` entry exists) |
| Regenerable | **Yes** — recreated by builder/materialization runs |
| Contains source | No — ephemeral sandbox copies |

**Nature:** Each subdirectory is a disposable workspace created during autonomous build, code generation, or validation runs. Contents mirror generated app structures with `node_modules` fragments, build outputs, and intermediate files.

**Risk if deleted:** None to engineering source. Active in-flight builds referencing a specific workspace path would fail; no persistent engineering state lives here.

**Recommendation:** Primary cleanup target for development workspace. Archive or delete entirely.

---

## Tier 2 — Generated Project Instances

### `.aidev-projects/`

| Attribute | Value |
|-----------|-------|
| Disk usage | ~24 MB |
| File count | ~9,701 |
| Subdirectories | 146 |
| Git tracked | Partially (355 deletions in working tree, 146 new untracked) |
| Regenerable | **Yes** — recreated by materialization engine |
| Contains source | Generated app source (not platform source) |

**Nature:** Persistent materialized projects (calculator, LISA, expense-tracker, build-readiness runs). Each contains:

- `source/` — generated React/TS app
- `.aidev/` — manifests, audit logs, snapshots
- `project.json` — project metadata

**Risk if deleted:** Loss of specific generated app instances, not platform engineering. Can be regenerated from prompts/contracts.

**Recommendation:** Safe to delete in dev workspace. Optionally preserve a small set of reference projects (1 calculator, 1 complex app) for regression testing.

---

## Tier 3 — Build & Validation History

### `.generated-build-history/`

| Attribute | Value |
|-----------|-------|
| Disk usage | ~13 MB |
| File count | ~1,098 |
| Subdirectories | 157 |
| Regenerable | **Yes** |

**Nature:** Historical records of build executions, linked by build IDs.

### `.end-to-end-build-reality/`

| Attribute | Value |
|-----------|-------|
| Disk usage | ~0.5 MB |
| Subdirectories | 56 |
| Regenerable | **Yes** |

**Nature:** E2E build reality DOM snapshots, Playwright evidence, preview authority audit results.

---

## Tier 4 — Cloud & Queue Artifacts

### `.cloud-execution-path-v1/`

| Attribute | Value |
|-----------|-------|
| Disk usage | ~1.0 MB |
| File count | ~1,324 |
| Subdirectories | 2 (queue + completed) |
| Regenerable | **Yes** |

**Nature:** Cloud execution queue items and completed execution records.

---

## Tier 5 — Validator Proof Runs (57 dot-directories)

Each `.`-prefixed audit directory stores **evidence from a specific validator execution**. Examples:

| Directory | Regenerable via |
|-----------|-----------------|
| `.aidevengine-build-proof-v1*` | `npm run validate:aidevengine-build-proof-v1` |
| `.capability-audit-v1/v2/v3*` | Capability audit validators |
| `.validation-runtime-audit-v1` | Validation runtime audit |
| `.uvl-verification-execution-v1` | UVL verification |
| `.feature-reality-validation` | Feature reality validation |
| `.engineering-reality-authority` | Engineering reality |
| `.mobile-runtime-preview-v1/v2` | Mobile preview validation |
| `.production-readiness-gate-v1` | Production readiness gate |

**Total estimated size:** <5 MB combined (excluding builder workspaces and aidev-projects).

**Regenerable:** Yes — each is reproduced by running its corresponding `validate:*` script.

**Recommendation:** Safe to delete all proof-run directories. Re-run validators to regenerate evidence when needed.

---

## Tier 6 — Runtime Registries

### `.aidevengine/`, `.aidevengine-audit/`, `.aidevengine-system/`

| Attribute | Value |
|-----------|-------|
| Combined size | <1 MB |
| Regenerable | **Partially** — rebuilt on startup via project-registry hydration |
| Contains | `project-registry-v1.json`, runtime state |

**Nature:** Active runtime registries tracking projects, sessions, and audit state.

**Risk if deleted:** Command center startup will re-hydrate from persistent stores. Some session continuity may be lost.

**Recommendation:** Do not delete during active development unless performing a clean-start reset. Not a backup priority.

---

## Tier 7 — Standard Caches

| Path | Size | Regeneration |
|------|------|--------------|
| `node_modules/` | ~53 MB | `npm install` |
| `.playwright/` | varies | `npx playwright install chromium` |
| `dist/`, `build/` | varies | Build commands |
| `*.log` | varies | Runtime output |

---

## Artifact-to-Source Boundary

| Question | Answer |
|----------|--------|
| Does any generated artifact contain unique engineering source not in `src/`? | **No** |
| Are validators stored in generated dirs? | **No** — validators live in `scripts/` and `src/` |
| Are constitutional docs in generated dirs? | **No** — they live in `architecture/` |
| Can the platform function after deleting all Tier 1–5 artifacts? | **Yes** — with `npm install` and validator re-runs |

---

## Size Distribution Summary

```
.generated-builder-workspaces/  ████████████████████████████████  99.7%
.aidev-projects/                ░                                  0.15%
.generated-build-history/       ░                                  0.08%
node_modules/                   ░                                  0.32%
src/ + scripts/ + architecture/ ░                                  0.20%
Everything else                 ░                                  0.05%
```

---

## Conclusion

**16.6 GB of 16.4 GB total** is regenerable builder workspace debris. The engineering platform itself is approximately **56 MB** of source, scripts, and documentation.
