# DevPulse V2 — Code Generation Planner Foundation

**GF7 OMEGA — Phase 4 Foundation V1**  
**System ID:** `code_generation_planner`  
**Phase:** 4

---

## Why Code Generation Planner Exists

Implementation Strategy Engine produces **sequenced strategies**. Future code generation systems need **structured implementation plans**.

Code Generation Planner transforms strategies into plans that specify:

| Field | Purpose |
|-------|---------|
| `targetModules` | Modules likely affected |
| `targetFiles` | Files likely affected |
| `validationRequirements` | Pre-merge validation tasks |
| `uiRequirements` | UI Guard registration and clickability proof |
| `duplicateRisks` | Overlap warnings before code is written |

---

## Strategy Engine vs Code Generation Planner

| Implementation Strategy Engine | Code Generation Planner |
|--------------------------------|-------------------------|
| Owns implementation strategies | Owns code generation plans |
| Sequences phases and rollback | Plans tasks, files, and validations |
| `ImplementationStrategy` | `CodeGenerationPlan` |
| Strategy generation only | Planning only |

Strategy defines **when** to build. Planner defines **what files and validations** are involved.

---

## Separated From Code Generation

Planning is **rule-based only** — no AI, LLM, file creation, or project mutation.

The planner produces `PlannedImplementationTask[]` — it does **not** write source code.

---

## Visible UI Guard Integration

When a task involves UI elements (panel, screen, button, input, toolbar, menu, tab, dialog), the planner automatically adds:

- `UI_REGISTRATION_REQUIRED`
- `CLICKABILITY_PROOF_REQUIRED`

Visible UI Guard remains the **owner** of registration and clickability proof. The planner only emits requirements.

---

## Duplicate Detection

Before creating tasks, the planner checks:

- **Central Brain** summaries
- **Project Vault** capabilities
- **Product Architect** `DUPLICATE_RISK` warnings
- **Build Package Generator** `DUPLICATE_RISK` warnings
- **Implementation Strategy Engine** `DUPLICATE_RISK` warnings

If overlap exists:

- Adds `DUPLICATE_RISK` to task `duplicateRisks`
- Does **not** reject or remove tasks
- Recommends **integration**, **extension**, or **consolidation**

---

## Preparing for Future Code Generation

Foundation V1 output:

```typescript
CodeGenerationPlan {
  planId, strategyId,
  tasks: PlannedImplementationTask[],
  status: 'READY' | 'WARN' | 'BLOCKED',
  warnings, errors
}
```

Future code generation systems will consume plans with explicit boundaries — still governed and non-autonomous in Foundation V1.

---

## Integrations

| System | Role |
|--------|------|
| Implementation Strategy Engine | Source strategies (read-only consumption) |
| Visible UI Guard | UI registration and clickability requirements |
| Central Brain | Published plan summaries |
| Project Vault | Existing capability context for duplicate detection |

---

## Validation

```bash
npm run validate:code-generation-planner
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_CODE_GENERATION_PLANNER_FOUNDATION_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK`

---

## Ownership

`code_generation_planner` → `devpulse_v2_code_generation_planner_authority`

Planning only. Non-generating. Non-executing. Non-answering.
