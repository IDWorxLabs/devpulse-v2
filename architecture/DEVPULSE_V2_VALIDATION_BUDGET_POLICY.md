# DevPulse V2 — Validation Budget & Fast Check Policy

**GF7 OMEGA — Validation Governance V1**  
**System ID:** `validation_budget_policy`  
**Phase:** 2

---

## Why This Exists

DevPulse V2 validators were becoming slower because feature validators accidentally spawned full dependency chains via nested `npm run validate:*` calls.

**Evidence Registry exposed the problem:** its validator initially re-ran project-vault, trust-engine, browser-harness, and more — turning a ~4 second check into several minutes.

This policy makes validation **faster and predictable** before V2 grows further.

---

## Validation Modes

| Mode | When | Commands |
|------|------|----------|
| **FAST_FEATURE_CHECK** | Normal feature foundation work | Current feature validator + `typecheck` |
| **FULL_STACK_CHECK** | Checkpoint triggers | Full dependent validator chain |
| **PHASE_TRANSITION_CHECK** | Before new phase | Complete chain + phase validators |

---

## FAST_FEATURE_CHECK (Default)

**Required:**
- `npm run validate:<current-feature>`
- `npm run typecheck`

**Forbidden:**
- Nested `npm run validate:*` for unrelated systems
- `execSync` / `spawnSync` validate chains inside FAST scripts
- Playwright runs in normal feature validators

**Allowed instead:** Local ownership boundary assertions.

Mark scripts:
```
VALIDATION_MODE: FAST_FEATURE_CHECK
```

---

## FULL_STACK_CHECK Triggers

Run the full chain only when:

- Ownership registry changes
- Answer authority changes
- Browser runner changes
- Task Governor changes
- Foundation Enforcement changes
- Release checkpoint

Mark legacy checkpoint scripts:
```
VALIDATION_MODE: FULL_STACK_CHECK
```

---

## Scanner

`scanValidatorScripts()` detects nested validate calls in `scripts/validate-*.ts`:

- **FAIL** — FAST_FEATURE_CHECK script with nested calls
- **WARN** — UNMARKED script with nested calls
- **PASS** — Only FULL_STACK_CHECK scripts contain nested chains

---

## For Cursor / Future Foundations

**Default for every new Phase 2 foundation:**

1. Mark validator `VALIDATION_MODE: FAST_FEATURE_CHECK`
2. Run only `validate:<feature>` + `typecheck`
3. Use local registry boundary checks — not nested validators
4. Run full stack manually at checkpoint triggers only

This prevents DevPulse V2 from repeating V1's slow validation spiral.

---

## Validation

```bash
npm run validate:validation-budget
npm run typecheck
```

Pass token:

```
DEVPULSE_V2_VALIDATION_BUDGET_POLICY_V1_PASS
```

---

## Related Documents

- `DEVPULSE_V2_EVIDENCE_REGISTRY_FOUNDATION.md`
- `DEVPULSE_V2_CONSTITUTION.md`
