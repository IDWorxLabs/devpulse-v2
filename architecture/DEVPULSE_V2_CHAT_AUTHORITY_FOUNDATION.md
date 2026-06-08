# DevPulse V2 — Chat Authority Foundation

**GF7 OMEGA — Visible Answer Path Foundation V1**  
**System ID:** `chat_authority`  
**Phase:** 1  
**Status:** First clean chat response path

---

## Why Chat Authority Exists Before Intelligence

V1 had multiple competing answer paths — Project Vault, V2 Intelligence, CCIR recovery — with load-order-dependent outcomes. Validators passed while browsers showed routing narration and template leaks.

Chat Authority Foundation proves **one path** works before any intelligence exists:

```
User message → Chat Authority → Answer Contract → visibleAnswerText → Renderer
```

No AI. No Central Brain. No hidden pipelines.

---

## Why V2 Needs One Visible Answer Path

| V1 problem | V2 Chat Authority response |
|------------|---------------------------|
| Multiple answer authorities | One owner: `devpulse_v2_chat_authority` |
| Hidden post-interceptors | No interceptors — answer contract is final |
| Validator/browser fork | Same path for all consumers |
| Invisible answers | `visibleAnswerText` mandatory |
| Response object confusion | Single `DevPulseV2Answer` shape |

---

## What V1 Got Wrong With Response Objects

V1 answers carried competing fields: `directAnswer`, recovered text, vault template prose, quality-judge slices. Renderers and interceptors fought over which field was "real."

V2 answer contract allows **one prose field**:

```typescript
{
  answerId: string,
  createdAt: number,
  source: "CHAT_AUTHORITY",
  visibleAnswerText: string,  // ONLY field renderers may use
  status: "READY" | "EMPTY" | "ERROR",
  warnings: string[],
  errors: string[]
}
```

No nested hidden answers. No alternate prose fields. No streaming complexity at this layer.

---

## Why visibleAnswerText Is Mandatory

If the user cannot see an answer, DevPulse has failed — regardless of internal state. Empty text → `status: EMPTY`. Renderer shows explicit empty state, not routing narration.

---

## Deterministic Foundation Response (Not AI)

For all non-empty user messages:

> DevPulse V2 Chat Authority received your message. Full intelligence is not active yet.

Purpose: prove intake, contract, and render — not intelligence quality.

---

## Why Operator Feed Comes After Chat Authority

Operator Feed shows execution context **inline with conversation**. Conversation must exist first. Chat Authority proves message intake and visible answers before feed events attach to turns.

---

## How Chat Mounts Into Shell Without Replacing Shell Authority

| Authority | Owns |
|-----------|------|
| **Shell Authority** | Shell readiness, clickability, shell HTML frame |
| **Chat Authority** | Messages, answers, chat surface HTML |

Chat calls `injectChatSurfaceIntoShell()` to replace `[ Chat Surface Placeholder ]` only. Shell Authority is not replaced or bypassed.

---

## Task Governor Integration

| Work | Priority |
|------|----------|
| Chat surface mount | P0 |
| Message submit | P1 |

**Prohibited:** P3/P4 during foundation chat path.

---

## Module Reference

| Module | Role |
|--------|------|
| `chat-authority.ts` | Sole chat owner — intake, state, mount, submit |
| `answer-contract.ts` | Single answer object shape |
| `minimal-response-engine.ts` | Deterministic foundation responses |
| `chat-surface.ts` | HTML render — `visibleAnswerText` only |
| `chat-report.ts` | Founder-readable report |

### Ownership

| Domain | Owner |
|--------|-------|
| `chat_authority` | `devpulse_v2_chat_authority` |
| `chat_answer_authority` | `devpulse_v2_chat_authority` (same module) |

---

## Build Gate

```typescript
runDevPulseV2BuildGate({
  phase: 1,
  systems: ['chat_authority'],
  eagerModuleCount: 3,
  answerAuthorities: ['devpulse_v2_chat_authority'],
  browserVerificationPresent: false,
  buildStage: 'foundation',
});
```

---

## Validation

```bash
npm run validate:chat-authority
npm run validate:shell
npm run validate:task-governor
npm run validate:foundation
```

Pass token:

```
DEVPULSE_V2_CHAT_AUTHORITY_FOUNDATION_V1_PASS
```

---

## Next Step

Chat Authority must pass before **Inline Operator Feed** — feed events attach to proven chat turns.

---

## Related Documents

- `DEVPULSE_V2_OWNERSHIP_LAWS.md`
- `DEVPULSE_V2_SHELL_FOUNDATION.md`
- `DEVPULSE_V2_SYSTEM_LAWS.md`
