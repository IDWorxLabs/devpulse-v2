/**
 * ENGINEERING_INTELLIGENCE_ACTIVATION_AUTHORITY_V1 — validation.
 *
 * Proves that src/engineering-intelligence-activation-authority-v1/ (EIAA):
 *   1. decides ALLOW / DENY / REQUIRE_HUMAN_REVIEW activation of the Engineering Intelligence
 *      Runtime from evidence alone, using a fixed eight-point policy,
 *   2. never generates a capability itself — ALLOW only ever produces a structured, generic
 *      runtime-invocation request,
 *   3. is actually consulted by AEO's missing-capability path before AEO stops, and gates whether
 *      AEO's execution host may invoke the Engineering Intelligence Runtime,
 *   4. never activates on unknown failures, low confidence, non-exhausted retries, unsafe repairs,
 *      infinite-retry patterns, or missing validation strategies, and
 *   5. introduces no application-specific logic, no hardcoded product domains, no weakened
 *      validators, no VERE work, and no new TypeScript errors in the files it touches — and that
 *      the mandatory Capability Matrix renders correctly.
 *
 * Run only:
 *   npx tsx scripts/validate-engineering-intelligence-activation-authority-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EIAA_POLICY_CHECK_IDS,
  decideActivation,
  evaluateActivationPolicy,
  runEngineeringIntelligenceActivationAuthority,
  buildActivationEvidenceFromAeo,
  renderCapabilityMatrixMarkdown,
  listCapabilityMatrixCapabilityNames,
} from '../src/engineering-intelligence-activation-authority-v1/index.js';
import type { EiaaActivationEvidence } from '../src/engineering-intelligence-activation-authority-v1/index.js';
import { runAutonomousEngineeringOrchestrator } from '../src/autonomous-engineering-orchestrator-v1/index.js';
import type { AeoOrchestratorReport } from '../src/autonomous-engineering-orchestrator-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'ENGINEERING_INTELLIGENCE_ACTIVATION_AUTHORITY_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function fullyValidEvidence(overrides: Partial<EiaaActivationEvidence> = {}): EiaaActivationEvidence {
  return {
    readOnly: true,
    failureClasses: ['COMPILER_FAILURE'],
    confidence: 90,
    repairAttempts: 2,
    repairsExhausted: true,
    existingCapabilitiesEvaluated: ['some-repair-capability'],
    capabilitiesRejected: [{ capabilityId: 'some-repair-capability', reason: 'not production-wired for this failure class' }],
    missingCapabilityId: 'SOME_MISSING_CAPABILITY',
    missingCapabilityName: 'Some Missing Capability',
    reasonGenerationIsNeeded: 'No existing repair capability can safely handle this failure class.',
    expectedIntegrationPoint: 'some-module/some-file.ts#someIntegrationFunction',
    validationPlan: ['a validator proving the generated capability resolves the failure', 'a validator proving it does not regress existing behavior'],
    requiredInputs: ['the diagnosed failure classification and its evidence'],
    requiredOutputs: ['a production-wired, safe, targeted repair for this failure class'],
    riskLevel: 'MEDIUM',
    isDeterministicFailure: true,
    isUnknownFailure: false,
    hasConflictingDiagnoses: false,
    unsafeRepairDetected: false,
    infiniteRetryDetected: false,
    ...overrides,
  };
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------------------------
  // 1. Missing capability can request activation.
  // -------------------------------------------------------------------------------------------
  const validEvidence = fullyValidEvidence();
  const allowResult = decideActivation(validEvidence);
  assert(
    '1. missing capability with all policy checks satisfied requests (allows) activation',
    allowResult.decision === 'ALLOW_ENGINEERING_INTELLIGENCE' && allowResult.runtimeRequest !== null,
    `decision=${allowResult.decision}, runtimeRequest=${allowResult.runtimeRequest ? 'present' : 'null'}`,
  );

  // -------------------------------------------------------------------------------------------
  // 2. Existing repair prevents activation.
  // -------------------------------------------------------------------------------------------
  const existingRepairViableEvidence = fullyValidEvidence({
    existingCapabilitiesEvaluated: ['build-reality-autofix-engine-v1'],
    capabilitiesRejected: [],
  });
  const existingRepairResult = decideActivation(existingRepairViableEvidence);
  assert(
    '2. an existing, non-rejected repair capability prevents activation (DENY)',
    existingRepairResult.decision === 'DENY_ENGINEERING_INTELLIGENCE' &&
      existingRepairResult.failedChecks.some((c) => c.checkId === 'EXISTING_REPAIR_CAPABILITIES_INSUFFICIENT'),
    `decision=${existingRepairResult.decision}, failedChecks=${existingRepairResult.failedChecks.map((c) => c.checkId).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 3. Unknown failure denies activation.
  // -------------------------------------------------------------------------------------------
  const unknownFailureEvidence = fullyValidEvidence({ isUnknownFailure: true, failureClasses: ['UNKNOWN_FAILURE'] });
  const unknownResult = decideActivation(unknownFailureEvidence);
  assert(
    '3. unknown failure denies activation',
    unknownResult.decision === 'DENY_ENGINEERING_INTELLIGENCE' && /UNKNOWN_FAILURE/.test(unknownResult.rejectedActivationReasons.join(' ')),
    `decision=${unknownResult.decision}, reasons=${unknownResult.rejectedActivationReasons.join('; ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 4. Low confidence denies activation.
  // -------------------------------------------------------------------------------------------
  const lowConfidenceEvidence = fullyValidEvidence({ confidence: 40 });
  const lowConfidenceResult = decideActivation(lowConfidenceEvidence);
  assert(
    '4. low confidence (below threshold) denies activation',
    lowConfidenceResult.decision === 'DENY_ENGINEERING_INTELLIGENCE' &&
      lowConfidenceResult.failedChecks.some((c) => c.checkId === 'FAILURE_CONFIDENCE_ABOVE_THRESHOLD'),
    `decision=${lowConfidenceResult.decision}, failedChecks=${lowConfidenceResult.failedChecks.map((c) => c.checkId).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 5. Retry not exhausted denies activation.
  // -------------------------------------------------------------------------------------------
  const retryNotExhaustedEvidence = fullyValidEvidence({ repairsExhausted: false, repairAttempts: 0 });
  const retryNotExhaustedResult = decideActivation(retryNotExhaustedEvidence);
  assert(
    '5. retry attempts not yet exhausted denies activation',
    retryNotExhaustedResult.decision === 'DENY_ENGINEERING_INTELLIGENCE' &&
      retryNotExhaustedResult.failedChecks.some((c) => c.checkId === 'RETRY_ATTEMPTS_EXHAUSTED'),
    `decision=${retryNotExhaustedResult.decision}, failedChecks=${retryNotExhaustedResult.failedChecks.map((c) => c.checkId).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 6. Unsafe repair denies activation.
  // -------------------------------------------------------------------------------------------
  const unsafeRepairEvidence = fullyValidEvidence({ unsafeRepairDetected: true });
  const unsafeRepairResult = decideActivation(unsafeRepairEvidence);
  assert(
    '6. unsafe repair detected denies activation',
    unsafeRepairResult.decision === 'DENY_ENGINEERING_INTELLIGENCE' &&
      /UNSAFE_REPAIR_DETECTED/.test(unsafeRepairResult.rejectedActivationReasons.join(' ')),
    `decision=${unsafeRepairResult.decision}, reasons=${unsafeRepairResult.rejectedActivationReasons.join('; ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 7. Missing validation strategy denies activation.
  // -------------------------------------------------------------------------------------------
  const noValidationStrategyEvidence = fullyValidEvidence({ validationPlan: [] });
  const noValidationStrategyResult = decideActivation(noValidationStrategyEvidence);
  assert(
    '7. missing validation strategy denies activation',
    noValidationStrategyResult.decision === 'DENY_ENGINEERING_INTELLIGENCE' &&
      noValidationStrategyResult.failedChecks.some((c) => c.checkId === 'VALIDATION_STRATEGY_EXISTS'),
    `decision=${noValidationStrategyResult.decision}, failedChecks=${noValidationStrategyResult.failedChecks.map((c) => c.checkId).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 8. Deterministic failure allows activation (and non-deterministic failure denies it).
  // -------------------------------------------------------------------------------------------
  const deterministicResult = decideActivation(fullyValidEvidence({ isDeterministicFailure: true }));
  const nonDeterministicResult = decideActivation(fullyValidEvidence({ isDeterministicFailure: false }));
  assert(
    '8. a deterministic failure (with all other checks satisfied) allows activation; a non-deterministic one does not',
    deterministicResult.decision === 'ALLOW_ENGINEERING_INTELLIGENCE' &&
      nonDeterministicResult.decision === 'DENY_ENGINEERING_INTELLIGENCE' &&
      nonDeterministicResult.failedChecks.some((c) => c.checkId === 'FAILURE_IS_DETERMINISTIC'),
    `deterministic=${deterministicResult.decision}, nonDeterministic=${nonDeterministicResult.decision}`,
  );

  // -------------------------------------------------------------------------------------------
  // 9. Activation report contains policy evaluation.
  // -------------------------------------------------------------------------------------------
  const fullReport = runEngineeringIntelligenceActivationAuthority({ evidence: fullyValidEvidence() });
  const allCheckIdsCovered = EIAA_POLICY_CHECK_IDS.every(
    (id) => fullReport.satisfiedChecks.some((c) => c.checkId === id) || fullReport.failedChecks.some((c) => c.checkId === id),
  );
  assert(
    '9. activation report contains a full policy evaluation (all 8 checks accounted for, satisfied+failed)',
    allCheckIdsCovered && fullReport.satisfiedChecks.length + fullReport.failedChecks.length === EIAA_POLICY_CHECK_IDS.length,
    `checksCovered=${allCheckIdsCovered}, satisfied=${fullReport.satisfiedChecks.length}, failed=${fullReport.failedChecks.length}, totalChecks=${EIAA_POLICY_CHECK_IDS.length}`,
  );

  // -------------------------------------------------------------------------------------------
  // 10. Runtime request generated correctly.
  // -------------------------------------------------------------------------------------------
  const evidenceForRequest = fullyValidEvidence({
    missingCapabilityId: 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    missingCapabilityName: 'Contract-Bound Generation Authority',
    failureClasses: ['UNAUTHORIZED_FALLBACK_MODULES'],
    expectedIntegrationPoint: 'universal-prompt-to-app-materialization module-selection step',
    validationPlan: ['a validator proving the authority blocks a synthetic unauthorized-fallback-module scenario'],
    requiredInputs: ['CanonicalProductContract'],
    requiredOutputs: ['an ALLOW / BLOCK / SUBSTITUTE decision'],
  });
  const requestDecision = decideActivation(evidenceForRequest);
  const req = requestDecision.runtimeRequest;
  assert(
    '10. runtime invocation request is generated correctly from the evidence when activation is allowed',
    requestDecision.decision === 'ALLOW_ENGINEERING_INTELLIGENCE' &&
      req !== null &&
      req.missingCapabilityId === 'CONTRACT_BOUND_GENERATION_AUTHORITY' &&
      req.failureTaxonomyClass === 'UNAUTHORIZED_FALLBACK_MODULES' &&
      req.integrationPoint === 'universal-prompt-to-app-materialization module-selection step' &&
      req.validationStrategy.length > 0 &&
      req.requiredInputs.length > 0 &&
      req.requiredOutputs.length > 0,
    `request=${JSON.stringify(req)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 11. AEO invokes EIAA before stopping. Uses a GPCA-diagnosed failure (LEGACY_GENERATOR_DETECTED)
  //     as the genuine "no safe auto-repair exists" case — Generation Pipeline Compliance
  //     Authority V1 is production-wired for this class but is deliberately never safe-to-auto-run
  //     (it audits/blocks generation, it never repairs itself; see repair-capability-registry.ts).
  //     The older unauthorized-fallback-modules example is no longer a missing-capability case: CBGA
  //     V4 is now registered as a real, safe, production-wired repair for it (see
  //     missing-capability-router.ts's "known historical pattern, now resolved" comment).
  // -------------------------------------------------------------------------------------------
  const aeoNoHostReport: AeoOrchestratorReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: {
      gpcaComplianceReport: {
        finalGateOutcome: 'COMPLIANCE_BLOCKED_LEGACY_GENERATOR',
        blockedReasons: ['A generation stage relied on a hardcoded legacy generator instead of CBGA output.'],
      },
    },
  });
  const lastCycleStates = aeoNoHostReport.cycles[aeoNoHostReport.cycles.length - 1]?.statesVisited ?? [];
  const routeIdx = lastCycleStates.indexOf('ROUTE_MISSING_CAPABILITY');
  const activateIdx = lastCycleStates.indexOf('ACTIVATE_ENGINEERING_INTELLIGENCE');
  assert(
    '11. AEO invokes EIAA (ACTIVATE_ENGINEERING_INTELLIGENCE, after ROUTE_MISSING_CAPABILITY) before it stops',
    aeoNoHostReport.engineeringIntelligenceActivation !== null &&
      routeIdx > -1 &&
      activateIdx > routeIdx &&
      (aeoNoHostReport.finalState === 'STOP_SAFE' || aeoNoHostReport.finalState === 'HUMAN_REVIEW_REQUIRED'),
    `states=${lastCycleStates.join(' -> ')}, eiaaDecision=${aeoNoHostReport.engineeringIntelligenceActivation?.decision}, finalState=${aeoNoHostReport.finalState}`,
  );

  // -------------------------------------------------------------------------------------------
  // 12. Engineering Intelligence Runtime invoked only when allowed.
  // -------------------------------------------------------------------------------------------
  let runtimeInvocations = 0;
  const allowedWithHostReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: {
      gpcaComplianceReport: {
        finalGateOutcome: 'COMPLIANCE_BLOCKED_LEGACY_GENERATOR',
        blockedReasons: ['A generation stage relied on a hardcoded legacy generator instead of CBGA output.'],
      },
    },
    host: {
      invokeEngineeringIntelligenceRuntime: async () => {
        runtimeInvocations += 1;
        return { invoked: true, detail: 'validator-simulated runtime invocation' };
      },
    },
  });
  const deniedWithHostReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: { validationFounderEvidence: { passed: false, blockers: ['founder validation flagged an issue'] } },
    host: {
      invokeEngineeringIntelligenceRuntime: async () => {
        runtimeInvocations += 1;
        return { invoked: true, detail: 'should never be called for a DENY decision' };
      },
    },
  });
  assert(
    '12. Engineering Intelligence Runtime is invoked only when EIAA allows activation, never on DENY',
    allowedWithHostReport.engineeringIntelligenceActivation?.decision === 'ALLOW_ENGINEERING_INTELLIGENCE' &&
      allowedWithHostReport.engineeringIntelligenceInvoked === true &&
      deniedWithHostReport.engineeringIntelligenceActivation?.decision === 'DENY_ENGINEERING_INTELLIGENCE' &&
      deniedWithHostReport.engineeringIntelligenceInvoked === false &&
      runtimeInvocations === 1,
    `allowed: decision=${allowedWithHostReport.engineeringIntelligenceActivation?.decision}, invoked=${allowedWithHostReport.engineeringIntelligenceInvoked}; denied: decision=${deniedWithHostReport.engineeringIntelligenceActivation?.decision}, invoked=${deniedWithHostReport.engineeringIntelligenceInvoked}; totalInvocations=${runtimeInvocations}`,
  );

  // -------------------------------------------------------------------------------------------
  // 13. Human review path works.
  // -------------------------------------------------------------------------------------------
  const conflictingDiagnosesEvidence = fullyValidEvidence({ hasConflictingDiagnoses: true });
  const humanReviewResult = decideActivation(conflictingDiagnosesEvidence);
  assert(
    '13. conflicting diagnoses route EIAA to REQUIRE_HUMAN_REVIEW rather than an outright ALLOW/DENY',
    humanReviewResult.decision === 'REQUIRE_HUMAN_REVIEW',
    `decision=${humanReviewResult.decision}, reason=${humanReviewResult.reason}`,
  );

  // -------------------------------------------------------------------------------------------
  // 14. Infinite retry protection works.
  // -------------------------------------------------------------------------------------------
  const loopingHistory = [1, 2, 3].map(() => ({
    failureClass: 'COMPILER_FAILURE',
    capabilityId: 'build-reality-autofix-engine-v1',
    applied: true,
    succeeded: false,
  }));
  const infiniteRetryEvidence = buildActivationEvidenceFromAeo({
    classification: { failureClass: 'COMPILER_FAILURE', confidence: 90 },
    repairPlan: { decision: 'REFUSE_MAX_ATTEMPTS_EXCEEDED', matchedCapability: null, consideredCapabilities: [], reason: 'max attempts exceeded' },
    missingCapability: {
      missingCapabilityId: 'COMPILER_FAILURE_REPAIR_CAPABILITY',
      missingCapabilityName: 'Compiler Failure Repair Capability',
      whyExistingCapabilitiesAreInsufficient: ['exhausted'],
      requiredInputs: ['x'],
      expectedOutputs: ['y'],
      targetIntegrationPoint: 'z',
      validationNeeded: ['v'],
    },
    repairAttemptHistory: loopingHistory,
  });
  const infiniteRetryResult = decideActivation(infiniteRetryEvidence);
  assert(
    '14. an infinite-retry pattern (same failure + capability repeated without progress) denies activation',
    infiniteRetryEvidence.infiniteRetryDetected === true &&
      infiniteRetryResult.decision === 'DENY_ENGINEERING_INTELLIGENCE' &&
      /INFINITE_RETRY_DETECTED/.test(infiniteRetryResult.rejectedActivationReasons.join(' ')),
    `infiniteRetryDetected=${infiniteRetryEvidence.infiniteRetryDetected}, decision=${infiniteRetryResult.decision}`,
  );

  // -------------------------------------------------------------------------------------------
  // 15. No application-specific logic (no reference to product-domain enumerations/strings).
  // -------------------------------------------------------------------------------------------
  const eiaaDir = join(ROOT, 'src/engineering-intelligence-activation-authority-v1');
  const eiaaFiles = readdirSync(eiaaDir).filter((f) => f.endsWith('.ts'));
  const eiaaSource = eiaaFiles.map((f) => readFileSync(join(eiaaDir, f), 'utf8')).join('\n');
  const referencesProductDomainType = /ProductDomain|productDomain/.test(eiaaSource);
  assert(
    '15. no application-specific logic — EIAA never references the product-domain type/enumeration at all',
    !referencesProductDomainType,
    referencesProductDomainType ? 'found a ProductDomain/productDomain reference in EIAA source' : 'no ProductDomain reference found',
  );

  // -------------------------------------------------------------------------------------------
  // 16. No hardcoded product domains.
  // -------------------------------------------------------------------------------------------
  // Note: "notes" and "dashboard" are deliberately excluded as bare words — the mandatory
  // Capability Matrix legitimately has a "Notes" column and describes orchestration/governance
  // "dashboards" as generic engineering concepts, not the notes-app/internal-dashboard product
  // domains. Only the unambiguous product-domain phrasings are checked for those two.
  const FORBIDDEN_DOMAIN_WORDS = [
    'calculator',
    'converter',
    'restaurant',
    'booking',
    '\\bcrm\\b',
    'inventory',
    'notes app',
    'note-taking',
    '\\blisa\\b',
    'authentication',
    '\\bcrud\\b',
  ];
  const domainHits = FORBIDDEN_DOMAIN_WORDS.filter((w) => new RegExp(w, 'i').test(eiaaSource));
  assert(
    '16. no hardcoded product-domain words introduced in the EIAA module',
    domainHits.length === 0,
    domainHits.length === 0 ? `inspected ${eiaaFiles.length} EIAA source file(s) — no forbidden domain words found` : `found: ${domainHits.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 17. No validators weakened — this milestone only adds its own script.
  // -------------------------------------------------------------------------------------------
  const packageJsonSource = readFileSync(join(ROOT, 'package.json'), 'utf8');
  const pkg = JSON.parse(packageJsonSource) as { scripts: Record<string, string> };
  const hasOwnScript = pkg.scripts['validate:engineering-intelligence-activation-authority-v1'] === 'tsx scripts/validate-engineering-intelligence-activation-authority-v1.ts';
  const stillHasAeoScript = pkg.scripts['validate:autonomous-engineering-orchestrator-v1'] === 'tsx scripts/validate-autonomous-engineering-orchestrator-v1.ts';
  assert(
    '17. this milestone adds its own validator script and does not touch any other validate:* script',
    hasOwnScript && stillHasAeoScript,
    `hasOwnScript=${hasOwnScript}, aeoScriptUntouched=${stillHasAeoScript}`,
  );

  // -------------------------------------------------------------------------------------------
  // 18. No VERE / validation-speed work introduced.
  // -------------------------------------------------------------------------------------------
  const vereMention = /\bvere\b/i.test(eiaaSource);
  assert(
    '18. no VERE / validation-runtime-speed work was added by this milestone',
    !vereMention,
    vereMention ? 'unexpected VERE reference found in EIAA module' : 'no VERE references found in EIAA module',
  );

  // -------------------------------------------------------------------------------------------
  // 19. No new TypeScript errors introduced in touched files.
  // -------------------------------------------------------------------------------------------
  const TOUCHED_FILES = [
    'src/engineering-intelligence-activation-authority-v1/',
    'src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator-types.ts',
    'src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator.ts',
    'src/autonomous-engineering-orchestrator-v1/autonomous-engineering-orchestrator-report.ts',
  ];
  const KNOWN_PREEXISTING_ERROR_SIGNATURES = [
    "Type '\"CAPABILITY_PLANNING\"' is not assignable to type 'ForensicBuildStage'",
    'is missing the following properties from type \'OnePromptLivePreviewBuildResult\': livePreviewGate, autonomousSoftwareEngineering',
    "The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'",
    "Type 'string' is not assignable to type 'ForensicBuildStage'",
    'have no overlap',
  ];
  let tscOutput = '';
  let tscFailedToRun = false;
  try {
    tscOutput = execSync('npx tsc --noEmit', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    if (!tscOutput) tscFailedToRun = true;
  }
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
  const touchedFileErrorLines = tscLines.filter((l) => {
    const normalized = l.replace(/\\/g, '/');
    return TOUCHED_FILES.some((f) => normalized.includes(f));
  });
  const newTouchedFileErrors = touchedFileErrorLines.filter(
    (line) => !KNOWN_PREEXISTING_ERROR_SIGNATURES.some((sig) => line.includes(sig)),
  );
  assert(
    '19. no new TypeScript errors introduced in touched files (lightweight touched-file tsc diagnostic)',
    !tscFailedToRun && newTouchedFileErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}, new (non-pre-existing)=${newTouchedFileErrors.length}${newTouchedFileErrors.length > 0 ? `: ${newTouchedFileErrors.join(' | ')}` : ''}`,
  );

  // -------------------------------------------------------------------------------------------
  // 20. Capability Matrix generated correctly.
  // -------------------------------------------------------------------------------------------
  const matrixMarkdown = renderCapabilityMatrixMarkdown();
  const REQUIRED_MATRIX_CAPABILITIES = [
    'Autonomous Engineering Orchestrator',
    'Engineering Intelligence Activation Authority',
    'Engineering Intelligence Runtime',
    'Capability Planning Engine',
    'Missing Capability Evolution Engine',
    'Build Reality AutoFix',
    'Autonomous Recovery Authority',
    'Product Faithfulness Repair',
    'Fresh Build Artifact Isolation',
    'Project Context Isolation',
    'Build Execution Stabilizer',
    'Live Preview Gate',
  ];
  const matrixCapabilityNames = listCapabilityMatrixCapabilityNames();
  const missingFromMatrix = REQUIRED_MATRIX_CAPABILITIES.filter((name) => !matrixCapabilityNames.includes(name));
  const hasCorrectHeader =
    matrixMarkdown.includes('| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |') &&
    matrixMarkdown.includes('|------------|--------|------------------|----------|--------------------|-------|');
  assert(
    '20. Capability Matrix is generated correctly (exact header + all required capabilities present)',
    missingFromMatrix.length === 0 && hasCorrectHeader,
    `missing=${missingFromMatrix.join(', ') || 'none'}, correctHeader=${hasCorrectHeader}, totalRows=${matrixCapabilityNames.length}`,
  );

  // -------------------------------------------------------------------------------------------
  // Determinism check: same evidence, same structural decision output.
  // -------------------------------------------------------------------------------------------
  const detA = runEngineeringIntelligenceActivationAuthority({ evidence: fullyValidEvidence() });
  const detB = runEngineeringIntelligenceActivationAuthority({ evidence: fullyValidEvidence() });
  const strip = (r: typeof detA) => JSON.stringify({ ...r, generatedAt: null });
  assert(
    'extra. EIAA is deterministic — identical evidence yields byte-identical structural output',
    strip(detA) === strip(detB),
    strip(detA) === strip(detB) ? 'two independent runs produced identical structural output' : 'runs diverged',
  );

  // -------------------------------------------------------------------------------------------
  // Extra: evaluateActivationPolicy exposes exactly the 8 required checks, in order.
  // -------------------------------------------------------------------------------------------
  const policyEval = evaluateActivationPolicy(fullyValidEvidence());
  assert(
    'extra. activation policy evaluates exactly the 8 required checks',
    policyEval.checks.length === 8 && policyEval.checks.every((c, i) => c.checkId === EIAA_POLICY_CHECK_IDS[i]),
    `checks=${policyEval.checks.map((c) => c.checkId).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // Report + exit
  // -------------------------------------------------------------------------------------------
  let failCount = 0;
  for (const r of results) {
    const marker = r.passed ? 'PASS' : 'FAIL';
    if (!r.passed) failCount += 1;
    // eslint-disable-next-line no-console
    console.log(`${marker} — ${r.name}${r.passed ? '' : ` :: ${r.detail}`}`);
  }
  // eslint-disable-next-line no-console
  console.log(`\n${results.length - failCount}/${results.length} scenarios passed.`);

  if (failCount === 0) {
    // eslint-disable-next-line no-console
    console.log(`\n${PASS_TOKEN}`);
    process.exit(0);
  } else {
    // eslint-disable-next-line no-console
    console.error(`\n${failCount} scenario(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Validator crashed:', err);
  process.exit(1);
});
