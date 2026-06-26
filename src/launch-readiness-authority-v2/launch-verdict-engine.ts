/**
 * Launch Readiness Authority V2 — deterministic verdict engine.
 */

import type {
  LaunchBlockerKind,
  LaunchBlockerRecord,
  LaunchConfidenceResult,
  LaunchEvidenceValidationResult,
  LaunchReadinessVerdict,
  LaunchRoutingTarget,
  LaunchVerdictResult,
} from './launch-readiness-types.js';
import { hasResidualHighRisk } from './launch-risk-analyzer.js';
import type { LaunchRiskRecord } from './launch-readiness-types.js';

const BLOCKER_VERDICT: Partial<Record<LaunchBlockerKind, LaunchReadinessVerdict>> = {
  EVIDENCE_INCOMPLETE: 'BLOCKED',
  MISSING_EXECUTION_PROOF: 'BLOCKED',
  HUMAN_REVIEW_REQUIRED: 'NEEDS_HUMAN_REVIEW',
  MISSING_REQUIRED_CAPABILITY: 'NEEDS_CAPABILITY_EVOLUTION',
  CRITICAL_SECURITY_ISSUE: 'NEEDS_HUMAN_REVIEW',
  UNRESOLVED_AUTONOMOUS_DEBUGGING_FAILURE: 'NEEDS_AUTONOMOUS_REPAIR',
  FAILED_BEHAVIOR_SCENARIO: 'NEEDS_AUTONOMOUS_REPAIR',
  FAILED_VIRTUAL_USER_JOURNEY: 'NEEDS_AUTONOMOUS_REPAIR',
  FAILED_DEVICE_PROFILE: 'NEEDS_AUTONOMOUS_REPAIR',
  FAILED_INTERACTION_PROOF: 'NEEDS_AUTONOMOUS_REPAIR',
  PROMPT_DRIFT: 'NEEDS_AUTONOMOUS_REPAIR',
  UNRESOLVED_REGRESSION: 'NEEDS_AUTONOMOUS_REPAIR',
  BLOCKED_CONTINUOUS_IMPROVEMENT: 'NOT_LAUNCH_READY',
  CRITICAL_ACCESSIBILITY_ISSUE: 'NOT_LAUNCH_READY',
  CRITICAL_PERFORMANCE_ISSUE: 'NOT_LAUNCH_READY',
  WORKSPACE_INCONSISTENCY: 'NOT_LAUNCH_READY',
  MATERIALIZATION_FAILURE: 'NOT_LAUNCH_READY',
  RESIDUAL_HIGH_RISK: 'NOT_LAUNCH_READY',
};

const ROUTING_BY_VERDICT: Partial<Record<LaunchReadinessVerdict, LaunchRoutingTarget>> = {
  NEEDS_CAPABILITY_EVOLUTION: 'MISSING_CAPABILITY_EVOLUTION',
  NEEDS_AUTONOMOUS_REPAIR: 'AUTONOMOUS_DEBUGGING',
  NEEDS_HUMAN_REVIEW: 'HUMAN_REVIEW',
  NOT_LAUNCH_READY: 'CONTINUOUS_IMPROVEMENT',
  BLOCKED: 'AUTONOMOUS_DEBUGGING',
};

const NEXT_STEP_BY_VERDICT: Record<LaunchReadinessVerdict, string> = {
  LAUNCH_READY: 'Proceed to Live Preview and production release boundary.',
  NOT_LAUNCH_READY:
    'Resolve residual high-risk findings and re-run Continuous Product Improvement before launch review.',
  NEEDS_AUTONOMOUS_REPAIR:
    'Run Autonomous Debugging after resolving upstream interaction and behavior reachability failures.',
  NEEDS_CAPABILITY_EVOLUTION:
    'Route unresolved capabilities to Missing Capability Evolution (Phase 10) and rerun capability planning.',
  NEEDS_HUMAN_REVIEW: 'Escalate blocked capabilities to human review before any launch approval.',
  BLOCKED: 'Collect missing evidence and rerun the full Era 3 pipeline before requesting launch approval.',
};

export function resolveLaunchVerdict(input: {
  evidenceValidation: LaunchEvidenceValidationResult;
  blockers: readonly LaunchBlockerRecord[];
  risks: readonly LaunchRiskRecord[];
  confidence: LaunchConfidenceResult;
}): LaunchVerdictResult {
  if (!input.evidenceValidation.valid) {
    return {
      readOnly: true,
      verdict: 'BLOCKED',
      primaryReason: input.evidenceValidation.primaryBlockReason ?? 'EVIDENCE_INCOMPLETE',
      supportingEvidence: input.evidenceValidation.issues.map((i) => i.detail),
      blockingEvidence: input.evidenceValidation.issues
        .filter((i) => i.severity === 'BLOCKING')
        .map((i) => i.detail),
      confidence: input.confidence,
      requiredNextStep: NEXT_STEP_BY_VERDICT.BLOCKED,
      routingTarget: ROUTING_BY_VERDICT.BLOCKED ?? null,
      affectedGates: ['EVIDENCE_VALIDATION'],
    };
  }

  if (input.blockers.length) {
    const priority: LaunchBlockerKind[] = [
      'EVIDENCE_INCOMPLETE',
      'MISSING_EXECUTION_PROOF',
      'HUMAN_REVIEW_REQUIRED',
      'MISSING_REQUIRED_CAPABILITY',
      'UNRESOLVED_AUTONOMOUS_DEBUGGING_FAILURE',
      'FAILED_VIRTUAL_USER_JOURNEY',
      'FAILED_BEHAVIOR_SCENARIO',
      'FAILED_INTERACTION_PROOF',
      'FAILED_DEVICE_PROFILE',
      'CRITICAL_ACCESSIBILITY_ISSUE',
      'RESIDUAL_HIGH_RISK',
      'BLOCKED_CONTINUOUS_IMPROVEMENT',
    ];

    const primary =
      priority.map((kind) => input.blockers.find((b) => b.kind === kind)).find(Boolean) ?? input.blockers[0]!;
    const verdict = BLOCKER_VERDICT[primary.kind] ?? 'NOT_LAUNCH_READY';

    return {
      readOnly: true,
      verdict,
      primaryReason: primary.summary,
      supportingEvidence: input.blockers.slice(0, 6).map((b) => `${b.sourceId}: ${b.summary}`),
      blockingEvidence: input.blockers.map((b) => b.summary),
      confidence: input.confidence,
      requiredNextStep:
        verdict === 'NEEDS_AUTONOMOUS_REPAIR' && primary.kind === 'FAILED_INTERACTION_PROOF'
          ? 'Run Autonomous Debugging after resolving interaction reachability.'
          : NEXT_STEP_BY_VERDICT[verdict],
      routingTarget: primary.routingTarget ?? ROUTING_BY_VERDICT[verdict] ?? null,
      affectedGates: [...new Set(input.blockers.map((b) => b.sourceId))],
    };
  }

  if (hasResidualHighRisk(input.risks)) {
    const a11y = input.risks.find((r) => r.category === 'ACCESSIBILITY' && r.residualRisk === 'HIGH');
    return {
      readOnly: true,
      verdict: 'NOT_LAUNCH_READY',
      primaryReason: a11y?.evidence[0] ?? 'Residual high risk remains unresolved',
      supportingEvidence: input.risks.filter((r) => r.residualRisk === 'HIGH').map((r) => r.evidence.join('; ')),
      blockingEvidence: input.risks.filter((r) => r.residualRisk === 'HIGH').flatMap((r) => r.evidence),
      confidence: input.confidence,
      requiredNextStep: 'Resolve accessibility and residual high-risk findings before launch approval.',
      routingTarget: 'CONTINUOUS_IMPROVEMENT',
      affectedGates: ['ACCESSIBILITY_VALIDATION', 'RISK_ASSESSMENT'],
    };
  }

  return {
    readOnly: true,
    verdict: 'LAUNCH_READY',
    primaryReason: 'All Era 3 engineering evidence validated with no launch blockers.',
    supportingEvidence: ['Evidence validated', 'No blockers', 'Confidence within launch threshold'],
    blockingEvidence: [],
    confidence: input.confidence,
    requiredNextStep: NEXT_STEP_BY_VERDICT.LAUNCH_READY,
    routingTarget: null,
    affectedGates: [],
  };
}
