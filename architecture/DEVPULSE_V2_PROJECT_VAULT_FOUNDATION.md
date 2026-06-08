# DevPulse V2 — Project Vault Foundation

**GF7 OMEGA — Lightweight Project Memory V1**  
**System ID:** `project_vault`  
**Phase:** 2

---

## Purpose

The Project Vault is the first lightweight project memory/state layer. It records project identity, metadata, status, and facts without becoming intelligence, execution, or cloud sync.

---

## What This Is NOT

- Not Central Brain
- Not AiDev
- Not execution
- Not cloud sync
- Not Git automation
- Not answer authority
- Not trust calculator

---

## Storage

**In-memory only** for this foundation — no database, no cloud, no file persistence.

---

## API

| Method | Purpose |
|--------|---------|
| `createProject(name, summary)` | Create project record |
| `getProject(projectId)` | Fetch project by ID |
| `listProjects()` | List all projects (newest first) |
| `addProjectFact(projectId, fact)` | Append fact to project |
| `storeTrustEngineSummaryFacts(projectId, trustResult)` | Store Trust Engine summary (facts only) |
| `createProjectSnapshot(projectId)` | Capture point-in-time snapshot |
| `getVaultState()` | Vault-wide counts and status |

---

## Trust Engine Integration

- Trust Engine remains trust owner
- Vault stores `trust_status`, `trust_score`, and `trust_id` facts with source `TRUST_ENGINE`
- Vault does **not** calculate trust or validate browser reality

---

## Validation

```bash
npm run validate:project-vault
```

Pass token:

```
DEVPULSE_V2_PROJECT_VAULT_FOUNDATION_V1_PASS
```

---

## Related Documents

- `DEVPULSE_V2_TRUST_ENGINE_FOUNDATION.md`
- `DEVPULSE_V2_CONSTITUTION.md`
