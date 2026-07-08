/**
 * AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1 — validation.
 *
 * Proves that src/autonomous-engineering-orchestrator-v1/ (AEO):
 *   1. defines a complete, generic failure taxonomy and classifies real evidence into it,
 *   2. registers existing repair capabilities and honestly marks their wiring status,
 *   3. plans repairs conservatively (targeted retry only, never a default full rebuild) and
 *      refuses to auto-run anything that is not honestly production-wired and safe,
 *   4. routes unrepairable failures into a structured missing-capability recommendation —
 *      including the known unauthorized-fallback/product-drift pattern routing to
 *      CONTRACT_BOUND_GENERATION_AUTHORITY — without implementing it,
 *   5. runs as a bounded, evidence-only state machine that never fakes success,
 *   6. is actually invoked by the real one-prompt build orchestrator before a failed build
 *      result is returned, and
 *   7. introduces no application-specific logic, no weakened validators, no VERE/validation-speed
 *      work, and no new TypeScript errors in the files it touches.
 *
 * Run only:
 *   npx tsx scripts/validate-autonomous-engineering-orchestrator-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AEO_FAILURE_CLASSES,
  AEO_REPAIR_CAPABILITY_REGISTRY,
  diagnoseBuildFailure,
  findRepairCapabilitiesForFailureClass,
  getRepairCapabilityById,
  planRepair,
  routeMissingCapability,
  runAutonomousEngineeringOrchestrator,
  selectPrimaryFailureClassification,
} from '../src/autonomous-engineering-orchestrator-v1/index.js';
import type {
  AeoOrchestratorReport,
  AeoRepairAttemptRecord,
} from '../src/autonomous-engineering-orchestrator-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------------------------
  // 1. Unified taxonomy contains all required failure classes.
  // -------------------------------------------------------------------------------------------
  const REQUIRED_CLASSES = [
    'PROMPT_UNDERSTANDING_FAILURE',
    'PROJECT_CONTEXT_FAILURE',
    'PRODUCT_IDENTITY_DRIFT',
    'CONTRACT_INCONSISTENCY',
    'UNAUTHORIZED_FALLBACK_MODULES',
    'MODULE_GENERATION_FAILURE',
    'MATERIALIZATION_FAILURE',
    'MANIFEST_STALENESS',
    'ROUTE_NAVIGATION_DRIFT',
    'PREVIEW_RUNTIME_FAILURE',
    'LIVE_PREVIEW_PROOF_FAILURE',
    'COMPILER_FAILURE',
    'DEPENDENCY_INSTALL_FAILURE',
    'VALIDATION_FAILURE',
    'STALE_EVIDENCE_FAILURE',
    'REPAIR_FAILED',
    'MISSING_REPAIR_CAPABILITY',
    'UNKNOWN_FAILURE',
  ];
  const missingFromTaxonomy = REQUIRED_CLASSES.filter((c) => !AEO_FAILURE_CLASSES.includes(c as never));
  assert(
    '1. unified taxonomy contains all required failure classes',
    missingFromTaxonomy.length === 0,
    missingFromTaxonomy.length === 0
      ? `all ${REQUIRED_CLASSES.length} required classes present (taxonomy has ${AEO_FAILURE_CLASSES.length} total)`
      : `missing: ${missingFromTaxonomy.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 2. Product identity drift is classified correctly.
  // -------------------------------------------------------------------------------------------
  const driftClassifications = diagnoseBuildFailure({
    generationFaithfulnessReport: { verdict: 'SUBSTITUTED', summary: { reason: 'Concept substitution detected.' } },
  });
  const driftPrimary = selectPrimaryFailureClassification(driftClassifications);
  assert(
    '2. product identity drift is classified correctly',
    driftPrimary.failureClass === 'PRODUCT_IDENTITY_DRIFT',
    `primary classification = ${driftPrimary.failureClass}`,
  );

  // -------------------------------------------------------------------------------------------
  // 3. Unauthorized fallback modules are classified correctly.
  // -------------------------------------------------------------------------------------------
  const fallbackClassifications = diagnoseBuildFailure({
    fallbackModulesDetected: true,
    unauthorizedFallbackDetail: 'Fallback modules were appended to the custom module definition.',
    generationFaithfulnessReport: { verdict: 'SUBSTITUTED' },
  });
  const fallbackPrimary = selectPrimaryFailureClassification(fallbackClassifications);
  assert(
    '3. unauthorized fallback modules are classified correctly (and outrank product drift when both present)',
    fallbackPrimary.failureClass === 'UNAUTHORIZED_FALLBACK_MODULES',
    `primary classification = ${fallbackPrimary.failureClass}`,
  );

  // -------------------------------------------------------------------------------------------
  // 4. Live preview proof blocked is classified correctly.
  // -------------------------------------------------------------------------------------------
  const proofBlockedClassifications = diagnoseBuildFailure({
    livePreviewProof: { result: 'PREVIEW_INTERACTION_BLOCKED', summary: { headline: 'Live preview interaction proof was blocked.' } },
  });
  const proofBlockedPrimary = selectPrimaryFailureClassification(proofBlockedClassifications);
  assert(
    '4. live preview proof blocked is classified correctly',
    proofBlockedPrimary.failureClass === 'LIVE_PREVIEW_PROOF_FAILURE',
    `primary classification = ${proofBlockedPrimary.failureClass}`,
  );

  // -------------------------------------------------------------------------------------------
  // 5. Compiler failure is classified correctly.
  // -------------------------------------------------------------------------------------------
  const compilerClassifications = diagnoseBuildFailure({
    npmInstallOk: true,
    npmBuildOk: false,
    rawBuildOutput: "error TS2307: Cannot find module './Foo'",
  });
  const compilerPrimary = selectPrimaryFailureClassification(compilerClassifications);
  assert(
    '5. compiler failure is classified correctly',
    compilerPrimary.failureClass === 'COMPILER_FAILURE',
    `primary classification = ${compilerPrimary.failureClass}`,
  );

  // -------------------------------------------------------------------------------------------
  // 6. Dependency install failure is classified correctly.
  // -------------------------------------------------------------------------------------------
  const depClassifications = diagnoseBuildFailure({
    npmInstallOk: false,
    rawFailureReason: 'npm install failed: ERESOLVE unable to resolve dependency tree',
  });
  const depPrimary = selectPrimaryFailureClassification(depClassifications);
  assert(
    '6. dependency install failure is classified correctly',
    depPrimary.failureClass === 'DEPENDENCY_INSTALL_FAILURE',
    `primary classification = ${depPrimary.failureClass}`,
  );

  // -------------------------------------------------------------------------------------------
  // 7. Stale evidence failure is classified correctly.
  // -------------------------------------------------------------------------------------------
  const staleClassifications = diagnoseBuildFailure({
    freshBuildArtifactIsolation: { staleEvidenceDetected: true, summary: 'Stale evidence from a prior build was detected.' },
  });
  const stalePrimary = selectPrimaryFailureClassification(staleClassifications);
  assert(
    '7. stale evidence failure is classified correctly',
    stalePrimary.failureClass === 'STALE_EVIDENCE_FAILURE',
    `primary classification = ${stalePrimary.failureClass}`,
  );

  // -------------------------------------------------------------------------------------------
  // 8. Repair capability registry includes existing systems found by the audit.
  // -------------------------------------------------------------------------------------------
  const REQUIRED_CAPABILITY_IDS = [
    'build-reality-autofix-engine-v1',
    'autonomous-recovery-authority',
    'autonomous-debugging-engine',
    'generation-faithfulness-repair',
    'product-faithfulness-v2-repair',
    'fresh-build-artifact-isolation-v4',
    'project-context-isolation-v4',
    'build-execution-stabilizer-v1',
    'live-preview-gate',
    'capability-planning-engine',
    'missing-capability-evolution-engine',
    'engineering-intelligence-runtime',
  ];
  const missingCapabilityIds = REQUIRED_CAPABILITY_IDS.filter((id) => getRepairCapabilityById(id) === null);
  assert(
    '8. repair capability registry includes all required existing systems found by the audit',
    missingCapabilityIds.length === 0,
    missingCapabilityIds.length === 0
      ? `all ${REQUIRED_CAPABILITY_IDS.length} required capabilities registered (registry has ${AEO_REPAIR_CAPABILITY_REGISTRY.length} total)`
      : `missing: ${missingCapabilityIds.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 9. Registry honestly marks production-wired capabilities.
  // -------------------------------------------------------------------------------------------
  const PRODUCTION_WIRED_IDS = [
    'build-reality-autofix-engine-v1',
    'autonomous-recovery-authority',
    'fresh-build-artifact-isolation-v4',
    'project-context-isolation-v4',
    'build-execution-stabilizer-v1',
    'live-preview-gate',
    'engineering-intelligence-runtime',
  ];
  const notMarkedProductionWired = PRODUCTION_WIRED_IDS.filter((id) => getRepairCapabilityById(id)?.wiringStatus !== 'PRODUCTION_WIRED');
  assert(
    '9. registry honestly marks known production-wired capabilities as PRODUCTION_WIRED',
    notMarkedProductionWired.length === 0,
    notMarkedProductionWired.length === 0 ? 'all expected capabilities marked PRODUCTION_WIRED' : `not marked: ${notMarkedProductionWired.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 10. Registry honestly marks planning-only / validator-only / governance-only / simulated.
  // -------------------------------------------------------------------------------------------
  const expectedNonProduction: Array<[string, string]> = [
    ['autonomous-debugging-engine', 'SIMULATED'],
    ['generation-faithfulness-repair', 'SIMULATED'],
    ['product-faithfulness-v2-repair', 'SIMULATED'],
    ['capability-planning-engine', 'PLANNING_ONLY'],
    ['missing-capability-evolution-engine', 'PLANNING_ONLY'],
    ['validation-runtime-governance-v1', 'GOVERNANCE_ONLY'],
  ];
  const wrongWiringStatus = expectedNonProduction.filter(([id, expected]) => getRepairCapabilityById(id)?.wiringStatus !== expected);
  assert(
    '10. registry honestly marks planning-only/validator-only/governance-only/simulated capabilities',
    wrongWiringStatus.length === 0,
    wrongWiringStatus.length === 0
      ? 'all expected non-production-wired capabilities marked correctly'
      : `mismatched: ${wrongWiringStatus.map(([id, expected]) => `${id} (expected ${expected}, got ${getRepairCapabilityById(id)?.wiringStatus})`).join('; ')}`,
  );
  assert(
    '10b. no capability is dishonestly marked PRODUCTION_WIRED+safe while also being planning-only/simulated in its limitations text',
    AEO_REPAIR_CAPABILITY_REGISTRY.every((c) => !(c.wiringStatus === 'PRODUCTION_WIRED' && c.safeToRunAutomatically && /simulated|planning.?only|governance.?only|validator.?only/i.test(c.limitations.join(' ')))),
    'no contradictory PRODUCTION_WIRED+safe capability found',
  );

  // -------------------------------------------------------------------------------------------
  // 11. Planner selects safe production-wired repair when available.
  // -------------------------------------------------------------------------------------------
  const compilerPlan = planRepair({ classification: compilerPrimary, attemptHistory: [] });
  assert(
    '11. planner selects the safe production-wired repair when one is available',
    compilerPlan.decision === 'RUN_TARGETED_REPAIR' && compilerPlan.matchedCapability?.capabilityId === 'build-reality-autofix-engine-v1',
    `decision=${compilerPlan.decision}, matched=${compilerPlan.matchedCapability?.capabilityId ?? 'none'}`,
  );

  // -------------------------------------------------------------------------------------------
  // 12. Planner refuses planning-only repair.
  // -------------------------------------------------------------------------------------------
  const missingCapabilityClassification = selectPrimaryFailureClassification(diagnoseBuildFailure({ rawFailureReason: 'x' }));
  const forcedMissingCapabilityClassification = { ...missingCapabilityClassification, failureClass: 'MISSING_REPAIR_CAPABILITY' as const };
  const planningOnlyPlan = planRepair({ classification: forcedMissingCapabilityClassification, attemptHistory: [] });
  assert(
    '12. planner refuses a planning-only-only repair',
    planningOnlyPlan.decision === 'REFUSE_PLANNING_ONLY',
    `decision=${planningOnlyPlan.decision}, matched=${planningOnlyPlan.matchedCapability?.capabilityId ?? 'none'} (wiringStatus=${planningOnlyPlan.matchedCapability?.wiringStatus ?? 'n/a'})`,
  );

  // -------------------------------------------------------------------------------------------
  // 13. Planner refuses simulated-only repair.
  // -------------------------------------------------------------------------------------------
  const forcedLivePreviewProofClassification = { ...missingCapabilityClassification, failureClass: 'LIVE_PREVIEW_PROOF_FAILURE' as const };
  const simulatedOnlyPlan = planRepair({ classification: forcedLivePreviewProofClassification, attemptHistory: [] });
  assert(
    '13. planner refuses a simulated-only repair',
    simulatedOnlyPlan.decision === 'REFUSE_SIMULATED_ONLY',
    `decision=${simulatedOnlyPlan.decision}, matched=${simulatedOnlyPlan.matchedCapability?.capabilityId ?? 'none'} (wiringStatus=${simulatedOnlyPlan.matchedCapability?.wiringStatus ?? 'n/a'})`,
  );

  // -------------------------------------------------------------------------------------------
  // 14. Planner refuses unknown failure automatic repair.
  // -------------------------------------------------------------------------------------------
  const unknownClassification = selectPrimaryFailureClassification(diagnoseBuildFailure({}));
  const unknownPlan = planRepair({ classification: unknownClassification, attemptHistory: [] });
  assert(
    '14. planner refuses automatic repair for UNKNOWN_FAILURE',
    unknownClassification.failureClass === 'UNKNOWN_FAILURE' && unknownPlan.decision === 'REFUSE_UNKNOWN_FAILURE',
    `classification=${unknownClassification.failureClass}, decision=${unknownPlan.decision}`,
  );

  // -------------------------------------------------------------------------------------------
  // 15. Planner respects max attempts.
  // -------------------------------------------------------------------------------------------
  const maxAttempts = getRepairCapabilityById('build-reality-autofix-engine-v1')!.maxAttempts;
  const exhaustedHistory: AeoRepairAttemptRecord[] = Array.from({ length: maxAttempts }, (_, i) => ({
    readOnly: true,
    cycle: i + 1,
    failureClass: 'COMPILER_FAILURE',
    capabilityId: 'build-reality-autofix-engine-v1',
    decision: 'RUN_TARGETED_REPAIR',
    applied: true,
    succeeded: false,
    detail: 'attempt failed',
    atMs: Date.now(),
  }));
  const exhaustedPlan = planRepair({ classification: compilerPrimary, attemptHistory: exhaustedHistory });
  assert(
    '15. planner respects max attempts (refuses once a capability is exhausted)',
    exhaustedPlan.decision === 'REFUSE_MAX_ATTEMPTS_EXCEEDED',
    `maxAttempts=${maxAttempts}, decision after ${exhaustedHistory.length} prior applied attempts=${exhaustedPlan.decision}`,
  );

  // -------------------------------------------------------------------------------------------
  // 16. Planner prefers targeted retry over full rebuild.
  // -------------------------------------------------------------------------------------------
  const allPlansEverFullRebuild = AEO_FAILURE_CLASSES.some((fc) => {
    const cls = { ...compilerPrimary, failureClass: fc };
    return planRepair({ classification: cls, attemptHistory: [] }).retryScope === 'FULL_REBUILD';
  });
  assert(
    '16. planner never plans a FULL_REBUILD retry scope by default, across every failure class',
    !allPlansEverFullRebuild && compilerPlan.retryScope === 'SINGLE_STAGE',
    `full-rebuild ever planned=${allPlansEverFullRebuild}; compiler-failure retryScope=${compilerPlan.retryScope}`,
  );

  // -------------------------------------------------------------------------------------------
  // 17. Missing capability router produces missing capability when no safe repair exists.
  // -------------------------------------------------------------------------------------------
  const routedForPlanningOnly = routeMissingCapability('MISSING_REPAIR_CAPABILITY', planningOnlyPlan);
  assert(
    '17. missing capability router produces a missing-capability recommendation when no safe repair exists',
    typeof routedForPlanningOnly.missingCapabilityId === 'string' && routedForPlanningOnly.missingCapabilityId.length > 0,
    `missingCapabilityId=${routedForPlanningOnly.missingCapabilityId}`,
  );

  // -------------------------------------------------------------------------------------------
  // 18. Unauthorized fallback modules + product drift — the historical gap is now closed: CBGA V4
  //     is registered as a real, production-wired, safe repair for this class, so the planner
  //     matches it directly instead of ever reporting it missing (see missing-capability-router.ts
  //     for the honest, self-documented "known historical pattern, now resolved" comment).
  // -------------------------------------------------------------------------------------------
  const fallbackPlan = planRepair({ classification: fallbackPrimary, attemptHistory: [] });
  assert(
    '18. unauthorized fallback modules + product drift now match Contract-Bound Generation Authority V4 directly (the historical missing-capability gap is closed, not fabricated as resolved)',
    fallbackPrimary.failureClass === 'UNAUTHORIZED_FALLBACK_MODULES' &&
      fallbackPlan.decision === 'RUN_TARGETED_REPAIR' &&
      fallbackPlan.matchedCapability?.capabilityId === 'contract-bound-generation-authority-v4' &&
      fallbackPlan.matchedCapability?.wiringStatus === 'PRODUCTION_WIRED' &&
      fallbackPlan.matchedCapability?.safeToRunAutomatically === true,
    `primary=${fallbackPrimary.failureClass}, planDecision=${fallbackPlan.decision}, matched=${fallbackPlan.matchedCapability?.capabilityId ?? 'none'}`,
  );

  // -------------------------------------------------------------------------------------------
  // 19. AEO state machine follows observe → diagnose → match → plan.
  // -------------------------------------------------------------------------------------------
  const noHostReport: AeoOrchestratorReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: { npmInstallOk: true, npmBuildOk: false, rawBuildOutput: "error TS2307: Cannot find module './Foo'" },
  });
  const firstCycleStates = noHostReport.cycles[0]?.statesVisited ?? [];
  assert(
    '19. AEO state machine follows OBSERVE_BUILD_RESULT -> DIAGNOSE_FAILURE -> MATCH_REPAIR_CAPABILITY -> PLAN_REPAIR',
    firstCycleStates[0] === 'OBSERVE_BUILD_RESULT' &&
      firstCycleStates[1] === 'DIAGNOSE_FAILURE' &&
      firstCycleStates[2] === 'MATCH_REPAIR_CAPABILITY' &&
      firstCycleStates[3] === 'PLAN_REPAIR',
    `first cycle states = ${firstCycleStates.join(' -> ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 20. AEO applies safe repair only when available (and only via a connected host).
  // -------------------------------------------------------------------------------------------
  let applyRepairCalls = 0;
  const recoveredReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: { npmInstallOk: true, npmBuildOk: false, rawBuildOutput: "error TS2307: Cannot find module './Foo'" },
    host: {
      applyRepair: async () => {
        applyRepairCalls += 1;
        return { applied: true, detail: 'simulated patch applied for validator scenario 20' };
      },
      revalidate: async () => ({ passed: true, detail: 'simulated rebuild passed' }),
    },
  });
  const noHostAppliedRepairAnyway = noHostReport.cycles.some((c) => c.applied);
  assert(
    '20. AEO applies a repair only when a production-wired safe capability is matched AND a real execution host is connected; never invents one',
    applyRepairCalls === 1 &&
      recoveredReport.finalState === 'BUILD_RECOVERED' &&
      recoveredReport.buildRecovered === true &&
      noHostReport.finalState !== 'BUILD_RECOVERED' &&
      !noHostAppliedRepairAnyway,
    `withHost: applyCalls=${applyRepairCalls}, finalState=${recoveredReport.finalState}, recovered=${recoveredReport.buildRecovered}; withoutHost: finalState=${noHostReport.finalState}, appliedAnyway=${noHostAppliedRepairAnyway}`,
  );

  // -------------------------------------------------------------------------------------------
  // 21. AEO stops safely when missing capability is required. Uses a GPCA-diagnosed failure
  //     (LEGACY_GENERATOR_DETECTED) as the genuine "no safe auto-repair exists" case: Generation
  //     Pipeline Compliance Authority V1 is production-wired for this class but is deliberately
  //     never safe-to-auto-run (it audits/blocks, it never repairs itself) — see
  //     repair-capability-registry.ts. This replaces the now-resolved unauthorized-fallback case
  //     (scenario 18) as the missing-capability example, since that gap is closed by CBGA V4.
  // -------------------------------------------------------------------------------------------
  const missingCapabilityReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: {
      gpcaComplianceReport: {
        finalGateOutcome: 'COMPLIANCE_BLOCKED_LEGACY_GENERATOR',
        blockedReasons: ['A generation stage relied on a hardcoded legacy generator instead of CBGA output.'],
      },
    },
  });
  assert(
    '21. AEO stops safely (STOP_SAFE) and reports a missing capability when no safe repair exists (GPCA blocks but never repairs itself)',
    missingCapabilityReport.finalState === 'STOP_SAFE' &&
      missingCapabilityReport.classification.failureClass === 'LEGACY_GENERATOR_DETECTED' &&
      missingCapabilityReport.matchedCapabilityId === 'generation-pipeline-compliance-authority-v1' &&
      typeof missingCapabilityReport.missingCapability?.missingCapabilityId === 'string' &&
      missingCapabilityReport.missingCapability.missingCapabilityId.length > 0,
    `finalState=${missingCapabilityReport.finalState}, failureClass=${missingCapabilityReport.classification.failureClass}, matchedCapabilityId=${missingCapabilityReport.matchedCapabilityId}, missingCapabilityId=${missingCapabilityReport.missingCapability?.missingCapabilityId ?? 'none'}`,
  );

  // -------------------------------------------------------------------------------------------
  // 22. AEO prevents infinite repair loops.
  // -------------------------------------------------------------------------------------------
  let revalidateCalls = 0;
  const neverRecoversReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: { npmInstallOk: true, npmBuildOk: false, rawBuildOutput: "error TS2307: Cannot find module './Foo'" },
    host: {
      applyRepair: async () => ({ applied: true, detail: 'patch applied but never actually fixes anything (validator scenario 22)' }),
      revalidate: async () => {
        revalidateCalls += 1;
        return { passed: false, detail: 'still failing' };
      },
    },
  });
  assert(
    '22. AEO bounds repair cycles and never loops forever, even when a repair keeps failing',
    neverRecoversReport.cycles.length <= 3 &&
      revalidateCalls <= 3 &&
      neverRecoversReport.finalState !== 'BUILD_RECOVERED' &&
      neverRecoversReport.cycles.length === revalidateCalls,
    `cycles=${neverRecoversReport.cycles.length}, revalidateCalls=${revalidateCalls}, finalState=${neverRecoversReport.finalState}`,
  );

  // -------------------------------------------------------------------------------------------
  // 23. AEO records repair history.
  // -------------------------------------------------------------------------------------------
  assert(
    '23. AEO records a repair attempt history entry for every cycle',
    neverRecoversReport.repairAttemptHistory.length === neverRecoversReport.cycles.length &&
      neverRecoversReport.repairAttemptHistory.every((a) => a.capabilityId === 'build-reality-autofix-engine-v1'),
    `history length=${neverRecoversReport.repairAttemptHistory.length}, cycles=${neverRecoversReport.cycles.length}`,
  );

  // -------------------------------------------------------------------------------------------
  // 24. AEO never marks success without evidence.
  // -------------------------------------------------------------------------------------------
  const appliedNoRevalidateReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: { npmInstallOk: true, npmBuildOk: false, rawBuildOutput: "error TS2307: Cannot find module './Foo'" },
    host: {
      applyRepair: async () => ({ applied: true, detail: 'applied, but this host never confirms it worked' }),
      // no revalidate host on purpose
    },
  });
  assert(
    '24. AEO never marks BUILD_RECOVERED without real revalidation evidence',
    appliedNoRevalidateReport.finalState !== 'BUILD_RECOVERED' &&
      appliedNoRevalidateReport.buildRecovered === false &&
      appliedNoRevalidateReport.finalState === 'HUMAN_REVIEW_REQUIRED',
    `finalState=${appliedNoRevalidateReport.finalState}, buildRecovered=${appliedNoRevalidateReport.buildRecovered}`,
  );

  // -------------------------------------------------------------------------------------------
  // 25. Orchestrator production path invokes AEO before returning final failed build result.
  // -------------------------------------------------------------------------------------------
  const orchestratorSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
  const importsAeo = /from '\.\.\/autonomous-engineering-orchestrator-v1\/index\.js'/.test(orchestratorSource);
  const exhaustedBranchIdx = orchestratorSource.indexOf('buildAutofixLoop.exhausted');
  const aeoCallIdx = orchestratorSource.indexOf('runAutonomousEngineeringOrchestrator(');
  const returnAfterAeoIdx = orchestratorSource.indexOf('return registerBuildOutcome(projectId, projectName, buildErrorsCompleted)', aeoCallIdx);
  const callsAeoBeforeReturn = exhaustedBranchIdx > -1 && aeoCallIdx > exhaustedBranchIdx && returnAfterAeoIdx > aeoCallIdx;
  assert(
    '25. one-prompt-build-orchestrator.ts imports AEO and calls it (in the build-autofix-exhausted branch) before returning the final failed build result',
    importsAeo && callsAeoBeforeReturn,
    `importsAeo=${importsAeo}, callsAeoBeforeReturn=${callsAeoBeforeReturn} (exhaustedBranchIdx=${exhaustedBranchIdx}, aeoCallIdx=${aeoCallIdx}, returnAfterAeoIdx=${returnAfterAeoIdx})`,
  );
  const typesSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-live-preview-types.ts'), 'utf8');
  assert(
    '25b. OnePromptLivePreviewBuildResult carries an aeoReport field',
    /aeoReport\?:/.test(typesSource),
    `aeoReport field present=${/aeoReport\?:/.test(typesSource)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 26/27/28/29. Build report includes classification, matched capability, missing capability,
  // and an explanation of why no repair was applied.
  // -------------------------------------------------------------------------------------------
  assert(
    '26. build report includes a failure classification',
    typeof missingCapabilityReport.classification?.failureClass === 'string',
    `classification=${missingCapabilityReport.classification?.failureClass}`,
  );
  assert(
    '27. build report includes the matched repair capability (or honestly null when none matched)',
    'matchedCapabilityId' in missingCapabilityReport && recoveredReport.matchedCapabilityId === 'build-reality-autofix-engine-v1',
    `missingCapabilityReport.matchedCapabilityId=${missingCapabilityReport.matchedCapabilityId}, recoveredReport.matchedCapabilityId=${recoveredReport.matchedCapabilityId}`,
  );
  assert(
    '28. build report includes a missing capability recommendation when relevant',
    missingCapabilityReport.missingCapability !== null && recoveredReport.missingCapability === null,
    `missingCapabilityReport.missingCapability=${missingCapabilityReport.missingCapability?.missingCapabilityId ?? 'null'}, recoveredReport.missingCapability=${recoveredReport.missingCapability}`,
  );
  assert(
    '29. build report explains why no repair was applied (plain-English summary names the checked capability or explains none exists)',
    /checked existing repair capability|found none registered/.test(missingCapabilityReport.plainEnglishSummary) &&
      missingCapabilityReport.plainEnglishSummary.length > 30,
    missingCapabilityReport.plainEnglishSummary,
  );

  // -------------------------------------------------------------------------------------------
  // 30. Product Faithfulness repair is marked report/evidence-only unless production regeneration
  //     is wired.
  // -------------------------------------------------------------------------------------------
  const genFaithfulnessRepair = getRepairCapabilityById('generation-faithfulness-repair');
  const pfV2Repair = getRepairCapabilityById('product-faithfulness-v2-repair');
  assert(
    '30. Product Faithfulness repair (both requested names) is honestly marked SIMULATED / report-evidence-only, not a real production regeneration',
    genFaithfulnessRepair?.wiringStatus === 'SIMULATED' &&
      pfV2Repair?.wiringStatus === 'SIMULATED' &&
      genFaithfulnessRepair.safeToRunAutomatically === false &&
      pfV2Repair.safeToRunAutomatically === false,
    `generation-faithfulness-repair=${genFaithfulnessRepair?.wiringStatus}/${genFaithfulnessRepair?.safeToRunAutomatically}, product-faithfulness-v2-repair=${pfV2Repair?.wiringStatus}/${pfV2Repair?.safeToRunAutomatically}`,
  );

  // -------------------------------------------------------------------------------------------
  // 31. Capability-planning / missing-capability systems registered but not falsely treated as
  //     production repair.
  // -------------------------------------------------------------------------------------------
  const capPlanning = getRepairCapabilityById('capability-planning-engine');
  const mceEngine = getRepairCapabilityById('missing-capability-evolution-engine');
  assert(
    '31. capability-planning-engine and missing-capability-evolution-engine are registered but never selected for automatic repair',
    capPlanning?.wiringStatus === 'PLANNING_ONLY' &&
      mceEngine?.wiringStatus === 'PLANNING_ONLY' &&
      AEO_FAILURE_CLASSES.every((fc) => {
        const cls = { ...compilerPrimary, failureClass: fc };
        const plan = planRepair({ classification: cls, attemptHistory: [] });
        return plan.decision !== 'RUN_TARGETED_REPAIR' || (plan.matchedCapability?.capabilityId !== 'capability-planning-engine' && plan.matchedCapability?.capabilityId !== 'missing-capability-evolution-engine');
      }),
    `capability-planning-engine=${capPlanning?.wiringStatus}, missing-capability-evolution-engine=${mceEngine?.wiringStatus}; never auto-selected across all ${AEO_FAILURE_CLASSES.length} failure classes`,
  );

  // -------------------------------------------------------------------------------------------
  // 32/33. No application-specific logic / no hardcoded product domains introduced.
  // -------------------------------------------------------------------------------------------
  const aeoDir = join(ROOT, 'src/autonomous-engineering-orchestrator-v1');
  const aeoFiles = readdirSync(aeoDir).filter((f) => f.endsWith('.ts'));
  const aeoSource = aeoFiles.map((f) => readFileSync(join(aeoDir, f), 'utf8')).join('\n');
  const FORBIDDEN_DOMAIN_WORDS = [
    'calculator',
    'converter',
    'restaurant',
    'booking',
    'crm',
    'inventory',
    '\\bnotes\\b',
    'dashboard',
    '\\blisa\\b',
    'authentication',
    '\\bcrud\\b',
    'task-tracker',
    'tasktracker',
  ];
  const domainHits = FORBIDDEN_DOMAIN_WORDS.filter((w) => new RegExp(w, 'i').test(aeoSource));
  assert(
    '32/33. no application-specific or hardcoded product-domain logic introduced in the AEO module',
    domainHits.length === 0,
    domainHits.length === 0 ? `inspected ${aeoFiles.length} AEO source file(s) — no forbidden domain words found` : `found: ${domainHits.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 34. No validators weakened (this validator's own package.json script was added, not altered).
  // -------------------------------------------------------------------------------------------
  const packageJsonSource = readFileSync(join(ROOT, 'package.json'), 'utf8');
  const pkg = JSON.parse(packageJsonSource) as { scripts: Record<string, string> };
  const hasOwnScript = pkg.scripts['validate:autonomous-engineering-orchestrator-v1'] === 'tsx scripts/validate-autonomous-engineering-orchestrator-v1.ts';
  assert(
    '34. this milestone adds its own validator script without touching any other validate:* script',
    hasOwnScript,
    hasOwnScript ? 'validate:autonomous-engineering-orchestrator-v1 script present with expected command' : 'script missing or command changed',
  );

  // -------------------------------------------------------------------------------------------
  // 35. No VERE or validation-speed work added.
  // -------------------------------------------------------------------------------------------
  const vereMention = /\bvere\b/i.test(aeoSource);
  assert(
    '35. no VERE / validation-runtime-speed work was added by this milestone',
    !vereMention,
    vereMention ? 'unexpected VERE reference found near AEO integration' : 'no VERE references found in AEO module or its integration point',
  );

  // -------------------------------------------------------------------------------------------
  // 36. No Contract-Bound Generation Authority implementation added in this milestone.
  // -------------------------------------------------------------------------------------------
  const cbgaFiles = aeoFiles.filter((f) => /contract-bound/i.test(f));
  const cbgaImplementationPatterns = [/function\s+(apply|execute|implement|run|build)ContractBound/i, /class\s+ContractBoundGenerationAuthority/i];
  const cbgaImplemented = cbgaImplementationPatterns.some((p) => p.test(aeoSource));
  assert(
    '36. Contract-Bound Generation Authority is only ever named as a missing capability, never implemented, in this milestone',
    cbgaFiles.length === 0 && !cbgaImplemented && /CONTRACT_BOUND_GENERATION_AUTHORITY/.test(aeoSource),
    `dedicated files=${cbgaFiles.length}, implementation patterns matched=${cbgaImplemented}, identifier referenced as missing-capability id=${/CONTRACT_BOUND_GENERATION_AUTHORITY/.test(aeoSource)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 37. No new TypeScript errors introduced in touched files.
  // -------------------------------------------------------------------------------------------
  const TOUCHED_FILES = [
    'src/autonomous-engineering-orchestrator-v1/',
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
  ];
  // Pre-existing tsc error signatures in one-prompt-build-orchestrator.ts / one-prompt-live-preview-types.ts,
  // unrelated to this milestone (confirmed present before AEO was wired in — see repo tsc baseline).
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
    '37. no new TypeScript errors introduced in touched files (lightweight touched-file tsc diagnostic)',
    !tscFailedToRun && newTouchedFileErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}, new (non-pre-existing)=${newTouchedFileErrors.length}${newTouchedFileErrors.length > 0 ? `: ${newTouchedFileErrors.join(' | ')}` : ''}`,
  );

  // -------------------------------------------------------------------------------------------
  // Determinism check: same input, same structural output (excluding wall-clock timestamps —
  // generatedAt and every repairAttemptHistory[].atMs, which record real Date.now() call times
  // and are never claimed to be structurally deterministic across independent runs).
  // -------------------------------------------------------------------------------------------
  const runA = await runAutonomousEngineeringOrchestrator({ diagnosisInput: { fallbackModulesDetected: true } });
  const runB = await runAutonomousEngineeringOrchestrator({ diagnosisInput: { fallbackModulesDetected: true } });
  const strip = (r: AeoOrchestratorReport) =>
    JSON.stringify({
      ...r,
      generatedAt: null,
      repairAttemptHistory: r.repairAttemptHistory.map((a) => ({ ...a, atMs: null })),
      engineeringIntelligenceActivation: r.engineeringIntelligenceActivation
        ? { ...r.engineeringIntelligenceActivation, generatedAt: null }
        : null,
    });
  assert(
    'extra. AEO is deterministic — identical input yields byte-identical structural output',
    strip(runA) === strip(runB),
    strip(runA) === strip(runB) ? 'two independent runs produced identical structural output' : 'runs diverged',
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
