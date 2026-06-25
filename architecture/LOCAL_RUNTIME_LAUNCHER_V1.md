# Local Runtime Launcher V1

AiDevEngine Command Center runs on a local Node server (`npm run dev`, port **4321**). Manual terminal lifecycle caused stale processes, occupied ports, and half-alive UI states. Local Runtime Launcher V1 makes startup a desktop action.

## What it does

1. **Start-AiDevEngine.bat** (repo root) calls **scripts/start-aidevengine-local.ps1**
2. The launcher checks port **4321**
3. If a healthy runtime is already running, it opens the browser and exits
4. If the runtime is stale or unhealthy, it stops **only** processes whose command line includes `founder-reality-server` or `npm run dev`
5. Otherwise it starts `npm run dev` in a dedicated PowerShell window
6. It waits until:
   - `GET /api/brain/health` returns **200** with `buildIntentRouting`, `registryLoaded`, and `runtimeReady`
   - `GET /api/projects/registry.json` responds
   - Server logs show `PROJECT_REGISTRY_LOADED count=X active=Y path=...`
7. It opens **http://localhost:4321**

## Desktop shortcut (Windows)

1. Open File Explorer and go to your AiDevEngine repo root (folder containing `Start-AiDevEngine.bat`).
2. Right-click **Start-AiDevEngine.bat** → **Show more options** → **Create shortcut**.
3. Drag the shortcut to the Desktop (or copy/paste).
4. Optional: right-click the shortcut → **Properties** → set **Start in** to the repo root if Windows cleared it.
5. Optional: click **Change Icon** and pick an app icon.

Double-click the shortcut to start AiDevEngine. Do not rely on manual `npm run dev` for normal use.

## Health endpoint

`GET /api/brain/health` includes local runtime markers:

| Field | Purpose |
|-------|---------|
| `serverStartedAt` | ISO timestamp when this process started |
| `buildIntentRouting` | `true` when build-intent routing is active |
| `registryLoaded` | `true` when project registry bootstrap succeeded |
| `registryPath` | Path to `project-registry-v1.json` |
| `projectCount` | Total projects in registry |
| `activeProjectCount` | Active projects in registry |
| `serverPid` | Node process id |
| `port` | Listening port (4321) |
| `version` | Package version |
| `commit` | Short git commit when available |
| `runtimeReady` | `true` when registry + runtime are safe to use |

If the registry fails to load at startup, the server exits with `REGISTRY_BOOTSTRAP_FAILED` and does not serve a “half alive” API.

## UI behavior

When health is missing or stale, Command Center shows a full-width banner:

> AiDevEngine local runtime is stale or unavailable. Restart using Start-AiDevEngine.

Project creation and brain/build requests are blocked until health passes.

## Validation

```bash
npm run validate:local-runtime-launcher
```

## Troubleshooting

- **Port 4321 in use by another app** — free the port or change `FOUNDER_REALITY_PORT` in server config (advanced).
- **Banner persists after shortcut start** — close old runtime windows, run **Start-AiDevEngine.bat** again.
- **Registry bootstrap failed** — check `.aidevengine/project-registry-v1.json` permissions and server console for `REGISTRY_BOOTSTRAP_FAILED`.
