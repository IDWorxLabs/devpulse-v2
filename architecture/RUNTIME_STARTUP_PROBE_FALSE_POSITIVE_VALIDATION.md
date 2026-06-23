# Runtime Startup Probe False-Positive Repair Validation

Result: RUNTIME_STARTUP_PROBE_FALSE_POSITIVE_REPAIR_PASS

- [x] PASS token in registry: missing
- [x] health success override in probe: missing
- [x] numeric exitCode check: missing
- [x] reconcileStartupProbeVerdict: missing
- [x] crash NONE class: missing
- [x] no loose port.*in use: still loose
- [x] HTTP 200 sets applicationBoots=true: true
- [x] fatalErrors suppressed on health success: 
- [x] PORT_CONFLICT suppressed when health ok: 
- [x] isSuccessfulHealthResponse 200: false
- [x] undefined exitCode not success alone: true
- [x] live probe applicationBoots=true: true
- [x] startupFailureClass=NONE: NONE
- [x] cleanupStatus=CLEANED ok: CLEANED
- [x] healthResponded true: true
- [x] firstResponseStatus 2xx: 200
- [x] preciseCrashClass=NONE: NONE
- [x] crash diagnosis not PROCESS_EXITED_EARLY on health success: NONE
- [x] crashDetected false on boot: false
- [x] runtime bridge beyond STARTUP: REPORTING
- [x] rootCause not RUNTIME_START_FAILURE: EVIDENCE_PROPAGATION_FAILURE
- [x] bridge applicationBoots true: true

## Snapshot

- applicationBoots=true
- failureClass=NONE
- preciseCrashClass=NONE
- fatalErrors=none
- failureBoundary=REPORTING
- rootCause=EVIDENCE_PROPAGATION_FAILURE
- cleanupStatus=CLEANED
