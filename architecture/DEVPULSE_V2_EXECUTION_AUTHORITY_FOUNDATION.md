# DevPulse V2 Execution Authority Foundation

**Phase:** 6.1  
**System ID:** `execution_authority`  
**Authority:** `devpulse_v2_execution_authority`

## Why Execution Authority Exists

DevPulse V2 is entering Phase 6 — execution and recovery. Before any system runs commands, writes files, or modifies projects, DevPulse needs a **single governance authority** that defines:

- What counts as execution
- Who may request execution
- What must be blocked until future gated systems exist

Execution Authority is that governance layer.

## Like Chat Authority, But for Execution

Chat Authority owns **who may answer** the founder. Execution Authority owns **who may execute** — and in Phase 6.1, the answer is: **almost nobody, for almost nothing**.

| Chat Authority | Execution Authority |
|----------------|---------------------|
| Governs answer creation | Governs execution permission |
| Single answer authority | Single execution governance authority |
| Does not replace user intent | Does not replace observability or planning |
| Protection policy enforces boundaries | Policy engine blocks unsafe operations |

## Why No Execution Is Allowed Yet

Phase 6.1 is **foundation only**. The authority:

- Classifies requests
- Allows read-only operations
- Blocks writes, commands, project changes, recovery, and autonomy
- Records governance decisions (not execution events)
- Publishes summaries to Central Brain

It does **not**:

- Execute commands
- Modify files
- Apply patches
- Perform recovery
- Approve itself
- Bypass founder approval

Runtime execution belongs to Phase 6.2 and later, under explicit gates.

## Read-Only vs Execution

| Classification | Phase 6.1 | Example |
|----------------|-----------|---------|
| `READ_ONLY` | **Allowed** | "read timeline events" |
| `WRITE_OPERATION` | Blocked | "write file" |
| `COMMAND_EXECUTION` | Blocked | "run npm test" |
| `PROJECT_MODIFICATION` | Blocked | "apply patch" |
| `RECOVERY_ACTION` | Blocked | "rollback to checkpoint" |
| `AUTONOMOUS_ACTION` | Blocked | "continue autonomously" |

Read-only operations observe, list, summarize, and report. They do not change system state outside governance records.

## Project Modification Requires Founder Approval

Project changes affect the founder's codebase and trust surface. Blocked `PROJECT_MODIFICATION` and `WRITE_OPERATION` requests name the future gate:

**`founder_approval_execution_gate`**

No system may modify projects until that gate exists and founder approval is recorded.

## Recovery Execution Is Separate

Recovery **planning** exists (Recovery Strategy Planner). Recovery **execution** does not. Blocked `RECOVERY_ACTION` requests require:

**`recovery_execution_engine`**

Planning and execution remain architecturally separate.

## Autonomous Action Is Blocked

Autonomous execution without founder oversight violates DevPulse V2 constitutional boundaries. Blocked `AUTONOMOUS_ACTION` requests require:

**`world2_isolation_or_autonomy_gate`**

## Phase 6.2 — Runtime Under This Authority

Phase 6.2 will build the execution package runtime. It will:

- Submit requests to Execution Authority
- Respect classification and blocking rules
- Require named future gates before writes, commands, or recovery
- Remain subordinate to founder approval

Execution Authority remains the **policy owner**; runtime systems are **consumers** of its decisions.

## Validation

```bash
npm run validate:execution-authority
npm run typecheck
```

**Pass token:** `DEVPULSE_V2_EXECUTION_AUTHORITY_FOUNDATION_V1_PASS`

## Critical Rules

- Governance and classification only
- Read-only allowed; everything else blocked
- Central Brain and Timeline Ledger remain owners — bridges publish/record only
- All existing foundation systems must remain non-executing
