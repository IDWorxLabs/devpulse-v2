# Safe Ignore Recommendations

**Audit date:** 2026-07-06  
**Scope:** `.gitignore`, `.cursorignore`, and indexing exclusions  
**No files modified during audit** — recommendations only

---

## Current State

### `.gitignore` (9 entries)

```
node_modules/
dist/
build/
coverage/
.playwright/
.generated-builder-workspaces/
.aidevengine/
*.log
.env
```

### `.cursorignore`

**Does not exist.** Cursor indexes all 752,000 files including 730,000 in builder workspaces.

### Gaps

| Gap | Impact |
|-----|--------|
| `.aidev-projects/` not ignored | 612 untracked entries pollute git status |
| 57 validator proof dot-dirs not ignored | Hundreds of untracked proof artifacts |
| `.aidevengine-audit/`, `.aidevengine-system/` not ignored | Registry churn in git status |
| `.generated-build-history/` not ignored | 159 untracked entries |
| `.cloud-execution-path-v1/` not ignored | 134 untracked entries |
| No `.cursorignore` | Cursor indexes 730K builder workspace files |

---

## Recommended `.gitignore` Additions

Append to existing `.gitignore`:

```gitignore
# ── Generated projects & materialized apps ──
.aidev-projects/

# ── Build & validation history ──
.generated-build-history/
.end-to-end-build-reality/
.cloud-execution-path-v1/
.direct-build-proof/
.world2-real-instantiation-v1/

# ── Runtime registries (regenerated on startup) ──
.aidevengine-audit/
.aidevengine-system/

# ── Validator proof / audit run artifacts ──
.aee-profile-continuation-unit/
.afla-trust-calibration-v1/
.aidevengine-build-proof-v1/
.aidevengine-build-proof-v1-*/
.aidevengine-multi-domain-build-proof-v1/
.aidevengine-multi-domain-build-proof-v1-*/
.autonomous-founder-launch-authority/
.blueprint-visual-validation/
.build-pipeline-verification/
.build-readiness-audit/
.canonical-capability-ownership-v1/
.canonical-ownership-v2/
.capability-audit-v1/
.capability-audit-v2/
.capability-audit-v3/
.capability-audit-v3-1/
.command-center-runtime-health/
.continuous-deployment-pipeline-v1/
.customer-operations-platform-v1/
.engineering-reality-authority/
.evidence-revalidation-cycle-v1/
.feature-reality-validation/
.general-purpose-code-generation-gap-investigation/
.general-purpose-code-generation-v1/
.large-scale-multi-app-validation/
.large-scale-pipeline-integration-v1/
.mobile-runtime-preview-v1/
.mobile-runtime-preview-v2/
.mobile-runtime-validation-at-scale-v1/
.multi-project-concurrent-execution-v1/
.operational-evidence-freshness-authority-v1/
.product-architect-intelligence-v1/
.production-observability-platform-v1/
.production-readiness-gate-v1/
.real-build-execution-pipeline-v1/
.real-build-execution-pipeline-v1-*/
.self-evolution-execution-v1/
.strategic-audit-roadmap-consistency-repair-v1/
.strategic-capability-audit-v4/
.unified-failure-escalation-authority-v1/
.unified-verification-lab-v1/
.universal-feature-contract-intelligence/
.uvl-verification-execution-v1/
.validation-runtime-audit-v1/
.validation-runtime-governance-v1/

# ── OS & editor ──
.DS_Store
Thumbs.db
*.swp
*.swo
```

**Alternative (simpler):** Use a catch-all for dot-directories with exceptions:

```gitignore
# Ignore all dot-directories except essential runtime registries
.a*/
!.aidevengine/
```

> Note: Test this pattern carefully — `!.aidevengine/` preserves the primary registry while ignoring all other dot-prefixed runtime artifacts.

---

## Recommended `.cursorignore` (New File)

Create `.cursorignore` at repository root:

```cursorignore
# ── Dependencies ──
node_modules/

# ── Generated builder sandboxes (730K files) ──
.generated-builder-workspaces/

# ── Generated materialized projects ──
.aidev-projects/

# ── Build & validation history ──
.generated-build-history/
.end-to-end-build-reality/
.cloud-execution-path-v1/

# ── Playwright browser cache ──
.playwright/

# ── Build output ──
dist/
build/
coverage/

# ── All validator proof / audit dot-directories ──
.aee-profile-continuation-unit/
.afla-trust-calibration-v1/
.aidevengine-audit/
.aidevengine-system/
.aidevengine-build-proof-v1/
.aidevengine-build-proof-v1-*/
.aidevengine-multi-domain-build-proof-v1/
.aidevengine-multi-domain-build-proof-v1-*/
.autonomous-founder-launch-authority/
.blueprint-visual-validation/
.build-pipeline-verification/
.build-readiness-audit/
.canonical-capability-ownership-v1/
.canonical-ownership-v2/
.capability-audit-v1/
.capability-audit-v2/
.capability-audit-v3/
.capability-audit-v3-1/
.command-center-runtime-health/
.continuous-deployment-pipeline-v1/
.customer-operations-platform-v1/
.direct-build-proof/
.engineering-reality-authority/
.evidence-revalidation-cycle-v1/
.feature-reality-validation/
.general-purpose-code-generation-gap-investigation/
.general-purpose-code-generation-v1/
.large-scale-multi-app-validation/
.large-scale-pipeline-integration-v1/
.mobile-runtime-preview-v1/
.mobile-runtime-preview-v2/
.mobile-runtime-validation-at-scale-v1/
.multi-project-concurrent-execution-v1/
.operational-evidence-freshness-authority-v1/
.product-architect-intelligence-v1/
.production-observability-platform-v1/
.production-readiness-gate-v1/
.real-build-execution-pipeline-v1/
.real-build-execution-pipeline-v1-*/
.self-evolution-execution-v1/
.strategic-audit-roadmap-consistency-repair-v1/
.strategic-capability-audit-v4/
.unified-failure-escalation-authority-v1/
.unified-verification-lab-v1/
.universal-feature-contract-intelligence/
.uvl-verification-execution-v1/
.validation-runtime-audit-v1/
.validation-runtime-governance-v1/
.world2-real-instantiation-v1/

# ── Logs ──
*.log

# ── Environment secrets ──
.env
.env.local
```

---

## What Must NOT Be Ignored

| Path | Reason |
|------|--------|
| `src/` | Engineering source — must remain indexed |
| `scripts/` | Validators — must remain indexed |
| `server/` | Runtime server — must remain indexed |
| `architecture/` | Constitutional docs — must remain indexed |
| `public/` | UI assets |
| `package.json` | Dependencies and script registry |
| `tsconfig.json` | TypeScript config |
| `.aidevengine/` | Active runtime registry (optional — small, may keep indexed) |

---

## Expected Impact

| Improvement | Before | After |
|-------------|--------|-------|
| Git untracked count | 612 | ~50 (engineering only) |
| Cursor indexed files | ~752,000 | ~12,000–15,000 |
| Cursor startup time | Slow | Fast |
| AI search relevance | Noisy (generated code) | Engineering source only |
| `git status` speed | Slow | Fast |

---

## Implementation Order

1. Create `.cursorignore` first — immediate Cursor improvement, zero risk
2. Expand `.gitignore` — reduces git noise
3. Run `git status` to verify untracked count drops
4. Optionally run `git rm -r --cached` on previously tracked generated dirs (dev workspace only)

---

## VS Code / Cursor Settings (Optional)

Add to workspace settings if needed:

```json
{
  "files.watcherExclude": {
    "**/.generated-builder-workspaces/**": true,
    "**/.aidev-projects/**": true,
    "**/node_modules/**": true
  },
  "search.exclude": {
    "**/.generated-builder-workspaces": true,
    "**/.aidev-projects": true,
    "**/node_modules": true
  }
}
```
