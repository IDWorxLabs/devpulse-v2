# DevPulse V2 — Evidence Registry Foundation

**GF7 OMEGA — Proof Reference Store V1**  
**System ID:** `evidence_registry`  
**Phase:** 2

---

## Purpose

The Evidence Registry is the **single lightweight source of truth** for proof references used by Trust Engine, Project Vault, Browser Verification, Chat Authority, Shell, and future systems.

It stores evidence records only — it does **not** score trust, make decisions, or execute work.

---

## What This Is NOT

- Not Trust Engine, Project Vault, or Browser Harness replacement
- Not Central Brain, AiDev, execution, or diagnostics
- Not answer authority
- Not a trust score calculator

---

## Storage

**In-memory only** — no database, file persistence, or cloud.

---

## API

| Method | Purpose |
|--------|---------|
| `addEvidence(record)` | Store evidence reference |
| `getEvidence(evidenceId)` | Lookup by ID |
| `listEvidence()` | All records (newest first) |
| `listEvidenceBySource(source)` | Filter by source |
| `listEvidenceBySystem(systemId)` | Filter by related system |
| `createEvidenceSnapshot()` | Point-in-time snapshot |
| `getRegistryState()` | Registry counts and status |

---

## Integration Helpers

Convert existing outputs into evidence **without rerunning validations**:

- `fromBrowserVerificationResult()`
- `fromTrustEngineResult()`
- `fromProjectVaultSnapshot()`
- `fromChatAnswer()`
- `fromShellReport()`

---

## Validation

```bash
npm run validate:evidence-registry
```

Pass token:

```
DEVPULSE_V2_EVIDENCE_REGISTRY_FOUNDATION_V1_PASS
```

---

## Related Documents

- `DEVPULSE_V2_TRUST_ENGINE_FOUNDATION.md`
- `DEVPULSE_V2_PROJECT_VAULT_FOUNDATION.md`
