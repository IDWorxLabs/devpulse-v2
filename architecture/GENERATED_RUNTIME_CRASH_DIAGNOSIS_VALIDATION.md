# Generated Runtime Crash Diagnosis Validation

Result: GENERATED_RUNTIME_CRASH_DIAGNOSIS_PASS

- [x] file: src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-types.ts: present
- [x] file: src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-registry.ts: present
- [x] file: src/generated-runtime-crash-diagnosis/startup-log-crash-extractor.ts: present
- [x] file: src/generated-runtime-crash-diagnosis/runtime-entrypoint-crash-mapper.ts: present
- [x] file: src/generated-runtime-crash-diagnosis/runtime-crash-classifier.ts: present
- [x] file: src/generated-runtime-crash-diagnosis/runtime-crash-repair-planner.ts: present
- [x] file: src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-report-builder.ts: present
- [x] file: src/generated-runtime-crash-diagnosis/generated-runtime-crash-diagnosis-authority.ts: present
- [x] file: src/generated-runtime-crash-diagnosis/index.ts: present
- [x] PASS token: missing
- [x] log parsing: missing
- [x] bounded excerpt: missing
- [x] startup repair wired: missing
- [x] classifier uses crash diagnosis: missing
- [x] runtime bridge crash fields: missing
- [x] no nested validators: nested
- [x] no writeFileSync in authority: mutates
- [x] shouldAutoRepair false: missing
- [x] assessment completes: RUNTIME_CRASH_DIAGNOSIS_COMPLETE
- [x] crash class assigned: NONE
- [x] logs parsed: empty
- [x] raw excerpt bounded: 79
- [x] repair recommendation: empty
- [x] history recorded: 1
- [x] startup receives crash diagnosis: missing
- [x] precise crash class on startup: NONE
- [x] runtime bridge crash details: NONE
- [x] crash excerpt on bridge: missing

## Snapshot

- crashClass=NONE
- failingFile=none
- evidenceConfidence=0.95
- startupFailureClass=NONE
- preciseCrashClass=NONE
- runtimeBridge.recommendedFix=Runtime evidence proves application activity — fix reporting propagation into Founder Test and Truth
