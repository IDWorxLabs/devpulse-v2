# Self Model Reality Audit

**Phase:** 25.39  
**Mode:** Read-only audit — no production code changes  
**Validation token:** `SELF_MODEL_REALITY_AUDIT_PASS`

---

## Executive Summary

The SELF model **loses control** at different layers depending on phrasing — not because self-model data is missing, but because **intent classification diverges between layers** and **upstream brain routers answer before the self-model compose branch runs**.

> **The SELF model loses control at the cognitive re-classification boundary inside `buildDraft()` because world-class intent (CAPABILITY) is not passed through to `generateChatCognitiveResponse()`, causing cognitive UNKNOWN to override self capability reasoning — and at `shouldReplaceDraft()` / general-router precedence for UNKNOWN self prompts like "weaknesses", causing PROJECT context to override SELF reasoning.**

Architecture **25.37 + 25.38 is sufficient** with targeted fixes. No new chat layer required.

---

## 1. Current Self Model Architecture

```
User message
  → command-center-brain.ts (product identity / general router / generateBrainResponse)
  → world-class-chat-brain.ts → classifyChatBrainIntent()
  → buildDraft() → generateChatCognitiveResponse() [re-classifies intent independently]
      → classifyChatCognitiveIntent()
      → selectFrame() / buildChatReasoningPlan()
      → buildChatSelfModel() + buildChatProjectRealityContext()
      → composeResponseFromPlan()
      → reviewChatAnswerQuality() / repair
  → judgeChatBrainAnswer() → final answer
```

**Self model source:** `src/chat-cognitive-architecture/chat-self-model.ts` — always available.

**Project context source:** `src/chat-cognitive-architecture/chat-project-reality-context.ts` + `src/world-class-chat-brain/devpulse-intelligence-adapter.ts` — always loaded.

**Competition point:** Self-model compose runs only when cognitive intent matches a compose branch. If cognitive intent is `UNKNOWN`, or general router owns the brain draft first, project/product answers win.

---

## 2. Scenario Traces

### Scenario A — "What are your capabilities?"

| Stage | Route | Context / Source |
|-------|-------|-------------------|
| Brain classifier | `GENERAL` | `brain-request-classifier.ts` — no self/capability signal |
| Product identity | `none` | No exact product identity match |
| General router | **skipped** | Does not own |
| Cognitive intent | **`UNKNOWN`** | No pattern for "what are your capabilities" |
| Cognitive frame | `CLARIFICATION` | Not `SELF_MODEL` |
| World-class intent | **`CAPABILITY`** | `CAPABILITY_LIST_PATTERNS` in world-class orchestrator |
| Self model | loaded | `buildChatSelfModel()` — not used (cognitive UNKNOWN) |
| Project context | loaded | Session evidence — not primary |
| Brain draft | **generic onboarding** | `generateGeneralResponse()` — PRODUCT_INTRO bullets |
| World-class draft gate | `REPLACE` | Generic signature triggers override |
| Cognitive orchestrator | **`UNKNOWN`** | Re-classifies inside `buildDraft()` — ignores world-class CAPABILITY |
| Final answer (integrated) | **Clarifying question** | "Are you asking about AiDevEngine itself, your project…" |

**Failure classes:** `INTENT_FAILURE`, `MULTIPLE_SOURCE_CONFLICT`

**First failure location:** `src/chat-cognitive-architecture/chat-cognitive-intent-understanding.ts → classifyChatCognitiveIntent()`

**Why onboarding wins (manual reports):** Brain draft is PRODUCT_INTRO onboarding. When cognitive/world-class override fails or server runs without full wrapper, users see onboarding bullets. When override runs with current code, users see clarifying question — still wrong vs self capability model.

---

### Scenario B — "How do I make you self aware like a human?"

| Stage | Route | Context / Source |
|-------|-------|-------------------|
| Brain classifier | `GENERAL` | Generic classification |
| General router | **owns** | `DEVELOPMENT` dimension ("how do i") → project knowledge path |
| Cognitive intent | **`SELF_AWARENESS`** | Regex matches "self aware" substring |
| Cognitive frame | `SELF_MODEL` | Correct frame |
| World-class intent | `SELF` | Mapped from SELF_AWARENESS |
| Response planner | `SELF_AWARENESS` branch | **Declarative template only** |
| Final answer | **"No — I am not fully self-aware like a human…"** | Definition, not improvement path |

**Failure classes:** `RESPONSE_PLANNER_FAILURE`

**First failure location:** `src/chat-cognitive-architecture/chat-response-planner.ts → composeResponseFromPlan()`

**Why it answers "what am I?" instead of "how could I become more self-aware?":** Imperative/how-to prompts share regex with declarative self-awareness. Planner has no `SELF_IMPROVEMENT` / `HOW_TO` branch for memory, learning, evidence integration, or bounded operational self-modeling.

---

### Scenario C — "What are your weaknesses?"

| Stage | Route | Context / Source |
|-------|-------|-------------------|
| Brain classifier | `GENERAL` | No weakness pattern in brain classifier |
| General router | **owns** | `PROJECT` + `RISK` dimensions → `PROJECT_KNOWLEDGE_REASONING` |
| Cognitive intent | **`UNKNOWN`** | "weaknesses" not in LIMITATION patterns |
| World-class intent | **`UNKNOWN`** | No world-class override pattern |
| Cognitive frame | `CLARIFICATION` | Not self model |
| Brain draft (full path) | **project conclusion** | `general-answer-composer.ts` project facts |
| World-class draft gate | `REPLACE` only if generic signature | Project text lacks exact onboarding string |
| Final answer | **Project status report** | "DevPulse V2 is in 11.6… Foundation building…" |

**Failure classes:** `INTENT_FAILURE`, `PROJECT_CONTEXT_OVERRIDE`, `MULTIPLE_SOURCE_CONFLICT`

**First failure location:** `src/chat-cognitive-architecture/chat-cognitive-intent-understanding.ts → classifyChatCognitiveIntent()`

**Why project status overrides self weaknesses:** General router treats "weakness" as project RISK assessment. Cognitive UNKNOWN + world-class UNKNOWN do not force self-model compose. `shouldReplaceDraft()` does not include `UNKNOWN` unless exact generic onboarding signature appears — project answer survives.

---

## 3. Self vs Project Routing Analysis

| Prompt | Self intent detected? | Project router competes? | Self model used in final? | Dominant answer source |
|--------|----------------------|--------------------------|---------------------------|------------------------|
| are you self aware | Yes (SELF_AWARENESS) | No | Yes | composeResponseFromPlan SELF_AWARENESS |
| who created you | Yes (CREATOR_OR_ORIGIN) | No | Yes | self model creatorOrigin |
| what are your capabilities? | **Split** (world-class CAPABILITY, cognitive UNKNOWN) | Brain onboarding draft | **No** | cognitive UNKNOWN clarifying / brain onboarding |
| how do I make you self aware… | Partial (SELF_AWARENESS declarative) | Yes (DEVELOPMENT router) | Wrong branch | SELF_AWARENESS definition template |
| what are your weaknesses? | **No** | **Yes** (PROJECT+RISK) | **No** | general-answer-composer project facts |

**Pattern:** Self-model works when cognitive intent hits a dedicated compose branch with high-confidence patterns curated in Phase 25.37 validators. It fails on **paraphrases**, **imperative/how-to variants**, and **project-adjacent vocabulary** (weakness, risk) that route to project intelligence first.

---

## 4. First Failure Location

| Scenario | First failure | File / function |
|----------|---------------|-----------------|
| A | Intent drift + layer conflict | `chat-cognitive-intent-understanding.ts` → `classifyChatCognitiveIntent()` |
| B | Missing compose branch | `chat-response-planner.ts` → `composeResponseFromPlan()` |
| C | Intent gap + draft gate | `chat-cognitive-intent-understanding.ts` then `chat-brain-orchestrator.ts` → `shouldReplaceDraft()` |

---

## 5. Root Cause

1. **Dual intent classifiers without shared authority** — World-class brain and cognitive architecture classify independently; `buildDraft()` re-classifies and can undo world-class CAPABILITY.
2. **CAPABILITY frame not self-model** — `selectFrame(CAPABILITY)` returns `GENERAL_HELP`, not `SELF_MODEL`.
3. **Incomplete self-keyword coverage** — "capabilities", "weaknesses", "how do I make you" lack cognitive patterns; LIMITATION patterns cover "what can you not do" but not "weaknesses".
4. **Legacy brain layer precedence** — `command-center-brain.ts` general router answers project questions before chat layers; world-class wrapper cannot fix UNKNOWN prompts unless override is mandatory.
5. **Validation gap** — Phase 25.37/25.38 scenarios used exact strings; paraphrases and router competition were not in validator coverage.

---

## 6. Smallest Possible Fix

**Do not add another chat architecture.** Target these files only:

| Fix | File | Change |
|-----|------|--------|
| 1 | `chat-cognitive-intent-understanding.ts` | Add patterns: `what are your capabilities`, `weaknesses/flaws`, imperative `how do i make you` → distinct intents |
| 2 | `chat-response-planner.ts` | Map CAPABILITY → `SELF_MODEL` frame; add `SELF_IMPROVEMENT` compose for how-to self-awareness |
| 3 | `chat-brain-orchestrator.ts` | Pass resolved intent into cognitive call; extend `shouldReplaceDraft()` for UNKNOWN + self-keywords |
| 4 | `chat-response-planner.ts` | LIMITATION branch: map weaknesses to `selfModel.systemsIncomplete` + `cannotClaimYet` |

Estimated scope: **4 targeted edits in existing modules** — not a new layer.

---

## 7. Architecture Sufficiency Assessment

**Verdict: Phase 25.37 + 25.38 can become world-class with targeted fixes.**

**Not required:** Another world-class brain, cognitive layer, authority module, or template system.

**Required:** Intent alignment between layers, frame correction for CAPABILITY, compose branches for imperative self questions, and mandatory self override when self-keywords appear regardless of PROJECT router output.

---

## Why Previous Phases Did Not Detect This

- Phase **25.37** validated `"what can you actually do"` — not `"What are your capabilities?"`.
- Phase **25.38** added `CAPABILITY_LIST_PATTERNS` at world-class layer but did not prevent cognitive re-classification to UNKNOWN inside `buildDraft()`.
- Neither phase tested **"weaknesses"** or **imperative self-awareness how-to** prompts.
- Validators scored answers that passed quality heuristics without checking **semantic question-type match** (definition vs how-to vs self-weakness).

---

## Validation

```bash
npm run validate:self-model-reality-audit
```

Expected token: `SELF_MODEL_REALITY_AUDIT_PASS`
