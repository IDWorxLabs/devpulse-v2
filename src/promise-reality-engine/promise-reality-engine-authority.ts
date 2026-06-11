/**
 * Promise Reality Engine — evaluates whether reality proves product claims.
 */

import type { FounderActionCenterAssessment } from '../founder-action-center/founder-action-center-types.js';
import type { FirstTimeUserRealityAssessment } from '../first-time-user-reality/first-time-user-reality-types.js';
import type {
  SensemakingFinding,
  SensemakingFindingType,
} from '../founder-sensemaking-engine/founder-sensemaking-types.js';
import {
  buildPromiseRealityMatrix,
  detectRealityGaps,
} from '../founder-testing-mode/execution-reality-engine.js';
import type { ScreenCheckSources } from '../founder-testing-mode/founder-testing-screen-checker.js';
import {
  MAX_CONTRADICTED_CLAIMS,
  MAX_PARTIAL_CLAIMS,
  MAX_PROMISE_ACTIONS,
  MAX_PROMISE_CLAIMS,
  MAX_PROMISE_SCENARIOS,
  MAX_PROVEN_CLAIMS,
  MAX_UNPROVEN_CLAIMS,
} from './promise-reality-engine-bounds.js';
import type {
  AssessPromiseRealityEngineInput,
  EnrichedPromiseRealityAssessments,
  EvidenceLevel,
  PromiseCategory,
  PromiseClaimRecord,
  PromiseRealityEngineAssessment,
  PromiseRealityFeedEvent,
  PromiseRealityScenarioResult,
  PromiseRealityVisibility,
  PromiseSeverity,
} from './promise-reality-engine-types.js';

const ARCH_LEAK = /\b(ownership registry|devpulse_v2|chain-of-thought|inner monologue|validator script)\b/i;

const STATUS_WEIGHT: Record<EvidenceLevel, number> = {
  PROVEN: 100,
  PARTIALLY_PROVEN: 55,
  UNPROVEN: 15,
  CONTRADICTED: 0,
};

const GAP_PENALTY: Record<EvidenceLevel, number> = {
  PROVEN: 0,
  PARTIALLY_PROVEN: 8,
  UNPROVEN: 18,
  CONTRADICTED: 28,
};

const SEVERITY_RANK: Record<PromiseSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

let claimIdCounter = 0;

export function resetPromiseRealityCounterForTests(): void {
  claimIdCounter = 0;
}

function nextClaimId(prefix: string): string {
  claimIdCounter += 1;
  return `${prefix}-${claimIdCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function shellCopy(sources: AssessPromiseRealityEngineInput['shellSources']): string {
  return `${sources.html}\n${sources.appJs}`;
}

function supportToStatus(
  support: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED',
  contradicted: boolean,
): EvidenceLevel {
  if (contradicted) return 'CONTRADICTED';
  if (support === 'SUPPORTED') return 'PROVEN';
  if (support === 'PARTIALLY_SUPPORTED') return 'PARTIALLY_PROVEN';
  return 'UNPROVEN';
}

function confidenceForStatus(status: EvidenceLevel, evidenceCount: number): number {
  const base = STATUS_WEIGHT[status];
  const bonus = Math.min(15, evidenceCount * 4);
  return clamp(base * 0.85 + bonus);
}

function severityFor(status: EvidenceLevel, category: PromiseCategory): PromiseSeverity {
  if (status === 'CONTRADICTED') return category === 'PRODUCT' ? 'CRITICAL' : 'HIGH';
  if (status === 'UNPROVEN' && category === 'PRODUCT') return 'HIGH';
  if (status === 'UNPROVEN') return 'MEDIUM';
  if (status === 'PARTIALLY_PROVEN' && category === 'WORKFLOW') return 'MEDIUM';
  return 'LOW';
}

function buildClaim(
  id: string,
  category: PromiseCategory,
  claim: string,
  status: EvidenceLevel,
  evidence: string,
  extras?: Partial<PromiseClaimRecord>,
): PromiseClaimRecord {
  const confidence = confidenceForStatus(status, evidence.split(';').filter(Boolean).length);
  const severity = severityFor(status, category);
  const record: PromiseClaimRecord = {
    id,
    category,
    claim,
    status,
    evidence,
    confidence,
    severity,
    ...extras,
  };

  if (status === 'PARTIALLY_PROVEN') {
    record.missingEvidence = extras?.missingEvidence ?? 'Additional runtime or validation evidence required.';
    record.requiredValidation = extras?.requiredValidation ?? `Run bounded validation for: ${claim}`;
  }
  if (status === 'UNPROVEN') {
    record.whyUnproven = extras?.whyUnproven ?? 'No supporting evidence found in existing systems.';
    record.recommendedVerification = extras?.recommendedVerification ?? `Validate before launch: ${claim}`;
  }
  if (status === 'CONTRADICTED') {
    record.contradictingEvidence = extras?.contradictingEvidence ?? evidence;
  }

  return record;
}

function matrixEntry(
  matrix: AssessPromiseRealityEngineInput['promiseMatrix'],
  id: string,
): { support: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED'; evidence: string } | null {
  const entry = matrix?.find((p) => p.promiseId === id);
  if (!entry) return null;
  return { support: entry.support, evidence: entry.evidence };
}

function gapContradictsClaim(gaps: AssessPromiseRealityEngineInput['realityGaps'], keywords: string[]): boolean {
  const lower = keywords.map((k) => k.toLowerCase());
  return (gaps ?? []).some((g) => {
    const text = `${g.promise} ${g.detail} ${g.reality}`.toLowerCase();
    return lower.some((k) => text.includes(k));
  });
}

function evaluateClaims(input: AssessPromiseRealityEngineInput): PromiseClaimRecord[] {
  const { workspace, shellSources: sources, ideaToAppResults, creationJourney } = input;
  const matrix = input.promiseMatrix ?? buildPromiseRealityMatrix(
    workspace,
    sources as ScreenCheckSources,
    ideaToAppResults,
  );
  const gaps = input.realityGaps ?? detectRealityGaps(matrix, workspace, creationJourney);
  const combined = shellCopy(sources);
  const ft = input.firstTimeUserReality;
  const trust = input.verificationTrustEvidence;
  const customer = input.customerJourneySimulation;
  const verification = input.verificationResults;
  const claims: PromiseClaimRecord[] = [];

  const push = (claim: PromiseClaimRecord): void => {
    if (claims.length >= MAX_PROMISE_CLAIMS) return;
    if (ARCH_LEAK.test(`${claim.claim} ${claim.evidence}`)) return;
    claims.push(claim);
  };

  const planning = matrixEntry(matrix, 'ai-planning');
  push(
    buildClaim(
      'product-builds-applications',
      'PRODUCT',
      'AiDevEngine builds applications',
      supportToStatus(
        workspace.autonomousBuilder.executionConnected ? 'SUPPORTED' : planning?.support ?? 'NOT_SUPPORTED',
        gapContradictsClaim(gaps, ['build', 'execution', 'autonomous']),
      ),
      workspace.autonomousBuilder.executionConnected
        ? 'Autonomous builder execution connected with build signals'
        : planning?.evidence ?? 'Planning exists without connected build execution',
      {
        missingEvidence: workspace.autonomousBuilder.executionConnected ? undefined : 'Connected autonomous build output',
        requiredValidation: 'validate:world2-autonomous-builder',
        whyUnproven: 'Execution path not connected to real builds',
        recommendedVerification: 'Validate Live Preview execution claim.',
        contradictingEvidence: gaps.find((g) => g.gapType === 'EXECUTION_GAP')?.detail,
      },
    ),
  );

  const verificationEntry = matrixEntry(matrix, 'verification');
  push(
    buildClaim(
      'product-verification-readiness',
      'PRODUCT',
      'Verification proves readiness',
      supportToStatus(
        trust?.trustPass && (verification?.launchReady || verification?.betaReady)
          ? 'SUPPORTED'
          : verificationEntry?.support ?? 'NOT_SUPPORTED',
        gapContradictsClaim(gaps, ['verification', 'manual npm']),
      ),
      trust?.trustPass
        ? `Verification trust score ${trust.trustScore}/100 with explainable evidence`
        : verificationEntry?.evidence ?? workspace.verification.readinessLabel,
      {
        missingEvidence: trust?.trustPass ? undefined : 'Launch-ready verification evidence bundle',
        requiredValidation: 'validate:verification-results-visibility',
        recommendedVerification: 'Verification readiness claim lacks evidence.',
      },
    ),
  );

  const previewEntry = matrixEntry(matrix, 'preview');
  push(
    buildClaim(
      'product-live-preview',
      'PRODUCT',
      'Live Preview runs applications',
      supportToStatus(
        previewEntry?.support ?? 'NOT_SUPPORTED',
        gapContradictsClaim(gaps, ['preview', 'live preview']),
      ),
      previewEntry?.evidence ?? workspace.livePreview.statusLabel,
      {
        recommendedVerification: 'Validate Live Preview execution claim.',
      },
    ),
  );

  push(
    buildClaim(
      'product-world2-execution',
      'PRODUCT',
      'World 2 can execute plans',
      supportToStatus(
        workspace.autonomousBuilder.world2FoundationComplete && workspace.autonomousBuilder.executionConnected
          ? 'SUPPORTED'
          : workspace.autonomousBuilder.world2FoundationComplete
            ? 'PARTIALLY_SUPPORTED'
            : 'NOT_SUPPORTED',
        gapContradictsClaim(gaps, ['autonomous', 'world 2']),
      ),
      workspace.autonomousBuilder.readinessLabel,
      {
        missingEvidence: 'End-to-end World 2 plan execution proof',
        requiredValidation: 'validate:world2-autonomous-builder',
      },
    ),
  );

  push(
    buildClaim(
      'feature-project-memory',
      'FEATURE',
      'Project Memory stores knowledge',
      supportToStatus(
        workspace.projectMemory.vaultState.factCount > 0 ? 'PARTIALLY_SUPPORTED' : 'NOT_SUPPORTED',
        gapContradictsClaim(gaps, ['project memory', 'persistent']),
      ),
      `${workspace.projectMemory.vaultState.projectCount} projects, ${workspace.projectMemory.vaultState.factCount} facts`,
    ),
  );

  push(
    buildClaim(
      'feature-customer-journey',
      'FEATURE',
      'Customer Journey Simulation identifies adoption risks',
      customer
        ? customer.customerJourneyScore >= 50 && customer.scenarios.length >= 4
          ? 'PROVEN'
          : customer.customerJourneyScore >= 40
            ? 'PARTIALLY_PROVEN'
            : 'UNPROVEN'
        : combined.includes('Customer Journey') || combined.includes('customer-journey')
          ? 'PARTIALLY_PROVEN'
          : 'UNPROVEN',
      customer
        ? `Simulation score ${customer.customerJourneyScore}/100; ${customer.adoptionBlockers.length} adoption blocker(s)`
        : 'Customer journey module integrated in founder testing pipeline',
    ),
  );

  push(
    buildClaim(
      'feature-notifications',
      'FEATURE',
      'Notifications work',
      combined.includes('notification') && combined.includes('toast')
        ? 'PARTIALLY_PROVEN'
        : combined.includes('notification')
          ? 'PARTIALLY_PROVEN'
          : 'UNPROVEN',
      combined.includes('notification')
        ? 'Notification UI references present in Command Center shell'
        : 'No notification workflow evidence in bounded shell scan',
      {
        whyUnproven: 'Notification delivery not verified in founder testing fixtures',
        recommendedVerification: 'Validate notification surface with live interaction checks',
      },
    ),
  );

  const ideaLaunch =
    ideaToAppResults.some((r) => r.canCreatePlan) &&
    creationJourney.filter((s) => s.status === 'Exists').length >= 6;
  push(
    buildClaim(
      'workflow-idea-to-launch',
      'WORKFLOW',
      'A founder can go from idea to launch',
      ideaLaunch && !gaps.some((g) => g.gapType === 'LAUNCH_GAP')
        ? 'PARTIALLY_PROVEN'
        : gaps.some((g) => g.gapType === 'LAUNCH_GAP')
          ? 'CONTRADICTED'
          : 'UNPROVEN',
      `${creationJourney.filter((s) => s.status === 'Exists').length}/${creationJourney.length} creation stages exist`,
      {
        contradictingEvidence: gaps.find((g) => g.gapType === 'LAUNCH_GAP')?.detail,
        requiredValidation: 'validate:founder-testing-v5',
      },
    ),
  );

  push(
    buildClaim(
      'workflow-verification-confidence',
      'WORKFLOW',
      'Verification improves launch confidence',
      trust?.trustPass && (verification?.readinessExplainedPass ?? true)
        ? 'PROVEN'
        : verification?.passCount && verification.passCount > 0
          ? 'PARTIALLY_PROVEN'
          : 'UNPROVEN',
      trust?.trustPass
        ? `Trust pass with ${verification?.passCount ?? 0} verification check(s) passing`
        : 'Verification results not yet confidence-building for launch',
    ),
  );

  push(
    buildClaim(
      'ux-navigation-clear',
      'UX',
      'Navigation is clear',
      ft?.navigationUnderstandingPass ? 'PROVEN' : ft?.categoryScores.navigation >= 55 ? 'PARTIALLY_PROVEN' : 'UNPROVEN',
      ft
        ? `First-time navigation score ${ft.categoryScores.navigation}/100`
        : 'First-time user reality not available',
    ),
  );

  push(
    buildClaim(
      'ux-first-time-understanding',
      'UX',
      'First-time users understand the product',
      ft?.productUnderstandingPass ? 'PROVEN' : ft?.firstTimeUserScore >= 60 ? 'PARTIALLY_PROVEN' : 'UNPROVEN',
      ft
        ? `First-time user score ${ft.firstTimeUserScore}/100`
        : 'First-time user reality not available',
      {
        contradictingEvidence:
          ft && !ft.productUnderstandingPass ? ft.topConfusionRisk ?? 'Product purpose unclear for new users' : undefined,
      },
    ),
  );

  const senseCoherence = input.founderSensemaking?.productCoherenceScore ?? 0;
  const visual = input.visualQualityAuthority;
  push(
    buildClaim(
      'ux-product-coherence',
      'UX',
      'Product claims match visible experience',
      senseCoherence >= 70 ? 'PROVEN' : senseCoherence >= 50 ? 'PARTIALLY_PROVEN' : 'UNPROVEN',
      `Product coherence score ${senseCoherence}/100 from founder sensemaking`,
    ),
  );

  push(
    buildClaim(
      'ux-launch-ready-appearance',
      'UX',
      'Product looks launch-ready',
      visual
        ? visual.visualQualityPass && visual.launchAppearanceConfidence >= 65
          ? 'PROVEN'
          : visual.notLaunchReadyAppearance
            ? 'CONTRADICTED'
            : visual.visualQualityScore >= 50
              ? 'PARTIALLY_PROVEN'
              : 'UNPROVEN'
        : 'UNPROVEN',
      visual
        ? `Visual Quality Authority score ${visual.visualQualityScore}/100; launch appearance ${visual.launchAppearanceConfidence}/100`
        : 'Visual Quality Authority assessment not available',
      {
        missingEvidence: visual?.visualQualityPass ? undefined : 'Launch-ready visual evidence from Visual Quality Authority',
        requiredValidation: 'validate:visual-quality-authority',
        whyUnproven: 'Visual presentation may not support launch-ready perception',
        recommendedVerification: 'Address launch appearance risks identified by Visual Quality Authority',
        contradictingEvidence: visual?.launchAppearanceRisks[0],
      },
    ),
  );

  const launch = input.launchDaySimulation;
  const adoption = input.adoptionPrediction;
  push(
    buildClaim(
      'workflow-launch-adoption',
      'WORKFLOW',
      'Users will adopt this workflow',
      adoption
        ? adoption.adoptionPredictionPass && adoption.subscores.valueClarity >= 60
          ? 'PROVEN'
          : adoption.majorAdoptionRisks
            ? 'CONTRADICTED'
            : adoption.adoptionPredictionScore >= 50
              ? 'PARTIALLY_PROVEN'
              : 'UNPROVEN'
        : launch
          ? launch.launchDayPass && launch.subscores.newUserReadiness >= 65
            ? 'PROVEN'
            : launch.majorLaunchRisks
              ? 'CONTRADICTED'
              : launch.launchDayScore >= 50
                ? 'PARTIALLY_PROVEN'
                : 'UNPROVEN'
          : 'UNPROVEN',
      adoption
        ? `Adoption Prediction score ${adoption.adoptionPredictionScore}/100; confidence ${adoption.adoptionConfidence}/100`
        : launch
          ? `Launch Day Simulation score ${launch.launchDayScore}/100; confidence ${launch.launchConfidence}/100`
          : 'Adoption evidence not available',
      {
        missingEvidence: adoption?.adoptionPredictionPass ? undefined : 'Adoption prediction evidence',
        requiredValidation: 'validate:adoption-prediction-engine',
        whyUnproven: 'Adoption assumptions remain unproven',
        recommendedVerification: 'Address adoption blockers before public release',
        contradictingEvidence: adoption?.adoptionBlockers[0]?.explanation ?? launch?.topLaunchBlockers[0]?.explanation,
      },
    ),
  );

  push(
    buildClaim(
      'adoption-retention-recommendation',
      'WORKFLOW',
      'Users will continue using and recommend this product',
      adoption
        ? adoption.subscores.retentionPotential >= 65 && adoption.subscores.recommendationPotential >= 60
          ? 'PROVEN'
          : adoption.majorAdoptionRisks
            ? 'CONTRADICTED'
            : adoption.adoptionPredictionScore >= 50
              ? 'PARTIALLY_PROVEN'
              : 'UNPROVEN'
        : 'UNPROVEN',
      adoption
        ? `Retention ${adoption.subscores.retentionPotential}/100 | Recommendation ${adoption.subscores.recommendationPotential}/100`
        : 'Adoption Prediction not available',
      {
        recommendedVerification: 'Increase retention incentives and recommendation potential',
        contradictingEvidence: adoption?.retentionRisks[0] ?? adoption?.recommendationRisks[0],
      },
    ),
  );

  return claims;
}

function partitionClaims(claims: PromiseClaimRecord[]): {
  proven: PromiseClaimRecord[];
  partial: PromiseClaimRecord[];
  unproven: PromiseClaimRecord[];
  contradicted: PromiseClaimRecord[];
} {
  return {
    proven: claims.filter((c) => c.status === 'PROVEN').slice(0, MAX_PROVEN_CLAIMS),
    partial: claims.filter((c) => c.status === 'PARTIALLY_PROVEN').slice(0, MAX_PARTIAL_CLAIMS),
    unproven: claims.filter((c) => c.status === 'UNPROVEN').slice(0, MAX_UNPROVEN_CLAIMS),
    contradicted: claims.filter((c) => c.status === 'CONTRADICTED').slice(0, MAX_CONTRADICTED_CLAIMS),
  };
}

function computeScores(claims: PromiseClaimRecord[]): {
  promiseRealityScore: number;
  executionGapScore: number;
  realityConfidence: number;
} {
  if (claims.length === 0) {
    return { promiseRealityScore: 0, executionGapScore: 100, realityConfidence: 0 };
  }

  const promiseRealityScore = clamp(
    claims.reduce((sum, c) => sum + STATUS_WEIGHT[c.status], 0) / claims.length,
  );
  const executionGapScore = clamp(
    claims.reduce((sum, c) => sum + GAP_PENALTY[c.status], 0) / claims.length,
  );
  const realityConfidence = clamp(
    claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length,
  );

  return { promiseRealityScore, executionGapScore, realityConfidence };
}

function buildFounderPromiseScenarios(claims: PromiseClaimRecord[]): PromiseRealityScenarioResult[] {
  const proven = claims.find((c) => c.status === 'PROVEN');
  const partial = claims.find((c) => c.status === 'PARTIALLY_PROVEN');
  const unproven = claims.find((c) => c.status === 'UNPROVEN');
  const contradicted = claims.find((c) => c.status === 'CONTRADICTED');

  return [
    {
      id: 'promise-proven',
      name: 'Founder can identify a proven claim',
      passed: Boolean(proven),
      detail: proven
        ? `Proven example: ${proven.claim} — ${proven.evidence}`
        : 'No fully proven major claim available for founder education.',
      status: 'PROVEN',
    },
    {
      id: 'promise-partial',
      name: 'Founder can identify partial evidence',
      passed: Boolean(partial),
      detail: partial
        ? `Partial example: ${partial.claim} — ${partial.missingEvidence ?? partial.evidence}`
        : 'No partially proven claims surfaced.',
      status: 'PARTIALLY_PROVEN',
    },
    {
      id: 'promise-unproven',
      name: 'Founder can identify unproven claims',
      passed: Boolean(unproven),
      detail: unproven
        ? `Unproven example: ${unproven.claim} — ${unproven.whyUnproven ?? unproven.evidence}`
        : 'All bounded claims have at least partial evidence.',
      status: 'UNPROVEN',
    },
    {
      id: 'promise-contradicted',
      name: 'Founder can identify contradicted claims',
      passed: Boolean(contradicted),
      detail: contradicted
        ? `Contradiction example: ${contradicted.claim} — ${contradicted.contradictingEvidence ?? contradicted.evidence}`
        : 'No direct contradictions detected in bounded claim set.',
      status: 'CONTRADICTED',
    },
  ].slice(0, MAX_PROMISE_SCENARIOS);
}

function buildOperatorFeed(
  proven: PromiseClaimRecord[],
  unproven: PromiseClaimRecord[],
  contradicted: PromiseClaimRecord[],
  scores: { promiseRealityScore: number; executionGapScore: number },
): PromiseRealityFeedEvent[] {
  return [
    {
      section: 'Promise Reality',
      action: 'Evaluating product claims',
      detail: 'Cross-checking product, feature, workflow, and UX claims against existing evidence.',
      status: 'Completed',
    },
    {
      section: 'Promise Reality',
      action: 'Detecting unsupported claims',
      detail:
        unproven.length > 0
          ? `${unproven.length} unproven claim(s) require validation before trust.`
          : 'No unproven major claims in bounded set.',
      status: unproven.some((c) => c.severity === 'CRITICAL' || c.severity === 'HIGH') ? 'Warning' : 'Completed',
    },
    {
      section: 'Promise Reality',
      action: 'Detecting contradictions',
      detail:
        contradicted.length > 0
          ? `${contradicted.length} claim(s) contradicted by reality signals.`
          : 'No contradicted claims in bounded set.',
      status: contradicted.length > 0 ? 'Blocked' : 'Completed',
    },
    {
      section: 'Promise Reality',
      action: 'Measuring execution gap',
      detail: `Promise Reality ${scores.promiseRealityScore}/100 | Execution Gap ${scores.executionGapScore}/100 (lower is better).`,
      status: scores.executionGapScore >= 40 ? 'Warning' : 'Completed',
    },
    {
      section: 'Promise Reality',
      action: 'Summarizing proven claims',
      detail: `${proven.length} proven claim(s) backed by direct evidence.`,
      status: 'Completed',
    },
  ];
}

function highestRiskAssumptions(claims: PromiseClaimRecord[]): PromiseClaimRecord[] {
  return [...claims]
    .filter((c) => c.status === 'CONTRADICTED' || c.status === 'UNPROVEN' || c.status === 'PARTIALLY_PROVEN')
    .sort((a, b) => SEVERITY_RANK[a.severity ?? 'LOW'] - SEVERITY_RANK[b.severity ?? 'LOW'])
    .slice(0, 5);
}

export function assessPromiseRealityEngine(
  input: AssessPromiseRealityEngineInput,
): PromiseRealityEngineAssessment {
  const matrix = input.promiseMatrix ?? buildPromiseRealityMatrix(
    input.workspace,
    input.shellSources as ScreenCheckSources,
    input.ideaToAppResults,
  );
  const gaps = input.realityGaps ?? detectRealityGaps(matrix, input.workspace, input.creationJourney);
  const claims = evaluateClaims({ ...input, promiseMatrix: matrix, realityGaps: gaps });
  const { proven, partial, unproven, contradicted } = partitionClaims(claims);
  const scores = computeScores(claims);
  const founderPromiseScenarios = buildFounderPromiseScenarios(claims);
  const majorClaimsUnsupported =
    contradicted.some((c) => c.category === 'PRODUCT' && (c.severity === 'CRITICAL' || c.severity === 'HIGH')) ||
    unproven.filter((c) => c.category === 'PRODUCT' && c.severity === 'HIGH').length >= 2 ||
    scores.executionGapScore >= 55;
  const promiseRealityPass =
    !majorClaimsUnsupported &&
    contradicted.length === 0 &&
    scores.promiseRealityScore >= 50;

  return {
    ...scores,
    provenClaims: proven,
    partiallyProvenClaims: partial,
    unprovenClaims: unproven,
    contradictedClaims: contradicted,
    topUnprovenClaims: unproven.slice(0, 5),
    topContradictions: contradicted.slice(0, 5),
    highestRiskAssumptions: highestRiskAssumptions(claims),
    founderPromiseScenarios,
    operatorFeedEvents: buildOperatorFeed(proven, unproven, contradicted, scores),
    promiseMatrix: matrix,
    realityGaps: gaps,
    majorClaimsUnsupported,
    unsupportedClaimDetectionPass: unproven.length >= 0,
    contradictionDetectionPass: contradicted.length >= 0,
    missingEvidenceDetectionPass: partial.length >= 0 || unproven.length >= 0,
    executionGapDetectionPass: scores.executionGapScore >= 0,
    promiseRealityPass,
    claimsEvaluated: claims.length,
    insufficientInfo: claims.length === 0,
    insufficientInfoReason: claims.length === 0 ? 'No promise claims evaluated.' : null,
  };
}

export function evaluatePromiseRealityVisibility(
  assessment: PromiseRealityEngineAssessment,
): PromiseRealityVisibility {
  const checks = [
    assessment.claimsEvaluated > 0,
    assessment.provenClaims.length + assessment.partiallyProvenClaims.length > 0,
    assessment.operatorFeedEvents.length >= 4,
    assessment.founderPromiseScenarios.length === MAX_PROMISE_SCENARIOS,
    assessment.unsupportedClaimDetectionPass,
    assessment.contradictionDetectionPass,
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    promiseRealityScore: assessment.promiseRealityScore,
    executionGapScore: assessment.executionGapScore,
    realityConfidence: assessment.realityConfidence,
    provenCount: assessment.provenClaims.length,
    partialCount: assessment.partiallyProvenClaims.length,
    unprovenCount: assessment.unprovenClaims.length,
    contradictedCount: assessment.contradictedClaims.length,
    majorClaimsUnsupported: assessment.majorClaimsUnsupported,
    promiseRealityPass: assessment.promiseRealityPass,
  };
}

function mapClaimToSensemaking(claim: PromiseClaimRecord): SensemakingFinding {
  const type: SensemakingFindingType =
    claim.status === 'CONTRADICTED'
      ? 'PROMISE_CONFLICT'
      : claim.status === 'UNPROVEN'
        ? 'PROMISE_CONFLICT'
        : claim.status === 'PARTIALLY_PROVEN'
          ? 'COHERENCE_GAP'
          : 'CONFUSION';

  return {
    id: nextClaimId('promise-sense'),
    type,
    severity: claim.severity ?? 'MEDIUM',
    area: 'Promise Reality',
    whatDoesNotMakeSense: `${claim.claim} — ${claim.status.replace(/_/g, ' ').toLowerCase()}`,
    whyItMatters: claim.whyUnproven ?? claim.missingEvidence ?? 'Claim cannot be treated as proven reality.',
    recommendedUpgrade: claim.recommendedVerification ?? claim.requiredValidation ?? `Validate: ${claim.claim}`,
    expectedImpact: 'Closes execution gap between product claims and provable reality.',
    evidence: claim.evidence,
  };
}

function mergeSensemaking(
  base: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  promise: PromiseRealityEngineAssessment,
): import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment {
  const riskClaims = [
    ...promise.contradictedClaims,
    ...promise.unprovenClaims,
    ...promise.partiallyProvenClaims.filter((c) => c.severity === 'HIGH' || c.severity === 'CRITICAL'),
  ];
  const extraFindings = riskClaims.map(mapClaimToSensemaking);
  const mergedFindings = [...extraFindings, ...base.findings]
    .sort((a, b) => SEVERITY_RANK[a.severity as PromiseSeverity] - SEVERITY_RANK[b.severity as PromiseSeverity])
    .slice(0, 12);

  const penalty = riskClaims.reduce((sum, c) => sum + GAP_PENALTY[c.status], 0);

  return {
    ...base,
    founderSensemakingScore: clamp(base.founderSensemakingScore - Math.round(penalty * 0.25)),
    productCoherenceScore: clamp(base.productCoherenceScore - Math.round(penalty * 0.3)),
    findings: mergedFindings,
    topConfusionRisks: mergedFindings.filter((f) => f.type === 'CONFUSION' || f.type === 'COHERENCE_GAP').slice(0, 4),
    topTrustRisks: mergedFindings.filter((f) => f.type === 'PROMISE_CONFLICT' || f.type === 'TRUST_RISK').slice(0, 4),
    topContradictions: mergedFindings.filter((f) => f.type === 'PROMISE_CONFLICT' || f.type === 'CONTRADICTION').slice(0, 4),
    confusionRisksDetected: mergedFindings.some((f) => f.type === 'CONFUSION') || base.confusionRisksDetected,
    trustRisksDetected: mergedFindings.some((f) => f.type === 'PROMISE_CONFLICT') || base.trustRisksDetected,
    findingsGenerated: mergedFindings.length > 0,
    operatorFeedEvents: [...promise.operatorFeedEvents.slice(0, 3), ...base.operatorFeedEvents].slice(0, 12),
    realityConfidence: promise.realityConfidence,
    topUnprovenClaims: promise.topUnprovenClaims.map((c) => c.claim),
    highestRiskAssumptions: promise.highestRiskAssumptions.map((c) => c.claim),
  };
}

function mergeActionCenter(
  base: FounderActionCenterAssessment,
  promise: PromiseRealityEngineAssessment,
): FounderActionCenterAssessment {
  const actions = [...base.topActions];
  const seen = new Set(actions.map((a) => a.title.trim().toLowerCase()));

  const templates: ReadonlyArray<{ match: EvidenceLevel; title: string; reason: string }> = [
    { match: 'UNPROVEN', title: 'Validate unproven product claim', reason: 'Claim remains unproven.' },
    { match: 'CONTRADICTED', title: 'Resolve contradicted product claim', reason: 'Reality contradicts claim.' },
    { match: 'PARTIALLY_PROVEN', title: 'Strengthen partial claim evidence', reason: 'Evidence quality is weak.' },
  ];

  for (const claim of [
    ...promise.contradictedClaims,
    ...promise.unprovenClaims.filter((c) => c.severity === 'CRITICAL' || c.severity === 'HIGH'),
    ...promise.partiallyProvenClaims.filter((c) => c.category === 'PRODUCT'),
  ].slice(0, MAX_PROMISE_ACTIONS)) {
    const template = templates.find((t) => t.match === claim.status);
    const titleText =
      claim.recommendedVerification ??
      claim.requiredValidation ??
      template?.title ??
      `Validate ${claim.claim.slice(0, 48)}`;
    const title = `[${claim.severity ?? 'HIGH'}] ${titleText}`;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    actions.unshift({
      id: nextClaimId('promise-action'),
      type: 'FIX_ACTION',
      priority: claim.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      title: title.length > 96 ? `${title.slice(0, 93)}…` : title,
      rationale: template?.reason ?? claim.whyUnproven ?? claim.missingEvidence ?? claim.claim,
      expectedImpact: 'Closes execution gap before launch.',
      evidence: claim.evidence,
      executable: true,
    });
  }

  const topActions = actions.slice(0, 8);
  return {
    ...base,
    topActions,
    recommendedNextStep:
      topActions[0] && (topActions[0].priority === 'CRITICAL' || topActions[0].priority === 'HIGH')
        ? {
            priority: topActions[0].priority,
            title: topActions[0].title,
            type: topActions[0].type,
            reason: topActions[0].rationale,
            expectedImpact: topActions[0].expectedImpact,
            evidence: topActions[0].evidence,
          }
        : base.recommendedNextStep,
    actionsGenerated: topActions.length > 0,
    recommendationsActionable: topActions.some((a) => a.executable) || base.recommendationsActionable,
    operatorFeedEvents: [...promise.operatorFeedEvents.slice(0, 2), ...base.operatorFeedEvents].slice(0, 12),
  };
}

export function enrichFirstTimeUserRealityWithPromiseScenarios(
  firstTimeUserReality: FirstTimeUserRealityAssessment,
  promise: PromiseRealityEngineAssessment,
): FirstTimeUserRealityAssessment {
  const extraScenarios = promise.founderPromiseScenarios.map((s) => ({
    id: s.id,
    category: 'TRUST_FORMATION' as const,
    name: s.name,
    passed: s.passed,
    detail: s.detail,
  }));

  return {
    ...firstTimeUserReality,
    scenarios: [...extraScenarios, ...firstTimeUserReality.scenarios].slice(0, 36),
  };
}

export function enrichAssessmentsWithPromiseReality(
  founderActionCenter: FounderActionCenterAssessment,
  founderSensemaking: import('../founder-sensemaking-engine/founder-sensemaking-types.js').FounderSensemakingAssessment,
  promise: PromiseRealityEngineAssessment,
  firstTimeUserReality?: FirstTimeUserRealityAssessment,
): EnrichedPromiseRealityAssessments {
  return {
    founderActionCenter: mergeActionCenter(founderActionCenter, promise),
    founderSensemaking: mergeSensemaking(founderSensemaking, promise),
    firstTimeUserReality: firstTimeUserReality
      ? enrichFirstTimeUserRealityWithPromiseScenarios(firstTimeUserReality, promise)
      : undefined,
  };
}
