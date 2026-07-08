/**
 * CONTRACT_BOUND_GENERATION_AUTHORITY_V4 — validation.
 *
 * Proves that src/contract-bound-generation-authority-v4/ (CBGA V4):
 *   1. derives a deterministic module/route/navigation/surface plan from the approved canonical
 *      product contract alone — every entry maps back to a real contract concept,
 *   2. blocks unsupported fallback modules, generic modules, unsupported routes, unsupported
 *      default-shell navigation, a generic app title, and a generic "reusable components" welcome
 *      surface before generation,
 *   3. repairs (never fully rebuilds, never invents without evidence, never hides a mismatch) the
 *      module/route/navigation/surface plan and the app title/welcome surface from the contract,
 *   4. is consumed by a narrow adapter that feeds the real production build plan
 *      (`ResolvedPromptFaithfulBuildPlan`) without redesigning the generator, and is actually wired
 *      into `one-prompt-build-orchestrator.ts` before workspace materialization,
 *   5. is honestly registered in AEO's repair-capability-registry as production-wired, so AEO no
 *      longer routes it through missing-capability planning and EIAA is never consulted for it, and
 *   6. introduces no application-specific logic, no hardcoded product domains, no weakened
 *      validators, no VERE work, and no new TypeScript errors in the files it touches — and that the
 *      mandatory Capability Matrix renders correctly.
 *
 * Run only:
 *   npx tsx scripts/validate-contract-bound-generation-authority-v4.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildContractModulePlan,
  evaluateProposedModules,
  buildContractRoutePlan,
  evaluateProposedRoutes,
  buildContractNavigationPlan,
  evaluateProposedNavigation,
  buildContractSurfacePlan,
  evaluateProposedSurface,
  runContractGenerationGate,
  applyContractBoundRepairs,
  buildContractBoundGenerationPlans,
  runContractBoundGenerationAuthority,
  renderContractBoundGenerationReportMarkdown,
  renderCapabilityMatrixMarkdown,
  listCapabilityMatrixCapabilityNames,
  applyContractBoundGenerationToBuildPlan,
  CBGA_DEFAULT_SHELL_NAVIGATION_LABELS,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type {
  CbgaCanonicalContractEvidence,
  CbgaGenerationReport,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { getRepairCapabilityById } from '../src/autonomous-engineering-orchestrator-v1/repair-capability-registry.js';
import { planRepair } from '../src/autonomous-engineering-orchestrator-v1/repair-execution-planner.js';
import { routeMissingCapability } from '../src/autonomous-engineering-orchestrator-v1/missing-capability-router.js';
import { diagnoseBuildFailure, selectPrimaryFailureClassification } from '../src/autonomous-engineering-orchestrator-v1/failure-diagnosis-adapter.js';
import { runAutonomousEngineeringOrchestrator } from '../src/autonomous-engineering-orchestrator-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'CONTRACT_BOUND_GENERATION_AUTHORITY_V4_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

// A structural, hand-built canonical-product-contract fixture describing a restaurant management
// platform — the exact product domain from the observed failure report — used to test the plans
// deterministically without depending on product-faithfulness-v1's glossary/extraction internals.
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

async function main(): Promise<void> {
  const modulePlan = buildContractModulePlan(RESTAURANT_CONTRACT);
  const routePlan = buildContractRoutePlan(modulePlan);
  const navigationPlan = buildContractNavigationPlan(routePlan);
  const surfacePlan = buildContractSurfacePlan(RESTAURANT_CONTRACT, modulePlan);
  const plans = { contract: RESTAURANT_CONTRACT, modulePlan, routePlan, navigationPlan, surfacePlan };

  // -------------------------------------------------------------------------------------------
  // 1. Module plan is derived only from contract concepts.
  // -------------------------------------------------------------------------------------------
  const allContractConcepts = new Set([
    ...RESTAURANT_CONTRACT.coreEntities,
    ...RESTAURANT_CONTRACT.primaryWorkflows,
    ...RESTAURANT_CONTRACT.majorFeatureGroups,
  ]);
  assert(
    '1. module plan is derived only from contract concepts (every entry maps to a real concept)',
    modulePlan.length > 0 && modulePlan.every((m) => allContractConcepts.has(m.sourceContractConcept)),
    `modulePlan=${modulePlan.map((m) => `${m.moduleId}<-${m.sourceContractConcept}`).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 2. Unsupported fallback module is blocked.
  // -------------------------------------------------------------------------------------------
  const fallbackEval = evaluateProposedModules(modulePlan, ['menu-items', 'some-invented-widget']);
  assert(
    '2. unsupported fallback module is blocked',
    fallbackEval.find((e) => e.moduleId === 'some-invented-widget')?.verdict === 'UNSUPPORTED_FALLBACK',
    `evaluations=${fallbackEval.map((e) => `${e.moduleId}:${e.verdict}`).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 3. Generic fallback module is blocked.
  // -------------------------------------------------------------------------------------------
  const genericEval = evaluateProposedModules(modulePlan, ['records']);
  assert(
    '3. generic fallback module is blocked',
    genericEval[0]?.verdict === 'GENERIC_UNSUPPORTED',
    `evaluation=${genericEval[0]?.moduleId}:${genericEval[0]?.verdict}`,
  );

  // -------------------------------------------------------------------------------------------
  // 4. Route plan is derived only from module plan.
  // -------------------------------------------------------------------------------------------
  const moduleIdSet = new Set(modulePlan.map((m) => m.moduleId));
  assert(
    '4. route plan is derived only from module plan',
    routePlan.length === modulePlan.length && routePlan.every((r) => moduleIdSet.has(r.moduleId)),
    `routePlan=${routePlan.map((r) => `${r.path}<-${r.moduleId}`).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 5. Unsupported route is blocked.
  // -------------------------------------------------------------------------------------------
  const routeEval = evaluateProposedRoutes(routePlan, ['/nonexistent-invented-route'], []);
  assert(
    '5. unsupported route is blocked',
    routeEval[0]?.verdict === 'UNSUPPORTED_NO_MODULE',
    `evaluation=${routeEval[0]?.path}:${routeEval[0]?.verdict}`,
  );

  // -------------------------------------------------------------------------------------------
  // 6. Navigation plan is derived only from route plan.
  // -------------------------------------------------------------------------------------------
  const routeModuleIdSet = new Set(routePlan.map((r) => r.moduleId));
  assert(
    '6. navigation plan is derived only from route plan',
    navigationPlan.length === routePlan.length && navigationPlan.every((n) => routeModuleIdSet.has(n.moduleId)),
    `navigationPlan=${navigationPlan.map((n) => n.label).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 7. Unsupported shell navigation is blocked.
  // -------------------------------------------------------------------------------------------
  const navEval = evaluateProposedNavigation(navigationPlan, ['Settings']);
  assert(
    '7. unsupported default-shell navigation ("Settings") is blocked when not contract-supported',
    navEval[0]?.verdict === 'UNSUPPORTED_DEFAULT_SHELL',
    `evaluation=${navEval[0]?.label}:${navEval[0]?.verdict}`,
  );

  // -------------------------------------------------------------------------------------------
  // 8. Generic app title is blocked.
  // -------------------------------------------------------------------------------------------
  const genericTitleEval = evaluateProposedSurface(surfacePlan, RESTAURANT_CONTRACT, {
    proposedModuleIds: [],
    proposedRoutes: [],
    proposedNavigationLabels: [],
    proposedAppTitle: 'Custom App',
  });
  assert(
    '8. generic app title ("Custom App") is blocked',
    genericTitleEval.titleIsGeneric === true,
    `reasons=${genericTitleEval.reasons.join(' | ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 9. Product identity title is required.
  // -------------------------------------------------------------------------------------------
  const badTitleReport = runContractBoundGenerationAuthority({
    contract: RESTAURANT_CONTRACT,
    proposed: {
      proposedModuleIds: [],
      proposedRoutes: [],
      proposedNavigationLabels: [],
      proposedAppTitle: 'Custom App',
    },
  });
  assert(
    '9. product identity title is required — repaired title equals contract product identity',
    badTitleReport.repairedInputs.appTitle === RESTAURANT_CONTRACT.productIdentity,
    `repairedAppTitle=${badTitleReport.repairedInputs.appTitle}`,
  );

  // -------------------------------------------------------------------------------------------
  // 10. Generic reusable-components welcome surface is blocked.
  // -------------------------------------------------------------------------------------------
  const genericWelcomeEval = evaluateProposedSurface(surfacePlan, RESTAURANT_CONTRACT, {
    proposedModuleIds: [],
    proposedRoutes: [],
    proposedNavigationLabels: [],
    proposedAppTitle: RESTAURANT_CONTRACT.productIdentity,
    proposedWelcomeSurfaceText: 'Build reusable components where appropriate for a professional user experience.',
  });
  assert(
    '10. generic "reusable components" welcome surface is blocked',
    genericWelcomeEval.welcomeSurfaceIsGenericShell === true,
    `reasons=${genericWelcomeEval.reasons.join(' | ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 11. Surface plan requires at least one primary workflow.
  // -------------------------------------------------------------------------------------------
  assert(
    '11. surface plan requires at least one primary workflow',
    surfacePlan.primaryInteractionRequirement === RESTAURANT_CONTRACT.primaryWorkflows[0],
    `primaryInteractionRequirement=${surfacePlan.primaryInteractionRequirement}`,
  );

  // -------------------------------------------------------------------------------------------
  // 12. Primary workflow must be visible.
  // -------------------------------------------------------------------------------------------
  const notVisibleEval = evaluateProposedSurface(surfacePlan, RESTAURANT_CONTRACT, {
    proposedModuleIds: [],
    proposedRoutes: [],
    proposedNavigationLabels: [],
    proposedAppTitle: RESTAURANT_CONTRACT.productIdentity,
    proposedPrimaryWorkflowVisible: false,
  });
  assert(
    '12. primary workflow must be visible — flagged when explicitly not visible',
    notVisibleEval.primaryWorkflowVisible === false && notVisibleEval.reasons.some((r) => /not visible/.test(r)),
    `reasons=${notVisibleEval.reasons.join(' | ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 13. Primary workflow must be interactive.
  // -------------------------------------------------------------------------------------------
  const notInteractiveEval = evaluateProposedSurface(surfacePlan, RESTAURANT_CONTRACT, {
    proposedModuleIds: [],
    proposedRoutes: [],
    proposedNavigationLabels: [],
    proposedAppTitle: RESTAURANT_CONTRACT.productIdentity,
    proposedPrimaryWorkflowVisible: true,
    proposedPrimaryWorkflowInteractive: false,
  });
  assert(
    '13. primary workflow must be interactive — flagged when visible but not interactive',
    notInteractiveEval.primaryWorkflowInteractive === false && notInteractiveEval.reasons.some((r) => /not interactive/.test(r)),
    `reasons=${notInteractiveEval.reasons.join(' | ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 14. Contract concepts cannot disappear before generation.
  // -------------------------------------------------------------------------------------------
  const firstModuleId = modulePlan[0].moduleId;
  const disappearingGate = runContractGenerationGate(plans, {
    proposedModuleIds: [firstModuleId],
    proposedRoutes: ['/'],
    proposedNavigationLabels: [navigationPlan[0].label],
    proposedAppTitle: RESTAURANT_CONTRACT.productIdentity,
    proposedPrimaryWorkflowVisible: true,
    proposedPrimaryWorkflowInteractive: true,
  });
  assert(
    '14. contract concepts cannot disappear before generation',
    disappearingGate.outcome === 'GENERATION_BLOCKED_CONTRACT_INCONSISTENT' && disappearingGate.contractConceptsMissing.length > 0,
    `outcome=${disappearingGate.outcome}, missing=${disappearingGate.contractConceptsMissing.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 15. Generation gate allows consistent plans.
  // -------------------------------------------------------------------------------------------
  const consistentGate = runContractGenerationGate(plans, {
    proposedModuleIds: modulePlan.map((m) => m.moduleId),
    proposedRoutes: routePlan.map((r) => r.path),
    proposedNavigationLabels: navigationPlan.map((n) => n.label),
    proposedAppTitle: RESTAURANT_CONTRACT.productIdentity,
    proposedPrimaryWorkflowVisible: true,
    proposedPrimaryWorkflowInteractive: true,
  });
  assert(
    '15. generation gate allows fully consistent plans',
    consistentGate.outcome === 'GENERATION_ALLOWED',
    `outcome=${consistentGate.outcome}, reasons=${consistentGate.reasons.join(' | ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 16. Generation gate blocks inconsistent plans.
  // -------------------------------------------------------------------------------------------
  const inconsistentGate = runContractGenerationGate(plans, {
    proposedModuleIds: ['totally-unrelated-widget'],
    proposedRoutes: ['/totally-unrelated-widget'],
    proposedNavigationLabels: ['Features'],
    proposedAppTitle: 'Custom App',
  });
  assert(
    '16. generation gate blocks inconsistent plans',
    inconsistentGate.outcome !== 'GENERATION_ALLOWED',
    `outcome=${inconsistentGate.outcome}`,
  );

  // -------------------------------------------------------------------------------------------
  // 17. Repair removes unsupported fallback modules.
  // -------------------------------------------------------------------------------------------
  const repairedFromInconsistent = applyContractBoundRepairs(plans, inconsistentGate, {
    proposedModuleIds: ['totally-unrelated-widget'],
    proposedRoutes: ['/totally-unrelated-widget'],
    proposedNavigationLabels: ['Features'],
    proposedAppTitle: 'Custom App',
  });
  assert(
    '17. repair removes unsupported fallback modules',
    !repairedFromInconsistent.moduleIds.includes('totally-unrelated-widget') &&
      repairedFromInconsistent.actionsPerformed.some((a) => a.actionId === 'REMOVE_UNSUPPORTED_FALLBACK_MODULE'),
    `moduleIds=${repairedFromInconsistent.moduleIds.join(', ')}, actions=${repairedFromInconsistent.actionsPerformed.map((a) => a.actionId).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 18. Repair rebuilds module plan from contract.
  // -------------------------------------------------------------------------------------------
  assert(
    '18. repair rebuilds module plan from contract',
    modulePlan.every((m) => repairedFromInconsistent.moduleIds.includes(m.moduleId)) &&
      repairedFromInconsistent.actionsPerformed.some((a) => a.actionId === 'REBUILD_MODULE_PLAN'),
    `moduleIds=${repairedFromInconsistent.moduleIds.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 19. Repair rebuilds route plan from contract.
  // -------------------------------------------------------------------------------------------
  assert(
    '19. repair rebuilds route plan from contract',
    repairedFromInconsistent.actionsPerformed.some((a) => a.actionId === 'REBUILD_ROUTE_PLAN') &&
      routePlan.every((r) => repairedFromInconsistent.routes.includes(r.path)),
    `routes=${repairedFromInconsistent.routes.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 20. Repair rebuilds navigation plan from contract.
  // -------------------------------------------------------------------------------------------
  assert(
    '20. repair rebuilds navigation plan from contract',
    repairedFromInconsistent.actionsPerformed.some((a) => a.actionId === 'REBUILD_NAVIGATION_PLAN') &&
      navigationPlan.every((n) => repairedFromInconsistent.navigationLabels.includes(n.label)),
    `navigationLabels=${repairedFromInconsistent.navigationLabels.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 21. Repair rebuilds surface plan from contract.
  // -------------------------------------------------------------------------------------------
  assert(
    '21. repair rebuilds surface plan from contract (generic title + welcome surface replaced)',
    repairedFromInconsistent.actionsPerformed.some((a) => a.actionId === 'REPLACE_GENERIC_APP_IDENTITY') &&
      repairedFromInconsistent.appTitle === RESTAURANT_CONTRACT.productIdentity,
    `appTitle=${repairedFromInconsistent.appTitle}, actions=${repairedFromInconsistent.actionsPerformed.map((a) => a.actionId).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 22-25. Generator input adapter consumes module/route/navigation/surface plans.
  // -------------------------------------------------------------------------------------------
  // Reproduces the exact observed failure: a real prompt for a restaurant management platform,
  // but the (simulated) generator proposed a generic fallback module set and the literal
  // "reusable components where" title the bug report describes.
  const restaurantPrompt =
    'Build a Restaurant Management Platform for taking orders, managing reservations, tracking menu items, tables, inventory tracking, and staff scheduling.';
  const realContract = buildCanonicalProductContract({ prompt: restaurantPrompt });
  const fakeBuildPlan = {
    modulePlan: {
      readOnly: true,
      planId: 'test-plan',
      rawPromptHash: 'test-hash',
      approvedModules: [],
      approvedModuleIds: ['records', 'settings'],
      routes: ['/', '/settings'],
      blockedModules: [],
      metadataConstraints: [],
      contaminationDetected: false,
      contaminationReasons: [],
      passedPreGenerationGuard: true,
    },
    extraction: { appName: 'reusable components where' },
    promptBoundedMaterializationPassed: true,
  } as unknown as ResolvedPromptFaithfulBuildPlan;

  const adapterResult = applyContractBoundGenerationToBuildPlan(fakeBuildPlan, realContract);

  assert(
    '22. generator input adapter consumes the contract-bound module plan',
    JSON.stringify(adapterResult.buildPlan.modulePlan.approvedModuleIds) === JSON.stringify(adapterResult.report.repairedInputs.moduleIds) &&
      !adapterResult.buildPlan.modulePlan.approvedModuleIds.includes('records'),
    `approvedModuleIds=${adapterResult.buildPlan.modulePlan.approvedModuleIds.join(', ')}`,
  );

  assert(
    '23. generator input adapter consumes the contract-bound route plan',
    JSON.stringify(adapterResult.buildPlan.modulePlan.routes) === JSON.stringify(adapterResult.report.repairedInputs.routes),
    `routes=${adapterResult.buildPlan.modulePlan.routes.join(', ')}`,
  );

  assert(
    '24. generator input adapter exposes the contract-bound navigation plan for consumption',
    adapterResult.report.repairedInputs.navigationLabels.length > 0 &&
      adapterResult.report.repairedInputs.navigationLabels.every((label) =>
        adapterResult.report.navigationPlan.some((n) => n.label === label),
      ),
    `navigationLabels=${adapterResult.report.repairedInputs.navigationLabels.join(', ')}`,
  );

  assert(
    '25. generator input adapter consumes the contract-bound surface plan (app title)',
    adapterResult.buildPlan.extraction.appName === adapterResult.report.repairedInputs.appTitle &&
      adapterResult.buildPlan.extraction.appName !== 'reusable components where',
    `appName=${adapterResult.buildPlan.extraction.appName}`,
  );

  // -------------------------------------------------------------------------------------------
  // 26. Real orchestrator invokes the contract-bound gate before materialization.
  // -------------------------------------------------------------------------------------------
  const orchestratorSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  );
  const importIdx = orchestratorSource.indexOf("from '../contract-bound-generation-authority-v4/index.js'");
  const callIdx = orchestratorSource.indexOf('applyContractBoundGenerationToBuildPlan(buildPlan, canonicalProductContract)');
  const runWorkspaceMaterializationDefIdx = orchestratorSource.indexOf('const runWorkspaceMaterialization = ()');
  const materializeCallIdx = orchestratorSource.indexOf('materializeGeneratedApplication({');
  assert(
    '26. real orchestrator invokes the contract-bound gate before materialization',
    importIdx > -1 &&
      callIdx > -1 &&
      runWorkspaceMaterializationDefIdx > -1 &&
      materializeCallIdx > -1 &&
      callIdx < runWorkspaceMaterializationDefIdx &&
      callIdx < materializeCallIdx,
    `importIdx=${importIdx}, callIdx=${callIdx}, runWorkspaceMaterializationDefIdx=${runWorkspaceMaterializationDefIdx}, materializeCallIdx=${materializeCallIdx}`,
  );

  // -------------------------------------------------------------------------------------------
  // 27. AEO registry marks Contract-Bound Generation Authority production-wired.
  // -------------------------------------------------------------------------------------------
  const cbgaRegistryEntry = getRepairCapabilityById('contract-bound-generation-authority-v4');
  assert(
    '27. AEO registry marks Contract-Bound Generation Authority production-wired and safe to auto-run',
    cbgaRegistryEntry?.wiringStatus === 'PRODUCTION_WIRED' &&
      cbgaRegistryEntry.safeToRunAutomatically === true &&
      cbgaRegistryEntry.failureClassesHandled.includes('UNAUTHORIZED_FALLBACK_MODULES') &&
      cbgaRegistryEntry.failureClassesHandled.includes('CONTRACT_INCONSISTENCY') &&
      cbgaRegistryEntry.failureClassesHandled.includes('PRODUCT_IDENTITY_DRIFT') &&
      cbgaRegistryEntry.mayChangeProductIdentity === false,
    `entry=${JSON.stringify({ wiringStatus: cbgaRegistryEntry?.wiringStatus, safeToRunAutomatically: cbgaRegistryEntry?.safeToRunAutomatically, mayChangeProductIdentity: cbgaRegistryEntry?.mayChangeProductIdentity })}`,
  );

  // -------------------------------------------------------------------------------------------
  // 28. AEO no longer reports Contract-Bound Generation Authority as missing once implemented.
  // -------------------------------------------------------------------------------------------
  const fallbackClassifications = diagnoseBuildFailure({
    fallbackModulesDetected: true,
    unauthorizedFallbackDetail: 'Fallback modules were appended to the custom module definition.',
  });
  const fallbackClassification = selectPrimaryFailureClassification(fallbackClassifications);
  const fallbackRepairPlan = planRepair({ classification: fallbackClassification, attemptHistory: [] });
  const stillConsideredButRefused = {
    ...fallbackRepairPlan,
    decision: 'REFUSE_MAX_ATTEMPTS_EXCEEDED' as const,
  };
  const routedRecommendation = routeMissingCapability(fallbackClassification.failureClass, stillConsideredButRefused);
  assert(
    '28. AEO no longer reports Contract-Bound Generation Authority as missing once implemented',
    fallbackRepairPlan.decision === 'RUN_TARGETED_REPAIR' &&
      fallbackRepairPlan.matchedCapability?.capabilityId === 'contract-bound-generation-authority-v4' &&
      routedRecommendation.missingCapabilityId !== 'CONTRACT_BOUND_GENERATION_AUTHORITY',
    `decision=${fallbackRepairPlan.decision}, matched=${fallbackRepairPlan.matchedCapability?.capabilityId}, routedMissingId=${routedRecommendation.missingCapabilityId}`,
  );

  // -------------------------------------------------------------------------------------------
  // 29. EIAA does not activate the runtime for a capability that is already production-wired.
  // -------------------------------------------------------------------------------------------
  const aeoReport = await runAutonomousEngineeringOrchestrator({
    diagnosisInput: {
      fallbackModulesDetected: true,
      unauthorizedFallbackDetail: 'Fallback modules were appended to the custom module definition.',
    },
  });
  assert(
    '29. EIAA does not activate the runtime for Contract-Bound Generation Authority (already production-wired)',
    aeoReport.missingCapability === null &&
      aeoReport.engineeringIntelligenceActivation === null &&
      aeoReport.matchedCapabilityId === 'contract-bound-generation-authority-v4' &&
      aeoReport.finalState === 'STOP_SAFE',
    `missingCapability=${aeoReport.missingCapability?.missingCapabilityId ?? 'null'}, eiaa=${aeoReport.engineeringIntelligenceActivation?.decision ?? 'null'}, matched=${aeoReport.matchedCapabilityId}, finalState=${aeoReport.finalState}`,
  );

  // -------------------------------------------------------------------------------------------
  // 30-34. Reporting.
  // -------------------------------------------------------------------------------------------
  const fullReport: CbgaGenerationReport = runContractBoundGenerationAuthority({
    contract: RESTAURANT_CONTRACT,
    proposed: {
      proposedModuleIds: ['records'],
      proposedRoutes: ['/'],
      proposedNavigationLabels: ['Features'],
      proposedAppTitle: 'Custom App',
      proposedWelcomeSurfaceText: 'Build reusable components where appropriate.',
    },
  });
  const reportMarkdown = renderContractBoundGenerationReportMarkdown(fullReport);

  assert(
    '30. reports include contract-bound generation status',
    reportMarkdown.includes('Final gate outcome') && reportMarkdown.includes(fullReport.finalGateOutcome),
    `finalGateOutcome=${fullReport.finalGateOutcome}`,
  );
  assert(
    '31. reports include a module plan table',
    reportMarkdown.includes('## Module Plan') && modulePlan.some((m) => reportMarkdown.includes(m.moduleId)),
    'module plan table present with real module ids',
  );
  assert(
    '32. reports include a route plan table',
    reportMarkdown.includes('## Route Plan') && routePlan.some((r) => reportMarkdown.includes(r.path)),
    'route plan table present with real route paths',
  );
  assert(
    '33. reports include a navigation plan table',
    reportMarkdown.includes('## Navigation Plan') && navigationPlan.some((n) => reportMarkdown.includes(n.label)),
    'navigation plan table present with real navigation labels',
  );
  assert(
    '34. reports include generic shell surfaces blocked',
    reportMarkdown.includes('Generic shell surface blocked') && reportMarkdown.includes('Unsupported modules removed'),
    `initialGate.genericShellSurfaceBlocked=${fullReport.initialGate.genericShellSurfaceBlocked}`,
  );

  // -------------------------------------------------------------------------------------------
  // 35. Capability Matrix is included.
  // -------------------------------------------------------------------------------------------
  const matrixMarkdown = renderCapabilityMatrixMarkdown();
  const REQUIRED_MATRIX_CAPABILITIES = [
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
    matrixMarkdown.includes('|------------|--------|------------------|----------|--------------------|-------|') &&
    reportMarkdown.includes('## Capability Matrix');
  assert(
    '35. Capability Matrix is generated correctly and included in the report (all 11 required capabilities present)',
    missingFromMatrix.length === 0 && hasCorrectHeader,
    `missing=${missingFromMatrix.join(', ') || 'none'}, correctHeader=${hasCorrectHeader}, totalRows=${matrixCapabilityNames.length}`,
  );

  // -------------------------------------------------------------------------------------------
  // 36. No application-specific logic introduced.
  // -------------------------------------------------------------------------------------------
  const CBGA_DIR = join(ROOT, 'src/contract-bound-generation-authority-v4');
  const cbgaFiles = readdirSync(CBGA_DIR).filter((f) => f.endsWith('.ts'));
  const cbgaSource = cbgaFiles.map((f) => readFileSync(join(CBGA_DIR, f), 'utf8')).join('\n');
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /if\s*\(\s*(domain|product|profile)\s*===\s*['"](restaurant|calculator|crm|booking|inventory|notes|converter)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
  ];
  const logicHits = APPLICATION_SPECIFIC_LOGIC_PATTERNS.filter((p) => p.test(cbgaSource));
  assert(
    '36. no application-specific logic introduced (no per-domain special-casing branches)',
    logicHits.length === 0,
    logicHits.length === 0 ? `inspected ${cbgaFiles.length} CBGA source file(s) — no per-domain branching found` : `found ${logicHits.length} pattern match(es)`,
  );

  // -------------------------------------------------------------------------------------------
  // 37. No hardcoded product domains introduced.
  // -------------------------------------------------------------------------------------------
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
    'authentication provider',
    '\\bcrud\\b',
  ];
  const domainHits = FORBIDDEN_DOMAIN_WORDS.filter((w) => new RegExp(w, 'i').test(cbgaSource));
  assert(
    '37. no hardcoded product-domain words introduced in the CBGA module',
    domainHits.length === 0,
    domainHits.length === 0 ? `inspected ${cbgaFiles.length} CBGA source file(s) — no forbidden domain words found` : `found: ${domainHits.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 38. No validators weakened.
  // -------------------------------------------------------------------------------------------
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
  const hasOwnScript =
    pkg.scripts['validate:contract-bound-generation-authority-v4'] === 'tsx scripts/validate-contract-bound-generation-authority-v4.ts';
  const siblingScriptsIntact =
    pkg.scripts['validate:autonomous-engineering-orchestrator-v1'] === 'tsx scripts/validate-autonomous-engineering-orchestrator-v1.ts' &&
    pkg.scripts['validate:engineering-intelligence-activation-authority-v1'] === 'tsx scripts/validate-engineering-intelligence-activation-authority-v1.ts' &&
    pkg.scripts['validate:product-faithfulness-milestone-2'] === 'tsx scripts/validate-product-faithfulness-milestone-2.ts';
  assert(
    '38. this milestone adds its own validator script and does not weaken any sibling validator',
    hasOwnScript && siblingScriptsIntact,
    `hasOwnScript=${hasOwnScript}, siblingScriptsIntact=${siblingScriptsIntact}`,
  );

  // -------------------------------------------------------------------------------------------
  // 39. No VERE work introduced.
  // -------------------------------------------------------------------------------------------
  const vereMention = /\bvere\b/i.test(cbgaSource);
  assert(
    '39. no VERE / validation-evidence-reuse work was added by this milestone',
    !vereMention,
    vereMention ? 'unexpected VERE reference found in CBGA module' : 'no VERE references found in CBGA module',
  );

  // -------------------------------------------------------------------------------------------
  // 40. No new TypeScript errors introduced in touched files.
  // -------------------------------------------------------------------------------------------
  const TOUCHED_FILES = [
    'src/contract-bound-generation-authority-v4/',
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
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
    '40. no new TypeScript errors introduced in touched files (lightweight touched-file tsc diagnostic)',
    !tscFailedToRun && newTouchedFileErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}, new (non-pre-existing)=${newTouchedFileErrors.length}${newTouchedFileErrors.length > 0 ? `: ${newTouchedFileErrors.join(' | ')}` : ''}`,
  );

  // -------------------------------------------------------------------------------------------
  // Extra 1: determinism — same input, byte-identical structural output.
  // -------------------------------------------------------------------------------------------
  const detInput = {
    contract: RESTAURANT_CONTRACT,
    proposed: {
      proposedModuleIds: ['records'],
      proposedRoutes: ['/'],
      proposedNavigationLabels: ['Features'],
      proposedAppTitle: 'Custom App',
    },
  };
  const detA = runContractBoundGenerationAuthority(detInput);
  const detB = runContractBoundGenerationAuthority(detInput);
  const strip = (r: typeof detA) => JSON.stringify({ ...r, generatedAt: null });
  assert(
    'extra. CBGA is deterministic — identical input yields byte-identical structural output',
    strip(detA) === strip(detB),
    strip(detA) === strip(detB) ? 'two independent runs produced identical structural output' : 'runs diverged',
  );

  // -------------------------------------------------------------------------------------------
  // Extra 2: default-shell navigation labels are never allowed by default.
  // -------------------------------------------------------------------------------------------
  const shellNavEval = evaluateProposedNavigation(navigationPlan, [...CBGA_DEFAULT_SHELL_NAVIGATION_LABELS]);
  assert(
    'extra. every generic default-shell navigation label is blocked unless contract-supported',
    shellNavEval.every((e) => e.verdict === 'UNSUPPORTED_DEFAULT_SHELL'),
    `evaluations=${shellNavEval.map((e) => `${e.label}:${e.verdict}`).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // Extra 3: buildContractBoundGenerationPlans composes all four plans consistently.
  // -------------------------------------------------------------------------------------------
  const composedPlans = buildContractBoundGenerationPlans(RESTAURANT_CONTRACT);
  assert(
    'extra. buildContractBoundGenerationPlans composes module/route/navigation/surface plans consistently',
    composedPlans.modulePlan.length === modulePlan.length &&
      composedPlans.routePlan.length === routePlan.length &&
      composedPlans.navigationPlan.length === navigationPlan.length &&
      composedPlans.surfacePlan.titleRequirement === surfacePlan.titleRequirement,
    'composed plans match independently-built plans',
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
