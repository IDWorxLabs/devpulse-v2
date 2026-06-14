# Chat Routing Consistency and Truth Unification Report (Phase 26.84)

## Problem

Phase 26.83 synchronized execution-stage operational questions through the live operational truth path. Runtime, preview, and first-broken-stage answers cited `connected-execution-chain-stage-resolver` correctly.

Other question categories still produced contradictory answers in the same session:

| Question | Stale answer | Contradiction |
|----------|--------------|---------------|
| What execution truth source are you using? | "I do not have access to a connected execution truth source" | Other answers cited `connected-execution-chain-stage-resolver` |
| List all execution stages and their status | Build Unproven, Runtime Unproven, Preview Partially Proven | Runtime/Preview answers reported proven=true |

Root cause: truth-source and stage-inventory questions classified as `GENERAL` and fell through to LLM/cognitive paths using stale capability summaries instead of `ConnectedExecutionChainTruth`.

## Solution

### 1. OperationalTruthContext

Unified synchronized context built from:

- `ConnectedExecutionChainTruth`
- `RepositoryTypecheckReality`
- `FounderTestReality`
- `ProductReadinessReality`
- `ChatIntelligenceReality`
- `executionTruthSource`, `firstBrokenStage`, `chainConnected`, `generatedAt`
- `stageInventory` derived directly from chain truth booleans

Module: `src/chat-operational-self-knowledge/operational-truth-context.ts`

### 2. Shared Status Builder

Single builder for all operational answer categories:

- Execution truth summary
- Truth source / evidence basis
- Execution stage inventory
- Runtime / preview capability answers
- First broken stage

Module: `src/chat-operational-self-knowledge/operational-status-builder.ts`

### 3. Question routing extensions

New operational question kinds:

- `TRUTH_SOURCE` — what execution truth source, what evidence, how do you know this
- `EXECUTION_STAGE_INVENTORY` — list all execution stages and status

Both routed through the same live operational truth path as execution-stage questions.

### 4. CHAT_OPERATIONAL_CONTRADICTION

Detects same-snapshot conflicts such as:

- Runtime proven=true in chain truth vs unproven in response or inventory
- Truth source denial when synchronized context has a source
- Capability registry disagreeing with chain truth

Module: `src/chat-operational-self-knowledge/chat-operational-contradiction-detector.ts`

### 5. Runtime diagnostics

`GET /api/brain/operational-truth` now exposes:

- `operationalTruthContextVersion`
- `operationalTruthSource`
- `operationalTruthGeneratedAt`
- `contradictionCount`

## Files changed

| File | Change |
|------|--------|
| `operational-truth-context.ts` | New unified context builder |
| `operational-status-builder.ts` | New shared answer builder |
| `chat-operational-contradiction-detector.ts` | New contradiction detector |
| `chat-operational-self-knowledge-types.ts` | New types and question kinds |
| `operational-evidence-snapshot.ts` | Attaches `operationalTruthContext` |
| `operational-question-classifier.ts` | TRUTH_SOURCE + EXECUTION_STAGE_INVENTORY patterns |
| `operational-response-composer.ts` | Consumes shared context and builder |
| `live-operational-truth-path.ts` | Extended routing and diagnostics |
| `index.ts` | Public exports |
| `scripts/validate-chat-routing-consistency.ts` | Phase validator |
| `package.json` | `validate:chat-routing-consistency` script |

## Constraints preserved

- No hardcoded operational answers
- No fake launch readiness
- No uncertainty suppression
- No Founder Test scoring changes
- No verdict logic changes

## Validation

```bash
npm run validate:chat-routing-consistency
```

Scenario checks (same snapshot):

1. What is your current first broken stage?
2. Can you run applications?
3. Can you preview applications?
4. What execution truth source are you using?
5. List all execution stages and their current status.

All answers must cite the same `executionTruthSource` and agree on runtime/preview/build stage status.

## Success token

`CHAT_ROUTING_CONSISTENCY_AND_TRUTH_UNIFICATION_V1_PASS`
