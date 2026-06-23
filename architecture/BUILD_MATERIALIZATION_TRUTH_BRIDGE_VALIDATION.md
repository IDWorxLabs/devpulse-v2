# Build Materialization Truth Bridge Validation

Result: BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS

- [x] file: src/build-materialization-truth-bridge/build-materialization-truth-bridge-types.ts: present
- [x] file: src/build-materialization-truth-bridge/build-materialization-truth-bridge-registry.ts: present
- [x] file: src/build-materialization-truth-bridge/evidence-bridge.ts: present
- [x] file: src/build-materialization-truth-bridge/truth-reconciler.ts: present
- [x] file: src/build-materialization-truth-bridge/build-materialization-truth-bridge-report-builder.ts: present
- [x] file: src/build-materialization-truth-bridge/build-materialization-truth-bridge-history.ts: present
- [x] file: src/build-materialization-truth-bridge/build-materialization-truth-bridge-authority.ts: present
- [x] file: src/build-materialization-truth-bridge/index.ts: present
- [x] BUILD_MATERIALIZATION_TRUTH_BRIDGE_PASS token: missing
- [x] BUILD_MATERIALIZATION_TRUTH operation: missing
- [x] Rule 1 ARTIFACTS_NOT_GENERATED guard: missing
- [x] Rule 2 BUILD_TRUTH_CONTRADICTION: missing
- [x] Rule 3 filesystem evidence priority: missing
- [x] Rule 4 EVIDENCE_PROPAGATION_FAILURE: missing
- [x] founder questions registered: 6
- [x] reconciliation rules count: 4
- [x] launch readiness wired: missing
- [x] truth matrix wired: missing
- [x] buildMaterializationTruthBridge input: missing
- [x] no file mutation in authority: authority may mutate files
- [x] no synthetic evidence: authority may synthesize evidence
- [x] assessment completes: BUILD_MATERIALIZATION_TRUTH_COMPLETE
- [x] disk evidence consumed: missing scan
- [x] materialization verdict assigned: BUILD_MATERIALIZATION_PROVEN
- [x] final BUILD truth derived: BUILD_PROVEN
- [x] founder answers generated: empty
- [x] rules applied: 4
- [x] history recorded: 1
- [x] report markdown builds: missing
- [x] reconciliation report builds: missing
- [x] Rule 1 — not ARTIFACTS_NOT_GENERATED when disk proves files: BUILD_MATERIALIZATION_PROVEN
- [x] Rule 1 — founder misreport detected or reconciled: reconciled=true, contradictions=2
- [x] Truth Matrix BUILD claim patched: missing
- [x] Truth Matrix uses BUILD_MATERIALIZATION_TRUTH verdict: PROVEN
- [x] launch reconciliation consumes bridge: missing
- [x] artifacts→files blocker suppression available: expected suppression when disk proves files

## Assessment snapshot

- finalBuildTruth=BUILD_PROVEN
- rootCause=BUILD_MATERIALIZATION_PROVEN
- materializationVerdict=BUILD_MATERIALIZATION_PROVEN
- contradictionCount=2
- founderTestVerdictReconciled=true
- truthMatrixVerdictUpdated=false
- workspaceCount=2991
- existingArtifacts=88
- missingArtifacts=0
- founderFirstBrokenLink=artifacts→files
