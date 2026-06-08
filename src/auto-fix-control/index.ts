export {
  createDevPulseV2AutoFixControlPanel,
  DevPulseV2AutoFixControlPanel,
  evaluateAutoFixPermission,
  fixStateIncludes,
  getDevPulseV2AutoFixControlPanel,
  resetDevPulseV2AutoFixControlPanelForTests,
} from './auto-fix-control-panel.js';
export { classifyFixType, fixTypeLabel } from './auto-fix-classifier.js';
export {
  attachAutoFixEvidence,
  countAutoFixEvidenceBySource,
} from './auto-fix-evidence.js';
export { AutoFixPermissionStore, permissionStateIsAllowed } from './auto-fix-permission-store.js';
export {
  buildFixStateSequence,
  evaluateFixPolicy,
  permissionToOutcomeState,
} from './auto-fix-policy-engine.js';
export {
  buildAutoFixControlReport,
  formatAutoFixControlReport,
} from './auto-fix-report.js';
export {
  AUTO_FIX_CONTROL_OWNER_MODULE,
  AUTO_FIX_CONTROL_PASS_TOKEN,
  DEPENDENCY_SYSTEMS,
  DUPLICATE_SYSTEM_PATTERNS,
  type AutoFixControlPanelState,
  type AutoFixControlReport,
  type AutoFixEvaluationInput,
  type AutoFixEvidenceLink,
  type AutoFixEvidenceSource,
  type AutoFixPermissionRecord,
  type AutoFixState,
  type FixType,
  type PermissionState,
} from './types.js';
