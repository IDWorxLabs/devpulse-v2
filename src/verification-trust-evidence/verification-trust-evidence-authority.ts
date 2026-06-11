/**
 * Verification Trust & Evidence Clarity Authority — explainable verification for founders.
 */

import type { VerificationCheckResult } from '../verification-results-visibility/verification-results-visibility-types.js';
import {
  MAX_VERIFICATION_TRUST_FINDINGS,
  MAX_VERIFICATION_TRUST_SCENARIOS,
} from './verification-trust-evidence-bounds.js';
import type {
  AssessVerificationTrustEvidenceInput,
  VerificationTrustConfidence,
  VerificationTrustEvidenceAssessment,
  VerificationTrustEvidenceVisibility,
  VerificationTrustFinding,
  VerificationTrustScenarioResult,
  VerificationTrustShellSources,
  VerificationTrustStatus,
  VerificationTrustSummary,
} from './verification-trust-evidence-types.js';

const SCOPE_CHECKED = [
  'Navigation',
  'Readiness',
  'Critical workflows',
  'Application availability',
  'Required assets',
  'Live Preview interaction',
  'Project context retention',
];

const SCOPE_NOT_CHECKED = [
  'Real customer usage',
  'Production traffic',
  'Business viability',
  'Marketing readiness',
  'Future scalability',
];

function shellCopy(sources: VerificationTrustShellSources): string {
  return `${sources.html}\n${sources.appJs}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function formatDuration(ms: number | null | undefined): string | null {
  if (ms == null || ms <= 0) return null;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTimestamp(ts: number | null | undefined): string | null {
  if (ts == null || ts <= 0) return null;
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return null;
  }
}

function founderReadableEvidence(check: VerificationCheckResult): string {
  const raw = check.evidence.trim();
  if (!raw || raw === 'No verification run recorded.') {
    return check.meaning;
  }
  return raw
    .replace(/Preview state:/gi, 'Preview status:')
    .replace(/Memory score:/gi, 'Project memory score:')
    .replace(/Vision alignment:/gi, 'Product identity alignment:')
    .replace(/Human success rate:/gi, 'Founder navigation clarity:')
    .replace(/Verification score:/gi, 'Verification readiness:');
}

function whyPassed(check: VerificationCheckResult): string | null {
  if (check.status !== 'PASS') return null;
  if (check.meaning && !/not|fail|blocked|unclear/i.test(check.meaning)) {
    return check.meaning.endsWith('.') ? check.meaning : `${check.meaning}.`;
  }
  return `${check.checkName} completed successfully with supporting evidence.`;
}

function whyFailed(check: VerificationCheckResult): string | null {
  if (check.status === 'PASS' || check.status === 'NOT_RUN') return null;
  if (check.status === 'WARNING') {
    return check.meaning.endsWith('.') ? check.meaning : `${check.meaning}.`;
  }
  if (check.recommendedAction) {
    return `${check.meaning} ${check.recommendedAction}`.trim();
  }
  return check.meaning.endsWith('.') ? check.meaning : `${check.meaning}.`;
}

function deriveStatus(
  vr: AssessVerificationTrustEvidenceInput['verificationResults'],
): { status: VerificationTrustStatus; explanation: string } {
  if (vr.state === 'NO_VERIFICATION_RUN' || vr.state === 'VERIFICATION_RUNNING') {
    return {
      status: 'NOT_RUN',
      explanation: 'Run Founder Testing to produce an explainable verification result.',
    };
  }
  if (vr.state === 'VERIFICATION_FAILED' || vr.state === 'VERIFICATION_BLOCKED') {
    return {
      status: 'FAIL',
      explanation: `${vr.summary.failCount + vr.summary.blockedCount} check(s) blocked or failed launch confidence.`,
    };
  }
  if (vr.state === 'VERIFICATION_WARNINGS' || vr.summary.warningCount > 0) {
    return {
      status: 'PASS_WITH_WARNINGS',
      explanation: `${vr.summary.warningCount} warning(s) remain — review before widening access.`,
    };
  }
  return {
    status: 'PASS',
    explanation: 'Required checks passed with supporting evidence and no launch-blocking failures.',
  };
}

function deriveConfidence(
  vr: AssessVerificationTrustEvidenceInput['verificationResults'],
  status: VerificationTrustStatus,
): { confidence: VerificationTrustConfidence; explanation: string } {
  if (status === 'NOT_RUN') {
    return {
      confidence: 'Low',
      explanation: 'No verification run yet — confidence cannot be established.',
    };
  }
  if (status === 'FAIL') {
    return {
      confidence: 'Low',
      explanation: 'Failed or blocked checks reduce launch confidence until issues are resolved.',
    };
  }
  const score = vr.summary.readinessScore;
  const hasEvidence = vr.categories.some((g) => g.checks.some((c) => c.evidence && c.status !== 'NOT_RUN'));
  if (status === 'PASS' && score >= 75 && vr.summary.failCount === 0 && hasEvidence) {
    return {
      confidence: 'High',
      explanation: 'Strong readiness score, passing checks, and visible evidence support this result.',
    };
  }
  if (status === 'PASS_WITH_WARNINGS' || score >= 55) {
    return {
      confidence: 'Medium',
      explanation: 'Core checks passed but warnings or moderate readiness keep confidence cautious.',
    };
  }
  return {
    confidence: 'Low',
    explanation: 'Readiness score or evidence gaps leave meaningful uncertainty.',
  };
}

function buildMajorFindings(
  vr: AssessVerificationTrustEvidenceInput['verificationResults'],
): VerificationTrustFinding[] {
  const checks = vr.categories.flatMap((g) => g.checks);
  const prioritized = [
    ...checks.filter((c) => c.status === 'FAIL' || c.status === 'BLOCKED'),
    ...checks.filter((c) => c.status === 'WARNING'),
    ...checks.filter((c) => c.status === 'PASS'),
  ].slice(0, 6);

  return prioritized.map((check, index) => ({
    id: `trust-finding-${index + 1}`,
    area: check.category,
    whatWasChecked: check.checkName,
    evidenceFound: founderReadableEvidence(check),
    whyPassed: whyPassed(check),
    whyFailed: whyFailed(check),
    status: check.status,
  }));
}

function buildFounderGuidance(status: VerificationTrustStatus): string[] {
  switch (status) {
    case 'PASS':
      return [
        'Verification passed.',
        'Recommended next steps:',
        'Review remaining recommendations',
        'Test key workflows',
        'Prepare launch activities',
      ];
    case 'PASS_WITH_WARNINGS':
      return [
        'Verification passed with concerns.',
        'Recommended next steps:',
        'Review warnings',
        'Address risks where practical',
        'Re-run Verification',
      ];
    case 'FAIL':
      return [
        'Verification identified launch-blocking issues.',
        'Recommended next steps:',
        'Review failures',
        'Fix identified issues',
        'Re-run Verification',
      ];
    default:
      return [
        'Run Founder Testing to generate explainable verification results.',
        'Recommended next steps:',
        'Open Verification',
        'Run Founder Test',
        'Review evidence and next steps here',
      ];
  }
}

export function verificationTrustEvidenceResolved(
  checkId: string,
  sources: VerificationTrustShellSources,
): boolean {
  const combined = shellCopy(sources);
  switch (checkId) {
    case 'trust-section-visible':
      return (
        combined.includes('verification-trust-evidence') &&
        combined.includes('Verification Trust & Evidence')
      );
    case 'summary-visible':
      return (
        combined.includes('Verification Summary') &&
        combined.includes('Checks Executed') &&
        combined.includes('Confidence explanation')
      );
    case 'what-was-checked':
      return combined.includes('What Was Checked');
    case 'evidence-found':
      return combined.includes('Evidence Found');
    case 'why-passed':
      return combined.includes('Why It Passed');
    case 'why-failed':
      return combined.includes('Why It Failed');
    case 'scope-checked':
      return combined.includes('What Verification Checked');
    case 'scope-not-checked':
      return combined.includes('What Verification Did Not Check');
    case 'pass-guidance':
      return combined.includes('Verification passed.') && combined.includes('Recommended next steps:');
    case 'warn-guidance':
      return combined.includes('Verification passed with concerns.');
    case 'fail-guidance':
      return combined.includes('Verification identified launch-blocking issues.');
    case 'confidence-explained':
      return combined.includes('Confidence explanation');
    case 'pass-not-guarantee':
      return (
        combined.includes('Business viability') &&
        combined.includes('What Verification Did Not Check')
      );
    case 'why-pass-scenario':
      return combined.includes('Why It Passed') && combined.includes('Why It Failed');
    case 'next-steps-scenario':
      return combined.includes('Recommended next steps:') && combined.includes('Re-run Verification');
    default:
      return false;
  }
}

function runScenario(
  id: string,
  name: string,
  passed: boolean,
  detail: string,
  bucket: VerificationTrustScenarioResult[],
): void {
  bucket.push({ id, name, passed, detail });
}

export function assessVerificationTrustEvidence(
  input: AssessVerificationTrustEvidenceInput,
): VerificationTrustEvidenceAssessment {
  const { verificationResults: vr, shellSources, durationMs } = input;
  const scenarios: VerificationTrustScenarioResult[] = [];
  const { status, explanation: statusExplanation } = deriveStatus(vr);
  const { confidence, explanation: confidenceExplanation } = deriveConfidence(vr, status);
  const executed =
    vr.summary.passCount +
    vr.summary.failCount +
    vr.summary.blockedCount +
    vr.summary.warningCount +
    vr.summary.notRunCount;
  const skipped = vr.summary.notRunCount;

  const summary: VerificationTrustSummary = {
    status,
    statusExplanation,
    confidence,
    confidenceExplanation,
    timestampLabel: formatTimestamp(vr.summary.lastRunTimestamp) ?? vr.summary.lastRunLabel,
    durationLabel: formatDuration(durationMs ?? null),
    checksExecuted: executed,
    checksPassed: vr.summary.passCount,
    checksFailed: vr.summary.failCount + vr.summary.blockedCount,
    checksSkipped: skipped,
  };

  const majorFindings = buildMajorFindings(vr);
  const founderGuidance = buildFounderGuidance(status);

  const trustSection = verificationTrustEvidenceResolved('trust-section-visible', shellSources);
  const summaryVisible = verificationTrustEvidenceResolved('summary-visible', shellSources);
  const evidenceVisible = verificationTrustEvidenceResolved('evidence-found', shellSources);
  const scopeVisible =
    verificationTrustEvidenceResolved('scope-checked', shellSources) &&
    verificationTrustEvidenceResolved('scope-not-checked', shellSources);
  const guidanceVisible =
    verificationTrustEvidenceResolved('pass-guidance', shellSources) &&
    verificationTrustEvidenceResolved('fail-guidance', shellSources) &&
    verificationTrustEvidenceResolved('warn-guidance', shellSources);
  const confidenceExplained = verificationTrustEvidenceResolved('confidence-explained', shellSources);
  const passNotGuarantee = verificationTrustEvidenceResolved('pass-not-guarantee', shellSources);

  runScenario(
    'trust-section-visible',
    'Verification Trust & Evidence section visible',
    trustSection,
    trustSection ? 'Trust section present in Verification surface.' : 'Trust section missing.',
    scenarios,
  );
  runScenario(
    'black-box-detection',
    'Verification is not a black box',
    trustSection && summaryVisible && evidenceVisible,
    trustSection ? 'Summary and evidence blocks surfaced.' : 'Verification may feel like a black box.',
    scenarios,
  );
  runScenario(
    'missing-evidence-detection',
    'Evidence is visible for major findings',
    evidenceVisible && majorFindings.every((f) => f.evidenceFound.length > 3),
    evidenceVisible ? 'Evidence Found labels present.' : 'Evidence clarity missing.',
    scenarios,
  );
  runScenario(
    'missing-next-step-detection',
    'Next steps visible after run',
    guidanceVisible && verificationTrustEvidenceResolved('next-steps-scenario', shellSources),
    guidanceVisible ? 'Pass/warn/fail guidance present.' : 'Next-step guidance missing.',
    scenarios,
  );
  runScenario(
    'unexplained-confidence-detection',
    'Confidence is explained',
    confidenceExplained && summary.confidenceExplanation.length > 10,
    confidenceExplained ? 'Confidence explanation present.' : 'Confidence unexplained.',
    scenarios,
  );
  runScenario(
    'unexplained-status-detection',
    'Status is explained',
    summaryVisible && statusExplanation.length > 10,
    summaryVisible ? 'Status explanation present.' : 'Status unexplained.',
    scenarios,
  );
  runScenario(
    'scope-limitations-visible',
    'Scope limitations prevent false confidence',
    scopeVisible && passNotGuarantee,
    scopeVisible ? 'Checked and not-checked scope listed.' : 'Scope clarity missing.',
    scenarios,
  );
  runScenario(
    'why-pass-fail-visible',
    'Pass and fail reasons visible',
    verificationTrustEvidenceResolved('why-pass-scenario', shellSources),
    'Why It Passed / Why It Failed blocks present.',
    scenarios,
  );
  runScenario(
    'pass-not-guarantee',
    'PASS is not presented as success guarantee',
    passNotGuarantee,
    passNotGuarantee ? 'Scope-not-checked includes business viability limits.' : 'False confidence risk.',
    scenarios,
  );
  runScenario(
    'result-data-present',
    'Verification run produces explainable findings',
    vr.state !== 'NO_VERIFICATION_RUN' ? majorFindings.length > 0 : majorFindings.length >= 0,
    `${majorFindings.length} major finding(s) prepared.`,
    scenarios,
  );

  const boundedScenarios = scenarios.slice(0, MAX_VERIFICATION_TRUST_SCENARIOS);
  const blackBoxRisk = boundedScenarios.some(
    (s) => s.id === 'black-box-detection' && !s.passed,
  );

  const trustPass = boundedScenarios.filter((s) => s.passed).length / boundedScenarios.length >= 0.85;
  const evidenceClarityPass =
    verificationTrustEvidenceResolved('what-was-checked', shellSources) &&
    verificationTrustEvidenceResolved('evidence-found', shellSources);
  const scopeClarityPass = scopeVisible;
  const nextStepsPass = guidanceVisible;
  const explainabilityPass =
    confidenceExplained &&
    summaryVisible &&
    verificationTrustEvidenceResolved('why-pass-scenario', shellSources);

  const trustScore = clamp(
    (boundedScenarios.filter((s) => s.passed).length / Math.max(boundedScenarios.length, 1)) * 100,
  );

  const strengths: string[] = [];
  if (trustSection) strengths.push('Verification Trust & Evidence section visible');
  if (evidenceClarityPass) strengths.push('Evidence blocks explain what was checked');
  if (scopeClarityPass) strengths.push('Scope limits prevent false launch confidence');
  if (nextStepsPass) strengths.push('Pass/warn/fail next steps are explicit');
  if (explainabilityPass) strengths.push('Status and confidence include plain-language explanations');

  const weaknesses = boundedScenarios
    .filter((s) => !s.passed)
    .map((s) => s.name)
    .slice(0, MAX_VERIFICATION_TRUST_FINDINGS);

  return {
    trustScore,
    summary,
    majorFindings,
    scopeChecked: SCOPE_CHECKED,
    scopeNotChecked: SCOPE_NOT_CHECKED,
    founderGuidance,
    scenarios: boundedScenarios,
    strengths,
    weaknesses,
    trustPass,
    evidenceClarityPass,
    scopeClarityPass,
    nextStepsPass,
    explainabilityPass,
    blackBoxRisk,
  };
}

export function evaluateVerificationTrustEvidenceVisibility(
  assessment: VerificationTrustEvidenceAssessment,
  sources: VerificationTrustShellSources,
): VerificationTrustEvidenceVisibility {
  const uiPresent = verificationTrustEvidenceResolved('trust-section-visible', sources);
  const checks = [
    uiPresent,
    assessment.trustPass,
    assessment.evidenceClarityPass,
    assessment.scopeClarityPass,
    assessment.nextStepsPass,
    assessment.explainabilityPass,
    !assessment.blackBoxRisk,
  ];

  return {
    score: clamp((checks.filter(Boolean).length / checks.length) * 100),
    trustScore: assessment.trustScore,
    trustPass: assessment.trustPass,
    evidenceClarityPass: assessment.evidenceClarityPass,
    scopeClarityPass: assessment.scopeClarityPass,
    nextStepsPass: assessment.nextStepsPass,
    explainabilityPass: assessment.explainabilityPass,
    blackBoxDetected: assessment.blackBoxRisk,
    scenarioPassCount: assessment.scenarios.filter((s) => s.passed).length,
    findingCount: assessment.weaknesses.length,
  };
}
