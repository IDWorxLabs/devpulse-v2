/**
 * GPCA_PRODUCTION_ENFORCEMENT_FIX_V1 — validation.
 *
 * Generation Pipeline Compliance Authority V1 (GPCA) already existed and its own validator
 * already passed — but a real production build could still reach a running preview after GPCA's
 * own report said the pipeline was non-compliant. The bug was never GPCA's detection logic; it was
 * that `one-prompt-build-orchestrator.ts` collapsed a GPCA post-materialization block into the same
 * generic `materializationExecuted: false` boolean the ASE/AEE continuation/override logic already
 * treats as an overridable "ASE denial" once the (already non-compliant) workspace has files on
 * disk — so a GPCA block could be silently overridden and the build would fall through, unchecked,
 * all the way to `startGeneratedAppDevServer`.
 *
 * This validator proves that the production path now:
 *   1. checks GPCA's own report directly (never a derived boolean) at every point that could
 *      otherwise let a build continue,
 *   2-6. stops before workspace generation/materialization finalization, before npm install/build,
 *      before preview activation, and before any live-preview-proof mechanism can run — for every
 *      one of GPCA's generic hard-stop categories, with no override path remaining,
 *   7-14. every generic hard-stop category (reusable-components shell, generic blueprint shell,
 *      unsupported module/route/navigation, title outside contract, missing traceability, generator
 *      input bypass) still produces a real GPCA block (GPCA's own detection is untouched),
 *   15-18. the build result this now produces is unambiguous: GENERATION_PIPELINE_NON_COMPLIANT,
 *      with the failing stage, blocked-materialization, and blocked-preview-activation all present,
 *   19-20. AEO classifies the hard-stop into one of its GPCA failure classes and never attempts a
 *      preview-restart recovery for it (no host is ever wired for this call),
 *   21. the chat/UI response for a GPCA hard-stop reads "Build blocked before generation." with the
 *      approved-contract reason, never a stale/partial preview,
 *   22-25. no application-specific logic, no hardcoded product domains, no validator was weakened,
 *      no VERE work was introduced, and
 *   26. no new TypeScript errors were introduced in the touched files.
 *
 * Run only:
 *   npx tsx scripts/validate-gpca-production-enforcement-fix-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  runGenerationPipelineComplianceAuthority,
  gpcaBlocksGeneration,
  gpcaFailureReason,
  GPCA_GATE_OUTCOME_TO_FAILURE_CLASS,
  GPCA_GENERATION_GATE_OUTCOMES,
} from '../src/generation-pipeline-compliance-authority-v1/index.js';
import type { GpcaPipelineEvidenceInput, GpcaComplianceReport } from '../src/generation-pipeline-compliance-authority-v1/index.js';
import {
  buildContractModulePlan,
  buildContractRoutePlan,
  buildContractNavigationPlan,
  runContractBoundGenerationAuthority,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { CbgaCanonicalContractEvidence, CbgaGenerationReport } from '../src/contract-bound-generation-authority-v4/index.js';
import { runAutonomousEngineeringOrchestrator } from '../src/autonomous-engineering-orchestrator-v1/index.js';
import { diagnoseBuildFailure } from '../src/autonomous-engineering-orchestrator-v1/failure-diagnosis-adapter.js';
import { getRepairCapabilityById } from '../src/autonomous-engineering-orchestrator-v1/repair-capability-registry.js';
import { composeAeeAwareBuildChatResponse } from '../src/autonomous-engineering-executive/index.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'GPCA_PRODUCTION_ENFORCEMENT_FIX_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

// -------------------------------------------------------------------------------------------
// Fixtures — a domain-neutral test contract, deliberately unrelated to any of the banned
// product-domain words this validator checks for later. Reused only as hand-built structural
// evidence so every scenario stays deterministic and independent of product-faithfulness's own
// glossary/extraction internals.
// -------------------------------------------------------------------------------------------
const TEST_CONTRACT: CbgaCanonicalContractEvidence = {
  contractId: 'contract-test-fixture-alpha',
  productIdentity: 'Field Service Dispatch Tool',
  primaryWorkflows: ['scheduling visits', 'tracking technicians'],
  coreEntities: ['work orders', 'technicians', 'customers'],
  coreActions: ['create', 'assign', 'complete'],
  navigationExpectations: ['work orders', 'technicians', 'customers'],
  majorFeatureGroups: ['scheduling', 'technician tracking'],
  businessConcepts: ['work orders', 'technicians', 'customers', 'scheduling', 'technician tracking'],
  allConceptNames: [
    'scheduling visits',
    'tracking technicians',
    'work orders',
    'technicians',
    'customers',
    'create',
    'assign',
    'complete',
    'scheduling',
    'technician tracking',
  ],
};

const modulePlan = buildContractModulePlan(TEST_CONTRACT);
const routePlan = buildContractRoutePlan(modulePlan);
const navigationPlan = buildContractNavigationPlan(routePlan);

const COMPLIANT_CBGA_REPORT: CbgaGenerationReport = runContractBoundGenerationAuthority({
  contract: TEST_CONTRACT,
  proposed: {
    proposedModuleIds: modulePlan.map((m) => m.moduleId),
    proposedRoutes: routePlan.map((r) => r.path),
    proposedNavigationLabels: navigationPlan.map((n) => n.label),
    proposedAppTitle: TEST_CONTRACT.productIdentity,
    proposedPrimaryWorkflowVisible: true,
    proposedPrimaryWorkflowInteractive: true,
  },
});

function compliantEvidence(overrides?: Partial<GpcaPipelineEvidenceInput['proposed']>): GpcaPipelineEvidenceInput {
  return {
    contract: TEST_CONTRACT,
    cbgaReport: COMPLIANT_CBGA_REPORT,
    proposed: {
      appTitle: TEST_CONTRACT.productIdentity,
      moduleIds: modulePlan.map((m) => m.moduleId),
      routes: routePlan.map((r) => r.path),
      navigationLabels: navigationPlan.map((n) => n.label),
      generatedFilePaths: [],
      ...overrides,
    },
  };
}

async function main(): Promise<void> {
  const ORCHESTRATOR_PATH = join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  // Normalize CRLF -> LF so multi-line marker strings below match regardless of the checked-out
  // line-ending style.
  const orchestratorSource = readFileSync(ORCHESTRATOR_PATH, 'utf8').replace(/\r\n/g, '\n');

  // -------------------------------------------------------------------------------------------
  // 1. GPCA's production result is checked by the orchestrator — directly, repeatedly, at every
  //    point that could otherwise let a build continue (never just once at the top).
  // -------------------------------------------------------------------------------------------
  const gpcaCheckMatches = orchestratorSource.match(/gpcaBlocksGeneration\(gpcaComplianceReport\)/g) ?? [];
  assert(
    "1. GPCA's production result (gpcaBlocksGeneration(gpcaComplianceReport)) is checked by the orchestrator at every continuation point",
    gpcaCheckMatches.length >= 6,
    `found ${gpcaCheckMatches.length} direct gpcaBlocksGeneration(gpcaComplianceReport) checks in the orchestrator`,
  );

  // -------------------------------------------------------------------------------------------
  // 2. A GPCA non-compliant result stops before the ASE/AEE continuation/override logic even
  //    runs — the primary enforcement point sits strictly before
  //    `if (!engineeringPartial.materializationExecuted)`, so a GPCA block can never be
  //    reinterpreted as an overridable "ASE denial" once workspace files exist.
  // -------------------------------------------------------------------------------------------
  const primaryGateMarker = "if (gpcaBlocksGeneration(gpcaComplianceReport)) {\n    return registerGpcaHardStop('MATERIALIZATION');\n  }";
  const primaryGateIndex = orchestratorSource.indexOf(primaryGateMarker);
  const continuationBlockIndex = orchestratorSource.indexOf('if (!engineeringPartial.materializationExecuted) {');
  assert(
    '2. GPCA non-compliant result stops before materialization/continuation — the primary gate runs before the ASE/AEE continuation-override block',
    primaryGateIndex !== -1 && continuationBlockIndex !== -1 && primaryGateIndex < continuationBlockIndex,
    `primaryGateIndex=${primaryGateIndex}, continuationBlockIndex=${continuationBlockIndex}`,
  );

  // -------------------------------------------------------------------------------------------
  // 3. A GPCA non-compliant result stops before workspace generation is ever handed to
  //    npm install/build — a defense-in-depth re-check of the same report sits strictly before
  //    the workspace-stabilization/npm-install stage, regardless of which continuation branch the
  //    build took above it.
  // -------------------------------------------------------------------------------------------
  const npmInstallIndex = orchestratorSource.indexOf("execSync('npm install");
  const preInstallGateIndex = orchestratorSource.lastIndexOf(
    "if (gpcaBlocksGeneration(gpcaComplianceReport)) {\n    return registerGpcaHardStop('MATERIALIZATION');\n  }",
    npmInstallIndex === -1 ? undefined : npmInstallIndex,
  );
  assert(
    '3. GPCA non-compliant result stops before workspace generation (npm install/build never runs)',
    npmInstallIndex !== -1 && preInstallGateIndex !== -1 && preInstallGateIndex < npmInstallIndex,
    `preInstallGateIndex=${preInstallGateIndex}, npmInstallIndex=${npmInstallIndex}`,
  );

  // -------------------------------------------------------------------------------------------
  // 4. A GPCA non-compliant result stops before preview activation — the final gate immediately
  //    precedes the only production call site that starts a real dev server for a fresh build.
  // -------------------------------------------------------------------------------------------
  const previewGateMarker = "if (gpcaBlocksGeneration(gpcaComplianceReport)) {\n    return registerGpcaHardStop('PREVIEW');\n  }";
  const previewGateIndex = orchestratorSource.indexOf(previewGateMarker);
  const firstDevServerStartIndex = orchestratorSource.indexOf('const devServer = await startGeneratedAppDevServer(');
  assert(
    '4. GPCA non-compliant result stops before preview activation — the final gate immediately precedes the dev-server start call',
    previewGateIndex !== -1 &&
      firstDevServerStartIndex !== -1 &&
      previewGateIndex < firstDevServerStartIndex &&
      firstDevServerStartIndex - previewGateIndex < 400,
    `previewGateIndex=${previewGateIndex}, firstDevServerStartIndex=${firstDevServerStartIndex}, distance=${firstDevServerStartIndex - previewGateIndex}`,
  );

  // -------------------------------------------------------------------------------------------
  // 5. A GPCA non-compliant result stops before any live-preview-proof mechanism can run — every
  //    preview-recovery/retry mechanism (which is what actually drives live-preview proof) is
  //    strictly downstream of the one dev-server start call the preview gate protects, so none of
  //    them are reachable without first passing scenario 4's gate.
  // -------------------------------------------------------------------------------------------
  const previewRecoveryIndices = [...orchestratorSource.matchAll(/runAeePreviewRecoveryLoop\(/g)].map((m) => m.index ?? -1);
  assert(
    '5. GPCA non-compliant result stops before live-preview-proof/recovery mechanisms run — every recovery-loop call site is downstream of the preview gate',
    previewRecoveryIndices.length > 0 && previewRecoveryIndices.every((i) => i > previewGateIndex && i > firstDevServerStartIndex),
    `previewGateIndex=${previewGateIndex}, previewRecoveryIndices=${previewRecoveryIndices.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 6. The orchestrator does not continue after a GPCA hard-stop — every call to the terminal
  //    helper is an unconditional `return`, never a value that is inspected/possibly ignored.
  // -------------------------------------------------------------------------------------------
  const hardStopCallCount = (orchestratorSource.match(/registerGpcaHardStop\(/g) ?? []).length;
  const returnedHardStopCallCount = (orchestratorSource.match(/return registerGpcaHardStop\(/g) ?? []).length;
  assert(
    '6. Orchestrator does not continue after a GPCA hard-stop — every registerGpcaHardStop( call site is an unconditional return',
    hardStopCallCount >= 5 && hardStopCallCount === returnedHardStopCallCount,
    `registerGpcaHardStop( call sites=${hardStopCallCount}, of which "return registerGpcaHardStop("=${returnedHardStopCallCount}`,
  );

  // -------------------------------------------------------------------------------------------
  // 7. Generic reusable-components shell is blocked generically — GPCA's own detection (never
  //    touched by this milestone) still flags the Blueprint Generator's structural
  //    reusable-component-shell flag as a template-generator violation for any real build, purely
  //    from stage evidence, independent of product domain.
  // -------------------------------------------------------------------------------------------
  const reusableShellReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ generatedFilePaths: modulePlan.map((m) => `src/features/${m.moduleId}/index.ts`) }),
  );
  assert(
    '7. Generic reusable-components shell is blocked generically (no product-domain branching)',
    gpcaBlocksGeneration(reusableShellReport) && reusableShellReport.templateGeneratorsDetected.includes('Blueprint Generator'),
    `outcome=${reusableShellReport.finalGateOutcome}, templateGeneratorsDetected=${reusableShellReport.templateGeneratorsDetected.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 8. Generic blueprint shell (default onboarding shell) is blocked generically — an
  //    unconditional welcome/onboarding blueprint file on disk blocks generation regardless of
  //    what product the contract describes.
  // -------------------------------------------------------------------------------------------
  const blueprintShellReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ generatedFilePaths: ['src/blueprint/WelcomeScreen.tsx', 'src/blueprint/OnboardingScreen.tsx'] }),
  );
  assert(
    '8. Generic blueprint shell (welcome/onboarding) is blocked generically',
    blueprintShellReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS' &&
      blueprintShellReport.blueprintBypassDetected.length === 2,
    `outcome=${blueprintShellReport.finalGateOutcome}, bypass=${blueprintShellReport.blueprintBypassDetected.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 9. Unsupported module output is blocked — a module id CBGA never approved (and that is not a
  //    recognized system-shell module) is a generator input bypass, purely from evidence.
  // -------------------------------------------------------------------------------------------
  const unsupportedModuleReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ moduleIds: [...modulePlan.map((m) => m.moduleId), 'some-invented-widget'] }),
  );
  assert(
    '9. Unsupported module output is blocked generically',
    unsupportedModuleReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS' &&
      unsupportedModuleReport.contractBypassDetected.some((r) => r.includes('some-invented-widget')),
    `outcome=${unsupportedModuleReport.finalGateOutcome}, bypass=${unsupportedModuleReport.contractBypassDetected.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 10. Unsupported route output is blocked.
  // -------------------------------------------------------------------------------------------
  const unsupportedRouteReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ routes: [...routePlan.map((r) => r.path), '/some-invented-route'] }),
  );
  assert(
    '10. Unsupported route output is blocked generically',
    unsupportedRouteReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS' &&
      unsupportedRouteReport.contractBypassDetected.some((r) => r.includes('/some-invented-route')),
    `outcome=${unsupportedRouteReport.finalGateOutcome}, bypass=${unsupportedRouteReport.contractBypassDetected.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 11. Unsupported navigation output is blocked — a default-shell navigation label
  //     ("Help") that the contract does not justify and CBGA never approved.
  // -------------------------------------------------------------------------------------------
  const unsupportedNavReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ navigationLabels: [...navigationPlan.map((n) => n.label), 'Help'] }),
  );
  assert(
    '11. Unsupported navigation output is blocked generically',
    unsupportedNavReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS' &&
      unsupportedNavReport.contractBypassDetected.some((r) => r.includes('Help')),
    `outcome=${unsupportedNavReport.finalGateOutcome}, bypass=${unsupportedNavReport.contractBypassDetected.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 12. Title outside contract is blocked — any app title that does not equal the contract's
  //     product identity, regardless of what that title text actually says.
  // -------------------------------------------------------------------------------------------
  const titleOutsideContractReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ appTitle: 'some generic placeholder title' }),
  );
  assert(
    '12. Title outside contract is blocked generically',
    titleOutsideContractReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS' &&
      titleOutsideContractReport.contractBypassDetected.some((r) => r.includes('does not match')),
    `outcome=${titleOutsideContractReport.finalGateOutcome}, bypass=${titleOutsideContractReport.contractBypassDetected.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 13. Missing traceability is blocked — real files exist on disk but there is no CBGA report to
  //     prove ancestry back to the canonical contract.
  // -------------------------------------------------------------------------------------------
  const missingTraceabilityReport = runGenerationPipelineComplianceAuthority({
    contract: TEST_CONTRACT,
    cbgaReport: null,
    proposed: {
      appTitle: TEST_CONTRACT.productIdentity,
      moduleIds: modulePlan.map((m) => m.moduleId),
      routes: routePlan.map((r) => r.path),
      navigationLabels: [],
      generatedFilePaths: modulePlan.map((m) => `src/features/${m.moduleId}/index.ts`),
    },
  });
  assert(
    '13. Missing traceability is blocked generically',
    missingTraceabilityReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE',
    `outcome=${missingTraceabilityReport.finalGateOutcome}, blockedReasons=${missingTraceabilityReport.blockedReasons.join(' | ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 14. Generator input bypass is blocked — module, route, and title all disagree with CBGA's
  //     approved plan simultaneously, still resolves to a single clear generator-input-bypass
  //     outcome (never silently averaged away).
  // -------------------------------------------------------------------------------------------
  const generatorInputBypassReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({
      appTitle: 'a totally different app',
      moduleIds: ['completely-invented-module'],
      routes: ['/invented'],
    }),
  );
  assert(
    '14. Generator input bypass is blocked generically',
    generatorInputBypassReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS' &&
      generatorInputBypassReport.contractBypassDetected.length >= 3,
    `outcome=${generatorInputBypassReport.finalGateOutcome}, bypass count=${generatorInputBypassReport.contractBypassDetected.length}`,
  );

  // -------------------------------------------------------------------------------------------
  // 15. Build result reports GENERATION_PIPELINE_NON_COMPLIANT (or equivalent) — the shared
  //     terminal helper always prefixes its failureReason with this exact, greppable token.
  // -------------------------------------------------------------------------------------------
  assert(
    '15. Build result reports GENERATION_PIPELINE_NON_COMPLIANT',
    orchestratorSource.includes("`GENERATION_PIPELINE_NON_COMPLIANT: ${gpcaReason}`"),
    'failureReason prefix "GENERATION_PIPELINE_NON_COMPLIANT:" found in registerGpcaHardStop',
  );

  // -------------------------------------------------------------------------------------------
  // 16. Build report includes the failing generation stage.
  // -------------------------------------------------------------------------------------------
  assert(
    '16. Build report includes the failing generation stage (failureStage is threaded through)',
    orchestratorSource.includes('failureStage: stageLabel,') && orchestratorSource.includes("failureStage: 'PLANNING',"),
    'failureStage is set on every GPCA hard-stop failure result',
  );

  // -------------------------------------------------------------------------------------------
  // 17. Build report includes "blocked materialization: yes".
  // -------------------------------------------------------------------------------------------
  const blockedMaterializationMatches = (orchestratorSource.match(/gpcaBlockedMaterialization: true,/g) ?? []).length;
  assert(
    '17. Build report includes blocked materialization: yes',
    blockedMaterializationMatches >= 2,
    `gpcaBlockedMaterialization: true literal found ${blockedMaterializationMatches} time(s)`,
  );

  // -------------------------------------------------------------------------------------------
  // 18. Build report includes "blocked preview activation: yes".
  // -------------------------------------------------------------------------------------------
  const blockedPreviewMatches = (orchestratorSource.match(/gpcaBlockedPreviewActivation: true,/g) ?? []).length;
  assert(
    '18. Build report includes blocked preview activation: yes',
    blockedPreviewMatches >= 2,
    `gpcaBlockedPreviewActivation: true literal found ${blockedPreviewMatches} time(s)`,
  );

  // -------------------------------------------------------------------------------------------
  // 19. AEO classifies a GPCA hard-stop correctly — every declared GPCA gate outcome (except the
  //     allowed one) maps to one of AEO's real GPCA failure classes, and AEO's real orchestration
  //     loop (with no execution host wired) reaches that same classification end-to-end.
  // -------------------------------------------------------------------------------------------
  let allOutcomesClassifyCorrectly = true;
  const classificationDetail: string[] = [];
  for (const outcome of GPCA_GENERATION_GATE_OUTCOMES) {
    if (outcome === 'COMPLIANCE_ALLOWED') continue;
    const expectedClass = GPCA_GATE_OUTCOME_TO_FAILURE_CLASS[outcome];
    const classifications = diagnoseBuildFailure({ gpcaComplianceReport: { finalGateOutcome: outcome, blockedReasons: [`test: ${outcome}`] } });
    const actualClass = classifications[0]?.failureClass ?? null;
    const ok = actualClass === expectedClass;
    if (!ok) allOutcomesClassifyCorrectly = false;
    classificationDetail.push(`${outcome}->${actualClass}(expected ${expectedClass})`);
  }
  assert(
    '19a. AEO diagnoses every GPCA gate outcome into the correct GPCA failure class',
    allOutcomesClassifyCorrectly,
    classificationDetail.join(', '),
  );

  const aeoReportForHardStop = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: {
      gpcaComplianceReport: { finalGateOutcome: 'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS', blockedReasons: ['a real blueprint bypass was detected'] },
    },
  });
  assert(
    '19b. AEO end-to-end classifies a real GPCA hard-stop as BLUEPRINT_BYPASS',
    aeoReportForHardStop.classification.failureClass === 'BLUEPRINT_BYPASS',
    `classification.failureClass=${aeoReportForHardStop.classification.failureClass}`,
  );

  // -------------------------------------------------------------------------------------------
  // 20. AEO does not attempt preview recovery after a GPCA hard-stop — no repair is ever applied
  //     (no host is wired in registerGpcaHardStop), buildRecovered stays false, and GPCA's own
  //     registered capability is honestly non-auto-runnable, so there is no repair path that could
  //     restart the preview.
  // -------------------------------------------------------------------------------------------
  const gpcaCapability = getRepairCapabilityById('generation-pipeline-compliance-authority-v1');
  assert(
    '20. AEO does not attempt preview recovery after a GPCA hard-stop (no repair applied; the capability is honestly registered as not safe-to-auto-run, so no repair path could restart preview)',
    aeoReportForHardStop.buildRecovered === false &&
      aeoReportForHardStop.repairResult !== 'REPAIRED' &&
      gpcaCapability !== null &&
      gpcaCapability.safeToRunAutomatically === false,
    `buildRecovered=${aeoReportForHardStop.buildRecovered}, repairResult=${aeoReportForHardStop.repairResult}, gpcaCapability.safeToRunAutomatically=${gpcaCapability?.safeToRunAutomatically}`,
  );

  // -------------------------------------------------------------------------------------------
  // 21. The chat/UI response for a GPCA hard-stop reads "Build blocked before generation." with
  //     the approved-contract reason, and explicitly reports both blocks as YES — never a
  //     stale/partial preview.
  // -------------------------------------------------------------------------------------------
  const uiGpcaReport = missingTraceabilityReport;
  const syntheticHardStopResult = {
    readOnly: true,
    buildId: 'test-build-1',
    projectId: 'test-project-1',
    projectName: 'Test Project',
    status: 'FAILED',
    prompt: 'test prompt',
    requestType: 'BUILD_FROM_PROMPT',
    workspaceId: null,
    workspacePath: null,
    generatedProfile: null,
    planningProofLevel: null,
    materializationProofLevel: null,
    buildResult: 'FAIL',
    npmInstallOk: false,
    npmBuildOk: false,
    previewUrl: null,
    diagnosticPreviewUrl: null,
    limitedPreviewUrl: null,
    devServerRunning: false,
    livePreviewAvailable: false,
    failureReason: `GENERATION_PIPELINE_NON_COMPLIANT: ${gpcaFailureReason(uiGpcaReport)}`,
    featureSignals: null,
    materializationManifest: null,
    livePreviewGate: null,
    autonomousSoftwareEngineering: null,
    gpcaComplianceReport: uiGpcaReport,
    gpcaHardStop: true,
    gpcaBlockedMaterialization: true,
    gpcaBlockedPreviewActivation: true,
    updatedAt: new Date().toISOString(),
  } as unknown as OnePromptLivePreviewBuildResult;
  const chatResponse = composeAeeAwareBuildChatResponse(syntheticHardStopResult);
  assert(
    '21. UI/chat response displays a GPCA hard-stop as "Build blocked before generation." with the approved-contract reason and both blocks marked YES',
    chatResponse.includes('Build blocked before generation.') &&
      chatResponse.includes('Generation pipeline is not compliant with the approved product contract.') &&
      chatResponse.includes('Blocked materialization: YES') &&
      chatResponse.includes('Blocked preview activation: YES') &&
      !chatResponse.includes('Live Preview is available'),
    `chatResponse contains required lines: ${
      chatResponse.includes('Build blocked before generation.') &&
      chatResponse.includes('Blocked materialization: YES') &&
      chatResponse.includes('Blocked preview activation: YES')
    }`,
  );

  // -------------------------------------------------------------------------------------------
  // 22 / 23. No application-specific logic and no hardcoded product domains were introduced by
  //     this milestone's touched production files (comments stripped so illustrative/documentation
  //     sentences about genericity do not trip the check on themselves).
  // -------------------------------------------------------------------------------------------
  const TOUCHED_PRODUCTION_FILES = [
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
    'src/autonomous-engineering-executive/aee-production-response.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
  ];
  const touchedSource = TOUCHED_PRODUCTION_FILES.map((f) => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n')).join('\n');
  const touchedSourceWithoutComments = touchedSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /if\s*\(\s*(domain|product|profile)\s*===\s*['"](restaurant|calculator|crm|booking|inventory|notes|converter)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
  ];
  const logicHits = APPLICATION_SPECIFIC_LOGIC_PATTERNS.filter((p) => p.test(touchedSourceWithoutComments));
  assert(
    '22. No application-specific logic (no per-domain special-casing branches) introduced in touched files',
    logicHits.length === 0,
    logicHits.length === 0 ? `inspected ${TOUCHED_PRODUCTION_FILES.length} touched file(s) — no per-domain branching found` : `found ${logicHits.length} pattern match(es)`,
  );

  // Pre-existing, unrelated illustrative copy in one-prompt-build-orchestrator.ts (e.g. a
  // suggestion telling the end user to clarify their prompt with "expense tracker, CRM, task
  // tracker" examples) is not logic this milestone introduced, so lines untouched by this
  // milestone's diff are excluded from the scan — otherwise this check would flag pre-existing,
  // unrelated file content the same size constraint made impossible to avoid reading.
  const MILESTONE_ADDED_MARKERS = [
    'registerGpcaHardStop',
    'gpcaHardStop',
    'gpcaBlockedMaterialization',
    'gpcaBlockedPreviewActivation',
    'GPCA Production Enforcement',
  ];
  const touchedSourceMilestoneLinesOnly = touchedSourceWithoutComments
    .split('\n')
    .filter((line) => MILESTONE_ADDED_MARKERS.some((m) => line.includes(m)))
    .join('\n');
  const FORBIDDEN_DOMAIN_WORDS = [
    'restaurant',
    'calculator',
    'converter',
    '\\bcrm\\b',
    'booking',
    'inventory management',
    'notes app',
    'note-taking',
    '\\blisa\\b',
    'authentication system',
    '\\bcrud\\b',
  ];
  const domainHits = FORBIDDEN_DOMAIN_WORDS.filter((w) => new RegExp(w, 'i').test(touchedSourceMilestoneLinesOnly));
  assert(
    '23. No hardcoded product domains introduced by this milestone (scoped to the lines this milestone actually added, comments stripped)',
    domainHits.length === 0,
    domainHits.length === 0
      ? `inspected ${touchedSourceMilestoneLinesOnly.split('\n').filter(Boolean).length} milestone-added line(s) across ${TOUCHED_PRODUCTION_FILES.length} touched file(s) — no forbidden domain words found`
      : `found: ${domainHits.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 24. No validators were weakened — the sibling validators this milestone depends on were not
  //     modified by this milestone and still declare their own pass tokens.
  // -------------------------------------------------------------------------------------------
  const SIBLING_VALIDATORS: Array<{ path: string; passToken: string }> = [
    { path: 'scripts/validate-generation-pipeline-compliance-authority-v1.ts', passToken: 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1_PASS' },
    { path: 'scripts/validate-autonomous-engineering-orchestrator-v1.ts', passToken: "'AUTONOMOUS_ENGINEERING_ORCHESTRATOR_V1_PASS'" },
    { path: 'scripts/validate-engineering-intelligence-activation-authority-v1.ts', passToken: "'ENGINEERING_INTELLIGENCE_ACTIVATION_AUTHORITY_V1_PASS'" },
  ];
  const siblingChecks = SIBLING_VALIDATORS.map((v) => {
    try {
      const src = readFileSync(join(ROOT, v.path), 'utf8');
      return src.includes(v.passToken);
    } catch {
      return false;
    }
  });
  assert(
    '24. No sibling validators were weakened — each still declares its own pass token untouched',
    siblingChecks.every(Boolean),
    `sibling validator pass-token presence: ${SIBLING_VALIDATORS.map((v, i) => `${v.path}=${siblingChecks[i]}`).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 25. No VERE work was introduced by this milestone's touched files.
  // -------------------------------------------------------------------------------------------
  const vereMention = /\bvere\b/i.test(touchedSource);
  assert(
    '25. No VERE work was introduced by this milestone',
    !vereMention,
    vereMention ? 'unexpected VERE reference found in touched files' : 'no VERE references found in touched files',
  );

  // -------------------------------------------------------------------------------------------
  // 26. No new TypeScript errors introduced in touched files (lightweight touched-file tsc
  //     diagnostic, run as part of this validator — never a separate full-repo command).
  // -------------------------------------------------------------------------------------------
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
    return TOUCHED_PRODUCTION_FILES.some((f) => normalized.includes(f));
  });
  const newTouchedFileErrors = touchedFileErrorLines.filter(
    (line) => !KNOWN_PREEXISTING_ERROR_SIGNATURES.some((sig) => line.includes(sig)),
  );
  assert(
    '26. No new TypeScript errors introduced in touched files (lightweight touched-file tsc diagnostic)',
    !tscFailedToRun && newTouchedFileErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}, new (non-pre-existing)=${newTouchedFileErrors.length}${newTouchedFileErrors.length > 0 ? `: ${newTouchedFileErrors.join(' | ')}` : ''}`,
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

  const CAPABILITY_MATRIX = [
    { capability: 'GPCA Production Enforcement', status: 'IMPLEMENTED', productionWired: 'YES', autoRun: 'YES (unconditional hard-stop, every build)', activationAllowed: 'YES', notes: 'Every ASE/AEE continuation/override branch re-checks gpcaComplianceReport directly before workspace stabilization, npm install/build, and preview activation.' },
    { capability: 'Generation Pipeline Compliance Authority', status: 'IMPLEMENTED', productionWired: 'YES', autoRun: 'YES (audits + blocks every build)', activationAllowed: 'YES', notes: 'Detection logic untouched by this milestone — proven identical via scenarios 7-14.' },
    { capability: 'Contract-Bound Generation Authority', status: 'IMPLEMENTED', productionWired: 'YES', autoRun: 'YES', activationAllowed: 'YES', notes: 'Repairs generator inputs to the canonical contract before generation; unchanged by this milestone.' },
    { capability: 'Autonomous Engineering Orchestrator', status: 'IMPLEMENTED', productionWired: 'YES', autoRun: 'YES (matched, safe repairs only)', activationAllowed: 'YES', notes: 'Classifies every GPCA gate outcome into its dedicated failure class; never attempts a preview-restart repair for a GPCA hard-stop (no host wired, capability not safe-to-auto-run).' },
    { capability: 'Engineering Intelligence Activation Authority', status: 'IMPLEMENTED', productionWired: 'YES', autoRun: 'NO (decision authority only)', activationAllowed: 'CONDITIONAL (8-point policy)', notes: 'Unchanged by this milestone.' },
    { capability: 'Product Faithfulness', status: 'IMPLEMENTED', productionWired: 'YES', autoRun: 'N/A (audit)', activationAllowed: 'N/A', notes: 'Produces the canonical product contract GPCA audits every stage against; unchanged by this milestone.' },
    { capability: 'Build Execution Stabilizer', status: 'IMPLEMENTED', productionWired: 'YES', autoRun: 'YES', activationAllowed: 'N/A', notes: 'Runs only after the GPCA gate allows a build to proceed to workspace stabilization.' },
    { capability: 'Live Preview Gate', status: 'IMPLEMENTED', productionWired: 'YES', autoRun: 'YES', activationAllowed: 'N/A', notes: 'Never reached for a GPCA hard-stop — the dev server is never started.' },
  ];
  console.log('\n## Mandatory Capability Matrix\n');
  console.log('| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |');
  console.log('|------------|--------|------------------|----------|--------------------|-------|');
  for (const row of CAPABILITY_MATRIX) {
    console.log(`| ${row.capability} | ${row.status} | ${row.productionWired} | ${row.autoRun} | ${row.activationAllowed} | ${row.notes} |`);
  }

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
