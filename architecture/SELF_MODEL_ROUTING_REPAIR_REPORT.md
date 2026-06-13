# Phase 25.40 — Self Model Routing Repair Report

## Root cause (from Phase 25.39)

Phase 25.39 traced three failure modes in the existing World-Class Chat Brain + Chat Cognitive Architecture stack:

| Scenario | First failure | Root cause |
|----------|---------------|------------|
| "What are your capabilities?" | `INTENT_FAILURE` + `MULTIPLE_SOURCE_CONFLICT` | World-class classified `CAPABILITY`, but cognitive layer re-classified to `UNKNOWN` inside `buildDraft()` because `resolvedIntentOverride` was not passed |
| "How do I make you self aware like a human?" | `RESPONSE_PLANNER_FAILURE` | Imperative self-improvement prompt matched declarative `SELF_AWARENESS` template |
| "What are your weaknesses?" | `INTENT_FAILURE` + `PROJECT_CONTEXT_OVERRIDE` | General router produced project-status draft; cognitive UNKNOWN; `shouldReplaceDraft()` did not reject project-status drafts for self-directed prompts |

**Verdict:** Architecture from Phases 25.37–25.38 is sufficient. The defect was routing drift between layers, not missing systems.

## Files changed

| File | Change |
|------|--------|
| `src/chat-cognitive-architecture/chat-intent-reconciliation.ts` | **New** — compatibility rules, world-class → cognitive mapping, self-signal helpers |
| `src/chat-cognitive-architecture/chat-cognitive-types.ts` | Added `SELF_IMPROVEMENT`, `HUMAN_QUALITY`, `SourceConflictDiagnostics`, `resolvedIntentOverride` input |
| `src/chat-cognitive-architecture/chat-cognitive-intent-understanding.ts` | Expanded semantic patterns; reconcile with override |
| `src/chat-cognitive-architecture/chat-cognitive-orchestrator.ts` | Pass override; emit `sourceConflict` diagnostics |
| `src/chat-cognitive-architecture/chat-response-planner.ts` | CAPABILITY → `SELF_MODEL`; self-weakness and self-improvement compose branches |
| `src/chat-cognitive-architecture/chat-cognitive-registry.ts` | Direct-answer intents extended |
| `src/chat-cognitive-architecture/index.ts` | Export reconciliation API |
| `src/world-class-chat-brain/chat-brain-orchestrator.ts` | Pass `resolvedIntentOverride`; extended `shouldReplaceDraft()`; pattern coverage |
| `src/world-class-chat-brain/chat-brain-types.ts` | `sourceConflict` on final response |
| `scripts/validate-self-model-routing-repair.ts` | **New** validation harness |
| `package.json` | `validate:self-model-routing-repair` script |

## Routing repair design

```
User prompt
    ↓
World-Class Chat Brain (classifyChatBrainIntent)
    ↓ resolvedIntentOverride
Chat Cognitive Architecture (classify + reconcile)
    ↓ compatible intent preserved (intentSource: world-class-preserved)
Response planner (CAPABILITY/LIMITATION/SELF_IMPROVEMENT/HUMAN_QUALITY → SELF_MODEL)
    ↓
Compose answer (self-model, not onboarding / project status)
    ↓
World-Class judge + repair
    ↓
Final answer
```

### Compatibility rules

- World-class `CAPABILITY` → cognitive `CAPABILITY` or `SELF_AWARENESS`, never `UNKNOWN`
- World-class `SELF` → cognitive self intents, not `PROJECT_STATUS` unless explicit project wording
- World-class `HUMAN_QUALITY` → never `NEW_PROJECT_REQUEST` or `UNKNOWN`
- World-class `PROJECT_REALITY` → `PROJECT_STATUS` or `NEXT_ACTION`
- On conflict: preserve world-class intent, record `intentSource: world-class-preserved`

### Draft replacement

`shouldReplaceDraft()` now replaces when:

- Draft contains generic onboarding
- Self-directed prompt + project-status draft
- Self weakness / improvement / capability / human-quality signals present

## Before / after examples

| Prompt | Before (25.39) | After (25.40) |
|--------|----------------|---------------|
| "what are your current capabilities" | Generic onboarding / project router | Self capability model with bounded honesty |
| "how do I make you self aware like a human" | "No, I am not self-aware…" only | Operational self-awareness improvement path |
| "what are your current weaknesses" | DevPulse project status | Assistant weaknesses (routing, evidence, overclaim limits) |
| "how come your responses don't sound humanistic?" | Clarifying question | Direct tone explanation + founder voice |
| "what is the project missing?" | (correct) project reality | Still routes to project context |

## Conflict diagnostics

When project context and self-model both produce candidate answers, `SourceConflictDiagnostics` records:

- `selectedSource` — e.g. `self-model`, `composed`
- `rejectedSource` — e.g. `project-context`, `brain-draft-onboarding`
- `conflictReason` — why both paths activated
- `winningReason` — why the selected path won
- `intentSource` — `world-class-preserved`, `local-refined`, or `local-classifier`

Surfaced on `ChatCognitiveResponse.sourceConflict` and `ChatBrainFinalResponse.sourceConflict`.

## Validation results

Run:

```bash
npm run validate:self-model-routing-repair
npm run validate:world-class-chat-brain
npm run validate:chat-cognitive-architecture
npm run validate:founder-test-launch-readiness
```

Pass token: `SELF_MODEL_ROUTING_REPAIR_PASS`

All four validation suites pass:

| Suite | Token | Result |
|-------|-------|--------|
| `validate:self-model-routing-repair` | `SELF_MODEL_ROUTING_REPAIR_PASS` | Pass |
| `validate:world-class-chat-brain` | `WORLD_CLASS_CHAT_BRAIN_ARCHITECTURE_PASS` | Pass (19/19 scenarios) |
| `validate:chat-cognitive-architecture` | `CHAT_COGNITIVE_ARCHITECTURE_SELF_DIAGNOSIS_PASS` | Pass (30/30 scenarios) |
| `validate:founder-test-launch-readiness` | `FOUNDER_TEST_LAUNCH_READINESS_PASS` | Pass |

## Remaining limitations

- Self-model answers remain bounded by in-process evidence; fresh processes may lack Founder Test / execution proof until validators run
- General router can still produce weak drafts upstream; repair depends on world-class layer running after `generateBrainResponse`
- Operational self-awareness is explicitly not human consciousness — distinction must stay in product copy
- Pattern coverage will need periodic expansion as founders phrase questions differently; reconciliation layer reduces re-classification drift without hardcoding every variant
