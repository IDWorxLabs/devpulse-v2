/**
 * AFLA Trust Calibration Operator API — read-only trust calibration visibility.
 */

import {
  assessAflaTrustCalibration,
  getLastAflaTrustCalibrationAssessment,
  listAflaTrustCalibrationHistory,
  AFLA_TRUST_CALIBRATION_V1_PASS_TOKEN,
  FOUNDER_TRUST_CALIBRATION_SUITE_APPS,
} from '../src/afla-trust-calibration-v1/index.js';
import type { AflaTrustCalibrationAssessment } from '../src/afla-trust-calibration-v1/afla-trust-calibration-types.js';

export { AFLA_TRUST_CALIBRATION_V1_PASS_TOKEN };

export interface TrustCalibrationPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_afla_trust_calibration';
  canonicalOwner: 'Autonomous Founder Launch Authority';
  profile: string;
  productName: string;
  aflaTrustScore: number;
  falsePositiveCount: number;
  falseNegativeCount: number;
  confidenceAccuracy: {
    founderConfidence: number;
    evidenceQualityScore: number;
    aligned: boolean;
    inflated: boolean;
    tooConservative: boolean;
    confidenceGap: number;
  };
  reviewerAlignment: {
    scores: Readonly<Record<string, number>>;
    divergence: number;
    extremeDisagreement: boolean;
    divergenceExplanation: string | null;
  };
  verdictStability: {
    verdictStable: boolean;
    scoreStable: boolean;
    scoreVariance: number;
    confidenceVariance: number;
    stabilityFlags: readonly string[];
  };
  launchDecisionExplainability: {
    decisionSummary: string;
    topPositiveSignals: readonly string[];
    topRisks: readonly string[];
    reasonForVerdict: string;
  };
  falsePositives: readonly string[];
  falseNegatives: readonly string[];
  history: readonly {
    runId: string;
    profile: string;
    productName: string;
    aflaTrustScore: number;
    verdictQuality: string;
    falsePositiveCount: number;
    falseNegativeCount: number;
    timestamp: string;
  }[];
  assessment: AflaTrustCalibrationAssessment | null;
}

export function buildTrustCalibrationPayload(input?: {
  profile?: string | null;
  prompt?: string | null;
}): TrustCalibrationPayload {
  const calibration = assessAflaTrustCalibration({
    profile: input?.profile ?? undefined,
    productPrompt: input?.prompt ?? undefined,
  });

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_afla_trust_calibration',
    canonicalOwner: 'Autonomous Founder Launch Authority',
    profile: calibration.profile,
    productName: calibration.productName,
    aflaTrustScore: calibration.aflaTrustScore,
    falsePositiveCount: calibration.falsePositiveCount,
    falseNegativeCount: calibration.falseNegativeCount,
    confidenceAccuracy: {
      founderConfidence: calibration.confidenceCalibration.founderConfidence,
      evidenceQualityScore: calibration.confidenceCalibration.evidenceQualityScore,
      aligned: calibration.confidenceCalibration.aligned,
      inflated: calibration.confidenceCalibration.inflated,
      tooConservative: calibration.confidenceCalibration.tooConservative,
      confidenceGap: calibration.confidenceCalibration.confidenceGap,
    },
    reviewerAlignment: {
      scores: calibration.reviewerAlignment.scores,
      divergence: calibration.reviewerAlignment.divergence,
      extremeDisagreement: calibration.reviewerAlignment.extremeDisagreement,
      divergenceExplanation: calibration.reviewerAlignment.divergenceExplanation,
    },
    verdictStability: {
      verdictStable: calibration.verdictStability.verdictStable,
      scoreStable: calibration.verdictStability.scoreStable,
      scoreVariance: calibration.verdictStability.scoreVariance,
      confidenceVariance: calibration.verdictStability.confidenceVariance,
      stabilityFlags: calibration.verdictStability.stabilityFlags,
    },
    launchDecisionExplainability: calibration.launchDecisionExplainability,
    falsePositives: calibration.falsePositives.map((f) => f.summary),
    falseNegatives: calibration.falseNegatives.map((f) => f.summary),
    history: listAflaTrustCalibrationHistory(),
    assessment: getLastAflaTrustCalibrationAssessment(),
  };
}

export function sendTrustCalibrationJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  profile: string | null,
  prompt: string | null,
): void {
  const payload = buildTrustCalibrationPayload({ profile, prompt });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'afla-trust-calibration',
    'X-DevPulse-Canonical-Owner': 'Autonomous Founder Launch Authority',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

export function listTrustCalibrationProfiles(): readonly string[] {
  return FOUNDER_TRUST_CALIBRATION_SUITE_APPS.map((app) => app.profile);
}
