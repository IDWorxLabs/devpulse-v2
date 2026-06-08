# DevPulse V2 — Timeline / Event Ledger Foundation

**GF7 OMEGA — Chronological Event History V1**  
**System ID:** `timeline_event_ledger`  
**Phase:** 2

---

## Purpose

The Timeline / Event Ledger is the **single chronological record** of important DevPulse events. It answers:

- What happened?
- When did it happen?
- Which system produced it?
- What evidence is attached?

It does **not** make decisions, calculate trust, or execute actions.

---

## What This Is NOT

- Not Project Vault (project memory)
- Not Evidence Registry (proof references)
- Not Trust Engine (trust scoring)
- Not Central Brain, AiDev, or execution

---

## How It Differs

| Layer | Role |
|-------|------|
| **Evidence Registry** | Stores proof references — what was observed |
| **Project Vault** | Stores project identity, facts, snapshots |
| **Timeline Ledger** | Stores **when** things happened in order — chronological references |

Timeline events may **reference** evidence IDs and project IDs without owning that data.

---

## Storage

**In-memory only** — no database, cloud, or file persistence.

Events returned in **chronological order** (oldest first).

---

## API

| Method | Purpose |
|--------|---------|
| `addEvent()` | Append timeline event |
| `getEvent()` / `listEvents()` | Lookup and chronological list |
| `listEventsBySource()` / `listEventsByCategory()` | Filter |
| `listEventsForProject()` | Project-scoped history |
| `createLedgerSnapshot()` | Point-in-time snapshot |
| `getLedgerState()` | Ledger counts and status |

### Integration helpers

- `recordEvidenceEvent(evidence)` — from Evidence Registry record
- `recordProjectEvent(kind, project)` — project created/updated
- `recordProjectSnapshotEvent(snapshot)` — vault snapshot

---

## Validation

```bash
npm run validate:timeline-ledger
npm run typecheck
```

Pass token:

```
DEVPULSE_V2_TIMELINE_LEDGER_FOUNDATION_V1_PASS
```

**VALIDATION_MODE: FAST_FEATURE_CHECK** — no nested full-stack chain.

---

## Related Documents

- `DEVPULSE_V2_EVIDENCE_REGISTRY_FOUNDATION.md`
- `DEVPULSE_V2_PROJECT_VAULT_FOUNDATION.md`
- `DEVPULSE_V2_VALIDATION_BUDGET_POLICY.md`
