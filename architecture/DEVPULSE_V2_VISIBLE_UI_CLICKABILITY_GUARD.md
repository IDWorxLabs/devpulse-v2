# DevPulse V2 — Visible UI Registration & Clickability Guard

**GF7 OMEGA — UI Visibility Guardrail V1**  
**System ID:** `visible_ui_clickability_guard`  
**Phase:** 3.5 (registered at Phase 3 in ownership registry)

---

## Why V1 Panels Often Failed to Surface

DevPulse V1 repeatedly shipped UI that existed in code but not in reality:

- Panels built but never mounted
- Buttons rendered off-screen or behind other layers
- Controls visible but not clickable
- New surfaces with no owner and no verification path

**Code existence ≠ visible UI.** This guard makes that gap impossible to miss.

---

## Visibility and Clickability Must Be Proven

Every physical UI surface must prove:

| Requirement | Proof |
|-------------|-------|
| Registered | Entry in Visible UI Guard registry |
| Owned | `ownerSystemId` + `ownerModule` |
| Mounted | `mountTarget` found in snapshot |
| Visible | `expectedSelector` found in snapshot |
| Clickable (if interactive) | Button/clickable proof in snapshot |
| Browser verified (when required) | Browser Harness consumes guard records |

---

## UI Registration vs UI Rendering

| Registration | Rendering |
|--------------|-----------|
| Guard records intent and ownership | Shell/Chat/surface code renders HTML |
| Declares mount target + selector | DOM actually contains elements |
| Enables verification | User sees and interacts |

Registration is **mandatory metadata**. Rendering is still owned by Shell and feature authorities.

---

## Visible UI Guard vs Browser Verification Harness

| Visible UI Guard | Browser Verification Harness |
|------------------|------------------------------|
| UI registration owner | Browser verification owner |
| Declares expected elements | Runs browser reality checks |
| Provides check definitions | Executes Playwright/simulated DOM |
| Guardrail/registry | No second harness created |

The guard **feeds** the harness — it does **not** replace it.

---

## Every Future Panel/Control Must Register

Before Phase 4 AiDev, any feature creating:

- panels, buttons, cards, forms, inputs
- feed blocks, previews, approval controls

must call `registerVisibleUiElement()` with:

```typescript
{
  elementId, ownerSystemId, ownerModule, type, label,
  mountTarget, expectedSelector, interactive, requiredForPhase
}
```

**A feature is not complete** if its visible UI does not surface or cannot be clicked.

---

## Protecting Phase 4 AiDev

AiDev will generate more UI surfaces. Without this guard:

- Generated panels may never mount
- Approval controls may be dead clicks
- Preview areas may be invisible

The guard + future prompt policy ensures OMEGA prompts include registration, visibility, and clickability requirements.

---

## Future Prompt Requirements

Prompts mentioning `panel`, `button`, `form`, `modal`, etc. must include:

1. Visible UI registration
2. Owner system id
3. Mount target
4. Expected selector
5. Browser visibility check
6. Clickability check (if interactive)
7. Report entry

Use `validatePromptHasVisibleUiRequirements(promptText)` before implementation.

---

## Validation

```bash
npm run validate:visible-ui-guard
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_VISIBLE_UI_CLICKABILITY_GUARD_V1_PASS`

**Validation mode:** `FAST_FEATURE_CHECK`

---

## Ownership

`visible_ui_clickability_guard` → `devpulse_v2_visible_ui_guard_authority`

Guardrail only. Does not build UI. Does not replace Shell, Chat, or Browser Harness.
