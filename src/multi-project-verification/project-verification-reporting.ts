/**
 * Multi Project Verification — reporting.
 */

import type {
  MultiProjectVerificationReport,
  PortfolioVerificationSummary,
  ProjectVerificationRecord,
} from './multi-project-verification-types.js';

let reportCounter = 0;

export function generateMultiProjectVerificationReport(
  records: ProjectVerificationRecord[],
  portfolio: PortfolioVerificationSummary,
): MultiProjectVerificationReport {
  reportCounter += 1;

  const recommendations: string[] = [];

  if (portfolio.verificationPendingProjects > 0) {
    recommendations.push(`Address ${portfolio.verificationPendingProjects} project(s) needing verification`);
  }
  if (portfolio.highRiskProjects > 0) {
    recommendations.push(`Review ${portfolio.highRiskProjects} high-risk project(s)`);
  }
  if (portfolio.blockedProjects > 0) {
    recommendations.push(`Resolve ${portfolio.blockedProjects} blocked project(s)`);
  }
  if (portfolio.portfolioConfidence < 60) {
    recommendations.push('Improve portfolio verification confidence through additional evidence');
  }
  if (portfolio.portfolioRisk >= 50) {
    recommendations.push('Reduce portfolio verification risk before parallel execution');
  }

  const trustRecovery = records.filter((r) => r.status === 'TRUST_RECOVERY_REQUIRED');
  if (trustRecovery.length > 0) {
    recommendations.push(`Initiate trust recovery for ${trustRecovery.length} project(s)`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Portfolio verification health is stable');
  }

  return {
    reportId: `multi-project-verification-report-${reportCounter}`,
    records: records.map((r) => ({ ...r })),
    portfolio: { ...portfolio },
    recommendations: [...new Set(recommendations)],
    generatedAt: Date.now(),
  };
}

export function resetProjectVerificationReportCounterForTests(): void {
  reportCounter = 0;
}
