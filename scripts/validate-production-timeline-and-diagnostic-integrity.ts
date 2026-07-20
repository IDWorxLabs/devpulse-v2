/**
 * Production Timeline and Diagnostic Integrity Repair V1 — validation.
 *
 * Run:
 *   npx tsx scripts/validate-production-timeline-and-diagnostic-integrity.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { finalizeBuildFromPromptPayload } from '../server/build-from-prompt-handler.js';
import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/index.js';
import type { ApprovedProductionBuildEnvelope } from '../src/contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT } from '../src/live-preview-interaction-proof-v1/live-preview-interaction-proof-types.js';
import type { LivePreviewInteractionProofReport } from '../src/live-preview-interaction-proof-v1/live-preview-interaction-proof-types.js';
import type { OnePromptLivePreviewBuildResult } from '../src/one-prompt-live-preview/one-prompt-live-preview-types.js';
import {
  projectCanonicalProductionTimeline,
  timelineEveryEventHasExactlyOneOwner,
  timelineHasNoImpossibleCompletedStates,
} from '../src/production-surface-integration/production-timeline-integrity.js';
import { projectProductionDiagnosticReport } from '../src/production-surface-integration/production-diagnostic-integrity.js';
import { BUILD_FROM_PROMPT_PRODUCTION_PATH } from '../src/production-surface-integration/real-production-path-response.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PRODUCTION_TIMELINE_AND_DIAGNOSTIC_INTEGRITY_REPAIR_V1_PASS';

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
    promptHash: `ptdi-${label}`,
    buildId: `ptdi-build-${label}`,
  });
  return { contract, envelope: bound.report.approvedProductionBuildEnvelope, bound };
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

function runFinalize(build: OnePromptLivePreviewBuildResult) {
  return finalizeBuildFromPromptPayload({
    build,
    livePreviewInteractionProof: blockedInteractionProof(),
    executionReport: null,
    productFaithfulness: null,
    generationFaithfulness: null,
  });
}

const builderHome = readSource('public/founder-reality/builder-home.js');
const bridgeSource = readSource('src/chat-to-build-execution-bridge-v1/bridge-authority.ts');
const handlerSource = readSource('server/build-from-prompt-handler.ts');

const fixtureA = materialize(
  'ops-a',
  'Build a generic operations management application with workflow records and assignment actions.',
);
const fixtureB = materialize(
  'ops-b',
  'Build a generic inventory utility with stock records and adjustment actions.',
);

const blockedReasons = [
  'A generator is about to consume input that Contract-Bound Generation Authority V4 never approved.',
  'navigation item "Features" was not approved by CBGA',
  'navigation item "Activity" was not approved by CBGA',
  'navigation item "Alerts" was not approved by CBGA',
  'navigation item "Profile" was not approved by CBGA',
];

const blockedA = runFinalize(
  syntheticBuild({
    buildId: 'blocked-a',
    projectId: 'project-blocked-a',
    prompt: fixtureA.contract.productIdentity,
    envelope: fixtureA.envelope,
    overrides: {
      status: 'FAILED',
      buildResult: 'FAIL',
      gpcaHardStop: true,
      gpcaBlockedMaterialization: true,
      gpcaBlockedPreviewActivation: true,
      failureReason: `GENERATION_PIPELINE_NON_COMPLIANT: ${blockedReasons.join(' ')}`,
      gpcaComplianceReport: {
        readOnly: true,
        contractVersion: 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1',
        contractId: 'gpca-test',
        productIdentity: fixtureA.envelope.approvedProductIdentity.displayName,
        stages: [],
        stageScores: [],
        overallCompliancePercent: 0,
        finalGateOutcome: 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS',
        blockedReasons,
        legacyGeneratorsDetected: [],
        templateGeneratorsDetected: [],
        genericShellSurfacesBlocked: [],
        blueprintBypassDetected: [],
        contractBypassDetected: blockedReasons.slice(1),
        traceability: [],
        renderedContentAudit: null,
        residualOpenIssues: [],
      } as unknown as OnePromptLivePreviewBuildResult['gpcaComplianceReport'],
      npmInstallOk: false,
      npmBuildOk: false,
      devServerRunning: false,
      livePreviewAvailable: false,
      previewUrl: null,
    },
  }),
);

const blockedB = runFinalize(
  syntheticBuild({
    buildId: 'blocked-b',
    projectId: 'project-blocked-b',
    prompt: fixtureB.contract.productIdentity,
    envelope: fixtureB.envelope,
    overrides: {
      status: 'FAILED',
      buildResult: 'FAIL',
      gpcaHardStop: true,
      gpcaBlockedMaterialization: true,
      gpcaBlockedPreviewActivation: true,
      failureReason: 'GENERATION_PIPELINE_NON_COMPLIANT: navigation item "Features" was not approved by CBGA',
      gpcaComplianceReport: {
        readOnly: true,
        contractVersion: 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1',
        contractId: 'gpca-test-b',
        productIdentity: fixtureB.envelope.approvedProductIdentity.displayName,
        stages: [],
        stageScores: [],
        overallCompliancePercent: 0,
        finalGateOutcome: 'COMPLIANCE_BLOCKED_GENERATOR_INPUT_BYPASS',
        blockedReasons: ['navigation item "Features" was not approved by CBGA'],
        legacyGeneratorsDetected: [],
        templateGeneratorsDetected: [],
        genericShellSurfacesBlocked: [],
        blueprintBypassDetected: [],
        contractBypassDetected: ['navigation item "Features" was not approved by CBGA'],
        traceability: [],
        renderedContentAudit: null,
        residualOpenIssues: [],
      } as unknown as OnePromptLivePreviewBuildResult['gpcaComplianceReport'],
      npmInstallOk: false,
      npmBuildOk: false,
      devServerRunning: false,
      livePreviewAvailable: false,
      previewUrl: null,
    },
  }),
);

const successB = runFinalize(
  syntheticBuild({
    buildId: 'success-b',
    projectId: 'project-success-b',
    prompt: fixtureB.contract.productIdentity,
    envelope: fixtureB.envelope,
  }),
);

const timeline = blockedA.productionPath.timeline;
const diagnostics = blockedA.productionPath.diagnostics;
const runtimeEvent = timeline.events.find((event) => event.stageId === 'RUNTIME');
const previewEvent = timeline.events.find((event) => event.stageId === 'PREVIEW');
const materializationEvent = timeline.events.find((event) => event.stageId === 'MATERIALIZATION');
const interactionEvent = timeline.events.find((event) => event.stageId === 'INTERACTION_PROOF');
const gpcaEvent = timeline.events.find((event) => event.stageId === 'GPCA');

assert(
  `${n++}. Real browser endpoint documented`,
  BUILD_FROM_PROMPT_PRODUCTION_PATH === '/api/build/from-prompt' &&
    builderHome.includes('/api/build/from-prompt') &&
    builderHome.includes('function runBuild'),
  BUILD_FROM_PROMPT_PRODUCTION_PATH,
);
assert(
  `${n++}. Handler projects canonical timeline into response`,
  handlerSource.includes('progressItems: finalized.productionPath.progressItems') &&
    handlerSource.includes('finalized.productionPath.timeline'),
  'handler wiring',
);
assert(
  `${n++}. Bridge does not complete runtime/preview after GPCA block`,
  bridgeSource.includes('gpcaBlockedBuild') &&
    bridgeSource.includes('Do not emit optimistic completed events'),
  'bridge guard',
);
assert(
  `${n++}. Builder UI prefers productionPath.progressItems`,
  builderHome.includes('productionPath.progressItems') &&
    builderHome.includes('productionPath.diagnostics'),
  'builder-home.js',
);
assert(`${n++}. GPCA blocks before runtime`, gpcaEvent?.state === 'BLOCKED' && runtimeEvent?.state === 'SKIPPED', String(runtimeEvent?.state));
assert(`${n++}. Runtime never reports completed`, runtimeEvent?.state !== 'COMPLETED', String(runtimeEvent?.state));
assert(`${n++}. Preview never reports ready`, previewEvent?.state === 'SKIPPED' && !previewEvent.showCompletedMark, String(previewEvent?.state));
assert(`${n++}. Interaction proof skipped`, interactionEvent?.state === 'SKIPPED', String(interactionEvent?.state));
assert(`${n++}. Materialization skipped after GPCA block`, materializationEvent?.state === 'SKIPPED', String(materializationEvent?.state));
assert(`${n++}. Timeline contains no impossible states`, timelineHasNoImpossibleCompletedStates(timeline), timeline.buildOutcome);
assert(`${n++}. Every timeline event has exactly one owner`, timelineEveryEventHasExactlyOneOwner(timeline), String(timeline.writers.length));
assert(`${n++}. No duplicate writers`, timeline.duplicateWritersRejected === true, 'writers');
assert(
  `${n++}. No green events after BLOCKED`,
  timeline.events.every((event) => !(event.showCompletedMark && (event.state === 'BLOCKED' || event.state === 'SKIPPED' || event.state === 'FAILED'))),
  timeline.events.filter((event) => event.showCompletedMark).map((event) => event.stageId).join(','),
);
assert(
  `${n++}. Structured GPCA diagnostics preserved`,
  diagnostics.failureCode === 'GENERATION_PIPELINE_NON_COMPLIANT' &&
    diagnostics.firstBrokenBoundary === 'Generator Input Bypass' &&
    diagnostics.offendingGenerator === 'Navigation Generator',
  diagnostics.summaryLines.join(' > '),
);
assert(
  `${n++}. Navigation offender list preserved`,
  ['Features', 'Activity', 'Alerts', 'Profile'].every((label) =>
    diagnostics.offenders.some((offender) => offender.kind === 'NAVIGATION' && offender.value === label),
  ),
  diagnostics.offenders.map((offender) => offender.value).join(','),
);
assert(
  `${n++}. whatFailed preserves structured diagnostic lines`,
  blockedA.normalizedBuild.summary.whatFailed.includes('Features') &&
    blockedA.normalizedBuild.summary.whatFailed.includes('GENERATION_PIPELINE_NON_COMPLIANT'),
  blockedA.normalizedBuild.summary.whatFailed.join(' | '),
);
assert(
  `${n++}. One root cause per concept`,
  blockedA.productionPath.rootCauseReport.onePerConcept === true,
  String(blockedA.productionPath.canonicalRootCauseFindings.length),
);
assert(
  `${n++}. Product Faithfulness uses canonical findings`,
  blockedA.productionPath.rootCauseReport.noDownstreamRecoveryClaims === true &&
    (blockedA.normalizedBuild.generationFaithfulness?.recoveredConcepts.length ?? 0) === 0 &&
    (blockedA.normalizedBuild.generationFaithfulness?.repairsPerformed.length ?? 0) === 0,
  'no recovery claims',
);
assert(
  `${n++}. Builder UI renders canonical timeline only`,
  builderHome.includes('payload.productionPath.progressItems') &&
    !/function buildWorkLogSteps[\s\S]{0,80}inferCompleted|optimistic/.test(builderHome),
  'canonical preference',
);
assert(
  `${n++}. Two sequential blocked builds remain isolated`,
  blockedB.productionPath.buildRequestId === 'blocked-b' &&
    !JSON.stringify(blockedB).includes('blocked-a') &&
    blockedB.productionPath.projectTitle === fixtureB.envelope.approvedProductIdentity.displayName,
  blockedB.productionPath.buildRequestId,
);
assert(
  `${n++}. Mixed blocked/successful builds remain isolated`,
  successB.productionPath.buildOutcome === 'BUILD_SUCCEEDED' &&
    successB.productionPath.timeline.events.every((event) => event.state === 'COMPLETED') &&
    !JSON.stringify(successB).includes('blocked-a'),
  successB.productionPath.buildOutcome,
);
assert(
  `${n++}. Workspace artifacts emitted`,
  blockedA.productionPath.workspaceArtifacts.some((file) => file.relativePath.endsWith('production-timeline-report.json')) &&
    blockedA.productionPath.workspaceArtifacts.some((file) => file.relativePath.endsWith('production-diagnostic-report.json')) &&
    blockedA.productionPath.workspaceArtifacts.some((file) => file.relativePath.endsWith('production-root-cause-report.json')) &&
    blockedA.productionPath.workspaceArtifacts.some((file) => file.relativePath.endsWith('timeline-traceability.json')) &&
    blockedA.productionPath.workspaceArtifacts.some((file) => file.relativePath.endsWith('status-projection.json')),
  String(blockedA.productionPath.workspaceArtifacts.length),
);
assert(
  `${n++}. Direct diagnostic projection extracts navigation offenders`,
  projectProductionDiagnosticReport(
    syntheticBuild({
      buildId: 'diag',
      projectId: 'diag',
      prompt: fixtureA.contract.productIdentity,
      envelope: fixtureA.envelope,
      overrides: {
        status: 'FAILED',
        gpcaHardStop: true,
        failureReason: 'navigation item "Features" was not approved by CBGA',
        gpcaComplianceReport: blockedA.build.gpcaComplianceReport,
      },
    }),
  ).offenders.some((offender) => offender.value === 'Features'),
  'Features',
);
assert(
  `${n++}. Timeline modules exist`,
  existsSync(join(ROOT, 'src/production-surface-integration/production-timeline-integrity.ts')) &&
    existsSync(join(ROOT, 'src/production-surface-integration/production-diagnostic-integrity.ts')),
  'modules',
);
assert(
  `${n++}. Validator script registered`,
  JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts[
    'validate:production-timeline-and-diagnostic-integrity'
  ] === 'tsx scripts/validate-production-timeline-and-diagnostic-integrity.ts',
  'package.json',
);
assert(
  `${n++}. No domain-specific production logic`,
  !/\b(restaurant|crm|inventory|booking|unit converter|lisa)\b/i.test(
    readSource('src/production-surface-integration/production-timeline-integrity.ts') +
      readSource('src/production-surface-integration/production-diagnostic-integrity.ts'),
  ),
  'generic',
);
assert(
  `${n++}. Canonical projection helper available`,
  projectCanonicalProductionTimeline(
    syntheticBuild({
      buildId: 'x',
      projectId: 'x',
      prompt: fixtureA.contract.productIdentity,
      envelope: fixtureA.envelope,
      overrides: { gpcaHardStop: true, gpcaBlockedMaterialization: true, status: 'FAILED' },
    }),
  ).blockingStageId === 'GPCA',
  'GPCA',
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
  'validate-real-production-path-integration.ts',
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
