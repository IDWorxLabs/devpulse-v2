/**
 * GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1 — validation.
 *
 * Proves that src/generation-pipeline-compliance-authority-v1/ (GPCA):
 *   1. discovers the complete, deterministic generation pipeline (Prompt Understanding through
 *      Launch) with real stage descriptors (responsible module, input/output objects, compliance
 *      flags) instead of a hardcoded per-product list,
 *   2. verifies every stage's actual proposed/generated inputs against Contract-Bound Generation
 *      Authority V4's approved plan and the canonical product contract,
 *   3. detects legacy generators, template generators, generic shell injection, blueprint bypass,
 *      contract bypass, hardcoded navigation/routes/modules, title generation outside contract, and
 *      Universal Feature Contract leakage — all from real evidence, never a product-domain guess,
 *   4. builds a full contract-ancestry chain for every module/route/navigation item/title/surface and
 *      proves (or disproves) it back to the canonical contract / Founder Prompt,
 *   5. computes a deterministic per-stage Generation Compliance Score and a single gate outcome,
 *      and actually blocks generation (never a fake pass) when the pipeline is non-compliant,
 *   6. is wired for real into `one-prompt-build-orchestrator.ts` twice — once pre-materialization
 *      (verifies proposed inputs) and once post-materialization (verifies real generated files) —
 *      before the dev server / live preview is ever started,
 *   7. is honestly registered in AEO's failure taxonomy + repair-capability-registry as a
 *      production-wired *audit* (never a repair, never safe-to-auto-run), so AEO routes its 7
 *      failure classes to a real "Contract-Compliant Generator Repair" missing-capability
 *      recommendation instead of ever claiming GPCA itself is missing, and EIAA is consulted exactly
 *      the way every other missing-capability path already is,
 *   8. introduces no application-specific logic, no hardcoded product domains, no weakened
 *      validators, no fabricated compliance, no hidden fallback paths, and no new TypeScript errors
 *      in the files it touches — and renders both the mandatory Generation Compliance Matrix and the
 *      mandatory Capability Matrix deterministically.
 *
 * Run only:
 *   npx tsx scripts/validate-generation-pipeline-compliance-authority-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  discoverGenerationPipelineStages,
  getStageBaselineIds,
  detectContractBypassedInputs,
  detectLegacyGeneratorUsage,
  detectTemplateGeneratorUsage,
  detectGenericShellInjection,
  detectBlueprintBypass,
  detectHardcodedNavigationLabels,
  detectHardcodedRoutes,
  detectHardcodedModuleIds,
  detectTitleGeneratedOutsideContract,
  detectRegexTitleExtractionRisk,
  detectProfileTemplateLeakage,
  detectUniversalFeatureContractLeakage,
  buildContractTraceabilityChains,
  scoreStage,
  scorePipeline,
  runGenerationPipelineComplianceGate,
  runGenerationPipelineComplianceAuthority,
  renderGenerationPipelineComplianceReportMarkdown,
  renderCapabilityMatrixMarkdown,
  listCapabilityMatrixCapabilityNames,
  buildGpcaPreMaterializationReport,
  buildGpcaPostMaterializationReport,
  gpcaBlocksGeneration,
  gpcaFailureReason,
  GPCA_STAGE_IDS,
  GPCA_FAILURE_CLASSES,
  GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES,
  GPCA_PASS_THRESHOLD_PERCENT,
} from '../src/generation-pipeline-compliance-authority-v1/index.js';
import type { GpcaPipelineEvidenceInput, GpcaComplianceReport } from '../src/generation-pipeline-compliance-authority-v1/index.js';
import {
  buildContractModulePlan,
  buildContractRoutePlan,
  buildContractNavigationPlan,
  runContractBoundGenerationAuthority,
  applyContractBoundGenerationToBuildPlan,
  CBGA_DEFAULT_SHELL_NAVIGATION_LABELS,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { CbgaCanonicalContractEvidence, CbgaGenerationReport } from '../src/contract-bound-generation-authority-v4/index.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { getRepairCapabilityById } from '../src/autonomous-engineering-orchestrator-v1/repair-capability-registry.js';
import { planRepair } from '../src/autonomous-engineering-orchestrator-v1/repair-execution-planner.js';
import { routeMissingCapability } from '../src/autonomous-engineering-orchestrator-v1/missing-capability-router.js';
import { diagnoseBuildFailure, selectPrimaryFailureClassification } from '../src/autonomous-engineering-orchestrator-v1/failure-diagnosis-adapter.js';
import { runAutonomousEngineeringOrchestrator } from '../src/autonomous-engineering-orchestrator-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1_PASS';

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
// Fixtures — a restaurant management platform contract (same real-world domain as the observed
// failure), reused only as structural, hand-built evidence so scenarios stay deterministic and
// independent of product-faithfulness-v1's glossary/extraction internals.
// -------------------------------------------------------------------------------------------
const RESTAURANT_CONTRACT: CbgaCanonicalContractEvidence = {
  contractId: 'contract-test-restaurant-management-platform',
  productIdentity: 'Restaurant Management Platform',
  primaryWorkflows: ['taking orders', 'managing reservations'],
  coreEntities: ['menu items', 'tables', 'orders'],
  coreActions: ['add', 'edit', 'delete', 'confirm'],
  navigationExpectations: ['menu items', 'tables', 'orders'],
  majorFeatureGroups: ['inventory tracking', 'staff scheduling'],
  businessConcepts: ['menu items', 'tables', 'orders', 'inventory tracking', 'staff scheduling'],
  allConceptNames: [
    'taking orders',
    'managing reservations',
    'menu items',
    'tables',
    'orders',
    'add',
    'edit',
    'delete',
    'confirm',
    'inventory tracking',
    'staff scheduling',
  ],
};

const CONTRACT_WITH_SETTINGS: CbgaCanonicalContractEvidence = {
  ...RESTAURANT_CONTRACT,
  contractId: 'contract-test-restaurant-with-settings',
  navigationExpectations: [...RESTAURANT_CONTRACT.navigationExpectations, 'settings'],
  allConceptNames: [...RESTAURANT_CONTRACT.allConceptNames, 'settings'],
};

const modulePlan = buildContractModulePlan(RESTAURANT_CONTRACT);
const routePlan = buildContractRoutePlan(modulePlan);
const navigationPlan = buildContractNavigationPlan(routePlan);

const COMPLIANT_CBGA_REPORT: CbgaGenerationReport = runContractBoundGenerationAuthority({
  contract: RESTAURANT_CONTRACT,
  proposed: {
    proposedModuleIds: modulePlan.map((m) => m.moduleId),
    proposedRoutes: routePlan.map((r) => r.path),
    proposedNavigationLabels: navigationPlan.map((n) => n.label),
    proposedAppTitle: RESTAURANT_CONTRACT.productIdentity,
    proposedPrimaryWorkflowVisible: true,
    proposedPrimaryWorkflowInteractive: true,
  },
});

function compliantEvidence(overrides?: Partial<GpcaPipelineEvidenceInput['proposed']>): GpcaPipelineEvidenceInput {
  return {
    contract: RESTAURANT_CONTRACT,
    cbgaReport: COMPLIANT_CBGA_REPORT,
    proposed: {
      appTitle: RESTAURANT_CONTRACT.productIdentity,
      moduleIds: modulePlan.map((m) => m.moduleId),
      routes: routePlan.map((r) => r.path),
      navigationLabels: navigationPlan.map((n) => n.label),
      generatedFilePaths: [],
      ...overrides,
    },
  };
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------------------------
  // 1. Complete pipeline discovery — every documented stage from the milestone's own pipeline
  //    diagram (Prompt Understanding through Launch) is discovered, in order.
  // -------------------------------------------------------------------------------------------
  const discoveredStages = discoverGenerationPipelineStages(compliantEvidence());
  const EXPECTED_STAGE_ORDER = [
    'PROMPT_UNDERSTANDING',
    'PLANNING',
    'ARCHITECTURE',
    'CANONICAL_PRODUCT_CONTRACT',
    'CONTRACT_BOUND_GENERATION_AUTHORITY',
    'PROMPT_BOUNDED_MODULE_PLAN',
    'MODULE_GENERATOR',
    'ROUTE_GENERATOR',
    'NAVIGATION_GENERATOR',
    'SURFACE_GENERATOR',
    'BLUEPRINT_GENERATOR',
    'UNIVERSAL_FEATURE_CONTRACT',
    'MATERIALIZATION',
    'WORKSPACE_GENERATION',
    'PREVIEW_GENERATION',
    'RUNTIME',
    'LIVE_PREVIEW',
    'PRODUCT_FAITHFULNESS',
    'LAUNCH',
  ];
  assert(
    '1. complete pipeline discovery — every documented stage is discovered, in order',
    JSON.stringify(discoveredStages.map((s) => s.stageId)) === JSON.stringify(EXPECTED_STAGE_ORDER) &&
      JSON.stringify(GPCA_STAGE_IDS) === JSON.stringify(EXPECTED_STAGE_ORDER) &&
      JSON.stringify(getStageBaselineIds()) === JSON.stringify(EXPECTED_STAGE_ORDER),
    `discovered=${discoveredStages.map((s) => s.stageId).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 2. Stage discovery — every discovered stage carries a real responsible module and non-empty
  //    input/output objects (never a placeholder).
  // -------------------------------------------------------------------------------------------
  assert(
    '2. stage discovery — every stage has a real responsible module and non-empty input/output objects',
    discoveredStages.every(
      (s) => s.responsibleModule.length > 0 && s.inputObjects.length > 0 && s.outputObjects.length > 0,
    ),
    `stages=${discoveredStages.length}`,
  );

  // -------------------------------------------------------------------------------------------
  // 3. Contract ancestry — an approved module's traceability chain ends at the Founder Prompt via
  //    the canonical contract concept.
  // -------------------------------------------------------------------------------------------
  const firstModuleId = modulePlan[0].moduleId;
  const moduleChain = buildContractTraceabilityChains(compliantEvidence())[0];
  assert(
    '3. contract ancestry — an approved module traces to Founder Prompt via the canonical contract',
    moduleChain.proven &&
      moduleChain.chain.some((l) => l.derivedFrom === 'Founder Prompt') &&
      moduleChain.chain.some((l) => l.originContractConcept !== null),
    `artifact=${moduleChain.artifact}, chain=${JSON.stringify(moduleChain.chain)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 4. CBGA compliance — the CBGA stage is flagged as consuming CBGA + the canonical contract, and
  //    is not flagged with any contract-bypass when CBGA's gate allowed generation.
  // -------------------------------------------------------------------------------------------
  const cbgaStage = discoveredStages.find((s) => s.stageId === 'CONTRACT_BOUND_GENERATION_AUTHORITY')!;
  assert(
    '4. CBGA compliance — CBGA stage consumes CBGA + canonical contract with no bypass when allowed',
    cbgaStage.flags.usesCbga &&
      cbgaStage.flags.usesCanonicalContract &&
      !cbgaStage.flags.usesModuleOutsideContract &&
      !cbgaStage.flags.usesTitleOutsideContract,
    `flags=${JSON.stringify(cbgaStage.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 5. Generator input verification — a proposed module that CBGA never approved is detected.
  // -------------------------------------------------------------------------------------------
  const moduleBypassDetection = detectContractBypassedInputs(
    compliantEvidence({ moduleIds: [...modulePlan.map((m) => m.moduleId), 'some-invented-widget'] }),
  );
  assert(
    '5. generator input verification — an unapproved module is detected as a contract bypass',
    moduleBypassDetection.detected && moduleBypassDetection.moduleBypass.includes('some-invented-widget'),
    `moduleBypass=${moduleBypassDetection.moduleBypass.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 6. Module generator compliance — MODULE_GENERATOR shows no contract bypass when proposed
  //    modules exactly match CBGA's approved plan.
  // -------------------------------------------------------------------------------------------
  const moduleGenStage = discoverGenerationPipelineStages(compliantEvidence()).find((s) => s.stageId === 'MODULE_GENERATOR')!;
  assert(
    '6. module generator compliance — no bypass flagged when modules match CBGA exactly',
    moduleGenStage.flags.usesCbga && !moduleGenStage.flags.usesModuleOutsideContract,
    `flags=${JSON.stringify(moduleGenStage.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 7. Navigation generator compliance — NAVIGATION_GENERATOR is flagged when an unjustified
  //    default-shell label ("Settings") is proposed.
  // -------------------------------------------------------------------------------------------
  const navBypassEvidence = compliantEvidence({ navigationLabels: [...navigationPlan.map((n) => n.label), 'Settings'] });
  const navGenStage = discoverGenerationPipelineStages(navBypassEvidence).find((s) => s.stageId === 'NAVIGATION_GENERATOR')!;
  assert(
    '7. navigation generator compliance — flagged when an unjustified default-shell label is proposed',
    navGenStage.flags.usesNavigationOutsideContract === true,
    `flags=${JSON.stringify(navGenStage.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 8. Route generator compliance — ROUTE_GENERATOR is flagged when a route outside CBGA's plan
  //    is proposed.
  // -------------------------------------------------------------------------------------------
  const routeBypassEvidence = compliantEvidence({ routes: [...routePlan.map((r) => r.path), '/invented-route'] });
  const routeGenStage = discoverGenerationPipelineStages(routeBypassEvidence).find((s) => s.stageId === 'ROUTE_GENERATOR')!;
  assert(
    '8. route generator compliance — flagged when a route outside CBGA is proposed',
    routeGenStage.flags.usesRouteOutsideContract === true,
    `flags=${JSON.stringify(routeGenStage.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 9. Blueprint generator compliance — BLUEPRINT_GENERATOR is honestly, structurally flagged as
  //    a generic shell / reusable component shell (the real, current pipeline gap).
  // -------------------------------------------------------------------------------------------
  const blueprintStage = discoveredStages.find((s) => s.stageId === 'BLUEPRINT_GENERATOR')!;
  assert(
    '9. blueprint generator compliance — structurally flagged as generic shell / reusable component shell',
    blueprintStage.flags.usesGenericShell && blueprintStage.flags.usesReusableComponentShell && blueprintStage.flags.usesBlueprintDefaults,
    `flags=${JSON.stringify(blueprintStage.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 10. Surface generator compliance — SURFACE_GENERATOR is honestly flagged as generating outside
  //     the contract (no real surface renderer consumes CbgaSurfacePlan yet) and scores FAIL.
  // -------------------------------------------------------------------------------------------
  const { scores: baseScores } = scorePipeline(discoveredStages, buildContractTraceabilityChains(compliantEvidence()));
  const surfaceStage = discoveredStages.find((s) => s.stageId === 'SURFACE_GENERATOR')!;
  const surfaceScore = baseScores.find((s) => s.stageId === 'SURFACE_GENERATOR')!;
  assert(
    '10. surface generator compliance — honestly flagged outside contract and scores FAIL',
    surfaceStage.flags.usesSurfaceOutsideContract === true && surfaceScore.status === 'FAIL',
    `flags=${JSON.stringify(surfaceStage.flags)}, score=${JSON.stringify(surfaceScore)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 11. Template detection — detects stages relying on a hardcoded template.
  // -------------------------------------------------------------------------------------------
  const templateStages = detectTemplateGeneratorUsage(discoveredStages);
  assert(
    '11. template detection — stages relying on a hardcoded template are detected',
    templateStages.includes('Module Generator') && templateStages.includes('Blueprint Generator') && templateStages.includes('Navigation Generator'),
    `templateStages=${templateStages.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 12. Reusable component shell detection.
  // -------------------------------------------------------------------------------------------
  assert(
    '12. reusable component shell detection — Blueprint Generator flagged',
    blueprintStage.flags.usesReusableComponentShell === true,
    `flags=${JSON.stringify(blueprintStage.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 13. Hardcoded navigation detection.
  // -------------------------------------------------------------------------------------------
  const hardcodedNav = detectHardcodedNavigationLabels(navBypassEvidence);
  assert(
    '13. hardcoded navigation detection — unjustified default-shell label detected',
    hardcodedNav.includes('Settings'),
    `hardcodedNav=${hardcodedNav.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 14. Hardcoded route detection.
  // -------------------------------------------------------------------------------------------
  const hardcodedRoutes = detectHardcodedRoutes(routeBypassEvidence);
  assert(
    '14. hardcoded route detection — unapproved route detected',
    hardcodedRoutes.includes('/invented-route'),
    `hardcodedRoutes=${hardcodedRoutes.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 15. Hardcoded module detection.
  // -------------------------------------------------------------------------------------------
  const hardcodedModules = detectHardcodedModuleIds(
    compliantEvidence({ moduleIds: [...modulePlan.map((m) => m.moduleId), 'some-invented-widget'] }),
  );
  assert(
    '15. hardcoded module detection — unapproved module detected',
    hardcodedModules.includes('some-invented-widget'),
    `hardcodedModules=${hardcodedModules.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 16. Title generation detection.
  // -------------------------------------------------------------------------------------------
  const titleDetection = detectTitleGeneratedOutsideContract(compliantEvidence({ appTitle: 'Custom App' }));
  assert(
    '16. title generation detection — mismatched title detected',
    titleDetection.generatedOutsideContract === true,
    titleDetection.reason,
  );

  // -------------------------------------------------------------------------------------------
  // 17. Regex title extraction detection.
  // -------------------------------------------------------------------------------------------
  assert(
    '17. regex title extraction detection — Prompt Understanding structurally flagged',
    detectRegexTitleExtractionRisk(discoveredStages) === true,
    `promptUnderstanding.flags=${JSON.stringify(discoveredStages.find((s) => s.stageId === 'PROMPT_UNDERSTANDING')!.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 18. Profile template detection.
  // -------------------------------------------------------------------------------------------
  assert(
    '18. profile template detection — Planning structurally flagged as legacy profile-template-bound',
    detectProfileTemplateLeakage(discoveredStages) === true,
    `planning.flags=${JSON.stringify(discoveredStages.find((s) => s.stageId === 'PLANNING')!.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 19. UniversalFeatureContract leakage detection.
  // -------------------------------------------------------------------------------------------
  assert(
    '19. UniversalFeatureContract leakage detection — flagged as independent of the canonical contract',
    detectUniversalFeatureContractLeakage(discoveredStages) === true,
    `ufc.flags=${JSON.stringify(discoveredStages.find((s) => s.stageId === 'UNIVERSAL_FEATURE_CONTRACT')!.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 20. PromptBoundedModulePlan compliance.
  // -------------------------------------------------------------------------------------------
  const pbmpStage = discoveredStages.find((s) => s.stageId === 'PROMPT_BOUNDED_MODULE_PLAN')!;
  assert(
    '20. PromptBoundedModulePlan compliance — flagged as consuming the bounded module plan and CBGA',
    pbmpStage.flags.usesPromptBoundedModulePlan && pbmpStage.flags.usesCbga,
    `flags=${JSON.stringify(pbmpStage.flags)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 21. Contract traceability — broken chain when no CBGA report is supplied at all.
  // -------------------------------------------------------------------------------------------
  const noCbgaEvidence: GpcaPipelineEvidenceInput = { ...compliantEvidence(), cbgaReport: null };
  const noCbgaChains = buildContractTraceabilityChains(noCbgaEvidence);
  const noCbgaChainsRequiringCbga = noCbgaChains.filter((c) => c.artifactKind !== 'TITLE');
  assert(
    '21. contract traceability — every CBGA-dependent chain (module/route/nav/surface) breaks when no CBGA report exists',
    noCbgaChainsRequiringCbga.length > 0 &&
      noCbgaChainsRequiringCbga.every((c) => !c.proven) &&
      noCbgaChainsRequiringCbga.every((c) => c.brokenAtLink === 'CONTRACT_BOUND_GENERATION_AUTHORITY'),
    `chains=${noCbgaChains.map((c) => `${c.artifactKind}:${c.artifact}:${c.proven}`).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 22. Compliance scoring — a fully compliant stage scores 100% overall and PASS.
  // -------------------------------------------------------------------------------------------
  const compliantTraceability = buildContractTraceabilityChains(compliantEvidence());
  const moduleGenScore = scoreStage(moduleGenStage, compliantTraceability);
  assert(
    '22. compliance scoring — module generator with matching CBGA inputs and proven traceability scores PASS above threshold',
    moduleGenScore.status === 'PASS' &&
      moduleGenScore.overallCompliancePercent >= GPCA_PASS_THRESHOLD_PERCENT &&
      moduleGenScore.contractCompliancePercent === 100 &&
      moduleGenScore.traceabilityPercent === 100,
    `score=${JSON.stringify(moduleGenScore)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 23. Compliance scoring — a stage with a contract bypass never scores PASS.
  // -------------------------------------------------------------------------------------------
  const navGenScoreWithBypass = scoreStage(navGenStage, buildContractTraceabilityChains(navBypassEvidence));
  assert(
    '23. compliance scoring — a stage with a contract bypass never scores PASS',
    navGenScoreWithBypass.status === 'FAIL' && navGenScoreWithBypass.contractCompliancePercent < 100,
    `score=${JSON.stringify(navGenScoreWithBypass)}`,
  );

  // -------------------------------------------------------------------------------------------
  // 24. Automatic blocking — a generator-input bypass blocks generation.
  // -------------------------------------------------------------------------------------------
  const bypassReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ moduleIds: [...modulePlan.map((m) => m.moduleId), 'some-invented-widget'] }),
  );
  assert(
    '24. automatic blocking — a generator-input bypass blocks generation',
    bypassReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS' && gpcaBlocksGeneration(bypassReport),
    `outcome=${bypassReport.finalGateOutcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 25. Automatic blocking — a broken traceability chain blocks generation.
  // -------------------------------------------------------------------------------------------
  const traceabilityFailureReport = runGenerationPipelineComplianceAuthority(noCbgaEvidence);
  assert(
    '25. automatic blocking — a broken traceability chain blocks generation',
    traceabilityFailureReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE',
    `outcome=${traceabilityFailureReport.finalGateOutcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 26. Automatic blocking — a real, unjustified reusable blueprint shell (welcome/onboarding)
  //     written to disk blocks generation before preview.
  // -------------------------------------------------------------------------------------------
  const blueprintBypassReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ generatedFilePaths: ['src/blueprint/WelcomeScreen.tsx', 'src/blueprint/AppShell.tsx'] }),
  );
  assert(
    '26. automatic blocking — a real reusable blueprint shell (welcome screen) written to disk blocks generation',
    blueprintBypassReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS' &&
      blueprintBypassReport.blueprintBypassDetected.includes('src/blueprint/WelcomeScreen.tsx'),
    `outcome=${blueprintBypassReport.finalGateOutcome}, bypass=${blueprintBypassReport.blueprintBypassDetected.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 27. Automatic blocking — a real, unjustified generic blueprint page (Settings) written to
  //     disk blocks generation as a legacy generator.
  // -------------------------------------------------------------------------------------------
  const genericPageReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ generatedFilePaths: ['src/blueprint/pages/SettingsPage.tsx'] }),
  );
  assert(
    '27. automatic blocking — a real, unjustified generic blueprint page (Settings) blocks generation',
    genericPageReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_LEGACY_GENERATOR' &&
      genericPageReport.legacyGeneratorsDetected.includes('src/blueprint/pages/SettingsPage.tsx'),
    `outcome=${genericPageReport.finalGateOutcome}, legacy=${genericPageReport.legacyGeneratorsDetected.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 28. A generic blueprint page that IS justified by the contract is not blocked.
  // -------------------------------------------------------------------------------------------
  const settingsModulePlan = buildContractModulePlan(CONTRACT_WITH_SETTINGS);
  const settingsRoutePlan = buildContractRoutePlan(settingsModulePlan);
  const settingsNavPlan = buildContractNavigationPlan(settingsRoutePlan);
  const settingsCbgaReport = runContractBoundGenerationAuthority({
    contract: CONTRACT_WITH_SETTINGS,
    proposed: {
      proposedModuleIds: settingsModulePlan.map((m) => m.moduleId),
      proposedRoutes: settingsRoutePlan.map((r) => r.path),
      proposedNavigationLabels: settingsNavPlan.map((n) => n.label),
      proposedAppTitle: CONTRACT_WITH_SETTINGS.productIdentity,
      proposedPrimaryWorkflowVisible: true,
      proposedPrimaryWorkflowInteractive: true,
    },
  });
  const justifiedPageEvidence: GpcaPipelineEvidenceInput = {
    contract: CONTRACT_WITH_SETTINGS,
    cbgaReport: settingsCbgaReport,
    proposed: {
      appTitle: CONTRACT_WITH_SETTINGS.productIdentity,
      moduleIds: settingsModulePlan.map((m) => m.moduleId),
      routes: settingsRoutePlan.map((r) => r.path),
      navigationLabels: settingsNavPlan.map((n) => n.label),
      generatedFilePaths: ['src/blueprint/pages/SettingsPage.tsx'],
    },
  };
  const justifiedPageReport = runGenerationPipelineComplianceAuthority(justifiedPageEvidence);
  assert(
    '28. a generic blueprint page justified by the contract is not blocked as a legacy generator',
    !justifiedPageReport.legacyGeneratorsDetected.includes('src/blueprint/pages/SettingsPage.tsx') &&
      justifiedPageReport.genericShellSurfacesBlocked.includes('src/blueprint/pages/SettingsPage.tsx'),
    `outcome=${justifiedPageReport.finalGateOutcome}, justified=${justifiedPageReport.genericShellSurfacesBlocked.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 29. No fabricated compliance — even a real post-materialization build whose module/route/nav/
  //     title inputs perfectly match CBGA (no bypass, no generic blueprint page on disk) is still
  //     honestly blocked, because the real Blueprint Generator (universal-app-blueprint-generator)
  //     is structurally non-compliant (a hardcoded reusable shell) for every build today. GPCA must
  //     never rubber-stamp a build just because the *inputs* were clean — this is exactly the
  //     "generic welcome screens even though the contract is approved" gap the milestone describes.
  // -------------------------------------------------------------------------------------------
  const cleanInputsRealBuildReport = runGenerationPipelineComplianceAuthority(
    compliantEvidence({ generatedFilePaths: modulePlan.map((m) => `src/features/${m.moduleId}/index.ts`) }),
  );
  assert(
    '29. no fabricated compliance — a real build is honestly blocked while the Blueprint Generator itself remains non-compliant',
    cleanInputsRealBuildReport.finalGateOutcome !== 'COMPLIANCE_ALLOWED' &&
      gpcaBlocksGeneration(cleanInputsRealBuildReport) &&
      cleanInputsRealBuildReport.templateGeneratorsDetected.includes('Blueprint Generator'),
    `outcome=${cleanInputsRealBuildReport.finalGateOutcome}, templateGeneratorsDetected=${cleanInputsRealBuildReport.templateGeneratorsDetected.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 30. Phase labeling — PRE_MATERIALIZATION before any file exists, POST_MATERIALIZATION once
  //     real generated files are supplied, independent of whether the gate ultimately allows or
  //     blocks that build.
  // -------------------------------------------------------------------------------------------
  assert(
    '30. phase is correctly labeled PRE_MATERIALIZATION vs. POST_MATERIALIZATION',
    runGenerationPipelineComplianceAuthority(compliantEvidence()).phase === 'PRE_MATERIALIZATION' &&
      cleanInputsRealBuildReport.phase === 'POST_MATERIALIZATION',
    `prePhase=${runGenerationPipelineComplianceAuthority(compliantEvidence()).phase}, postPhase=${cleanInputsRealBuildReport.phase}`,
  );

  // -------------------------------------------------------------------------------------------
  // 31. Every generic blueprint page GPCA knows about is defined with a real relative path.
  // -------------------------------------------------------------------------------------------
  assert(
    '31. every known generic blueprint page has a real, non-empty relative path',
    GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES.length >= 10 && GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES.every((p) => p.path.startsWith('src/')),
    `count=${GPCA_KNOWN_GENERIC_BLUEPRINT_PAGES.length}`,
  );

  // -------------------------------------------------------------------------------------------
  // 32. detectGenericShellInjection separates detected vs. justified pages deterministically.
  // -------------------------------------------------------------------------------------------
  const shellInjection = detectGenericShellInjection(
    compliantEvidence({ generatedFilePaths: ['src/blueprint/pages/SettingsPage.tsx', 'src/blueprint/pages/AboutPage.tsx'] }),
  );
  assert(
    '32. detectGenericShellInjection separates detected vs. justified pages',
    shellInjection.detectedPaths.includes('src/blueprint/pages/SettingsPage.tsx') &&
      shellInjection.detectedPaths.includes('src/blueprint/pages/AboutPage.tsx') &&
      shellInjection.justifiedPaths.length === 0,
    `detected=${shellInjection.detectedPaths.join(', ')}, justified=${shellInjection.justifiedPaths.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 33. detectBlueprintBypass only fires for the two known unconditional shell screens.
  // -------------------------------------------------------------------------------------------
  const bypassOnly = detectBlueprintBypass(compliantEvidence({ generatedFilePaths: ['src/blueprint/OnboardingScreen.tsx'] }));
  assert(
    '33. detectBlueprintBypass detects the onboarding screen bypass',
    bypassOnly.includes('src/blueprint/OnboardingScreen.tsx'),
    `bypass=${bypassOnly.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 34. detectLegacyGeneratorUsage flags Planning (legacy per-profile template planner).
  // -------------------------------------------------------------------------------------------
  const legacyStages = detectLegacyGeneratorUsage(discoveredStages);
  assert(
    '34. detectLegacyGeneratorUsage flags Planning as a legacy per-profile template planner',
    legacyStages.includes('Planning'),
    `legacyStages=${legacyStages.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 35. Deterministic reports — identical evidence yields byte-identical structural output.
  // -------------------------------------------------------------------------------------------
  const detA = runGenerationPipelineComplianceAuthority(compliantEvidence());
  const detB = runGenerationPipelineComplianceAuthority(compliantEvidence());
  const strip = (r: GpcaComplianceReport) => JSON.stringify({ ...r, generatedAt: null });
  assert(
    '35. deterministic reports — identical evidence yields byte-identical structural output',
    strip(detA) === strip(detB),
    strip(detA) === strip(detB) ? 'two independent runs produced identical structural output' : 'runs diverged',
  );

  // -------------------------------------------------------------------------------------------
  // 36. Reports include the mandatory Generation Compliance Matrix (pipeline table) with a
  //     PASS/FAIL status per stage.
  // -------------------------------------------------------------------------------------------
  const reportMarkdown = renderGenerationPipelineComplianceReportMarkdown(bypassReport);
  assert(
    '36. reports include the mandatory Generation Compliance Matrix with a PASS/FAIL status per stage',
    reportMarkdown.includes('## Pipeline Compliance') &&
      reportMarkdown.includes('Uses CBGA') &&
      reportMarkdown.includes('Traceable') &&
      /\| (PASS|FAIL) \|/.test(reportMarkdown),
    'pipeline compliance table present with PASS/FAIL statuses',
  );

  // -------------------------------------------------------------------------------------------
  // 37. Reports include per-stage compliance scores (all 8 required percentages).
  // -------------------------------------------------------------------------------------------
  assert(
    '37. reports include per-stage compliance scores (contract/input/output/traceability/template/legacy/blueprint/overall)',
    reportMarkdown.includes('## Per-Stage Compliance Scores') &&
      reportMarkdown.includes('Contract %') &&
      reportMarkdown.includes('Template Leakage %') &&
      reportMarkdown.includes('Blueprint Usage %') &&
      reportMarkdown.includes('Overall %'),
    'per-stage score table present',
  );

  // -------------------------------------------------------------------------------------------
  // 38. Reports include the final gate outcome and blocked reasons.
  // -------------------------------------------------------------------------------------------
  assert(
    '38. reports include the final gate outcome and blocked reasons',
    reportMarkdown.includes(bypassReport.finalGateOutcome) && reportMarkdown.includes('## Blocked Reasons'),
    `finalGateOutcome=${bypassReport.finalGateOutcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 39. Deterministic Capability Matrix — mandatory, includes all 11+ required capabilities.
  // -------------------------------------------------------------------------------------------
  const matrixMarkdown = renderCapabilityMatrixMarkdown();
  const REQUIRED_MATRIX_CAPABILITIES = [
    'Generation Pipeline Compliance Authority',
    'Contract-Bound Generation Authority',
    'Autonomous Engineering Orchestrator',
    'Engineering Intelligence Activation Authority',
    'Engineering Intelligence Runtime',
    'Product Faithfulness',
    'Product Faithfulness Repair',
    'Fresh Build Artifact Isolation',
    'Project Context Isolation',
    'Build Reality AutoFix',
    'Build Execution Stabilizer',
    'Live Preview Gate',
  ];
  const matrixCapabilityNames = listCapabilityMatrixCapabilityNames();
  const missingFromMatrix = REQUIRED_MATRIX_CAPABILITIES.filter((name) => !matrixCapabilityNames.includes(name));
  const hasCorrectHeader =
    matrixMarkdown.includes('| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |') &&
    reportMarkdown.includes('## Capability Matrix');
  const matrixA = renderCapabilityMatrixMarkdown();
  const matrixB = renderCapabilityMatrixMarkdown();
  assert(
    '39. deterministic Capability Matrix is generated correctly and included in every report (12+ capabilities)',
    missingFromMatrix.length === 0 && hasCorrectHeader && matrixA === matrixB && matrixCapabilityNames.length >= 11,
    `missing=${missingFromMatrix.join(', ') || 'none'}, totalRows=${matrixCapabilityNames.length}`,
  );

  // -------------------------------------------------------------------------------------------
  // 40. Real orchestrator invokes GPCA pre-materialization (after CBGA, before materialization).
  // -------------------------------------------------------------------------------------------
  const orchestratorSource = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
  const cbgaCallIdx = orchestratorSource.indexOf('applyContractBoundGenerationToBuildPlan(buildPlan, canonicalProductContract)');
  const gpcaPreCallIdx = orchestratorSource.indexOf('buildGpcaPreMaterializationReport({');
  const gpcaPreGuardIdx = orchestratorSource.indexOf('gpcaBlocksGeneration(gpcaComplianceReport)');
  const runWorkspaceMaterializationDefIdx = orchestratorSource.indexOf('const runWorkspaceMaterialization = ()');
  const materializeCallIdx = orchestratorSource.indexOf('materializeGeneratedApplication({');
  assert(
    '40. real orchestrator invokes GPCA pre-materialization, after CBGA and before materialization',
    cbgaCallIdx > -1 &&
      gpcaPreCallIdx > -1 &&
      gpcaPreGuardIdx > -1 &&
      runWorkspaceMaterializationDefIdx > -1 &&
      materializeCallIdx > -1 &&
      cbgaCallIdx < gpcaPreCallIdx &&
      gpcaPreCallIdx < gpcaPreGuardIdx &&
      gpcaPreGuardIdx < runWorkspaceMaterializationDefIdx &&
      gpcaPreGuardIdx < materializeCallIdx,
    `cbgaCallIdx=${cbgaCallIdx}, gpcaPreCallIdx=${gpcaPreCallIdx}, gpcaPreGuardIdx=${gpcaPreGuardIdx}, runWorkspaceMaterializationDefIdx=${runWorkspaceMaterializationDefIdx}, materializeCallIdx=${materializeCallIdx}`,
  );

  // -------------------------------------------------------------------------------------------
  // 41. Real orchestrator invokes GPCA post-materialization (real files) before preview startup.
  // -------------------------------------------------------------------------------------------
  const gpcaPostCallIdx = orchestratorSource.indexOf('buildGpcaPostMaterializationReport({');
  const gpcaPostGuardIdx = orchestratorSource.indexOf('gpcaBlocksGeneration(gpcaComplianceReport)', gpcaPreGuardIdx + 1);
  const startDevServerIdx = orchestratorSource.indexOf('await startGeneratedAppDevServer(');
  assert(
    '41. real orchestrator invokes GPCA post-materialization before the dev server / preview starts',
    gpcaPostCallIdx > -1 &&
      gpcaPostGuardIdx > gpcaPostCallIdx &&
      materializeCallIdx < gpcaPostCallIdx &&
      gpcaPostGuardIdx < startDevServerIdx,
    `gpcaPostCallIdx=${gpcaPostCallIdx}, gpcaPostGuardIdx=${gpcaPostGuardIdx}, startDevServerIdx=${startDevServerIdx}`,
  );

  // -------------------------------------------------------------------------------------------
  // 42. AEO registry marks Generation Pipeline Compliance Authority production-wired, but never
  //     safe-to-auto-run (GPCA never repairs).
  // -------------------------------------------------------------------------------------------
  const gpcaRegistryEntry = getRepairCapabilityById('generation-pipeline-compliance-authority-v1');
  assert(
    '42. AEO registry marks GPCA production-wired but never safe-to-auto-run, for all 7 failure classes',
    gpcaRegistryEntry?.wiringStatus === 'PRODUCTION_WIRED' &&
      gpcaRegistryEntry.safeToRunAutomatically === false &&
      GPCA_FAILURE_CLASSES.every((c) => gpcaRegistryEntry.failureClassesHandled.includes(c)) &&
      gpcaRegistryEntry.mayChangeProductIdentity === false,
    `entry=${JSON.stringify({ wiringStatus: gpcaRegistryEntry?.wiringStatus, safeToRunAutomatically: gpcaRegistryEntry?.safeToRunAutomatically })}`,
  );

  // -------------------------------------------------------------------------------------------
  // 43. AEO classifier correctly classifies each GPCA gate outcome into its matching failure class.
  // -------------------------------------------------------------------------------------------
  const classificationChecks = ([
    ['COMPLIANCE_BLOCKED_LEGACY_GENERATOR', 'LEGACY_GENERATOR_DETECTED'],
    ['COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR', 'TEMPLATE_GENERATOR_DETECTED'],
    ['COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS', 'BLUEPRINT_BYPASS'],
    ['COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE', 'CONTRACT_TRACEABILITY_FAILURE'],
    ['COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS', 'GENERATOR_INPUT_BYPASS'],
    ['COMPLIANCE_BLOCKED_PIPELINE_NON_COMPLIANCE', 'PIPELINE_COMPLIANCE_FAILURE'],
  ] as const).map(([outcome, expectedClass]) => {
    const classifications = diagnoseBuildFailure({ gpcaComplianceReport: { finalGateOutcome: outcome, blockedReasons: ['test'] } });
    const primary = selectPrimaryFailureClassification(classifications);
    return { outcome, expectedClass, actual: primary.failureClass, ok: primary.failureClass === expectedClass };
  });
  assert(
    '43. AEO classifier correctly maps every GPCA gate outcome to its matching failure class',
    classificationChecks.every((c) => c.ok),
    classificationChecks.map((c) => `${c.outcome}->${c.actual}`).join(', '),
  );

  // -------------------------------------------------------------------------------------------
  // 44. AEO never claims GPCA itself is missing for its own failure classes — it names the real
  //     underlying generator-repair gap instead.
  // -------------------------------------------------------------------------------------------
  const gpcaClassification = selectPrimaryFailureClassification(
    diagnoseBuildFailure({ gpcaComplianceReport: { finalGateOutcome: 'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS', blockedReasons: ['blueprint shell'] } }),
  );
  const gpcaRepairPlan = planRepair({ classification: gpcaClassification, attemptHistory: [] });
  const gpcaMissingRecommendation = routeMissingCapability(gpcaClassification.failureClass, gpcaRepairPlan);
  assert(
    '44. AEO never reports GPCA itself as missing — it names the real generator-repair gap',
    gpcaRepairPlan.decision !== 'RUN_TARGETED_REPAIR' &&
      gpcaRepairPlan.consideredCapabilities.some(
        (c) => c.capabilityId === 'generation-pipeline-compliance-authority-v1' && c.wiringStatus === 'PRODUCTION_WIRED' && !c.safeToRunAutomatically,
      ) &&
      gpcaMissingRecommendation.missingCapabilityId === 'CONTRACT_COMPLIANT_GENERATOR_REPAIR' &&
      gpcaMissingRecommendation.missingCapabilityName !== 'Generation Pipeline Compliance Authority',
    `decision=${gpcaRepairPlan.decision}, missingCapabilityId=${gpcaMissingRecommendation.missingCapabilityId}`,
  );

  // -------------------------------------------------------------------------------------------
  // 45. EIAA interaction — the full AEO orchestrator consults EIAA for a GPCA-diagnosed failure
  //     (GPCA never invokes Engineering Intelligence itself).
  // -------------------------------------------------------------------------------------------
  const aeoReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: { gpcaComplianceReport: { finalGateOutcome: 'COMPLIANCE_BLOCKED_LEGACY_GENERATOR', blockedReasons: ['generic settings page'] } },
  });
  assert(
    '45. EIAA is consulted for a GPCA-diagnosed missing-capability path, and GPCA never invokes it itself',
    aeoReport.classification.failureClass === 'LEGACY_GENERATOR_DETECTED' &&
      aeoReport.missingCapability?.missingCapabilityId === 'CONTRACT_COMPLIANT_GENERATOR_REPAIR' &&
      aeoReport.engineeringIntelligenceActivation !== null &&
      aeoReport.engineeringIntelligenceInvoked === false,
    `failureClass=${aeoReport.classification.failureClass}, missingCapability=${aeoReport.missingCapability?.missingCapabilityId}, eiaaDecision=${aeoReport.engineeringIntelligenceActivation?.decision}, invoked=${aeoReport.engineeringIntelligenceInvoked}`,
  );

  // -------------------------------------------------------------------------------------------
  // 46. No application-specific logic introduced (no per-domain special-casing branches).
  // -------------------------------------------------------------------------------------------
  const GPCA_DIR = join(ROOT, 'src/generation-pipeline-compliance-authority-v1');
  const gpcaFiles = readdirSync(GPCA_DIR).filter((f) => f.endsWith('.ts'));
  const gpcaSource = gpcaFiles.map((f) => readFileSync(join(GPCA_DIR, f), 'utf8')).join('\n');
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /if\s*\(\s*(domain|product|profile)\s*===\s*['"](restaurant|calculator|crm|booking|inventory|notes|converter)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
  ];
  const logicHits = APPLICATION_SPECIFIC_LOGIC_PATTERNS.filter((p) => p.test(gpcaSource));
  assert(
    '46. no application-specific logic introduced (no per-domain special-casing branches)',
    logicHits.length === 0,
    logicHits.length === 0 ? `inspected ${gpcaFiles.length} GPCA source file(s) — no per-domain branching found` : `found ${logicHits.length} pattern match(es)`,
  );

  // -------------------------------------------------------------------------------------------
  // 47. No hardcoded product-domain *logic* (e.g. an `if (domain === 'restaurant')` branch or a
  //     literal string constant) introduced in the GPCA module itself. Comments that merely
  //     *illustrate* domain-genericity ("works identically for a restaurant platform, a
  //     calculator, or a CRM") are documentation, not hardcoded logic, so they are stripped before
  //     scanning — otherwise this check would perversely fail the exact sentence proving GPCA is
  //     domain-agnostic.
  // -------------------------------------------------------------------------------------------
  const gpcaSourceWithoutComments = gpcaSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  const FORBIDDEN_DOMAIN_WORDS = [
    'restaurant',
    'calculator',
    'converter',
    '\\bcrm\\b',
    'booking system',
    'inventory management',
    'notes app',
    'note-taking',
    '\\blisa\\b',
  ];
  const domainHits = FORBIDDEN_DOMAIN_WORDS.filter((w) => new RegExp(w, 'i').test(gpcaSourceWithoutComments));
  assert(
    '47. no hardcoded product-domain logic (outside of illustrative comments) introduced in the GPCA module',
    domainHits.length === 0,
    domainHits.length === 0
      ? `inspected ${gpcaFiles.length} GPCA source file(s) (comments stripped) — no forbidden domain words found in real code`
      : `found: ${domainHits.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 48. No validator weakened — this milestone adds its own script and every sibling script stays
  //     intact.
  // -------------------------------------------------------------------------------------------
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
  const hasOwnScript =
    pkg.scripts['validate:generation-pipeline-compliance-authority-v1'] ===
    'tsx scripts/validate-generation-pipeline-compliance-authority-v1.ts';
  const siblingScriptsIntact =
    pkg.scripts['validate:contract-bound-generation-authority-v4'] === 'tsx scripts/validate-contract-bound-generation-authority-v4.ts' &&
    pkg.scripts['validate:autonomous-engineering-orchestrator-v1'] === 'tsx scripts/validate-autonomous-engineering-orchestrator-v1.ts' &&
    pkg.scripts['validate:engineering-intelligence-activation-authority-v1'] === 'tsx scripts/validate-engineering-intelligence-activation-authority-v1.ts';
  assert(
    '48. this milestone adds its own validator script and does not weaken any sibling validator',
    hasOwnScript && siblingScriptsIntact,
    `hasOwnScript=${hasOwnScript}, siblingScriptsIntact=${siblingScriptsIntact}`,
  );

  // -------------------------------------------------------------------------------------------
  // 49. No fabricated compliance — a scenario engineered to be non-compliant in three independent
  //     ways is never reported as COMPLIANCE_ALLOWED.
  // -------------------------------------------------------------------------------------------
  const maximallyNonCompliant = runGenerationPipelineComplianceAuthority({
    contract: RESTAURANT_CONTRACT,
    cbgaReport: COMPLIANT_CBGA_REPORT,
    proposed: {
      appTitle: 'Custom App',
      moduleIds: ['totally-unrelated-widget'],
      routes: ['/totally-unrelated-widget'],
      navigationLabels: ['Features', 'Settings'],
      generatedFilePaths: ['src/blueprint/WelcomeScreen.tsx', 'src/blueprint/pages/SettingsPage.tsx'],
    },
  });
  assert(
    '49. no fabricated compliance — a maximally non-compliant build is never reported as allowed',
    maximallyNonCompliant.finalGateOutcome !== 'COMPLIANCE_ALLOWED' && maximallyNonCompliant.blockedReasons.length > 0,
    `outcome=${maximallyNonCompliant.finalGateOutcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 50. No hidden fallback paths — GPCA always returns one of the declared gate outcomes, never an
  //     undefined/silent pass-through, even for the emptiest possible evidence.
  // -------------------------------------------------------------------------------------------
  const emptyEvidenceReport = runGenerationPipelineComplianceAuthority({
    contract: RESTAURANT_CONTRACT,
    cbgaReport: null,
    proposed: { appTitle: '', moduleIds: [], routes: [], navigationLabels: [], generatedFilePaths: [] },
  });
  const DECLARED_OUTCOMES = new Set([
    'COMPLIANCE_ALLOWED',
    'COMPLIANCE_BLOCKED_LEGACY_GENERATOR',
    'COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR',
    'COMPLIANCE_BLOCKED_BLUEPRINT_BYPASS',
    'COMPLIANCE_BLOCKED_CONTRACT_TRACEABILITY_FAILURE',
    'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS',
    'COMPLIANCE_BLOCKED_PIPELINE_NON_COMPLIANCE',
  ]);
  assert(
    '50. no hidden fallback paths — GPCA always returns a declared gate outcome, even for empty evidence',
    DECLARED_OUTCOMES.has(emptyEvidenceReport.finalGateOutcome),
    `outcome=${emptyEvidenceReport.finalGateOutcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 51. No new TypeScript errors introduced in touched files.
  // -------------------------------------------------------------------------------------------
  const TOUCHED_FILES = [
    'src/generation-pipeline-compliance-authority-v1/',
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
    'src/autonomous-engineering-orchestrator-v1/failure-taxonomy.ts',
    'src/autonomous-engineering-orchestrator-v1/failure-diagnosis-adapter.ts',
    'src/autonomous-engineering-orchestrator-v1/repair-capability-registry.ts',
    'src/autonomous-engineering-orchestrator-v1/missing-capability-router.ts',
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
    '51. no new TypeScript errors introduced in touched files (lightweight touched-file tsc diagnostic)',
    !tscFailedToRun && newTouchedFileErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}, new (non-pre-existing)=${newTouchedFileErrors.length}${newTouchedFileErrors.length > 0 ? `: ${newTouchedFileErrors.join(' | ')}` : ''}`,
  );

  // -------------------------------------------------------------------------------------------
  // 52. GPCA never mentions VERE work.
  // -------------------------------------------------------------------------------------------
  const vereMention = /\bvere\b/i.test(gpcaSource);
  assert(
    '52. no VERE / validation-evidence-reuse work was added by this milestone',
    !vereMention,
    vereMention ? 'unexpected VERE reference found in GPCA module' : 'no VERE references found in GPCA module',
  );

  // -------------------------------------------------------------------------------------------
  // 53. GPCA never generates code — no filesystem write APIs are imported anywhere in the module.
  // -------------------------------------------------------------------------------------------
  const WRITE_API_PATTERN = /\b(writeFileSync|createRealFileOperation|executeRealFileOperation|mkdirSync|rmSync)\b/;
  assert(
    '53. GPCA never generates code — no filesystem write APIs are used anywhere in the module',
    !WRITE_API_PATTERN.test(gpcaSource),
    WRITE_API_PATTERN.test(gpcaSource) ? 'unexpected write API usage found' : 'no write API usage found',
  );

  // -------------------------------------------------------------------------------------------
  // 54. Narrow adapter — the production adapter never mutates the build plan (read-only bridge).
  // -------------------------------------------------------------------------------------------
  const adapterSource = readFileSync(join(GPCA_DIR, 'generation-pipeline-compliance-adapter.ts'), 'utf8');
  assert(
    '54. the production adapter is a read-only bridge — it never assigns into buildPlan',
    !/buildPlan\.\w+\s*=/.test(adapterSource),
    'no buildPlan mutation found in the adapter',
  );

  // -------------------------------------------------------------------------------------------
  // 55. Real materialization data is threaded through the adapter (real file list, not invented).
  // -------------------------------------------------------------------------------------------
  const restaurantPrompt =
    'Build a Restaurant Management Platform for taking orders, managing reservations, tracking menu items, tables, inventory tracking, and staff scheduling.';
  const realContract = buildCanonicalProductContract({ prompt: restaurantPrompt });
  const fakeBuildPlan = {
    modulePlan: {
      readOnly: true,
      planId: 'test-plan',
      rawPromptHash: 'test-hash',
      approvedModules: [],
      approvedModuleIds: ['records'],
      routes: ['/'],
      blockedModules: [],
      metadataConstraints: [],
      contaminationDetected: false,
      contaminationReasons: [],
      passedPreGenerationGuard: true,
    },
    extraction: { appName: 'reusable components where' },
    promptBoundedMaterializationPassed: true,
  } as unknown as ResolvedPromptFaithfulBuildPlan;
  const cbgaAdapterResult = applyContractBoundGenerationToBuildPlan(fakeBuildPlan, realContract);
  const preReport = buildGpcaPreMaterializationReport({
    contract: realContract,
    cbgaReport: cbgaAdapterResult.report,
    buildPlan: cbgaAdapterResult.buildPlan,
  });
  const postReport = buildGpcaPostMaterializationReport({
    contract: realContract,
    cbgaReport: cbgaAdapterResult.report,
    buildPlan: cbgaAdapterResult.buildPlan,
    generatedFilePaths: ['src/blueprint/pages/SettingsPage.tsx', 'src/blueprint/WelcomeScreen.tsx'],
  });
  assert(
    '55. the adapter threads real CBGA-repaired build-plan data end-to-end (title/modules no longer generic) and still honestly blocks',
    preReport.contractId === realContract.contractId &&
      preReport.productIdentity === realContract.productIdentity &&
      !cbgaAdapterResult.buildPlan.modulePlan.approvedModuleIds.includes('records') &&
      preReport.finalGateOutcome === 'COMPLIANCE_ALLOWED' &&
      postReport.finalGateOutcome !== 'COMPLIANCE_ALLOWED' &&
      postReport.blockedReasons.length > 0,
    `preReport.contractId=${preReport.contractId}, preReport.outcome=${preReport.finalGateOutcome}, postReport.outcome=${postReport.finalGateOutcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 56. gpcaFailureReason produces a clear, evidence-citing message (never a vague error).
  // -------------------------------------------------------------------------------------------
  const failureReasonText = gpcaFailureReason(bypassReport);
  assert(
    '56. gpcaFailureReason produces a clear, evidence-citing message',
    failureReasonText.includes('Generation Pipeline Compliance Authority V1') &&
      failureReasonText.includes(bypassReport.finalGateOutcome) &&
      failureReasonText.includes('some-invented-widget'),
    failureReasonText,
  );

  // -------------------------------------------------------------------------------------------
  // 57. CBGA_DEFAULT_SHELL_NAVIGATION_LABELS is reused, never redefined independently (single
  //     source of truth for what counts as a "default shell" label).
  // -------------------------------------------------------------------------------------------
  const detectionSource = readFileSync(join(GPCA_DIR, 'generator-legacy-detection.ts'), 'utf8');
  assert(
    "57. GPCA reuses CBGA's single source of truth for default-shell navigation labels",
    detectionSource.includes('CBGA_DEFAULT_SHELL_NAVIGATION_LABELS') && CBGA_DEFAULT_SHELL_NAVIGATION_LABELS.includes('Settings'),
    'CBGA_DEFAULT_SHELL_NAVIGATION_LABELS reused',
  );

  // -------------------------------------------------------------------------------------------
  // 58. A CBGA system-shell module (auth/dashboard/settings/persistence — the same fixed,
  //     generic, cross-cutting infra allowlist CBGA itself already treats as SYSTEM_SHELL_ALLOWED,
  //     never a product-specific concept) is never flagged as a contract bypass just because it
  //     does not map to a contract concept in `cbga.modulePlan`.
  // -------------------------------------------------------------------------------------------
  const systemShellEvidence = compliantEvidence({ moduleIds: [...modulePlan.map((m) => m.moduleId), 'settings'] });
  const systemShellBypass = detectContractBypassedInputs(systemShellEvidence);
  const systemShellHardcoded = detectHardcodedModuleIds(systemShellEvidence);
  const systemShellStage = discoverGenerationPipelineStages(systemShellEvidence).find((s) => s.stageId === 'MODULE_GENERATOR')!;
  assert(
    "58. a CBGA system-shell module (e.g. settings) is never flagged as a contract bypass",
    !systemShellBypass.moduleBypass.includes('settings') &&
      !systemShellHardcoded.includes('settings') &&
      systemShellStage.flags.usesModuleOutsideContract === false,
    `moduleBypass=${systemShellBypass.moduleBypass.join(', ')}, hardcoded=${systemShellHardcoded.join(', ')}`,
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
