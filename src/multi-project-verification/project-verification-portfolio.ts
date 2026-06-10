/**
 * Multi Project Verification — portfolio health model.
 */

import type { PortfolioVerificationSummary, ProjectVerificationRecord } from './multi-project-verification-types.js';
import { getCachedPortfolio, setCachedPortfolio } from './project-verification-cache.js';

export function buildPortfolioVerificationSummary(
  records: ProjectVerificationRecord[],
): PortfolioVerificationSummary {
  const cacheKey = records.map((r) => `${r.projectId}:${r.status}:${r.confidence}`).join('|');
  const cached = getCachedPortfolio(cacheKey);
  if (cached) return cached;

  const totalProjects = records.length;
  const verifiedProjects = records.filter((r) => r.status === 'VERIFIED').length;
  const verificationPendingProjects = records.filter((r) => r.status === 'NEEDS_VERIFICATION').length;
  const highRiskProjects = records.filter((r) => r.status === 'HIGH_RISK').length;
  const blockedProjects = records.filter((r) => r.status === 'BLOCKED').length;

  const portfolioConfidence = totalProjects === 0
    ? 0
    : Math.round(records.reduce((sum, r) => sum + r.confidence, 0) / totalProjects);

  const portfolioRisk = totalProjects === 0
    ? 0
    : Math.round(records.reduce((sum, r) => sum + r.riskScore, 0) / totalProjects);

  const summary: PortfolioVerificationSummary = {
    totalProjects,
    verifiedProjects,
    verificationPendingProjects,
    highRiskProjects,
    blockedProjects,
    portfolioConfidence,
    portfolioRisk,
  };

  setCachedPortfolio(cacheKey, summary);
  return summary;
}
