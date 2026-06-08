# DevPulse V2 — Product Architect Foundation

**GF7 OMEGA — Phase 4 Foundation V1**  
**System ID:** `product_architect`  
**Phase:** 4

---

## Why Product Architect Exists

Requirement Extractor produces **structured requirements**. Build planning needs a **product architecture blueprint**.

Product Architect transforms requirements into architecture components:

| Type | Examples |
|------|----------|
| `SCREEN` | ExpenseListScreen, AddExpenseScreen |
| `FLOW` | AddExpenseFlow, OfflineSyncFlow |
| `MODULE` | ExpenseModule, OfflineStorageModule |
| `DATA_MODEL` | Expense, Category, UserProfile |
| `INTEGRATION` | AndroidPlatformIntegration, LocalStorageIntegration |
| `PERMISSION` | StudentRolePermission, OfflineAccessPermission |
| `SERVICE` | ExpenseTrackingService, OfflineSyncService |

---

## Requirement Extractor vs Product Architect

| Requirement Extractor | Product Architect |
|-----------------------|-------------------|
| Owns requirement extractions | Owns architecture blueprints |
| Discovers features, constraints, platforms | Designs screens, flows, modules, data models |
| `RequirementExtractionResult` | `ArchitectureBlueprint` |
| Extraction only | Architecture design only |

Requirements describe **what** is needed. Architecture describes **how the product is structured**.

---

## Separated From Planning

Product Architect does **not**:

- Schedule build phases
- Assign tasks to execution systems
- Generate code
- Modify projects

It produces `ArchitectureBlueprint` for downstream Build Package Generator.

---

## Separated From Code Generation

Architecture generation is **rule-based only** — no AI, LLM, file creation, or project mutation.

Code generation belongs to future execution authorities with explicit governance.

---

## Duplicate Detection

Before proposing MODULE, SCREEN, FLOW, INTEGRATION, or SERVICE components, Product Architect checks:

- **Central Brain** system summaries
- **Project Vault** capability facts and project summaries

If a capability may already exist:

- Adds `DUPLICATE_RISK` warning to the component
- Does **not** reject the blueprint
- Does **not** remove the component
- Recommends **integration**, **extension**, or **consolidation**

---

## Preparing for Build Package Generator

Foundation V1 output:

```typescript
ArchitectureBlueprint {
  blueprintId, requestId,
  components: ArchitectureComponent[],
  warnings, errors
}
```

Build Package Generator (future) will consume blueprints to produce build packages — still before code.

---

## Integrations

| System | Role |
|--------|------|
| Requirement Extractor | Source requirements (read-only consumption) |
| Central Brain | Published architecture summaries |
| Project Vault | Existing capability context for duplicate detection |

---

## Validation

```bash
npm run validate:product-architect
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_PRODUCT_ARCHITECT_FOUNDATION_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK`

---

## Ownership

`product_architect` → `devpulse_v2_product_architect_authority`

Architecture design only. Non-generating. Non-executing. Non-answering.
