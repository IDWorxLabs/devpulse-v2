/**
 * DevPulse V2 Phase 12.6 — Portfolio Intelligence public API.
 */

export {
  PORTFOLIO_INTELLIGENCE_PASS_TOKEN,
  PORTFOLIO_INTELLIGENCE_OWNER_MODULE,
  PORTFOLIO_QUESTION_SIGNALS,
  FORBIDDEN_PORTFOLIO_DUPLICATES,
  isPortfolioIntelligenceQuestion,
  isDuplicatePortfolioBrainQuestion,
  type PortfolioHealthLevel,
  type PortfolioConfidence,
  type PortfolioProject,
  type PortfolioHealth,
  type PortfolioRisk,
  type PortfolioPriority,
  type PortfolioSummary,
  type PortfolioComparison,
  type PortfolioAnalysis,
  type PortfolioAnswer,
  type PortfolioIntelligenceDiagnostics,
} from './portfolio-intelligence-types.js';

export { readPortfolioProjects, findPortfolioProject } from './portfolio-project-reader.js';
export { analyzePortfolioHealth, findHealthiestProject } from './portfolio-health-analyzer.js';
export { analyzePortfolioRisks, findRiskiestProject, resetPortfolioRiskCounterForTests } from './portfolio-risk-analyzer.js';
export {
  analyzePortfolioPriorities,
  findHighestPriorityProject,
  resetPortfolioPriorityCounterForTests,
} from './portfolio-priority-analyzer.js';
export { comparePortfolioProjects, resetPortfolioComparisonCounterForTests } from './portfolio-comparison-engine.js';
export { buildPortfolioSummary, resetPortfolioSummaryCounterForTests } from './portfolio-summary-builder.js';

export {
  getPortfolioIntelligenceDiagnostics,
  updatePortfolioIntelligenceDiagnostics,
  resetPortfolioIntelligenceDiagnostics,
  portfolioIntelligenceKey,
} from './portfolio-intelligence-diagnostics.js';

export {
  analyzePortfolio,
  processPortfolioIntelligenceRequest,
  getPortfolioIntelligenceContext,
} from './portfolio-intelligence.js';

export function getDevPulseV2PortfolioIntelligence(): {
  ownerModule: string;
  passToken: string;
  phase: number;
} {
  return {
    ownerModule: 'devpulse_v2_portfolio_intelligence',
    passToken: 'DEVPULSE_V2_PORTFOLIO_INTELLIGENCE_FOUNDATION_V1_PASS',
    phase: 12.6,
  };
}
