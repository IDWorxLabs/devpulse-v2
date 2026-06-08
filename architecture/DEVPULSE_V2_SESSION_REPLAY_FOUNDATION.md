# DevPulse V2 Session Replay Foundation

**System ID:** `session_replay`  
**Phase:** 5  
**Owner:** `devpulse_v2_session_replay_authority`  
**Pass token:** `DEVPULSE_V2_SESSION_REPLAY_FOUNDATION_V1_PASS`

---

## Why Session Replay Exists

DevPulse V2 needs to answer not just **what happened** (Reality Replay) but **what happened during an entire session** — a user interaction, an AiDev build request flow, a planning validation run, or an observation pass.

Session Replay is the third foundation of Phase 5. It reconstructs complete user and system sessions from existing evidence while remaining strictly read-only.

| Question | System |
|----------|--------|
| What happened? | Reality Replay |
| What happened during this entire session? | Session Replay |

---

## Reality Replay vs Session Replay

| Reality Replay | Session Replay |
|----------------|----------------|
| Reconstructs **events** in chronological order | Reconstructs **sessions** (grouped narratives) |
| Event-level granularity | Session-level granularity |
| Merges timeline, evidence, browser, validation | Adds user, AiDev, planning, observation session views |
| Answers "what happened?" | Answers "what happened during this session?" |

Reality Replay remains the owner of event-level replay sessions. Session Replay consumes those sessions and builds higher-level session records.

---

## Timeline Ledger vs Session Replay

| Timeline Ledger | Session Replay |
|-----------------|----------------|
| **Owner** of raw chronological events | **Consumer** of timeline + other session sources |
| Records events as they occur | Groups events into session records |
| Authoritative event store | Read-only session reconstruction |

The ledger is not replaced. Session Replay reads timeline history and groups it by `relatedRecordId` where available.

---

## Self Vision vs Session Replay

| Self Vision | Session Replay |
|-------------|----------------|
| **Observes** current UI reality | **Reconstructs** observation sessions from history |
| Point-in-time observation records | Full observation session replay |
| Observation layer | Session reconstruction layer |

Self Vision remains owner of observation sessions. Session Replay consumes them read-only.

---

## Why Session Replay Is Read-Only

Session Replay is constrained to reconstruction:

- **No execution** — no actions or automation
- **No UI mutation** — no clicks or panel changes
- **No repair** — does not fix failures found in sessions
- **No code generation** — no planning or implementation output
- **No answer authority** — chat remains the single answer source
- **No prediction** — does not forecast failures
- **No root cause analysis** — does not diagnose why sessions failed

---

## Why Session Replay Does Not Diagnose Causes

Session Replay records **what occurred within a session boundary** — messages, requests, handoffs, observations, replay events — in order. It does **not**:

- Attribute causality between events
- Recommend fixes
- Predict future failures
- Score session health beyond COMPLETE / PARTIAL / INCOMPLETE reconstruction status

Diagnosis belongs in future **Root Cause Attribution** systems.

---

## How Future Systems Will Build on Session Replay

### Failure Prediction

Failure Prediction will consume `SessionReplayRecord` and `SessionReplaySummary` to identify patterns across sessions — without Session Replay itself performing prediction.

### Root Cause Attribution

Root Cause Attribution will take reconstructed sessions and apply attribution logic, confidence scoring, and causal hypotheses. Session Replay provides the complete session substrate; attribution adds interpretive layers.

Both systems depend on Session Replay staying non-diagnostic and non-predictive.

---

## Ownership Remains With Source Systems

| Source system | Session Replay role |
|---------------|---------------------|
| Reality Replay | Consume replay sessions |
| AiDev Engine | Consume request history |
| Timeline Ledger | Consume and group timeline events |
| Evidence Registry | Consume and group evidence records |
| Self Vision | Consume observation sessions |
| Central Brain | Publish session summaries only |

Session Replay owns **session reconstruction**, **session reports**, and **replay summaries** under `devpulse_v2_session_replay_authority`.

---

## Session Model

```typescript
SessionReplayStatus: 'COMPLETE' | 'PARTIAL' | 'INCOMPLETE'

SessionReplayEvent: {
  replayEventId, timestamp, sourceSystemId, eventType,
  description, evidenceIds, warnings, errors
}

SessionReplayRecord: {
  sessionReplayId, createdAt, sessionId, events, status, warnings, errors
}

SessionReplaySummary: {
  sessionCount, eventCount, completeCount, partialCount,
  incompleteCount, warnings, errors
}
```

---

## Module Layout

```
src/session-replay/
  types.ts
  session-replay-engine.ts
  session-reality-replay-bridge.ts
  session-aidev-bridge.ts
  session-timeline-bridge.ts
  session-evidence-bridge.ts
  session-self-vision-bridge.ts
  session-brain-bridge.ts
  session-replay-report.ts
  session-replay-authority.ts
  index.ts
```

---

## Validation

```bash
npm run validate:session-replay
npm run typecheck
```

Expected pass token: `DEVPULSE_V2_SESSION_REPLAY_FOUNDATION_V1_PASS`

---

## Example

User submits a chat message, AiDev intake receives a build request, planning validation runs, Self Vision observes UI:

```
reconstructSession() → SessionReplayRecord with all session events chronologically merged
reconstructUserSession() → chat messages as session events
reconstructAiDevSession() → AiDev request lifecycle events
```

Session Replay records the complete session narrative. It does not fix the planning handoff or predict the next failure.
