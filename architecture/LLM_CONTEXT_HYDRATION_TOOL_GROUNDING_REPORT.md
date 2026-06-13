# Phase 26.2 — LLM Context Hydration & Tool Grounding Report

## Why Context Included was NO

Phase 26 connected the LLM and passed a static `buildDevPulseContextPackage()` with identity, capability boundaries, and session evidence snapshots — but:

1. **No question-aware retrieval** — every prompt received the same generic bundle; many sections were empty (UNKNOWN) in a fresh session.
2. **Health check hardcoded `contextIncluded: false`** in `app.js` when wiring LLM diagnostics.
3. **No DevPulse intelligence adapters** — Project Vault, Workspace, History, Launch Council, and verification details were not selected per question.
4. **No tool grounding layer** — even when evidence existed, it was not compressed into LLM-ready facts.

The LLM could reason in natural language but was largely blind to project-specific intelligence.

## Hydration architecture

```
User message
    ↓
context-selection-engine.ts (required sources only)
    ↓
context-hydration-orchestrator.ts (hydrateContextForMessage)
    ↓
Read-only adapters (Vault, Founder Test, Execution Proof, Verification, Workspace, History, Launch Council)
    ↓
tool-grounding-orchestrator.ts (compress evidence)
    ↓
devpulse-context-package.ts (merged into LLM system prompt)
    ↓
LLM → Answer Judge → Response
```

## Context selection engine

Question patterns map to bounded source lists:

| Question type | Sources loaded |
|---------------|----------------|
| Identity ("who created you") | IDENTITY, SELF_MODEL, CAPABILITY_BOUNDARIES |
| Self weakness/capability | SELF_MODEL, CAPABILITY_BOUNDARIES only |
| Launch readiness | FOUNDER_TEST, LAUNCH_COUNCIL, EXECUTION_PROOF, VERIFICATION, PROJECT_VAULT |
| History ("what did we fix") | PROJECT_HISTORY, VERIFICATION, PROJECT_VAULT |
| Verification failures | VERIFICATION, FOUNDER_TEST, PROJECT_VAULT |
| Blockers | FOUNDER_TEST, EXECUTION_PROOF, VERIFICATION, LAUNCH_COUNCIL, PROJECT_VAULT, WORKSPACE |

No speculative retrieval — sources not selected are skipped entirely.

## Tool grounding design

`groundHydratedContext()` converts adapter sections into concise blocks:

```
Founder Test:
- Founder Test verdict [PARTIAL]: Score: 75/100. Verdict: READY_WITH_WARNINGS.
- Founder Test blockers [PROVEN]: execution chain not proven; ...
```

Rules embedded in grounded text:
- Tag proof level: PROVEN, PARTIAL, UNKNOWN, CONTRADICTED
- Never invent state when session evidence is missing

## Diagnostics changes

LLM Chat Brain panel now shows:

- **Context Included:** YES when hydration produced facts
- **Context Sources Used:** e.g. FOUNDER_TEST, LAUNCH_COUNCIL
- **Last Context Hydration:** SUCCESS | PARTIAL
- **Hydrated Fact Count:** N
- **Context Confidence:** HIGH | MEDIUM | LOW

`/api/brain/health` includes the same fields (probe hydration). Chat responses include full `llmChatBrainDiagnostics` after each message.

No raw prompts or API keys are exposed.

## Files added

| Path | Role |
|------|------|
| `src/llm-chat-brain/context-hydration/` | Types, selection, orchestrator, 7 adapters |
| `src/llm-chat-brain/tool-grounding/` | Grounding types and orchestrator |
| `scripts/validate-llm-context-hydration.ts` | Validation harness |

## Validation results

```bash
npm run validate:llm-context-hydration
npm run validate:real-llm-chat-brain
npm run validate:founder-test-launch-readiness
```

Pass token: `LLM_CONTEXT_HYDRATION_TOOL_GROUNDING_PASS`

## Remaining gaps

- Session-bound evidence — Founder Test / verification history empty until run in-process
- Tool grounding is compression, not live tool-calling (future: structured function tools)
- Blocker detection relies on pattern rules; edge phrasing may need expansion
- Project Vault sparse until populated via founder workflows

## Manual test expectations

| Prompt | Expected behavior |
|--------|-------------------|
| "who created you?" | Identity-aware, no launch council dump |
| "what are your weaknesses?" | Self-model only, no project status |
| "what did we fix today?" | History + phases when available |
| "are we launch ready?" | Founder Test + Launch Council + execution + verification |
| "what is blocking us?" | Blockers from multiple authorities, UNKNOWN when missing |

After restart, diagnostics should show **Context Included: YES** on health check and after chat messages.
