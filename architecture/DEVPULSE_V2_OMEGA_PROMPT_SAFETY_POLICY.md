# DevPulse V2 — OMEGA Prompt Safety Policy

**GF7 OMEGA — Large Prompt Governance V1**  
**System ID:** `omega_prompt_safety_policy`  
**Phase:** 2

---

## Why This Exists

DevPulse V1 suffered from **large prompts that looked organized but violated authority boundaries**:

- Duplicate answer authorities
- Hidden startup chains
- Ownership drift
- Validator explosions (nested full chains)
- Connect modules
- Cross-system confusion in one build

**Prompt size is not the real issue.** A large prompt is safe when it stays inside **one ownership domain**.

---

## Core Rule

> **One OMEGA prompt = one system authority.**

Safe large prompts:

- One system authority
- One capability wave inside one authority
- One vertical slice inside one authority

Unsafe prompts:

- Multiple systems at once
- Connect-everything scope
- Answer authority changes without checkpoint
- Hidden startup / connect modules / Task Governor bypass
- Central Brain + AiDev + execution in one prompt

---

## Classification

| Status | Meaning |
|--------|---------|
| **SAFE** | Single authority scope, declared validation mode |
| **WARN** | Touches existing authorities or missing declarations |
| **UNSAFE** | Multi-system, connect-everything, or forbidden patterns |

---

## Validation Mode Integration

Works with **Validation Budget Policy**:

| Trigger | Mode |
|---------|------|
| Normal one-system feature | `FAST_FEATURE_CHECK` |
| Ownership / answer / browser / governor / foundation change | `FULL_STACK_CHECK` |
| Phase transition | `PHASE_TRANSITION_CHECK` |

---

## Before Every Large OMEGA Prompt

Run the **OMEGA Authority Check** template:

1. What system does this prompt build?
2. What authority owns it?
3. Does it change any existing authority?
4. Does it change answer authority?
5. Does it change startup path?
6. Does it create execution?
7. Does it create AI/autonomy?
8. Does it create connect modules?
9. Does it use Task Governor where needed?
10. What validation mode is required?
11. Is this one authority, one capability wave, or one vertical slice?

Use `classifyOmegaPromptSafety(promptText)` before implementation.

---

## Validation

```bash
npm run validate:omega-safety
npm run typecheck
```

Pass token:

```
DEVPULSE_V2_OMEGA_PROMPT_SAFETY_POLICY_V1_PASS
```

**VALIDATION_MODE: FAST_FEATURE_CHECK**

---

## Related Documents

- `DEVPULSE_V2_VALIDATION_BUDGET_POLICY.md`
- `DEVPULSE_V2_CONSTITUTION.md`
