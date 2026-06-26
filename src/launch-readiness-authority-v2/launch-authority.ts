/**
 * Launch Readiness Authority V2 — main orchestrator.
 * Decides launch readiness from accumulated engineering evidence — never performs engineering work.
 */

import { buildLaunchDecisionAudit, resetLaunchDecisionAuditForTests } from './launch-decision-audit.js';
import { explainLaunchDecision } from './launch-decision-explainer.js';
import { detectLaunchBlockers, resetLaunchBlockerDetectorForTests } from './launch-blocker-detector.js';
import { calculateLaunchConfidence } from './launch-confidence-engine.js';
import { collectLaunchEvidence, resetLaunchEvidenceCollectorForTests } from './launch-evidence-collector.js';
import { validateLaunchEvidence } from './launch-evidence-validator.js';
import { recordLaunchReadinessDecision, resetLaunchReadinessHistoryForTests } from './launch-readiness-history.js';
import { buildLaunchReadinessReport } from './launch-readiness-report-builder.js';
import { scoreLaunchReadiness } from './launch-readiness-scorer.js';
import type {
  LaunchEvidenceDashboard,
  LaunchReadinessPipelineInput,
  LaunchReadinessPipelineResult,
} from './launch-readiness-types.js';
import { LAUNCH_READINESS_AUTHORITY_V2_PASS_TOKEN } from './launch-readiness-types.js';
import { analyzeLaunchRisk, resetLaunchRiskAnalyzerForTests } from './launch-risk-analyzer.js';
import { resolveLaunchVerdict } from './launch-verdict-engine.js';

let pipelineCounter = 0;
let lastPipelineResult: LaunchReadinessPipelineResult | null = null;

export function resetLaunchReadinessAuthorityForTests(): void {
  pipelineCounter = 0;
  lastPipelineResult = null;
  resetLaunchEvidenceCollectorForTests();
  resetLaunchBlockerDetectorForTests();
  resetLaunchRiskAnalyzerForTests();
  resetLaunchDecisionAuditForTests();
  resetLaunchReadinessHistoryForTests();
}

export function getLastLaunchReadinessPipelineResult(): LaunchReadinessPipelineResult | null {
  return lastPipelineResult;
}

export function getLaunchReadinessPassToken(): string {
  return LAUNCH_READINESS_AUTHORITY_V2_PASS_TOKEN;
}

function nextPipelineId(): string {
  pipelineCounter += 1;
  return `launch-readiness-pipeline-${pipelineCounter}`;
}

function buildDashboard(input: {
  evidence: LaunchReadinessPipelineResult['evidence'];
  blockers: LaunchReadinessPipelineResult['blockers'];
  risks: LaunchReadinessPipelineResult['risks'];
  verdict: LaunchReadinessPipelineResult['verdict'];
  confidence: LaunchReadinessPipelineResult['confidence'];
  audit: LaunchReadinessPipelineResult['audit'];
}): LaunchEvidenceDashboard {
  const era3Gates: LaunchEvidenceDashboard['gateStatus'] = [
    'INTENT_UNDERSTANDING',
    'PROMPT_FAITHFULNESS',
    'CAPABILITY_PLANNING',
    'MISSING_CAPABILITY_EVOLUTION',
    'INCREMENTAL_BUILD',
    'BEHAVIOR_SIMULATION',
    'VIRTUAL_USER',
    'VIRTUAL_DEVICE',
    'INTERACTION_PROOF',
    'AUTONOMOUS_DEBUGGING',
    'CONTINUOUS_IMPROVEMENT',
  ].map((gate) => {
    const source = input.evidence.sources.find((s) => s.sourceId === gate);
    return {
      gate,
      status: source?.status ?? 'UNAVAILABLE',
      sourceEvidenceId: source?.evidenceId ?? null,
    };
  });

  return {
    readOnly: true,
    verdict: input.verdict.verdict,
    confidence: input.confidence,
    blockers: input.blockers,
    residualRisk: input.risks,
    evidenceCoverage: {
      required: input.evidence.sources.length + input.evidence.missingSources.length,
      collected: input.evidence.sources.filter((s) => s.status !== 'UNAVAILABLE').length,
      missing: input.evidence.missingSources,
    },
    gateStatus: era3Gates,
    repairHistory: input.evidence.sources
      .filter((s) => s.sourceId === 'AUTONOMOUS_DEBUGGING')
      .flatMap((s) => s.supportingArtifacts),
    capabilityEvolution: input.evidence.sources
      .filter((s) => s.sourceId === 'MISSING_CAPABILITY_EVOLUTION')
      .flatMap((s) => s.supportingArtifacts),
    continuousImprovement: input.evidence.sources
      .filter((s) => s.sourceId === 'CONTINUOUS_IMPROVEMENT')
      .flatMap((s) => [...s.warnings, ...s.residualRisk]),
    auditTrail: input.audit.decisionTrace,
    sourceLinks: input.evidence.sources.map((s) => ({
      sourceId: s.sourceId,
      evidenceId: s.evidenceId,
    })),
  };
}

export function runLaunchReadinessAuthorityPipeline(
  input: LaunchReadinessPipelineInput,
): LaunchReadinessPipelineResult {
  const pipelineId = nextPipelineId();
  const decisionTrace: string[] = ['Launch evidence collection started'];

  const evidence = collectLaunchEvidence(input);
  decisionTrace.push(`Collected ${evidence.sources.length} evidence source(s)`);

  const evidenceValidation = validateLaunchEvidence(evidence);
  decisionTrace.push(
    evidenceValidation.valid ? 'Evidence validation passed' : `Evidence validation failed: ${evidenceValidation.primaryBlockReason}`,
  );

  const blockers = detectLaunchBlockers(evidence);
  decisionTrace.push(`Detected ${blockers.length} launch blocker(s)`);

  const risks = analyzeLaunchRisk(evidence);
  decisionTrace.push(`Assessed ${risks.length} residual risk record(s)`);

  const confidence = calculateLaunchConfidence({ evidence, evidenceValidation, blockers, risks });
  decisionTrace.push(`Confidence calculated (blocker override: ${confidence.blockerOverrideApplied})`);

  const scores = scoreLaunchReadiness({ evidence, blockers });
  decisionTrace.push(`Readiness score: ${scores.overallScore}`);

  const verdict = resolveLaunchVerdict({ evidenceValidation, blockers, risks, confidence });
  decisionTrace.push(`Verdict: ${verdict.verdict}`);

  const audit = buildLaunchDecisionAudit({
    evidence,
    blockers,
    confidence,
    scores,
    verdict,
    decisionTrace,
  });

  const explanation = explainLaunchDecision({ evidence, blockers, verdict });
  const dashboard = buildDashboard({ evidence, blockers, risks, verdict, confidence, audit });
  const reportMarkdown = buildLaunchReadinessReport({
    pipelineId,
    verdict,
    explanation,
    dashboard,
  });

  const result: LaunchReadinessPipelineResult = {
    readOnly: true,
    pipelineId,
    collectedAt: evidence.collectedAt,
    evidence,
    evidenceValidation,
    blockers,
    risks,
    confidence,
    scores,
    verdict,
    audit,
    explanation,
    dashboard,
    reportMarkdown,
  };

  recordLaunchReadinessDecision(result);
  lastPipelineResult = result;
  return result;
}

export function isLaunchReady(result: LaunchReadinessPipelineResult): boolean {
  return result.verdict.verdict === 'LAUNCH_READY';
}

export function buildLaunchReadinessAuthorityEvidence(result: LaunchReadinessPipelineResult): {
  readOnly: true;
  verdict: LaunchReadinessPipelineResult['verdict']['verdict'];
  blockerCount: number;
  overallConfidence: number;
  evidenceSourceCount: number;
  launchApproved: boolean;
  blockers: readonly string[];
} {
  return {
    readOnly: true,
    verdict: result.verdict.verdict,
    blockerCount: result.blockers.length,
    overallConfidence: result.confidence.overallConfidence,
    evidenceSourceCount: result.evidence.sources.length,
    launchApproved: result.verdict.verdict === 'LAUNCH_READY',
    blockers: result.blockers.map((b) => b.summary),
  };
}
