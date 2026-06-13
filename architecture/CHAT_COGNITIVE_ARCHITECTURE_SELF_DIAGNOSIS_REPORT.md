# Chat Cognitive Architecture & Self-Diagnosis Report

**Phase:** 25.37  
**Status:** Implemented  
**Validation token:** `CHAT_COGNITIVE_ARCHITECTURE_SELF_DIAGNOSIS_PASS`

---

## Root Cause

AiDevEngine chat was routing many unrelated questions through a generic project-start onboarding path (`"AiDevEngine helps turn software ideas into working applications..."`). Symptoms included identical responses to:

- "are you full self aware"
- "who created you"

The underlying failures were:

1. **Weak intent understanding** — meta questions about the system were classified as new-project or general help.
2. **No self-model** — chat could not reason honestly about identity, origin, or bounded operational awareness.
3. **No project reality lookup** — status and next-action questions lacked grounded signals.
4. **No capability boundary checks** — overclaiming on build, launch, and autonomy was possible.
5. **No pre-return quality review** — generic fallback could reach the user unchecked.
6. **Template patching loop** — fixing one question string did not generalize.

---

## Why Single-Question Fixes Failed

Hardcoded responses for "who created you" or "are you self aware" do not scale. New phrasings, compound questions, and founder-test scenarios would still miss routing. The fix had to be a **general reasoning pipeline** that composes answers from intent + self model + project reality + capability boundaries — not from question-specific templates.

---

## Cognitive Pipeline

```
User message
  → Conversation intent understanding (classifyChatCognitiveIntent)
  → Cognitive frame selection (buildChatReasoningPlan)
  → Project/self/context reality lookup (buildChatSelfModel, buildChatProjectRealityContext)
  → Capability boundary check (assessChatCapabilityBoundaries)
  → Software reasoning check (reasonAboutSoftwareCreation)
  → Operational self-diagnosis (runOperationalSelfDiagnosis)
  → Response plan + compose (composeResponseFromPlan)
  → Answer quality review (reviewChatAnswerQuality)
  → Repair if weak (repairChatAnswer)
  → Final answer (generateChatCognitiveResponse)
```

**Integration point:** `processBrainRequest()` in `src/command-center-brain/command-center-brain.ts` wraps the existing brain draft through `generateChatCognitiveResponse()` before return. Existing brain systems remain; weak drafts are overridden or repaired.

---

## Self Model

`buildChatSelfModel()` defines bounded honesty:

- AiDevEngine is a software-creation operating system inside DevPulse V2 — not a person.
- **Not human consciousness** — no sentience, feelings, or subjective experience.
- **Bounded operational awareness** — can inspect project signals, Founder Test, verification, execution proof when available.
- **Creator/origin** — product engineering effort within DevPulse V2 (not generic onboarding).
- **Evidence sources** — Founder Test, validators, execution proof, repository signals.
- **Cannot claim yet** — full autonomous app completion from one prompt, launch readiness without evidence, human-like self-awareness.

---

## Capability Boundaries

`assessChatCapabilityBoundaries()` tracks:

| Capability | Typical level |
|------------|---------------|
| planning | partial |
| requirements | partial |
| architecture review | partial |
| project memory | partial |
| autonomous build execution | unproven / contradicted without proof |
| live preview | partial |
| verification | partial |
| launch readiness | unknown until Founder Test |
| mobile runtime | partial |
| self-awareness | bounded operational only |
| chat reasoning | improving via this architecture |

Unproven or contradicted capabilities must be stated plainly in responses.

---

## Scenario Results

30 bounded scenarios validated across:

- SELF_AWARENESS (3)
- CREATOR_OR_ORIGIN (3)
- CAPABILITY (3)
- LIMITATION (3)
- TRUST (3)
- PROJECT_STATUS (3)
- SOFTWARE_CREATION (3)
- NEXT_ACTION (3)
- VERIFICATION (3)
- LAUNCH_READINESS (3)

**Result:** 30/30 passed | **Cognitive score:** 97/100 | **Reviewer reliability:** RELIABLE

Critical fixes verified:

- "are you full self aware" → direct bounded answer, no generic onboarding
- "who created you" → product/origin answer, no generic onboarding
- Capability questions → honest proven/partial/unproven split
- Launch questions → blockers and evidence requirements, no false readiness

Run: `npm run validate:chat-cognitive-architecture`

---

## Founder Testing Integration

`assessChatIntelligenceReality()` now includes `cognitiveArchitecture` from `assessChatCognitiveArchitecture()`:

- cognitive score
- reviewer reliability
- generic fallback violations
- self-awareness / capability / software reasoning failure counts
- missing knowledge categories
- self-evolution required flag

When cognitive score is below threshold (70):

> **Reviewer intelligence is not reliable enough yet.**

Founder Testing V4 report includes a **Chat Cognitive Architecture & Self-Diagnosis** section.

Launch readiness blocking also considers cognitive reviewer reliability.

---

## Self-Evolution Rule

If the same cognitive failure pattern appears 3 times (`CHAT_COGNITIVE_SELF_EVOLUTION_FAILURE_THRESHOLD`), the system marks `SELF_EVOLUTION_REQUIRED` instead of applying another template patch. Output includes failure pattern, missing cognitive capability, and recommended architecture change.

---

## Remaining Limitations

1. **Intent rules are pattern-based**, not LLM reasoning — novel phrasing may still classify as UNKNOWN (clarifying question returned).
2. **Project reality depends on in-process assessments** — fresh server may show UNKNOWN for Founder Test / execution proof until connected chain runs.
3. **Software creation reasoning is structured**, not generative code output — it plans and identifies gaps; it does not execute builds in chat.
4. **Quality reviewer uses heuristic criteria** — edge-case phrasing may need future tuning.
5. **Double cognitive pass** when assessing via brain + orchestrator is redundant but safe.

---

## Validation Result

| Check | Result |
|-------|--------|
| `npm run validate:chat-cognitive-architecture` | PASS — `CHAT_COGNITIVE_ARCHITECTURE_SELF_DIAGNOSIS_PASS` |
| Brain route self-awareness | No generic onboarding |
| Brain route creator | No generic onboarding |
| All 30 cognitive scenarios | PASS |
| Generic fallback violations | 0 |

---

## Module Index

| Module | Path |
|--------|------|
| Types | `src/chat-cognitive-architecture/chat-cognitive-types.ts` |
| Intent understanding | `src/chat-cognitive-architecture/chat-cognitive-intent-understanding.ts` |
| Self model | `src/chat-cognitive-architecture/chat-self-model.ts` |
| Project reality | `src/chat-cognitive-architecture/chat-project-reality-context.ts` |
| Capability boundaries | `src/chat-cognitive-architecture/chat-capability-boundary-checker.ts` |
| Software creation reasoner | `src/chat-cognitive-architecture/software-creation-reasoner.ts` |
| Operational self-diagnosis | `src/chat-cognitive-architecture/operational-self-diagnosis-engine.ts` |
| Response planner | `src/chat-cognitive-architecture/chat-response-planner.ts` |
| Answer quality reviewer | `src/chat-cognitive-architecture/chat-answer-quality-reviewer.ts` |
| Generic fallback guard | `src/chat-cognitive-architecture/generic-fallback-guard.ts` |
| Orchestrator | `src/chat-cognitive-architecture/chat-cognitive-orchestrator.ts` |
| Validation | `scripts/validate-chat-cognitive-architecture.ts` |
