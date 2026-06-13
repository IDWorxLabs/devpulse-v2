# Phase 26.4 — Founder Test Chat Stress Simulation Report

## Goal

Upgrade Run Founder Test so it stress-tests chat intelligence the way real skeptical AiDevEngine users would — using the **same Command Center Brain + LLM Chat Brain path** as the live UI, not validators alone and not hardcoded pass answers.

## Architecture

```
Run Founder Test
  → Founder Test Integration (existing authorities)
  → Chat Stress Simulation (26.4)
       For each scenario prompt:
         processBrainRequest()
         generateLlmBackedChatResponseAsync()
         evaluateChatStressResponse()
  → Launch Readiness report + blockers
```

## Modules

| Module | Role |
|--------|------|
| `chat-stress-scenario-registry.ts` | 60 diverse prompts across 10 categories |
| `chat-response-simulator.ts` | Real brain path (matches `/api/brain/respond`) |
| `chat-response-evaluator.ts` | Evidence-based scoring — identity, legacy, honesty, tone |
| `chat-stress-report-builder.ts` | Chat Stress Simulation markdown section |
| `chat-stress-authority.ts` | Orchestrates batch run and aggregates report |

## Evaluation criteria

Each answer scored for:

- Answered actual question
- AiDevEngine identity / Asgard Dynamics / Lungelo Richard Zungu when relevant
- DevPulse legacy handled correctly — no current-identity misuse
- Project context when relevant
- Uncertainty admission
- No autonomous build/launch overclaim
- Founder-facing natural tone
- Useful next action
- No generic onboarding or internal jargon

## Scoring bands

- 90–100: Strong founder-facing chat
- 80–89: Good, needs polish
- 70–79: Usable but not launch-ready
- Below 70: Chat blocks launch

**Launch block threshold:** overall score &lt; 85 → `Chat blocks launch readiness: YES`

## Founder Test report section

**Chat Stress Simulation** includes:

- Total / passed / failed / weak counts
- Strongest and worst answers
- Per-failure: Prompt, Actual answer, Failure reason, Missing capability, Recommended fix
- Repeated failure patterns
- Recommended next chat improvements

## Integration

- `buildFounderTestLaunchReadinessArtifactsAsync()` runs chat stress before launch readiness aggregation
- `founder-testing-handler.ts` uses async artifacts builder on Run Founder Test
- UI `renderFounderTestResults()` renders chat stress details inline

## Validation

```bash
npm run validate:founder-test-chat-stress-simulation
npm run validate:real-llm-chat-brain
npm run validate:llm-context-hydration
npm run validate:founder-test-launch-readiness
```

Pass token: `FOUNDER_TEST_CHAT_STRESS_SIMULATION_PASS`

## Remaining gaps

- Full Run Founder Test with 60 scenarios adds latency (mitigated with concurrency)
- Without live LLM API key, stress test uses local fallback — still exercises real path
- Category-specific rubric can expand as product matures
