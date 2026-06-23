/**
 * Autonomous Founder Launch Authority V1 — six-reviewer panel engine.
 */

import type {
  FounderEvidenceSnapshot,
  FounderReviewerAssessment,
  FounderReviewerRole,
} from './autonomous-founder-launch-authority-types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function weightedAverage(weights: Array<{ score: number; weight: number }>): number {
  let sum = 0;
  let total = 0;
  for (const entry of weights) {
    if (entry.weight <= 0) continue;
    sum += entry.score * entry.weight;
    total += entry.weight;
  }
  return total <= 0 ? 0 : clamp(sum / total);
}

function dedupe(items: string[]): string[] {
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

function reviewSeniorEngineer(evidence: FounderEvidenceSnapshot): FounderReviewerAssessment {
  const score = weightedAverage([
    { score: evidence.engineeringReality.score, weight: 0.45 },
    { score: evidence.buildReality.score, weight: 0.3 },
    { score: evidence.blueprintStructure.score, weight: 0.25 },
  ]);

  const findings = dedupe([
    ...evidence.engineeringReality.findings.slice(0, 3),
    ...evidence.buildReality.findings.slice(0, 2),
    ...evidence.blueprintStructure.findings.slice(0, 2),
    evidence.engineeringReality.passed
      ? 'Engineering reality evidence supports maintainable architecture.'
      : 'Engineering reality evidence reports unresolved engineering concerns.',
  ]).slice(0, 6);

  const risks = dedupe([
    ...evidence.engineeringReality.blockers,
    ...evidence.buildReality.blockers,
    ...evidence.blueprintStructure.blockers,
    score < 75 ? 'Senior engineer would hesitate to approve this codebase for launch.' : '',
  ]).slice(0, 5);

  return {
    readOnly: true,
    role: 'senior-engineer',
    reviewerName: 'Senior Engineer',
    score,
    findings,
    risks,
  };
}

function reviewQa(evidence: FounderEvidenceSnapshot): FounderReviewerAssessment {
  const score = weightedAverage([
    { score: evidence.featureReality.score, weight: 0.35 },
    { score: evidence.universalFeatureContract.score, weight: 0.35 },
    { score: evidence.engineeringReality.score, weight: 0.3 },
  ]);

  const failedChecks = dedupe([
    ...evidence.featureReality.findings.filter((item) => /fail|missing|not/i.test(item)),
    ...evidence.universalFeatureContract.findings.filter((item) => /fail|missing|not/i.test(item)),
  ]);

  const findings = dedupe([
    evidence.featureReality.passed
      ? 'Core workflows validated by Feature Reality evidence.'
      : 'Feature Reality reports unresolved workflow failures.',
    evidence.universalFeatureContract.passed
      ? 'Universal Feature Contract checks passed.'
      : 'Universal Feature Contract reports contract gaps.',
    ...failedChecks.slice(0, 4),
  ]).slice(0, 6);

  const risks = dedupe([
    ...evidence.featureReality.blockers,
    ...evidence.universalFeatureContract.blockers,
    ...evidence.engineeringReality.warnings,
    failedChecks.length > 0 ? 'Unexplained test gaps remain in rendered runtime evidence.' : '',
  ]).slice(0, 5);

  return {
    readOnly: true,
    role: 'qa',
    reviewerName: 'QA Lead',
    score,
    findings,
    risks,
  };
}

function reviewUx(evidence: FounderEvidenceSnapshot): FounderReviewerAssessment {
  const score = weightedAverage([
    { score: evidence.blueprintVisual.score, weight: 0.55 },
    { score: evidence.featureReality.score, weight: 0.25 },
    { score: evidence.blueprintStructure.score, weight: 0.2 },
  ]);

  const findings = dedupe([
    evidence.blueprintVisual.passed
      ? 'Blueprint visual evidence supports understandable onboarding and navigation.'
      : 'Blueprint visual evidence reports UX structure concerns.',
    ...evidence.blueprintVisual.findings.slice(0, 3),
    evidence.blueprintStructure.passed
      ? 'Required blueprint screens are structurally present.'
      : 'Important blueprint screens or markers are missing.',
  ]).slice(0, 6);

  const risks = dedupe([
    ...evidence.blueprintVisual.blockers,
    ...evidence.blueprintStructure.blockers,
    score < 70 ? 'A first-time user may struggle to succeed without guidance.' : '',
  ]).slice(0, 5);

  return {
    readOnly: true,
    role: 'ux',
    reviewerName: 'UX Reviewer',
    score,
    findings,
    risks,
  };
}

function reviewProduct(evidence: FounderEvidenceSnapshot): FounderReviewerAssessment {
  const score = weightedAverage([
    { score: evidence.featureReality.score, weight: 0.4 },
    { score: evidence.universalFeatureContract.score, weight: 0.4 },
    { score: evidence.launchReadiness.score, weight: 0.2 },
  ]);

  const findings = dedupe([
    evidence.universalFeatureContract.passed
      ? 'Entities, actions, and workflows appear complete in contract evidence.'
      : 'Universal Feature Contract evidence reports missing business functionality.',
    ...evidence.universalFeatureContract.findings.slice(0, 3),
    ...evidence.featureReality.findings.slice(0, 2),
  ]).slice(0, 6);

  const risks = dedupe([
    ...evidence.universalFeatureContract.blockers,
    ...evidence.featureReality.blockers,
    score < 75 ? 'Important product workflows may be incomplete for real users.' : '',
  ]).slice(0, 5);

  return {
    readOnly: true,
    role: 'product',
    reviewerName: 'Product Reviewer',
    score,
    findings,
    risks,
  };
}

function reviewLaunch(evidence: FounderEvidenceSnapshot): FounderReviewerAssessment {
  const score = weightedAverage([
    { score: evidence.launchReadiness.score, weight: 0.4 },
    { score: evidence.featureReality.score, weight: 0.2 },
    { score: evidence.engineeringReality.score, weight: 0.2 },
    { score: evidence.blueprintVisual.score, weight: 0.2 },
  ]);

  const allBlockers = dedupe([
    ...evidence.buildReality.blockers,
    ...evidence.blueprintStructure.blockers,
    ...evidence.blueprintVisual.blockers,
    ...evidence.featureReality.blockers,
    ...evidence.universalFeatureContract.blockers,
    ...evidence.engineeringReality.blockers,
    ...evidence.launchReadiness.blockers,
  ]);

  const findings = dedupe([
    evidence.launchReadiness.passed
      ? 'Launch readiness evidence supports customer use.'
      : 'Launch readiness evidence recommends caution or delay.',
    ...evidence.launchReadiness.findings.slice(0, 2),
    allBlockers.length === 0
      ? 'No launch blockers detected across consumed evidence.'
      : `${allBlockers.length} launch blocker(s) detected in evidence.`,
  ]).slice(0, 6);

  const risks = dedupe([
    ...allBlockers.slice(0, 4),
    ...evidence.launchReadiness.warnings.slice(0, 2),
    score < 70 ? 'Support risk is elevated for a public launch.' : '',
  ]).slice(0, 5);

  return {
    readOnly: true,
    role: 'launch',
    reviewerName: 'Launch Reviewer',
    score,
    findings,
    risks,
  };
}

function reviewFounder(reviewers: FounderReviewerAssessment[]): FounderReviewerAssessment {
  const panelScores = reviewers.map((reviewer) => reviewer.score);
  const score =
    panelScores.length === 0
      ? 0
      : clamp(panelScores.reduce((sum, value) => sum + value, 0) / panelScores.length);

  const criticalRiskCount = reviewers.reduce(
    (count, reviewer) =>
      count + reviewer.risks.filter((risk) => /critical|block|fail|missing/i.test(risk)).length,
    0,
  );

  const founderConfidence = clamp(score - criticalRiskCount * 4);

  const findings = dedupe([
    score >= 85
      ? 'Would personally launch this product with confidence.'
      : score >= 75
        ? 'Would launch with caution and monitor remaining weaknesses.'
        : 'Would not launch yet — obvious weaknesses remain.',
    ...reviewers.flatMap((reviewer) => reviewer.findings.slice(0, 1)),
  ]).slice(0, 6);

  const risks = dedupe([
    ...reviewers.flatMap((reviewer) => reviewer.risks.slice(0, 2)),
    founderConfidence < 70 ? 'Founder confidence is below professional launch threshold.' : '',
  ]).slice(0, 5);

  return {
    readOnly: true,
    role: 'founder',
    reviewerName: 'Founder',
    score,
    findings,
    risks,
    founderConfidence,
  };
}

export function runFounderReviewerPanel(evidence: FounderEvidenceSnapshot): FounderReviewerAssessment[] {
  const panel = [
    reviewSeniorEngineer(evidence),
    reviewQa(evidence),
    reviewUx(evidence),
    reviewProduct(evidence),
    reviewLaunch(evidence),
  ];
  return [...panel, reviewFounder(panel)];
}

export function getReviewerByRole(
  reviewers: FounderReviewerAssessment[],
  role: FounderReviewerRole,
): FounderReviewerAssessment | null {
  return reviewers.find((reviewer) => reviewer.role === role) ?? null;
}
