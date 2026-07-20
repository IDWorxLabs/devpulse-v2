/**
 * Real-path build runner for end-to-end autonomous production convergence.
 * Invokes the same orchestrator entry used by POST /api/build/from-prompt.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runOnePromptLivePreviewBuild } from '../one-prompt-live-preview/index.js';
import { finalizeBuildFromPromptPayload } from '../../server/build-from-prompt-handler.js';
import { LIVE_PREVIEW_INTERACTION_PROOF_V1_CONTRACT } from '../live-preview-interaction-proof-v1/live-preview-interaction-proof-types.js';
import type { LivePreviewInteractionProofReport } from '../live-preview-interaction-proof-v1/live-preview-interaction-proof-types.js';
import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import {
  appendConvergenceAttempt,
  classifyRootCauseFromBuildFailure,
  defaultConvergenceLedgerPath,
  detectRepeatedIdenticalFailure,
  fingerprintEnvelopeLike,
  loadConvergenceLedger,
  saveConvergenceLedger,
  suggestCapabilityConvergenceOutcome,
} from './convergence-ledger.js';
import type {
  ConvergenceAttemptRecord,
  ConvergenceBuildFixture,
} from './convergence-types.js';
import { CONVERGENCE_BUILD_FIXTURES } from './convergence-types.js';

function blockedProof(reason: string): LivePreviewInteractionProofReport {
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
      blockedReason: reason,
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

function readWorkspaceMarker(
  workspacePath: string | null,
  relativePath: string,
): Record<string, unknown> | null {
  if (!workspacePath) return null;
  const absolute = join(workspacePath, relativePath);
  if (!existsSync(absolute)) return null;
  try {
    return JSON.parse(readFileSync(absolute, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface ConvergenceRunResult {
  readonly fixture: ConvergenceBuildFixture;
  readonly build: OnePromptLivePreviewBuildResult;
  readonly attempt: ConvergenceAttemptRecord;
  readonly productionPath: ReturnType<typeof finalizeBuildFromPromptPayload>['productionPath'];
  readonly succeeded: boolean;
}

export async function runConvergenceBuildAttempt(input: {
  readonly rootDir: string;
  readonly fixture: ConvergenceBuildFixture;
  readonly attemptIndex: number;
  readonly selectedRepair?: string | null;
  readonly filesChanged?: readonly string[];
}): Promise<ConvergenceRunResult> {
  const projectId = `e2e-conv-${input.fixture.fixtureId}-${Date.now()}-${input.attemptIndex}`;
  const build = await runOnePromptLivePreviewBuild({
    rawPrompt: input.fixture.prompt,
    projectRootDir: input.rootDir,
    source: 'validator',
    projectId,
    projectName: input.fixture.label,
    buildDecisionKind: 'NEW_BUILD',
    resumeExistingProject: false,
  });

  const proof =
    build.livePreviewAvailable && build.previewUrl
      ? blockedProof('Harness defers to build-attached proof; interaction evaluated via readiness markers.')
      : blockedProof(build.failureReason ?? 'Build did not reach preview.');

  const finalized = finalizeBuildFromPromptPayload({
    build,
    livePreviewInteractionProof: proof,
    executionReport: build.executionReport ?? null,
    productFaithfulness: null,
    generationFaithfulness: null,
  });

  const workspaceAbs = build.workspacePath
    ? join(input.rootDir, build.workspacePath)
    : null;
  const b8 = readWorkspaceMarker(workspaceAbs, 'src/universal-behavioral-verification/behavioral-verification-report.json');
  const b9 = readWorkspaceMarker(workspaceAbs, 'src/universal-capability-coverage/capability-coverage-report.json');
  const b10 = readWorkspaceMarker(workspaceAbs, 'src/universal-capability-composition/capability-composition-report.json');
  const b11 = readWorkspaceMarker(workspaceAbs, 'src/universal-production-readiness/production-readiness-report.json');
  const c1 = readWorkspaceMarker(workspaceAbs, 'src/autonomous-engineering-intelligence/autonomous-engineering-report.json');

  const classification = classifyRootCauseFromBuildFailure({
    failureReason: build.failureReason,
    gpcaHardStop: build.gpcaHardStop === true,
    gpcaGate: build.gpcaComplianceReport?.finalGateOutcome ?? null,
    blockedReasons: build.gpcaComplianceReport?.blockedReasons ?? [],
  });

  const succeeded =
    build.status === 'READY' &&
    build.npmBuildOk === true &&
    build.livePreviewAvailable === true &&
    Boolean(build.previewUrl) &&
    finalized.productionPath.buildOutcome === 'BUILD_SUCCEEDED';

  const attempt: ConvergenceAttemptRecord = {
    readOnly: true,
    attemptId: `${input.fixture.fixtureId}-attempt-${input.attemptIndex}`,
    buildId: build.buildId,
    promptFixtureId: input.fixture.fixtureId,
    approvedIdentity: build.approvedProductIdentity?.displayName ?? build.projectName,
    envelopeFingerprint: fingerprintEnvelopeLike(build.approvedProductionBuildEnvelope),
    firstBlockingAuthority: succeeded ? null : classification.firstBlockingAuthority,
    firstBrokenBoundary: succeeded ? null : classification.firstBrokenBoundary,
    diagnosticCode: succeeded ? null : classification.diagnosticCode,
    rootCause: succeeded ? null : build.failureReason,
    rootCauseClass: succeeded ? 'UNKNOWN' : classification.rootCauseClass,
    downstreamSymptoms: succeeded ? [] : finalized.productionPath.diagnostics.summaryLines,
    repairEligibility: succeeded ? null : 'ENGINE_REPAIR',
    selectedRepair: input.selectedRepair ?? null,
    capabilityConvergenceOutcome: succeeded
      ? 'REUSE_EXISTING_CAPABILITY'
      : suggestCapabilityConvergenceOutcome(classification.rootCauseClass),
    filesChanged: input.filesChanged ?? [],
    validatorsRun: [],
    status: build.status,
    gpcaHardStop: build.gpcaHardStop === true,
    previewAvailable: finalized.productionPath.previewAvailable,
    livePreviewAvailable: build.livePreviewAvailable === true,
    npmBuildOk: build.npmBuildOk === true,
    npmInstallOk: build.npmInstallOk === true,
    interactionProofResult: proof.result,
    b8Result: typeof b8?.verdict === 'string' ? b8.verdict : b8 ? 'PRESENT' : null,
    b9Result: typeof b9?.coverageOutcome === 'string' ? String(b9.coverageOutcome) : b9 ? 'PRESENT' : null,
    b10Result: typeof b10?.compositionOutcome === 'string' ? String(b10.compositionOutcome) : b10 ? 'PRESENT' : null,
    b11Result: typeof b11?.readinessVerdict === 'string' ? String(b11.readinessVerdict) : b11 ? 'PRESENT' : null,
    c1RepairsApplied: Array.isArray(c1?.repairsApplied) ? (c1.repairsApplied as unknown[]).length : 0,
    nextBuildResult: null,
    sameFailureRecurred: false,
    newlyExposedBlocker: null,
    finalDisposition: succeeded ? 'SUCCEEDED' : 'FAILED',
    createdAt: new Date().toISOString(),
  };

  return {
    fixture: input.fixture,
    build,
    attempt,
    productionPath: finalized.productionPath,
    succeeded,
  };
}

export async function runConvergenceMatrix(input: {
  readonly rootDir: string;
  readonly fixtureIds?: readonly string[];
  readonly maxAttemptsPerFixture?: number;
  readonly ledgerPath?: string;
}): Promise<{
  readonly ledgerPath: string;
  readonly results: readonly ConvergenceRunResult[];
  readonly successfulFixtureIds: readonly string[];
}> {
  const ledgerPath = input.ledgerPath ?? defaultConvergenceLedgerPath(input.rootDir);
  let ledger = loadConvergenceLedger(ledgerPath);
  const fixtures = CONVERGENCE_BUILD_FIXTURES.filter((fixture) =>
    input.fixtureIds ? input.fixtureIds.includes(fixture.fixtureId) : true,
  );
  const maxAttempts = input.maxAttemptsPerFixture ?? 1;
  const results: ConvergenceRunResult[] = [];
  const successfulFixtureIds: string[] = [];

  for (const fixture of fixtures) {
    for (let attemptIndex = 1; attemptIndex <= maxAttempts; attemptIndex += 1) {
      const run = await runConvergenceBuildAttempt({
        rootDir: input.rootDir,
        fixture,
        attemptIndex,
      });
      const repeated = detectRepeatedIdenticalFailure(
        ledger,
        fixture.fixtureId,
        run.attempt.diagnosticCode,
        run.attempt.rootCause,
      );
      const attempt: ConvergenceAttemptRecord = {
        ...run.attempt,
        sameFailureRecurred: repeated,
      };
      ledger = appendConvergenceAttempt(ledger, attempt);
      saveConvergenceLedger(ledgerPath, ledger);
      const evidenceDir = join(input.rootDir, '.aidevengine', 'e2e-autonomous-production-convergence', 'evidence');
      mkdirSync(evidenceDir, { recursive: true });
      writeFileSync(
        join(evidenceDir, `${attempt.attemptId}.json`),
        `${JSON.stringify(
          {
            attempt,
            productionPath: {
              buildOutcome: run.productionPath.buildOutcome,
              projectTitle: run.productionPath.projectTitle,
              previewAvailable: run.productionPath.previewAvailable,
              executionStatus: run.productionPath.executionStatus,
              diagnostics: run.productionPath.diagnostics,
              timeline: run.productionPath.timeline,
            },
            buildSummary: {
              status: run.build.status,
              failureReason: run.build.failureReason,
              gpcaGate: run.build.gpcaComplianceReport?.finalGateOutcome ?? null,
              moduleIds: run.build.approvedModulePlan?.moduleIds ?? null,
              nav: run.build.approvedNavigationPlan?.productEntries ?? null,
              previewUrl: run.build.previewUrl,
            },
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
      results.push({ ...run, attempt });
      if (run.succeeded) {
        successfulFixtureIds.push(fixture.fixtureId);
        break;
      }
      if (repeated) break;
    }
  }

  return { ledgerPath, results, successfulFixtureIds };
}
