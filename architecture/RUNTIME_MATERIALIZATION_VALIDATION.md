# Runtime Materialization Truth Bridge Validation

Result: RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS

- [x] file: src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-types.ts: present
- [x] file: src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-registry.ts: present
- [x] file: src/runtime-materialization-truth-bridge/runtime-evidence-collector.ts: present
- [x] file: src/runtime-materialization-truth-bridge/runtime-proof-analyzer.ts: present
- [x] file: src/runtime-materialization-truth-bridge/runtime-truth-reconciler.ts: present
- [x] file: src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-report-builder.ts: present
- [x] file: src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-history.ts: present
- [x] file: src/runtime-materialization-truth-bridge/runtime-materialization-truth-bridge-authority.ts: present
- [x] file: src/runtime-materialization-truth-bridge/index.ts: present
- [x] RUNTIME_MATERIALIZATION_TRUTH_BRIDGE_PASS token: missing
- [x] RUNTIME_MATERIALIZATION_TRUTH operation: missing
- [x] Rule 1 APPLICATION_PROVEN: missing
- [x] Rule 2 RUNTIME_START_FAILURE: missing
- [x] Rule 3 ROUTE_FAILURE: missing
- [x] Rule 4 EVIDENCE_PROPAGATION_FAILURE: missing
- [x] applyRuntimeMaterializationTruthToClaims: missing
- [x] APPLICATION_WORKS claim patch: missing
- [x] founder questions registered: 7
- [x] launch readiness wired: missing
- [x] truth matrix wired: missing
- [x] runtimeMaterializationTruthBridge input: missing
- [x] no file mutation in authority: authority may mutate files
- [x] skip gap activation: missing
- [x] skip preview gap activation: missing
- [x] assessment completes: RUNTIME_MATERIALIZATION_TRUTH_COMPLETE
- [x] runtime evidence consumed: PARTIAL
- [x] proof analysis assigned: APPLICATION_PARTIAL
- [x] final APPLICATION truth derived: APPLICATION_PARTIAL
- [x] failure boundary identified: FOUNDER_FLOW
- [x] founder answers generated: empty
- [x] rules applied: 2
- [x] history recorded: 1
- [x] report markdown builds: missing
- [x] reconciliation report builds: missing
- [x] FILES_EXIST distinguished from APPLICATION_WORKS: FOUNDER_FLOW
- [x] APPLICATION_WORKS claim patched: missing
- [x] APPLICATION_RUNS claim patched: missing
- [x] launch reconciliation consumes runtime bridge: missing

## Assessment snapshot

- finalApplicationTruth=APPLICATION_PARTIAL
- rootCause=EVIDENCE_PROPAGATION_FAILURE
- failureBoundary=FOUNDER_FLOW
- contradictionCount=1
- founderTestVerdictReconciled=true
- filesExistOnDisk=true
- runtimeProofLevel=PARTIAL
- applicationBoots=true
- routesReachable=true
- uiRenders=true
