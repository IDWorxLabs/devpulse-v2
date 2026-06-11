/**
 * Competitive Reality Authority — deterministic competitive differentiation evaluation.
 */

import { createHash } from 'node:crypto';
import type { FounderTestV4ReportWithCustomerValue } from '../founder-testing-mode/founder-testing-v4-types.js';
import {
  COMPETITIVE_REALITY_BLOCK_SCORE,
  COMPETITIVE_REALITY_CACHE_KEY_PREFIX,
  MAX_COMPETITIVE_FINDINGS,
  MAX_COMPETITIVE_RECOMMENDATIONS,
  MAX_COMPETITIVE_RISKS,
  MAX_UNIQUE_ADVANTAGES,
} from './competitive-reality-bounds.js';
import { recordCompetitiveRealityAssessment } from './competitive-reality-history.js';
import { buildCompetitiveRealityReportMarkdown } from './competitive-reality-report-builder.js';
import type {
  CompetitiveComparisonCategory,
  CompetitiveDifferentiationLevel,
  CompetitiveRealityAssessment,
  CompetitiveRealityFinding,
  CompetitiveReadinessState,
} from './competitive-reality-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function levelScore(level: CompetitiveDifferentiationLevel): number {
  switch (level) {
    case 'UNIQUE':
      return 100;
    case 'STRONG':
      return 85;
    case 'MODERATE':
      return 65;
    case 'WEAK':
      return 40;
    case 'NONE':
      return 15;
  }
}

function makeFinding(input: {
  id: string;
  category: CompetitiveComparisonCategory;
  competitorType: CompetitiveRealityFinding['competitorType'];
  finding: string;
  evidence: string[];
  differentiationLevel: CompetitiveDifferentiationLevel;
  risk: string;
  recommendation: string;
}): CompetitiveRealityFinding {
  return { ...input, evidence: input.evidence.slice(0, 6) };
}

function compareGeneralAi(report: FounderTestV4ReportWithCustomerValue): CompetitiveRealityFinding[] {
  const findings: CompetitiveRealityFinding[] = [];
  const trust = report.trustAuthority;
  const chat = report.chatIntelligenceReality;

  if (report.verificationResultsVisibility.evidencePresent && trust.trustScore >= 60) {
    findings.push(
      makeFinding({
        id: 'general-ai-authority-validation',
        category: 'GENERAL_AI_COMPARISON',
        competitorType: 'GENERAL_AI',
        finding: 'Authority-driven validation exceeds generic chat answer quality',
        evidence: [
          `Trust score: ${trust.trustScore}/100`,
          `Verification evidence visible: Yes`,
          `Registered launch authorities: 13`,
        ],
        differentiationLevel: trust.trustScore >= 75 ? 'STRONG' : 'MODERATE',
        risk: 'Users may not see authority validation if evidence stays hidden',
        recommendation: 'Make authority-driven validation visible versus generic AI chat.',
      }),
    );
  }

  const launchPromise = report.promiseFulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'launch-confidence',
  );
  if ((launchPromise?.status ?? 'UNPROVEN') === 'FULFILLED' || (launchPromise?.status ?? 'UNPROVEN') === 'PARTIALLY_FULFILLED') {
    findings.push(
      makeFinding({
        id: 'general-ai-launch-intelligence',
        category: 'GENERAL_AI_COMPARISON',
        competitorType: 'GENERAL_AI',
        finding: 'Launch intelligence is structurally evaluated, not just discussed',
        evidence: [
          `Launch confidence promise: ${launchPromise?.status ?? 'UNPROVEN'}`,
          `Launch readiness reality score: ${report.launchReadinessReality.launchReadinessRealityScore}/100`,
        ],
        differentiationLevel: (launchPromise?.status ?? 'UNPROVEN') === 'FULFILLED' ? 'STRONG' : 'MODERATE',
        risk: 'Launch intelligence may appear similar to generic readiness advice',
        recommendation: 'Expose structured launch council evidence that general AI cannot replicate.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'general-ai-launch-intelligence-gap',
        category: 'GENERAL_AI_COMPARISON',
        competitorType: 'GENERAL_AI',
        finding: 'Launch intelligence differentiation is not yet proven',
        evidence: [`Launch confidence promise: ${launchPromise?.status ?? 'UNPROVEN'}`],
        differentiationLevel: 'WEAK',
        risk: 'General AI may appear equally capable for launch guidance',
        recommendation: 'Prove launch intelligence with bounded authority evidence.',
      }),
    );
  }

  if (chat.chatIntelligenceScore >= 60 && chat.scenariosPassed >= 5) {
    findings.push(
      makeFinding({
        id: 'general-ai-structured-verification',
        category: 'GENERAL_AI_COMPARISON',
        competitorType: 'GENERAL_AI',
        finding: 'Structured verification scenarios exceed conversational Q&A',
        evidence: [
          `Chat intelligence score: ${chat.chatIntelligenceScore}/100`,
          `Scenarios passed: ${chat.scenariosPassed}/${chat.scenariosRun}`,
        ],
        differentiationLevel: chat.blocksLaunchReadiness ? 'WEAK' : 'MODERATE',
        risk: 'Chat overlap with general AI remains if intelligence failures persist',
        recommendation: 'Tie chat outputs to verification and founder readiness evidence.',
      }),
    );
  }

  return findings;
}

function compareCodingAssistant(report: FounderTestV4ReportWithCustomerValue): CompetitiveRealityFinding[] {
  const findings: CompetitiveRealityFinding[] = [];
  const gaps = report.gapDetectionAuthority;
  const evolution = report.selfEvolutionAuthority;
  const success = report.userSuccessAuthority;

  if (report.autonomousBuilderReality.canPlanWork && success.scenarioResults.find((s) => s.id === 'planning-goal')?.passed) {
    findings.push(
      makeFinding({
        id: 'coding-assistant-architecture-intelligence',
        category: 'CODING_ASSISTANT_COMPARISON',
        competitorType: 'AI_CODING_ASSISTANT',
        finding: 'Architecture and planning intelligence exceeds code-completion assistants',
        evidence: [
          `Can plan work: ${report.autonomousBuilderReality.canPlanWork ? 'Yes' : 'No'}`,
          `Planning goal passed: ${success.scenarioResults.find((s) => s.id === 'planning-goal')?.passed ? 'Yes' : 'No'}`,
          `Creation journey score: ${report.creationJourneyScore}/100`,
        ],
        differentiationLevel: 'MODERATE',
        risk: 'Copilots may still appear sufficient for code-only tasks',
        recommendation: 'Show product and launch intelligence beyond code generation.',
      }),
    );
  }

  if (gaps.detectedGaps.length > 0 && gaps.gapDetectionScore >= 50) {
    findings.push(
      makeFinding({
        id: 'coding-assistant-gap-detection',
        category: 'CODING_ASSISTANT_COMPARISON',
        competitorType: 'AI_CODING_ASSISTANT',
        finding: 'Gap detection identifies missing capabilities coding assistants ignore',
        evidence: [
          `Gap detection score: ${gaps.gapDetectionScore}/100`,
          `Total gaps detected: ${gaps.totalGaps}`,
        ],
        differentiationLevel: gaps.criticalGapCount === 0 ? 'STRONG' : 'MODERATE',
        risk: 'Gap findings may remain invisible to users comparing against copilots',
        recommendation: 'Surface gap detection as a differentiated verification system.',
      }),
    );
  }

  if (evolution.repeatedFailureCount > 0 && evolution.selfEvolutionScore >= 40) {
    findings.push(
      makeFinding({
        id: 'coding-assistant-self-evolution',
        category: 'CODING_ASSISTANT_COMPARISON',
        competitorType: 'AI_CODING_ASSISTANT',
        finding: 'Self-evolution diagnostics address repeated failures copilots do not track',
        evidence: [
          `Self-evolution score: ${evolution.selfEvolutionScore}/100`,
          `Repeated failures tracked: ${evolution.repeatedFailureCount}`,
        ],
        differentiationLevel: evolution.evolutionRequiredCount > 0 ? 'MODERATE' : 'WEAK',
        risk: 'Evolution pressure may signal instability versus copilots',
        recommendation: 'Frame self-evolution as governance advantage, not instability.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'coding-assistant-verification-gap',
        category: 'CODING_ASSISTANT_COMPARISON',
        competitorType: 'AI_CODING_ASSISTANT',
        finding: 'Verification differentiation versus coding assistants is not fully proven',
        evidence: [`Self-evolution score: ${evolution.selfEvolutionScore}/100`],
        differentiationLevel: 'WEAK',
        risk: 'Coding assistants may appear simpler for the same outcome',
        recommendation: 'Prove verification and launch intelligence advantages over copilots.',
      }),
    );
  }

  return findings;
}

function compareAppBuilder(report: FounderTestV4ReportWithCustomerValue): CompetitiveRealityFinding[] {
  const findings: CompetitiveRealityFinding[] = [];
  const fulfillment = report.promiseFulfillment;
  const value = report.customerValueAuthority;
  const buildPromise = fulfillment.promiseAssessments.find((assessment) => assessment.promiseId === 'software-creation');

  if ((buildPromise?.status ?? 'UNPROVEN') === 'FULFILLED' && report.autonomousBuilderReality.canExecuteBuilds) {
    findings.push(
      makeFinding({
        id: 'app-builder-creation-proof',
        category: 'APP_BUILDER_COMPARISON',
        competitorType: 'APP_BUILDER',
        finding: 'Software creation is evaluated with authority proof, not prompt-only claims',
        evidence: [
          `Software creation promise: ${buildPromise?.status ?? 'UNPROVEN'}`,
          `Can execute builds: ${report.autonomousBuilderReality.canExecuteBuilds ? 'Yes' : 'No'}`,
        ],
        differentiationLevel: 'STRONG',
        risk: 'App builders may still win on speed and simplicity',
        recommendation: 'Show authority-backed creation proof app builders lack.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'app-builder-creation-gap',
        category: 'APP_BUILDER_COMPARISON',
        competitorType: 'APP_BUILDER',
        finding: 'Creation differentiation versus app builders is weak or unproven',
        evidence: [`Software creation promise: ${buildPromise?.status ?? 'UNPROVEN'}`],
        differentiationLevel: 'WEAK',
        risk: 'No-code builders may appear more immediately useful',
        recommendation: 'Prove bounded build outcomes with authority evaluation.',
      }),
    );
  }

  const projectPromise = fulfillment.promiseAssessments.find(
    (assessment) => assessment.promiseId === 'project-understanding',
  );
  if ((projectPromise?.status ?? 'UNPROVEN') !== 'CONTRADICTED') {
    findings.push(
      makeFinding({
        id: 'app-builder-project-understanding',
        category: 'APP_BUILDER_COMPARISON',
        competitorType: 'APP_BUILDER',
        finding: 'Project understanding and launch readiness exceed prompt-to-app builders',
        evidence: [
          `Project understanding promise: ${projectPromise?.status ?? 'UNPROVEN'}`,
          `Customer value score: ${value.customerValueScore}/100`,
        ],
        differentiationLevel: value.customerValueScore >= 60 ? 'MODERATE' : 'WEAK',
        risk: 'App builders may hide complexity better than authority-heavy systems',
        recommendation: 'Make project intelligence and launch readiness visibly differentiated.',
      }),
    );
  }

  if (value.scenarioResults.find((scenario) => scenario.id === 'differentiation-value')?.passed) {
    findings.push(
      makeFinding({
        id: 'app-builder-customer-value',
        category: 'APP_BUILDER_COMPARISON',
        competitorType: 'APP_BUILDER',
        finding: 'Customer value evaluation proves outcomes app builders do not measure',
        evidence: [
          `Differentiation value scenario passed: Yes`,
          `Retention value score: ${value.retentionValueScore}/100`,
        ],
        differentiationLevel: value.retentionValueScore >= 70 ? 'STRONG' : 'MODERATE',
        risk: 'Value may remain hidden behind founder-only evaluation layers',
        recommendation: 'Expose customer value proof to users comparing against app builders.',
      }),
    );
  }

  return findings;
}

function compareAutonomousAgent(report: FounderTestV4ReportWithCustomerValue): CompetitiveRealityFinding[] {
  const findings: CompetitiveRealityFinding[] = [];
  const trust = report.trustAuthority;
  const awareness = report.selfAwarenessAuthority;
  const skeptical = report.skepticalFounderSimulator;

  if (trust.trustScore >= 60 && awareness.selfAwarenessScore >= 55 && !skeptical.criticalTrustObjection) {
    findings.push(
      makeFinding({
        id: 'autonomous-agent-trust-governance',
        category: 'AUTONOMOUS_AGENT_COMPARISON',
        competitorType: 'AUTONOMOUS_AGENT',
        finding: 'Trust, awareness, and governance exceed opaque autonomous builders',
        evidence: [
          `Trust score: ${trust.trustScore}/100`,
          `Self-awareness score: ${awareness.selfAwarenessScore}/100`,
          `Critical trust objection: ${skeptical.criticalTrustObjection ? 'Yes' : 'No'}`,
        ],
        differentiationLevel: trust.trustScore >= 75 && awareness.readinessState === 'SELF_AWARE' ? 'UNIQUE' : 'STRONG',
        risk: 'Autonomous agents may appear faster despite weaker governance',
        recommendation: 'Lead with bounded trust and awareness governance as the differentiator.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'autonomous-agent-trust-gap',
        category: 'AUTONOMOUS_AGENT_COMPARISON',
        competitorType: 'AUTONOMOUS_AGENT',
        finding: 'Trust and awareness differentiation versus autonomous agents is not proven',
        evidence: [
          `Trust score: ${trust.trustScore}/100`,
          `Self-awareness readiness: ${awareness.readinessState}`,
        ],
        differentiationLevel: 'WEAK',
        risk: 'Autonomous builders may win on perceived autonomy and speed',
        recommendation: 'Prove trust and self-awareness governance before competing with agents.',
      }),
    );
  }

  if (report.verificationResultsVisibility.evidencePresent) {
    findings.push(
      makeFinding({
        id: 'autonomous-agent-verification',
        category: 'AUTONOMOUS_AGENT_COMPARISON',
        competitorType: 'AUTONOMOUS_AGENT',
        finding: 'Verification evidence distinguishes bounded execution from opaque agents',
        evidence: [`Verification evidence present: Yes`],
        differentiationLevel: 'MODERATE',
        risk: 'Verification may be too internal to influence user choice',
        recommendation: 'Make verification visible as a launch governance advantage.',
      }),
    );
  }

  if (report.unknownDiscoveryAuthority.findingCount > 0) {
    findings.push(
      makeFinding({
        id: 'autonomous-agent-unknown-discovery',
        category: 'AUTONOMOUS_AGENT_COMPARISON',
        competitorType: 'AUTONOMOUS_AGENT',
        finding: 'Unknown discovery identifies blind spots autonomous agents typically ignore',
        evidence: [
          `Unknown discovery findings: ${report.unknownDiscoveryAuthority.findingCount}`,
          `Unknown discovery score: ${report.unknownDiscoveryAuthority.unknownDiscoveryScore}/100`,
        ],
        differentiationLevel: report.unknownDiscoveryAuthority.criticalFindingCount === 0 ? 'STRONG' : 'MODERATE',
        risk: 'Blind-spot detection may look like weakness rather than advantage',
        recommendation: 'Position unknown discovery as proactive governance, not failure.',
      }),
    );
  }

  return findings;
}

function compareManualWorkflow(report: FounderTestV4ReportWithCustomerValue): CompetitiveRealityFinding[] {
  const findings: CompetitiveRealityFinding[] = [];
  const value = report.customerValueAuthority;
  const success = report.userSuccessAuthority;

  if (value.scenarioResults.find((scenario) => scenario.id === 'time-value')?.passed) {
    findings.push(
      makeFinding({
        id: 'manual-workflow-time-savings',
        category: 'MANUAL_WORKFLOW_COMPARISON',
        competitorType: 'MANUAL_WORKFLOW',
        finding: 'Meaningful time savings versus manual founder workflows are evidenced',
        evidence: [
          `Time value scenario passed: Yes`,
          `Creation journey score: ${report.creationJourneyScore}/100`,
        ],
        differentiationLevel: value.scenarioResults.find((scenario) => scenario.id === 'time-value')!.score >= 80 ? 'STRONG' : 'MODERATE',
        risk: 'Manual workflows may feel more controllable to some founders',
        recommendation: 'Quantify planning, validation, and launch acceleration versus manual work.',
      }),
    );
  } else {
    findings.push(
      makeFinding({
        id: 'manual-workflow-time-gap',
        category: 'MANUAL_WORKFLOW_COMPARISON',
        competitorType: 'MANUAL_WORKFLOW',
        finding: 'Time savings versus manual workflows are not yet proven',
        evidence: [`Customer value score: ${value.customerValueScore}/100`],
        differentiationLevel: 'WEAK',
        risk: 'Manual workflows may remain preferable if acceleration is unclear',
        recommendation: 'Prove decision and verification acceleration over manual founder work.',
      }),
    );
  }

  if (success.outcomeAchievementScore >= 60) {
    findings.push(
      makeFinding({
        id: 'manual-workflow-outcome-acceleration',
        category: 'MANUAL_WORKFLOW_COMPARISON',
        competitorType: 'MANUAL_WORKFLOW',
        finding: 'Outcome acceleration exceeds manual planning and validation cycles',
        evidence: [
          `Outcome achievement score: ${success.outcomeAchievementScore}/100`,
          `User success score: ${success.userSuccessScore}/100`,
        ],
        differentiationLevel: success.outcomeAchievementScore >= 75 ? 'STRONG' : 'MODERATE',
        risk: 'Manual processes may still feel more trustworthy to skeptical founders',
        recommendation: 'Show repeatable outcome acceleration with evidence-backed guidance.',
      }),
    );
  }

  if (report.launchReadinessReality.launchReadinessRealityScore >= 55) {
    findings.push(
      makeFinding({
        id: 'manual-workflow-launch-acceleration',
        category: 'MANUAL_WORKFLOW_COMPARISON',
        competitorType: 'MANUAL_WORKFLOW',
        finding: 'Launch acceleration through authority evaluation exceeds manual readiness reviews',
        evidence: [
          `Launch readiness reality score: ${report.launchReadinessReality.launchReadinessRealityScore}/100`,
          `Founder testing verdict: ${report.verdict}`,
        ],
        differentiationLevel: 'MODERATE',
        risk: 'Manual launch reviews may feel more rigorous if authority output is unclear',
        recommendation: 'Make launch council acceleration visible versus manual checklist reviews.',
      }),
    );
  }

  return findings;
}

const COMPARATORS = [
  compareGeneralAi,
  compareCodingAssistant,
  compareAppBuilder,
  compareAutonomousAgent,
  compareManualWorkflow,
] as const;

function calculateDifferentiationScore(findings: CompetitiveRealityFinding[]): number {
  if (!findings.length) return 0;
  return clamp(findings.reduce((sum, finding) => sum + levelScore(finding.differentiationLevel), 0) / findings.length);
}

function calculateCompetitiveRealityScore(findings: CompetitiveRealityFinding[]): number {
  return calculateDifferentiationScore(findings);
}

function calculateCompetitiveRiskScore(
  findings: CompetitiveRealityFinding[],
  differentiationScore: number,
  weakDifferentiationCount: number,
): number {
  const weakRisk = findings.filter((finding) => finding.differentiationLevel === 'NONE' || finding.differentiationLevel === 'WEAK').length;
  return clamp(weakRisk * 10 + weakDifferentiationCount * 8 + Math.max(0, COMPETITIVE_REALITY_BLOCK_SCORE - differentiationScore));
}

function deriveReadinessState(
  competitiveRealityScore: number,
  differentiationScore: number,
  uniqueAdvantageCount: number,
  blocksLaunchReadiness: boolean,
): CompetitiveReadinessState {
  if (blocksLaunchReadiness) return 'BLOCKED';
  if (differentiationScore >= 80 && uniqueAdvantageCount >= 2) return 'STRONGLY_DIFFERENTIATED';
  if (differentiationScore >= 65 && uniqueAdvantageCount >= 1) return 'DIFFERENTIATED';
  if (differentiationScore >= 45) return 'WEAKLY_DIFFERENTIATED';
  return 'COMMODITIZED';
}

function buildCacheKey(findings: CompetitiveRealityFinding[]): string {
  const digest = findings.map((finding) => `${finding.id}:${finding.differentiationLevel}`).join('|');
  return `${COMPETITIVE_REALITY_CACHE_KEY_PREFIX}:${createHash('sha256').update(digest).digest('hex').slice(0, 16)}`;
}

export function assessCompetitiveRealityAuthority(
  report: FounderTestV4ReportWithCustomerValue,
): CompetitiveRealityAssessment {
  const findings = COMPARATORS.flatMap((compare) => compare(report)).slice(0, MAX_COMPETITIVE_FINDINGS);
  const uniqueAdvantages = [
    ...new Set(
      findings
        .filter((finding) => finding.differentiationLevel === 'UNIQUE' || finding.differentiationLevel === 'STRONG')
        .map((finding) => finding.finding),
    ),
  ].slice(0, MAX_UNIQUE_ADVANTAGES);
  const competitiveRisks = [
    ...new Set(findings.filter((finding) => finding.differentiationLevel === 'NONE' || finding.differentiationLevel === 'WEAK').map((finding) => finding.risk)),
    ...findings.map((finding) => finding.risk).filter((risk) => risk.length > 0),
  ].slice(0, MAX_COMPETITIVE_RISKS);
  const uniqueAdvantageCount = findings.filter(
    (finding) => finding.differentiationLevel === 'UNIQUE' || finding.differentiationLevel === 'STRONG',
  ).length;
  const weakDifferentiationCount = findings.filter(
    (finding) => finding.differentiationLevel === 'NONE' || finding.differentiationLevel === 'WEAK',
  ).length;
  const differentiationScore = calculateDifferentiationScore(findings);
  const competitiveRealityScore = calculateCompetitiveRealityScore(findings);
  const competitiveRiskScore = calculateCompetitiveRiskScore(findings, differentiationScore, weakDifferentiationCount);
  const blocksLaunchReadiness =
    differentiationScore < COMPETITIVE_REALITY_BLOCK_SCORE ||
    competitiveRealityScore < COMPETITIVE_REALITY_BLOCK_SCORE ||
    uniqueAdvantageCount === 0;
  const readinessState = deriveReadinessState(
    competitiveRealityScore,
    differentiationScore,
    uniqueAdvantageCount,
    blocksLaunchReadiness,
  );
  const recommendations = [
    'If the product cannot prove why users should choose it, differentiation is only an assumption.',
    ...new Set(findings.map((finding) => finding.recommendation)),
    ...competitiveRisks.slice(0, 3).map((risk) => `Address competitive risk: ${risk}`),
  ].slice(0, MAX_COMPETITIVE_RECOMMENDATIONS);

  const assessment: CompetitiveRealityAssessment = {
    readOnly: true,
    advisoryOnly: true,
    competitiveRealityScore,
    differentiationScore,
    competitiveRiskScore,
    uniqueAdvantageCount,
    weakDifferentiationCount,
    blocksLaunchReadiness,
    readinessState,
    findings,
    uniqueAdvantages,
    competitiveRisks,
    recommendations,
    cacheKey: buildCacheKey(findings),
  };

  recordCompetitiveRealityAssessment(assessment);
  return assessment;
}

export function buildCompetitiveRealityAuthorityArtifacts(
  report: FounderTestV4ReportWithCustomerValue,
): {
  competitiveRealityAuthority: CompetitiveRealityAssessment;
  competitiveRealityAuthorityReportMarkdown: string;
} {
  const competitiveRealityAuthority = assessCompetitiveRealityAuthority(report);
  return {
    competitiveRealityAuthority,
    competitiveRealityAuthorityReportMarkdown: buildCompetitiveRealityReportMarkdown(
      competitiveRealityAuthority,
      report.generatedAt,
    ),
  };
}
