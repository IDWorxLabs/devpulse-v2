/**
 * Autonomous Founder Launch Authority — launch decision explainability.
 * Every verdict must be understandable — no opaque launch decisions.
 */

import type {
  AutonomousFounderLaunchAssessment,
  FounderEvidenceSnapshot,
  FounderLaunchVerdict,
  LaunchDecisionExplainability,
} from './autonomous-founder-launch-authority-types.js';

function isLaunchApprovedVerdict(verdict: FounderLaunchVerdict): boolean {
  return verdict === 'LAUNCH_READY' || verdict === 'LAUNCH_READY_WITH_WARNINGS';
}

export function buildLaunchDecisionExplainability(input: {
  verdict: FounderLaunchVerdict;
  evidence: FounderEvidenceSnapshot;
  assessment: Pick<AutonomousFounderLaunchAssessment, 'scores' | 'reviewers' | 'blocksLaunchReason'>;
}): LaunchDecisionExplainability {
  const { verdict, evidence, assessment } = input;
  const positiveSignals: string[] = [];
  const risks: string[] = [];

  const evidenceSources = [
    evidence.buildReality,
    evidence.blueprintStructure,
    evidence.blueprintVisual,
    evidence.featureReality,
    evidence.universalFeatureContract,
    evidence.engineeringReality,
    evidence.launchReadiness,
  ];

  for (const source of evidenceSources) {
    if (source.available && source.passed) {
      positiveSignals.push(`${source.sourceName} passed (${source.score}/100)`);
    }
    if (source.blockers.length > 0) {
      risks.push(...source.blockers.slice(0, 2).map((b) => `${source.sourceName}: ${b}`));
    }
    if (!source.available) {
      risks.push(`${source.sourceName} evidence not available`);
    } else if (!source.passed) {
      risks.push(`${source.sourceName} did not pass (${source.score}/100)`);
    }
  }

  if (evidence.requirementDiscovery?.canProceedToPlanning) {
    positiveSignals.push(
      `Requirement discovery confidence ${evidence.requirementDiscovery.requirementConfidenceScore}/100`,
    );
  } else if (evidence.requirementDiscovery?.poorlyUnderstood) {
    risks.push('Requirement discovery incomplete');
  }

  if (evidence.verificationHub?.verificationSufficientForLaunch) {
    positiveSignals.push(
      `Verification hub coverage ${evidence.verificationHub.overallCoveragePercent}%`,
    );
  } else if (evidence.verificationHub?.incompleteVerification) {
    risks.push(
      `Verification hub incomplete (${evidence.verificationHub.verificationConfidenceScore}/100 confidence)`,
    );
  }

  if (evidence.productArchitecture && evidence.productArchitecture.productReadinessScore >= 80) {
    positiveSignals.push(
      `Product architecture readiness ${evidence.productArchitecture.productReadinessScore}/100`,
    );
  } else if (evidence.productArchitecture?.architecturallyIncomplete) {
    risks.push(
      `Product architecture incomplete (${evidence.productArchitecture.productReadinessScore}/100 readiness, ${evidence.productArchitecture.criticalProductGapCount} critical gap(s))`,
    );
    if (evidence.productArchitecture.missingScreens.length > 0) {
      risks.push(`Missing screens: ${evidence.productArchitecture.missingScreens.slice(0, 3).join(', ')}`);
    }
  }

  for (const reviewer of assessment.reviewers) {
    if (reviewer.score >= 80) {
      positiveSignals.push(`${reviewer.reviewerName} score ${reviewer.score}/100`);
    }
    risks.push(...reviewer.risks.slice(0, 1));
  }

  const founderReviewer = assessment.reviewers.find((r) => r.role === 'founder');
  const founderConfidence = founderReviewer?.founderConfidence ?? assessment.scores.founderScore;

  let reasonForVerdict: string;
  switch (verdict) {
    case 'LAUNCH_READY':
      reasonForVerdict = `Overall founder score ${assessment.scores.overallFounderScore}/100 with founder confidence ${founderConfidence}/100 — evidence supports launch.`;
      break;
    case 'LAUNCH_READY_WITH_WARNINGS':
      reasonForVerdict = `Score ${assessment.scores.overallFounderScore}/100 meets threshold with warnings that should be monitored post-launch.`;
      break;
    case 'NEEDS_AUTOFIX':
      reasonForVerdict = 'Resolvable issues detected — autofix pipeline should address blockers before launch.';
      break;
    case 'NEEDS_HUMAN_REVIEW':
      reasonForVerdict = 'Mixed or ambiguous evidence requires human founder review before launch.';
      break;
    case 'NOT_LAUNCH_READY':
    default:
      reasonForVerdict =
        assessment.blocksLaunchReason ??
        evidence.missingPrerequisites[0] ??
        'Critical evidence gaps prevent a responsible launch approval.';
      break;
  }

  const decisionSummary = isLaunchApprovedVerdict(verdict)
    ? `Launch approved (${verdict.replaceAll('_', ' ')}) — ${positiveSignals.length} positive signals, ${risks.length} risks noted.`
    : `Launch not approved (${verdict.replaceAll('_', ' ')}) — ${risks.length} risk signal(s) outweigh launch readiness.`;

  return {
    readOnly: true,
    decisionSummary,
    topPositiveSignals: [...new Set(positiveSignals)].slice(0, 6),
    topRisks: [...new Set(risks.filter(Boolean))].slice(0, 6),
    reasonForVerdict,
  };
}
