/**
 * Founder Acceptance Gate — final authority for founder-acceptable project state.
 */

import { createHash } from 'node:crypto';
import { assessFounderTestIntegration, resetFounderTestIntegrationModuleForTests } from '../founder-test-integration/index.js';
import type { FounderTestAssessment, FounderTestAuthorityResult } from '../founder-test-integration/index.js';
import {
  applyOrchestratorAcceptanceDelegation,
  buildFounderAcceptanceBridgeSnapshot,
  resolveAuthoritativeFounderAcceptance,
} from '../foundation/founder-acceptance-integration-bridge.js';
import { recordFounderAcceptanceAssessment, resetFounderAcceptanceGateHistoryForTests } from './founder-acceptance-gate-history.js';
import {
  ACCEPTED_MIN_FOUNDER_TEST_SCORE,
  ACCEPTED_WITH_WARNINGS_MIN_FOUNDER_TEST_SCORE,
  CONFIDENCE_WEIGHT_AUTHORITY_COVERAGE,
  CONFIDENCE_WEIGHT_FOUNDER_READINESS,
  CONFIDENCE_WEIGHT_PROOF_QUALITY,
  CONFIDENCE_WEIGHT_REQUIREMENT_COMPLETENESS,
  CONFIDENCE_WEIGHT_SIMULATION_QUALITY,
  FOUNDER_ACCEPTANCE_CACHE_KEY_PREFIX,
  FOUNDER_ACCEPTANCE_CORE_QUESTION,
  FOUNDER_ACCEPTANCE_GATE_OWNER_MODULE,
  FOUNDER_ACCEPTANCE_GATE_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_GATE_PHASE,
  MAX_ACCEPTANCE_REASONS,
  MAX_REQUIRED_NEXT_ACTIONS,
  REQUIRED_ACCEPTANCE_AUTHORITY_IDS,
  REQUIRED_ACCEPTANCE_AUTHORITY_LABELS,
  REQUIREMENT_REALITY_ACCEPTANCE_MIN_SCORE,
  clampConfidence,
} from './founder-acceptance-gate-registry.js';
import { buildFounderAcceptanceGateReportMarkdown } from './founder-acceptance-gate-report-builder.js';
import type {
  AssessFounderAcceptanceGateInput,
  FounderAcceptanceAssessment,
  FounderAcceptanceAuthoritySnapshot,
  FounderAcceptanceConfidenceBreakdown,
  FounderAcceptanceInputSnapshot,
  FounderAcceptanceReasons,
  FounderAcceptanceReport,
  FounderAcceptanceRequiredAuthorityId,
  FounderAcceptanceState,
} from './founder-acceptance-gate-types.js';
import type { FounderAcceptanceBridgeSnapshot } from '../foundation/founder-acceptance-integration-bridge.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function stableCacheKey(runId: string, state: FounderAcceptanceState, confidence: number): string {
  const digest = createHash('sha256')
    .update([FOUNDER_ACCEPTANCE_GATE_OWNER_MODULE, runId, state, confidence].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${FOUNDER_ACCEPTANCE_CACHE_KEY_PREFIX}:${digest}`;
}

function getAuthorityResult(
  assessment: FounderTestAssessment,
  authorityId: FounderAcceptanceRequiredAuthorityId,
): FounderTestAuthorityResult | null {
  return assessment.run.authorityResults.find((result) => result.authorityId === authorityId) ?? null;
}

function buildInputSnapshot(
  founderTestAssessment: FounderTestAssessment,
  authoritativeAcceptanceBridge: FounderAcceptanceBridgeSnapshot,
): FounderAcceptanceInputSnapshot {
  const requiredAuthorities: FounderAcceptanceAuthoritySnapshot[] = REQUIRED_ACCEPTANCE_AUTHORITY_IDS.map(
    (authorityId) => {
      const result = getAuthorityResult(founderTestAssessment, authorityId);
      return {
        authorityId,
        displayName: REQUIRED_ACCEPTANCE_AUTHORITY_LABELS[authorityId],
        available: result?.available ?? false,
        score: result?.normalizedScore ?? 0,
        blockers: result?.blockers ?? [],
        warnings: result?.warnings ?? [],
      };
    },
  );

  const missingRequiredAuthorities = requiredAuthorities
    .filter((entry) => !entry.available)
    .map((entry) => entry.displayName);

  const executionProof = getAuthorityResult(founderTestAssessment, 'EXECUTION_PROOF_EVOLUTION');
  const simulation = getAuthorityResult(founderTestAssessment, 'FOUNDER_SIMULATION');
  const requirement = getAuthorityResult(founderTestAssessment, 'REQUIREMENT_REALITY');

  return {
    founderTestAssessment,
    requiredAuthorities,
    missingRequiredAuthorities,
    founderTestScore: founderTestAssessment.score.overall,
    founderTestVerdict: founderTestAssessment.verdict,
    criticalBlockerCount: founderTestAssessment.summary.criticalBlockerCount,
    executionProofRegressionFree: founderTestAssessment.summary.executionProofRegressionFree,
    executionProofScore: executionProof?.normalizedScore ?? 0,
    executionProofVerdict: executionProof?.executionProofVerdict ?? null,
    founderSimulationPassed: founderTestAssessment.summary.founderSimulationPassed,
    founderSimulationScore: simulation?.normalizedScore ?? 0,
    requirementRealityAboveThreshold:
      requirement ? requirement.normalizedScore >= REQUIREMENT_REALITY_ACCEPTANCE_MIN_SCORE : false,
    requirementRealityScore: requirement?.normalizedScore ?? 0,
    authoritativeAcceptanceBridge,
  };
}

export interface FounderAcceptanceDerivationContext {
  founderTestVerdict: FounderTestAssessment['verdict'];
  founderTestScore: number;
  criticalBlockerCount: number;
  executionProofRegressionFree: boolean;
  founderSimulationPassed: boolean;
  requirementRealityAboveThreshold: boolean;
  missingRequiredAuthorities: string[];
}

export function deriveFounderAcceptanceState(
  context: FounderAcceptanceDerivationContext,
): FounderAcceptanceState {
  if (context.missingRequiredAuthorities.length > 0) {
    return 'INSUFFICIENT_EVIDENCE';
  }

  if (context.criticalBlockerCount > 0) {
    return 'BLOCKED';
  }

  const meetsAcceptedCriteria =
    context.founderTestVerdict === 'FOUNDER_READY' &&
    context.founderTestScore >= ACCEPTED_MIN_FOUNDER_TEST_SCORE &&
    context.executionProofRegressionFree &&
    context.founderSimulationPassed &&
    context.requirementRealityAboveThreshold;

  if (meetsAcceptedCriteria) {
    return 'ACCEPTED';
  }

  if (context.founderTestScore >= ACCEPTED_WITH_WARNINGS_MIN_FOUNDER_TEST_SCORE) {
    return 'ACCEPTED_WITH_WARNINGS';
  }

  return 'NOT_ACCEPTED';
}

function computeConfidenceBreakdown(
  snapshot: FounderAcceptanceInputSnapshot,
): FounderAcceptanceConfidenceBreakdown {
  const availableCount = snapshot.requiredAuthorities.filter((entry) => entry.available).length;
  const authorityCoverage = clamp(
    (availableCount / REQUIRED_ACCEPTANCE_AUTHORITY_IDS.length) * CONFIDENCE_WEIGHT_AUTHORITY_COVERAGE,
  );

  let proofQuality = clamp((snapshot.executionProofScore / 100) * CONFIDENCE_WEIGHT_PROOF_QUALITY);
  if (!snapshot.executionProofRegressionFree) {
    proofQuality = Math.max(0, proofQuality - 10);
  }
  if (snapshot.executionProofVerdict === 'PROVEN_FIXED') {
    proofQuality = clamp(proofQuality + 5);
  }

  const simulationQuality = clamp(
    (snapshot.founderSimulationScore / 100) * CONFIDENCE_WEIGHT_SIMULATION_QUALITY,
  );

  const requirementCompleteness = clamp(
    (snapshot.requirementRealityScore / 100) * CONFIDENCE_WEIGHT_REQUIREMENT_COMPLETENESS,
  );

  const founderReadiness = clamp(
    (snapshot.founderTestScore / 100) * CONFIDENCE_WEIGHT_FOUNDER_READINESS,
  );

  return {
    authorityCoverage,
    proofQuality,
    simulationQuality,
    requirementCompleteness,
    founderReadiness,
  };
}

function computeAcceptanceConfidence(
  snapshot: FounderAcceptanceInputSnapshot,
  state: FounderAcceptanceState,
): number {
  const breakdown = computeConfidenceBreakdown(snapshot);
  let total =
    breakdown.authorityCoverage +
    breakdown.proofQuality +
    breakdown.simulationQuality +
    breakdown.requirementCompleteness +
    breakdown.founderReadiness;

  if (state === 'INSUFFICIENT_EVIDENCE') total = Math.min(total, 35);
  if (state === 'BLOCKED') total = Math.min(total, 40);
  if (state === 'NOT_ACCEPTED') total = Math.min(total, 55);
  if (state === 'ACCEPTED_WITH_WARNINGS') total = Math.min(total, 84);

  return clampConfidence(total);
}

function buildAcceptanceReasons(
  snapshot: FounderAcceptanceInputSnapshot,
  state: FounderAcceptanceState,
): FounderAcceptanceReasons {
  const acceptedBecause: string[] = [];
  const rejectedBecause: string[] = [];
  const warningReasons: string[] = [];
  const blockingReasons: string[] = [];
  const requiredNextActions: string[] = [];

  if (snapshot.missingRequiredAuthorities.length > 0) {
    rejectedBecause.push('Required acceptance authorities are missing.');
    for (const missing of snapshot.missingRequiredAuthorities.slice(0, 4)) {
      rejectedBecause.push(`Missing required authority: ${missing}`);
      requiredNextActions.push(`Restore read-only output for ${missing}.`);
    }
  }

  if (snapshot.criticalBlockerCount > 0) {
    blockingReasons.push(`${snapshot.criticalBlockerCount} critical blocker(s) prevent founder acceptance.`);
    for (const authority of snapshot.requiredAuthorities) {
      for (const blocker of authority.blockers.slice(0, 2)) {
        if (authority.blockers.length > 0) {
          blockingReasons.push(`${authority.displayName}: ${blocker}`);
        }
      }
    }
    requiredNextActions.push('Resolve critical blockers before acceptance.');
  }

  if (!snapshot.executionProofRegressionFree) {
    rejectedBecause.push('Execution proof contains regression signals — fix-created is not proof.');
    requiredNextActions.push('Retest original failures and clear execution proof regressions.');
  }

  if (!snapshot.founderSimulationPassed) {
    rejectedBecause.push('Founder simulation did not pass.');
    requiredNextActions.push('Fix blocked workflows and interaction failures surfaced by founder simulation.');
  }

  if (!snapshot.requirementRealityAboveThreshold) {
    rejectedBecause.push(
      `Requirement reality below acceptance threshold (${REQUIREMENT_REALITY_ACCEPTANCE_MIN_SCORE}+ required).`,
    );
    requiredNextActions.push('Strengthen requirement understanding and planning evidence.');
  }

  if (snapshot.founderTestVerdict !== 'FOUNDER_READY' && state !== 'INSUFFICIENT_EVIDENCE') {
    warningReasons.push(`Founder test verdict is ${snapshot.founderTestVerdict}, not FOUNDER_READY.`);
  }

  if (snapshot.founderTestScore < ACCEPTED_MIN_FOUNDER_TEST_SCORE && state !== 'NOT_ACCEPTED') {
    warningReasons.push(
      `Founder test score ${snapshot.founderTestScore}/100 is below full acceptance threshold (${ACCEPTED_MIN_FOUNDER_TEST_SCORE}+).`,
    );
  }

  for (const authority of snapshot.requiredAuthorities) {
    for (const warning of authority.warnings.slice(0, 2)) {
      warningReasons.push(`${authority.displayName}: ${warning}`);
    }
  }

  if (state === 'ACCEPTED') {
    acceptedBecause.push('Founder test verdict is FOUNDER_READY.');
    acceptedBecause.push(`Founder test score ${snapshot.founderTestScore}/100 meets acceptance threshold.`);
    acceptedBecause.push('No critical blockers across required authorities.');
    acceptedBecause.push('Execution proof is regression-free.');
    acceptedBecause.push('Founder simulation passes.');
    acceptedBecause.push('Requirement reality meets completeness threshold.');
    acceptedBecause.push('A reasonable founder could accept this project in its current state.');
  }

  if (state === 'ACCEPTED_WITH_WARNINGS') {
    acceptedBecause.push(`Founder test score ${snapshot.founderTestScore}/100 supports conditional acceptance.`);
    acceptedBecause.push('No critical blockers block outright rejection.');
    warningReasons.push('Acceptance is conditional — address warnings before external launch.');
    requiredNextActions.push('Resolve warning-level findings to reach full ACCEPTED state.');
  }

  if (state === 'NOT_ACCEPTED') {
    rejectedBecause.push(`Founder test score ${snapshot.founderTestScore}/100 is below warning threshold (${ACCEPTED_WITH_WARNINGS_MIN_FOUNDER_TEST_SCORE}+).`);
    rejectedBecause.push('Project quality, completeness, usability, or proof is not yet founder-acceptable.');
    requiredNextActions.push('Raise founder test score and close proof gaps before re-assessing acceptance.');
  }

  if (state === 'BLOCKED') {
    rejectedBecause.push('Critical blockers make the project unacceptable in its current state.');
  }

  if (state === 'INSUFFICIENT_EVIDENCE') {
    rejectedBecause.push('Cannot decide acceptance without complete required authority coverage.');
  }

  return {
    acceptedBecause: dedupeReasons(acceptedBecause).slice(0, MAX_ACCEPTANCE_REASONS),
    rejectedBecause: dedupeReasons(rejectedBecause).slice(0, MAX_ACCEPTANCE_REASONS),
    warningReasons: dedupeReasons(warningReasons).slice(0, MAX_ACCEPTANCE_REASONS),
    blockingReasons: dedupeReasons(blockingReasons).slice(0, MAX_ACCEPTANCE_REASONS),
    requiredNextActions: dedupeReasons(requiredNextActions).slice(0, MAX_REQUIRED_NEXT_ACTIONS),
  };
}

function dedupeReasons(items: string[]): string[] {
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

export function assessFounderAcceptanceGate(
  input: AssessFounderAcceptanceGateInput = {},
): FounderAcceptanceAssessment {
  if (input.skipFounderTestIntegration && !input.founderTestAssessment) {
    const assessment: FounderAcceptanceAssessment = {
      readOnly: true,
      advisoryOnly: true,
      coreQuestion: FOUNDER_ACCEPTANCE_CORE_QUESTION,
      acceptanceState: 'INSUFFICIENT_EVIDENCE',
      acceptanceConfidence: 35,
      confidenceBreakdown: {
        authorityCoverage: 0,
        proofQuality: 0,
        simulationQuality: 0,
        requirementCompleteness: 0,
        founderReadiness: 0,
      },
      inputSnapshot: {
        founderTestAssessment: null as unknown as FounderTestAssessment,
        requiredAuthorities: REQUIRED_ACCEPTANCE_AUTHORITY_IDS.map((authorityId) => ({
          authorityId,
          displayName: REQUIRED_ACCEPTANCE_AUTHORITY_LABELS[authorityId],
          available: false,
          score: 0,
          blockers: [],
          warnings: [],
        })),
        missingRequiredAuthorities: REQUIRED_ACCEPTANCE_AUTHORITY_IDS.map(
          (authorityId) => REQUIRED_ACCEPTANCE_AUTHORITY_LABELS[authorityId],
        ),
        founderTestScore: 0,
        founderTestVerdict: 'NOT_FOUNDER_READY',
        criticalBlockerCount: 0,
        executionProofRegressionFree: true,
        executionProofScore: 0,
        executionProofVerdict: null,
        founderSimulationPassed: false,
        founderSimulationScore: 0,
        requirementRealityAboveThreshold: false,
        requirementRealityScore: 0,
      },
      reasons: {
        acceptedBecause: [],
        rejectedBecause: ['Founder test integration skipped during launch proof hydration.'],
        warningReasons: [],
        blockingReasons: [],
        requiredNextActions: ['Run founder test integration for full acceptance evidence.'],
      },
      cacheKey: stableCacheKey('skipped-founder-test', 'INSUFFICIENT_EVIDENCE', 35),
    };
    recordFounderAcceptanceAssessment(assessment);
    return assessment;
  }

  const founderTestAssessment =
    input.founderTestAssessment ??
    assessFounderTestIntegration({ rootDir: input.rootDir ?? process.cwd() });

  const orchestratorBundle = resolveAuthoritativeFounderAcceptance({
    requestId: founderTestAssessment.run.runId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    repairPath: true,
    governanceBlocked: input.governanceBlocked,
  });
  const authoritativeAcceptanceBridge = buildFounderAcceptanceBridgeSnapshot(
    orchestratorBundle,
    'founder_acceptance_gate',
    true,
  );

  const inputSnapshot = buildInputSnapshot(founderTestAssessment, authoritativeAcceptanceBridge);
  let acceptanceState = deriveFounderAcceptanceState({
    founderTestVerdict: inputSnapshot.founderTestVerdict,
    founderTestScore: inputSnapshot.founderTestScore,
    criticalBlockerCount: inputSnapshot.criticalBlockerCount,
    executionProofRegressionFree: inputSnapshot.executionProofRegressionFree,
    founderSimulationPassed: inputSnapshot.founderSimulationPassed,
    requirementRealityAboveThreshold: inputSnapshot.requirementRealityAboveThreshold,
    missingRequiredAuthorities: inputSnapshot.missingRequiredAuthorities,
  }) as FounderAcceptanceState;

  acceptanceState = applyOrchestratorAcceptanceDelegation(
    acceptanceState,
    orchestratorBundle.result,
    orchestratorBundle.verdict,
  ) as FounderAcceptanceState;

  const confidenceBreakdown = computeConfidenceBreakdown(inputSnapshot);
  const acceptanceConfidence = computeAcceptanceConfidence(inputSnapshot, acceptanceState);
  const reasons = buildAcceptanceReasons(inputSnapshot, acceptanceState);

  if (orchestratorBundle.result === 'FAIL') {
    reasons.rejectedBecause.push(
      'Authoritative founder acceptance orchestrator rejected product acceptance — repair gate cannot override.',
    );
  }

  const assessment: FounderAcceptanceAssessment = {
    readOnly: true,
    advisoryOnly: true,
    coreQuestion: FOUNDER_ACCEPTANCE_CORE_QUESTION,
    acceptanceState,
    acceptanceConfidence,
    confidenceBreakdown,
    inputSnapshot,
    reasons,
    authoritativeAcceptanceBridge,
    cacheKey: stableCacheKey(
      founderTestAssessment.run.runId,
      acceptanceState,
      acceptanceConfidence,
    ),
  };

  recordFounderAcceptanceAssessment(assessment);
  return assessment;
}

export function buildFounderAcceptanceGateReport(
  assessment: FounderAcceptanceAssessment,
  generatedAt = new Date().toISOString(),
): FounderAcceptanceReport {
  return {
    generatedAt,
    phaseName: FOUNDER_ACCEPTANCE_GATE_PHASE,
    purpose:
      'Determine whether a project is genuinely founder-acceptable — high score alone is not acceptance.',
    assessment,
    passToken: FOUNDER_ACCEPTANCE_GATE_PASS_TOKEN,
  };
}

export function buildFounderAcceptanceGateArtifacts(
  input: AssessFounderAcceptanceGateInput = {},
): {
  founderAcceptanceAssessment: FounderAcceptanceAssessment;
  founderAcceptanceReportMarkdown: string;
} {
  const founderAcceptanceAssessment = assessFounderAcceptanceGate(input);
  const report = buildFounderAcceptanceGateReport(founderAcceptanceAssessment);
  return {
    founderAcceptanceAssessment,
    founderAcceptanceReportMarkdown: buildFounderAcceptanceGateReportMarkdown(report),
  };
}

export function resetFounderAcceptanceGateModuleForTests(): void {
  resetFounderAcceptanceGateHistoryForTests();
  resetFounderTestIntegrationModuleForTests();
}
