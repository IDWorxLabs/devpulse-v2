# DevPulse V2 — Requirement Extractor Foundation

**GF7 OMEGA — Phase 4 Foundation V1**  
**System ID:** `requirement_extractor`  
**Phase:** 4

---

## Why Requirement Extractor Exists

AiDev Engine accepts **build requests**. Product planning needs **structured requirements**.

Requirement Extractor transforms request text into categorized requirements:

| Category | Examples |
|----------|----------|
| `FEATURE` | expense tracking, offline support |
| `CONSTRAINT` | must work offline |
| `PLATFORM` | Android, Web, iOS |
| `USER_TYPE` | students, founders |
| `RISK` | data accuracy, offline consistency |
| `SUCCESS_CRITERIA` | users can track expenses reliably |

---

## AiDev Engine vs Requirement Extractor

| AiDev Engine | Requirement Extractor |
|--------------|-------------------------|
| Owns build requests | Owns requirement extractions |
| Intake + status lifecycle | Feature/constraint/platform discovery |
| `AiDevRequest` | `RequirementExtractionResult` |
| Request owner | Extraction owner |

AiDev receives. Requirement Extractor **structures**.

---

## Separated From Planning

Requirement Extractor does **not**:

- Design product architecture (Product Architect — future)
- Plan build phases
- Generate code
- Execute changes

It produces `RequirementRecord[]` for downstream planning systems.

---

## Separated From Code Generation

Extraction is **rule-based only** — no AI, LLM, file creation, or project mutation.

Code generation belongs to future execution authorities with explicit governance.

---

## Example Extraction

**Input:**  
`Build an Android expense tracker app for students with offline support.`

**Output:**
- FEATURE: expense tracking, offline support
- PLATFORM: Android
- USER_TYPE: students
- CONSTRAINT: must work offline
- RISK: offline data consistency, financial data accuracy
- SUCCESS_CRITERIA: users can track expenses reliably

---

## Preparing for Product Architect

Foundation V1 output:

```typescript
RequirementExtractionResult {
  extractionId, requestId,
  requirements: RequirementRecord[],
  warnings, errors
}
```

Product Architect (future) will consume structured requirements to design product structure — still before code.

---

## Integrations

| System | Role |
|--------|------|
| AiDev Engine | Source build requests (read-only consumption) |
| Intent Architecture | Requirement extraction strategy by intent type |
| Central Brain | Published extraction summaries |

---

## Validation

```bash
npm run validate:requirement-extractor
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_REQUIREMENT_EXTRACTOR_FOUNDATION_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK`

---

## Ownership

`requirement_extractor` → `devpulse_v2_requirement_extractor_authority`

Extraction only. Non-generating. Non-executing. Non-answering.
