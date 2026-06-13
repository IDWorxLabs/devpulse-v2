/**
 * Founder Test Launch Readiness — one-button orchestration authority.
 * Consumes existing authorities only — no new scoring engines or reality authorities.
 */

import { createHash } from 'node:crypto';
import { assessFounderAcceptanceGate, resetFounderAcceptanceGateModuleForTests } from '../founder-acceptance-gate/index.js';
import type { FounderAcceptanceAssessment } from '../founder-acceptance-gate/founder-acceptance-gate-types.js';
import { evaluateFounderAcceptanceOrchestrator } from '../founder-acceptance-validation/founder-acceptance-orchestrator/index.js';
import type { FounderAcceptanceResultBundle } from '../founder-acceptance-validation/founder-acceptance-orchestrator/index.js';
import { assessFounderTestIntegration, resetFounderTestIntegrationModuleForTests } from '../founder-test-integration/index.js';
import { hydrateRuntimeFounderExecutionProofInputSync } from '../founder-test-integration/runtime-founder-execution-proof-hydration.js';
import type { RuntimeFounderExecutionProofHydration } from '../founder-test-integration/runtime-founder-execution-proof-hydration.js';
import type {
  FounderTestAssessment,
  FounderTestAuthorityResult,
} from '../founder-test-integration/founder-test-integration-types.js';
import { assessLaunchCouncil } from '../launch-council/index.js';
import type { LaunchCouncilAssessment, LaunchCouncilAuthorityResult } from '../launch-council/index.js';
import { recordFounderTestLaunchReadinessAssessment, resetFounderTestLaunchReadinessHistoryForTests } from './founder-test-launch-readiness-history.js';
import { buildFounderTestLaunchReadinessReportMarkdown } from './founder-test-launch-readiness-report-builder.js';
import {
  runFounderTestChatStressSimulation,
  formatChatStressSimulationSummary,
} from '../founder-test-chat-stress-simulation/index.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import {
  runFullProductReadinessSimulation,
  formatProductReadinessSummary,
} from '../founder-test-product-readiness/index.js';
import type { ProductReadinessReport } from '../founder-test-product-readiness/product-readiness-types.js';
import {
  assessAutonomousBuildExecutionProof,
  formatAutonomousBuildExecutionProofSummary,
} from '../autonomous-build-execution-proof/index.js';
import type { AutonomousBuildExecutionProofReport } from '../autonomous-build-execution-proof/autonomous-build-execution-proof-types.js';
import {
  assessConnectedBuildExecution,
  formatConnectedBuildExecutionSummary,
} from '../connected-build-execution/index.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import {
  assessConnectedRuntimeActivationProof,
  formatRuntimeActivationProofSummary,
} from '../connected-runtime-activation-proof/index.js';
import type { RuntimeActivationProofReport } from '../connected-runtime-activation-proof/connected-runtime-activation-proof-types.js';
import {
  assessConnectedPreviewExperienceProof,
  formatPreviewExperienceProofSummary,
} from '../connected-preview-experience-proof/index.js';
import type { PreviewExperienceProofReport } from '../connected-preview-experience-proof/connected-preview-experience-proof-types.js';
import {
  assessConnectedVerificationExecutionProof,
  formatVerificationExecutionProofSummary,
} from '../connected-verification-execution-proof/index.js';
import type { VerificationExecutionProofReport } from '../connected-verification-execution-proof/connected-verification-execution-proof-types.js';
import {
  assessConnectedLaunchReadinessProof,
  formatLaunchReadinessProofSummary,
} from '../connected-launch-readiness-proof/index.js';
import type { LaunchReadinessProofReport } from '../connected-launch-readiness-proof/connected-launch-readiness-proof-types.js';
import {
  FOUNDER_TEST_LAUNCH_READINESS_CACHE_KEY_PREFIX,
  FOUNDER_TEST_LAUNCH_READINESS_CORE_QUESTION,
  FOUNDER_TEST_LAUNCH_READINESS_PASS_TOKEN,
  FOUNDER_TEST_LAUNCH_READINESS_PHASE,
  MAX_TOP_BLOCKERS,
  MAX_TOP_MISSING_CAPABILITIES,
  MAX_TOP_RECOMMENDED_ACTIONS,
  MAX_TOP_WARNINGS,
} from './founder-test-launch-readiness-registry.js';
import type {
  FounderTestAuthoritySummary,
  FounderTestLaunchBlocker,
  FounderTestLaunchReadinessAssessment,
  FounderTestLaunchReadinessArtifacts,
  FounderTestLaunchReadinessReport,
  FounderTestLaunchRecommendedAction,
  FounderTestLaunchWarning,
  LaunchReadinessConfidence,
  LaunchReadinessVerdict,
  LaunchReadinessBuildTraceEvent,
  RunFounderTestLaunchReadinessInput,
} from './founder-test-launch-readiness-types.js';

function stableCacheKey(runId: string, verdict: LaunchReadinessVerdict, score: number): string {
  const digest = createHash('sha256')
    .update([FOUNDER_TEST_LAUNCH_READINESS_PASS_TOKEN, runId, verdict, score].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_TEST_LAUNCH_READINESS_CACHE_KEY_PREFIX}:${digest}`;
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

function buildLaunchCouncilFromFounderTest(
  founderTestAssessment: FounderTestAssessment,
): LaunchCouncilAssessment {
  const portfolioResults = founderTestAssessment.run.authorityResults.filter(
    (result) => result.authorityId !== 'LAUNCH_COUNCIL',
  );
  const portfolioScore =
    portfolioResults.length === 0
      ? 0
      : Math.round(
          portfolioResults.reduce((sum, result) => sum + result.normalizedScore, 0) /
            portfolioResults.length,
        );

  const councilInput: LaunchCouncilAuthorityResult = {
    authorityId: 'founder-testing',
    authorityName: 'Founder Test Integration Portfolio',
    authorityCategory: 'FOUNDER_TESTING',
    score: portfolioScore,
    confidence: portfolioScore,
    status: portfolioScore >= 70 ? 'PASS' : portfolioScore >= 50 ? 'WARNING' : 'FAIL',
    launchBlocker: portfolioResults.some((result) => result.criticalBlockerCount > 0),
    findings: portfolioResults.flatMap((result) => result.blockers).slice(0, 8),
    recommendations: portfolioResults.flatMap((result) => result.recommendations).slice(0, 8),
  };

  return assessLaunchCouncil({
    authorityResults: [councilInput],
    generatedAt: Date.now(),
  });
}

function buildAuthoritySummaries(
  authorityResults: FounderTestAuthorityResult[],
): FounderTestAuthoritySummary[] {
  return authorityResults.map((result) => ({
    readOnly: true,
    authorityId: result.authorityId,
    displayName: result.displayName,
    score: result.normalizedScore,
    available: result.available,
    blockers: [...result.blockers],
    warnings: [...result.warnings],
    recommendations: [...result.recommendations],
  }));
}

function authoritySummaryText(
  authorityResults: FounderTestAuthorityResult[],
  authorityId: string,
  fallback: string,
): string {
  const result = authorityResults.find((entry) => entry.authorityId === authorityId);
  if (!result || !result.available) {
    return `${fallback}: authority output unavailable.`;
  }
  const blockerNote = result.blockers.length > 0 ? ` Blockers: ${result.blockers[0]}.` : '';
  const warningNote = result.warnings.length > 0 ? ` Warnings: ${result.warnings[0]}.` : '';
  return `${result.displayName} score ${result.normalizedScore}/100.${blockerNote}${warningNote}`;
}

function formatFounderExecutionProofSummary(founderTestAssessment: FounderTestAssessment): string {
  const summary = founderTestAssessment.executionProofSummary;
  if (!summary) {
    return 'Founder Execution Proof (25.31): not assessed.';
  }
  const blockerNote =
    summary.topBlockers.length > 0 ? ` Blockers: ${summary.topBlockers.slice(0, 2).join('; ')}.` : '';
  return (
    `Founder Execution Proof (25.31): ${summary.founderExecutionState} — ` +
    `launch recommendation ${summary.launchRecommendation}; ` +
    `overall founder proof ${summary.overallFounderProofPercent}%.${blockerNote}`
  );
}

function formatRuntimeProofHydrationSummary(
  hydration: RuntimeFounderExecutionProofHydration,
  founderTestAssessment: FounderTestAssessment,
): string {
  const proven =
    founderTestAssessment.executionProofSummary?.founderExecutionState === 'FOUNDER_EXECUTION_PROVEN' ||
    founderTestAssessment.executionProofSummary?.founderExecutionState ===
      'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS';
  const executionConnectedSource =
    proven && hydration.hydrated ? 'hydrated-proof' : 'not-proven';
  const missingNote =
    hydration.missing.length > 0 ? ` Missing: ${hydration.missing.join(', ')}.` : '';
  const warningsNote =
    hydration.warnings.length > 0 ? ` Warnings: ${hydration.warnings.slice(0, 3).join('; ')}.` : '';
  return (
    `Hydrated: ${hydration.hydrated ? 'yes' : 'no'}; source: ${hydration.source}; ` +
    `executionConnected from ${executionConnectedSource}.${missingNote}${warningsNote}`
  );
}

function deriveLaunchReadinessVerdict(
  founderTestAssessment: FounderTestAssessment,
  founderAcceptanceAssessment: FounderAcceptanceAssessment,
  orchestratorBundle: FounderAcceptanceResultBundle,
  launchCouncilAssessment: LaunchCouncilAssessment,
): LaunchReadinessVerdict {
  if (
    founderTestAssessment.verdict === 'INSUFFICIENT_EVIDENCE' ||
    founderAcceptanceAssessment.acceptanceState === 'INSUFFICIENT_EVIDENCE' ||
    founderTestAssessment.summary.missingAuthorities.length > 0
  ) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (
    founderTestAssessment.verdict === 'BLOCKED' ||
    founderAcceptanceAssessment.acceptanceState === 'BLOCKED' ||
    founderTestAssessment.summary.criticalBlockerCount > 0 ||
    launchCouncilAssessment.launchBlockerCount > 0
  ) {
    return 'BLOCKED';
  }

  if (orchestratorBundle.result === 'FAIL' || orchestratorBundle.verdict === 'FOUNDER_REJECTS') {
    return 'NOT_LAUNCH_READY';
  }

  if (
    founderTestAssessment.verdict === 'FOUNDER_READY' &&
    founderAcceptanceAssessment.acceptanceState === 'ACCEPTED' &&
    orchestratorBundle.result === 'PASS'
  ) {
    return 'LAUNCH_READY';
  }

  if (
    founderTestAssessment.verdict === 'FOUNDER_READY_WITH_WARNINGS' ||
    founderAcceptanceAssessment.acceptanceState === 'ACCEPTED_WITH_WARNINGS' ||
    orchestratorBundle.result === 'PASS_WITH_WARNINGS'
  ) {
    return 'LAUNCH_READY_WITH_WARNINGS';
  }

  return 'NOT_LAUNCH_READY';
}

function deriveConfidenceLevel(
  founderTestAssessment: FounderTestAssessment,
  founderAcceptanceAssessment: FounderAcceptanceAssessment,
): LaunchReadinessConfidence {
  if (
    founderAcceptanceAssessment.acceptanceConfidence >= 85 &&
    founderTestAssessment.score.overall >= 85
  ) {
    return 'HIGH';
  }
  if (
    founderAcceptanceAssessment.acceptanceConfidence >= 65 &&
    founderTestAssessment.score.overall >= 70
  ) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function severityFromBlocker(text: string, criticalBlockerCount: number): FounderTestLaunchBlocker['severity'] {
  if (criticalBlockerCount > 0 || /critical|block|regression|reject/i.test(text)) {
    return 'CRITICAL';
  }
  if (/high|major|fail/i.test(text)) {
    return 'HIGH';
  }
  if (/medium|warning|gap/i.test(text)) {
    return 'MEDIUM';
  }
  return 'LOW';
}

export function aggregateTopBlockers(
  founderTestAssessment: FounderTestAssessment,
  founderAcceptanceAssessment: FounderAcceptanceAssessment,
  orchestratorBundle: FounderAcceptanceResultBundle,
): FounderTestLaunchBlocker[] {
  const blockers: FounderTestLaunchBlocker[] = [];

  for (const result of founderTestAssessment.run.authorityResults) {
    for (const blocker of result.blockers) {
      blockers.push({
        readOnly: true,
        sourceAuthority: result.displayName,
        severity: severityFromBlocker(blocker, result.criticalBlockerCount),
        explanation: blocker,
        recommendedAction:
          result.recommendations[0] ??
          founderAcceptanceAssessment.reasons.requiredNextActions[0] ??
          'Resolve blocker via read-only reassessment.',
      });
    }
  }

  for (const blocker of founderAcceptanceAssessment.reasons.blockingReasons) {
    blockers.push({
      readOnly: true,
      sourceAuthority: 'Founder Acceptance Gate (24G)',
      severity: 'CRITICAL',
      explanation: blocker,
      recommendedAction:
        founderAcceptanceAssessment.reasons.requiredNextActions[0] ??
        'Resolve acceptance blockers before launch.',
    });
  }

  for (const blocker of orchestratorBundle.report.criticalAcceptanceBlockers.slice(0, 4)) {
    blockers.push({
      readOnly: true,
      sourceAuthority: 'Founder Acceptance Orchestrator (24.8)',
      severity: 'HIGH',
      explanation: blocker.title ?? blocker.description,
      recommendedAction: blocker.description ?? 'Address orchestrator acceptance blocker.',
    });
  }

  const severityOrder: Record<FounderTestLaunchBlocker['severity'], number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  const seen = new Set<string>();
  const unique: FounderTestLaunchBlocker[] = [];
  for (const blocker of blockers) {
    const key = `${blocker.sourceAuthority}::${blocker.explanation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(blocker);
  }

  return unique
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, MAX_TOP_BLOCKERS);
}

export function aggregateTopWarnings(
  founderTestAssessment: FounderTestAssessment,
  founderAcceptanceAssessment: FounderAcceptanceAssessment,
): FounderTestLaunchWarning[] {
  const warnings: FounderTestLaunchWarning[] = [];

  for (const result of founderTestAssessment.run.authorityResults) {
    for (const warning of result.warnings) {
      warnings.push({
        readOnly: true,
        sourceAuthority: result.displayName,
        explanation: warning,
        recommendation: result.recommendations[0] ?? 'Review warning and retest.',
      });
    }
  }

  for (const warning of founderAcceptanceAssessment.reasons.warningReasons) {
    warnings.push({
      readOnly: true,
      sourceAuthority: 'Founder Acceptance Gate (24G)',
      explanation: warning,
      recommendation: 'Resolve warning-level findings before external launch.',
    });
  }

  const seen = new Set<string>();
  const unique: FounderTestLaunchWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.sourceAuthority}::${warning.explanation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(warning);
  }

  return unique.slice(0, MAX_TOP_WARNINGS);
}

export function aggregateTopRecommendedActions(
  founderTestAssessment: FounderTestAssessment,
  founderAcceptanceAssessment: FounderAcceptanceAssessment,
  orchestratorBundle: FounderAcceptanceResultBundle,
): FounderTestLaunchRecommendedAction[] {
  const actions: FounderTestLaunchRecommendedAction[] = [];

  for (const result of founderTestAssessment.run.authorityResults) {
    for (const recommendation of result.recommendations) {
      const founderImpact = Math.min(100, result.normalizedScore >= 80 ? 70 : 85);
      const launchImpact = Math.min(100, result.weight + 40);
      const riskReduction = Math.min(100, result.criticalBlockerCount > 0 ? 95 : 60);
      actions.push({
        readOnly: true,
        action: recommendation,
        sourceAuthority: result.displayName,
        founderImpact,
        launchImpact,
        riskReduction,
        priorityScore: founderImpact + launchImpact + riskReduction,
      });
    }
  }

  for (const action of founderAcceptanceAssessment.reasons.requiredNextActions) {
    actions.push({
      readOnly: true,
      action,
      sourceAuthority: 'Founder Acceptance Gate (24G)',
      founderImpact: 90,
      launchImpact: 95,
      riskReduction: 90,
      priorityScore: 275,
    });
  }

  for (const fix of orchestratorBundle.report.recommendedPriorityFixes.slice(0, 4)) {
    actions.push({
      readOnly: true,
      action: fix,
      sourceAuthority: 'Founder Acceptance Orchestrator (24.8)',
      founderImpact: 80,
      launchImpact: 90,
      riskReduction: 85,
      priorityScore: 255,
    });
  }

  for (const gap of orchestratorBundle.report.founderAcceptanceRoadmap.criticalAcceptanceFixes.slice(0, 2)) {
    actions.push({
      readOnly: true,
      action: gap.title ?? gap.description,
      sourceAuthority: 'Founder Acceptance Orchestrator (24.8)',
      founderImpact: 85,
      launchImpact: 92,
      riskReduction: 88,
      priorityScore: 265,
    });
  }

  return actions
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, MAX_TOP_RECOMMENDED_ACTIONS);
}

function emitLaunchReadinessBuildTrace(
  input: RunFounderTestLaunchReadinessInput,
  event: LaunchReadinessBuildTraceEvent,
): void {
  input.onBuildTrace?.(event);
}

export function runFounderTestLaunchReadiness(
  input: RunFounderTestLaunchReadinessInput = {},
): FounderTestLaunchReadinessAssessment {
  const rootDir = input.rootDir ?? process.cwd();

  emitLaunchReadinessBuildTrace(input, {
    operationId: 'loading-execution-proof',
    operationLabel: 'Loading execution proof',
    phase: 'RUNNING',
  });

  const hydratedBundle =
    input.runtimeProofHydration && input.founderExecutionProofInput
      ? {
          input: input.founderExecutionProofInput,
          hydration: input.runtimeProofHydration,
        }
      : hydrateRuntimeFounderExecutionProofInputSync(rootDir, input.founderExecutionProofInput ?? {});

  const founderExecutionProofInput = input.founderExecutionProofInput ?? hydratedBundle.input;
  const runtimeProofHydration = input.runtimeProofHydration ?? hydratedBundle.hydration;

  emitLaunchReadinessBuildTrace(input, {
    operationId: 'loading-execution-proof',
    operationLabel: 'Loading execution proof',
    phase: 'PASSED',
  });

  emitLaunchReadinessBuildTrace(input, {
    operationId: 'loading-founder-summary',
    operationLabel: 'Loading founder summary',
    phase: 'RUNNING',
  });

  const founderTestAssessment =
    input.founderTestAssessment ??
    assessFounderTestIntegration({
      rootDir,
      founderExecutionProofInput,
    });

  emitLaunchReadinessBuildTrace(input, {
    operationId: 'loading-founder-summary',
    operationLabel: 'Loading founder summary',
    phase: 'PASSED',
  });

  emitLaunchReadinessBuildTrace(input, {
    operationId: 'loading-readiness-authorities',
    operationLabel: 'Loading readiness authorities',
    phase: 'RUNNING',
  });

  const founderAcceptanceAssessment = assessFounderAcceptanceGate({
    founderTestAssessment,
    rootDir,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    governanceBlocked: input.governanceBlocked,
  });

  const orchestratorBundle = evaluateFounderAcceptanceOrchestrator({
    requestId: founderTestAssessment.run.runId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    governanceBlocked: input.governanceBlocked,
  });

  const launchCouncilAssessment = buildLaunchCouncilFromFounderTest(founderTestAssessment);
  const authorityResults = founderTestAssessment.run.authorityResults;
  const authoritySummaries = buildAuthoritySummaries(authorityResults);
  const participatingAuthorityCount = authoritySummaries.length;
  const availableAuthorityCount = authoritySummaries.filter((entry) => entry.available).length;
  const authorityCoverage =
    participatingAuthorityCount === 0
      ? 0
      : Math.round((availableAuthorityCount / participatingAuthorityCount) * 100);

  emitLaunchReadinessBuildTrace(input, {
    operationId: 'loading-readiness-authorities',
    operationLabel: 'Loading readiness authorities',
    phase: 'PASSED',
  });

  emitLaunchReadinessBuildTrace(input, {
    operationId: 'assessing-launch-readiness',
    operationLabel: 'Assessing launch readiness',
    phase: 'RUNNING',
  });

  const launchReadinessVerdict = deriveLaunchReadinessVerdict(
    founderTestAssessment,
    founderAcceptanceAssessment,
    orchestratorBundle,
    launchCouncilAssessment,
  );

  const chatStressSimulation = input.chatStressSimulation ?? null;
  const chatBlocksLaunchReadiness = chatStressSimulation?.chatBlocksLaunchReadiness ?? false;
  const chatStressSummary = chatStressSimulation
    ? formatChatStressSimulationSummary(chatStressSimulation)
    : null;

  let resolvedVerdict = launchReadinessVerdict;
  if (chatBlocksLaunchReadiness && resolvedVerdict === 'LAUNCH_READY') {
    resolvedVerdict = 'NOT_LAUNCH_READY';
  }
  if (chatBlocksLaunchReadiness && resolvedVerdict === 'LAUNCH_READY_WITH_WARNINGS') {
    resolvedVerdict = 'NOT_LAUNCH_READY';
  }

  const topBlockers = aggregateTopBlockers(
    founderTestAssessment,
    founderAcceptanceAssessment,
    orchestratorBundle,
  );

  if (chatBlocksLaunchReadiness && chatStressSimulation) {
    topBlockers.unshift({
      readOnly: true,
      sourceAuthority: 'Chat Stress Simulation',
      severity: chatStressSimulation.overallScore < 70 ? 'CRITICAL' : 'HIGH',
      explanation:
        `Chat score ${chatStressSimulation.overallScore}/100 blocks launch readiness (threshold 85). ` +
        `${chatStressSimulation.failedCount} failed and ${chatStressSimulation.weakCount} weak chat answers.`,
      recommendedAction:
        chatStressSimulation.recommendedNextChatImprovements[0] ??
        'Review Chat Stress Simulation failures and improve grounded chat responses.',
    });
  }

  const productReadinessSimulation = input.productReadinessSimulation ?? null;
  const productReadinessSummary = productReadinessSimulation
    ? formatProductReadinessSummary(productReadinessSimulation)
    : null;
  const productReadinessScore = productReadinessSimulation?.readinessScore ?? null;

  let autonomousBuildExecutionProof: AutonomousBuildExecutionProofReport | null =
    input.autonomousBuildExecutionProof ?? null;
  if (!input.skipAutonomousBuildExecutionProof && !autonomousBuildExecutionProof) {
    autonomousBuildExecutionProof = assessAutonomousBuildExecutionProof({
      rootDir,
      founderTestAssessment,
    }).report;
  }
  const autonomousBuildExecutionProofSummary = autonomousBuildExecutionProof
    ? formatAutonomousBuildExecutionProofSummary(autonomousBuildExecutionProof)
    : null;
  const executionChainConnected = autonomousBuildExecutionProof?.chainConnected ?? false;
  const executionChainBlocksLaunch = autonomousBuildExecutionProof?.launchBlockedByChain ?? false;
  const firstBrokenExecutionStage = autonomousBuildExecutionProof?.firstBrokenStage ?? null;

  let connectedBuildExecution: ConnectedBuildExecutionReport | null =
    input.connectedBuildExecution ?? null;
  if (!input.skipConnectedBuildExecution && !connectedBuildExecution) {
    if (autonomousBuildExecutionProof?.inputSnapshot.connectedBuildMaterialization) {
      connectedBuildExecution = autonomousBuildExecutionProof.inputSnapshot.connectedBuildMaterialization;
    } else {
      connectedBuildExecution = assessConnectedBuildExecution({ rootDir }).report;
    }
  }
  const connectedBuildExecutionSummary = connectedBuildExecution
    ? formatConnectedBuildExecutionSummary(connectedBuildExecution)
    : null;

  let connectedRuntimeActivationProof: RuntimeActivationProofReport | null =
    input.connectedRuntimeActivationProof ?? null;
  if (!input.skipConnectedRuntimeActivationProof && !connectedRuntimeActivationProof) {
    if (autonomousBuildExecutionProof?.inputSnapshot.connectedRuntimeActivationProof) {
      connectedRuntimeActivationProof =
        autonomousBuildExecutionProof.inputSnapshot.connectedRuntimeActivationProof;
    } else {
      connectedRuntimeActivationProof = assessConnectedRuntimeActivationProof({
        rootDir,
        buildMaterializationReport: connectedBuildExecution,
      }).report;
    }
  }
  const connectedRuntimeActivationProofSummary = connectedRuntimeActivationProof
    ? formatRuntimeActivationProofSummary(connectedRuntimeActivationProof)
    : null;

  let connectedPreviewExperienceProof: PreviewExperienceProofReport | null =
    input.connectedPreviewExperienceProof ?? null;
  if (!input.skipConnectedPreviewExperienceProof && !connectedPreviewExperienceProof) {
    if (autonomousBuildExecutionProof?.inputSnapshot.connectedPreviewExperienceProof) {
      connectedPreviewExperienceProof =
        autonomousBuildExecutionProof.inputSnapshot.connectedPreviewExperienceProof;
    } else {
      connectedPreviewExperienceProof = assessConnectedPreviewExperienceProof({
        rootDir,
        runtimeActivationProof: connectedRuntimeActivationProof,
      }).report;
    }
  }
  const connectedPreviewExperienceProofSummary = connectedPreviewExperienceProof
    ? formatPreviewExperienceProofSummary(connectedPreviewExperienceProof)
    : null;

  let connectedVerificationExecutionProof: VerificationExecutionProofReport | null =
    input.connectedVerificationExecutionProof ?? null;
  if (!input.skipConnectedVerificationExecutionProof && !connectedVerificationExecutionProof) {
    if (autonomousBuildExecutionProof?.inputSnapshot.connectedVerificationExecutionProof) {
      connectedVerificationExecutionProof =
        autonomousBuildExecutionProof.inputSnapshot.connectedVerificationExecutionProof;
    } else {
      connectedVerificationExecutionProof = assessConnectedVerificationExecutionProof({
        rootDir,
        previewExperienceProof: connectedPreviewExperienceProof,
      }).report;
    }
  }
  const connectedVerificationExecutionProofSummary = connectedVerificationExecutionProof
    ? formatVerificationExecutionProofSummary(connectedVerificationExecutionProof)
    : null;

  let connectedLaunchReadinessProof: LaunchReadinessProofReport | null =
    input.connectedLaunchReadinessProof ?? null;
  if (!input.skipConnectedLaunchReadinessProof && !connectedLaunchReadinessProof) {
    if (autonomousBuildExecutionProof?.inputSnapshot.connectedLaunchReadinessProof) {
      connectedLaunchReadinessProof =
        autonomousBuildExecutionProof.inputSnapshot.connectedLaunchReadinessProof;
    } else {
      connectedLaunchReadinessProof = assessConnectedLaunchReadinessProof({
        rootDir,
        autonomousBuildExecutionProof,
        verificationExecutionProof: connectedVerificationExecutionProof,
        founderTestAssessment,
        founderAcceptanceAssessment,
        launchCouncilAssessment,
        productReadinessSimulation,
        chatStressSimulation,
      }).report;
    }
  }
  const connectedLaunchReadinessProofSummary = connectedLaunchReadinessProof
    ? formatLaunchReadinessProofSummary(connectedLaunchReadinessProof)
    : null;

  if (connectedLaunchReadinessProof && connectedLaunchReadinessProof.launchProofLevel !== 'PROVEN') {
    topBlockers.unshift({
      readOnly: true,
      sourceAuthority: 'Connected Launch Readiness Proof',
      severity:
        connectedLaunchReadinessProof.blockers.criticalCount > 0 ? 'CRITICAL' : 'HIGH',
      explanation:
        `Launch proof ${connectedLaunchReadinessProof.launchProofLevel} — state ${connectedLaunchReadinessProof.launchState}. ` +
        `${connectedLaunchReadinessProof.founderQuestions.whyNot.slice(0, 2).join('; ')}`,
      recommendedAction: connectedLaunchReadinessProof.recommendedFix,
    });
    if (
      resolvedVerdict === 'LAUNCH_READY' ||
      resolvedVerdict === 'LAUNCH_READY_WITH_WARNINGS'
    ) {
      resolvedVerdict = 'NOT_LAUNCH_READY';
    }
  }

  if (executionChainBlocksLaunch && autonomousBuildExecutionProof) {
    topBlockers.unshift({
      readOnly: true,
      sourceAuthority: 'Autonomous Build Execution Proof',
      severity: 'CRITICAL',
      explanation:
        `Execution chain NOT CONNECTED — first break at ${autonomousBuildExecutionProof.firstBrokenStage ?? 'unknown'}. ` +
        `${autonomousBuildExecutionProof.missingEvidence.slice(0, 2).join('; ')}`,
      recommendedAction: autonomousBuildExecutionProof.recommendedFix,
    });
    if (
      resolvedVerdict === 'LAUNCH_READY' ||
      resolvedVerdict === 'LAUNCH_READY_WITH_WARNINGS'
    ) {
      resolvedVerdict = 'NOT_LAUNCH_READY';
    }
  }

  if (productReadinessSimulation?.launchBlocked) {
    topBlockers.unshift({
      readOnly: true,
      sourceAuthority: 'Product Readiness Simulation',
      severity: 'CRITICAL',
      explanation:
        `Product readiness ${productReadinessSimulation.readinessScore}/100 — ${productReadinessSimulation.verdict.replace(/_/g, ' ')}. Real users would hit blockers.`,
      recommendedAction:
        productReadinessSimulation.selfEvolution.whatShouldWeBuildNext[0] ??
        'Review FULL PRODUCT READINESS SIMULATION failures.',
    });
    if (resolvedVerdict === 'LAUNCH_READY' || resolvedVerdict === 'LAUNCH_READY_WITH_WARNINGS') {
      resolvedVerdict = 'NOT_LAUNCH_READY';
    }
  }

  const topMissingCapabilities = dedupeStrings([
    ...founderTestAssessment.missingCapabilities,
    ...(chatStressSimulation?.missingCapabilities ?? []),
    ...(productReadinessSimulation?.selfEvolution.topMissingCapabilities ?? []),
    ...(autonomousBuildExecutionProof?.founderQuestions.mustBuildNext ?? []),
    ...(connectedBuildExecution?.founderQuestions.whatShouldBeBuiltNext ?? []),
    ...(connectedRuntimeActivationProof?.founderQuestions.whatShouldBeBuiltNext ?? []),
    ...(connectedPreviewExperienceProof?.founderQuestions.whatShouldBeBuiltNext ?? []),
    ...(connectedVerificationExecutionProof?.founderQuestions.whatShouldBeBuiltNext ?? []),
    ...(connectedLaunchReadinessProof?.founderQuestions.whatMustBeFixedNext ?? []),
  ]).slice(0, MAX_TOP_MISSING_CAPABILITIES);

  const report: FounderTestLaunchReadinessReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: FOUNDER_TEST_LAUNCH_READINESS_CORE_QUESTION,
    runId: founderTestAssessment.run.runId,
    generatedAt: new Date().toISOString(),
    panelState: 'COMPLETE',
    founderReadinessScore: founderTestAssessment.score.overall,
    founderAcceptanceState: founderAcceptanceAssessment.acceptanceState,
    launchReadinessVerdict: resolvedVerdict,
    confidenceLevel: deriveConfidenceLevel(founderTestAssessment, founderAcceptanceAssessment),
    executionProofSummary: authoritySummaryText(
      authorityResults,
      'EXECUTION_PROOF_EVOLUTION',
      'Execution Proof Evolution (24E)',
    ),
    founderExecutionProofSummary: formatFounderExecutionProofSummary(founderTestAssessment),
    runtimeProofHydrationSummary: formatRuntimeProofHydrationSummary(
      runtimeProofHydration,
      founderTestAssessment,
    ),
    runtimeProofHydration,
    founderSimulationSummary: authoritySummaryText(
      authorityResults,
      'FOUNDER_SIMULATION',
      'Founder Simulation',
    ),
    requirementRealitySummary: authoritySummaryText(
      authorityResults,
      'REQUIREMENT_REALITY',
      'Requirement Reality',
    ),
    verificationRealitySummary: authoritySummaryText(
      authorityResults,
      'VERIFICATION_REALITY',
      'Verification Reality',
    ),
    livePreviewSummary: authoritySummaryText(
      authorityResults,
      'LIVE_PREVIEW_REALITY',
      'Live Preview Reality',
    ),
    mobileRuntimeSummary: authoritySummaryText(
      authorityResults,
      'MOBILE_RUNTIME_REALITY',
      'Mobile Runtime Reality',
    ),
    launchCouncilSummary: `Launch Council score ${launchCouncilAssessment.overallScore}/100 — readiness ${launchCouncilAssessment.readinessState}, ${launchCouncilAssessment.launchBlockerCount} launch blocker(s).`,
    orchestratorVerdict: orchestratorBundle.verdict,
    orchestratorScore: orchestratorBundle.score.overallScore,
    topBlockers: topBlockers.slice(0, MAX_TOP_BLOCKERS),
    topWarnings: aggregateTopWarnings(founderTestAssessment, founderAcceptanceAssessment),
    topRecommendedActions: aggregateTopRecommendedActions(
      founderTestAssessment,
      founderAcceptanceAssessment,
      orchestratorBundle,
    ),
    topMissingCapabilities,
    chatStressSimulation,
    chatStressSummary,
    chatBlocksLaunchReadiness,
    productReadinessSimulation,
    productReadinessSummary,
    productReadinessScore,
    autonomousBuildExecutionProof,
    autonomousBuildExecutionProofSummary,
    executionChainConnected,
    executionChainBlocksLaunch,
    firstBrokenExecutionStage,
    connectedBuildExecution,
    connectedBuildExecutionSummary,
    connectedRuntimeActivationProof,
    connectedRuntimeActivationProofSummary,
    connectedPreviewExperienceProof,
    connectedPreviewExperienceProofSummary,
    connectedVerificationExecutionProof,
    connectedVerificationExecutionProofSummary,
    connectedLaunchReadinessProof,
    connectedLaunchReadinessProofSummary,
    inputSnapshot: {
      readOnly: true,
      founderTestAssessment,
      founderAcceptanceAssessment,
      founderAcceptanceOrchestrator: orchestratorBundle,
      launchCouncilAssessment,
      authoritySummaries,
      authorityCoverage,
      participatingAuthorityCount,
      availableAuthorityCount,
    },
    cacheKey: stableCacheKey(
      founderTestAssessment.run.runId,
      resolvedVerdict,
      founderTestAssessment.score.overall,
    ),
  };

  const assessment: FounderTestLaunchReadinessAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_TEST_COMPLETE',
    report,
  };

  if (!input.skipHistoryRecording) {
    recordFounderTestLaunchReadinessAssessment(assessment);
  }

  emitLaunchReadinessBuildTrace(input, {
    operationId: 'assessing-launch-readiness',
    operationLabel: 'Assessing launch readiness',
    phase: 'PASSED',
  });

  return assessment;
}

export function buildFounderTestLaunchReadinessArtifacts(
  input: RunFounderTestLaunchReadinessInput = {},
): FounderTestLaunchReadinessArtifacts {
  const founderTestLaunchReadinessAssessment = runFounderTestLaunchReadiness(input);
  return {
    founderTestLaunchReadinessAssessment,
    founderTestLaunchReadinessReportMarkdown: buildFounderTestLaunchReadinessReportMarkdown(
      founderTestLaunchReadinessAssessment.report,
    ),
  };
}

export async function buildFounderTestLaunchReadinessArtifactsAsync(
  input: RunFounderTestLaunchReadinessInput = {},
): Promise<FounderTestLaunchReadinessArtifacts> {
  const rootDir = input.rootDir ?? process.cwd();

  emitLaunchReadinessBuildTrace(input, {
    operationId: 'launch-readiness-artifact-build-started',
    operationLabel: 'Launch readiness artifact build started',
    phase: 'RUNNING',
  });

  try {
    let autonomousBuildExecutionProof: AutonomousBuildExecutionProofReport | null =
      input.autonomousBuildExecutionProof ?? null;
    if (!input.skipAutonomousBuildExecutionProof && !autonomousBuildExecutionProof) {
      emitLaunchReadinessBuildTrace(input, {
        operationId: 'loading-autonomous-build-proof',
        operationLabel: 'Loading autonomous build execution proof',
        phase: 'RUNNING',
      });
      autonomousBuildExecutionProof = assessAutonomousBuildExecutionProof({ rootDir }).report;
      emitLaunchReadinessBuildTrace(input, {
        operationId: 'loading-autonomous-build-proof',
        operationLabel: 'Loading autonomous build execution proof',
        phase: 'PASSED',
      });
    }

    let productReadinessSimulation: ProductReadinessReport | null =
      input.productReadinessSimulation ?? null;
    let chatStressSimulation = input.chatStressSimulation ?? null;

    const hydratedBundle =
      input.runtimeProofHydration && input.founderExecutionProofInput
        ? {
            input: input.founderExecutionProofInput,
            hydration: input.runtimeProofHydration,
          }
        : null;
    const founderTestAssessment =
      input.founderTestAssessment ??
      assessFounderTestIntegration({
        rootDir,
        founderExecutionProofInput: hydratedBundle?.input ?? input.founderExecutionProofInput,
      });

    const mapSimulationTrace = (event: {
      operationId: string;
      operationLabel: string;
      phase: 'RUNNING' | 'PASSED' | 'FAILED' | 'SLOW' | 'STALLED' | 'BUDGET_EXCEEDED';
      errorMessage?: string;
    }) => {
      const completionBoundary =
        event.operationId === 'chat-stress-simulation-complete' ||
        event.operationId === 'product-readiness-simulation-complete' ||
        event.operationId === 'launch-readiness-assessment-complete' ||
        event.operationId === 'launch-readiness-artifacts-built';
      emitLaunchReadinessBuildTrace(input, {
        operationId: event.operationId,
        operationLabel: event.errorMessage
          ? `${event.operationLabel}: ${event.errorMessage}`
          : event.operationLabel,
        phase:
          event.phase === 'PASSED' || completionBoundary
            ? 'PASSED'
            : event.phase === 'RUNNING'
              ? 'RUNNING'
              : 'FAILED',
      });
    };

    if (!input.skipProductReadinessSimulation && !productReadinessSimulation) {
      emitLaunchReadinessBuildTrace(input, {
        operationId: 'running-product-readiness-simulation',
        operationLabel: 'Running product readiness simulation',
        phase: 'RUNNING',
      });
      const productReadiness = await runFullProductReadinessSimulation({
        rootDir,
        skipChatStressSimulation: input.skipChatStressSimulation,
        chatStressMaxScenarios: input.chatStressMaxScenarios,
        founderReviewerConfidence: null,
        founderTestAssessment,
        founderTestContext: true,
        onSimulationTrace: mapSimulationTrace,
      });
      productReadinessSimulation = productReadiness.report;
      chatStressSimulation = productReadiness.report.chatStressSimulation;
      emitLaunchReadinessBuildTrace(input, {
        operationId: 'running-product-readiness-simulation',
        operationLabel: productReadiness.report.simulationDegradedPartial
          ? `Running product readiness simulation (${productReadiness.report.simulationRuntimeHealth})`
          : 'Running product readiness simulation',
        phase: 'PASSED',
        errorMessage: productReadiness.report.simulationDegradedPartial
          ? productReadiness.report.simulationBudgetNotes.join(' ')
          : undefined,
      });
      emitLaunchReadinessBuildTrace(input, {
        operationId: 'product-readiness-simulation-complete',
        operationLabel: 'Product readiness simulation complete',
        phase: 'PASSED',
      });
    } else if (!input.skipChatStressSimulation && !chatStressSimulation) {
      emitLaunchReadinessBuildTrace(input, {
        operationId: 'running-chat-stress-simulation',
        operationLabel: 'Running chat stress simulation',
        phase: 'RUNNING',
      });
      const chatStress = await runFounderTestChatStressSimulation({
        rootDir,
        maxScenarios: input.chatStressMaxScenarios,
        founderTestContext: true,
        onTrace: mapSimulationTrace,
      });
      chatStressSimulation = chatStress.report;
      emitLaunchReadinessBuildTrace(input, {
        operationId: 'running-chat-stress-simulation',
        operationLabel: chatStress.report.degradedPartialResult
          ? `Running chat stress simulation (${chatStress.report.runtimeHealth})`
          : 'Running chat stress simulation',
        phase: 'PASSED',
        errorMessage: chatStress.report.degradedPartialResult
          ? chatStress.report.budgetNotes.join(' ')
          : undefined,
      });
      emitLaunchReadinessBuildTrace(input, {
        operationId: 'chat-stress-simulation-complete',
        operationLabel: 'Chat stress simulation complete',
        phase: 'PASSED',
      });
    }

    const founderTestLaunchReadinessAssessment = runFounderTestLaunchReadiness({
      ...input,
      founderTestAssessment,
      productReadinessSimulation,
      autonomousBuildExecutionProof,
      skipAutonomousBuildExecutionProof: true,
      skipConnectedBuildExecution: true,
      skipConnectedRuntimeActivationProof: true,
      skipConnectedPreviewExperienceProof: true,
      skipConnectedVerificationExecutionProof: true,
      skipConnectedLaunchReadinessProof: true,
    });

    emitLaunchReadinessBuildTrace(input, {
      operationId: 'launch-readiness-assessment-complete',
      operationLabel: 'Launch readiness assessment complete',
      phase: 'PASSED',
    });

    emitLaunchReadinessBuildTrace(input, {
      operationId: 'building-launch-readiness-report-markdown',
      operationLabel: 'Building launch readiness report markdown',
      phase: 'RUNNING',
    });
    const founderTestLaunchReadinessReportMarkdown = buildFounderTestLaunchReadinessReportMarkdown(
      founderTestLaunchReadinessAssessment.report,
    );
    emitLaunchReadinessBuildTrace(input, {
      operationId: 'building-launch-readiness-report-markdown',
      operationLabel: 'Building launch readiness report markdown',
      phase: 'PASSED',
    });

    emitLaunchReadinessBuildTrace(input, {
      operationId: 'launch-readiness-artifacts-built',
      operationLabel: 'Launch readiness artifacts built',
      phase: 'PASSED',
    });

    return {
      founderTestLaunchReadinessAssessment,
      founderTestLaunchReadinessReportMarkdown,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'launch readiness artifact build failed';
    emitLaunchReadinessBuildTrace(input, {
      operationId: 'launch-readiness-artifact-build-failed',
      operationLabel: 'Launch readiness artifact build failed',
      phase: 'FAILED',
      errorMessage: message,
    });
    throw err;
  }
}

export function resetFounderTestLaunchReadinessModuleForTests(): void {
  resetFounderTestLaunchReadinessHistoryForTests();
  resetFounderTestIntegrationModuleForTests();
  resetFounderAcceptanceGateModuleForTests();
}
