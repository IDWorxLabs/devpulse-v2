# Founder Validation Integration Rule

**Permanent architecture rule — Phase 24.9.9**

## Rule

All founder-facing validation systems **must** integrate into the **Founder Testing Orchestrator** (`runFounderTestingModeV5`).

They may **not** require:

- separate founder buttons
- separate founder workflows
- separate founder actions

## Primary entry point

| Surface | Entry |
|---------|-------|
| Product shell | **Run Founder Test** button |
| API | `POST /api/founder-test/run` |
| Orchestrator | `runFounderTestingModeV5()` |

## Integrated systems (founder-facing)

- Project Memory / Insights clarity
- Live Preview Reality
- Running Application Visibility
- Verification Results Visibility
- Change Intelligence Visibility
- Founder Action Center (output of testing, not separate workflow)
- Founder Sensemaking / Product Coherence (Phase 5 of testing)
- Trust, workflow, readiness, and launch evaluation layers (V1–V4 internal)

## Engineering-only exceptions

Internal validators remain CLI/engineering tools:

- `typecheck`, UVL internals, build validators, runtime validators
- `npm run validate:*` scripts used by CI and engineering checkpoints

These do **not** require founder UI buttons.

## Backward compatibility

- `POST /api/founder-test/run-v4` aliases unified V5 orchestration during migration.
- V1–V3 API routes remain for engineering validators only.

## Adding new founder-facing validation

1. Implement assessment module (authority + types).
2. Wire into V4 execution/visibility pipeline (or V5 phase).
3. Surface results in unified V5 report sections.
4. Feed Action Center / Coherence from test output — never separate founder run buttons.
5. Extend `validate:founder-testing-v5` scenarios.
