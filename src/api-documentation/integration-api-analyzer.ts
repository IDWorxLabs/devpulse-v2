/**
 * API Documentation — integration API analyzer.
 */

import type { ApiDocumentationInput, IntegrationApiAnalysis } from './api-documentation-types.js';
import { getCachedIntegrationApiAnalysis, setCachedIntegrationApiAnalysis } from './api-documentation-cache.js';

export interface IntegrationApiSnapshot {
  registryIntegrationCount: number;
  uvlIntegrationCount: number;
  hasWorld2Integration: boolean;
  hasMobileIntegration: boolean;
  hasCloudIntegration: boolean;
  hasNotificationIntegration: boolean;
}

const BASE_INTEGRATIONS = [
  'registry_integrations',
  'uvl_integrations',
  'governance_integrations',
  'world2_integrations',
  'mobile_integrations',
  'cloud_integrations',
  'notification_integrations',
] as const;

let integrationAnalysisCount = 0;

export function analyzeIntegrationApis(
  input: ApiDocumentationInput,
  snapshot: IntegrationApiSnapshot,
): IntegrationApiAnalysis {
  const cacheKey = [
    snapshot.registryIntegrationCount,
    snapshot.uvlIntegrationCount,
    input.missingRegistryIntegrationGuidance,
    input.missingWorld2IntegrationGuidance,
    ...(input.undocumentedIntegrations ?? []),
  ].join('|');

  const cached = getCachedIntegrationApiAnalysis(cacheKey);
  if (cached) return cached;

  integrationAnalysisCount += 1;
  const integrationWarnings: string[] = [];
  const undocumentedIntegrations: string[] = [];
  let penalty = 0;

  const checks: Array<[boolean | undefined, string, string]> = [
    [input.missingRegistryIntegrationGuidance, 'missing_registry_integration_guidance', 'registry_integrations'],
    [input.missingUvlIntegrationGuidance, 'missing_uvl_integration_guidance', 'uvl_integrations'],
    [input.missingGovernanceIntegrationGuidance, 'missing_governance_integration_guidance', 'governance_integrations'],
    [input.missingWorld2IntegrationGuidance, 'missing_world2_integration_guidance', 'world2_integrations'],
    [input.missingMobileIntegrationGuidance, 'missing_mobile_integration_guidance', 'mobile_integrations'],
    [input.missingCloudIntegrationGuidance, 'missing_cloud_integration_guidance', 'cloud_integrations'],
    [input.missingNotificationIntegrationGuidance, 'missing_notification_integration_guidance', 'notification_integrations'],
  ];

  for (const [flag, warning, area] of checks) {
    if (flag === true) {
      integrationWarnings.push(warning);
      undocumentedIntegrations.push(area);
      penalty += 8;
    }
  }

  for (const integration of input.undocumentedIntegrations ?? []) {
    if (!undocumentedIntegrations.includes(integration)) {
      undocumentedIntegrations.push(integration);
      penalty += 5;
    }
  }

  if (!snapshot.hasWorld2Integration) undocumentedIntegrations.push('world2_integrations');
  if (!snapshot.hasMobileIntegration) undocumentedIntegrations.push('mobile_integrations');
  if (!snapshot.hasCloudIntegration) undocumentedIntegrations.push('cloud_integrations');
  if (!snapshot.hasNotificationIntegration) undocumentedIntegrations.push('notification_integrations');

  const uniqueUndocumented = [...new Set(undocumentedIntegrations)];
  const systemBonus =
    (snapshot.registryIntegrationCount > 0 ? 8 : 0)
    + (snapshot.uvlIntegrationCount > 0 ? 8 : 0);
  const documented = BASE_INTEGRATIONS.length - uniqueUndocumented.filter(
    (i) => BASE_INTEGRATIONS.includes(i as typeof BASE_INTEGRATIONS[number]),
  ).length;
  const baseScore = Math.round((documented / BASE_INTEGRATIONS.length) * 78 + systemBonus);
  const integrationCoverageScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

  const result: IntegrationApiAnalysis = {
    integrationCoverageScore,
    undocumentedIntegrations: uniqueUndocumented,
    integrationWarnings,
  };
  setCachedIntegrationApiAnalysis(cacheKey, result);
  return result;
}

export function getIntegrationAnalysisCount(): number {
  return integrationAnalysisCount;
}

export function resetIntegrationApiAnalyzerForTests(): void {
  integrationAnalysisCount = 0;
}

export function listBaseIntegrationApis(): readonly string[] {
  return BASE_INTEGRATIONS;
}
