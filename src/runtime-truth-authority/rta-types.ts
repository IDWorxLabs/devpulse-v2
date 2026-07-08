/**
 * Runtime Truth Authority V1 — shared types.
 */

export const RUNTIME_TRUTH_AUTHORITY_V1_PASS_TOKEN = 'RUNTIME_TRUTH_AUTHORITY_V1_PASS';
export const RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION = 'RUNTIME_TRUTH_AUTHORITY_V1' as const;
export const ROUTE_CONTRACTS_VERSION = 'ROUTE_CONTRACTS_V1' as const;
export const CAPABILITY_MANIFEST_VERSION = 'CAPABILITY_MANIFEST_V1' as const;

export type RuntimeFreshness = 'FRESH' | 'STALE' | 'UNKNOWN';

export type ValidatorRuntimeMode = 'EPHEMERAL' | 'PRODUCTION_LOCALHOST';

export interface RuntimeIdentity {
  runtimeId: string;
  processPid: number;
  startedAt: string;
  port: number;
  gitCommit: string | null;
  sourceFingerprint: string;
  packageVersion: string;
  nodeVersion: string;
  platform: string;
  cwd: string;
}

export interface RouteContract {
  path: string;
  method: string;
  owner: string;
  contractVersion: string;
  enabled: boolean;
  registeredAtBoot: boolean;
}

export interface CapabilityDescriptor {
  name: string;
  enabled: boolean;
  route: string | null;
  method: string | null;
  contractVersion: string;
  ownerModule: string;
  registeredAtBoot: boolean;
  sourceFile: string;
}

export interface RuntimeTruthFreshness {
  status: RuntimeFreshness;
  reasons: string[];
}

export interface RuntimeTruthHealthSummary {
  runtimeId: string;
  sourceFingerprint: string;
  routeContractVersion: typeof ROUTE_CONTRACTS_VERSION;
  capabilityManifestVersion: typeof CAPABILITY_MANIFEST_VERSION;
  staleRuntimeDetected: boolean;
  buildIntentClassificationRegistered: boolean;
  aeeRegistered: boolean;
  aelRegistered: boolean;
  engineeringIntelligenceRegistered: boolean;
}

/** Always reported when GET /api/runtime/truth responds — independent of freshness ok flag. */
export interface RuntimeTruthLiveStatus {
  serverAlive: true;
  runtime: 'command-center';
  buildIntentRecoveryAvailable: boolean;
  buildIntentRouteVersion: string | null;
  buildIntentRecoveryVersion: string | null;
  timestamp: string;
}

export interface RuntimeTruthPayload {
  ok: boolean;
  contractVersion: typeof RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION;
  runtimeIdentity: RuntimeIdentity;
  routeContracts: RouteContract[];
  capabilities: CapabilityDescriptor[];
  sourceFingerprint: string;
  freshness: RuntimeTruthFreshness;
  runtimeTruth: RuntimeTruthHealthSummary;
  liveStatus: RuntimeTruthLiveStatus;
  warnings: string[];
  errors: string[];
}

export interface Global405Diagnostics {
  error: string;
  requestedPath: string;
  requestedMethod: string;
  knownMethodsForPath: string[];
  routeContractsVersion: typeof ROUTE_CONTRACTS_VERSION;
  runtimeId: string;
  hint: string;
}

export interface ValidatorRuntimeTruthOptions {
  runtimeMode: ValidatorRuntimeMode;
  baseUrl?: string;
  productionPort?: number;
  requireProductionParity?: boolean;
  /** When true, production probe only requires reachable truth + capabilities + routes (not FRESH fingerprint). */
  productionLivenessOnly?: boolean;
  expectedSourceFingerprint?: string | null;
  requiredCapabilities?: string[];
  requiredRoutes?: Array<{ path: string; method: string }>;
}

export interface ValidatorRuntimeTruthResult {
  ok: boolean;
  runtimeMode: ValidatorRuntimeMode;
  productionProbed: boolean;
  ephemeralProbed: boolean;
  runtimeId: string | null;
  sourceFingerprint: string | null;
  freshness: RuntimeFreshness;
  errors: string[];
  warnings: string[];
}
