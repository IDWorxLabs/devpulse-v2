/**
 * Missing Capability Evolution Engine — Stage 2: evolution safety assessment.
 */

import type {
  EvolutionSafetyAssessment,
  EvolutionSafetyVerdict,
  MissingCapabilityIntakeItem,
} from './missing-capability-evolution-types.js';

let assessmentCounter = 0;

export function resetEvolutionSafetyAssessorForTests(): void {
  assessmentCounter = 0;
}

const HIGH_RISK_PATTERNS: Array<{ pattern: RegExp; reason: string; dimension: string }> = [
  { pattern: /payment|billing|stripe|checkout|financial transaction/i, reason: 'Financial transaction execution', dimension: 'Financial Risk' },
  { pattern: /identity verification|kyc|biometric auth/i, reason: 'Identity verification', dimension: 'Authentication Risk' },
  { pattern: /medical diagnosis|clinical decision|prescription/i, reason: 'Medical diagnosis', dimension: 'Medical Risk' },
  { pattern: /legal advice|contract generation|compliance ruling/i, reason: 'Legal advice automation', dimension: 'Legal Risk' },
  { pattern: /delete.*account|account deletion|purge user/i, reason: 'External account deletion', dimension: 'External System Risk' },
  { pattern: /database migration|schema migration|drop table/i, reason: 'Production database migration', dimension: 'Production Mutation Risk' },
  { pattern: /credential|password|secret|api key|token storage/i, reason: 'Credential handling', dimension: 'Security Risk' },
  { pattern: /surveillance|tracking|location monitor|spy/i, reason: 'Surveillance or tracking capability', dimension: 'Privacy Risk' },
];

function assessDimensions(name: string, riskHints: readonly string[]): Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> {
  const dimensions: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
    'Prompt Faithfulness Risk': 'LOW',
    'Security Risk': 'LOW',
    'Privacy Risk': 'LOW',
    'Data Loss Risk': 'LOW',
    'User Safety Risk': 'LOW',
    'Financial Risk': 'LOW',
    'Medical Risk': 'LOW',
    'Legal Risk': 'LOW',
    'Authentication Risk': 'LOW',
    'External System Risk': 'LOW',
    'Production Mutation Risk': 'LOW',
    'Runtime Stability Risk': 'LOW',
    'Testability Risk': 'LOW',
    'Rollback Risk': 'LOW',
  };

  for (const hint of riskHints) {
    if (hint === 'HIGH') {
      dimensions['Security Risk'] = 'HIGH';
    }
    if (hint === 'MEDIUM') {
      dimensions['Runtime Stability Risk'] = 'MEDIUM';
    }
  }

  for (const entry of HIGH_RISK_PATTERNS) {
    if (entry.pattern.test(name)) {
      dimensions[entry.dimension] = 'HIGH';
    }
  }

  if (/export|csv|format|serialize/i.test(name)) {
    dimensions['Testability Risk'] = 'LOW';
    dimensions['Rollback Risk'] = 'LOW';
  }

  if (/ai assistant|machine learning|llm/i.test(name)) {
    dimensions['Testability Risk'] = 'HIGH';
    dimensions['Prompt Faithfulness Risk'] = 'MEDIUM';
  }

  return dimensions;
}

function deriveVerdict(
  item: MissingCapabilityIntakeItem,
  dimensions: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'>,
): { verdict: EvolutionSafetyVerdict; blockedReason: string | null; humanReviewReason: string | null; limitations: string[] } {
  if (!item.sourceRequirementIds.length && !item.sourcePromptEvidence.length) {
    return {
      verdict: 'INSUFFICIENT_EVIDENCE',
      blockedReason: 'No requirement or prompt evidence — evolution blocked',
      humanReviewReason: null,
      limitations: [],
    };
  }

  for (const entry of HIGH_RISK_PATTERNS) {
    if (entry.pattern.test(item.capabilityName)) {
      return {
        verdict: 'BLOCKED_UNSAFE',
        blockedReason: `High-risk capability blocked: ${entry.reason}`,
        humanReviewReason: `Human review required for ${entry.reason}`,
        limitations: [],
      };
    }
  }

  const highDimensions = Object.entries(dimensions).filter(([, v]) => v === 'HIGH');
  if (highDimensions.length > 0) {
    return {
      verdict: 'NEEDS_HUMAN_REVIEW',
      blockedReason: `High risk dimensions: ${highDimensions.map(([k]) => k).join(', ')}`,
      humanReviewReason: 'High-risk dimensions require human review before evolution',
      limitations: [],
    };
  }

  const mediumDimensions = Object.entries(dimensions).filter(([, v]) => v === 'MEDIUM');
  if (mediumDimensions.length >= 2) {
    return {
      verdict: 'SAFE_WITH_LIMITATIONS',
      blockedReason: null,
      humanReviewReason: null,
      limitations: mediumDimensions.map(([k]) => `${k} requires bounded evolution`),
    };
  }

  return { verdict: 'SAFE_TO_EVOLVE', blockedReason: null, humanReviewReason: null, limitations: [] };
}

export function assessEvolutionSafety(item: MissingCapabilityIntakeItem): EvolutionSafetyAssessment {
  assessmentCounter += 1;
  const dimensions = assessDimensions(item.capabilityName, item.riskHints);
  const { verdict, blockedReason, humanReviewReason, limitations } = deriveVerdict(item, dimensions);

  return {
    readOnly: true,
    assessmentId: `safety-${assessmentCounter}`,
    missingCapabilityId: item.missingCapabilityId,
    verdict,
    dimensions,
    blockedReason,
    humanReviewReason,
    limitations,
  };
}

export function isSafeToEvolve(assessment: EvolutionSafetyAssessment): boolean {
  return assessment.verdict === 'SAFE_TO_EVOLVE' || assessment.verdict === 'SAFE_WITH_LIMITATIONS';
}
