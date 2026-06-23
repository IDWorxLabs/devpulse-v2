# Build Materialization Reality Report

## Objective

Determine whether BUILD → PARTIAL is caused by missing artifacts, broken linkage, workspace disconnect, or evidence propagation failure — with file-level evidence only.

## Path

- `assessBuildMaterializationReality()` — read-only orchestrator
- `scanArtifactReality()` — filesystem scan under `.generated-builder-workspaces/`
- `buildMaterializationChain()` — idea → verification contract chain
- `analyzeMaterializationVerdict()` — single primary root cause

## Validator vs real Founder Test

| Path | Entry |
|------|-------|
| Validator | `assessBuildMaterializationReality({ rootDir })` |
| Real Founder Test | Same authority — no gap materializer, no synthetic evidence |

## Latest assessment

- primaryVerdict: **BUILD_MATERIALIZATION_PROVEN**
- gapKind: **NONE**
- firstBrokenLink: **none**
- firstBrokenFile: **none**
- lostEvidenceAuthority: **none**

## Files changed

- `src/build-materialization-reality/` (new module)
- `scripts/validate-build-materialization-reality.ts`
- `package.json`

## Pass token

BUILD_MATERIALIZATION_REALITY_PASS

# BUILD_MATERIALIZATION_REALITY_REPORT

**Assessment:** build-materialization-reality-1-1781880651554
**Generated:** 2026-06-19T14:50:51.651Z
**Primary verdict:** BUILD_MATERIALIZATION_PROVEN
**Gap kind:** NONE

## Core question

Did AiDevEngine actually generate build files, and can proof locate and propagate that evidence?

## Verdict analysis

- Reason: All expected artifact files exist on disk with full proof linkage.
- firstBrokenLink: none
- firstBrokenFile: none
- lostEvidenceAuthority: none
- connectedBuildProofLevel: PROVEN
- evidencePropagationAligned: true

## Materialization chain

- **idea** — PROVEN
- **requirements** — PROVEN
- **plan** — PROVEN
- **artifact manifest** — PROVEN
- **artifact files** — PROVEN
- **workspace files** — PROVEN
- **runtime contract** — PROVEN
- **preview contract** — PROVEN
- **verification contract** — PROVEN

## Artifact scan counts

- workspaceRootExists: true
- workspaceCount: 2911
- totalFilesObserved: 88
- totalExpectedArtifacts: 10
- totalExistingArtifacts: 88
- totalMissingArtifacts: 0
- totalLinkedArtifacts: 9
- totalPropagatedArtifacts: 9

## Founder answers

- Did AiDevEngine generate build files? **YES**
- Did AiDevEngine create workspace files? **YES**
- First broken link: **none**
- First broken file: **none**
- Lost evidence authority: **none**
- Product gap or proof gap? **NONE**

### What must be fixed next

- Proceed to RUNTIME → PREVIEW → VERIFY → LAUNCH execution proof stages.

## Missing evidence

- none

## Recommended fix

Build materialization proven — advance RUNTIME execution proof.
