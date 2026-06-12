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
import type {
  FounderTestAssessment,
  FounderTestAuthorityResult,
} from '../founder-test-integration/founder-test-integration-types.js';
import { assessLaunchCouncil } from '../launch-council/index.js';
import type { LaunchCouncilAssessment, LaunchCouncilAuthorityResult } from '../launch-council/index.js';
import { recordFounderTestLaunchReadinessAssessment, resetFounderTestLaunchReadinessHistoryForTests } from './founder-test-launch-readiness-history.js';
import { buildFounderTestLaunchReadinessReportMarkdown } from './founder-test-launch-readiness-report-builder.js';
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

export function runFounderTestLaunchReadiness(
  input: RunFounderTestLaunchReadinessInput = {},
): FounderTestLaunchReadinessAssessment {
  const rootDir = input.rootDir ?? process.cwd();

  const founderTestAssessment =
    input.founderTestAssessment ??
    assessFounderTestIntegration({
      rootDir,
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

  const launchReadinessVerdict = deriveLaunchReadinessVerdict(
    founderTestAssessment,
    founderAcceptanceAssessment,
    orchestratorBundle,
    launchCouncilAssessment,
  );

  const report: FounderTestLaunchReadinessReport = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: FOUNDER_TEST_LAUNCH_READINESS_CORE_QUESTION,
    runId: founderTestAssessment.run.runId,
    generatedAt: new Date().toISOString(),
    panelState: 'COMPLETE',
    founderReadinessScore: founderTestAssessment.score.overall,
    founderAcceptanceState: founderAcceptanceAssessment.acceptanceState,
    launchReadinessVerdict,
    confidenceLevel: deriveConfidenceLevel(founderTestAssessment, founderAcceptanceAssessment),
    executionProofSummary: authoritySummaryText(
      authorityResults,
      'EXECUTION_PROOF_EVOLUTION',
      'Execution Proof Evolution (24E)',
    ),
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
    topBlockers: aggregateTopBlockers(
      founderTestAssessment,
      founderAcceptanceAssessment,
      orchestratorBundle,
    ),
    topWarnings: aggregateTopWarnings(founderTestAssessment, founderAcceptanceAssessment),
    topRecommendedActions: aggregateTopRecommendedActions(
      founderTestAssessment,
      founderAcceptanceAssessment,
      orchestratorBundle,
    ),
    topMissingCapabilities: dedupeStrings(founderTestAssessment.missingCapabilities).slice(
      0,
      MAX_TOP_MISSING_CAPABILITIES,
    ),
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
      launchReadinessVerdict,
      founderTestAssessment.score.overall,
    ),
  };

  const assessment: FounderTestLaunchReadinessAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'FOUNDER_TEST_COMPLETE',
    report,
  };

  recordFounderTestLaunchReadinessAssessment(assessment);
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

export function resetFounderTestLaunchReadinessModuleForTests(): void {
  resetFounderTestLaunchReadinessHistoryForTests();
  resetFounderTestIntegrationModuleForTests();
  resetFounderAcceptanceGateModuleForTests();
}
