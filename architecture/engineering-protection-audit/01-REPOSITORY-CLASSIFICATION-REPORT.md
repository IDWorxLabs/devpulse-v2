# Repository Classification Report

**Operation:** AiDevEngine Safe Branch Reset & Protected Development Workspace  
**Audit date:** 2026-07-06  
**Repository path:** `C:\Users\Richa\Desktop\DevPulse-V2`  
**Git branch:** `main`  
**Latest commit:** `5c8b8f7` — *Complete Era 3 Autonomous Software Engineering Engine* (2026-06-26)  
**Audit mode:** Read-only classification — no files modified or deleted

---

## Executive Snapshot

| Metric | Value |
|--------|-------|
| Approximate total size | **~16.4 GB** |
| Git tracked files (index) | **7,435** |
| Working tree changes | **1,109** entries |
| — Untracked (`??`) | 612 |
| — Deleted (`D`) | 364 |
| — Modified (`M`) | 133 |
| `src/` subsystems | **464** directories |
| Validator scripts (`scripts/validate-*.ts`) | **612** |
| `package.json` validate entries | **~825** |
| Architecture documents | **378** files |

---

## Category Definitions

| Category | Description |
|----------|-------------|
| **Engineering Source** | Hand-written TypeScript/JavaScript, server code, validators, engines — the durable engineering platform |
| **Constitutional & Architecture Docs** | Governance, APOP, constitutional architecture, validation reports |
| **Generated Projects** | Materialized app workspaces under `.aidev-projects/` |
| **Generated Builder Workspaces** | Ephemeral builder sandboxes under `.generated-builder-workspaces/` |
| **Generated History** | Build/validation history artifacts |
| **Temporary Runtime** | Preview sessions, E2E runs, replay buffers |
| **Cloud Queue** | Cloud execution path queue and completed items |
| **Validation Output** | Dot-prefixed audit proof runs, validation runtime artifacts |
| **Runtime Registries** | `.aidevengine*`, project registry JSON |
| **Logs** | `*.log` files |
| **Caches** | `node_modules`, Playwright browsers, dist/build |
| **Dependencies** | `node_modules` (regenerable via `npm install`) |

---

## Top-Level Classification

### Engineering Source (PRESERVE — never delete)

| Path | Size | Files | Role |
|------|------|-------|------|
| `src/` | ~22 MB | ~5,152 | **464 engineering subsystems** — engines, authorities, validators, runtime |
| `scripts/` | ~8.9 MB | ~668 | Validation harnesses, operational scripts |
| `server/` | ~0.3 MB | ~48 | Founder reality server, HTTP runtime |
| `public/` | ~0.9 MB | ~19 | Static UI assets |
| `package.json` | — | 1 | Script registry (~825 validators), dependencies |
| `tsconfig.json` | — | — | TypeScript configuration |

**Modified engineering source (133 total changes):**

| Prefix | Modified count |
|--------|----------------|
| `src/` | 102 |
| `scripts/` | 9 |
| `server/` | 5 |
| `public/` | 4 |
| `package.json` | 1 |
| `.generated-build-history/` | 12 |

These modifications represent **active in-progress engineering** not yet committed to the protected baseline.

---

### Constitutional & Architecture Docs (PRESERVE)

| Path | Size | Files | Role |
|------|------|-------|------|
| `architecture/` | ~1.7 MB | 378 | Constitutional architecture, APOP, validation reports, audit trails |

**Untracked architecture docs (5):** Recent validation and audit reports added since last commit.

Key constitutional assets:

- `architecture/AIDEVENGINE_CONSTITUTIONAL_ARCHITECTURE_V1.md` — APOP doctrine
- `architecture/DEVPULSE_V2_CONSTITUTION.md`
- `scripts/validate-constitutional-architecture-v1.ts`

---

### Generated Projects (REGENERABLE — safe to archive/delete in dev workspace)

| Path | Size | Files | Subdirs | Role |
|------|------|-------|---------|------|
| `.aidev-projects/` | ~24 MB | ~9,701 | 146 | Materialized generated apps (calculator, LISA, build-readiness runs, etc.) |

**Git status:**

- **355 deleted** tracked entries (projects removed from index but history may remain on disk)
- **146 untracked** new project directories

Each subdirectory is a self-contained generated app with `source/`, `.aidev/`, manifests, and feature modules.

---

### Generated Builder Workspaces (REGENERABLE — primary cleanup target)

| Path | Size | Files | Subdirs | Role |
|------|------|-------|---------|------|
| `.generated-builder-workspaces/` | **~16.6 GB** | **~730,545** | **4,414** | Ephemeral builder sandboxes from autonomous build runs |

**This single directory accounts for >99% of repository disk usage.**

Already listed in `.gitignore` but physically present on disk. Safe to delete in development workspace after confirming no active build references them.

---

### Generated History (REGENERABLE — archive candidate)

| Path | Size | Files | Subdirs | Role |
|------|------|-------|---------|------|
| `.generated-build-history/` | ~13 MB | ~1,098 | 157 | Historical build execution records |

**Git status:** 159 untracked, 7 deleted, 12 modified entries.

---

### Temporary Runtime / E2E Artifacts

| Path | Size | Files | Subdirs | Role |
|------|------|-------|---------|------|
| `.end-to-end-build-reality/` | ~0.5 MB | 207 | 56 | E2E build reality run artifacts |
| `.cloud-execution-path-v1/` | ~1.0 MB | 1,324 | 2 | Cloud execution queue and completed items |
| `.direct-build-proof/` | ~1.3 MB | 12 | — | Direct build proof snapshots |
| `.world2-real-instantiation-v1/` | ~0.2 MB | 127 | — | World2 disposable workspace runs |

---

### Validation Output / Audit Proof Runs (REGENERABLE)

57 dot-prefixed directories at repository root. These store validator execution evidence, not source:

| Directory | Approx size | Purpose |
|-----------|-------------|---------|
| `.aidevengine/` | 0.15 MB | Primary runtime registry |
| `.aidevengine-audit/` | small | Audit registry (78 projects) |
| `.aidevengine-system/` | small | System registry |
| `.aidevengine-build-proof-v1` through `v1-4` | small | Build proof runs |
| `.aidevengine-multi-domain-build-proof-v1*` | small | Multi-domain proof |
| `.validation-runtime-audit-v1/` | 0.66 MB | Validation runtime audit |
| `.validation-runtime-governance-v1/` | 0.21 MB | Validation governance |
| `.capability-audit-v1` through `v3-1` | small | Capability audit outputs |
| `.strategic-capability-audit-v4` | small | Strategic audit |
| `.uvl-verification-execution-v1` | small | UVL verification runs |
| `.unified-verification-lab-v1` | small | UVL lab runs |
| `.feature-reality-validation` | small | Feature reality runs |
| `.engineering-reality-authority` | small | Engineering reality runs |
| `.mobile-runtime-preview-v1/v2` | small | Mobile preview runs |
| `.production-readiness-gate-v1` | small | Production readiness gate |
| `.real-build-execution-pipeline-v1*` | small | Real build pipeline proof |
| `.self-evolution-execution-v1` | small | Self-evolution runs |
| *(+ ~35 more audit/proof directories)* | small | Various validator proof artifacts |

Full list of dot-directories (57 total): see Appendix A.

---

### Caches & Dependencies (REGENERABLE)

| Path | Size | Regeneration |
|------|------|--------------|
| `node_modules/` | ~53 MB | `npm install` |
| `.playwright/` | (if present) | `npx playwright install chromium` |
| `dist/`, `build/`, `coverage/` | (if present) | Build commands |

---

### Git Metadata (PRESERVE in baseline)

| Path | Size | Files |
|------|------|-------|
| `.git/` | ~19 MB | ~3,226 |

Contains full commit history. Must be preserved in protected baseline copy.

---

## Working Tree Change Summary

### Untracked files by prefix (612 total)

| Prefix | Count |
|--------|-------|
| `.generated-build-history/` | 159 |
| `.aidev-projects/` | 146 |
| `.cloud-execution-path-v1/` | 134 |
| `scripts/` | 85 |
| `src/` | 53 |
| `public/` | 14 |
| `server/` | 11 |
| `architecture/` | 5 |
| Other dot-runtime dirs | 5 |

### Deleted tracked files by prefix (364 total)

| Prefix | Count |
|--------|-------|
| `.aidev-projects/` | 355 |
| `.generated-build-history/` | 7 |
| `.cloud-execution-path-v1/` | 2 |

These deletions indicate **registry churn** — projects removed from git tracking while new ones were created untracked.

---

## Appendix A — All Dot-Prefixed Directories

```
.aee-profile-continuation-unit
.afla-trust-calibration-v1
.aidevengine
.aidevengine-audit
.aidevengine-build-proof-v1
.aidevengine-build-proof-v1-1
.aidevengine-build-proof-v1-2
.aidevengine-build-proof-v1-3
.aidevengine-build-proof-v1-4
.aidevengine-multi-domain-build-proof-v1
.aidevengine-multi-domain-build-proof-v1-1
.aidevengine-system
.aidev-projects
.autonomous-founder-launch-authority
.blueprint-visual-validation
.build-pipeline-verification
.build-readiness-audit
.canonical-capability-ownership-v1
.canonical-ownership-v2
.capability-audit-v1
.capability-audit-v2
.capability-audit-v3
.capability-audit-v3-1
.cloud-execution-path-v1
.command-center-runtime-health
.continuous-deployment-pipeline-v1
.customer-operations-platform-v1
.direct-build-proof
.end-to-end-build-reality
.engineering-reality-authority
.evidence-revalidation-cycle-v1
.feature-reality-validation
.general-purpose-code-generation-gap-investigation
.general-purpose-code-generation-v1
.generated-builder-workspaces
.generated-build-history
.large-scale-multi-app-validation
.large-scale-pipeline-integration-v1
.mobile-runtime-preview-v1
.mobile-runtime-preview-v2
.mobile-runtime-validation-at-scale-v1
.multi-project-concurrent-execution-v1
.operational-evidence-freshness-authority-v1
.product-architect-intelligence-v1
.production-observability-platform-v1
.production-readiness-gate-v1
.real-build-execution-pipeline-v1
.real-build-execution-pipeline-v1-1
.self-evolution-execution-v1
.strategic-audit-roadmap-consistency-repair-v1
.strategic-capability-audit-v4
.unified-failure-escalation-authority-v1
.unified-verification-lab-v1
.universal-feature-contract-intelligence
.uvl-verification-execution-v1
.validation-runtime-audit-v1
.validation-runtime-governance-v1
.world2-real-instantiation-v1
```

---

## Classification Verdict

The repository is a **dual-nature workspace**:

1. **~56 MB of durable engineering assets** (`src/`, `scripts/`, `server/`, `architecture/`, `public/`)
2. **~16.6 GB of regenerable runtime artifacts** (primarily `.generated-builder-workspaces/`)

The protected baseline must preserve category 1 entirely. Category 2 can be excluded or regenerated in the development workspace.
