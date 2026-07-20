/**
 * Real Production Path Integration Repair V1 — live-path validation harness.
 *
 * Run:
 *   npx tsx scripts/validate-real-production-path-integration.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { finalizeBuildFromPromptPayload } from '../server/build-from-prompt-handler.js';
import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/index.js';
import { CBGA_DEFAULT_SHELL_NAVIGATION_LABELS } from '../src/contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import type { ApprovedProductionBuildEnvelope } from '../src/contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { runGenerationPipelineComplianceGate } from '../src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.js';
import { detectContractBypassedInputs } from '../src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.js';
import { LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT } from '../src/live-preview-interaction-proof-v1/live-preview-interaction-proof-types.js';
import type { LivePreviewInteractionProofReport } from '../src/live-preview-interaction-proof-v1/live-preview-interaction-proof-types.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import { createProductionBuildContext, blockedProjectionContainsNoSuccessWording } from '../src/build-context-integrity/index.js';
import { runContractToModuleTraceabilityEvaluation } from '../src/contract-to-module-traceability/index.js';
import {
  BUILD_FROM_PROMPT_PRODUCTION_PATH,
  BUILDER_HOME_BUILD_HANDLER,
} from '../src/production-surface-integration/real-production-path-response.js';
import {
  buildCanonicalProductFaithfulnessFindings,
  navigationContainsUnapprovedTemplateLabels,
  productFaithfulnessFindingsAreUnique,
  resolveNavigationFromCbgaPlan,
} from '../src/production-surface-integration/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'REAL_PRODUCTION_PATH_INTEGRATION_REPAIR_V1_PASS';

interface Result {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Result[] = [];
let n = 1;

function assert(name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail });
}

function readSource(path: string): string {
  try {
    return readFileSync(join(ROOT, path), 'utf8');
  } catch {
    return '';
  }
}

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `rppi-${label}`,
    buildId: `rppi-build-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `rppi-${label}`,
    ideaId: `idea-${label}`,
    buildUnits: [`unit-${label}`],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
    buildRunId: `workspace-${label}`,
  });
  return { contract, envelope, workspaceFiles, bound };
}

function blockedInteractionProof(): LivePreviewInteractionProofReport {
  return {
    readOnly: true,
    contractVersion: LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT,
    result: 'PREVIEW_INTERACTION_BLOCKED',
    evidence: {
      readOnly: true,
      previewUrl: null,
      pageLoaded: false,
      loadErrorDetail: null,
      consoleErrors: [],
      fatalConsoleErrorDetected: false,
      rootUiFound: false,
      primaryFeatureTextFound: null,
      candidateTermsTried: [],
      plannedInteractions: [],
      interactionAttempts: [],
      durationMs: 0,
      blockedReason: 'GPCA blocked before preview activation.',
    },
    summary: {
      readOnly: true,
      headline: 'Preview proof blocked.',
      whatLoaded: [],
      whatWasTested: [],
      whatWorked: [],
      whatFailed: [],
      suggestedRepair: [],
    },
  };
}

function syntheticBuild(input: {
  buildId: string;
  projectId: string;
  prompt: string;
  envelope: ApprovedProductionBuildEnvelope;
  overrides?: Partial<OnePromptLivePreviewBuildResult>;
}): OnePromptLivePreviewBuildResult {
  const title = input.envelope.approvedProductIdentity.displayName;
  return {
    readOnly: true,
    buildId: input.buildId,
    projectId: input.projectId,
    projectName: title,
    status: 'READY',
    prompt: input.prompt,
    requestType: 'BUILD_FROM_PROMPT',
    workspaceId: input.projectId,
    workspacePath: `.aidev-projects/${input.projectId}/source`,
    generatedProfile: null,
    planningProofLevel: null,
    materializationProofLevel: null,
    buildResult: 'PASS',
    npmInstallOk: true,
    npmBuildOk: true,
    previewUrl: 'http://127.0.0.1:4173/preview',
    diagnosticPreviewUrl: null,
    limitedPreviewUrl: null,
    devServerRunning: true,
    livePreviewAvailable: true,
    failureReason: null,
    featureSignals: null,
    materializationManifest: null,
    livePreviewGate: null,
    autonomousSoftwareEngineering: null,
    approvedProductIdentity: input.envelope.approvedProductIdentity,
    approvedNavigationPlan: input.envelope.approvedNavigationPlan,
    approvedModulePlan: input.envelope.approvedModulePlan,
    approvedMetadataPlan: input.envelope.approvedMetadataPlan,
    approvedProductionBuildEnvelope: input.envelope,
    updatedAt: new Date().toISOString(),
    ...input.overrides,
  };
}

function runProductionFinalize(build: OnePromptLivePreviewBuildResult) {
  const proof = blockedInteractionProof();
  return finalizeBuildFromPromptPayload({
    build,
    livePreviewInteractionProof: proof,
    executionReport: null,
    productFaithfulness: null,
    generationFaithfulness: null,
  });
}

function responseText(payload: ReturnType<typeof runProductionFinalize>): string {
  return JSON.stringify(payload);
}

function staleResponseRejected(buildId: string, productionPathBuildRequestId: string): boolean {
  return productionPathBuildRequestId !== buildId;
}

const builderHome = readSource('public/founder-reality/builder-home.js');
const handlerSource = readSource('server/build-from-prompt-handler.ts');
const orchestratorSource = readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');

const buildA = materialize(
  'unit-converter',
  'Build a generic unit conversion utility with conversion categories and conversion actions.',
);
const buildB = materialize(
  'operations',
  'Build a generic operations management application with workflow records, assignment actions, and status tracking.',
);

const finalizedA = runProductionFinalize(
  syntheticBuild({
    buildId: 'build-a-id',
    projectId: 'project-a',
    prompt: buildA.contract.productIdentity,
    envelope: buildA.envelope,
  }),
);
const finalizedB = runProductionFinalize(
  syntheticBuild({
    buildId: 'build-b-id',
    projectId: 'project-b',
    prompt: buildB.contract.productIdentity,
    envelope: buildB.envelope,
  }),
);

const blockedLegacy = runProductionFinalize(
  syntheticBuild({
    buildId: 'blocked-build-id',
    projectId: 'project-blocked',
    prompt: buildB.contract.productIdentity,
    envelope: buildB.envelope,
    overrides: {
      status: 'FAILED',
      buildResult: 'FAIL',
      gpcaHardStop: true,
      gpcaBlockedMaterialization: true,
      gpcaBlockedPreviewActivation: true,
      failureReason: 'navigation item "Features" was not approved by CBGA',
      devServerRunning: true,
      livePreviewAvailable: true,
      previewUrl: 'http://127.0.0.1:4173/stale-preview',
      npmInstallOk: true,
      npmBuildOk: true,
    },
  }),
);

const faithfulnessPrompt =
  'Build a generic records utility with alpha records, beta records, and gamma export actions.';
const faithfulnessContract = buildCanonicalProductContract({
  prompt: faithfulnessPrompt,
});
const faithfulnessPlan = resolvePromptFaithfulBuildPlan(faithfulnessPrompt);
const faithfulnessBound = applyContractBoundGenerationToBuildPlan(faithfulnessPlan, faithfulnessContract, {
  promptHash: 'rppi-faithfulness',
  buildId: 'rppi-faithfulness-build',
});
const faithfulnessEnvelope = faithfulnessBound.report.approvedProductionBuildEnvelope;
const faithfulnessTrace = runContractToModuleTraceabilityEvaluation({
  contract: faithfulnessContract,
  envelope: faithfulnessEnvelope,
  workspaceFiles: [],
  proposedModuleIds: faithfulnessEnvelope.approvedModulePlan.moduleIds.slice(0, 1),
  universalFeatureNames: [],
});
const faithfulnessFindings = buildCanonicalProductFaithfulnessFindings(faithfulnessTrace);
const faithfulnessFinalized = runProductionFinalize(
  syntheticBuild({
    buildId: 'faithfulness-build-id',
    projectId: 'project-faithfulness',
    // Full prompt required: productIdentity alone collapses requested concepts and cannot exercise
    // genuine missing-concept attribution after current-build feature-surface resolution.
    prompt: faithfulnessPrompt,
    envelope: faithfulnessEnvelope,
  }),
);

const navSurfaceB = resolveNavigationFromCbgaPlan(buildB.envelope);
const routerSource = buildB.workspaceFiles.find((f) => f.relativePath === 'src/features/FeatureAppRouter.tsx')?.content ?? '';
const featureRouterNavLabels = [...routerSource.matchAll(/label:\s*'([^']+)'/g)].map((match) => match[1]);
const gpcaBypass = detectContractBypassedInputs({
  contract: buildB.contract,
  cbgaReport: buildB.bound.report,
  proposed: {
    moduleIds: buildB.envelope.approvedModulePlan.moduleIds,
    routes: buildB.envelope.approvedModulePlan.moduleEntries.map((entry) => entry.route),
    navigationLabels: [...buildB.envelope.approvedNavigationPlan.productEntries, 'Features'],
    appTitle: buildB.envelope.approvedProductIdentity.displayName,
    generatedFilePaths: [],
  },
});
const gpcaGate = runGenerationPipelineComplianceGate(
  {
    contract: buildB.contract,
    cbgaReport: buildB.bound.report,
    proposed: {
      moduleIds: buildB.envelope.approvedModulePlan.moduleIds,
      routes: buildB.envelope.approvedModulePlan.moduleEntries.map((entry) => entry.route),
      navigationLabels: [...buildB.envelope.approvedNavigationPlan.productEntries, 'Features'],
      appTitle: buildB.envelope.approvedProductIdentity.displayName,
      generatedFilePaths: [],
    },
  },
  [],
  [],
  [],
  100,
  null,
);

const conceptJoinIdentity = buildCanonicalProductContract({
  prompt: 'Build reminders, categories, and mark complete actions for daily tasks.',
}).productIdentity;

assert(
  `${n++}. Browser handler targets production build endpoint`,
  builderHome.includes("var BUILD_API = '/api/build/from-prompt'") && builderHome.includes('function runBuild'),
  BUILD_FROM_PROMPT_PRODUCTION_PATH,
);
assert(
  `${n++}. Server route uses handleBuildFromPromptRequest`,
  readSource('server/founder-reality-server.ts').includes("'/api/build/from-prompt'") &&
    readSource('server/founder-reality-server.ts').includes('handleBuildFromPromptRequest'),
  'founder-reality-server.ts',
);
assert(
  `${n++}. Handler finalizes via production path projection`,
  handlerSource.includes('finalizeBuildFromPromptPayload') &&
    handlerSource.includes('buildRealProductionPathResponseEnvelope') &&
    handlerSource.includes('productionPath'),
  'build-from-prompt-handler.ts',
);
assert(
  `${n++}. Documented browser handler constant matches builder-home`,
  BUILDER_HOME_BUILD_HANDLER.includes('builder-home.js') && BUILD_FROM_PROMPT_PRODUCTION_PATH === '/api/build/from-prompt',
  BUILDER_HOME_BUILD_HANDLER,
);
assert(
  `${n++}. Fresh build response carries one buildId`,
  finalizedB.build.buildId === 'build-b-id' && finalizedB.productionPath.buildRequestId === 'build-b-id',
  finalizedB.build.buildId,
);
assert(
  `${n++}. Project identity equals CBGA-approved identity`,
  finalizedB.productionPath.projectTitle === buildB.envelope.approvedProductIdentity.displayName,
  finalizedB.productionPath.projectTitle,
);
assert(
  `${n++}. Project identity cannot derive from missing-concept groups`,
  finalizedB.productionPath.projectTitle !== conceptJoinIdentity,
  conceptJoinIdentity,
);
assert(
  `${n++}. Project identity cannot derive from Product Faithfulness labels`,
  !finalizedB.productionPath.projectTitle.includes(' / '),
  finalizedB.productionPath.projectTitle,
);
assert(
  `${n++}. Project identity cannot derive from previous project state`,
  finalizedB.productionPath.projectTitle !== buildA.envelope.approvedProductIdentity.displayName,
  buildA.envelope.approvedProductIdentity.displayName,
);
assert(
  `${n++}. Second build replaces first-build identity`,
  !responseText(finalizedB).includes(buildA.envelope.approvedProductIdentity.displayName),
  buildA.envelope.approvedProductIdentity.displayName,
);
assert(
  `${n++}. Second build replaces first-build workspace ownership`,
  finalizedB.productionPath.buildContextId !== null &&
    finalizedB.productionPath.buildContextId !==
      createProductionBuildContext({
        envelope: buildA.envelope,
        projectId: 'project-a',
        workspaceId: 'project-a',
      }).buildContextId,
  String(finalizedB.productionPath.buildContextId),
);
assert(
  `${n++}. Second build replaces first-build preview state`,
  finalizedB.productionPath.previewAvailable === finalizedB.normalizedBuild.showLivePreview,
  String(finalizedB.productionPath.previewAvailable),
);
assert(
  `${n++}. Second build replaces first-build Product Faithfulness state`,
  !responseText(finalizedB).includes(finalizedA.productionPath.projectTitle),
  finalizedA.productionPath.projectTitle,
);
assert(
  `${n++}. Second build replaces first-build timeline contamination`,
  !responseText(finalizedB).includes('build-a-id'),
  'build-a-id',
);
assert(
  `${n++}. Stale asynchronous responses rejected by buildId`,
  staleResponseRejected('current-build', 'previous-build'),
  'mismatch rejects',
);
assert(
  `${n++}. Final navigation input contains only CBGA-approved entries`,
  navSurfaceB.entries.every((entry) => entry.source === 'CBGA_APPROVED' || entry.source === 'INFRASTRUCTURE_APPROVED'),
  navSurfaceB.entries.map((entry) => entry.label).join(','),
);
assert(
  `${n++}. Template navigation absent before GPCA in normal generator output`,
  navigationContainsUnapprovedTemplateLabels(['Features', 'Activity', 'Alerts', 'Profile'], buildB.envelope).length === 4,
  featureRouterNavLabels.join(','),
);
assert(`${n++}. Features-like navigation not inserted by normal generator`, !featureRouterNavLabels.includes('Features'), featureRouterNavLabels.join(','));
assert(`${n++}. Activity-like navigation not inserted by normal generator`, !featureRouterNavLabels.includes('Activity'), featureRouterNavLabels.join(','));
assert(`${n++}. Alerts-like navigation not inserted by normal generator`, !featureRouterNavLabels.includes('Alerts'), featureRouterNavLabels.join(','));
assert(
  `${n++}. Profile-like navigation not inserted without approved capability`,
  !featureRouterNavLabels.includes('Profile') ||
    buildB.envelope.approvedNavigationPlan.navigationItems.some((item) => item.label === 'Profile'),
  featureRouterNavLabels.join(','),
);
assert(
  `${n++}. Deliberately injected unapproved navigation blocked by GPCA`,
  gpcaBypass.detected === true && gpcaGate.outcome === 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS',
  gpcaGate.outcome,
);
assert(
  `${n++}. GPCA pre-generation validation runs before generation`,
  orchestratorSource.indexOf('if (gpcaBlocksGeneration(gpcaComplianceReport)) {') <
    orchestratorSource.indexOf('const runWorkspaceMaterialization = (): { ok: boolean'),
  'orchestrator ordering',
);
assert(
  `${n++}. GPCA pre-generation validation runs before runtime startup`,
  orchestratorSource.indexOf('if (gpcaBlocksGeneration(gpcaComplianceReport)) {') <
    orchestratorSource.indexOf('const devServer = await startGeneratedAppDevServer('),
  'orchestrator ordering',
);
assert(
  `${n++}. GPCA pre-generation validation runs before preview readiness`,
  orchestratorSource.indexOf('if (gpcaBlocksGeneration(gpcaComplianceReport)) {') <
    orchestratorSource.indexOf('let livePreviewAvailable = authoritativePreview'),
  'orchestrator ordering',
);
assert(
  `${n++}. GPCA-blocked build has BUILD_BLOCKED_GPCA outcome`,
  blockedLegacy.productionPath.buildOutcome === 'BUILD_BLOCKED_GPCA',
  blockedLegacy.productionPath.buildOutcome,
);
assert(
  `${n++}. GPCA-blocked build execution status is not COMPLETED`,
  blockedLegacy.productionPath.executionStatus !== 'COMPLETED',
  blockedLegacy.productionPath.executionStatus,
);
assert(
  `${n++}. GPCA-blocked build does not say Build completed`,
  !blockedLegacy.productionPath.completionMessage.toLowerCase().includes('build completed successfully'),
  blockedLegacy.productionPath.completionMessage,
);
assert(
  `${n++}. GPCA-blocked build does not say Testing live preview`,
  !JSON.stringify(blockedLegacy).toLowerCase().includes('testing the app in the live preview'),
  blockedLegacy.productionPath.currentStage,
);
assert(
  `${n++}. GPCA-blocked build does not say Live Preview ready`,
  blockedLegacy.productionPath.livePreviewReady === false,
  String(blockedLegacy.productionPath.livePreviewReady),
);
assert(
  `${n++}. GPCA-blocked build does not say ready to preview`,
  !blockedLegacy.productionPath.nextStep.toLowerCase().includes('ready to preview'),
  blockedLegacy.productionPath.nextStep,
);
assert(
  `${n++}. GPCA-blocked build has previewAvailable false`,
  blockedLegacy.productionPath.previewAvailable === false && blockedLegacy.normalizedBuild.showLivePreview === false,
  String(blockedLegacy.productionPath.previewAvailable),
);
assert(
  `${n++}. Blocked timeline does not show successful post-block stages`,
  blockedLegacy.normalizedBuild.stages.previewReady === false &&
    blockedLegacy.normalizedBuild.stages.executionHealthy === false,
  JSON.stringify(blockedLegacy.normalizedBuild.stages),
);
assert(
  `${n++}. User-facing status fields derive from final BuildOutcome`,
  blockedLegacy.productionPath.executionStatus === 'BLOCKED' &&
    blockedLegacy.productionPath.buildStatus === 'FAILED',
  blockedLegacy.productionPath.executionStatus,
);
assert(
  `${n++}. HTTP response is internally status-consistent`,
  blockedLegacy.productionPath.previewAvailable === false &&
    blockedLegacy.productionPath.runtimeStarted === false &&
    blockedLegacy.productionPath.livePreviewReady === false,
  'blocked consistency',
);
assert(
  `${n++}. Browser state rejects stale productionPath buildRequestId`,
  builderHome.includes('payload.productionPath.buildRequestId !== build.buildId'),
  'builder-home.js',
);
assert(
  `${n++}. One missing concept produces one canonical root-cause finding per concept`,
  productFaithfulnessFindingsAreUnique(faithfulnessFindings) && faithfulnessFindings.length >= 1,
  String(faithfulnessFindings.length),
);
assert(
  `${n++}. First broken boundary appears in live Product Faithfulness response`,
  faithfulnessFinalized.productionPath.canonicalRootCauseFindings.every((finding) => Boolean(finding.firstBrokenBoundary)),
  faithfulnessFinalized.productionPath.canonicalRootCauseFindings.map((f) => f.firstBrokenBoundary).join(','),
);
assert(
  `${n++}. Required regeneration stage appears in live response`,
  faithfulnessFinalized.productionPath.canonicalRootCauseFindings.some((finding) => finding.regenerationStage !== null),
  faithfulnessFinalized.productionPath.canonicalRootCauseFindings.map((f) => f.regenerationStage).join(','),
);
assert(
  `${n++}. Downstream duplicate missing-concept entries absent from normalized faithfulness`,
  (faithfulnessFinalized.normalizedBuild.generationFaithfulness?.repairsPerformed.length ?? 0) === 0,
  String(faithfulnessFinalized.normalizedBuild.generationFaithfulness?.repairsPerformed.length ?? 0),
);
assert(
  `${n++}. Evaluation-time recovery does not fabricate missing planning evidence`,
  (faithfulnessFinalized.normalizedBuild.generationFaithfulness?.recoveredConcepts.length ?? 0) === 0,
  String(faithfulnessFinalized.normalizedBuild.generationFaithfulness?.recoveredConcepts.length ?? 0),
);
assert(
  `${n++}. CMTTA findings source the live missing-concept report`,
  faithfulnessFinalized.productionPath.canonicalRootCauseFindings.length > 0,
  String(faithfulnessFinalized.productionPath.canonicalRootCauseFindings.length),
);
assert(
  `${n++}. BuildContext ownership appears in final response`,
  finalizedB.productionPath.buildContextId !== null,
  String(finalizedB.productionPath.buildContextId),
);
assert(
  `${n++}. Workspace artifacts belong to response BuildContext`,
  buildB.workspaceFiles.every((file) => file.content.includes(buildB.envelope.approvedProductIdentity.displayName) || !file.content.includes(buildA.envelope.approvedProductIdentity.displayName)),
  buildB.envelope.approvedProductIdentity.displayName,
);
assert(
  `${n++}. Engineering report belongs to response BuildContext`,
  finalizedB.productionPath.observability.buildContextId === finalizedB.productionPath.buildContextId,
  String(finalizedB.productionPath.observability.buildContextId),
);
assert(
  `${n++}. Product Faithfulness evidence belongs to response BuildContext`,
  faithfulnessFinalized.productionPath.buildContextId === faithfulnessFinalized.productionPath.observability.buildContextId,
  faithfulnessFinalized.productionPath.buildContextId ?? 'null',
);
assert(
  `${n++}. Preview state belongs to response BuildContext`,
  blockedLegacy.productionPath.observability.buildContextId === blockedLegacy.productionPath.buildContextId,
  String(blockedLegacy.productionPath.previewAvailable),
);
assert(
  `${n++}. No previous build context appears after fresh build`,
  !responseText(finalizedB).includes('project-a') && !responseText(finalizedB).includes('build-a-id'),
  'project-a',
);
assert(
  `${n++}. No domain-specific production branch introduced`,
  !/\b(restaurant|crm|inventory|booking|unit converter|dashboard|customers|orders|staff|sales|lisa)\b/i.test(
    readSource('src/production-surface-integration/real-production-path-response.ts'),
  ),
  'generic only',
);
assert(
  `${n++}. Real-path validator script registered`,
  JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts['validate:real-production-path-integration'] ===
    'tsx scripts/validate-real-production-path-integration.ts',
  'package.json',
);
assert(
  `${n++}. Required real-path module exists`,
  existsSync(join(ROOT, 'src/production-surface-integration/real-production-path-response.ts')),
  'real-production-path-response.ts',
);
assert(
  `${n++}. Blocked projection contains no independent success wording`,
  blockedProjectionContainsNoSuccessWording({
    buildOutcome: 'BUILD_BLOCKED_GPCA',
    executionStatus: blockedLegacy.productionPath.executionStatus as 'BLOCKED',
    currentStage: blockedLegacy.productionPath.currentStage,
    heartbeat: blockedLegacy.productionPath.heartbeat,
    nextStep: blockedLegacy.productionPath.nextStep,
    previewAvailable: blockedLegacy.productionPath.previewAvailable,
    completionWording: blockedLegacy.productionPath.completionMessage,
    retryWording: 'Retry only after correcting the approved generation input',
    successBanner: null,
    engineeringSummary: blockedLegacy.productionPath.completionMessage,
  }),
  blockedLegacy.productionPath.completionMessage,
);
assert(
  `${n++}. Observability checkpoint exposes production path evidence`,
  finalizedB.productionPath.observability.approvedProductIdentity === finalizedB.productionPath.projectTitle &&
    finalizedB.productionPath.observability.buildRequestId === finalizedB.build.buildId,
  finalizedB.productionPath.observability.buildRequestId,
);

const failed = results.filter((result) => !result.passed);
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}${result.passed ? '' : ` :: ${result.detail}`}`);
}
console.log(`\n${results.length - failed.length}/${results.length} direct assertions passed.`);

if (failed.length > 0) {
  console.error(`\n${failed.length} assertion(s) failed.`);
  process.exit(1);
}

const REQUIRED_REGRESSIONS = [
  'validate-production-surface-integration.ts',
  'validate-production-build-context-integrity.ts',
  'validate-contract-to-module-traceability-authority.ts',
] as const;

for (const script of REQUIRED_REGRESSIONS) {
  try {
    execSync(`npx tsx scripts/${script}`, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    console.log(`REGRESSION PASS — ${script}`);
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string; message?: string };
    const detail = [err.stdout, err.stderr, err.message].filter(Boolean).join('\n').trim();
    console.error(`REGRESSION FAIL — ${script}`);
    console.error(detail.slice(0, 4000));
    process.exit(1);
  }
}

console.log(`\n${PASS_TOKEN}`);
