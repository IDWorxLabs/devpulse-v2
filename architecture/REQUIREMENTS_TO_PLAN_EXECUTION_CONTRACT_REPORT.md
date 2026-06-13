# Requirements-to-Plan Execution Contract

**Phase 26.7** — Repair the first broken link in Autonomous Build Execution Proof.

## Core Question

Can AiDevEngine prove that a user idea became a structured, build-ready requirements contract linked to plan tasks?

## Problem

Phase 26.6 reported `firstBrokenStage = REQUIREMENTS`. Planning summaries, requirement lists, and chat answers alone are not enough — the chain needs traceable contracts.

## Architecture

```
User Idea
  ↓ User Idea Contract
Requirement Contract
  ↓ Clarifying Gap Analysis
Plan Contract
  ↓ Build-Ready Execution Contract
Contract Linkage Analysis
  ↓
Autonomous Build Execution Proof (REQUIREMENTS + PLAN stages)
```

## Module

`src/requirements-to-plan-execution-contract/`

| Component | Role |
|-----------|------|
| `user-idea-contract-builder.ts` | Capture/normalize prompt; INSUFFICIENT_INPUT for vague ideas |
| `requirement-contract-builder.ts` | Extract typed requirements linked to ideaId |
| `clarifying-gap-analyzer.ts` | Detect critical gaps; NEEDS_CLARIFICATION |
| `plan-contract-builder.ts` | Plan tasks with sourceRequirementIds |
| `build-ready-contract-builder.ts` | Build units, execution order, readiness state |
| `contract-linkage-analyzer.ts` | idea→req→plan→units→verification traceability |
| `requirements-to-plan-contract-authority.ts` | Orchestrator; PROVEN/PARTIAL/NOT_PROVEN |

## Readiness States

| State | Meaning |
|-------|---------|
| BUILD_READY | Idea, requirements, plan, linkage, and verification criteria ready for builder handoff |
| NEEDS_CLARIFICATION | Critical gaps remain — clarifying questions generated |
| NEEDS_PLANNING | Requirements exist but plan contract incomplete |
| BLOCKED | Insufficient input or no contract |

## Execution Proof Integration

When contract is **BUILD_READY** and **linkageConnected**:

- REQUIREMENTS stage = **PROVEN**
- PLAN stage = **PROVEN**
- `firstBrokenStage` advances to **BUILD**

When **NEEDS_CLARIFICATION**:

- REQUIREMENTS = **PARTIAL**
- PLAN = **NOT_PROVEN**

## Validation Test Cases

| Case | Prompt | Expected |
|------|--------|----------|
| A | "Build me an app" | INSUFFICIENT_INPUT / NOT_PROVEN |
| B | Clear CRM prompt | Requirements + plan + BUILD_READY + linkage |
| C | "Booking app for salons" | Auth/roles clarifying questions |
| D | Traceability | Every plan task links to requirement IDs |
| E | Verification | Every build unit has verification requirements |
| F | Founder Test | Execution proof REQUIREMENTS/PLAN consume this authority |

## Chat Hook

`storeBuildReadyContractFromPrompt(rawPrompt)` stores the last contract for future UI wiring. No code generation in this phase.

## Validation

```bash
npm run validate:requirements-to-plan-contract
```

Pass token: `REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS`

---

`REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS`
