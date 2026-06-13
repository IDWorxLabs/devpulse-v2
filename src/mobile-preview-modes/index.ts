/**
 * Mobile Preview Modes — public API (V1).
 */

export {
  MOBILE_PREVIEW_MODES_V1_PASS,
  MOBILE_PREVIEW_MODES_OWNER_MODULE,
  MOBILE_PREVIEW_MODES_PHASE,
  MOBILE_PREVIEW_MODES_REPORT_TITLE,
  MAX_MOBILE_PREVIEW_HISTORY,
  DEVICE_PROFILE_IDS,
  DEVICE_CATEGORIES,
  PREVIEW_READINESS_VALUES,
  RESPONSIVE_RISK_TYPES,
  SAFETY_GUARANTEES,
} from './mobile-preview-registry.js';

export type {
  DeviceProfileId,
  DeviceCategory,
  MobilePreviewReadiness,
  PreviewReadinessCategory,
  ResponsiveRiskType,
  ResponsiveRiskSeverity,
  DeviceProfile,
  ProjectUnderstandingSnapshot,
  PreviewLayoutBehavior,
  ResponsiveRiskItem,
  ResponsiveRiskAnalysis,
  DeviceCompatibilityResult,
  MobileNavigationReview,
  DeviceRecommendation,
  MobilePreviewAnalysis,
  MobilePreviewHistoryEntry,
  MobilePreviewModesReport,
  AnalyzeMobilePreviewInput,
  MobilePreviewAssessment,
  PreviewEvidenceBundle,
} from './mobile-preview-types.js';

export {
  DEVICE_PROFILES,
  getDeviceProfile,
  getProfilesByCategory,
  getAllDeviceProfileIds,
} from './device-profile-library.js';

export {
  resetMobilePreviewHistoryForTests,
  recordMobilePreviewAnalysis,
  getMobilePreviewHistorySize,
  getMobilePreviewHistory,
  getMobilePreviewAnalyses,
  getLatestMobilePreviewAnalysis,
} from './mobile-preview-history.js';

export {
  analyzeMobilePreviewModes,
  assessMobilePreviewModes,
  buildMobilePreviewModesArtifacts,
  resetMobilePreviewCounterForTests,
  resetMobilePreviewModesModuleForTests,
} from './mobile-preview-authority.js';

export {
  buildMobilePreviewModesReport,
  buildMobilePreviewModesReportMarkdown,
} from './mobile-preview-report-builder.js';

export { analyzePreviewLayouts, analyzePreviewLayoutForProfile } from './preview-layout-analyzer.js';
export { detectResponsiveRisks } from './responsive-risk-detector.js';
export { analyzeMobileNavigation } from './mobile-navigation-analyzer.js';
export {
  analyzeDeviceCompatibility,
  generateDeviceRecommendations,
  computePreviewReadiness,
} from './device-compatibility-analyzer.js';
export { consolidatePreviewEvidence } from './preview-evidence-consolidator.js';
