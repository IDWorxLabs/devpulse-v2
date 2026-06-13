# Phase 26.1 — LLM Environment Loading Report

## Problem

Phase 26 added LLM provider support reading `process.env.LLM_API_KEY`, but `.env` at the project root was never loaded. Node does not read `.env` automatically, so the LLM brain always saw `LLM_API_KEY` as undefined and reported disconnected.

## Solution

Load environment variables at server startup **before** brain/LLM modules handle requests.

### Files changed

| File | Change |
|------|--------|
| `server/load-env.ts` | **New** — `dotenv.config({ path: ROOT/.env })` |
| `server/founder-reality-server.ts` | First import: `import './load-env.js'` |
| `server/brain-api-handler.ts` | Health payload adds `llmProvider`, `llmModel`, `llmApiKeyConfigured` |
| `public/founder-reality/app.js` | Brain health check updates LLM diagnostics panel |
| `package.json` | `dotenv` dependency + `validate:llm-env-loading` script |

### Why `load-env.ts` instead of inline `dotenv.config()`?

ES modules hoist all `import` statements before module body runs. Placing `dotenv.config()` in `founder-reality-server.ts` body would run **after** sibling imports (including `brain-api-handler`) are linked. A dedicated `load-env.ts` imported **first** ensures `.env` is loaded before other server modules initialize.

## Bootstrap order

```
npm run dev
  → tsx server/founder-reality-server.ts
    → import './load-env.js'   (dotenv.config)
    → import brain-api-handler / other routes
    → listen on port
```

## Health endpoint

`GET /api/brain/health` now includes:

- `llmConnected`: `true` | `false`
- `llmProvider`: e.g. `openai`
- `llmModel`: e.g. `gpt-4o-mini`
- `llmApiKeyConfigured`: `true` | `false` (never exposes the key)

## Validation

```bash
npm run validate:llm-env-loading
npm run validate:real-llm-chat-brain
```

Pass token: `LLM_ENV_LOADING_PASS`

## After restart

1. Stop and restart `npm run dev` (required — env loads only at process start)
2. Open System Diagnostics — LLM Connected should show **YES** or **NO**, not **UNKNOWN**
3. Provider / Model should show e.g. `openai / gpt-4o-mini`

## Security

- API keys remain in `.env` only
- Logs and health responses report `LLM_API_KEY configured: yes/no` — never the key value
- Do not commit `.env` to git
