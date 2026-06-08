# DevPulse V2 — Answer Authority Protection Policy

**GF7 OMEGA — Permanent Answer Governance V1**  
**System ID:** `answer_authority_protection_policy`  
**Phase:** 3

---

## Why V1 Suffered Answer Authority Problems

DevPulse V1 repeatedly failed because **multiple systems tried to answer the user**:

- Competing answer producers
- Answer ownership ambiguity
- Answer rewriting after creation
- Answer interception layers
- Authority conflicts and routing confusion

Users saw inconsistent, duplicated, or rewritten responses — with no clear owner of the final visible text.

---

## The Critical Law

> **Only Chat Authority may produce user-visible answers.**

`devpulse_v2_chat_authority` owns:

- User message intake
- Answer contract (`visibleAnswerText`)
- Final visible answer path

No other system may generate, rewrite, replace, or intercept user-visible answers.

---

## Answering vs Reviewing

| Action | Allowed owner |
|--------|---------------|
| Produce `visibleAnswerText` | Chat Authority only |
| Observe chat state | Central Brain, Trust Engine |
| Classify user intent | Intent Architecture |
| Select relevant context | Context Arbitration |
| Store evidence | Evidence Registry |
| Score trust | Trust Engine |

**Reviewing** is observation. **Answering** is user-visible output. These must never merge.

---

## Answering vs Trust Scoring

Trust Engine **scores** system health from evidence — it does not speak to the user.

Answer Authority Protection enforces: Trust Engine owner ≠ visible answer owner.

---

## Answering vs Coordination

Central Brain coordinates **system awareness summaries** — not user-facing prose.

Intent Architecture structures **what the user wants** — not what the user sees as the answer.

Context Arbitration selects **which context matters** — not the response text.

---

## Protected Systems (Must Not Answer)

1. Trust Engine
2. Central Brain
3. Intent Architecture
4. Context Arbitration
5. Evidence Registry
6. Timeline Ledger
7. Project Vault
8. Validation Budget Policy
9. Omega Prompt Safety Policy
10. Future AiDev (unless explicitly delegated through Chat Authority + registry)

---

## Protection Rules

1. Chat Authority is the only visible answer authority
2. No post-answer mutation of `visibleAnswerText`
3. No hidden answer owners in registry
4. Multiple answer authorities = **FAIL**
5. No answer authority without ownership registry registration

---

## Protecting Answer Quality Judge and Future AiDev

Future systems (Answer Quality Judge, AiDev) may:

- **Observe** answers
- **Review** answer quality
- **Plan** builds from intent
- **Verify** evidence

They may **not** become visible answer owners unless explicitly authorized through Chat Authority and ownership registry governance.

This policy is the permanent gate that prevents V1-style answer authority drift.

---

## Validation

```bash
npm run validate:answer-authority-protection
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_ANSWER_AUTHORITY_PROTECTION_POLICY_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK`

---

## Ownership

`answer_authority_protection_policy` → `devpulse_v2_answer_authority_protection_authority`

The policy **protects** answer authority — it does **not** become answer authority.
