/**
 * Phase 25.36 — Runtime Founder Execution Proof hydration validation (leaf mode).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ConnectedLivePreviewExecutionAssessment } from '../src/connected-live-preview-execution/connected-live-preview-execution-types.js';
import type { ConnectedRuntimeExecutionAssessment } from '../src/connected-runtime-execution/connected-runtime-execution-types.js';
import type { ConnectedVerificationExecutionAssessment } from '../src/connected-verification-execution/connected-verification-execution-types.js';
import type { ConnectedWorkspaceCreationAssessment } from '../src/connected-workspace-creation/connected-workspace-creation-types.js';
import {
  recordConnectedVerificationExecutionAssessment,
  resetConnectedVerificationExecutionModuleForTests,
} from '../src/connected-verification-execution/index.js';
import {
  recordConnectedWorkspaceCreationAssessment,
  resetConnectedWorkspaceCreationModuleForTests,
} from '../src/connected-workspace-creation/index.js';
import {
  resetConnectedRuntimeExecutionModuleForTests,
} from '../src/connected-runtime-execution/index.js';
import {
  resetConnectedLivePreviewExecutionModuleForTests,
} from '../src/connected-live-preview-execution/index.js';
import { assessFounderExecutionProof } from '../src/founder-execution-proof/index.js';
import {
  buildRuntimeFounderExecutionProofInput,
  buildRuntimeFounderExecutionProofInputAsync,
  hydrateRuntimeFounderExecutionProofInput,
  resetFounderTestIntegrationModuleForTests,
  resolveFounderExecutionConnected,
} from '../src/founder-test-integration/index.js';
import { runFounderTestLaunchReadiness } from '../src/founder-test-launch-readiness/index.js';

const PASS_TOKEN = 'RUNTIME_FOUNDER_EXECUTION_PROOF_HYDRATION_PASS';
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 180_000;

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

function resetConnectedModulesForTests(): void {
  resetConnectedWorkspaceCreationModuleForTests();
  resetConnectedRuntimeExecutionModuleForTests();
  resetConnectedLivePreviewExecutionModuleForTests();
  resetConnectedVerificationExecutionModuleForTests();
  resetFounderTestIntegrationModuleForTests();
}

function buildFilesystemEvidence() {
  return {
    readOnly: true as const,
    workspaceExists: true,
    workspaceRootExists: true,
    directoryCount: 2,
    artifactCount: 1,
    creationDurationMs: 12,
    creationSuccessful: true,
    inspectedAt: new Date().toISOString(),
    inspectionSource: 'real-filesystem-inspection' as const,
  };
}

function buildProvenWorkspaceAssessment(): ConnectedWorkspaceCreationAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'CONNECTED_WORKSPACE_CREATION_COMPLETE',
    report: {
      readOnly: true,
      advisoryOnly: true,
      coreQuestion: 'Was workspace created?',
      creationId: 'hydration-test-workspace',
      generatedAt: new Date().toISOString(),
      workspaceCreationScore: 94,
      workspaceState: 'WORKSPACE_CREATED',
      questionAnswers: {
        workspaceCreated: true,
        workspaceExists: true,
        isDisposable: true,
        isIsolated: true,
        world1Protected: true,
        governanceSatisfied: true,
        creationAuditable: true,
        rollbackAvailable: true,
        founderInspectable: true,
        workspaceCreationProven: true,
      },
      creationContract: {
        readOnly: true,
        workspaceId: 'hydration-ws',
        workspaceRoot: '/tmp/hydration-ws',
        logicalRoot: '/tmp/hydration-ws',
        creationTimestamp: new Date().toISOString(),
        creationMode: 'REAL_CREATION',
        createdDirectories: ['src'],
        createdArtifacts: [{ readOnly: true, path: 'src/app.ts', category: 'source', sourceAuthority: 'test' }],
        creationWarnings: [],
        creationEvidence: [],
        filesystemEvidence: buildFilesystemEvidence(),
        realFileMutationPerformed: true,
        world1Protected: true,
        disposableOnly: true,
      },
      blockingReasons: [],
      warningReasons: [],
      recommendedNextActions: [],
      inputSnapshot: {} as never,
      cacheKey: 'hydration-ws',
    },
  } as unknown as ConnectedWorkspaceCreationAssessment;
}

function buildProvenRuntimeAssessment(
  workspace: ConnectedWorkspaceCreationAssessment,
): ConnectedRuntimeExecutionAssessment {
  const buildContract = {
    readOnly: true as const,
    workspaceId: 'hydration-ws',
    workspaceRoot: '/tmp/hydration-ws',
    realBuildPerformed: true,
    buildSuccessful: true,
    buildArtifacts: ['dist/app.js'],
    buildWarnings: [] as string[],
    buildEvidence: [] as never[],
    buildDurationMs: 20,
    world1Protected: true as const,
    disposableOnly: true as const,
  };

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'CONNECTED_RUNTIME_EXECUTION_COMPLETE',
    report: {
      readOnly: true,
      advisoryOnly: true,
      coreQuestion: 'Was runtime activated?',
      executionId: 'hydration-test-runtime',
      generatedAt: new Date().toISOString(),
      runtimeScore: 94,
      runtimeState: 'RUNTIME_ACTIVATED',
      questionAnswers: {
        runtimeActivated: true,
        runtimeRunning: true,
        runtimeEndpointAvailable: true,
        runtimeIsolated: true,
        world1Protected: true,
        activationAuditable: true,
        founderInspectable: true,
        runtimeReadinessProven: true,
        runtimeActivationProven: true,
      },
      activationContract: {
        readOnly: true,
        workspaceId: 'hydration-ws',
        runtimeType: 'NODE',
        runtimeEndpoint: 'http://127.0.0.1:3001',
        realRuntimeLaunchPerformed: true,
        runtimeArtifacts: [{ readOnly: true, path: 'dist/app.js', category: 'build', sourceAuthority: 'test' }],
        activationWarnings: [],
        activationEvidence: {
          readOnly: true,
          startupSucceeded: true,
          runtimeEndpointAvailable: true,
          runtimeProcessObserved: true,
          runtimeHealthCheckPassed: true,
          inspectedAt: new Date().toISOString(),
          inspectionSource: 'real-runtime-activation-inspection',
        },
        world1Protected: true,
        disposableOnly: true,
      },
      blockingReasons: [],
      warningReasons: [],
      recommendedNextActions: [],
      inputSnapshot: {
        readOnly: true,
        connectedWorkspaceCreationAssessment: workspace,
        connectedBuildExecutionFoundationAssessment: null,
        connectedBuildExecutionContract: buildContract,
        connectedRuntimeActivationAssessment: {} as never,
        world2RuntimeAssessment: {} as never,
        executionProofAssessment: null,
        founderAcceptanceAssessment: null,
        missingAuthorities: [],
      },
      cacheKey: 'hydration-runtime',
    },
  } as unknown as ConnectedRuntimeExecutionAssessment;
}

function buildProvenPreviewAssessment(
  workspace: ConnectedWorkspaceCreationAssessment,
  runtime: ConnectedRuntimeExecutionAssessment,
): ConnectedLivePreviewExecutionAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'CONNECTED_LIVE_PREVIEW_EXECUTION_COMPLETE',
    report: {
      readOnly: true,
      advisoryOnly: true,
      coreQuestion: 'Was preview activated?',
      executionId: 'hydration-test-preview',
      generatedAt: new Date().toISOString(),
      previewScore: 94,
      previewState: 'PREVIEW_ACTIVATED',
      previewUrl: 'http://127.0.0.1:3001/preview',
      questionAnswers: {
        previewActivated: true,
        previewReachable: true,
        previewIsolated: true,
        world1Protected: true,
        activationAuditable: true,
        founderInspectable: true,
        previewReadinessProven: true,
        previewActivationProven: true,
      },
      activationContract: {
        readOnly: true,
        workspaceId: 'hydration-ws',
        previewUrl: 'http://127.0.0.1:3001/preview',
        previewType: 'WEB',
        realPreviewLaunchPerformed: true,
        previewArtifacts: [{ readOnly: true, path: 'preview/index.html', category: 'preview', sourceAuthority: 'test' }],
        activationWarnings: [],
        activationEvidence: {
          readOnly: true,
          previewEndpointAvailable: true,
          previewLoadSucceeded: true,
          previewInteractivityObserved: true,
          inspectedAt: new Date().toISOString(),
          inspectionSource: 'real-preview-activation-inspection',
        },
        world1Protected: true,
        disposableOnly: true,
      },
      blockingReasons: [],
      warningReasons: [],
      recommendedNextActions: [],
      inputSnapshot: {
        readOnly: true,
        connectedRuntimeExecutionAssessment: runtime,
        connectedWorkspaceCreationAssessment: workspace,
        connectedBuildExecutionFoundationAssessment: null,
        connectedLivePreviewFoundationAssessment: {} as never,
        executionProofAssessment: null,
        founderAcceptanceAssessment: null,
        missingAuthorities: [],
      },
      cacheKey: 'hydration-preview',
    },
  } as unknown as ConnectedLivePreviewExecutionAssessment;
}

function buildProvenVerificationAssessment(
  workspace: ConnectedWorkspaceCreationAssessment,
  runtime: ConnectedRuntimeExecutionAssessment,
  preview: ConnectedLivePreviewExecutionAssessment,
): ConnectedVerificationExecutionAssessment {
  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'CONNECTED_VERIFICATION_EXECUTION_COMPLETE',
    report: {
      readOnly: true,
      advisoryOnly: true,
      coreQuestion: 'Was verification executed?',
      executionId: 'hydration-test-verification',
      generatedAt: new Date().toISOString(),
      verificationScore: 94,
      verificationState: 'VERIFICATION_EXECUTED',
      questionAnswers: {
        verificationExecuted: true,
        checksActuallyRun: true,
        resultsCollected: true,
        verificationArtifactsGenerated: true,
        executionIsolated: true,
        world1Protected: true,
        verificationAuditable: true,
        founderInspectable: true,
        verificationReadinessProven: true,
        verificationExecutionProven: true,
      },
      executionContract: {
        readOnly: true,
        verificationId: 'ver-1',
        workspaceId: 'hydration-ws',
        previewUrl: 'http://127.0.0.1:3001/preview',
        verificationPlan: ['load', 'inspect'],
        verificationDurationMs: 30,
        verificationResults: [],
        verificationArtifacts: [{ readOnly: true, path: 'verification/report.json', category: 'report', sourceAuthority: 'test' }],
        verificationEvidence: [],
        verificationWarnings: [],
        verificationDiagnostics: [],
        executionEvidence: {
          readOnly: true,
          verificationStarted: true,
          verificationCompleted: true,
          verificationChecksExecuted: 3,
          verificationArtifactsGenerated: true,
          verificationCoverageCollected: true,
          verificationSucceeded: true,
          previewProbeStatus: 'PASS',
          workspaceEvidenceStatus: 'PASS',
          runtimeEvidenceStatus: 'PASS',
          previewEvidenceStatus: 'PASS',
          inspectedAt: new Date().toISOString(),
          inspectionSource: 'real-verification-execution-inspection',
        },
        realVerificationExecutionPerformed: true,
        world1Protected: true,
        disposableOnly: true,
      },
      blockingReasons: [],
      warningReasons: [],
      recommendedNextActions: [],
      inputSnapshot: {
        readOnly: true,
        connectedLivePreviewExecutionAssessment: preview,
        connectedRuntimeExecutionAssessment: runtime,
        connectedWorkspaceCreationAssessment: workspace,
        connectedBuildExecutionFoundationAssessment: null,
        connectedVerificationFoundationAssessment: {} as never,
        verificationRealityAssessment: {} as never,
        dryRunVerifierAssessment: {} as never,
        executionVerificationReport: {} as never,
        executionProofAssessment: null,
        founderAcceptanceAssessment: null,
        missingAuthorities: [],
      },
      cacheKey: 'hydration-verification',
    },
  } as unknown as ConnectedVerificationExecutionAssessment;
}

function buildFullProvenChainInput() {
  const workspace = buildProvenWorkspaceAssessment();
  const runtime = buildProvenRuntimeAssessment(workspace);
  const preview = buildProvenPreviewAssessment(workspace, runtime);
  const verification = buildProvenVerificationAssessment(workspace, runtime, preview);
  return {
    rootDir: ROOT,
    connectedWorkspaceCreationAssessment: workspace,
    connectedRuntimeExecutionAssessment: runtime,
    connectedLivePreviewExecutionAssessment: preview,
    connectedVerificationExecutionAssessment: verification,
  };
}

async function validateInsufficientEvidencePath(): Promise<void> {
  resetConnectedModulesForTests();
  const hydrated = await hydrateRuntimeFounderExecutionProofInput(ROOT);
  assert(
    'empty stores yield insufficient-evidence hydration',
    hydrated.hydration.source === 'insufficient-evidence' && !hydrated.hydration.hydrated,
    JSON.stringify(hydrated.hydration),
  );
  assert(
    'insufficient path remains blocked in proof authority',
    hydrated.input.connectedWorkspaceCreationAssessment == null,
    'workspace assessment missing',
  );
  const proof = assessFounderExecutionProof(hydrated.input);
  assert(
    'insufficient evidence remains blocked',
    proof.report.questionAnswers.founderExecutionProven === false,
    proof.report.founderExecutionState,
  );
  const resolved = resolveFounderExecutionConnected({ founderExecutionProofAssessment: proof });
  assert(
    'resolver stays not-proven without evidence',
    resolved.executionConnected === false && resolved.source === 'not-proven',
    resolved.source,
  );
}

async function validateSessionAssessmentHydration(): Promise<void> {
  resetConnectedModulesForTests();
  const workspace = buildProvenWorkspaceAssessment();
  recordConnectedWorkspaceCreationAssessment(workspace);
  const partialInput = buildRuntimeFounderExecutionProofInput(ROOT);
  assert(
    'partial session assessment hydrates input objects',
    partialInput.connectedWorkspaceCreationAssessment != null,
    'workspace not hydrated',
  );
  const partialProof = assessFounderExecutionProof(partialInput);
  assert(
    'partial evidence remains blocked',
    partialProof.report.questionAnswers.founderExecutionProven === false,
    partialProof.report.founderExecutionState,
  );
}

async function validateFullChainHydration(): Promise<void> {
  resetConnectedModulesForTests();
  const fullInput = buildFullProvenChainInput();
  recordConnectedVerificationExecutionAssessment(
    fullInput.connectedVerificationExecutionAssessment!,
  );
  const hydrated = await hydrateRuntimeFounderExecutionProofInput(ROOT);
  assert(
    'full chain hydrates from session assessments',
    hydrated.hydration.hydrated && hydrated.hydration.source === 'session-assessments',
    JSON.stringify(hydrated.hydration),
  );
  assert(
    'hydrated input includes verification assessment object',
    hydrated.input.connectedVerificationExecutionAssessment != null &&
      hydrated.input.connectedRuntimeExecutionAssessment != null,
    'missing connected objects',
  );
  const proof = assessFounderExecutionProof(hydrated.input);
  assert(
    'full connected assessment input proves founderExecutionProven',
    proof.report.questionAnswers.founderExecutionProven === true,
    JSON.stringify(proof.report.questionAnswers),
  );
  const resolved = resolveFounderExecutionConnected({ founderExecutionProofAssessment: proof });
  assert(
    'resolver returns executionConnected=true only after full bounded proof',
    resolved.executionConnected === true && resolved.founderExecutionProven === true,
    JSON.stringify(resolved),
  );
}

function validateNoPassTokenProof(): void {
  const hydrationSource = readText('src/founder-test-integration/runtime-founder-execution-proof-hydration.ts');
  assert(
    'hydration does not use pass tokens as proof',
    !hydrationSource.includes('PASS_TOKEN') && !hydrationSource.includes('_PASS'),
    'pass token reference found',
  );
  assert(
    'hydration does not use history metadata scores as proof',
    !hydrationSource.includes('HistoryEntry') && !hydrationSource.includes('workspaceCreationScore'),
    'history metadata used',
  );
}

function validateApiAndReportWiring(): void {
  const handler = readText('server/founder-testing-handler.ts');
  const reportBuilder = readText('src/founder-test-launch-readiness/founder-test-launch-readiness-report-builder.ts');
  assert(
    'API path uses async hydrated builder',
    handler.includes('buildRuntimeFounderExecutionProofInputAsync'),
    'handler missing async builder',
  );
  assert(
    'launch readiness report exposes hydration section',
    reportBuilder.includes('Runtime Founder Execution Proof Hydration'),
    'report section missing',
  );
}

async function validateLaunchReadinessHydrationReport(): Promise<void> {
  resetConnectedModulesForTests();
  const fullInput = buildFullProvenChainInput();
  const launch = runFounderTestLaunchReadiness({
    rootDir: ROOT,
    founderExecutionProofInput: fullInput,
    runtimeProofHydration: {
      readOnly: true,
      hydrated: true,
      source: 'session-assessments',
      missing: [],
      warnings: [],
      executionConnectedSource: 'hydrated-proof',
      stageProven: {
        workspace: true,
        build: true,
        runtime: true,
        preview: true,
        verification: true,
      },
    },
  });
  assert(
    'launch readiness report includes hydration metadata',
    launch.report.runtimeProofHydration.hydrated === true &&
      launch.report.runtimeProofHydrationSummary.includes('Hydrated: yes'),
    launch.report.runtimeProofHydrationSummary,
  );
}

function validateNoNewAuthoritySystem(): void {
  const files = [
    'src/founder-test-integration/runtime-founder-execution-proof-hydration.ts',
    'src/founder-test-integration/founder-execution-connected-resolver.ts',
  ];
  for (const file of files) {
    const text = readText(file);
    assert(
      `no new authority module in ${file}`,
      !text.includes('assessFounderExecutionProofAuthority') &&
        !text.includes('new scoring engine'),
      file,
    );
  }
}

async function main(): Promise<void> {
  console.log('Phase 25.36 — Runtime Founder Execution Proof Hydration validation\n');

  validateNoPassTokenProof();
  validateApiAndReportWiring();
  validateNoNewAuthoritySystem();
  checkpoint('static checks');

  await validateInsufficientEvidencePath();
  checkpoint('insufficient evidence');

  await validateSessionAssessmentHydration();
  checkpoint('partial hydration');

  await validateFullChainHydration();
  checkpoint('full chain hydration');

  await validateLaunchReadinessHydrationReport();
  checkpoint('launch readiness report');

  const failed = results.filter((r) => !r.passed);
  console.log(`\nResults: ${results.length - failed.length}/${results.length} passed`);
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
