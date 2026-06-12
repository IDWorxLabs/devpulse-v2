/**
 * Adaptive AutoFix Intelligence — bounded validation helpers.
 */

import { REPEATED_FAILURE_THRESHOLD } from './adaptive-autofix-bounds.js';
import { ADAPTIVE_AUTOFIX_REPORT_TITLE } from './adaptive-autofix-bounds.js';
import { getCapabilityMappingCount } from './adaptive-autofix-capability-detector.js';
import type { AdaptiveAutoFixAssessment } from './adaptive-autofix-types.js';

export function validateRepeatedFailureDetection(assessment: AdaptiveAutoFixAssessment): {
  passed: boolean;
  detail: string;
} {
  if (!assessment.triggeredAdaptiveAutofix) {
    return { passed: true, detail: 'no trigger' };
  }
  return {
    passed: assessment.failureRecords.every((record) => record.repeatedFailureCount >= REPEATED_FAILURE_THRESHOLD),
    detail: String(assessment.failureRecords.length),
  };
}

export function validateAdaptiveThresholdTrigger(assessment: AdaptiveAutoFixAssessment): {
  passed: boolean;
  detail: string;
} {
  if (!assessment.triggeredAdaptiveAutofix) {
    return { passed: true, detail: 'not triggered' };
  }
  return {
    passed: assessment.repeatedFailureCount >= REPEATED_FAILURE_THRESHOLD,
    detail: String(assessment.repeatedFailureCount),
  };
}

export function validateCapabilityGapDetection(assessment: AdaptiveAutoFixAssessment): {
  passed: boolean;
  detail: string;
} {
  if (!assessment.triggeredAdaptiveAutofix) {
    return { passed: true, detail: 'not triggered' };
  }
  return {
    passed: assessment.capabilityGapCount === assessment.capabilityGaps.length && assessment.capabilityGapCount > 0,
    detail: String(assessment.capabilityGapCount),
  };
}

export function validateEvolutionPlanning(assessment: AdaptiveAutoFixAssessment): {
  passed: boolean;
  detail: string;
} {
  if (!assessment.triggeredAdaptiveAutofix) {
    return { passed: true, detail: 'not triggered' };
  }
  return {
    passed:
      assessment.recommendations.length > 0 &&
      assessment.recommendations.every(
        (item) =>
          item.missingCapability.length > 0 &&
          item.recommendedAuthority.length > 0 &&
          item.recommendedValidator.length > 0,
      ),
    detail: String(assessment.recommendations.length),
  };
}

export function validateRecommendationGeneration(assessment: AdaptiveAutoFixAssessment): {
  passed: boolean;
  detail: string;
} {
  return validateEvolutionPlanning(assessment);
}

export function validateAdaptiveDeterministicScoring(
  first: AdaptiveAutoFixAssessment,
  second: AdaptiveAutoFixAssessment,
): { passed: boolean; detail: string } {
  return {
    passed:
      first.adaptiveAutoFixScore === second.adaptiveAutoFixScore &&
      first.triggeredAdaptiveAutofix === second.triggeredAdaptiveAutofix &&
      first.autofixReadiness === second.autofixReadiness &&
      first.cacheKey === second.cacheKey,
    detail: first.cacheKey,
  };
}

export function validateAdaptiveAdvisoryOnly(assessment: AdaptiveAutoFixAssessment): {
  passed: boolean;
  detail: string;
} {
  return {
    passed: assessment.readOnly === true && assessment.advisoryOnly === true,
    detail: String(assessment.advisoryOnly),
  };
}

export function validateAdaptiveReportGeneration(markdown: string): { passed: boolean; detail: string } {
  return {
    passed:
      markdown.includes(`# ${ADAPTIVE_AUTOFIX_REPORT_TITLE}`) &&
      markdown.includes('# Repeated Failure Analysis') &&
      markdown.includes('# Evolution Recommendations') &&
      markdown.includes('# Adaptive Readiness'),
    detail: 'markdown sections',
  };
}

export function validateCapabilityMappingCount(): { passed: boolean; detail: string } {
  return { passed: getCapabilityMappingCount() >= 10, detail: String(getCapabilityMappingCount()) };
}

export function validateAdaptiveLaunchBlocking(assessment: AdaptiveAutoFixAssessment): {
  passed: boolean;
  detail: string;
} {
  if (assessment.autofixReadiness !== 'BLOCKED') {
    return { passed: true, detail: assessment.autofixReadiness };
  }
  return {
    passed: assessment.blocksLaunchReadiness === true,
    detail: String(assessment.blocksLaunchReadiness),
  };
}
