/**
 * Launch Verdict Governance Validator — bounded integrity checks.
 */

import type { LaunchVerdictGovernanceAssessment } from './launch-verdict-governance-types.js';
import { LAUNCH_VERDICT_GOVERNANCE_REPORT_TITLE } from './launch-verdict-governance-bounds.js';

const VALID_VERDICTS = [
  'NOT_READY',
  'READY_FOR_INTERNAL_USE',
  'READY_FOR_PRIVATE_BETA',
  'READY_FOR_PUBLIC_BETA',
  'READY_FOR_PUBLIC_LAUNCH',
  'BLOCKED',
  'UNKNOWN',
] as const;

export function validateVerdictDerivation(assessment: LaunchVerdictGovernanceAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: VALID_VERDICTS.includes(assessment.finalLaunchVerdict),
    detail: assessment.finalLaunchVerdict,
  };
}

export function validateEscalationRules(assessment: LaunchVerdictGovernanceAssessment): {
  passed: boolean;
  detail: string;
} {
  const verdictRank: Record<string, number> = {
    UNKNOWN: 0,
    NOT_READY: 1,
    BLOCKED: 1,
    READY_FOR_INTERNAL_USE: 2,
    READY_FOR_PRIVATE_BETA: 3,
    READY_FOR_PUBLIC_BETA: 4,
    READY_FOR_PUBLIC_LAUNCH: 5,
  };
  const finalRank = verdictRank[assessment.finalLaunchVerdict] ?? 0;
  const eligibilityRank = verdictRank[assessment.verdictEligibility] ?? 0;
  return {
    passed: finalRank <= eligibilityRank || assessment.finalLaunchVerdict === 'BLOCKED',
    detail: `${assessment.finalLaunchVerdict}<=${assessment.verdictEligibility}`,
  };
}

export function validateBlockerEnforcement(assessment: LaunchVerdictGovernanceAssessment): {
  passed: boolean;
  detail: string;
} {
  if (assessment.blockingAuthorities.length > 0) {
    return {
      passed: assessment.finalLaunchVerdict === 'BLOCKED',
      detail: `${assessment.finalLaunchVerdict}; blockers=${assessment.blockingAuthorities.length}`,
    };
  }
  if (assessment.finalLaunchVerdict === 'READY_FOR_PUBLIC_LAUNCH') {
    return {
      passed: assessment.blockingAuthorities.length === 0 && assessment.blockingRuleCount === 0,
      detail: 'public launch clear',
    };
  }
  return { passed: true, detail: 'no blockers' };
}

export function validateMissingEvidenceDetection(assessment: LaunchVerdictGovernanceAssessment): {
  passed: boolean;
  detail: string;
} {
  if (assessment.finalLaunchVerdict === 'READY_FOR_PUBLIC_LAUNCH') {
    return {
      passed: assessment.requiredEvidenceMissing.length === 0,
      detail: String(assessment.requiredEvidenceMissing.length),
    };
  }
  return {
    passed: Array.isArray(assessment.requiredEvidenceMissing),
    detail: String(assessment.requiredEvidenceMissing.length),
  };
}

export function validateGovernanceConfidenceRange(assessment: LaunchVerdictGovernanceAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.governanceConfidence >= 0 && assessment.governanceConfidence <= 100,
    detail: String(assessment.governanceConfidence),
  };
}

export function validateGovernanceScoreRange(assessment: LaunchVerdictGovernanceAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.governanceScore >= 0 && assessment.governanceScore <= 100,
    detail: String(assessment.governanceScore),
  };
}

export function validateGovernanceDeterministicScoring(
  first: LaunchVerdictGovernanceAssessment,
  second: LaunchVerdictGovernanceAssessment,
): { passed: boolean; detail: string } {
  return {
    passed:
      first.finalLaunchVerdict === second.finalLaunchVerdict &&
      first.governanceScore === second.governanceScore &&
      first.governanceConfidence === second.governanceConfidence &&
      first.cacheKey === second.cacheKey,
    detail: `${first.finalLaunchVerdict}/${second.finalLaunchVerdict}`,
  };
}

export function validateGovernanceAdvisoryOnly(assessment: LaunchVerdictGovernanceAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.readOnly === true && assessment.advisoryOnly === true,
    detail: String(assessment.advisoryOnly),
  };
}

export function validateGovernanceReportGeneration(markdown: string): { passed: boolean; detail: string } {
  return {
    passed:
      markdown.includes(`# ${LAUNCH_VERDICT_GOVERNANCE_REPORT_TITLE}`) &&
      markdown.includes('# Final Launch Verdict') &&
      markdown.includes('# Missing Evidence') &&
      markdown.includes('# Governance Verdict Reasoning'),
    detail: 'markdown sections',
  };
}

export function validateRuleEvaluationCounts(assessment: LaunchVerdictGovernanceAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed:
      assessment.satisfiedRuleCount + assessment.failedRuleCount === assessment.ruleEvaluations.length &&
      assessment.satisfiedRules.length === assessment.satisfiedRuleCount &&
      assessment.failedRules.length === assessment.failedRuleCount,
    detail: `satisfied=${assessment.satisfiedRuleCount}; failed=${assessment.failedRuleCount}`,
  };
}

export function validateOnlyGovernanceDeclaresPublicLaunch(
  assessment: LaunchVerdictGovernanceAssessment,
): { passed: boolean; detail: string } {
  return {
    passed:
      assessment.finalLaunchVerdict !== 'READY_FOR_PUBLIC_LAUNCH' ||
      (assessment.blockingAuthorities.length === 0 && assessment.requiredEvidenceMissing.length === 0),
    detail: assessment.finalLaunchVerdict,
  };
}
