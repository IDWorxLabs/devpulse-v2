# Cleanup Recommendation Report

**Audit date:** 2026-07-06  
**Scope:** Development workspace only — **no automatic deletion performed**  
**Protected baseline:** Must not be cleaned without explicit milestone approval

---

## Principles

1. **Never delete** engineering source, architecture, validators, engines, prompts, or documentation.
2. **Only recommend deletion** for reproducible, regenerable artifacts.
3. **Confirm no active build** references a path before deleting builder workspaces.
4. **Archive before delete** if historical comparison value exists.

---

## Recommended Cleanup Actions (Development Workspace)

### Priority 1 — Immediate (~16.6 GB recovery)

| Target | Action | Recovery | Risk |
|--------|--------|----------|------|
| `.generated-builder-workspaces/` | **Delete entire directory** | Automatic on next build run | None to source. In-flight builds only. |

**Command (manual, dev workspace only):**
```powershell
Remove-Item -Recurse -Force ".generated-builder-workspaces"
```

**Expected result:** Repository drops from ~16.4 GB to ~56 MB of engineering assets + node_modules.

---

### Priority 2 — High (~24 MB recovery)

| Target | Action | Recovery | Risk |
|--------|--------|----------|------|
| `.aidev-projects/` (all 146 instances) | Delete all OR keep 2–3 reference projects | Re-materialize from prompts | Loss of specific generated app instances |

**Recommended retention (optional):**
- One calculator project (build reality regression)
- One complex multi-feature project (if needed for E2E)

**Delete remainder:**
```powershell
# After identifying reference projects to keep:
Get-ChildItem ".aidev-projects" -Directory | Where-Object { $_.Name -notin @('reference-calculator', 'reference-complex') } | Remove-Item -Recurse -Force
```

---

### Priority 3 — Medium (~14 MB recovery)

| Target | Action | Recovery |
|--------|--------|----------|
| `.generated-build-history/` | Delete | Rebuilt by build pipeline |
| `.end-to-end-build-reality/` | Delete | Rebuilt by E2E validator runs |
| `.cloud-execution-path-v1/` | Delete completed queue items | Rebuilt by cloud execution |
| `.direct-build-proof/` | Delete | Rebuilt by proof validators |
| `.world2-real-instantiation-v1/` | Delete | Rebuilt by World2 runs |

---

### Priority 4 — Low (<5 MB combined, high count)

| Target | Action | Recovery |
|--------|--------|----------|
| All 57 dot-prefixed validator proof directories | Delete all | Re-run corresponding `validate:*` scripts |
| `.aidevengine-audit/` proof artifacts | Delete (keep registry if needed) | Re-hydrated on startup |
| `.playwright/` cache | Delete if present | `npx playwright install chromium` |

**Bulk pattern (review list before executing):**
```powershell
Get-ChildItem -Force -Directory | Where-Object { $_.Name -match '^\.' -and $_.Name -notin @('.git', '.aidevengine', '.aidevengine-audit', '.aidevengine-system') } | ForEach-Object { Write-Host $_.Name }
```

---

### Priority 5 — Git Hygiene (no file deletion)

| Issue | Count | Recommendation |
|-------|-------|----------------|
| Untracked files | 612 | Commit engineering changes; ignore generated dirs |
| Deleted tracked files | 364 | Run `git add -A` in dev workspace to reconcile project churn |
| Modified uncommitted | 133 | Commit or stash before baseline snapshot |

---

## Never Delete

| Category | Paths |
|----------|-------|
| Engineering source | `src/`, `scripts/`, `server/`, `public/` |
| Configuration | `package.json`, `tsconfig.json`, `package-lock.json` |
| Constitutional docs | `architecture/` |
| Git history | `.git/` |
| Environment template | `.env.example` (if present) |
| Active runtime registry | `.aidevengine/project-registry-v1.json` (unless intentional clean-start) |

---

## Estimated Recovery

| Action | Space recovered |
|--------|-----------------|
| Delete `.generated-builder-workspaces/` | ~16.6 GB |
| Delete `.aidev-projects/` | ~24 MB |
| Delete history + proof dirs | ~20 MB |
| Delete `node_modules/` + reinstall | ~53 MB (temporary) |
| **Total potential** | **~16.65 GB** |

Post-cleanup expected workspace size: **~60–120 MB** (source + node_modules + active registry).

---

## Cleanup Sequence (Recommended Order)

1. Commit or stash all engineering changes in dev workspace
2. Confirm no active builds running (check command center / processes)
3. Delete `.generated-builder-workspaces/`
4. Delete `.aidev-projects/` (except reference projects)
5. Delete `.generated-build-history/` and E2E artifacts
6. Delete validator proof dot-directories
7. Run `npm install` if node_modules was removed
8. Run core validators to regenerate essential proof artifacts:
   - `npm run validate:constitutional-architecture-v1`
   - `npm run validate:end-to-end-build-reality-engine-v1`
   - `npm run validate:repo-typecheck-stabilization-authority-v1`
9. Verify command center startup and project registry hydration

---

## Cleanup NOT Recommended

| Target | Reason |
|--------|--------|
| `src/` any subdirectory | Engineering source |
| `architecture/` | Constitutional and audit documentation |
| `scripts/validate-*.ts` | Validation authorities |
| `.git/` | History and rollback capability |
| Uncommitted `src/` changes (102 files) | Active engineering work in progress |
