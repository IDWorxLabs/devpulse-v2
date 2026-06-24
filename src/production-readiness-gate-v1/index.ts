/**
 * Production Readiness Gate V1 — public API.
 */

export {
  PRODUCTION_READINESS_GATE_V1_PASS_TOKEN,
  PRODUCTION_READINESS_GATE_V1_REPORT_TITLE,
  PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR,
  MIN_PRODUCTION_READY_CATEGORIES,
  MIN_PRODUCTION_READINESS_SCORE,
  MAX_PRODUCTION_READINESS_GATE_HISTORY,
} from './production-readiness-gate-v1-bounds.js';

export { runProductionReadinessGateV1 } from './production-readiness-gate-assessor.js';

export { runProductionReadinessForCategory } from './production-readiness-gate-runner.js';

export {
  getLastProductionReadinessGateAssessment,
  listProductionReadinessGateHistory,
  resetProductionReadinessGateHistoryForTests,
  seedProductionReadinessGateHistoryForTests,
} from './production-readiness-gate-history.js';

export { buildProductionReadinessGateV1ReportMarkdown } from './production-readiness-gate-report-builder.js';

export { buildProductionMatrix, formatProductionMatrixText } from './production-matrix-builder.js';

export { buildDomainScoresReport } from './domain-scores-builder.js';

export { loadUpstreamEvidenceForCategory, upstreamChainComplete } from './production-readiness-evidence-loader.js';

export { assessProductionReadinessAfterLaunch } from './production-readiness-launch-integration.js';

export type {
  ProductionRiskLevel,
  ProductionReadinessVerdict,
  ProductionReadinessDomainId,
  ProductionReadinessDomainScore,
  ProductionRiskEntry,
  UpstreamEvidenceSnapshot,
  ProductionCategoryResult,
  ProductionMatrixEntry,
  DomainScoresReport,
  ProductionReadinessGateV1Assessment,
} from './production-readiness-gate-v1-types.js';
