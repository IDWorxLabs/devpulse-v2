/**
 * AIDEVENGINE_BUILD_PROOF_V1_3 — founder authority prerequisite mapping.
 */

import { getLastBlueprintVisualAssessment } from '../universal-app-blueprint-visual/universal-app-blueprint-visual-authority.js';
import { getLastUniversalFeatureContractAssessment } from '../universal-feature-contract-intelligence/universal-feature-contract-authority.js';
import { getLastProductArchitectureAssessment } from '../product-architect-intelligence-v1/product-architect-intelligence-history.js';
import type { UvlMaturityAssessment } from '../unified-verification-lab/uvl-maturity-types.js';
import type { AuthorityPrerequisiteEntry, AuthorityPrerequisiteMap } from './visual-runtime-evidence-types.js';
import type { VisualRuntimeEvidence } from './visual-runtime-evidence-types.js';

export function buildAuthorityPrerequisiteMap(input: {
  visualRuntime: VisualRuntimeEvidence;
  uvlAfterHandoff: UvlMaturityAssessment;
  blueprintVisualScore: number;
  blueprintVisualPassed: boolean;
  blueprintVisualVerdict: string | null;
  universalFeaturePassed: boolean;
  universalFeatureScore: number | null;
  universalFeatureVerdict: string | null;
}): AuthorityPrerequisiteMap {
  const productArchitecture = getLastProductArchitectureAssessment();
  const blueprintVisual = getLastBlueprintVisualAssessment();

  const entries: AuthorityPrerequisiteEntry[] = [
    mapVerificationHub(input.uvlAfterHandoff, input.visualRuntime),
    mapProductArchitecture(productArchitecture),
    mapBlueprintVisual(
      blueprintVisual,
      input.visualRuntime,
      input.blueprintVisualScore,
      input.blueprintVisualPassed,
      input.blueprintVisualVerdict,
    ),
    mapUniversalFeatureContract(
      input.universalFeaturePassed,
      input.universalFeatureScore,
      input.universalFeatureVerdict,
      input.visualRuntime,
    ),
  ];

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    entries,
  };
}

function mapVerificationHub(
  uvl: UvlMaturityAssessment,
  visualRuntime: VisualRuntimeEvidence,
): AuthorityPrerequisiteEntry {
  const consumed = Boolean(uvl);
  const missingFields: string[] = [];
  if (!uvl) {
    missingFields.push('uvlMaturityAssessment');
  } else {
    if (!uvl.verificationSufficientForLaunch) {
      missingFields.push('verificationSufficientForLaunch');
    }
    if (uvl.verificationGapReport.criticalGapCount > 0) {
      missingFields.push(`${uvl.verificationGapReport.criticalGapCount} critical gap(s)`);
    }
    if (uvl.incompleteVerification) {
      missingFields.push('complete verification coverage');
    }
  }
  if (!visualRuntime.playwrightSupported) {
    missingFields.push('bounded Playwright runtime evidence');
  }

  return {
    readOnly: true,
    authority: 'Verification Hub',
    evidenceSource: visualRuntime.playwrightSupported
      ? 'UVL hub + bounded visual-runtime-evidence.json'
      : 'UVL hub + static artifact inspection (Playwright unsupported)',
    consumed,
    score: uvl?.verificationConfidenceScore ?? null,
    verdict: uvl?.verificationSufficientForLaunch ? 'SUFFICIENT' : 'INSUFFICIENT',
    missingFields,
    detail: uvl
      ? `coverage=${uvl.overallCoveragePercent}% confidence=${uvl.verificationConfidenceScore} criticalGaps=${uvl.verificationGapReport.criticalGapCount}`
      : 'UVL assessment not recorded',
  };
}

function mapProductArchitecture(
  assessment: ReturnType<typeof getLastProductArchitectureAssessment>,
): AuthorityPrerequisiteEntry {
  const consumed = Boolean(assessment);
  const missingFields: string[] = [];
  if (!assessment) {
    missingFields.push('productArchitectureAssessment');
  } else if (assessment.gapReport.criticalGapCount > 0) {
    missingFields.push(`${assessment.gapReport.criticalGapCount} critical product gap(s)`);
  }

  return {
    readOnly: true,
    authority: 'Product Architecture',
    evidenceSource: consumed
      ? 'Product Architect Intelligence V1 assessment'
      : 'none — assessment not run in build-proof handoff',
    consumed,
    score: assessment?.scores.productReadinessScore ?? null,
    verdict: assessment?.scores.readinessLabel ?? null,
    missingFields,
    detail: assessment
      ? `productReadiness=${assessment.scores.productReadinessScore} criticalGaps=${assessment.gapReport.criticalGapCount}`
      : 'Product architecture assessment not available',
  };
}

function mapBlueprintVisual(
  assessment: ReturnType<typeof getLastBlueprintVisualAssessment>,
  visualRuntime: VisualRuntimeEvidence,
  score: number,
  passed: boolean,
  verdict: string | null,
): AuthorityPrerequisiteEntry {
  const consumed = Boolean(assessment);
  const missingFields: string[] = [];
  if (!assessment) {
    missingFields.push('blueprintVisualAssessment');
  } else {
    if (!passed) {
      missingFields.push('blueprintVisualPassed');
    }
    if (assessment.blocksLaunchReadiness) {
      missingFields.push(assessment.blocksLaunchReadinessReason ?? 'launch block');
    }
  }
  if (!visualRuntime.staticArtifactInspectionCompleted) {
    missingFields.push('static artifact inspection');
  }
  if (!visualRuntime.playwrightSupported) {
    missingFields.push('Playwright viewport/runtime measurements');
  }

  return {
    readOnly: true,
    authority: 'Blueprint Visual',
    evidenceSource: visualRuntime.playwrightSupported
      ? 'registerSourceDerivedBlueprintVisualAssessment + bounded Playwright checks'
      : 'registerSourceDerivedBlueprintVisualAssessment + static artifact (Playwright unsupported)',
    consumed,
    score,
    verdict,
    missingFields,
    detail: assessment
      ? `passed=${passed} score=${score} viewportEvidence=${visualRuntime.viewportEvidence.length} item(s)`
      : 'Blueprint visual assessment not registered',
  };
}

function mapUniversalFeatureContract(
  passed: boolean,
  score: number | null,
  verdict: string | null,
  visualRuntime: VisualRuntimeEvidence,
): AuthorityPrerequisiteEntry {
  const consumed = passed || visualRuntime.playwrightSupported;
  const missingFields: string[] = [];
  if (!passed) {
    missingFields.push('universalFeatureContractPassed');
  }
  if (!visualRuntime.playwrightSupported) {
    missingFields.push('bounded Playwright feature runtime checks');
  }

  const runtimeUiPassed = visualRuntime.checks
    .filter((c) => c.category === 'runtime-ui' && c.critical)
    .every((c) => c.passed);

  return {
    readOnly: true,
    authority: 'Universal Feature Contract',
    evidenceSource: visualRuntime.playwrightSupported
      ? 'registerSourceDerivedUniversalFeatureContractAssessment + bounded runtime UI checks'
      : 'not consumed — Playwright runtime unsupported',
    consumed: consumed && (passed || runtimeUiPassed),
    score,
    verdict,
    missingFields,
    detail: passed
      ? `passed=${passed} score=${score ?? 'n/a'}`
      : visualRuntime.playwrightSupported
        ? 'Universal feature contract not registered despite runtime evidence'
        : 'Universal feature contract requires Playwright runtime or explicit registration',
  };
}
