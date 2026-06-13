# Chat Operational Self-Knowledge Report

**Phase:** 26.73 — Chat Intelligence Founder Reality Repair V1  
**Pass token:** `CHAT_OPERATIONAL_SELF_KNOWLEDGE_V1_PASS`

## Root cause

Founder Test blocked launch because **Chat Intelligence** scored below target on operational questions (self-awareness, trust, limitations, next-step, launch blockers). Live OpenAI chat path (`generateLlmBackedChatResponseAsync`) bypassed the cognitive/self-diagnosis layer that only ran on LLM fallback. Responses were generic or project-routed instead of evidence-grounded operational intelligence.

## Weak answer patterns (before)

| Pattern | Failure |
|---------|---------|
| Generic onboarding copy | UNANSWERED_QUESTION / GENERIC_ONBOARDING |
| Project status instead of self-questions | MISSING_SELF_DIAGNOSIS |
| Overconfident launch claims | FAKE_CONFIDENCE / HALLUCINATED_READINESS |
| No proof-system references | PRETEND_SMART on trust questions |
| No prioritized next steps | UNANSWERED_QUESTION on guidance |

## New evidence sources

`buildOperationalEvidenceSnapshot()` aggregates:

- `autonomous-build-execution-proof` — stage proofs, first broken stage, chain connected
- `connected-build-execution` — build materialization proof level
- `repository-typecheck-reality` — typecheck baseline state
- `capability-truth-registry` — per-capability PROVEN / NOT_PROVEN mapping

## Capability truth model

| Level | Meaning |
|-------|---------|
| PROVEN | Stage/capability proven with connected evidence |
| PARTIALLY_PROVEN | Partial evidence or warnings |
| NOT_PROVEN | Evidence gap recorded |
| UNKNOWN | Not assessed in current session |

Example mappings: Requirements/Plan from execution proof stages; Build from connected-build-execution; Runtime/Preview/Verify/Launch from stage proofs.

## Uncertainty model

| Level | When |
|-------|------|
| KNOWN | Live evidence, no NOT_PROVEN gaps |
| LIKELY | Majority proven, some downstream gaps |
| UNVERIFIED | Evidence exists but chain incomplete |
| UNKNOWN | No connected evidence |

Exposed as `overallUncertainty.level` and `confidencePercent` in responses.

## Files changed

| File | Change |
|------|--------|
| `src/chat-operational-self-knowledge/*` | New operational self-knowledge layer |
| `src/llm-chat-brain/llm-chat-orchestrator.ts` | Enhance/override on operational questions |
| `src/chat-intelligence-reality/chat-intelligence-reality-authority.ts` | Default provider uses operational responses + snapshot |
| `src/chat-intelligence-reality/chat-intelligence-reality-types.ts` | `operationalEvidenceSnapshot` on assessment |
| `src/founder-testing-mode/founder-testing-v4-orchestrator.ts` | Pass `rootDir` to chat intelligence |
| `scripts/validate-chat-operational-self-knowledge.ts` | Phase validator |

## Founder Test impact

- Chat Intelligence scenarios now receive evidence-grounded answers for trust, limitations, self-awareness, next-step, and launch-readiness prompts
- No scoring or verdict logic changed — answers improved to meet existing rubrics honestly
- Live chat stress path inherits enhancement via LLM orchestrator
- `TYPECHECK_NOT_RUN` and execution-chain facts referenced when relevant

## Remaining chat intelligence gaps

- Non-operational product/planning questions still depend on LLM quality and context hydration
- Chat stress batch latency unchanged; snapshot build adds authority calls once per session (cached)
- Paraphrases outside classifier patterns may not trigger operational compose until intent rules expand

## Manual verification

```bash
npm run validate:chat-operational-self-knowledge
```

Pass token: `CHAT_OPERATIONAL_SELF_KNOWLEDGE_V1_PASS`
