# FOUNDER_FLOW_RUNTIME_PROOF_REPORT

Generated: 2026-06-19T17:53:57.249Z
Proof ID: founder-flow-runtime-proof-2-1781891637249
Workspace: build-ready-idea-1

## Core Question

After UI renders, can a founder complete the critical runtime workflow with final result delivery to client cache or result store?

## Upstream Gates

- filesExistOnDisk: true
- dependenciesReady: true
- applicationBootsBeforeProbe: true
- routesReachableBeforeProbe: true
- uiRendersBeforeProbe: **true**

## Flow Probe

- founderRuntimeOpen: true
- uiLoadedAsApp: true
- flowStartProven: true
- interactiveElements: 0

## Result Store Check

- resultStorePresent: false
- reportGenerated: false
- finalResultDelivered: **false**
- clientCacheUpdated: false
- partialReportOnly: false
- evidencePropagationAligned: true
- detail: No founder test run result in store.

## Classification

- failureClass: **RESULT_STORE_MISSING**
- founderFlowProven: **false**
- reason: No founder test run result in store and client cache not updated.

## Recommended Actions

- Run founder test through completion
- Verify /api/founder-test/result returns final report payload

Cache key: `founder-flow-runtime-proof-v1:6c4ca9fc5cd4c9a4`