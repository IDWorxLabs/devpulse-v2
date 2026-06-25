# Command Center Runtime Health Report

**Generated:** 2026-06-25T00:19:33.371Z

**Pass Token:** `COMMAND_CENTER_RUNTIME_HEALTH_PASS`

**Proof Status:** PROVEN

## Active Process Owner

- Port 4321 listener: YES
- Process: AiDevEngine founder-reality-server
- PID(s): 22420
- Command: pid 22420: "C:\Program Files\nodejs\node.exe" --require C:\Users\Richa\Desktop\DevPulse-V2\node_modules\tsx\dist\preflight.cjs --import file:///C:/Users/Richa/Desktop/DevPulse-V2/node_modules/tsx/dist/loader.mjs server/founder-reality-server.ts

## Port Verification

- Production port 4321 listening: YES
- Listener count: 1
- Intended AiDevEngine process: YES
- PIDs: 22420
- pid 22420: "C:\Program Files\nodejs\node.exe" --require C:\Users\Richa\Desktop\DevPulse-V2\node_modules\tsx\dist\preflight.cjs --import file:///C:/Users/Richa/Desktop/DevPulse-V2/node_modules/tsx/dist/loader.mjs server/founder-reality-server.ts
- Duplicate server risk: NO

## Manifest Status

- Manifest healthy: YES
- Manifest degraded fallback: NO
- Manifest load error: none
- Operator feed sections: 26
- Validators in manifest: 470

## Critical API Status

- `/` → 200 (11ms)
- `/api/founder-reality.json` → 200 (3ms)
- `/api/product-workspace.json` → 200 (49ms)
- `/api/brain/health` → 200 (9ms)

## Dashboard Status

- **Capability Ownership** `/api/founder/canonical-ownership-v2` → 200
- **Customer Operations** `/api/founder/customer-operations-platform-v1` → 200
- **Production Observability** `/api/founder/production-observability-platform-v1` → 200
- **Continuous Deployment** `/api/founder/continuous-deployment-pipeline-v1` → 200
- **Evidence Revalidation** `/api/founder/evidence-revalidation-cycle-v1` → 200
- **Evidence Freshness** `/api/founder/operational-evidence-freshness-authority-v1` → 200
- **Failure Escalation** `/api/founder/unified-failure-escalation-authority-v1` → 200
- **Multi-Project Execution** `/api/founder/multi-project-concurrent-execution-v1` → 200
- **World2** `/api/founder/world2-real-instantiation-v1` → 200
- **Self-Evolution** `/api/founder/self-evolution-execution-v1` → 200

## Refresh & Stress Stability

- Stress requests: 50
- Stress failures: 0
- Stress duration: 99ms
- Refresh simulation passes: 5
- Refresh simulation failures: 0
- Server alive after stress: YES

## Live Production Server (port 4321)

- Reachable: YES
- GET /api/brain/health: 200
- GET /api/founder-reality.json: 200
- Live manifest degraded: NO
- Live manifest error: none

## Refresh Stability

- Repeated manifest + dashboard bundle loads do not crash the ephemeral test server
- 5 full refresh rounds passed (manifest, workspace, health, all dashboard routes)
- No ERR_CONNECTION_REFUSED when production server is running and healthy

## Remaining Risks

- None identified

## Recommended Actions

- AiDevEngine already running on http://localhost:4321 — reuse it or stop PID 22420 before restarting

**COMMAND_CENTER_RUNTIME_HEALTH_PASS** — Command Center runtime verified stable.
