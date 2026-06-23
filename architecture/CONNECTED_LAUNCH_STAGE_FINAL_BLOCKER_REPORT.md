# Connected Launch Stage Final Blocker Report (Phase 26.85)

## Problem

Execution chain truth is synchronized through Phase 26.84. Operational answers correctly report:

- Requirements through Verification: **PROVEN**
- Launch: **NOT_PROVEN**
- First broken stage: **LAUNCH**
- Evidence source: **connected-execution-chain-stage-resolver**

The remaining gap was that chat and diagnostics could not explain *exactly* which launch authority blocked PROVEN status.

## Solution

### LaunchProofDependencyGraph

Module: `src/connected-launch-readiness-proof/launch-proof-dependency-graph.ts`

Builds a full launch dependency graph from connected execution chain context and `assessConnectedLaunchReadinessProof`, including:

| Dependency | Source |
|------------|--------|
| Build | connected-build-execution |
| Runtime | connected-runtime-activation-proof |
| Preview | connected-preview-experience-proof |
| Verification | connected-verification-execution-proof |
| Founder Acceptance | founder-acceptance-gate |
| Product Readiness | founder-test-product-readiness |
| Chat Stress | founder-test-chat-stress-simulation |
| Launch Council | launch-council |
| Launch Linkage | launch-linkage-analyzer |
| Launch Readiness State | launch-readiness-analyzer |
| Claim vs Reality | launch-claim-reality-analyzer |
| Typecheck Reality | repository-typecheck-reality |
| Execution Readiness Gate | execution-readiness-gate |
| Mobile Runtime Reality | mobile-runtime-experience-reality |
| UI Readiness Reality | ui-reviewer-authority |

Each entry includes: status, source, proof level, blocksLaunch, reason.

### resolveFirstLaunchBlocker()

Deterministic primary blocker selection following `deriveLaunchProofLevel` gate order:

1. Launch proof not assessed
2. Acceptance REJECTED
3. Launch criteria unsatisfied
4. Verification not proven
5. Execution chain disconnected
6. Critical blockers
7. Critical claim violations
8. Launch linkage broken
9. Readiness NOT_READY / BLOCKED
10. Highest-severity partial blocker

### Launch NOT_PROVEN explanation

When `launchProven === false`, chat returns:

```
Launch is NOT_PROVEN because:
• Condition A
• Condition B
• Condition C

Primary launch blocker:
• <name> (<severity>)
  Authority: ...
  Proof source: ...
  Reason: ...
```

### LAUNCH_PROOF_CONTRADICTION

Emitted when `launchProven === false` but every assessed dependency reports PROVEN and non-blocking.

Module: `src/connected-launch-readiness-proof/launch-proof-contradiction-detector.ts`

### Runtime diagnostics

`GET /api/brain/operational-truth` now includes `launchProof`:

- `launchDependencyCount`
- `launchBlockingDependencyCount`
- `firstLaunchBlocker`
- `launchTruthGeneratedAt`
- `launchProven`
- `launchProofLevel`
- `contradictionCount`

### Chat integration

Questions routed through operational self-knowledge using `LaunchProofDependencyGraph`:

- Why is launch not proven?
- What is preventing launch?
- What is the first launch blocker?
- What do I need to fix before launch?

## Files changed

| File | Change |
|------|--------|
| `launch-proof-dependency-graph.ts` | New graph builder, blocker resolver, explanation |
| `launch-proof-contradiction-detector.ts` | New contradiction detector |
| `connected-launch-readiness-proof-types.ts` | New graph types |
| `connected-launch-readiness-proof-registry.ts` | Pass token |
| `index.ts` | Public exports |
| `operational-question-classifier.ts` | LAUNCH_NOT_PROVEN, FIRST_LAUNCH_BLOCKER, LAUNCH_FIX_REQUIRED |
| `operational-status-builder.ts` | Launch answer builders |
| `operational-response-composer.ts` | New question handlers |
| `live-operational-truth-path.ts` | Extended routing |
| `server/brain-api-handler.ts` | Launch diagnostics |
| `scripts/validate-connected-launch-final-blocker.ts` | Phase validator |

## Before / After

**Before**

```
Launch: NOT_PROVEN
Reason: unknown / generic blockers
```

**After**

```
Launch: NOT_PROVEN

because:
• Launch proof level is PARTIAL — ...
• [HIGH] Chat stress blocks launch: ...
• Launch readiness state is NOT_READY (score ...)

Primary blocker:
• Launch readiness not ready (HIGH)
  Authority: launch-readiness-analyzer
  Proof source: launch-readiness-analyzer
  Reason: Launch readiness state: NOT_READY (score ...)
```

## Constraints preserved

- No scoring changes
- No verdict logic changes
- No weakened launch requirements
- No auto-approve launch
- No blocker suppression
- No hardcoded launch success

## Validation

```bash
npm run validate:connected-launch-final-blocker
```

## Success token

`CONNECTED_LAUNCH_STAGE_FINAL_BLOCKER_REPAIR_V1_PASS`
