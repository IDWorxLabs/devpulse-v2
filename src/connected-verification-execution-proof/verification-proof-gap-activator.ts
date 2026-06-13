/**
 * Verification Proof Gap Activator — bounded real verification execution (Phase 26.76).
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPathUnderGeneratedBuilderWorkspaces } from '../connected-build-execution/build-proof-gap-materializer.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import { VERIFICATION_PROBE_TIMEOUT_MS } from './connected-verification-execution-proof-registry.js';
import type {
  VerificationActivationEvidence,
  VerificationEvidenceFixture,
  VerificationProofLevel,
} from './connected-verification-execution-proof-types.js';
import { analyzeVerificationLinkage } from './verification-linkage-analyzer.js';
import { analyzeVerificationResults } from './verification-result-analyzer.js';
import { analyzeVerificationRun } from './verification-run-analyzer.js';
import { analyzeVerificationEvidence } from './verification-evidence-analyzer.js';

export const CONNECTED_VERIFICATION_EXECUTION_PROOF_REPAIR_V1_PASS =
  'CONNECTED_VERIFICATION_EXECUTION_PROOF_REPAIR_V1_PASS';

const PROBE_SCRIPT = join(
  dirname(fileURLToPath(import.meta.url)),
  'verification-proof-gap-probe.mjs',
);

interface ProbeResult {
  workspaceId?: string;
  workspacePath?: string;
  verificationCommand?: string | null;
  commandDetected?: boolean;
  generatedAt?: string;
  executionAttempted?: boolean;
  executionObserved?: boolean;
  verificationSucceeded?: boolean;
  exitCode?: number | null;
  passCount?: number;
  failCount?: number;
  skippedCount?: number;
  testsExecuted?: number;
  checksExecuted?: number;
  executionStartedAt?: string | null;
  executionCompletedAt?: string | null;
  durationMs?: number | null;
  previewUrl?: string | null;
  proofLevel?: VerificationProofLevel;
  firstBrokenVerificationLink?: string | null;
  error?: string;
}

function emptyActivationEvidence(input: {
  workspaceId: string;
  workspacePath: string;
  firstBrokenVerificationLink: string | null;
}): VerificationActivationEvidence {
  return {
    readOnly: true,
    workspaceId: input.workspaceId,
    workspacePath: input.workspacePath,
    verificationCommand: null,
    commandDetected: false,
    generatedAt: new Date().toISOString(),
    executionAttempted: false,
    executionObserved: false,
    verificationSucceeded: false,
    exitCode: null,
    passCount: 0,
    failCount: 0,
    skippedCount: 0,
    testsExecuted: 0,
    checksExecuted: 0,
    executionStartedAt: null,
    executionCompletedAt: null,
    durationMs: null,
    proofLevel: 'NOT_PROVEN',
    firstBrokenVerificationLink: input.firstBrokenVerificationLink,
  };
}

function parseProbeStdout(stdout: string): ProbeResult | null {
  const lines = stdout.trim().split('\n').filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]!) as ProbeResult;
    } catch {
      /* try previous */
    }
  }
  return null;
}

function probeToFixture(
  probe: ProbeResult,
  previewExperienceProof: PreviewExperienceProofReport,
  workspaceId: string,
): VerificationEvidenceFixture {
  return {
    verificationRunId: `verify-gap-${workspaceId}-${Date.now()}`,
    runStatus: probe.executionObserved ? (probe.verificationSucceeded ? 'COMPLETED' : 'FAILED') : 'NOT_OBSERVED',
    startedAt: probe.executionStartedAt ?? undefined,
    completedAt: probe.executionCompletedAt ?? undefined,
    executor: 'verification-proof-gap-activator',
    command: probe.verificationCommand ?? undefined,
    scope: 'generated-workspace-preview',
    workspaceId,
    previewSessionId: previewExperienceProof.session.sessionId ?? undefined,
    previewUrl: probe.previewUrl ?? previewExperienceProof.url.previewUrl ?? undefined,
    targetLinkedToRuntime: true,
    targetLinkedToPreview: true,
    targetLinkedToBuild: true,
    passCount: probe.passCount ?? 0,
    failCount: probe.failCount ?? 0,
    skippedCount: probe.skippedCount ?? 0,
    resultStatus: probe.verificationSucceeded ? 'PASS' : probe.executionObserved ? 'FAIL' : 'NOT_OBSERVED',
    summary: probe.verificationSucceeded
      ? `${probe.passCount ?? 0} check(s) passed against preview`
      : 'Verification checks failed or incomplete',
    evidencePaths: ['verification/run-verify.mjs'],
    evidenceTypes: ['verification_output'],
    testLogs: probe.executionObserved ? [`exitCode=${probe.exitCode ?? 'unknown'}`] : [],
  };
}

export function activateVerificationProofGap(input: {
  projectRootDir: string;
  workspacePath: string;
  workspaceId: string;
  previewExperienceProof: PreviewExperienceProofReport;
}): {
  sessionFixture: VerificationEvidenceFixture | null;
  activationEvidence: VerificationActivationEvidence;
} {
  const workspacePath = input.workspacePath.replace(/\\/g, '/');
  const workspaceAbs = resolve(input.projectRootDir, workspacePath);

  if (input.previewExperienceProof.previewProofLevel !== 'PROVEN') {
    return {
      sessionFixture: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        firstBrokenVerificationLink: 'preview→command',
      }),
    };
  }

  if (!isPathUnderGeneratedBuilderWorkspaces(input.projectRootDir, workspaceAbs)) {
    return {
      sessionFixture: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        firstBrokenVerificationLink: 'preview→command',
      }),
    };
  }

  if (!existsSync(PROBE_SCRIPT)) {
    return {
      sessionFixture: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        firstBrokenVerificationLink: 'preview→command',
      }),
    };
  }

  const result = spawnSync(process.execPath, [PROBE_SCRIPT, workspaceAbs, '0', input.workspaceId], {
    encoding: 'utf8',
    timeout: VERIFICATION_PROBE_TIMEOUT_MS + 5000,
    windowsHide: true,
    env: {
      ...process.env,
      VERIFICATION_PROBE_TIMEOUT_MS: String(VERIFICATION_PROBE_TIMEOUT_MS),
    },
  });

  const probe = parseProbeStdout(result.stdout ?? '');
  if (!probe) {
    return {
      sessionFixture: null,
      activationEvidence: emptyActivationEvidence({
        workspaceId: input.workspaceId,
        workspacePath,
        firstBrokenVerificationLink: 'command→execution',
      }),
    };
  }

  const sessionFixture = probe.executionObserved
    ? probeToFixture(probe, input.previewExperienceProof, input.workspaceId)
    : null;
  const run = analyzeVerificationRun({ fixture: sessionFixture ?? undefined });
  const runCompleted = run.runState === 'COMPLETED' || run.runState === 'FAILED';
  const results = analyzeVerificationResults({
    fixture: sessionFixture ?? undefined,
    runCompleted,
  });
  const evidence = analyzeVerificationEvidence({
    fixture: sessionFixture ?? undefined,
    resultsObserved: results.resultsObserved,
  });
  const linkage = analyzeVerificationLinkage({
    previewExperienceProof: input.previewExperienceProof,
    run,
    target: {
      readOnly: true,
      targetState: 'LINKED',
      targetObserved: true,
      targetType: 'GENERATED_APP_PREVIEW',
      targetLinkedToRuntime: true,
      targetLinkedToPreview: true,
      targetLinkedToBuild: true,
      targetUrl: probe.previewUrl ?? null,
      targetWorkspace: workspacePath,
      artifactIds: [],
      confidence: 90,
    },
    results,
    evidence,
    verificationSucceeded: probe.verificationSucceeded ?? false,
  });

  const proofLevel: VerificationProofLevel =
    probe.proofLevel ??
    (probe.verificationSucceeded && probe.executionObserved ? 'PROVEN' : 'PARTIAL');

  const activationEvidence: VerificationActivationEvidence = {
    readOnly: true,
    workspaceId: input.workspaceId,
    workspacePath,
    verificationCommand: probe.verificationCommand ?? null,
    commandDetected: probe.commandDetected ?? false,
    generatedAt: probe.generatedAt ?? new Date().toISOString(),
    executionAttempted: probe.executionAttempted ?? false,
    executionObserved: probe.executionObserved ?? false,
    verificationSucceeded: probe.verificationSucceeded ?? false,
    exitCode: probe.exitCode ?? null,
    passCount: probe.passCount ?? 0,
    failCount: probe.failCount ?? 0,
    skippedCount: probe.skippedCount ?? 0,
    testsExecuted: probe.testsExecuted ?? 0,
    checksExecuted: probe.checksExecuted ?? 0,
    executionStartedAt: probe.executionStartedAt ?? null,
    executionCompletedAt: probe.executionCompletedAt ?? null,
    durationMs: probe.durationMs ?? null,
    proofLevel,
    firstBrokenVerificationLink: linkage.verificationLinkageConnected
      ? null
      : linkage.firstBrokenVerificationLink,
  };

  return {
    sessionFixture: probe.commandDetected ? sessionFixture : null,
    activationEvidence,
  };
}
