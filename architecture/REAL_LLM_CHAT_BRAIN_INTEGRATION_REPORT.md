# Phase 26 — Real LLM Chat Brain Integration Report

## Why rule-based chat failed

Phases 25.37–25.40 improved routing, templates, and repair layers, but manual testing still exposed brittle behavior:

| User prompt | Bad behavior | Root cause |
|-------------|--------------|------------|
| "what is unified verification lab" | Internal report header ("Conclusion: Unified Verification Entry Response…") | Project/system responders and templates surfaced architecture jargon |
| "what are your current capabilities" | Generic onboarding | Rule-based routing + canned fallback copy |
| "how come your responses don't sound humanistic?" | Clarifying question | Intent drift to UNKNOWN / clarification frame |

**Conclusion:** DevPulse cannot simulate world-class conversational reasoning with endless regex and template patches. DevPulse should wrap a strong LLM with bounded project intelligence and proof systems.

## New architecture

```
User message
    ↓
Rule-based draft (legacy resolvers — context only)
    ↓
DevPulse context package (bounded evidence)
    ↓
Real LLM reasoning brain (when connected)
    ↓
Answer judge (+ one repair call)
    ↓
World-Class Chat Brain local fallback (when LLM unavailable or judge fails)
    ↓
Final response + LLM diagnostics (founder debug)
```

**Core principle:** DevPulse is not the LLM. DevPulse provides evidence, memory, project state, verification, execution proof, and capability boundaries. The LLM provides reasoning, language, nuance, and human-quality conversation.

## Provider abstraction

| File | Role |
|------|------|
| `src/llm-chat-brain/llm-provider-types.ts` | `LlmProvider`, request/response types, status, errors |
| `src/llm-chat-brain/llm-provider.ts` | OpenAI-compatible fetch provider, mock provider for tests, env loading |

Environment variables (never commit values):

```bash
LLM_PROVIDER=openai
LLM_API_KEY=...
LLM_MODEL=gpt-4o-mini
LLM_TIMEOUT_MS=30000
LLM_MAX_TOKENS=1800        # optional
LLM_TEMPERATURE=0.55       # optional
LLM_BASE_URL=https://api.openai.com/v1  # optional
```

When `LLM_API_KEY` is missing:

> LLM brain is not connected. I can use local bounded responses only.

No hard crash — World-Class Chat Brain fallback runs.

## DevPulse context package

`buildDevPulseContextPackage()` assembles bounded truth only:

- AiDevEngine identity and self-model limits
- Project phase and validated phases
- Capability boundaries with proof levels (`PROVEN`, `PARTIALLY_PROVEN`, `UNPROVEN`, `CONTRADICTED`, `UNKNOWN`)
- Founder Test, Execution Proof, Verification, Live Preview, Launch Readiness, Typecheck
- Blockers, evidence gaps, memory summary
- System glossary (including Unified Verification Lab) in founder language

The LLM system instruction explicitly forbids inventing project state beyond this package.

## Answer judge

`judgeLlmAnswer()` scores LLM output on:

- Answered actual question
- Natural founder-facing tone
- No generic onboarding
- No unsupported capability claims
- Uses DevPulse evidence when relevant
- Admits uncertainty
- Useful next action
- No internal report jargon
- No hallucinated proof

Failed answers trigger one repair LLM call; if still weak, World-Class fallback applies.

## Fallback behavior

| Condition | Behavior |
|-----------|----------|
| No API key | Local fallback via World-Class Chat Brain + honest disconnected message |
| LLM HTTP/timeout error | Local fallback, error in warnings |
| Judge failure after repair | Local fallback with judge-failure mode (no fake "connected" copy) |
| API route with connected LLM | `generateLlmBackedChatResponseAsync()` in `server/brain-api-handler.ts` |

Existing chat architecture (World-Class + Cognitive) remains as fallback and validator support — not removed.

## Integration points

| File | Change |
|------|--------|
| `src/command-center-brain/command-center-brain.ts` | LLM layer replaces World-Class as primary post-processor (sync fallback) |
| `server/brain-api-handler.ts` | Async LLM layer when provider connected |
| `src/command-center-brain/brain-types.ts` | `llmChatBrainDiagnostics`, `noExternalAiCalls` reflects LLM usage |
| `public/founder-reality/index.html` + `app.js` | Founder debug LLM metadata panel |

Debug metadata exposed (no raw prompts, no API keys):

- LLM connected yes/no
- Fallback used yes/no
- Provider / model
- Context included yes/no
- Judge score
- Warnings

## Validation result

```bash
npm run validate:real-llm-chat-brain
npm run validate:world-class-chat-brain
npm run validate:chat-cognitive-architecture
npm run validate:founder-test-launch-readiness
```

Pass token: `REAL_LLM_CHAT_BRAIN_INTEGRATION_PASS`

Validation runs without a live API key using mock provider injection.

## Remaining limitations

- Live OpenAI calls require `LLM_API_KEY` in the server environment (`npm run dev`)
- Sync `processBrainRequest()` uses local fallback; async route required for live LLM answers
- Context is session-bounded — fresh processes may lack Founder Test / execution proof until validators run
- Judge heuristics are conservative; edge-case phrasing may still need prompt tuning
- Streaming, tool-calling, and multi-turn memory are future enhancements

## Manual test prompts (with LLM connected)

Ask in chat:

- what are your capabilities?
- what are your weaknesses?
- what is unified verification lab?
- why do you sound robotic?
- can you complete my whole app from one prompt?
- what should we do next?
- are we launch ready?

Expected: natural, direct, evidence-grounded answers — not onboarding templates or internal report headers.
