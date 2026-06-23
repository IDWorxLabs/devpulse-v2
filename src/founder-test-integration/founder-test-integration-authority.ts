/**
 * Founder Test Integration — founder verdict, scoring, and assessment assembly.
 */

import { createHash } from 'node:crypto';
import {
  FOUNDER_READY_MIN_SCORE,
  FOUNDER_READY_WITH_WARNINGS_MIN_SCORE,
  FOUNDER_SIMULATION_PASS_MIN_SCORE,
  FOUNDER_TEST_CACHE_KEY_PREFIX,
  FOUNDER_TEST_INTEGRATION_OWNER_MODULE,
  FOUNDER_TEST_AUTHORITY_REGISTRATIONS,
  MAJOR_AUTHORITY_MIN_AVAILABLE,
  MAX_FOUNDER_TEST_BLOCKERS,
  MAX_FOUNDER_TEST_FINDINGS,
  MAX_FOUNDER_TEST_RECOMMENDATIONS,
  MAX_FOUNDER_TEST_WARNINGS,
  REQUIREMENT_REALITY_MIN_SCORE,
  listMajorFounderTestAuthorities,
} from './founder-test-integration-registry.js';
import { recordFounderTestAssessment, resetFounderTestIntegrationHistoryForTests } from './founder-test-integration-history.js';
import {
  resetFounderTestIntegrationRunCounterForTests,
  runFounderTestIntegration,
} from './founder-test-integration-orchestrator.js';
import { buildFounderTestIntegrationReportMarkdown } from './founder-test-integration-report-builder.js';
import {
  assessFounderExecutionProof,
  buildFounderExecutionProofSummary,
  resetFounderExecutionProofModuleForTests,
} from '../founder-execution-proof/index.js';
import {
  buildFounderTestIntegrationRecursionFallback,
  runWithAuthorityGuard,
} from '../authority-recursion-guard/index.js';
import {
  resolveFounderExecutionConnected,
  type ResolvedFounderExecutionConnected,
} from './founder-execution-connected-resolver.js';
import { resolveExecutionChainStageContext } from './connected-execution-chain-stage-resolver.js';
import { assessConnectedLaunchReadinessProof } from '../connected-launch-readiness-proof/index.js';
import { resetExecutionProofEvolutionModuleForTests } from '../execution-proof-evolution/index.js';
import {
  buildFounderAcceptanceBridgeSnapshot,
  resolveAuthoritativeFounderAcceptance,
} from '../foundation/founder-acceptance-integration-bridge.js';
import type {
  FounderTestAssessment,
  FounderTestAuthorityId,
  FounderTestAuthorityResult,
  FounderTestCategory,
  FounderTestFinding,
  FounderTestFindingSeverity,
  FounderTestReport,
  FounderTestRun,
  FounderTestScore,
  FounderTestSummary,
  FounderTestVerdict,
  RunFounderTestIntegrationInput,
} from './founder-test-integration-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function stableCacheKey(runId: string, score: number, verdict: FounderTestVerdict): string {
  const digest = createHash('sha256')
    .update([FOUNDER_TEST_INTEGRATION_OWNER_MODULE, runId, score, verdict].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_TEST_CACHE_KEY_PREFIX}:${digest}`;
}

function mapAuthorityCategory(authorityId: FounderTestAuthorityId): FounderTestCategory {
  const registration = FOUNDER_TEST_AUTHORITY_REGISTRATIONS.find((entry) => entry.authorityId === authorityId);
  return (registration?.category as FounderTestCategory | undefined) ?? 'INTEGRATION';
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

function computeFounderTestScore(authorityResults: FounderTestAuthorityResult[]): FounderTestScore {
  const byAuthority = {} as Record<FounderTestAuthorityId, number>;
  const weightedBreakdown = {} as Record<FounderTestAuthorityId, number>;

  let overall = 0;
  for (const result of authorityResults) {
    byAuthority[result.authorityId] = result.normalizedScore;
    weightedBreakdown[result.authorityId] = result.weightedContribution;
    overall += result.weightedContribution;
  }

  return {
    overall: clamp(overall),
    byAuthority,
    weightedBreakdown,
  };
}

function aggregateFindings(authorityResults: FounderTestAuthorityResult[]): FounderTestFinding[] {
  const findings: FounderTestFinding[] = [];
  let counter = 0;

  const pushFinding = (
    sourceAuthority: FounderTestAuthorityId,
    severity: FounderTestFindingSeverity,
    summary: string,
    recommendation: string | null,
  ) => {
    counter += 1;
    findings.push({
      findingId: `ftf-${counter}`,
      category: mapAuthorityCategory(sourceAuthority),
      severity,
      summary,
      sourceAuthority,
      recommendation,
    });
  };

  for (const result of authorityResults) {
    if (!result.available) {
      pushFinding(result.authorityId, 'HIGH', `${result.displayName} result missing`, 'Re-run founder test with complete authority coverage');
      continue;
    }

    for (const blocker of result.blockers.slice(0, 4)) {
      pushFinding(
        result.authorityId,
        result.criticalBlockerCount > 0 ? 'CRITICAL' : 'HIGH',
        blocker,
        result.recommendations[0] ?? null,
      );
    }

    for (const warning of result.warnings.slice(0, 3)) {
      pushFinding(result.authorityId, 'MEDIUM', warning, null);
    }

    if (result.executionProofVerdict === 'REGRESSION_DETECTED') {
      pushFinding(
        result.authorityId,
        'CRITICAL',
        'Execution proof regression detected',
        'Revert risky fix paths and retest original failure',
      );
    }

    if (result.simulationPassed === false) {
      pushFinding(
        result.authorityId,
        'HIGH',
        'Founder simulation did not pass',
        'Resolve blocked workflows before founder-ready verdict',
      );
    }
  }

  return dedupeFindingSummaries(findings).slice(0, MAX_FOUNDER_TEST_FINDINGS);
}

function dedupeFindingSummaries(findings: FounderTestFinding[]): FounderTestFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.sourceAuthority}:${finding.summary.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSummary(run: FounderTestRun, score: FounderTestScore): FounderTestSummary {
  const majorAuthorities = listMajorFounderTestAuthorities();
  const availableMajor = run.authorityResults.filter(
    (result) => result.available && majorAuthorities.some((entry) => entry.authorityId === result.authorityId),
  ).length;

  const simulation = run.authorityResults.find((r) => r.authorityId === 'FOUNDER_SIMULATION');
  const requirement = run.authorityResults.find((r) => r.authorityId === 'REQUIREMENT_REALITY');
  const executionProof = run.authorityResults.find((r) => r.authorityId === 'EXECUTION_PROOF_EVOLUTION');

  const missingAuthorities = majorAuthorities
    .filter((entry) => {
      const result = run.authorityResults.find((r) => r.authorityId === entry.authorityId);
      return !result || !result.available;
    })
    .map((entry) => entry.displayName);

  return {
    participatingAuthorities: run.authorityResults.length,
    availableAuthorities: run.authorityResults.filter((r) => r.available).length,
    missingAuthorities,
    criticalBlockerCount: run.authorityResults.reduce((sum, r) => sum + r.criticalBlockerCount, 0),
    warningCount: run.authorityResults.reduce((sum, r) => sum + r.warnings.length, 0),
    recommendationCount: run.authorityResults.reduce((sum, r) => sum + r.recommendations.length, 0),
    founderSimulationPassed:
      simulation?.simulationPassed ??
      (simulation ? simulation.normalizedScore >= FOUNDER_SIMULATION_PASS_MIN_SCORE : false),
    executionProofRegressionFree:
      executionProof?.executionProofVerdict !== 'REGRESSION_DETECTED' && !executionProof?.regressionDetected,
    requirementRealityAboveThreshold:
      requirement ? requirement.normalizedScore >= REQUIREMENT_REALITY_MIN_SCORE : false,
  };
}

export function deriveFounderTestVerdict(
  score: FounderTestScore,
  summary: FounderTestSummary,
  findings: FounderTestFinding[],
): FounderTestVerdict {
  const criticalFindings = findings.filter((f) => f.severity === 'CRITICAL');
  const hasCriticalBlockers = summary.criticalBlockerCount > 0 || criticalFindings.length > 0;

  if (summary.missingAuthorities.length > 0 || summary.availableAuthorities < MAJOR_AUTHORITY_MIN_AVAILABLE) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (hasCriticalBlockers) {
    return 'BLOCKED';
  }

  if (
    score.overall >= FOUNDER_READY_MIN_SCORE &&
    summary.founderSimulationPassed &&
    summary.executionProofRegressionFree &&
    summary.requirementRealityAboveThreshold
  ) {
    return 'FOUNDER_READY';
  }

  if (score.overall >= FOUNDER_READY_WITH_WARNINGS_MIN_SCORE) {
    return 'FOUNDER_READY_WITH_WARNINGS';
  }

  return 'NOT_FOUNDER_READY';
}

function buildRecommendations(
  verdict: FounderTestVerdict,
  summary: FounderTestSummary,
  score: FounderTestScore,
): string[] {
  const items: string[] = [];

  if (verdict === 'INSUFFICIENT_EVIDENCE') {
    items.push('Missing major authority results — rerun founder test with complete read-only coverage.');
    for (const missing of summary.missingAuthorities.slice(0, 4)) {
      items.push(`Restore missing authority output: ${missing}`);
    }
  }

  if (verdict === 'BLOCKED') {
    items.push('Resolve critical blockers before treating the product as founder-ready.');
  }

  if (verdict === 'NOT_FOUNDER_READY') {
    items.push(`Raise unified founder score from ${score.overall} toward ${FOUNDER_READY_WITH_WARNINGS_MIN_SCORE}+.`);
  }

  if (verdict === 'FOUNDER_READY_WITH_WARNINGS') {
    items.push('Founder-ready with warnings — address medium findings before external launch.');
  }

  if (!summary.founderSimulationPassed) {
    items.push('Founder simulation must pass before FOUNDER_READY verdict.');
  }

  if (!summary.executionProofRegressionFree) {
    items.push('Execution proof regression detected — do not accept fix-created claims as proof.');
  }

  if (!summary.requirementRealityAboveThreshold) {
    items.push(`Requirement reality must reach ${REQUIREMENT_REALITY_MIN_SCORE}+ before FOUNDER_READY.`);
  }

  if (verdict === 'FOUNDER_READY') {
    items.push('Unified founder test passed — maintain before/after proof for future changes.');
  }

  if (!items.length) {
    items.push('Maintain read-only founder test coverage across all participating authorities.');
  }

  return items.slice(0, MAX_FOUNDER_TEST_RECOMMENDATIONS);
}

export function assessFounderTestIntegration(
  input: RunFounderTestIntegrationInput = {},
): FounderTestAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  return runWithAuthorityGuard({
    authorityName: 'FOUNDER_TEST_INTEGRATION',
    options: { allowHeavyOrchestration: true },
    invoke: () => assessFounderTestIntegrationCore(input, rootDir),
    onRecursion: (detection) => buildFounderTestIntegrationRecursionFallback(detection, rootDir),
  });
}

function assessFounderTestIntegrationCore(
  input: RunFounderTestIntegrationInput,
  rootDir: string,
): FounderTestAssessment {
  const founderExecutionProofPre =
    input.founderExecutionProofAssessment ??
    assessFounderExecutionProof({
      rootDir,
      ...input.founderExecutionProofInput,
      founderAcceptanceAssessment:
        input.founderExecutionProofInput?.founderAcceptanceAssessment ?? undefined,
    });

  const resolvedExecutionConnected: ResolvedFounderExecutionConnected =
    input.resolvedExecutionConnected !== undefined
      ? {
          readOnly: true,
          executionConnected: input.resolvedExecutionConnected,
          source: input.resolvedExecutionConnected
            ? 'founder-execution-proof-25.31'
            : 'not-proven',
          proofId: founderExecutionProofPre.report.proofId,
          founderExecutionProven: input.resolvedExecutionConnected,
          resolvedAt: new Date().toISOString(),
        }
      : resolveFounderExecutionConnected({
          founderExecutionProofAssessment: founderExecutionProofPre,
        });

  const chainContextBase =
    input.executionChainStageContext ??
    resolveExecutionChainStageContext(rootDir, {
      skipVerificationProofGapActivation: input.skipVerificationProofGapActivation,
    });

  let launchReadinessProof = chainContextBase.launchReadinessProof;
  if (
    !input.skipLaunchProofGapResolution &&
    chainContextBase.verificationProven &&
    !launchReadinessProof
  ) {
    launchReadinessProof = assessConnectedLaunchReadinessProof({
      rootDir,
      verificationExecutionProof: chainContextBase.verificationExecutionProof,
      buildMaterializationReport: chainContextBase.buildMaterializationReport ?? undefined,
      skipFounderTestReassessment: true,
    }).report;
  }

  const chainContext =
    input.executionChainStageContext ??
    resolveExecutionChainStageContext(rootDir, {
      skipVerificationProofGapActivation: input.skipVerificationProofGapActivation,
      verificationExecutionProof: chainContextBase.verificationExecutionProof,
      buildMaterializationReport: chainContextBase.buildMaterializationReport ?? undefined,
      launchReadinessProof,
      launchProven: launchReadinessProof?.launchProofLevel === 'PROVEN',
      launchExecutionConnected: launchReadinessProof?.launchExecutionConnected ?? false,
    });

  const run = runFounderTestIntegration({
    ...input,
    rootDir,
    resolvedBuilderMaterializationConnected: chainContext.builderMaterializationConnected,
    resolvedPreviewExperienceConnected: chainContext.previewExperienceConnected,
    executionChainStageContext: chainContext,
    resolvedExecutionConnected: input.resolvedExecutionConnected,
    founderExecutionProofAssessment: founderExecutionProofPre,
  });

  const score = computeFounderTestScore(run.authorityResults);
  const summary = buildSummary(run, score);
  const findings = aggregateFindings(run.authorityResults);

  const blockers = dedupeStrings(
    findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').map((f) => f.summary),
  ).slice(0, MAX_FOUNDER_TEST_BLOCKERS);

  const warnings = dedupeStrings(
    findings.filter((f) => f.severity === 'MEDIUM').map((f) => f.summary),
  ).slice(0, MAX_FOUNDER_TEST_WARNINGS);

  const recommendations = buildRecommendations(
    deriveFounderTestVerdict(score, summary, findings),
    summary,
    score,
  );

  const missingCapabilities = dedupeStrings(
    run.authorityResults.flatMap((result) => result.missingCapabilities),
  ).slice(0, 12);

  const verdict = deriveFounderTestVerdict(score, summary, findings);

  const orchestratorBundle = resolveAuthoritativeFounderAcceptance({
    requestId: run.runId,
  });
  const portfolioAcceptanceBridge = buildFounderAcceptanceBridgeSnapshot(
    orchestratorBundle,
    'founder_test_integration',
    false,
  );

  const assessmentWithoutProof: Omit<FounderTestAssessment, 'executionProofSummary'> = {
    readOnly: true,
    advisoryOnly: true,
    run,
    score,
    summary,
    verdict,
    findings,
    blockers,
    warnings,
    recommendations,
    missingCapabilities,
    portfolioAcceptanceBridge,
    cacheKey: stableCacheKey(run.runId, score.overall, verdict),
  };

  const founderExecutionProof = assessFounderExecutionProof({
    rootDir,
    ...input.founderExecutionProofInput,
    founderTestAssessment: assessmentWithoutProof as FounderTestAssessment,
    founderAcceptanceAssessment:
      input.founderExecutionProofInput?.founderAcceptanceAssessment ?? undefined,
  });

  const assessment: FounderTestAssessment = {
    ...assessmentWithoutProof,
    executionProofSummary: buildFounderExecutionProofSummary(founderExecutionProof),
  };

  recordFounderTestAssessment(assessment);
  return assessment;
}

export function buildFounderTestIntegrationReport(
  assessment: FounderTestAssessment,
  generatedAt = new Date().toISOString(),
): FounderTestReport {
  return {
    generatedAt,
    phaseName: 'Phase 24F — One Button Founder Test Integration',
    purpose:
      'One button → one execution → one report → one founder verdict across participating read-only authorities.',
    assessment,
    passToken: 'FOUNDER_TEST_INTEGRATION_PASS',
  };
}

export function buildFounderTestIntegrationArtifacts(
  input: RunFounderTestIntegrationInput = {},
): {
  founderTestAssessment: FounderTestAssessment;
  founderTestReportMarkdown: string;
} {
  const founderTestAssessment = assessFounderTestIntegration(input);
  const report = buildFounderTestIntegrationReport(founderTestAssessment);
  return {
    founderTestAssessment,
    founderTestReportMarkdown: buildFounderTestIntegrationReportMarkdown(report),
  };
}

export function resetFounderTestIntegrationModuleForTests(): void {
  resetFounderTestIntegrationHistoryForTests();
  resetFounderTestIntegrationRunCounterForTests();
  resetExecutionProofEvolutionModuleForTests();
  resetFounderExecutionProofModuleForTests();
}
