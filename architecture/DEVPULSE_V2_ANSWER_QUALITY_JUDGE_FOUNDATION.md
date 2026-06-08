# DevPulse V2 — Answer Quality Judge Foundation

**GF7 OMEGA — Intelligence Layer Foundation V1**  
**System ID:** `answer_quality_judge`  
**Phase:** 3

---

## Why Answer Quality Judge Exists

Chat Authority **creates** answers. Something must **review** them without taking ownership.

The Answer Quality Judge evaluates answer quality **after** creation and produces review reports only — preventing silent quality drift while keeping a single visible answer owner.

---

## Answer Quality Judge vs Chat Authority

| Chat Authority | Answer Quality Judge |
|----------------|----------------------|
| Creates `visibleAnswerText` | Reviews existing answers |
| Owns answer contract | Consumes answer contract read-only |
| User-visible answer owner | Report-only reviewer |
| Produces answers | Produces `AnswerQualityReview` |

Chat answers. Judge reviews.

---

## Answer Quality Judge vs Answer Authority Protection

| Answer Authority Protection | Answer Quality Judge |
|----------------------------|----------------------|
| Owns answer **ownership** policy | Owns answer **quality** review |
| Detects authority violations | Scores answer quality checks |
| Permanent governance layer | Post-answer evaluation layer |
| Protects who may answer | Evaluates how good answers are |

Protection prevents authority drift. Judge prevents quality drift.

---

## Review Separated From Answering

The Judge:

- Does **not** create answers
- Does **not** modify answers
- Does **not** rewrite answers
- Does **not** intercept answers
- Does **not** execute actions

It runs foundation checks:

1. Answer exists
2. `visibleAnswerText` exists
3. Answer is not empty
4. Answer length above minimum threshold
5. No answer contract violation
6. Answer owner is Chat Authority
7. No answer authority violation detected

---

## Why V1 Suffered Review-Ownership Conflicts

V1 often merged **review** with **answering**:

- Review layers rewrote visible text
- Quality systems became hidden answer producers
- Multiple modules claimed final answer ownership

V2 law: **review observes; Chat Authority owns visible output.**

---

## Preventing Answer-Authority Drift

The Judge integrates with:

- **Answer Authority Protection** — read-only compliance review
- **Central Brain** — publishes review summaries only (no ownership transfer)

Future AiDev and other systems may plan and coordinate — but only Chat Authority produces user-visible answers unless explicitly delegated through registry governance.

---

## Validation

```bash
npm run validate:answer-quality-judge
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_ANSWER_QUALITY_JUDGE_FOUNDATION_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK`

---

## Dependencies

- Central Brain Foundation
- Intent Architecture Foundation
- Context Arbitration Foundation
- Answer Authority Protection Policy
- Trust Engine Foundation
- Validation Budget Policy

---

## Ownership

`answer_quality_judge` → `devpulse_v2_answer_quality_judge_authority`

Review only. Non-answering. Non-modifying. Subordinate to Chat Authority and Answer Authority Protection.
