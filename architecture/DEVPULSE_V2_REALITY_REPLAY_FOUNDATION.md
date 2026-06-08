# DevPulse V2 Reality Replay Foundation

**System ID:** `reality_replay`  
**Phase:** 5  
**Owner:** `devpulse_v2_reality_replay_authority`  
**Pass token:** `DEVPULSE_V2_REALITY_REPLAY_FOUNDATION_V1_PASS`

---

## Why Reality Replay Exists

DevPulse V2 accumulates evidence across multiple systems — timeline events, evidence records, Self Vision observations, browser verification checks, and verification loop reviews. **Reality Replay** reconstructs **what happened and in what order** from that existing evidence.

It is the second foundation of Phase 5. Its purpose is historical reconstruction, not action. Future Session Replay and Root Cause Attribution systems will build on replay sessions without Reality Replay itself diagnosing or fixing anything.

---

## Timeline Ledger vs Reality Replay

| Timeline Ledger | Reality Replay |
|-----------------|----------------|
| **Owner** of chronological events | **Consumer** of timeline + other sources |
| Records events as they occur | Reconstructs unified sequences from multiple sources |
| Single event store | Merged replay sessions across systems |
| Authoritative event history | Read-only historical view for analysis |

The ledger remains the source of truth for raw events. Reality Replay reads ledger events and combines them with observation, evidence, browser, and validation history into ordered `ReplayEvent` sequences.

---

## Self Vision vs Reality Replay

| Self Vision | Reality Replay |
|-------------|----------------|
| **Observes** current UI reality | **Reconstructs** past sequences |
| Creates observation records/sessions | Creates replay events/sessions from history |
| Point-in-time visibility/clickability | Chronological what-happened-when narrative |
| Observation layer | Historical reconstruction layer |

Self Vision describes what the UI appears to be now. Reality Replay replays what was recorded across systems over time. Self Vision remains owner of observations; Reality Replay consumes observation session history read-only.

---

## Why Reality Replay Is Read-Only

Reality Replay is constrained to reconstruction:

- **No execution** — no actions, automation, or recovery
- **No UI mutation** — no clicks, panel creation, or DOM changes
- **No repair** — does not fix problems detected in replay
- **No code generation** — no planning or implementation output
- **No answer authority** — chat remains the single answer source
- **No prediction** — does not forecast failures
- **No root cause analysis** — does not diagnose why something failed

These boundaries keep reconstruction separate from diagnosis and action.

---

## Why Reality Replay Does Not Diagnose Causes

Root cause analysis requires inference, attribution, and often human judgment. Reality Replay intentionally stops at **sequence reconstruction**:

- It records that event A preceded event B
- It does **not** conclude that A caused B
- It does **not** recommend fixes
- It does **not** predict recurrence

Diagnosis belongs in future **Root Cause Attribution** systems that consume replay sessions as input.

---

## How Future Systems Will Build on Replay

### Session Replay

Session Replay will use `ReplaySession` and `ReplayEvent` to present operator-visible timelines of what occurred during a build, verification, or observation pass — without re-executing UI actions.

### Root Cause Attribution

Root Cause Attribution will consume reconstructed sequences and apply attribution logic, confidence scoring, and causal hypotheses. Reality Replay provides the ordered factual substrate; attribution systems add interpretive layers.

Both future systems depend on Reality Replay remaining read-only and non-diagnostic so reconstruction stays trustworthy and separable from inference.

---

## Ownership Remains With Source Systems

| Source system | Reality Replay role |
|---------------|---------------------|
| Self Vision | Read observation session history |
| Timeline Ledger | Read chronological events |
| Evidence Registry | Read evidence records |
| Browser Verification Harness | Read last verification result |
| Verification Loop | Read verification reviews |
| Central Brain | Publish replay summaries only |

Reality Replay owns **replay sessions**, **replay reports**, and **replay summaries** under `devpulse_v2_reality_replay_authority`.

---

## Replay Model

```typescript
ReplayStatus: 'COMPLETE' | 'PARTIAL' | 'INCOMPLETE'

ReplayEvent: {
  replayEventId, timestamp, sourceSystemId, eventType,
  description, evidenceIds, warnings, errors
}

ReplaySession: {
  replaySessionId, createdAt, events, status, warnings, errors
}
```

Events are sorted chronologically. Session status reflects how many source systems contributed and whether errors are present.

---

## Module Layout

```
src/reality-replay/
  types.ts
  reality-replay-engine.ts       — reconstructTimeline, replay*History, summarizeReplay
  replay-self-vision-bridge.ts
  replay-timeline-bridge.ts
  replay-evidence-bridge.ts
  replay-browser-bridge.ts
  replay-brain-bridge.ts
  reality-replay-report.ts
  reality-replay-authority.ts
  index.ts
```

---

## Validation

```bash
npm run validate:reality-replay
npm run typecheck
```

Expected pass token: `DEVPULSE_V2_REALITY_REPLAY_FOUNDATION_V1_PASS`

---

## Example

Timeline event at T1, evidence record at T2, Self Vision observation at T3, browser check at T4:

```
reconstructTimeline() → ReplaySession with events sorted T1 → T2 → T3 → T4
status: PARTIAL or COMPLETE depending on source coverage
```

Reality Replay records the sequence. It does not explain why T3 failed or predict T5.
