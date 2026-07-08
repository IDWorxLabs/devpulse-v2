# Workspace Health Report

**Audit date:** 2026-07-06  
**Repository:** `DevPulse-V2`

---

## Overall Health Assessment

| Dimension | Status | Detail |
|-----------|--------|--------|
| Engineering source integrity | **Healthy** | 464 subsystems, 612 validators, constitutional docs present |
| Disk usage | **Critical** | 16.4 GB total; 99.7% is regenerable artifacts |
| Git working tree | **Dirty** | 1,109 uncommitted changes |
| Indexing performance | **Degraded** | 730K+ files in builder workspaces |
| Cursor performance | **Likely impacted** | Massive file count in `.generated-builder-workspaces/` |
| Backup viability | **Poor** | Full copy takes ~16 GB; engineering assets are ~56 MB |

---

## Repository Size Breakdown

| Component | Size (MB) | % of total | Files |
|-----------|-----------|------------|-------|
| `.generated-builder-workspaces/` | 16,684 | 99.7% | 730,545 |
| `node_modules/` | 53 | 0.32% | 507 |
| `.aidev-projects/` | 24 | 0.15% | 9,701 |
| `src/` | 22 | 0.13% | 5,152 |
| `.git/` | 19 | 0.11% | 3,226 |
| `.generated-build-history/` | 13 | 0.08% | 1,098 |
| `scripts/` | 9 | 0.05% | 668 |
| `architecture/` | 2 | 0.01% | 378 |
| All other | ~5 | 0.03% | ~2,000 |
| **Total** | **~16,400** | 100% | **~752,000** |

---

## Largest Folders (Impact Ranking)

| Rank | Folder | Size | Indexing impact | Safe to archive |
|------|--------|------|-----------------|-----------------|
| 1 | `.generated-builder-workspaces/` | 16.6 GB | **Severe** | Yes |
| 2 | `node_modules/` | 53 MB | Moderate | Yes (reinstall) |
| 3 | `.aidev-projects/` | 24 MB | Moderate | Yes (partial keep) |
| 4 | `src/` | 22 MB | Normal | **No** |
| 5 | `.git/` | 19 MB | Normal | **No** |
| 6 | `.generated-build-history/` | 13 MB | Low | Yes |
| 7 | `scripts/` | 9 MB | Normal | **No** |

---

## Indexing Cost Analysis

### Current state

- **~752,000 files** on disk
- **~730,000 files** (97%) in a single ignored-but-present directory
- Cursor/VS Code file watcher must still traverse ignored directories unless excluded via `.cursorignore`
- Git status operations scan working tree — 1,109 changes add overhead

### Expected state after cleanup

- **~12,000–15,000 files** (src + scripts + node_modules + registries)
- Indexing time: estimated **50–100x improvement**
- Cursor AI context: more relevant results, less noise from generated sandboxes

---

## Cursor Performance Impact

| Factor | Current impact | Mitigation |
|--------|----------------|------------|
| 730K builder workspace files | High CPU/memory for indexing | Delete `.generated-builder-workspaces/` |
| No `.cursorignore` | Cursor indexes all generated content | Create `.cursorignore` (see report 06) |
| 464 `src/` subsystems | Normal — expected for this platform | No action needed |
| 612 validator scripts | Normal | No action needed |
| Dirty git tree (1,109 changes) | Slow git operations | Commit engineering work; ignore generated dirs |

---

## Folders Safe to Archive

These can be moved to cold storage (zip/external drive) before deletion if historical reference is desired:

| Folder | Archive value | Archive size |
|--------|---------------|--------------|
| `.generated-builder-workspaces/` | Low — ephemeral sandboxes | ~16 GB |
| `.aidev-projects/` | Medium — specific app instances | ~24 MB |
| `.generated-build-history/` | Medium — build timeline | ~13 MB |
| `.end-to-end-build-reality/` | Medium — E2E evidence | ~0.5 MB |
| Validator proof dot-dirs | Low — reproducible | <5 MB |

**Recommended archive strategy:** Zip `.aidev-projects/` and `.generated-build-history/` to external storage (~37 MB). Do not archive builder workspaces (16 GB, low value).

---

## Folders Safe to Ignore (Not Delete)

These should remain on disk but be excluded from indexing:

| Folder | Reason |
|--------|--------|
| `node_modules/` | Already in `.gitignore`; add to `.cursorignore` |
| `.generated-builder-workspaces/` | Already in `.gitignore`; add to `.cursorignore` |
| `.aidev-projects/` | Generated apps; add to `.cursorignore` |
| `.playwright/` | Browser cache |
| All validator proof dot-dirs | Regenerable evidence |

---

## Git Performance

| Metric | Value | Impact |
|--------|-------|--------|
| Tracked files | 7,435 | Normal |
| Untracked | 612 | Slows `git status` |
| Deleted (unstaged) | 364 | Project registry churn |
| Modified | 133 | Active engineering |
| `.gitignore` coverage | Partial | Many generated dirs not ignored |

**Recommendation:** Expand `.gitignore` to cover all regenerable dot-directories (see report 06).

---

## Health Recommendations (No Deletion Required)

1. **Create `.cursorignore`** — immediate Cursor performance improvement
2. **Expand `.gitignore`** — faster git operations
3. **Delete `.generated-builder-workspaces/`** in dev workspace — 99.7% size reduction
4. **Commit in-progress engineering** — 102 modified `src/` files represent valuable uncommitted work
5. **Separate dev/protected folders** — prevent accidental work on baseline (see report 05)

---

## Target Health Metrics (Post-Cleanup Dev Workspace)

| Metric | Current | Target |
|--------|---------|--------|
| Total size | ~16.4 GB | ~60–120 MB |
| File count | ~752,000 | ~12,000–15,000 |
| Git uncommitted | 1,109 | <50 (engineering only) |
| Cursor index time | Minutes | Seconds |
| Full directory copy | ~16 GB / 30+ min | ~60 MB / seconds |
