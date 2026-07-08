/**
 * Runtime Truth Authority V1 — browser runtime parity helpers.
 */

import { BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION } from '../build-intent-routing/build-intent-route-parity-v1.js';
import {
  RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
  type RuntimeTruthPayload,
} from './rta-types.js';

export const BROWSER_RUNTIME_TRUTH_STORAGE_KEY = 'aidevengine.runtimeTruth.runtimeId';
export const COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE = 'COMMAND_CENTER_RUNTIME_TRUTH_READY';
export const RUNTIME_TRUTH_STALE_MESSAGE =
  'AiDevEngine runtime is stale. Restart required.';

export const BROWSER_REQUIRED_CAPABILITIES = [
  'runtimeTruth',
  'brainHealth',
  'brainRespond',
  'buildIntentClassification',
] as const;

export interface BrowserRuntimeParityResult {
  ok: boolean;
  payload: RuntimeTruthPayload | null;
  stale: boolean;
  classifyRouteAvailable: boolean;
  message: string | null;
  runtimeId: string | null;
}

export function verifyRuntimeTruthPayload(payload: RuntimeTruthPayload | null): BrowserRuntimeParityResult {
  if (!payload) {
    return {
      ok: false,
      payload: null,
      stale: true,
      classifyRouteAvailable: false,
      message: RUNTIME_TRUTH_STALE_MESSAGE,
      runtimeId: null,
    };
  }

  const classifyRoute = payload.routeContracts.find(
    (route) => route.path === '/api/brain/classify-build-intent' && route.method === 'POST',
  );
  const classifyRouteAvailable = classifyRoute?.registeredAtBoot === true && classifyRoute.enabled === true;
  const buildIntentCapability = payload.capabilities.find(
    (capability) => capability.name === 'buildIntentClassification',
  );
  const requiredCapabilitiesOk = BROWSER_REQUIRED_CAPABILITIES.every((name) =>
    payload.capabilities.some((capability) => capability.name === name && capability.enabled),
  );

  const stale =
    payload.freshness.status === 'STALE' ||
    !payload.ok ||
    !requiredCapabilitiesOk ||
    !classifyRouteAvailable ||
    buildIntentCapability?.enabled !== true;

  let message: string | null = null;
  if (stale) {
    if (payload.errors.length > 0) {
      message = `${RUNTIME_TRUTH_STALE_MESSAGE} ${payload.errors[0]}`;
    } else if (!classifyRouteAvailable) {
      message = `${RUNTIME_TRUTH_STALE_MESSAGE} Build intent classification route missing.`;
    } else {
      message = RUNTIME_TRUTH_STALE_MESSAGE;
    }
  }

  return {
    ok: !stale,
    payload,
    stale,
    classifyRouteAvailable,
    message,
    runtimeId: payload.runtimeIdentity.runtimeId,
  };
}

export function resolveBrowserContractVersions(): {
  runtimeTruth: typeof RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION;
  buildIntent: typeof BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION;
} {
  return {
    runtimeTruth: RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
    buildIntent: BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION,
  };
}
