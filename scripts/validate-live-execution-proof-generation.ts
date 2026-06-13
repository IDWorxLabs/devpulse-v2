/**
 * Phase 25.35 — Live Execution Proof Generation audit validation (read-only diagnostic).
 * Does NOT modify production behavior — verifies the live path and identifies failure reason.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessFounderTestIntegration,
  buildRuntimeFounderExecutionProofInput,
  resetFounderTestIntegrationModuleForTests,
  resolveFounderExecutionConnected,
} from '../src/founder-test-integration/index.js';
import { assessFounderExecutionProof } from '../src/founder-execution-proof/index.js';
import { buildFounderTestLaunchReadinessArtifacts } from '../src/founder-test-launch-readiness/index.js';
import { getConnectedWorkspaceCreationHistorySize } from '../src/connected-workspace-creation/index.js';
import { getConnectedRuntimeExecutionHistorySize } from '../src/connected-runtime-execution/index.js';
import { getConnectedLivePreviewExecutionHistorySize } from '../src/connected-live-preview-execution/index.js';
import { getConnectedVerificationExecutionHistorySize } from '../src/connected-verification-execution/index.js';

const PASS_TOKEN = 'LIVE_EXECUTION_PROOF_GENERATION_AUDIT_PASS';
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

interface LiveProofDiagnostic {
  proofInputKeys: string[];
  missingAuthorities: string[];
  founderExecutionProven: boolean;
  executionChainConnected: boolean;
  resolvedExecutionConnected: boolean;
  resolvedSource: string;
  founderExecutionState: string;
  overallFounderProofPercent: number;
  stageEvidence: Record<
    string,
    { proven: boolean; state: string; summary: string }
  >;
  topBlockers: string[];
  firstFailureStage: string;
  firstFailureReason: string;
  integrationScore: number;
  integrationVerdict: string;
  launchVerdict: string;
  connectedHistorySizes: Record<string, number>;
}

function diagnoseLiveProofPath(): LiveProofDiagnostic {
  resetFounderTestIntegrationModuleForTests();

  const proofInput = buildRuntimeFounderExecutionProofInput(ROOT);
  const proof = assessFounderExecutionProof(proofInput);
  const resolved = resolveFounderExecutionConnected({ founderExecutionProofAssessment: proof });
  const integration = assessFounderTestIntegration({
    rootDir: ROOT,
    founderExecutionProofInput: proofInput,
  });
  const launch = buildFounderTestLaunchReadinessArtifacts({
    rootDir: ROOT,
    founderExecutionProofInput: proofInput,
  });

  const bundle = proof.report.proofBundle;
  const stageEvidence = {
    workspace: {
      proven: bundle.workspaceEvidence.proven,
      state: bundle.workspaceEvidence.state,
      summary: bundle.workspaceEvidence.evidenceSummary,
    },
    build: {
      proven: bundle.buildEvidence.proven,
      state: bundle.buildEvidence.state,
      summary: bundle.buildEvidence.evidenceSummary,
    },
    runtime: {
      proven: bundle.runtimeEvidence.proven,
      state: bundle.runtimeEvidence.state,
      summary: bundle.runtimeEvidence.evidenceSummary,
    },
    preview: {
      proven: bundle.previewEvidence.proven,
      state: bundle.previewEvidence.state,
      summary: bundle.previewEvidence.evidenceSummary,
    },
    verification: {
      proven: bundle.verificationEvidence.proven,
      state: bundle.verificationEvidence.state,
      summary: bundle.verificationEvidence.evidenceSummary,
    },
  };

  const stageOrder = ['workspace', 'build', 'runtime', 'preview', 'verification'] as const;
  let firstFailureStage = 'none';
  let firstFailureReason = 'none';
  for (const stage of stageOrder) {
    const evidence = stageEvidence[stage];
    if (!evidence.proven) {
      firstFailureStage = stage;
      firstFailureReason = evidence.summary;
      break;
    }
  }

  return {
    proofInputKeys: Object.keys(proofInput).filter((k) => (proofInput as Record<string, unknown>)[k] !== undefined),
    missingAuthorities: [...proof.report.inputSnapshot.missingAuthorities],
    founderExecutionProven: proof.report.questionAnswers.founderExecutionProven,
    executionChainConnected: proof.report.questionAnswers.executionChainConnected,
    resolvedExecutionConnected: resolved.executionConnected,
    resolvedSource: resolved.source,
    founderExecutionState: proof.report.founderExecutionState,
    overallFounderProofPercent: proof.report.executionCompleteness.overallFounderProofPercent,
    stageEvidence,
    topBlockers: proof.report.topBlockers.slice(0, 8),
    firstFailureStage,
    firstFailureReason,
    integrationScore: integration.score.overall,
    integrationVerdict: integration.verdict,
    launchVerdict: launch.founderTestLaunchReadinessAssessment.report.launchReadinessVerdict,
    connectedHistorySizes: {
      workspace: getConnectedWorkspaceCreationHistorySize(),
      runtime: getConnectedRuntimeExecutionHistorySize(),
      preview: getConnectedLivePreviewExecutionHistorySize(),
      verification: getConnectedVerificationExecutionHistorySize(),
    },
  };
}

function validateSourcePath(): void {
  const handler = readText('server/founder-testing-handler.ts');
  const resolver = readText('src/founder-test-integration/founder-execution-connected-resolver.ts');
  const aggregator = readText('src/founder-execution-proof/execution-proof-aggregator.ts');

  assert(
    'API handler calls buildRuntimeFounderExecutionProofInputAsync',
    handler.includes('buildRuntimeFounderExecutionProofInputAsync'),
    'founder-testing-handler must build hydrated runtime proof input',
  );

  assert(
    'runtime proof input builder uses hydration module',
    resolver.includes('hydrateRuntimeFounderExecutionProofInputSync') &&
      resolver.includes('hydrateRuntimeFounderExecutionProofInput'),
    'buildRuntimeFounderExecutionProofInput must hydrate connected assessments',
  );

  assert(
    'server handler does not invoke connected execution authorities',
    !handler.includes('assessConnectedWorkspaceCreation') &&
      !handler.includes('assessConnectedVerificationExecution') &&
      !handler.includes('assessConnectedRuntimeExecution'),
    'API path is read-only assessment without connected execution chain',
  );

  assert(
    'proof aggregator requires connected assessments for stage proof',
    aggregator.includes('No workspace creation assessment consumed') &&
      aggregator.includes('No connected build execution contract consumed') &&
      aggregator.includes('No runtime execution assessment consumed'),
    'stage extractors fail closed on null assessments',
  );
}

function validateLiveDiagnostic(diagnostic: LiveProofDiagnostic): void {
  assert(
    'runtime proof input builder executes',
    diagnostic.proofInputKeys.includes('rootDir'),
    diagnostic.proofInputKeys.join(', '),
  );

  assert(
    'Founder Execution Proof authority is reached by live runtime',
    diagnostic.founderExecutionState.length > 0,
    diagnostic.founderExecutionState,
  );

  assert(
    'proof summary is produced on live path',
    diagnostic.overallFounderProofPercent >= 0 &&
      diagnostic.topBlockers.length >= 0,
    `score=${diagnostic.overallFounderProofPercent} blockers=${diagnostic.topBlockers.length}`,
  );

  assert(
    'resolver receives proof assessment',
    diagnostic.resolvedSource === 'not-proven' || diagnostic.resolvedSource.startsWith('founder-execution-proof'),
    diagnostic.resolvedSource,
  );

  assert(
    'launch readiness receives resolved proof (via integration)',
    diagnostic.launchVerdict.length > 0 && diagnostic.integrationVerdict.length > 0,
    `integration=${diagnostic.integrationVerdict} launch=${diagnostic.launchVerdict}`,
  );

  assert(
    'live path identifies missing connected authorities',
    diagnostic.missingAuthorities.includes('connected-workspace-creation') &&
      diagnostic.missingAuthorities.includes('connected-build-execution') &&
      diagnostic.missingAuthorities.includes('connected-runtime-execution') &&
      diagnostic.missingAuthorities.includes('connected-live-preview-execution') &&
      diagnostic.missingAuthorities.includes('connected-verification-execution'),
    diagnostic.missingAuthorities.join(', '),
  );

  assert(
    'live founderExecutionProven is false without connected assessments',
    diagnostic.founderExecutionProven === false,
    String(diagnostic.founderExecutionProven),
  );

  assert(
    'live executionConnected resolves false without connected assessments',
    diagnostic.resolvedExecutionConnected === false,
    `${diagnostic.resolvedSource} connected=${diagnostic.resolvedExecutionConnected}`,
  );

  assert(
    'first failure stage is workspace (earliest gap)',
    diagnostic.firstFailureStage === 'workspace',
    `${diagnostic.firstFailureStage}: ${diagnostic.firstFailureReason}`,
  );

  assert(
    'live integration remains blocked without execution proof',
    diagnostic.integrationVerdict === 'BLOCKED' && diagnostic.integrationScore <= 60,
    `${diagnostic.integrationScore}/100 (${diagnostic.integrationVerdict})`,
  );

  assert(
    'exact failure reason is identifiable',
    diagnostic.firstFailureReason.includes('No workspace creation assessment consumed'),
    diagnostic.firstFailureReason,
  );
}

function validateValidatorContrast(): void {
  const validator = readText('scripts/validate-founder-execution-proof.ts');
  assert(
    'validator injects connected execution assessments',
    validator.includes('buildVerificationScenario') &&
      validator.includes('connectedWorkspaceCreationAssessment') &&
      validator.includes('assessConnectedVerificationExecution'),
    'validator runs full connected chain and injects assessments',
  );

  assert(
    'validator passes founderExecutionProofInput to integration',
    validator.includes('founderExecutionProofInput: integrationInput'),
    'validator integration path supplies proof input',
  );
}

function main(): void {
  console.log('Phase 25.35 — Live Execution Proof Generation Audit validation\n');

  validateSourcePath();
  checkpoint('source path');

  const diagnostic = diagnoseLiveProofPath();
  checkpoint('live diagnostic');

  validateLiveDiagnostic(diagnostic);
  checkpoint('live diagnostic checks');

  validateValidatorContrast();
  checkpoint('validator contrast');

  console.log('\n--- Live Proof Diagnostic ---');
  console.log(JSON.stringify(diagnostic, null, 2));
  console.log('\n--- First Failure ---');
  console.log(
    `Stage: ${diagnostic.firstFailureStage}\nReason: ${diagnostic.firstFailureReason}\n` +
      `File: src/founder-execution-proof/execution-proof-aggregator.ts → extractWorkspaceEvidence()\n` +
      `Root cause layer: no in-process connected assessments in store; ` +
      `hydration returns insufficient-evidence until connected chain runs`,
  );

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
