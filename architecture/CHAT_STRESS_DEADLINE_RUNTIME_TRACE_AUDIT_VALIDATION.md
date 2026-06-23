# Chat Stress Deadline Runtime Trace Audit Validation

Run audited: founder-test-runtime-1781430231706
Observed message: Running bounded chat stress inside product readiness has not advanced for 50s

Result: CHAT_STRESS_DEADLINE_RUNTIME_TRACE_AUDIT_V1_PASS

## Findings

- Failure message came from `analyzeArtifactBuildSubstepStall`, not `resolveChatStressStallHealth`.
- 50s STALLED implies pre-26.88 `stalledThresholdMs=45000`; on-disk 26.88 would yield SLOW at 50s.
- `activeScenarioCount > 0` grace applies in `analyzeRuntimeStall` / `resolveChatStressStallHealth`, not artifact sub-step path.
- Run was after 07:37 server start but before confirmed post-26.88 process reload.

- [x] run id decodes to 2026-06-14T09:43:51.706Z: 2026-06-14T09:43:51.706Z
- [x] artifact tracer is sole producer of "has not advanced for" template: launch-readiness-artifact-build-tracer.ts only
- [x] monitor polls artifact substep stall before chat stress snapshot: artifact@13360 chatSnap@14607
- [x] on-disk 26.88 artifact path yields SLOW at 50s (56s threshold): SLOW reason=Running bounded chat stress inside product readiness is taking longer than usual (50s elapsed)
- [x] 50s message would NOT match 26.88 artifact path: Running bounded chat stress inside product readiness is taking longer than usual (50s elapsed)
- [x] pre-26.88 45s threshold yields STALLED at 50s: STALLED
- [x] pre-26.88 path reproduces exact observed message: Running bounded chat stress inside product readiness has not advanced for 50s
- [x] 26.88 worst-case batch deadline is 56000ms: 56000
- [x] resolveChatStressWorstCaseBatchDeadlineMs matches constant: 56000
- [x] resolveChatStressStallHealth returns SLOW when activeScenarioCount > 0 and no overdue watchdog: SLOW active=2
- [x] orchestrator emits product-readiness-chat-stress-started with expected label: product-readiness-chat-stress-started
- [x] inferred chatStressMsUntilBatchDeadline at 50s elapsed is ~6000ms (inference only): 6000
