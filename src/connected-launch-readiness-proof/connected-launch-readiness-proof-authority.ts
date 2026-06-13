/**
 * Connected Launch Readiness Proof — launch readiness proof authority.
 * Read-only — assesses launch evidence; does not release or deploy.
 */

import { createHash } from 'node:crypto';
import { assessFounderAcceptanceGate } from '../founder-acceptance-gate/index.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import type { FounderTestAssessment } from '../founder-test-integration/founder-test-integration-types.js';
import { assessLaunchCouncil } from '../launch-council/index.js';
import type { LaunchCouncilAssessment } from '../launch-council/launch-council-types.js';
import {
  CONNECTED_LAUNCH_READINESS_PROOF_CACHE_KEY_PREFIX,
  CONNECTED_LAUNCH_READINESS_PROOF_PASS_TOKEN,
} from './connected-launch-readiness-proof-registry.js';
import { recordLaunchReadinessProofAssessment } from './connected-launch-readiness-proof-history.js';
import { buildLaunchReadinessProofReportMarkdown } from './connected-launch-readiness-proof-report-builder.js';
import type {
  AssessConnectedLaunchReadinessProofInput,
  LaunchProofLevel,
  LaunchReadinessFounderQuestions,
  LaunchReadinessProofArtifacts,
  LaunchReadinessProofAssessment,
  LaunchReadinessProofReport,
  LaunchReadinessState,
} from './connected-launch-readiness-proof-types.js';
import { analyzeLaunchAcceptance, isAcceptanceRejected } from './launch-acceptance-analyzer.js';
import { analyzeLaunchBlockers, hasCriticalBlockers } from './launch-blocker-analyzer.js';
import { analyzeLaunchClaimReality, hasCriticalClaimViolations } from './launch-claim-reality-analyzer.js';
import { analyzeLaunchLinkage } from './launch-linkage-analyzer.js';
import { analyzeLaunchManifest } from './launch-manifest-analyzer.js';
import { analyzeLaunchReadiness, isLaunchReadyState } from './launch-readiness-analyzer.js';
import { analyzeLaunchRisk } from './launch-risk-analyzer.js';
import { analyzeLaunchSimulation } from './launch-simulation-analyzer.js';

let assessmentCounter = 0;

export function resetLaunchReadinessProofCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `connected-launch-readiness-proof-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, proofLevel: LaunchProofLevel): string {
  const digest = createHash('sha256')
    .update([CONNECTED_LAUNCH_READINESS_PROOF_PASS_TOKEN, assessmentId, proofLevel].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_LAUNCH_READINESS_PROOF_CACHE_KEY_PREFIX}:${digest}`;
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function resolveCoreChainConnected(input: AssessConnectedLaunchReadinessProofInput): boolean {
  if (input.coreChainConnected !== undefined) return input.coreChainConnected;
  if (input.autonomousBuildExecutionProof) {
    const coreStages = ['REQUIREMENTS', 'PLAN', 'BUILD', 'RUNTIME', 'PREVIEW', 'VERIFY'] as const;
    const allCoreProven = coreStages.every(
      (stage) =>
        input.autonomousBuildExecutionProof!.stageProofs.find((s) => s.stage === stage)
          ?.proofLevel === 'PROVEN',
    );
    const linksConnected =
      input.autonomousBuildExecutionProof.chainAnalysis.chainLinks.every((l) => l.connected);
    return allCoreProven && linksConnected;
  }
  return false;
}

function deriveLaunchProofLevel(input: {
  coreChainConnected: boolean;
  verificationProven: boolean;
  blockers: ReturnType<typeof analyzeLaunchBlockers>;
  claimReality: ReturnType<typeof analyzeLaunchClaimReality>;
  acceptance: ReturnType<typeof analyzeLaunchAcceptance>;
  readiness: ReturnType<typeof analyzeLaunchReadiness>;
  linkage: ReturnType<typeof analyzeLaunchLinkage>;
}): LaunchProofLevel {
  if (isAcceptanceRejected(input.acceptance.acceptanceState)) return 'NOT_PROVEN';
  if (!input.verificationProven || !input.coreChainConnected) return 'NOT_PROVEN';

  if (
    !hasCriticalBlockers(input.blockers) &&
    !hasCriticalClaimViolations(input.claimReality) &&
    isLaunchReadyState(input.readiness.readinessState) &&
    input.linkage.launchLinkageConnected
  ) {
    return 'PROVEN';
  }

  if (
    input.blockers.blockers.length > 0 ||
    input.claimReality.violations.length > 0 ||
    input.readiness.readinessState === 'NOT_READY'
  ) {
    return 'PARTIAL';
  }

  return 'NOT_PROVEN';
}

function buildFounderQuestions(input: {
  launchProofLevel: LaunchProofLevel;
  launchState: LaunchReadinessState;
  blockers: ReturnType<typeof analyzeLaunchBlockers>;
  risk: ReturnType<typeof analyzeLaunchRisk>;
  readiness: ReturnType<typeof analyzeLaunchReadiness>;
  linkage: ReturnType<typeof analyzeLaunchLinkage>;
}): LaunchReadinessFounderQuestions {
  const areWeLaunchReady =
    input.launchProofLevel === 'PROVEN' && isLaunchReadyState(input.launchState);

  const whyNot = dedupeStrings([
    ...input.blockers.blockers.map((b) => b.message),
    ...input.linkage.missingLinks,
    ...(input.launchProofLevel === 'NOT_PROVEN'
      ? ['Launch readiness proof not established with connected evidence']
      : []),
  ]).slice(0, 8);

  return {
    readOnly: true,
    areWeLaunchReady,
    whyNot,
    whatBlocksLaunch: input.blockers.blockers.map((b) => `[${b.severity}] ${b.message}`).slice(0, 8),
    whatRisksRemain: input.risk.riskFactors.slice(0, 8),
    whatMustBeFixedNext: dedupeStrings([
      ...input.blockers.blockers.map((b) => b.recommendedFix),
      ...(input.linkage.firstBrokenLaunchLink
        ? [`Repair launch link: ${input.linkage.firstBrokenLaunchLink}`]
        : []),
    ]).slice(0, 8),
    whatCanBeLaunchedNow:
      areWeLaunchReady
        ? ['Connected evidence supports launch with documented warnings if any']
        : input.readiness.readinessState === 'READY_WITH_WARNINGS'
          ? ['Internal preview or staged rollout only — full launch proof incomplete']
          : ['No safe public launch — resolve blockers first'],
  };
}

export function assessConnectedLaunchReadinessProof(
  input: AssessConnectedLaunchReadinessProofInput = {},
): LaunchReadinessProofAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();

  const founderTestAssessment: FounderTestAssessment =
    input.founderTestAssessment ?? assessFounderTestIntegration({ rootDir });

  const founderAcceptance: FounderAcceptanceAssessment =
    input.founderAcceptanceAssessment ?? assessFounderAcceptanceGate({ rootDir });

  const launchCouncil: LaunchCouncilAssessment | null =
    input.launchCouncilAssessment ??
    assessLaunchCouncil({
      authorityResults: [],
      generatedAt: Date.now(),
    });

  const coreChainConnected = resolveCoreChainConnected(input);
  const verificationProven =
    input.verificationExecutionProof?.verificationProofLevel === 'PROVEN';

  const simulation = analyzeLaunchSimulation({
    productReadiness: input.productReadinessSimulation ?? null,
    chatStress: input.chatStressSimulation ?? null,
    founderTest: founderTestAssessment,
  });

  const blockers = analyzeLaunchBlockers({
    executionProof: input.autonomousBuildExecutionProof ?? null,
    coreChainConnected,
    coreFirstBrokenStage: input.coreFirstBrokenStage ?? null,
    verificationProof: input.verificationExecutionProof ?? null,
    productReadiness: input.productReadinessSimulation ?? null,
    chatStress: input.chatStressSimulation ?? null,
    founderTest: founderTestAssessment,
    launchCouncil,
    founderAcceptance,
    fixture: input.launchReadinessFixture,
  });

  const acceptance = analyzeLaunchAcceptance({
    founderAcceptance,
    founderTest: founderTestAssessment,
    productReadiness: input.productReadinessSimulation ?? null,
    launchCouncil,
    fixture: input.launchReadinessFixture,
  });

  const claimRealityBase = analyzeLaunchClaimReality({
    executionProof: input.autonomousBuildExecutionProof ?? null,
    coreStageProofs: input.coreStageProofs,
    verificationProof: input.verificationExecutionProof ?? null,
    coreChainConnected,
    fixture: input.launchReadinessFixture,
  });

  const claimViolations = [...claimRealityBase.violations];
  const claimReality = {
    readOnly: true as const,
    violations: claimViolations,
    criticalViolations: claimViolations.filter((v) => v.severity === 'CRITICAL').length,
    score: claimRealityBase.score,
  };

  const readiness = analyzeLaunchReadiness({
    executionChainConnected: coreChainConnected,
    verificationProven,
    blockers,
    acceptance,
    simulation,
    claimReality: {
      ...claimReality,
      criticalViolations: claimReality.criticalViolations,
    },
    fixture: input.launchReadinessFixture,
  });

  const risk = analyzeLaunchRisk({
    blockers,
    simulation,
    executionChainConnected: coreChainConnected,
  });

  const manifest = analyzeLaunchManifest({
    executionProof: input.autonomousBuildExecutionProof ?? null,
    coreStageProofs: input.coreStageProofs,
    verificationProof: input.verificationExecutionProof ?? null,
    launchAssessmentId: assessmentId,
  });

  const linkage = analyzeLaunchLinkage({
    executionProof: input.autonomousBuildExecutionProof ?? null,
    coreStageProofs: input.coreStageProofs,
    readiness,
    launchProofProven: isLaunchReadyState(readiness.readinessState),
  });

  const launchProofLevel = deriveLaunchProofLevel({
    coreChainConnected,
    verificationProven,
    blockers,
    claimReality: {
      ...claimReality,
      criticalViolations: claimReality.criticalViolations,
    },
    acceptance,
    readiness,
    linkage,
  });

  let launchState: LaunchReadinessState = readiness.readinessState;
  if (hasCriticalClaimViolations(claimReality) || hasCriticalBlockers(blockers)) {
    launchState = 'BLOCKED';
  } else if (launchProofLevel === 'NOT_PROVEN') {
    launchState = 'NOT_READY';
  }

  const missingEvidence = dedupeStrings([
    ...blockers.blockers.map((b) => b.message),
    ...linkage.missingLinks,
    ...(verificationProven ? [] : ['Verification execution not proven']),
    ...(coreChainConnected ? [] : ['Core execution chain not connected through VERIFY']),
  ]).slice(0, 12);

  const recommendedFix =
    blockers.blockers[0]?.recommendedFix ??
    linkage.firstBrokenLaunchLink ??
    'Maintain connected launch readiness evidence through acceptance and simulation.';

  const founderQuestions = buildFounderQuestions({
    launchProofLevel,
    launchState,
    blockers,
    risk,
    readiness,
    linkage,
  });

  const report: LaunchReadinessProofReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    launchProofLevel,
    launchState,
    executionChainConnected: coreChainConnected,
    verificationProven,
    blockers,
    risk,
    acceptance,
    readiness,
    simulation,
    claimReality: {
      ...claimReality,
      criticalViolations: claimReality.violations.filter((v) => v.severity === 'CRITICAL').length,
      score: Math.max(
        0,
        100 - claimReality.violations.length * 15 -
          claimReality.violations.filter((v) => v.severity === 'CRITICAL').length * 20,
      ),
    },
    manifest,
    linkage,
    missingEvidence,
    recommendedFix,
    recommendedNextActions: founderQuestions.whatMustBeFixedNext,
    founderQuestions,
    cacheKey: stableCacheKey(assessmentId, launchProofLevel),
  };

  const assessment: LaunchReadinessProofAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'LAUNCH_READINESS_PROOF_COMPLETE',
    report,
  };

  recordLaunchReadinessProofAssessment(assessment);
  return assessment;
}

export function buildConnectedLaunchReadinessProofArtifacts(
  input: AssessConnectedLaunchReadinessProofInput = {},
): LaunchReadinessProofArtifacts {
  const launchReadinessProofAssessment = assessConnectedLaunchReadinessProof(input);
  return {
    launchReadinessProofAssessment,
    launchReadinessProofReportMarkdown: buildLaunchReadinessProofReportMarkdown(
      launchReadinessProofAssessment.report,
    ),
  };
}

export function resetConnectedLaunchReadinessProofModuleForTests(): void {
  resetLaunchReadinessProofCounterForTests();
}
