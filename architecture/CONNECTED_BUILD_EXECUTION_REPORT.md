# Connected Build Execution Materialization

**Phase 26.8** — Prove build-ready contracts materialize into real project artifacts.

## Core Question

Can AiDevEngine prove that a build-ready contract became real project artifacts with traceable linkage?

## Problem

After Phase 26.7, REQUIREMENTS and PLAN are PROVEN, but BUILD was NOT_PROVEN because no real artifacts were observed on disk.

## Architecture

```
Build-Ready Execution Contract
  → Build Contract Materializer (expected evidence)
  → Generated File Analyzer (filesystem scan)
  → Build Manifest Analyzer
  → Artifact Evidence Analyzer
  → Workspace Materialization Analyzer
  → Build Output Linkage Analyzer
  → Autonomous Build Execution Proof (BUILD stage)
```

## Module

`src/connected-build-execution/`

| Component | Role |
|-----------|------|
| `build-contract-materializer.ts` | Defines required artifacts — does NOT generate code |
| `generated-file-analyzer.ts` | Scans `.generated-builder-workspaces/` for real files |
| `build-manifest-analyzer.ts` | contractId → buildUnitId → artifactId → filePath |
| `artifact-evidence-analyzer.ts` | PROVEN/PARTIAL/NOT_PROVEN from disk evidence |
| `workspace-materialization-analyzer.ts` | Workspace existence and structure |
| `build-output-linkage-analyzer.ts` | Full chain linkage |
| `connected-build-execution-authority.ts` | `assessConnectedBuildExecution()` |

## Proof Rules

| Level | Criteria |
|-------|----------|
| **PROVEN** | All expected artifacts on disk, workspace valid, linkageConnected |
| **PARTIAL** | Some artifacts observed, chain incomplete |
| **NOT_PROVEN** | No materialization evidence |

## Integration

- **BUILD stage** in Autonomous Build Execution Proof consumes this authority
- **Founder Test** report includes CONNECTED BUILD EXECUTION section
- With fixture evidence: BUILD=PROVEN, `firstBrokenStage=RUNTIME`
- Without disk evidence: BUILD=NOT_PROVEN with exact missing paths

## Safety

- Read-only — no code generation or file mutation
- No synthetic execution claims
- Missing artifacts listed by path

## Validation

```bash
npm run validate:connected-build-execution
```

Pass token: `CONNECTED_BUILD_EXECUTION_PASS`

---

`CONNECTED_BUILD_EXECUTION_PASS`
