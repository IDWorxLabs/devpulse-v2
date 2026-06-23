# Authority Recursion Guard Fallback Report

## Fallback Policy

- proofLevel=PARTIAL or UNKNOWN
- launchImpact=TESTING_INFRASTRUCTURE_DEFECT
- skippedHeavyOrchestration=true
- recommendedFix: pass precomputed evidence into guarded path

## Detections

### AUTONOMOUS_BUILD_EXECUTION_PROOF

Rule: HEAVY_ORCHESTRATION_IN_VALIDATOR
Reason: Heavy orchestration blocked for AUTONOMOUS_BUILD_EXECUTION_PROOF inside guarded validation path
Caller stack: AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT

### FOUNDER_TEST_INTEGRATION

Rule: HEAVY_ORCHESTRATION_IN_VALIDATOR
Reason: Heavy orchestration blocked for FOUNDER_TEST_INTEGRATION inside guarded validation path
Caller stack: AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT

### FOUNDER_TEST_INTEGRATION

Rule: SAME_AUTHORITY_REENTRY
Reason: FOUNDER_TEST_INTEGRATION re-entered within the same authority chain
Caller stack: FOUNDER_TEST_INTEGRATION → AUTONOMOUS_REPAIR_LOOP

### FOUNDER_TEST_INTEGRATION

Rule: HEAVY_ORCHESTRATION_IN_VALIDATOR
Reason: Heavy orchestration blocked for FOUNDER_TEST_INTEGRATION inside guarded validation path
Caller stack: AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT

### FOUNDER_TEST_INTEGRATION

Rule: MAX_DEPTH_EXCEEDED
Reason: Authority depth 3 exceeds maxDepth 2
Caller stack: EVIDENCE_PROPAGATION_RECONCILIATION → AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT → AUTONOMOUS_REPAIR_LOOP

### FOUNDER_TEST_INTEGRATION

Rule: SAME_AUTHORITY_REENTRY
Reason: FOUNDER_TEST_INTEGRATION re-entered within the same authority chain
Caller stack: FOUNDER_TEST_INTEGRATION

## Safe Fallback Evidence

- AUTONOMOUS_BUILD_EXECUTION_PROOF: PARTIAL (PARTIAL) — Heavy orchestration blocked for AUTONOMOUS_BUILD_EXECUTION_PROOF inside guarded validation path
- FOUNDER_TEST_INTEGRATION: PARTIAL (PARTIAL) — Heavy orchestration blocked for FOUNDER_TEST_INTEGRATION inside guarded validation path
- FOUNDER_TEST_INTEGRATION: PARTIAL (PARTIAL) — FOUNDER_TEST_INTEGRATION re-entered within the same authority chain
- FOUNDER_TEST_INTEGRATION: PARTIAL (PARTIAL) — Heavy orchestration blocked for FOUNDER_TEST_INTEGRATION inside guarded validation path
- FOUNDER_TEST_INTEGRATION: PARTIAL (PARTIAL) — Authority depth 3 exceeds maxDepth 2
- FOUNDER_TEST_INTEGRATION: PARTIAL (PARTIAL) — FOUNDER_TEST_INTEGRATION re-entered within the same authority chain