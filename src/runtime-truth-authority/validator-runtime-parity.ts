/**
 * Runtime Truth Authority V1 — validator production vs ephemeral parity.
 */

import { FOUNDER_REALITY_PORT } from '../../server/founder-reality-manifest.js';
import { computeSourceFingerprint } from './source-fingerprint.js';
import { REQUIRED_PRODUCTION_ROUTE_DEFINITIONS } from './route-contract-registry.js';
import {
  RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
  type RuntimeTruthPayload,
  type ValidatorRuntimeTruthOptions,
  type ValidatorRuntimeTruthResult,
} from './rta-types.js';

export const RUNTIME_TRUTH_API_PATH = '/api/runtime/truth';

async function fetchRuntimeTruth(baseUrl: string): Promise<RuntimeTruthPayload | null> {
  try {
    const res = await fetch(`${baseUrl}${RUNTIME_TRUTH_API_PATH}`, { method: 'GET', cache: 'no-store' });
    if (res.status !== 200 && res.status !== 503) return null;
    return (await res.json()) as RuntimeTruthPayload;
  } catch {
    return null;
  }
}

async function probeRouteReachable(
  baseUrl: string,
  path: string,
  method: string,
): Promise<{ reachable: boolean; status: number }> {
  try {
    if (method === 'GET') {
      const res = await fetch(`${baseUrl}${path}`, { method: 'GET', cache: 'no-store' });
      return { reachable: res.status !== 404 && res.status !== 405, status: res.status };
    }
    if (method === 'POST') {
      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'runtime truth route probe' }),
        cache: 'no-store',
      });
      return { reachable: res.status !== 404 && res.status !== 405, status: res.status };
    }
    return { reachable: false, status: 0 };
  } catch {
    return { reachable: false, status: 0 };
  }
}

export async function assertValidatorRuntimeTruth(
  options: ValidatorRuntimeTruthOptions,
): Promise<ValidatorRuntimeTruthResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let productionProbed = false;
  let ephemeralProbed = false;
  let runtimeId: string | null = null;
  let sourceFingerprint: string | null = null;
  let freshness: ValidatorRuntimeTruthResult['freshness'] = 'UNKNOWN';

  const requiredRoutes =
    options.requiredRoutes ??
    REQUIRED_PRODUCTION_ROUTE_DEFINITIONS.map((route) => ({ path: route.path, method: route.method }));
  const requiredCapabilities = options.requiredCapabilities ?? ['buildIntentClassification', 'runtimeTruth'];

  if (options.runtimeMode === 'EPHEMERAL' && options.baseUrl) {
    ephemeralProbed = true;
    const truth = await fetchRuntimeTruth(options.baseUrl);
    if (!truth) {
      errors.push(`EPHEMERAL runtime truth unavailable at ${options.baseUrl}${RUNTIME_TRUTH_API_PATH}`);
    } else {
      runtimeId = truth.runtimeIdentity.runtimeId;
      sourceFingerprint = truth.sourceFingerprint;
      freshness = truth.freshness.status;
      if (!truth.ok) errors.push(...truth.errors);
      warnings.push(...truth.warnings);
      if (truth.contractVersion !== RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION) {
        errors.push('EPHEMERAL runtime truth contract version mismatch');
      }
      for (const capabilityName of requiredCapabilities) {
        const capability = truth.capabilities.find((entry) => entry.name === capabilityName);
        if (!capability?.enabled) {
          errors.push(`EPHEMERAL missing capability: ${capabilityName}`);
        }
      }
      for (const route of requiredRoutes) {
        const contract = truth.routeContracts.find(
          (entry) => entry.path === route.path && entry.method === route.method,
        );
        if (!contract?.registeredAtBoot) {
          errors.push(`EPHEMERAL route not registered at boot: ${route.method} ${route.path}`);
        }
        const probe = await probeRouteReachable(options.baseUrl, route.path, route.method);
        if (!probe.reachable) {
          errors.push(`EPHEMERAL route probe failed ${route.method} ${route.path} status=${probe.status}`);
        }
      }
    }
    if (options.requireProductionParity) {
      warnings.push('EPHEMERAL mode cannot claim production parity without PRODUCTION_LOCALHOST probe');
    }
  }

  if (options.runtimeMode === 'PRODUCTION_LOCALHOST' || options.requireProductionParity) {
    const port = options.productionPort ?? FOUNDER_REALITY_PORT;
    const productionBaseUrl = options.baseUrl ?? `http://127.0.0.1:${port}`;
    productionProbed = true;
    const truth = await fetchRuntimeTruth(productionBaseUrl);
    if (!truth) {
      errors.push(
        `PRODUCTION runtime truth unavailable at ${productionBaseUrl}${RUNTIME_TRUTH_API_PATH} — is npm run dev running on port ${port}?`,
      );
    } else {
      runtimeId = truth.runtimeIdentity.runtimeId;
      sourceFingerprint = truth.sourceFingerprint;
      freshness = truth.freshness.status;
      const livenessOnly = options.productionLivenessOnly === true;

      if (!truth.liveStatus?.serverAlive) {
        errors.push('PRODUCTION runtime truth missing liveStatus.serverAlive');
      }
      if (truth.liveStatus && !truth.liveStatus.buildIntentRecoveryAvailable && livenessOnly) {
        warnings.push('PRODUCTION buildIntentRecoveryAvailable=false on disk-backed dev server');
      }

      if (!livenessOnly) {
        if (!truth.ok) errors.push(...truth.errors.map((entry) => `PRODUCTION: ${entry}`));
        if (truth.freshness.status === 'STALE') {
          errors.push(`PRODUCTION runtime stale: ${truth.freshness.reasons.join('; ')}`);
        }
        if (options.expectedSourceFingerprint && truth.sourceFingerprint !== options.expectedSourceFingerprint) {
          errors.push('PRODUCTION sourceFingerprint differs from expected working tree fingerprint');
        }
      } else {
        if (!truth.ok) {
          warnings.push(...truth.errors.map((entry) => `PRODUCTION liveness: ${entry}`));
        }
        if (truth.freshness.status === 'STALE') {
          warnings.push(`PRODUCTION liveness: runtime stale (${truth.freshness.reasons.join('; ')})`);
        }
        if (options.expectedSourceFingerprint && truth.sourceFingerprint !== options.expectedSourceFingerprint) {
          warnings.push('PRODUCTION liveness: sourceFingerprint differs from validator working tree');
        }
      }

      warnings.push(...truth.warnings.map((entry) => `PRODUCTION: ${entry}`));
      for (const capabilityName of requiredCapabilities) {
        const capability = truth.capabilities.find((entry) => entry.name === capabilityName);
        if (!capability?.enabled) {
          errors.push(`PRODUCTION missing capability: ${capabilityName}`);
        }
      }
      for (const route of requiredRoutes) {
        const contract = truth.routeContracts.find(
          (entry) => entry.path === route.path && entry.method === route.method,
        );
        if (!contract?.registeredAtBoot) {
          errors.push(`PRODUCTION route not registered at boot: ${route.method} ${route.path}`);
        }
        const probe = await probeRouteReachable(productionBaseUrl, route.path, route.method);
        if (!probe.reachable) {
          errors.push(
            `PRODUCTION route probe failed ${route.method} ${route.path} status=${probe.status} — stale process likely`,
          );
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    runtimeMode: options.runtimeMode,
    productionProbed,
    ephemeralProbed,
    runtimeId,
    sourceFingerprint,
    freshness,
    errors,
    warnings,
  };
}

export function resolveExpectedWorkingTreeFingerprint(rootDir: string): string {
  return computeSourceFingerprint(rootDir);
}
