/**
 * Runtime Truth Authority V1 — runtime truth verification and payload assembly.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { BUILD_INTENT_CLASSIFICATION_RECOVERY_CONTRACT_VERSION } from '../build-intent-classification-recovery-v1/recovery-events.js';
import { BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION } from '../build-intent-routing/build-intent-route-parity-v1.js';
import { buildCapabilityManifest, isCapabilityRegistered } from './capability-manifest.js';
import {
  buildRouteContracts,
  detectRegisteredRoutesFromServerSource,
  getKnownMethodsForPath,
  getMissingRequiredRouteContracts,
  getRouteContractsVersion,
  registerBootRouteContracts,
  resetBootRouteContractsForTests,
} from './route-contract-registry.js';
import {
  createRuntimeIdentity,
  getRuntimeIdentity,
  resetRuntimeIdentityForTests,
} from './runtime-identity.js';
import { detectStaleRuntime } from './stale-runtime-detector.js';
import {
  CAPABILITY_MANIFEST_VERSION,
  RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
  type Global405Diagnostics,
  type RuntimeTruthHealthSummary,
  type RuntimeTruthLiveStatus,
  type RuntimeTruthPayload,
} from './rta-types.js';

export interface BootRuntimeTruthAuthorityInput {
  rootDir: string;
  port: number;
  packageVersion: string;
  gitCommit: string | null;
  startedAt?: string;
}

let bootRootDir: string | null = null;

export function bootRuntimeTruthAuthority(input: BootRuntimeTruthAuthorityInput): RuntimeTruthPayload {
  bootRootDir = input.rootDir;
  registerBootRouteContracts(detectRegisteredRoutesFromServerSource(input.rootDir));
  createRuntimeIdentity(input);
  return buildRuntimeTruthPayload(input.rootDir);
}

export function resetRuntimeTruthAuthorityForTests(): void {
  bootRootDir = null;
  resetRuntimeIdentityForTests();
  resetBootRouteContractsForTests();
}

export function buildRuntimeTruthHealthSummary(rootDir: string): RuntimeTruthHealthSummary {
  const identity = getRuntimeIdentity();
  const freshness = detectStaleRuntime({
    rootDir,
    serverContractVersion: RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
  });
  return {
    runtimeId: identity?.runtimeId ?? 'unknown',
    sourceFingerprint: identity?.sourceFingerprint ?? 'unknown',
    routeContractVersion: getRouteContractsVersion(),
    capabilityManifestVersion: CAPABILITY_MANIFEST_VERSION,
    staleRuntimeDetected: freshness.status === 'STALE',
    buildIntentClassificationRegistered: isCapabilityRegistered('buildIntentClassification', rootDir),
    aeeRegistered: isCapabilityRegistered('aee', rootDir),
    aelRegistered: isCapabilityRegistered('ael', rootDir),
    engineeringIntelligenceRegistered: isCapabilityRegistered('engineeringIntelligence', rootDir),
  };
}

export function buildRuntimeTruthLiveStatus(rootDir: string): RuntimeTruthLiveStatus {
  const recoverySource = join(rootDir, 'src/build-intent-classification-recovery-v1/index.ts');
  const routeSource = join(rootDir, 'src/build-intent-routing/build-intent-route-parity-v1.ts');
  return {
    serverAlive: true,
    runtime: 'command-center',
    buildIntentRecoveryAvailable: existsSync(recoverySource),
    buildIntentRouteVersion: existsSync(routeSource) ? BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION : null,
    buildIntentRecoveryVersion: existsSync(recoverySource)
      ? BUILD_INTENT_CLASSIFICATION_RECOVERY_CONTRACT_VERSION
      : null,
    timestamp: new Date().toISOString(),
  };
}

export function buildRuntimeTruthPayload(
  rootDir: string,
  input?: {
    browserRuntimeId?: string | null;
    browserContractVersion?: string | null;
    expectedGitCommit?: string | null;
    expectedSourceFingerprint?: string | null;
  },
): RuntimeTruthPayload {
  const identity = getRuntimeIdentity();
  if (!identity) {
    throw new Error('Runtime Truth Authority not booted');
  }

  const routeContracts = buildRouteContracts();
  const capabilities = buildCapabilityManifest(rootDir);
  const freshness = detectStaleRuntime({
    rootDir,
    browserRuntimeId: input?.browserRuntimeId ?? null,
    browserContractVersion: input?.browserContractVersion ?? null,
    expectedGitCommit: input?.expectedGitCommit ?? null,
    expectedSourceFingerprint: input?.expectedSourceFingerprint ?? null,
    serverContractVersion: RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
  });

  const warnings: string[] = [];
  const errors: string[] = [];

  const missingRoutes = getMissingRequiredRouteContracts();
  if (missingRoutes.length > 0) {
    errors.push(
      `Missing required route contracts: ${missingRoutes
        .map((route) => `${route.method} ${route.path}`)
        .join(', ')}`,
    );
  }

  if (freshness.status === 'STALE') {
    errors.push(...freshness.reasons.map((reason) => `Stale runtime: ${reason}`));
  }

  const disabledCapabilities = capabilities.filter((capability) => !capability.enabled);
  if (disabledCapabilities.length > 0) {
    warnings.push(
      `Disabled capabilities: ${disabledCapabilities.map((capability) => capability.name).join(', ')}`,
    );
  }

  const runtimeTruth = buildRuntimeTruthHealthSummary(rootDir);
  const liveStatus = buildRuntimeTruthLiveStatus(rootDir);
  const ok = errors.length === 0 && freshness.status !== 'STALE';

  return {
    ok,
    contractVersion: RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
    runtimeIdentity: identity,
    routeContracts,
    capabilities,
    sourceFingerprint: identity.sourceFingerprint,
    freshness,
    runtimeTruth,
    liveStatus,
    warnings,
    errors,
  };
}

export function buildGlobal405Diagnostics(path: string, method: string): Global405Diagnostics {
  const identity = getRuntimeIdentity();
  const knownMethods = getKnownMethodsForPath(path);
  return {
    error: `Method not allowed for ${method} ${path}`,
    requestedPath: path,
    requestedMethod: method.toUpperCase(),
    knownMethodsForPath: knownMethods,
    routeContractsVersion: getRouteContractsVersion(),
    runtimeId: identity?.runtimeId ?? 'unknown',
    hint: 'If this route exists in source but not runtime, restart AiDevEngine.',
  };
}

export function logRuntimeTruthStartupSummary(rootDir: string): void {
  const payload = buildRuntimeTruthPayload(rootDir);
  const registeredRoutes = payload.routeContracts.filter((route) => route.registeredAtBoot);
  const enabledCapabilities = payload.capabilities.filter((capability) => capability.enabled);
  const importantRoutes = [
    'POST /api/brain/classify-build-intent',
    'POST /api/brain/respond',
    'POST /api/build/from-prompt',
    'POST /api/projects/delete',
    'GET /api/runtime/truth',
  ];

  console.log('');
  console.log('Runtime Truth Authority');
  console.log('=======================');
  console.log(`runtimeId: ${payload.runtimeIdentity.runtimeId}`);
  console.log(`sourceFingerprint: ${payload.runtimeIdentity.sourceFingerprint}`);
  console.log(`registered capabilities: ${enabledCapabilities.length}/${payload.capabilities.length}`);
  console.log(`registered routes: ${registeredRoutes.length}/${payload.routeContracts.length}`);
  console.log('important routes:');
  for (const routeLabel of importantRoutes) {
    const [method, ...pathParts] = routeLabel.split(' ');
    const path = pathParts.join(' ');
    const registered = registeredRoutes.some(
      (route) => route.method === method && route.path === path,
    );
    console.log(`  ${registered ? '✓' : '✗'} ${routeLabel}`);
    if (!registered) {
      console.error(`RTA_ROUTE_CONTRACT_MISSING ${routeLabel}`);
    }
  }
  if (payload.errors.length > 0) {
    for (const error of payload.errors) {
      console.error(`RTA_STARTUP_ERROR ${error}`);
    }
  }
  console.log('');
}

export function getRuntimeTruthRootDir(): string | null {
  return bootRootDir;
}
