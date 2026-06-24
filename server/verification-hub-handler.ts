/**
 * Verification Hub Operator API — read-only UVL maturity visibility.
 */

import {
  assessUvlMaturity,
  getLastUvlMaturityAssessment,
  listUvlMaturityHistory,
  UVL_MATURITY_VERIFICATION_HUB_V1_PASS_TOKEN,
  UVL_VERIFICATION_SUITE_APPS,
} from '../src/unified-verification-lab/index.js';
import { assessProductArchitecture } from '../src/product-architect-intelligence-v1/index.js';
import { buildUvlCrossCategoryValidationSummary } from '../src/large-scale-multi-app-validation-v1/large-scale-uvl-integration.js';
import { buildUvlProductArchitectureSummary } from '../src/product-architect-intelligence-v1/product-architect-uvl-integration.js';
import type { UvlMaturityAssessment } from '../src/unified-verification-lab/uvl-maturity-types.js';

export { UVL_MATURITY_VERIFICATION_HUB_V1_PASS_TOKEN };

export interface VerificationHubPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_unified_verification_lab_maturity';
  canonicalOwner: 'Unified Verification Lab';
  profile: string;
  productName: string;
  overallCoveragePercent: number;
  verificationConfidenceScore: number;
  verificationSufficientForLaunch: boolean;
  categoryCoverage: readonly {
    category: string;
    coveragePercent: number;
    confidencePercent: number;
    status: string;
    missingAreas: readonly string[];
  }[];
  timeline: readonly {
    label: string;
    status: string;
    ran: boolean;
    passed: boolean;
    pending: boolean;
    detail: string;
  }[];
  verificationGaps: readonly string[];
  criticalGaps: readonly string[];
  missingVerificationAreas: readonly string[];
  history: readonly {
    runId: string;
    profile: string;
    productName: string;
    overallCoveragePercent: number;
    verificationConfidenceScore: number;
    result: string;
    timestamp: string;
  }[];
  assessment: UvlMaturityAssessment | null;
  crossCategoryValidation: {
    categoriesTested: number;
    mostReliableCategories: readonly string[];
    weakestCategories: readonly string[];
    untestedCategories: readonly string[];
    averageVerificationCoverage: number;
    averageVerificationConfidence: number;
  };
  productArchitectureCoverage: {
    productReadinessScore: number;
    architectureScore: number;
    workflowCompletenessScore: number;
    userJourneyScore: number;
    screenCoverageScore: number;
    readinessLabel: string;
    criticalProductGapCount: number;
    criticalProductGaps: readonly string[];
    productArchitectureCoverage: number;
  };
}

export function buildVerificationHubPayload(input?: {
  profile?: string | null;
  prompt?: string | null;
  projectRootDir?: string | null;
  workspaceDir?: string | null;
}): VerificationHubPayload {
  const assessment = assessUvlMaturity({
    profile: input?.profile ?? undefined,
    productPrompt: input?.prompt ?? undefined,
    projectRootDir: input?.projectRootDir ?? null,
    workspaceDir: input?.workspaceDir ?? null,
  });
  const productArchitectureAssessment = assessProductArchitecture({
    profile: input?.profile ?? undefined,
    productPrompt: input?.prompt ?? undefined,
  });

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_unified_verification_lab_maturity',
    canonicalOwner: 'Unified Verification Lab',
    profile: assessment.profile,
    productName: assessment.productName,
    overallCoveragePercent: assessment.overallCoveragePercent,
    verificationConfidenceScore: assessment.verificationConfidenceScore,
    verificationSufficientForLaunch: assessment.verificationSufficientForLaunch,
    categoryCoverage: assessment.categoryCoverage.map((row) => ({
      category: row.category,
      coveragePercent: row.coveragePercent,
      confidencePercent: row.confidencePercent,
      status: row.status,
      missingAreas: row.missingAreas,
    })),
    timeline: assessment.timeline.map((step) => ({
      label: step.label,
      status: step.status,
      ran: step.ran,
      passed: step.passed,
      pending: step.pending,
      detail: step.detail,
    })),
    verificationGaps: assessment.verificationGapReport.gapSummary,
    criticalGaps: assessment.verificationGapReport.gaps
      .filter((gap) => gap.critical || gap.severity === 'CRITICAL')
      .map((gap) => gap.summary),
    missingVerificationAreas: assessment.missingVerificationAreas,
    history: listUvlMaturityHistory(),
    assessment: getLastUvlMaturityAssessment(),
    crossCategoryValidation: buildUvlCrossCategoryValidationSummary(),
    productArchitectureCoverage: buildUvlProductArchitectureSummary(productArchitectureAssessment),
  };
}

export function sendVerificationHubJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  profile: string | null,
  prompt: string | null,
  rootDir: string,
): void {
  const payload = buildVerificationHubPayload({
    profile,
    prompt,
    projectRootDir: rootDir,
  });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'verification-hub',
    'X-DevPulse-Canonical-Owner': 'Unified Verification Lab',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

export function listVerificationHubProfiles(): readonly string[] {
  return UVL_VERIFICATION_SUITE_APPS.map((app) => app.profile);
}
