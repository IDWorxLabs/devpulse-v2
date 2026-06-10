/**
 * Auto-Polish Loop — unified authority builder.
 */

import type {
  AutoPolishAuthority,
  AutoPolishInput,
  AutoPolishResult,
  DiscoverabilityPolishAnalysis,
  FounderUsabilityPolishAnalysis,
  IntelligenceVisibilityPolishAnalysis,
  PolishOpportunity,
  PreviewPolishAnalysis,
  ProductCoherencePolishAnalysis,
  ResponsivePolishAnalysis,
  TrustPolishAnalysis,
  UXPolishAnalysis,
  VisualPolishAnalysis,
  WorkflowPolishAnalysis,
} from './auto-polish-types.js';
import { MAX_POLISH_OPPORTUNITIES, resolveAutoPolishResult } from './auto-polish-types.js';
import { countCriticalOpportunities, mergeBoundedOpportunities } from './polish-opportunity-model.js';
import { getCachedAutoPolishAuthority, setCachedAutoPolishAuthority } from './auto-polish-cache.js';

const ANALYZER_WEIGHT = 0.1;

let authorityBuildCount = 0;
let authorityCounter = 0;

export function buildAutoPolishAuthority(
  requestId: string,
  visual: VisualPolishAnalysis,
  ux: UXPolishAnalysis,
  responsive: ResponsivePolishAnalysis,
  preview: PreviewPolishAnalysis,
  discoverability: DiscoverabilityPolishAnalysis,
  founder: FounderUsabilityPolishAnalysis,
  trust: TrustPolishAnalysis,
  intelligence: IntelligenceVisibilityPolishAnalysis,
  workflow: WorkflowPolishAnalysis,
  coherence: ProductCoherencePolishAnalysis,
  input: AutoPolishInput,
): AutoPolishAuthority {
  const cacheKey = [
    requestId,
    visual.polishScore, ux.polishScore, responsive.polishScore, preview.polishScore,
    discoverability.polishScore, founder.polishScore, trust.polishScore,
    intelligence.polishScore, workflow.polishScore, coherence.polishScore,
  ].join('|');

  const cached = getCachedAutoPolishAuthority(cacheKey);
  if (cached) return cached;

  authorityBuildCount += 1;
  authorityCounter += 1;

  const allOpportunities: PolishOpportunity[] = mergeBoundedOpportunities(
    [
      visual.opportunities,
      ux.opportunities,
      responsive.opportunities,
      preview.opportunities,
      discoverability.opportunities,
      founder.opportunities,
      trust.opportunities,
      intelligence.opportunities,
      workflow.opportunities,
      coherence.opportunities,
    ],
    MAX_POLISH_OPPORTUNITIES,
  );

  const overallScore = Math.round(
    visual.polishScore * ANALYZER_WEIGHT
      + ux.polishScore * ANALYZER_WEIGHT
      + responsive.polishScore * ANALYZER_WEIGHT
      + preview.polishScore * ANALYZER_WEIGHT
      + discoverability.polishScore * ANALYZER_WEIGHT
      + founder.polishScore * ANALYZER_WEIGHT
      + trust.polishScore * ANALYZER_WEIGHT
      + intelligence.polishScore * ANALYZER_WEIGHT
      + workflow.polishScore * ANALYZER_WEIGHT
      + coherence.polishScore * ANALYZER_WEIGHT,
  );

  const criticalOpportunities = countCriticalOpportunities(allOpportunities);
  const warningCount = allOpportunities.filter((o) => o.impactLevel === 'HIGH' || o.impactLevel === 'MEDIUM').length;

  const autoPolishResult: AutoPolishResult = resolveAutoPolishResult(
    overallScore,
    criticalOpportunities,
    warningCount,
    input.governanceBlocked,
  );

  const confidence = Math.min(100, Math.round(
    (overallScore + intelligence.polishScore + trust.polishScore) / 3,
  ));

  const authority: AutoPolishAuthority = {
    authorityId: `auto-polish-authority-${authorityCounter}`,
    overallScore,
    visualPolishScore: visual.polishScore,
    uxPolishScore: ux.polishScore,
    responsivePolishScore: responsive.polishScore,
    previewPolishScore: preview.polishScore,
    discoverabilityScore: discoverability.polishScore,
    founderUsabilityScore: founder.polishScore,
    trustScore: trust.polishScore,
    intelligenceVisibilityScore: intelligence.polishScore,
    workflowScore: workflow.polishScore,
    productCoherenceScore: coherence.polishScore,
    totalOpportunities: allOpportunities.length,
    criticalOpportunities,
    allOpportunities,
    autoPolishResult,
    confidence,
    createdAt: Date.now(),
  };

  setCachedAutoPolishAuthority(cacheKey, authority);
  return authority;
}

export function getAuthorityBuildCount(): number {
  return authorityBuildCount;
}

export function resetAutoPolishAuthorityBuilderForTests(): void {
  authorityBuildCount = 0;
  authorityCounter = 0;
}
