# Founder Simulation Engine Report

Generated: 2026-06-13T11:09:31.037Z

## Summary

- Total simulation runs: 10
- Aggregate readiness score: 61/100
- Aggregate readiness category: NEEDS_CLARIFICATION
- Next best action: Increase intake evidence quality; current input is insufficient for planning.

## System Integration Proof

- Authorities reached:
- requirement-completeness-intelligence
- unified-intake-intelligence
- planning-gate-authority
- founder-test-automation
- founder-simulation-engine
- upload-system
- visual-reference-intelligence
- voice-notes-intelligence
- planning-brief-generator
- Authorities passed:
- requirement-completeness-intelligence
- unified-intake-intelligence
- founder-test-automation
- upload-system
- visual-reference-intelligence
- voice-notes-intelligence
- planning-gate-authority
- planning-brief-generator
- founder-simulation-engine
- Authorities failed:
- planning-gate-authority
- founder-simulation-engine
- requirement-completeness-intelligence
- unified-intake-intelligence
- upload-system
- Weak links:
- unified-intake-intelligence: confidence 79
- planning-gate-authority: confidence 53
- planning-gate-authority: confidence 74
- planning-gate-authority: confidence 56
- planning-gate-authority: confidence 60
- planning-gate-authority: confidence 65
- Launch blockers:
- planning-gate-authority: REJECT_PLANNING
- founder-simulation-engine: NOT_READY
- requirement-completeness-intelligence: INSUFFICIENT_REQUIREMENT_EVIDENCE
- unified-intake-intelligence: INSUFFICIENT_INTAKE_EVIDENCE
- planning-gate-authority: MISSING_UNIFIED_INTAKE
- upload-system: UNSUPPORTED_FILE_TYPE

## Scenario: Simple App Idea

- Simulation ID: founder-simulation-1
- Scenario type: SIMPLE_APP
- Final verdict: NOT_READY
- Readiness score: 41/100
- Explanation: Scenario "Simple App Idea" is not ready. The intelligence chain blocked or failed at: PLANNING_GATE_AUTHORITY.

### Stage Chain Proof

- UPLOAD_SYSTEM: SKIPPED (confidence: n/a, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: PASSED (confidence: 46, readiness: NEEDS_CLARIFICATION)
- UNIFIED_INTAKE_INTELLIGENCE: PASSED (confidence: 80, readiness: PARTIAL_UNDERSTANDING)
- PLANNING_GATE_AUTHORITY: BLOCKED (confidence: 34, readiness: NOT_READY)
- PLANNING_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 29, readiness: NOT_READY)
- FINAL_FOUNDER_READINESS_VERDICT: BLOCKED (confidence: 41, readiness: NOT_READY)

### Failure Analysis

- [CRITICAL] planning-gate-authority: REJECT_PLANNING
- [CRITICAL] FINAL_FOUNDER_READINESS_VERDICT: NOT_READY

## Scenario: Complex Marketplace

- Simulation ID: founder-simulation-2
- Scenario type: COMPLEX_MARKETPLACE
- Final verdict: NOT_READY
- Readiness score: 47/100
- Explanation: Scenario "Complex Marketplace" is not ready. The intelligence chain blocked or failed at: PLANNING_GATE_AUTHORITY.

### Stage Chain Proof

- UPLOAD_SYSTEM: PASSED (confidence: 90, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: PASSED (confidence: 62, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: PASSED (confidence: 54, readiness: NEEDS_CLARIFICATION)
- UNIFIED_INTAKE_INTELLIGENCE: LOW_CONFIDENCE (confidence: 79, readiness: HIGH_CONFIDENCE_UNDERSTANDING)
- PLANNING_GATE_AUTHORITY: BLOCKED (confidence: 24, readiness: NOT_READY)
- PLANNING_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 19, readiness: NOT_READY)
- FINAL_FOUNDER_READINESS_VERDICT: BLOCKED (confidence: 47, readiness: NOT_READY)

### Failure Analysis

- [MEDIUM] unified-intake-intelligence: UNIFIED_INTAKE_INTELLIGENCE returned LOW_CONFIDENCE
- [CRITICAL] planning-gate-authority: REJECT_PLANNING
- [CRITICAL] FINAL_FOUNDER_READINESS_VERDICT: NOT_READY

## Scenario: Mobile-First App

- Simulation ID: founder-simulation-3
- Scenario type: MOBILE_FIRST
- Final verdict: READY_FOR_PLANNING
- Readiness score: 95/100
- Explanation: Scenario "Mobile-First App" reached ready for planning with score 95/100.

### Stage Chain Proof

- UPLOAD_SYSTEM: PASSED (confidence: 90, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: PASSED (confidence: 62, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: PASSED (confidence: 81, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: PASSED (confidence: 57, readiness: NEEDS_CLARIFICATION)
- UNIFIED_INTAKE_INTELLIGENCE: PASSED (confidence: 100, readiness: READY_FOR_PLANNING)
- PLANNING_GATE_AUTHORITY: LOW_CONFIDENCE (confidence: 53, readiness: NEEDS_CLARIFICATION)
- PLANNING_BRIEF_GENERATOR: PASSED (confidence: 66, readiness: DRAFT_READY)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 66, readiness: HIGH_RISK)
- FINAL_FOUNDER_READINESS_VERDICT: PASSED (confidence: 95, readiness: READY_FOR_PLANNING)

### Failure Analysis

- [CRITICAL] planning-gate-authority: REQUEST_CLARIFICATION

## Scenario: SaaS Dashboard

- Simulation ID: founder-simulation-4
- Scenario type: SAAS_DASHBOARD
- Final verdict: READY_FOR_PLANNING
- Readiness score: 76/100
- Explanation: Scenario "SaaS Dashboard" reached ready for planning with score 76/100.

### Stage Chain Proof

- UPLOAD_SYSTEM: SKIPPED (confidence: n/a, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: PASSED (confidence: 56, readiness: NEEDS_CLARIFICATION)
- UNIFIED_INTAKE_INTELLIGENCE: PASSED (confidence: 96, readiness: READY_FOR_PLANNING)
- PLANNING_GATE_AUTHORITY: LOW_CONFIDENCE (confidence: 74, readiness: NEEDS_CLARIFICATION)
- PLANNING_BRIEF_GENERATOR: PASSED (confidence: 68, readiness: DRAFT_READY)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 68, readiness: HIGH_RISK)
- FINAL_FOUNDER_READINESS_VERDICT: PASSED (confidence: 76, readiness: READY_FOR_PLANNING)

### Failure Analysis

- [CRITICAL] planning-gate-authority: REQUEST_CLARIFICATION

## Scenario: AI-Powered Product

- Simulation ID: founder-simulation-5
- Scenario type: AI_POWERED
- Final verdict: READY_FOR_PLANNING
- Readiness score: 73/100
- Explanation: Scenario "AI-Powered Product" reached ready for planning with score 73/100.

### Stage Chain Proof

- UPLOAD_SYSTEM: SKIPPED (confidence: n/a, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: PASSED (confidence: 45, readiness: NEEDS_CLARIFICATION)
- UNIFIED_INTAKE_INTELLIGENCE: PASSED (confidence: 95, readiness: READY_FOR_PLANNING)
- PLANNING_GATE_AUTHORITY: LOW_CONFIDENCE (confidence: 56, readiness: NEEDS_CLARIFICATION)
- PLANNING_BRIEF_GENERATOR: PASSED (confidence: 55, readiness: DRAFT_READY)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 55, readiness: HIGH_RISK)
- FINAL_FOUNDER_READINESS_VERDICT: PASSED (confidence: 73, readiness: READY_FOR_PLANNING)

### Failure Analysis

- [CRITICAL] planning-gate-authority: REQUEST_CLARIFICATION

## Scenario: E-Commerce Product

- Simulation ID: founder-simulation-6
- Scenario type: E_COMMERCE
- Final verdict: NOT_READY
- Readiness score: 46/100
- Explanation: Scenario "E-Commerce Product" is not ready. The intelligence chain blocked or failed at: PLANNING_GATE_AUTHORITY.

### Stage Chain Proof

- UPLOAD_SYSTEM: PASSED (confidence: 90, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: PASSED (confidence: 62, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: PASSED (confidence: 46, readiness: NEEDS_CLARIFICATION)
- UNIFIED_INTAKE_INTELLIGENCE: LOW_CONFIDENCE (confidence: 79, readiness: HIGH_CONFIDENCE_UNDERSTANDING)
- PLANNING_GATE_AUTHORITY: BLOCKED (confidence: 20, readiness: NOT_READY)
- PLANNING_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 15, readiness: NOT_READY)
- FINAL_FOUNDER_READINESS_VERDICT: BLOCKED (confidence: 46, readiness: NOT_READY)

### Failure Analysis

- [MEDIUM] unified-intake-intelligence: UNIFIED_INTAKE_INTELLIGENCE returned LOW_CONFIDENCE
- [CRITICAL] planning-gate-authority: REJECT_PLANNING
- [CRITICAL] FINAL_FOUNDER_READINESS_VERDICT: NOT_READY

## Scenario: Incomplete Vague Prompt

- Simulation ID: founder-simulation-7
- Scenario type: INCOMPLETE_VAGUE
- Final verdict: NOT_READY
- Readiness score: 8/100
- Explanation: Scenario "Incomplete Vague Prompt" is not ready. The intelligence chain blocked or failed at: REQUIREMENT_COMPLETENESS_INTELLIGENCE, UNIFIED_INTAKE_INTELLIGENCE, PLANNING_GATE_AUTHORITY.

### Stage Chain Proof

- UPLOAD_SYSTEM: SKIPPED (confidence: n/a, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: FAILED (confidence: 0, readiness: n/a)
- UNIFIED_INTAKE_INTELLIGENCE: FAILED (confidence: 0, readiness: n/a)
- PLANNING_GATE_AUTHORITY: BLOCKED (confidence: n/a, readiness: n/a)
- PLANNING_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 32, readiness: HIGH_RISK)
- FINAL_FOUNDER_READINESS_VERDICT: BLOCKED (confidence: 8, readiness: NOT_READY)

### Failure Analysis

- [HIGH] requirement-completeness-intelligence: INSUFFICIENT_REQUIREMENT_EVIDENCE
- [HIGH] unified-intake-intelligence: INSUFFICIENT_INTAKE_EVIDENCE
- [CRITICAL] planning-gate-authority: MISSING_UNIFIED_INTAKE
- [CRITICAL] FINAL_FOUNDER_READINESS_VERDICT: NOT_READY

## Scenario: Conflicting Evidence

- Simulation ID: founder-simulation-8
- Scenario type: CONFLICTING_EVIDENCE
- Final verdict: NOT_READY
- Readiness score: 56/100
- Explanation: Scenario "Conflicting Evidence" is not ready. The intelligence chain blocked or failed at: PLANNING_GATE_AUTHORITY.

### Stage Chain Proof

- UPLOAD_SYSTEM: PASSED (confidence: 90, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: PASSED (confidence: 62, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: PASSED (confidence: 81, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: PASSED (confidence: 45, readiness: NEEDS_CLARIFICATION)
- UNIFIED_INTAKE_INTELLIGENCE: LOW_CONFIDENCE (confidence: 79, readiness: HIGH_CONFIDENCE_UNDERSTANDING)
- PLANNING_GATE_AUTHORITY: BLOCKED (confidence: 45, readiness: NOT_READY)
- PLANNING_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 40, readiness: NOT_READY)
- FINAL_FOUNDER_READINESS_VERDICT: BLOCKED (confidence: 56, readiness: NOT_READY)

### Failure Analysis

- [MEDIUM] unified-intake-intelligence: UNIFIED_INTAKE_INTELLIGENCE returned LOW_CONFIDENCE
- [CRITICAL] planning-gate-authority: REJECT_PLANNING
- [CRITICAL] FINAL_FOUNDER_READINESS_VERDICT: NOT_READY

## Scenario: Screenshot-Supported Project

- Simulation ID: founder-simulation-9
- Scenario type: SCREENSHOT_SUPPORTED
- Final verdict: READY_FOR_PLANNING
- Readiness score: 85/100
- Explanation: Scenario "Screenshot-Supported Project" reached ready for planning with score 85/100.

### Stage Chain Proof

- UPLOAD_SYSTEM: PASSED (confidence: 90, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: PASSED (confidence: 62, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: PASSED (confidence: 42, readiness: NEEDS_CLARIFICATION)
- UNIFIED_INTAKE_INTELLIGENCE: PASSED (confidence: 87, readiness: READY_FOR_PLANNING)
- PLANNING_GATE_AUTHORITY: LOW_CONFIDENCE (confidence: 60, readiness: NEEDS_CLARIFICATION)
- PLANNING_BRIEF_GENERATOR: PASSED (confidence: 50, readiness: DRAFT_READY)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 44, readiness: HIGH_RISK)
- FINAL_FOUNDER_READINESS_VERDICT: PASSED (confidence: 85, readiness: READY_FOR_PLANNING)

### Failure Analysis

- [CRITICAL] planning-gate-authority: REQUEST_CLARIFICATION

## Scenario: Voice-Note-Supported Project

- Simulation ID: founder-simulation-10
- Scenario type: VOICE_NOTE_SUPPORTED
- Final verdict: READY_FOR_PLANNING
- Readiness score: 81/100
- Explanation: Scenario "Voice-Note-Supported Project" reached ready for planning with score 81/100.

### Stage Chain Proof

- UPLOAD_SYSTEM: FAILED (confidence: 0, readiness: n/a)
- VISUAL_REFERENCE_INTELLIGENCE: SKIPPED (confidence: n/a, readiness: n/a)
- VOICE_NOTES_INTELLIGENCE: PASSED (confidence: 83, readiness: n/a)
- REQUIREMENT_COMPLETENESS_INTELLIGENCE: PASSED (confidence: 70, readiness: READY_WITH_GAPS)
- UNIFIED_INTAKE_INTELLIGENCE: PASSED (confidence: 92, readiness: READY_FOR_PLANNING)
- PLANNING_GATE_AUTHORITY: LOW_CONFIDENCE (confidence: 65, readiness: NEEDS_CLARIFICATION)
- PLANNING_BRIEF_GENERATOR: PASSED (confidence: 66, readiness: DRAFT_READY)
- ARCHITECTURE_BRIEF_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- BUILD_PLAN_GENERATOR: SKIPPED (confidence: n/a, readiness: n/a)
- FOUNDER_TEST_AUTOMATION: PASSED (confidence: 63, readiness: HIGH_RISK)
- FINAL_FOUNDER_READINESS_VERDICT: PASSED (confidence: 81, readiness: READY_FOR_PLANNING)

### Failure Analysis

- [HIGH] upload-system: UNSUPPORTED_FILE_TYPE
- [CRITICAL] planning-gate-authority: REQUEST_CLARIFICATION

## Recommendations

- Increase intake evidence quality; current input is insufficient for planning.
- Investigate FINAL_FOUNDER_READINESS_VERDICT module behavior for scenario SIMPLE_APP.
- Investigate UNIFIED_INTAKE_INTELLIGENCE module behavior for scenario COMPLEX_MARKETPLACE.
- Investigate FINAL_FOUNDER_READINESS_VERDICT module behavior for scenario COMPLEX_MARKETPLACE.
- Resolve platform or evidence conflicts before planning.
- Investigate UNIFIED_INTAKE_INTELLIGENCE module behavior for scenario E_COMMERCE.
- Investigate FINAL_FOUNDER_READINESS_VERDICT module behavior for scenario E_COMMERCE.
- Investigate REQUIREMENT_COMPLETENESS_INTELLIGENCE module behavior for scenario INCOMPLETE_VAGUE.

## Simulation Alignment Impact

### SIMPLE_APP

- Readiness before repair: 73/100
- Readiness after repair: 70/100
- Confidence before repair: 80/100
- Confidence after repair: 73/100
- False conflicts repaired: 0
- Real conflicts retained: 0
- Gate decision before: REJECT_PLANNING
- Gate decision after: REJECT_PLANNING

### COMPLEX_MARKETPLACE

- Readiness before repair: 74/100
- Readiness after repair: 72/100
- Confidence before repair: 79/100
- Confidence after repair: 75/100
- False conflicts repaired: 0
- Real conflicts retained: 1
- Gate decision before: REJECT_PLANNING
- Gate decision after: REJECT_PLANNING

### MOBILE_FIRST

- Readiness before repair: 99/100
- Readiness after repair: 100/100
- Confidence before repair: 98/100
- Confidence after repair: 100/100
- False conflicts repaired: 0
- Real conflicts retained: 0
- Gate decision before: REQUEST_CLARIFICATION
- Gate decision after: REQUEST_CLARIFICATION

### SAAS_DASHBOARD

- Readiness before repair: 92/100
- Readiness after repair: 97/100
- Confidence before repair: 90/100
- Confidence after repair: 96/100
- False conflicts repaired: 0
- Real conflicts retained: 0
- Gate decision before: REQUEST_CLARIFICATION
- Gate decision after: REQUEST_CLARIFICATION

### AI_POWERED

- Readiness before repair: 90/100
- Readiness after repair: 95/100
- Confidence before repair: 88/100
- Confidence after repair: 95/100
- False conflicts repaired: 0
- Real conflicts retained: 0
- Gate decision before: REQUEST_CLARIFICATION
- Gate decision after: REQUEST_CLARIFICATION

### E_COMMERCE

- Readiness before repair: 74/100
- Readiness after repair: 72/100
- Confidence before repair: 79/100
- Confidence after repair: 75/100
- False conflicts repaired: 0
- Real conflicts retained: 1
- Gate decision before: REJECT_PLANNING
- Gate decision after: REJECT_PLANNING

### CONFLICTING_EVIDENCE

- Readiness before repair: 74/100
- Readiness after repair: 71/100
- Confidence before repair: 79/100
- Confidence after repair: 73/100
- False conflicts repaired: 0
- Real conflicts retained: 1
- Gate decision before: REJECT_PLANNING
- Gate decision after: REJECT_PLANNING

### SCREENSHOT_SUPPORTED

- Readiness before repair: 97/100
- Readiness after repair: 94/100
- Confidence before repair: 94/100
- Confidence after repair: 87/100
- False conflicts repaired: 0
- Real conflicts retained: 0
- Gate decision before: REQUEST_CLARIFICATION
- Gate decision after: REQUEST_CLARIFICATION

### VOICE_NOTE_SUPPORTED

- Readiness before repair: 94/100
- Readiness after repair: 94/100
- Confidence before repair: 92/100
- Confidence after repair: 92/100
- False conflicts repaired: 0
- Real conflicts retained: 0
- Gate decision before: REQUEST_CLARIFICATION
- Gate decision after: REQUEST_CLARIFICATION

---

Pass token: FOUNDER_SIMULATION_ENGINE_V1_PASS
