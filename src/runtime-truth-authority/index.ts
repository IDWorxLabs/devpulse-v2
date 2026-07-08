/**
 * Runtime Truth Authority V1 — public API.
 */

export {
  RUNTIME_TRUTH_AUTHORITY_V1_PASS_TOKEN,
  RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
  ROUTE_CONTRACTS_VERSION,
  CAPABILITY_MANIFEST_VERSION,
} from './rta-types.js';

export type {
  RuntimeIdentity,
  RouteContract,
  CapabilityDescriptor,
  RuntimeFreshness,
  RuntimeTruthFreshness,
  RuntimeTruthHealthSummary,
  RuntimeTruthPayload,
  Global405Diagnostics,
  ValidatorRuntimeMode,
  ValidatorRuntimeTruthOptions,
  ValidatorRuntimeTruthResult,
} from './rta-types.js';

export {
  SOURCE_FINGERPRINT_FILE_PATHS,
  computeSourceFingerprint,
  computeSourceFingerprintEntries,
  resolveLatestSourceFingerprintTimestamp,
} from './source-fingerprint.js';

export {
  CANONICAL_ROUTE_DEFINITIONS,
  REQUIRED_PRODUCTION_ROUTE_DEFINITIONS,
  buildRouteContracts,
  detectRegisteredRoutesFromServerSource,
  getKnownMethodsForPath,
  getMissingRequiredRouteContracts,
  getRouteContractsVersion,
  registerBootRouteContracts,
  resetBootRouteContractsForTests,
} from './route-contract-registry.js';

export {
  MODULE_CAPABILITY_DEFINITIONS,
  buildCapabilityManifest,
  getCapabilityManifestVersion,
  isCapabilityRegistered,
} from './capability-manifest.js';

export {
  createRuntimeIdentity,
  getRuntimeIdentity,
  resetRuntimeIdentityForTests,
} from './runtime-identity.js';

export { detectStaleRuntime, isStaleRuntimeDetected } from './stale-runtime-detector.js';

export {
  bootRuntimeTruthAuthority,
  buildRuntimeTruthHealthSummary,
  buildRuntimeTruthPayload,
  buildGlobal405Diagnostics,
  logRuntimeTruthStartupSummary,
  getRuntimeTruthRootDir,
  resetRuntimeTruthAuthorityForTests,
} from './runtime-truth-verifier.js';

export {
  assertValidatorRuntimeTruth,
  resolveExpectedWorkingTreeFingerprint,
  RUNTIME_TRUTH_API_PATH,
} from './validator-runtime-parity.js';

export {
  BROWSER_RUNTIME_TRUTH_STORAGE_KEY,
  BROWSER_REQUIRED_CAPABILITIES,
  COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE,
  RUNTIME_TRUTH_STALE_MESSAGE,
  verifyRuntimeTruthPayload,
  resolveBrowserContractVersions,
} from './browser-runtime-parity.js';

export type { BrowserRuntimeParityResult } from './browser-runtime-parity.js';

export { buildRuntimeTruthReport } from './rta-report-builder.js';

export {
  runRuntimeTruthAuthorityValidation,
  printRtaValidationResults,
  assertRtaCheck,
  RTA_VALIDATION_ROOT,
} from './rta-validator.js';

export type { RtaValidationCheck } from './rta-validator.js';
