# Chat Stress Timeout Run Result Materialization Report

## Root Cause

- Watchdog/reconcile paths marked scenarios settled as TIMEOUT without pushing a ChatStressScenarioRun into the batch runs array.
- Batch finalizer then rejected duplicate settlement, leaving scoring/report with settled count 12 but missing run objects.

## Repair

- `buildChatStressTimeoutRunResult` materializes terminal TIMEOUT runs with scenarioId/status/reason/duration/category/terminal.
- `materializeMissingChatStressRuns` ensures every started scenario has a run object before scoring.
- Watchdog settlement no longer marks TIMEOUT without run materialization callback.
- Evaluator handles TIMEOUT/ERROR/SKIPPED without throwing; timeout scores remain failed/blocker paths.

## Validation

- [x] file: src/founder-test-chat-stress-simulation/chat-stress-timeout-run-materialization.ts: present
- [x] file: src/founder-test-chat-stress-simulation/chat-response-simulator.ts: present
- [x] file: src/founder-test-chat-stress-simulation/chat-response-evaluator.ts: present
- [x] file: scripts/validate-chat-stress-timeout-run-result-materialization.ts: present
- [x] timeout run builder: builder
- [x] materialize missing runs: materialize
- [x] timeout reason constant: reason
- [x] terminal flag on timeout run: terminal
- [x] passed false on timeout: passed false
- [x] batch materialization hook: batch hook
- [x] push materialized run: push
- [x] evaluator timeout branch: timeout eval
- [x] no throw for terminal timeout: terminal guard
- [x] watchdog does not settle without run: watchdog
- [x] report timeout evidence: report line
- [x] list started scenario ids: started ids
- [x] no scoring override: scoring
- [x] no verdict override: verdict
- [x] no validator recursion: recursion
- [x] package script registered: script
- [x] cap-05 scenario exists: cap-05
- [x] timeout run scenarioId: cap-05
- [x] timeout run status: TIMEOUT
- [x] timeout run reason: Scenario timed out
- [x] timeout run category: CAPABILITY
- [x] timeout run duration: 15000
- [x] timeout run terminal: true
- [x] timeout run not passed: false
- [x] materialized timeout run exists: materialized
- [x] materialized count for started: 1
- [x] timeout evaluation not passed: not passed
- [x] timeout evaluation score zero: 0
- [x] evaluateChatStressRuns no throw for TIMEOUT: no throw
- [x] orphan watchdog settlement TIMEOUT: settled
- [x] orphan settlement materializes run: orphan run
- [x] concurrent batch includes cap-05 run: cap-05,cap-06
- [x] started scenarios have runs: 2 vs 2
- [x] founder report timeout evidence: ## Chat Stress Simulation

Broad chat intelligence stress test using the same Command Center Brain + LLM Chat Brain path as the live UI.

Total scenarios: 2
Passed: 0
Failed: 1
Weak answers: 0
Overall


SUCCESS: CHAT_STRESS_TIMEOUT_RUN_RESULT_MATERIALIZATION_V1_PASS
