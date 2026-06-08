# DevPulse V2 — Product North Star

**GF7 OMEGA — Strategic Authority V1**  
**Effective:** 2026-06-08  
**Status:** PERMANENT — Defines the ideal DevPulse user experience

---

## Authority Statement

This document defines **what DevPulse should feel like** when used — the ideal journey, interaction model, trust experience, and product character at maturity.

It is subordinate to `DEVPULSE_V2_FOUNDER_VISION.md` for identity and mission, and superior to all implementation decisions for user experience intent.

When UX tradeoffs arise, this document is the arbiter of what DevPulse should optimize for.

---

## 1. Ideal User Journey

The North Star journey is the complete DevPulse experience at maturity. Phase 1 delivers the first steps; the full journey is the destination.

### The Journey

```
IDEA → IMPROVE → ARCHITECT → BUILD → TEST → VERIFY → FIX → REPORT → LEARN
```

| Stage | User experience | DevPulse behavior |
|-------|-----------------|-------------------|
| **1. User describes an idea** | User types naturally in chat: "I want a task manager with team assignments and deadline alerts" | DevPulse listens, asks clarifying questions only when necessary, never with routing narration |
| **2. DevPulse improves the idea** | User sees a refined concept: scope boundaries, user stories, risk flags, missing considerations | DevPulse applies planning intelligence — strengthens the idea before building |
| **3. DevPulse proposes architecture** | User sees a clear architecture proposal: components, data flow, tech choices, tradeoffs | DevPulse explains why, not just what; risks are visible upfront |
| **4. DevPulse builds** | User watches inline Operator Feed: files created, code generated, dependencies resolved | Every build action is visible, staged, and explained — no silent mutation |
| **5. DevPulse tests** | User sees test execution in feed: what's being tested, pass/fail, coverage gaps | Tests run with visible evidence; failures are immediate and honest |
| **6. DevPulse verifies** | User sees Trust Engine evidence: browser checks, functional verification, reality confirmation | Verification is evidence-backed; claims require proof |
| **7. DevPulse fixes** | User sees diagnosis → proposed fix → approval (if consequential) → repair → re-verify | Recovery is visible; rollback is always available |
| **8. DevPulse reports** | User receives a clear summary: what was built, what was verified, what remains, what was learned | Reports are honest — including failures and gaps |
| **9. DevPulse learns** | Future interactions benefit: DevPulse remembers project context, past failures, successful patterns | Learning improves capability without overriding human control or vision law |

### Journey Principles

- **No stage is invisible.** If DevPulse is doing it, the user can see it.
- **No stage blocks the next without explanation.** If something must wait, the feed says why.
- **The user can interrupt, redirect, or approve at any stage.** DevPulse serves; the user commands.
- **Every stage produces evidence, not just output.** Build produces files; verify produces proof; fix produces before/after.

### Phase 1 Journey (Foundation)

At Phase 1, the journey is intentionally limited:

```
IDEA → ANSWER → VISIBLE CONTEXT
```

User describes intent → DevPulse answers honestly → Operator Feed shows what DevPulse considered.

This is the seed of the full journey. It must be fast, honest, and visible before any later stage is added.

---

## 2. Chat-First Experience

### North Star

**Chat is the primary DevPulse interface.** Users control everything through conversation. Complex systems — verification, project memory, build orchestration, diagnostics — remain accessible through chat without requiring panel navigation expertise.

### What Chat-First Means

| Principle | Experience |
|-----------|------------|
| **Primary control surface** | Chat input is the first interactive element, always |
| **Complexity through conversation** | "Run verification on the auth module" works — no need to find UVL panel |
| **Inline richness** | Operator Feed, evidence, and status appear within the conversation — not in separate tabs |
| **No panel hunting** | Users never think "where do I find that feature?" — they ask DevPulse |
| **Persistent context** | Chat remembers the active project, recent actions, and open questions |
| **Secondary surfaces supplement** | Command Center panels exist for power users but never replace chat reachability |

### What Chat-First Does NOT Mean

| Anti-pattern | Why rejected |
|--------------|--------------|
| Chat-only with no visual richness | Feed, evidence, and status must render inline — chat is not plain text only |
| Chat as passive Q&A | DevPulse acts through chat, not just answers questions |
| Chat buried under diagnostics | V1 error — readiness panels and UVL gates competed with chat for focus |
| Chat disconnected from execution | Every action DevPulse takes must be visible in or through the conversation |

### Maturity Target

A mature DevPulse user should be able to complete the full journey — idea to verified product — without leaving the conversation surface, while still seeing rich inline execution context.

---

## 3. Visible Execution

### North Star

**Users always know what DevPulse is doing, why, and where it is in the process.** Invisible execution is a product failure, not a UX preference.

### The Visibility Contract

At any moment, the user can answer these questions by looking at DevPulse:

| Question | Where answered |
|----------|----------------|
| **What is DevPulse doing right now?** | Operator Feed — active stage and current action |
| **Why is it doing that?** | Feed entry rationale + chat explanation on request |
| **What stage is it in?** | Feed stage indicator: Plan / Build / Test / Verify / Fix / Report |
| **What risks exist?** | Feed risk flags + Trust Engine warnings |
| **What is waiting?** | Feed waiting state: approval needed, dependency loading, user input required |
| **What succeeded?** | Feed success entries with evidence links |
| **What failed?** | Feed failure entries with diagnosis and suggested recovery |

### Visibility Requirements

1. **Inline by default** — Feed appears within the conversation, not behind a tab or modal
2. **Real work only** — No phantom approvals, no connector-sweep artifacts, no grouped unrelated events
3. **Stage progression** — User can see the journey advance: idea → plan → build → verify
4. **Failure is visible** — Failures appear immediately with honest explanation, not after timeout
5. **Waiting is explained** — If DevPulse is blocked, the feed says what it's waiting for and why
6. **Direct answers still show context** — Even simple answers show what DevPulse considered

### V1 Failure This Corrects

V1 hid execution in console logs, validator reports, and grouped task metadata. Users waited 30 seconds with no visible activity. Operator Feed existed in state but not in view. DevPulse V2 treats visibility as non-negotiable product surface.

---

## 4. Trust Experience

### North Star

**Trust comes from verification, evidence, and transparency — never from confident language alone.**

### How DevPulse Earns Trust

| Trust pillar | User experience |
|--------------|-----------------|
| **Verification** | DevPulse shows proof: browser checks passed, tests green, evidence collected |
| **Evidence** | Claims link to artifacts: screenshots, logs, diffs, timing data, test results |
| **Transparency** | DevPulse explains its reasoning: why this architecture, why this fix, what alternatives existed |
| **Honesty** | DevPulse admits gaps: "Remote AI not connected," "3 tests failing," "This is unverified" |
| **Consistency** | Same question → same authority → same answer path — no load-order surprises |
| **Recoverability** | When wrong, DevPulse shows what failed, replays the timeline, and proposes repair |

### Trust Anti-Patterns (Never Again)

| V1 failure | V2 trust response |
|------------|-------------------|
| Validator PASS, browser FAIL | Browser is supreme; mismatch is visible failure |
| Routing narration as answer | Honest clarify or grounded answer only |
| Template prose claiming "grounded in reality" | Evidence link or honest "unverified" |
| Hidden post-processing overwriting answers | One authority, no interceptors |
| Silent apply or mutation | Visible build + approval for consequential action |

### Trust Maturity Target

A mature DevPulse user should feel: *"I don't have to believe DevPulse — I can see the proof."*

---

## 5. Product Feel

### North Star Character

When DevPulse is mature, it should feel:

| Quality | What the user experiences |
|---------|--------------------------|
| **Fast** | Opens instantly. Answers quickly. Acts without freezing. Never leaves the user waiting without explanation. |
| **Reliable** | Same input → consistent behavior. No path forks. No surprise authority changes mid-session. |
| **Intelligent** | Understands context, improves ideas, proposes sound architecture, learns from history. |
| **Calm** | No alarm-fatigue from console noise. No urgency theater. Status is informative, not anxiety-inducing. |
| **Transparent** | Always shows work. Never hides execution. Never claims without evidence. |
| **Helpful** | Explains when asked. Proposes when appropriate. Defers to human on consequential decisions. |
| **Capable** | Can take an idea to verified product. Not limited to answering questions about code. |

### Emotional Target

> DevPulse should feel like a skilled senior engineer sitting beside you — fast, honest, visible, and trustworthy — not like a chatbot performing confidence.

### Feel Anti-Patterns

| Feel to avoid | V1 symptom |
|---------------|------------|
| Sluggish | 20–30 s clickability delays |
| Deceptive | Validator green, browser broken |
| Chaotic | Console noise, competing systems |
| Opaque | Invisible execution, hidden failures |
| Anxious | Readiness stuck at 77%, freeze risk CRITICAL |
| Limited | "Full remote AI not connected" as final answer |
| Fragile | Patch-over-patch; one fix breaks another |

---

## Design Decision Filter

When evaluating any product or UX decision, ask:

1. **Does this serve the journey?** (Idea → Learn cycle)
2. **Is it reachable through chat?**
3. **Is execution visible inline?**
4. **Does it earn trust through evidence?**
5. **Does it feel fast, calm, and capable?**
6. **Does it align with Founder Vision immutable principles?**

If any answer is "no," the decision requires founder review before proceeding.

---

## Vision Preservation Law

This document defines the **ideal user experience** DevPulse must converge toward. Future systems may improve how the North Star is achieved; they may not redefine what the ideal experience is.

Specifically protected:
- Chat-first interaction model
- Visible execution contract
- Trust through verification, not assertion
- Product feel qualities: fast, reliable, intelligent, calm, transparent, helpful, capable

All UX and intelligence systems derive experience goals from this document and purpose from `DEVPULSE_V2_FOUNDER_VISION.md`.

---

## Related Documents

- `DEVPULSE_V2_FOUNDER_VISION.md` — Identity, mission, immutable principles
- `DEVPULSE_V2_FINAL_STATE_ROADMAP.md` — Systems that deliver this experience
- `DEVPULSE_V2_CONSTITUTION.md` — Architectural enforcement of UX laws (startup, chat, feed)
