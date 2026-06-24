/**
 * Product Architect Intelligence Operator API — read-only product architecture visibility.
 */

import {
  assessProductArchitecture,
  buildProductArchitectIntelligenceReportMarkdown,
  getLastProductArchitectureAssessment,
  listProductArchitectIntelligenceHistory,
  PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS,
  PRODUCT_ARCHITECT_INTELLIGENCE_V1_PASS_TOKEN,
} from '../src/product-architect-intelligence-v1/index.js';
import type { ProductArchitectureAssessment } from '../src/product-architect-intelligence-v1/product-architect-intelligence-types.js';

export { PRODUCT_ARCHITECT_INTELLIGENCE_V1_PASS_TOKEN };

export interface ProductArchitectIntelligencePayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_product_architect_intelligence';
  canonicalOwner: 'Product Architect Intelligence';
  profile: string;
  productName: string;
  productDomain: string;
  productReadinessScore: number;
  architectureScore: number;
  workflowScore: number;
  userJourneyScore: number;
  screenCoverageScore: number;
  readinessLabel: string;
  criticalProductGaps: readonly string[];
  missingScreens: readonly string[];
  missingWorkflows: readonly string[];
  recommendations: readonly string[];
  cqiRootCause: string | null;
  history: readonly {
    runId: string;
    profile: string;
    productName: string;
    productReadinessScore: number;
    readinessLabel: string;
    criticalGapCount: number;
    timestamp: string;
  }[];
  assessment: ProductArchitectureAssessment | null;
}

export function buildProductArchitectIntelligencePayload(input?: {
  profile?: string | null;
  prompt?: string | null;
}): ProductArchitectIntelligencePayload {
  const assessment = assessProductArchitecture({
    profile: input?.profile ?? undefined,
    productPrompt: input?.prompt ?? undefined,
  });

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_product_architect_intelligence',
    canonicalOwner: 'Product Architect Intelligence',
    profile: assessment.profile,
    productName: assessment.productName,
    productDomain: assessment.productDomain,
    productReadinessScore: assessment.scores.productReadinessScore,
    architectureScore: assessment.scores.architectureScore,
    workflowScore: assessment.scores.workflowCompletenessScore,
    userJourneyScore: assessment.scores.userJourneyScore,
    screenCoverageScore: assessment.scores.screenCoverageScore,
    readinessLabel: assessment.scores.readinessLabel,
    criticalProductGaps: assessment.gapReport.gaps
      .filter((gap) => gap.severity === 'CRITICAL')
      .map((gap) => gap.summary),
    missingScreens: assessment.missingScreens.map((screen) => screen.screen),
    missingWorkflows: assessment.workflowAnalysis
      .filter((workflow) => !workflow.complete)
      .map((workflow) => workflow.workflow),
    recommendations: assessment.recommendations,
    cqiRootCause: assessment.cqiContext?.rootCause ?? null,
    history: listProductArchitectIntelligenceHistory().map((entry) => ({
      runId: entry.runId,
      profile: entry.profile,
      productName: entry.productName,
      productReadinessScore: entry.productReadinessScore,
      readinessLabel: entry.readinessLabel,
      criticalGapCount: entry.criticalGapCount,
      timestamp: entry.timestamp,
    })),
    assessment,
  };
}

export function buildProductArchitectIntelligenceReportArtifact(
  assessment?: ProductArchitectureAssessment | null,
): string {
  const data = assessment ?? getLastProductArchitectureAssessment();
  if (!data) {
    return '# Product Architect Intelligence Report\n\nNo assessment recorded yet.\n';
  }
  return buildProductArchitectIntelligenceReportMarkdown(data);
}

export function listProductArchitectIntelligenceSuiteProfiles(): readonly {
  profile: string;
  label: string;
}[] {
  return PRODUCT_ARCHITECT_INTELLIGENCE_SUITE_APPS.map((app) => ({
    profile: app.profile,
    label: app.productName,
  }));
}

export function sendProductArchitectIntelligenceJson(
  res: { writeHead: (status: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  profile: string | null,
  prompt: string | null,
): void {
  const payload = buildProductArchitectIntelligencePayload({
    profile,
    prompt,
  });

  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'product-architect-intelligence',
  });
  res.end(JSON.stringify(payload));
}
