/**
 * Connected Verification Execution Proof — verification execution proof authority.
 * Read-only — assesses verification evidence; does not run verification.
 */

import { createHash } from 'node:crypto';
import { assessConnectedPreviewExperienceProof } from '../connected-preview-experience-proof/index.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import {
  CONNECTED_VERIFICATION_EXECUTION_PROOF_CACHE_KEY_PREFIX,
  CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN,
} from './connected-verification-execution-proof-registry.js';
import { recordVerificationExecutionProofAssessment } from './connected-verification-execution-proof-history.js';
import { buildVerificationExecutionProofReportMarkdown } from './connected-verification-execution-proof-report-builder.js';
import type {
  AssessConnectedVerificationExecutionProofInput,
  VerificationExecutionFounderQuestions,
  VerificationExecutionProofAssessment,
  VerificationExecutionProofArtifacts,
  VerificationExecutionProofReport,
  VerificationExecutionState,
  VerificationProofLevel,
} from './connected-verification-execution-proof-types.js';
import { analyzeVerificationEvidence, isEvidenceSufficient } from './verification-evidence-analyzer.js';
import { analyzeVerificationFailures } from './verification-failure-analyzer.js';
import { analyzeVerificationLinkage } from './verification-linkage-analyzer.js';
import { analyzeVerificationManifest } from './verification-manifest-analyzer.js';
import { analyzeVerificationReadiness } from './verification-readiness-analyzer.js';
import { analyzeVerificationResults, areResultsObserved } from './verification-result-analyzer.js';
import { analyzeVerificationRun, isRunCompleted } from './verification-run-analyzer.js';
import { analyzeVerificationTarget, isTargetLinked } from './verification-target-analyzer.js';

let assessmentCounter = 0;

export function resetVerificationExecutionProofCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `connected-verification-execution-proof-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, proofLevel: VerificationProofLevel): string {
  const digest = createHash('sha256')
    .update([CONNECTED_VERIFICATION_EXECUTION_PROOF_PASS_TOKEN, assessmentId, proofLevel].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_VERIFICATION_EXECUTION_PROOF_CACHE_KEY_PREFIX}:${digest}`;
}

function resolvePreviewExperienceProof(
  input: AssessConnectedVerificationExecutionProofInput,
  rootDir: string,
): PreviewExperienceProofReport | null {
  if (input.previewExperienceProof !== undefined) {
    return input.previewExperienceProof;
  }
  return assessConnectedPreviewExperienceProof({ rootDir }).report;
}

function deriveVerificationState(input: {
  runStarted: boolean;
  runCompleted: boolean;
  resultsObserved: boolean;
  evidenceSufficient: boolean;
  proofProven: boolean;
}): VerificationExecutionState {
  if (input.proofProven) return 'READY';
  if (input.evidenceSufficient) return 'EVIDENCED';
  if (input.resultsObserved) return 'RESULTS_OBSERVED';
  if (input.runCompleted) return 'RUN_COMPLETED';
  if (input.runStarted) return 'RUN_STARTED';
  return 'NOT_RUN';
}

function deriveProofLevel(input: {
  previewProven: boolean;
  runStarted: boolean;
  runCompleted: boolean;
  targetLinked: boolean;
  resultsObserved: boolean;
  evidenceSufficient: boolean;
  linkageConnected: boolean;
}): VerificationProofLevel {
  if (
    input.previewProven &&
    input.runCompleted &&
    input.targetLinked &&
    input.resultsObserved &&
    input.evidenceSufficient &&
    input.linkageConnected
  ) {
    return 'PROVEN';
  }
  if (
    input.runStarted ||
    input.runCompleted ||
    input.resultsObserved ||
    input.evidenceSufficient
  ) {
    return 'PARTIAL';
  }
  return 'NOT_PROVEN';
}

function buildEmptyReport(assessmentId: string, reason: string): VerificationExecutionProofReport {
  const emptyRun = {
    readOnly: true as const,
    runState: 'NOT_OBSERVED' as const,
    runObserved: false,
    runId: null,
    status: null,
    startedAt: null,
    completedAt: null,
    executor: null,
    command: null,
    scope: null,
    confidence: 0,
  };
  const emptyTarget = {
    readOnly: true as const,
    targetState: 'NOT_OBSERVED' as const,
    targetObserved: false,
    targetType: null,
    targetLinkedToRuntime: false,
    targetLinkedToPreview: false,
    targetLinkedToBuild: false,
    targetUrl: null,
    targetWorkspace: null,
    artifactIds: [] as string[],
    confidence: 0,
  };
  const emptyResults = {
    readOnly: true as const,
    resultState: 'NOT_OBSERVED' as const,
    resultsObserved: false,
    passCount: 0,
    failCount: 0,
    warningCount: 0,
    skippedCount: 0,
    status: null,
    score: null,
    summary: null,
    confidence: 0,
  };
  const emptyEvidence = {
    readOnly: true as const,
    evidenceState: 'NOT_OBSERVED' as const,
    evidenceObserved: false,
    evidenceTypes: [] as string[],
    evidencePaths: [] as string[],
    evidenceCount: 0,
    confidence: 0,
  };
  const emptyFailures = {
    readOnly: true as const,
    failures: [] as VerificationExecutionProofReport['failures']['failures'],
    criticalCount: 0,
    highCount: 0,
  };
  const emptyReadiness = {
    readOnly: true as const,
    readinessState: 'VERIFICATION_NOT_RUN' as const,
    founderSummary: reason,
    canProceed: false,
    blockingReasons: [reason],
    nextActions: ['Complete preview experience proof before verification assessment.'],
  };
  const emptyManifest = {
    readOnly: true as const,
    manifestExists: false,
    contractLinked: false,
    buildLinked: false,
    runtimeLinked: false,
    previewLinked: false,
    verificationLinked: false,
    traceabilityScore: 0,
  };
  const emptyLinkage = {
    readOnly: true as const,
    verificationLinkageConnected: false,
    firstBrokenVerificationLink: 'contract→workspace',
    missingLinks: [reason],
    traceabilityScore: 0,
    contractToWorkspace: false,
    workspaceToRuntime: false,
    runtimeToPreview: false,
    previewToVerificationRun: false,
    verificationRunToResults: false,
    resultsToEvidence: false,
  };

  return {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    verificationProofLevel: 'NOT_PROVEN',
    verificationState: 'NOT_RUN',
    previewExperienceProven: false,
    run: emptyRun,
    target: emptyTarget,
    results: emptyResults,
    evidence: emptyEvidence,
    failures: emptyFailures,
    readiness: emptyReadiness,
    manifest: emptyManifest,
    linkage: emptyLinkage,
    missingEvidence: [reason],
    recommendedFix: 'Prove preview experience before verification execution assessment.',
    recommendedNextActions: ['Complete PREVIEW experience proof first.'],
    founderQuestions: {
      readOnly: true,
      canVerificationBeTrusted: false,
      wasGeneratedAppVerified: false,
      whatPassed: [],
      whatFailed: [],
      whatEvidenceExists: [],
      whatEvidenceMissing: [reason],
      whatShouldBeBuiltNext: ['Complete PREVIEW experience proof first.'],
    },
    cacheKey: stableCacheKey(assessmentId, 'NOT_PROVEN'),
  };
}

export function assessConnectedVerificationExecutionProof(
  input: AssessConnectedVerificationExecutionProofInput = {},
): VerificationExecutionProofAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const previewExperienceProof = resolvePreviewExperienceProof(input, rootDir);
  const previewProven = previewExperienceProof?.previewProofLevel === 'PROVEN';
  const fixture = input.verificationEvidenceFixture;

  if (!previewExperienceProof || !previewProven) {
    const reason = !previewExperienceProof
      ? 'No preview experience proof report available'
      : `Preview experience proof level: ${previewExperienceProof.previewProofLevel} (PROVEN required for verification proof)`;
    const report = buildEmptyReport(assessmentId, reason);
    const assessment: VerificationExecutionProofAssessment = {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'VERIFICATION_EXECUTION_PROOF_COMPLETE',
      report,
    };
    recordVerificationExecutionProofAssessment(assessment);
    return assessment;
  }

  const run = analyzeVerificationRun({ fixture });
  const target = analyzeVerificationTarget({ previewExperienceProof, fixture });
  const runCompleted = isRunCompleted(run);
  const results = analyzeVerificationResults({ fixture, runCompleted });
  const evidence = analyzeVerificationEvidence({
    fixture,
    resultsObserved: areResultsObserved(results),
  });
  const failures = analyzeVerificationFailures({ fixture, results });
  const manifest = analyzeVerificationManifest({ previewExperienceProof, run, target });
  const linkage = analyzeVerificationLinkage({
    previewExperienceProof,
    run,
    target,
    results,
    evidence,
  });

  const targetLinked = isTargetLinked(target);
  const resultsObserved = areResultsObserved(results);
  const evidenceSufficient = isEvidenceSufficient(evidence);

  const verificationProofLevel = deriveProofLevel({
    previewProven,
    runStarted: run.runObserved && !runCompleted,
    runCompleted,
    targetLinked,
    resultsObserved,
    evidenceSufficient,
    linkageConnected: linkage.verificationLinkageConnected,
  });

  const verificationState = deriveVerificationState({
    runStarted: run.runState === 'STARTED' || run.runObserved,
    runCompleted,
    resultsObserved,
    evidenceSufficient,
    proofProven: verificationProofLevel === 'PROVEN',
  });

  const readiness = analyzeVerificationReadiness({
    run,
    results,
    failures,
    proofLevel: verificationProofLevel,
  });

  const missingEvidence: string[] = [
    ...linkage.missingLinks,
    ...(!run.runObserved ? ['Verification run not observed'] : []),
    ...(!runCompleted ? ['Verification run not completed'] : []),
    ...(!targetLinked ? ['Verification target not linked to preview/runtime/build'] : []),
    ...(!resultsObserved ? ['Verification results not observed'] : []),
    ...(!evidenceSufficient ? ['Verification evidence artifacts missing'] : []),
  ];

  let recommendedFix =
    'Run verification against generated preview/runtime output and capture evidence artifacts.';
  if (verificationProofLevel === 'PROVEN') {
    recommendedFix =
      readiness.readinessState === 'VERIFICATION_FAILED'
        ? 'Verification proven with failures — remediate failed checks before launch.'
        : 'Verification execution proven — proceed to LAUNCH readiness assessment.';
  } else if (runCompleted && !targetLinked) {
    recommendedFix = 'Verification ran but target linkage is missing — link run to preview session and workspace.';
  } else if (resultsObserved && !evidenceSufficient) {
    recommendedFix = 'Results exist but evidence artifacts are missing — capture logs, screenshots, or assertion output.';
  } else if (run.runState === 'STARTED') {
    recommendedFix = 'Verification run started but not completed — wait for run completion and capture results.';
  } else if (!linkage.verificationLinkageConnected && linkage.firstBrokenVerificationLink) {
    recommendedFix = `Fix broken verification link ${linkage.firstBrokenVerificationLink} before claiming VERIFY proven.`;
  }

  const whatPassed =
    results.passCount > 0
      ? [`${results.passCount} verification check(s) passed`]
      : [];
  const whatFailed = failures.failures.map((f) => f.message).slice(0, 5);
  const whatEvidenceExists: string[] = [
    ...evidence.evidencePaths.map((p) => `Artifact: ${p}`),
    ...(fixture?.testLogs?.length ? [`Test logs: ${fixture.testLogs.length} line(s)`] : []),
  ];

  const founderQuestions: VerificationExecutionFounderQuestions = {
    readOnly: true,
    canVerificationBeTrusted: verificationProofLevel === 'PROVEN' && evidenceSufficient,
    wasGeneratedAppVerified: runCompleted && resultsObserved,
    whatPassed,
    whatFailed,
    whatEvidenceExists,
    whatEvidenceMissing: [...new Set(missingEvidence)].slice(0, 10),
    whatShouldBeBuiltNext:
      verificationProofLevel === 'PROVEN'
        ? [recommendedFix]
        : [recommendedFix],
  };

  const report: VerificationExecutionProofReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    verificationProofLevel,
    verificationState,
    previewExperienceProven: previewProven,
    run,
    target,
    results,
    evidence,
    failures,
    readiness,
    manifest,
    linkage,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    recommendedFix,
    recommendedNextActions: founderQuestions.whatShouldBeBuiltNext,
    founderQuestions,
    cacheKey: stableCacheKey(assessmentId, verificationProofLevel),
  };

  const assessment: VerificationExecutionProofAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'VERIFICATION_EXECUTION_PROOF_COMPLETE',
    report,
  };

  recordVerificationExecutionProofAssessment(assessment);
  return assessment;
}

export function buildVerificationExecutionProofArtifacts(
  input: AssessConnectedVerificationExecutionProofInput = {},
): VerificationExecutionProofArtifacts {
  const verificationExecutionProofAssessment = assessConnectedVerificationExecutionProof(input);
  return {
    verificationExecutionProofAssessment,
    verificationExecutionProofReportMarkdown: buildVerificationExecutionProofReportMarkdown(
      verificationExecutionProofAssessment.report,
    ),
  };
}

export function resetConnectedVerificationExecutionProofModuleForTests(): void {
  resetVerificationExecutionProofCounterForTests();
}
