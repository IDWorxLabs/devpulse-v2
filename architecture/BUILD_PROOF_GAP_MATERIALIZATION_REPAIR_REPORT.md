# BUILD Proof Gap Materialization Repair Report

**Phase:** 26.71 — BUILD Proof Gap Materialization Repair V1  
**Pass token:** `BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS`

## Root cause

Founder Test execution chain broke at **BUILD** because connected build execution was **evidence-only**: `materializeBuildContractExpectations()` defined expected artifact paths under `.generated-builder-workspaces/{contractId}/`, but no production path wrote those files to disk. Validators simulated `PROVEN` by injecting `observedEvidence.paths`; Founder Test did not inject fixtures, so BUILD remained `NOT_PROVEN` with missing artifacts such as `package.json`, `src/App.tsx`, and backend/auth/db files.

## Missing artifact list (build-ready-idea-4 example)

Before repair, these paths were expected but absent on disk:

- `.generated-builder-workspaces/build-ready-idea-4/package.json`
- `.generated-builder-workspaces/build-ready-idea-4/src/db/schema.ts`
- `.generated-builder-workspaces/build-ready-idea-4/src/auth/index.ts`
- `.generated-builder-workspaces/build-ready-idea-4/src/server/index.ts`
- `.generated-builder-workspaces/build-ready-idea-4/src/server/routes.ts`
- `.generated-builder-workspaces/build-ready-idea-4/src/App.tsx`
- `.generated-builder-workspaces/build-ready-idea-4/src/screens/index.ts`
- Plus contract-derived artifacts (`build-manifest.json`, API/verification files as defined by build units)

## Before / after execution chain

| Stage | Before | After (with materialization) |
|-------|--------|------------------------------|
| REQUIREMENTS | PROVEN | PROVEN |
| PLAN | PROVEN | PROVEN |
| BUILD | NOT_PROVEN | **PROVEN** (when all artifacts materialized) |
| RUNTIME | NOT_PROVEN | NOT_PROVEN / BLOCKED_DOWNSTREAM |
| PREVIEW | NOT_PROVEN | NOT_PROVEN / BLOCKED_DOWNSTREAM |
| VERIFY | NOT_PROVEN | NOT_PROVEN / BLOCKED_DOWNSTREAM |
| LAUNCH | NOT_PROVEN | NOT_PROVEN / BLOCKED_DOWNSTREAM |

**First broken stage:** `BUILD` → **`RUNTIME`** when BUILD artifact-to-file proof is `PROVEN`.

## Files changed

| File | Change |
|------|--------|
| `src/connected-build-execution/build-proof-gap-materializer.ts` | New bounded artifact-to-file writer + proof object |
| `src/connected-build-execution/connected-build-execution-types.ts` | `BuildArtifactToFileProof` model |
| `src/connected-build-execution/connected-build-execution-authority.ts` | Materialization hook before disk scan |
| `src/connected-build-execution/generated-file-analyzer.ts` | Non-empty on-disk verification when not using fixtures |
| `src/connected-build-execution/connected-build-execution-report-builder.ts` | Founder-visible materialization section |
| `src/connected-build-execution/connected-build-execution-registry.ts` | Updated safety guarantees |
| `src/connected-build-execution/index.ts` | Public exports |
| `src/autonomous-build-execution-proof/build-stage-analyzer.ts` | Artifact-to-file evidence entry |
| `scripts/validate-build-proof-gap-materialization.ts` | Phase validator |

## Generated workspace path

```
.generated-builder-workspaces/build-ready-idea-4/
```

(Workspace id equals `buildReadyContract.contractId`, e.g. `build-ready-idea-4`.)

## Artifact-to-file proof

`BuildArtifactToFileProof` records:

- `planId`, `buildManifestId`, `workspaceId`, `workspacePath`
- `expectedArtifactCount`, `materializedFileCount`, `missingArtifactCount`
- `materializedFiles`, `missingArtifacts`
- `materializationAttempted`, `generatedAt`
- `proofLevel`: `PROVEN` | `PARTIAL` | `NOT_PROVEN`

**BUILD `PROVEN` requires:** workspace exists, `missingArtifactCount === 0`, `materializedFileCount >= expectedArtifactCount`, all files non-empty on disk.

## Safety guarantees

- Writes only under `.generated-builder-workspaces/`
- Path authority blocks traversal and forbidden repo roots
- No shell execution, network calls, or API keys
- No `.env` or secret files generated
- Fixture validators skip materialization when `observedEvidence` is injected
- Downstream RUNTIME/PREVIEW/VERIFY/LAUNCH remain blocked unless their own evidence contracts pass

## Remaining gaps after BUILD

- **RUNTIME:** Requires connected runtime activation session evidence
- **PREVIEW:** Requires preview experience proof linked to runtime
- **VERIFY:** Requires verification execution evidence
- **LAUNCH:** Requires full chain + launch readiness proof

## Validation

```bash
npm run validate:build-proof-gap-materialization
```

Pass token: `BUILD_PROOF_GAP_MATERIALIZATION_REPAIR_V1_PASS`
