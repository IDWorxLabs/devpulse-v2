/**
 * Phase 25.34 — Founder Execution Proof propagation validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  FounderExecutionProofAssessment,
  StageExecutionEvidence,
} from '../src/founder-execution-proof/founder-execution-proof-types.js';
import {
  assessFounderTestIntegration,
  resetFounderTestIntegrationModuleForTests,
  resolveFounderExecutionConnected,
  resolveExecutionConnectedForRoot,
} from '../src/founder-test-integration/index.js';
import { collectUpstreamRealityBundle } from '../src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';

const PASS_TOKEN = 'FOUNDER_EXECUTION_PROOF_PROPAGATION_PASS';
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 120_000;

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function buildProvenStage(
  stage: StageExecutionEvidence['stage'],
): StageExecutionEvidence {
  return {
    readOnly: true,
    stage,
    proven: true,
    state: 'PROVEN',
    score: 94,
    proofPercent: 94,
    sourceAuthority: 'validate-founder-execution-proof-propagation',
    evidenceSummary: `${stage} proven for propagation test`,
    artifactPaths: [],
  };
}

function buildProvenFounderExecutionProofAssessment(): FounderExecutionProofAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_EXECUTION_PROOF_COMPLETE',
    report: {
      readOnly: true,
      advisoryOnly: true,
      coreQuestion: 'Is founder execution proven?',
      proofId: 'propagation-test-proof',
      generatedAt: new Date().toISOString(),
      founderExecutionScore: 94,
      founderExecutionState: 'FOUNDER_EXECUTION_PROVEN',
      launchRecommendation: 'RECOMMEND_LAUNCH_WITH_WARNINGS',
      launchConfidence: 82,
      executionCompleteness: {
        readOnly: true,
        workspaceProofPercent: 94,
        buildProofPercent: 94,
        runtimeProofPercent: 94,
        previewProofPercent: 94,
        verificationProofPercent: 94,
        executionChainPercent: 94,
        launchReadinessPercent: 72,
        overallFounderProofPercent: 94,
      },
      topEvidence: ['Full chain proven in propagation fixture'],
      topBlockers: [],
      topWarnings: [],
      missingProofAreas: [],
      recommendedNextActions: [],
      questionAnswers: {
        workspaceActuallyCreated: true,
        buildActuallyExecuted: true,
        runtimeActuallyActivated: true,
        previewActuallyActivated: true,
        verificationActuallyExecuted: true,
        executionChainConnected: true,
        founderCanInspectEvidence: true,
        blockersPresent: false,
        launchReadinessProven: false,
        founderExecutionProven: true,
      },
      proofBundle: {
        readOnly: true,
        proofBundleId: 'propagation-bundle',
        workspaceEvidence: buildProvenStage('WORKSPACE'),
        buildEvidence: buildProvenStage('BUILD'),
        runtimeEvidence: buildProvenStage('RUNTIME'),
        previewEvidence: buildProvenStage('PREVIEW'),
        verificationEvidence: buildProvenStage('VERIFICATION'),
        executionChainEvidence: {
          readOnly: true,
          connected: true,
          state: 'EXECUTION_CHAIN_CONNECTED',
          score: 94,
          proofPercent: 94,
          sourceAuthority: 'validate-founder-execution-proof-propagation',
          evidenceSummary: 'Chain connected',
        },
        launchEvidence: {
          readOnly: true,
          launchReadinessProven: false,
          launchCouncilVerdict: 'WARN',
          founderAcceptanceState: 'PARTIAL',
          proofPercent: 72,
          sourceAuthority: 'validate-founder-execution-proof-propagation',
          evidenceSummary: 'Launch not fully proven',
        },
        proofArtifacts: [],
        proofWarnings: [],
        proofBlockers: [],
      },
      inputSnapshot: {
        readOnly: true,
        connectedWorkspaceCreationAssessment: null,
        connectedRuntimeExecutionAssessment: null,
        connectedLivePreviewExecutionAssessment: null,
        connectedVerificationExecutionAssessment: null,
        endToEndExecutionProofAssessment: null,
        founderTestExecutionChainAssessment: null,
        founderTestLaunchReadinessAssessment: null,
        executionProofAssessment: null,
        founderAcceptanceAssessment: null,
        launchCouncilAssessment: null,
        missingAuthorities: [],
      },
      blockingReasons: [],
      warningReasons: [],
      cacheKey: 'propagation-test',
    },
  };
}

function validateSourceWiring(): void {
  const orchestrator = readText('src/founder-test-integration/founder-test-integration-orchestrator.ts');
  const authority = readText('src/founder-test-integration/founder-test-integration-authority.ts');
  const analyzers = readText('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.ts');
  const handler = readText('server/founder-testing-handler.ts');
  const snapshot = readText('server/product-workspace-snapshot.ts');

  assert(
    'orchestrator uses resolved executionConnected param in requirement reality',
    /collectRequirementReality\(rootDir,\s*executionConnected\)/.test(orchestrator) &&
      orchestrator.includes('executionConnected,') &&
      !orchestrator.includes('executionConnected: false,'),
    'collectRequirementReality must not hardcode executionConnected: false',
  );

  assert(
    'orchestrator passes executionConnected to live preview collector',
    /collectLivePreviewReality\(rootDir,\s*executionConnected\)/.test(orchestrator) &&
      orchestrator.includes('buildPreviewWorkspaceSignalsFromLegacy(legacyInput, executionConnected'),
    'Live preview must receive resolvedExecutionConnected',
  );

  assert(
    'orchestrator passes executionConnected to verification collector',
    /collectVerificationReality\(rootDir,\s*executionConnected\)/.test(orchestrator) &&
      orchestrator.includes('buildVerificationWorkspaceSignalsForValidation(moduleEvidence, { executionConnected })'),
    'Verification must receive resolvedExecutionConnected',
  );

  assert(
    'upstream bundle accepts builderExecutionConnected override',
    analyzers.includes('builderExecutionConnected = false') &&
      analyzers.includes('builderExecutionConnected,') &&
      !analyzers.includes('builderExecutionConnected: false,'),
    'collectUpstreamRealityBundle must not hardcode builderExecutionConnected: false',
  );

  const authorityProofIndex = authority.indexOf('assessFounderExecutionProof(');
  const authorityRunIndex = authority.indexOf('runFounderTestIntegration(');
  assert(
    'assessFounderTestIntegration assesses proof before authorities',
    authorityProofIndex >= 0 &&
      authorityRunIndex >= 0 &&
      authorityProofIndex < authorityRunIndex,
    `proof at ${authorityProofIndex}, run at ${authorityRunIndex}`,
  );

  assert(
    'API founder-test run builds hydrated founderExecutionProofInput',
    handler.includes('buildRuntimeFounderExecutionProofInputAsync') &&
      handler.includes('founderExecutionProofInput: hydrated.input'),
    'founder-testing-handler must wire hydrated founderExecutionProofInput',
  );

  assert(
    'product workspace snapshot uses resolved execution truth',
    snapshot.includes('resolveExecutionConnectedForRoot') &&
      snapshot.includes('executionConnected,') &&
      !snapshot.includes('executionConnected: false,'),
    'product-workspace-snapshot must not hardcode executionConnected: false',
  );
}

function validateResolver(): void {
  const proven = buildProvenFounderExecutionProofAssessment();
  const resolved = resolveFounderExecutionConnected({ founderExecutionProofAssessment: proven });
  assert(
    'resolveFounderExecutionConnected true for bounded proven proof',
    resolved.executionConnected === true && resolved.founderExecutionProven === true,
    JSON.stringify(resolved),
  );

  const notProven = resolveFounderExecutionConnected({ founderExecutionProofAssessment: null });
  assert(
    'resolveFounderExecutionConnected false when proof missing',
    notProven.executionConnected === false && notProven.source === 'missing-proof',
    JSON.stringify(notProven),
  );
}

function validateAuthorityPropagation(): void {
  resetFounderTestIntegrationModuleForTests();
  const proven = buildProvenFounderExecutionProofAssessment();

  const disconnected = assessFounderTestIntegration({
    rootDir: ROOT,
    resolvedExecutionConnected: false,
    founderExecutionProofAssessment: proven,
  });
  const connected = assessFounderTestIntegration({
    rootDir: ROOT,
    resolvedExecutionConnected: true,
    founderExecutionProofAssessment: proven,
  });

  const reqDisconnected = disconnected.run.authorityResults.find(
    (r) => r.authorityId === 'REQUIREMENT_REALITY',
  );
  const reqConnected = connected.run.authorityResults.find((r) => r.authorityId === 'REQUIREMENT_REALITY');
  assert(
    'requirement reality score reflects resolvedExecutionConnected',
    reqConnected !== undefined &&
      reqDisconnected !== undefined &&
      reqConnected.normalizedScore >= reqDisconnected.normalizedScore,
    `disconnected=${reqDisconnected?.normalizedScore} connected=${reqConnected?.normalizedScore}`,
  );

  const previewConnected = connected.run.authorityResults.find(
    (r) => r.authorityId === 'LIVE_PREVIEW_REALITY',
  );
  const verifyConnected = connected.run.authorityResults.find(
    (r) => r.authorityId === 'VERIFICATION_REALITY',
  );
  assert(
    'live preview and verification authorities present when connected',
    previewConnected !== undefined && verifyConnected !== undefined,
    'missing preview or verification authority results',
  );

  const founderConnected = connected.run.authorityResults.find((r) => r.authorityId === 'FOUNDER_REALITY');
  assert(
    'founder reality authority present with connected propagation',
    founderConnected !== undefined,
    'missing founder reality authority',
  );
}

function validateUpstreamBundle(): void {
  const disconnected = collectUpstreamRealityBundle(ROOT, false);
  const connected = collectUpstreamRealityBundle(ROOT, true);
  assert(
    'upstream bundle builderExecutionConnected follows override',
    disconnected.builderExecutionConnected === false && connected.builderExecutionConnected === true,
    `disconnected=${disconnected.builderExecutionConnected} connected=${connected.builderExecutionConnected}`,
  );
  assert(
    'connected upstream improves builder score vs disconnected',
    connected.builderScore >= disconnected.builderScore,
    `disconnected=${disconnected.builderScore} connected=${connected.builderScore}`,
  );
}

function validateProductSnapshot(): void {
  const snapshot = buildProductWorkspaceSnapshot([], { rootDir: ROOT });
  const resolved = resolveExecutionConnectedForRoot(ROOT);
  assert(
    'product snapshot autonomousBuilder.executionConnected matches resolver',
    snapshot.autonomousBuilder.executionConnected === resolved.executionConnected,
    `snapshot=${snapshot.autonomousBuilder.executionConnected} resolver=${resolved.executionConnected}`,
  );
}

function main(): void {
  console.log('Phase 25.34 — Founder Execution Proof Propagation validation\n');

  validateSourceWiring();
  checkpoint('source wiring');

  validateResolver();
  checkpoint('resolver');

  validateAuthorityPropagation();
  checkpoint('authority propagation');

  validateUpstreamBundle();
  checkpoint('upstream bundle');

  validateProductSnapshot();
  checkpoint('product snapshot');

  const failed = results.filter((r) => !r.passed);
  const passed = results.filter((r) => r.passed);

  console.log(`\nResults: ${passed.length}/${results.length} passed`);
  for (const result of results) {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}: ${result.detail}`);
  }

  if (failed.length > 0) {
    console.error(`\n${failed.length} scenario(s) failed.`);
    process.exit(1);
  }

  console.log(`\n${PASS_TOKEN}`);
}

main();
