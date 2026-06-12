# World 2 Repository Snapshot — Phase 24T Report

Generated after Phase 24T repository snapshot authority implementation. Snapshot eligibility and scope only — no repository copy.

## Purpose

Govern whether a disposable World 2 workspace may receive a **read-only repository snapshot**.

**Core principle:** Instantiation eligibility is not permission to copy the repository. Repository snapshotting requires its own safety gate.

This phase defines snapshot eligibility, scope, exclusions, manifest, and safety rules only — **it does NOT copy the repository**.

## Files Changed

### New module

- `src/world2-repository-snapshot/world2-repository-snapshot-types.ts`
- `src/world2-repository-snapshot/world2-repository-snapshot-registry.ts`
- `src/world2-repository-snapshot/world2-repository-snapshot-authority.ts`
- `src/world2-repository-snapshot/world2-repository-snapshot-history.ts`
- `src/world2-repository-snapshot/world2-repository-snapshot-report-builder.ts`
- `src/world2-repository-snapshot/index.ts`

### Validation

- `scripts/validate-world2-repository-snapshot.ts`
- `package.json` — `validate:world2-repository-snapshot` script

## Input Authorities (Read-Only)

| Authority | Role |
|-----------|------|
| World 2 Disposable Workspace Instantiator | Instantiation readiness gate |
| World 2 Workspace Materialization | Blueprint paths |
| World 2 Workspace Population | Required files/directories |
| World 2 Disposable Workspace | Workspace boundary + source project |

## Core Question

What repository snapshot is allowed to enter the disposable workspace?

## Snapshot States

| State | When |
|-------|------|
| **SNAPSHOT_READY** | Instantiation ready + upstream READY + safety pass |
| **SNAPSHOT_READY_WITH_RESTRICTIONS** | Upstream warnings or sensitive paths excluded |
| **SNAPSHOT_BLOCKED** | Live/production/secrets/unbounded copy or upstream blocked |
| **INSUFFICIENT_EVIDENCE** | Missing required upstream authorities |
| **NOT_READY** | Upstream chain not ready |

## Standard Exclusions

- `node_modules/**`
- `.git/objects/**`, `.git/hooks/**`, `.git/logs/**`, `.git/refs/**`
- `dist/**`, `build/**`, `.cache/**`
- `.env`, secrets, credentials

## Snapshot Bounds

- maxFiles: 48
- maxDirectories: 32
- maxSnapshotAttempts: 3
- maxSensitiveMatches: 0

## Safety Checks

- No live mutation paths
- No production paths
- No secrets/env files
- node_modules excluded
- .git internals excluded (metadata-only allowed)
- Build outputs excluded
- Cache directories excluded
- No unbounded root copy
- No external network copy

## Flow

```
Disposable Workspace Instantiator (24S)
      ↓
Repository Snapshot Authority (24T)
      ↓
SNAPSHOT_READY / SNAPSHOT_BLOCKED
```

## Pass Token

```
WORLD2_REPOSITORY_SNAPSHOT_PASS
```
