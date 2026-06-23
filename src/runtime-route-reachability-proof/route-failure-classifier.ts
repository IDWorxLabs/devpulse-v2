/**
 * Route failure classifier — route reachability truth rules (Phase 26.83).
 */

import { SPA_FALLBACK_PROBE_PATH } from './runtime-route-reachability-proof-registry.js';
import { isJsonRouteResponse, isSuccessfulRouteProbe } from './route-probe-runner.js';
import type {
  DiscoveredRoute,
  RouteFailureClass,
  RouteProbeResult,
  RouteProbeSessionResult,
} from './runtime-route-reachability-proof-types.js';

export interface RouteReachabilityClassification {
  readOnly: true;
  failureClass: RouteFailureClass;
  routesReachable: boolean;
  rootRouteReachable: boolean;
  uiRenderProven: boolean;
  routeFailureReason: string;
  successfulRouteCount: number;
  failedRouteCount: number;
  spaFallbackDetected: boolean;
}

function findProbe(probes: readonly RouteProbeResult[], path: string): RouteProbeResult | null {
  return probes.find((p) => p.routePath === path) ?? null;
}

export function classifyRouteReachability(input: {
  applicationBootsBeforeProbe: boolean;
  discoveredRoutes: readonly DiscoveredRoute[];
  probeSession: RouteProbeSessionResult;
}): RouteReachabilityClassification {
  if (!input.applicationBootsBeforeProbe) {
    return {
      readOnly: true,
      failureClass: 'RUNTIME_NOT_BOOTED',
      routesReachable: false,
      rootRouteReachable: false,
      uiRenderProven: false,
      routeFailureReason: 'Route probe refused until startup proof confirms applicationBoots=true.',
      successfulRouteCount: 0,
      failedRouteCount: 0,
      spaFallbackDetected: false,
    };
  }

  if (input.discoveredRoutes.length === 0) {
    return {
      readOnly: true,
      failureClass: 'ROUTE_DISCOVERY_MISSING',
      routesReachable: false,
      rootRouteReachable: false,
      uiRenderProven: false,
      routeFailureReason: 'No expected routes discovered from workspace artifacts.',
      successfulRouteCount: 0,
      failedRouteCount: 0,
      spaFallbackDetected: false,
    };
  }

  const probes = input.probeSession.probeResults;
  const rootProbe = findProbe(probes, '/');
  const healthProbe = findProbe(probes, '/health');
  const spaProbe = findProbe(probes, SPA_FALLBACK_PROBE_PATH);

  const successful = probes.filter(isSuccessfulRouteProbe);
  const rootRouteReachable = rootProbe ? isSuccessfulRouteProbe(rootProbe) : false;
  const healthReachable = healthProbe ? isSuccessfulRouteProbe(healthProbe) : false;
  const spaFallbackDetected =
    spaProbe !== null && isSuccessfulRouteProbe(spaProbe) && spaProbe.statusCode === 200;

  const uiRenderProven = successful.some(
    (p) => p.responseType === 'html' && p.routePath !== SPA_FALLBACK_PROBE_PATH,
  );

  const successfulRouteCount = successful.length;
  const failedRouteCount = probes.length - successful.length;

  if (input.probeSession.probeSkipped && probes.length === 0) {
    return {
      readOnly: true,
      failureClass: 'UNKNOWN_ROUTE_FAILURE',
      routesReachable: false,
      rootRouteReachable: false,
      uiRenderProven: false,
      routeFailureReason: input.probeSession.skipReason ?? 'Route probe session skipped.',
      successfulRouteCount: 0,
      failedRouteCount: 0,
      spaFallbackDetected: false,
    };
  }

  if (probes.some((p) => p.verdict === 'TIMEOUT')) {
    return {
      readOnly: true,
      failureClass: 'ROUTE_TIMEOUT',
      routesReachable: rootRouteReachable,
      rootRouteReachable,
      uiRenderProven,
      routeFailureReason: 'One or more route probes timed out.',
      successfulRouteCount,
      failedRouteCount,
      spaFallbackDetected,
    };
  }

  if (probes.some((p) => p.verdict === 'SERVER_ERROR')) {
    return {
      readOnly: true,
      failureClass: 'ROUTE_SERVER_ERROR',
      routesReachable: rootRouteReachable,
      rootRouteReachable,
      uiRenderProven,
      routeFailureReason: 'One or more routes returned HTTP 5xx.',
      successfulRouteCount,
      failedRouteCount,
      spaFallbackDetected,
    };
  }

  if (spaFallbackDetected && !rootRouteReachable) {
    return {
      readOnly: true,
      failureClass: 'SPA_FALLBACK_PRESENT',
      routesReachable: true,
      rootRouteReachable: false,
      uiRenderProven: false,
      routeFailureReason: 'SPA fallback returns 200 for unknown routes; root route not separately proven.',
      successfulRouteCount,
      failedRouteCount,
      spaFallbackDetected: true,
    };
  }

  if (rootRouteReachable && successfulRouteCount === 1 && !healthReachable) {
    return {
      readOnly: true,
      failureClass: 'ROOT_ROUTE_ONLY',
      routesReachable: true,
      rootRouteReachable: true,
      uiRenderProven,
      routeFailureReason:
        isJsonRouteResponse(rootProbe!)
          ? 'Root route responds with JSON — route reachability proven; UI render remains unproven.'
          : 'Only root route returned HTTP success.',
      successfulRouteCount,
      failedRouteCount,
      spaFallbackDetected,
    };
  }

  if (healthReachable && successfulRouteCount === 1) {
    return {
      readOnly: true,
      failureClass: 'HEALTH_ONLY',
      routesReachable: true,
      rootRouteReachable: false,
      uiRenderProven: false,
      routeFailureReason: 'Only /health returned success; root route not reachable.',
      successfulRouteCount,
      failedRouteCount,
      spaFallbackDetected,
    };
  }

  if (successfulRouteCount > 0) {
    const jsonOnly =
      successful.every((p) => isJsonRouteResponse(p)) && !uiRenderProven;
    return {
      readOnly: true,
      failureClass: 'ROUTES_REACHABLE',
      routesReachable: true,
      rootRouteReachable,
      uiRenderProven,
      routeFailureReason: jsonOnly
        ? 'Routes respond with JSON runtime proof; UI render proof is separate.'
        : 'Multiple discovered routes returned HTTP success.',
      successfulRouteCount,
      failedRouteCount,
      spaFallbackDetected,
    };
  }

  if (spaFallbackDetected) {
    return {
      readOnly: true,
      failureClass: 'SPA_FALLBACK_PRESENT',
      routesReachable: true,
      rootRouteReachable,
      uiRenderProven: false,
      routeFailureReason: 'SPA fallback returns 200 for unknown routes (Rule 3).',
      successfulRouteCount,
      failedRouteCount,
      spaFallbackDetected: true,
    };
  }

  if (probes.some((p) => p.verdict === 'NOT_FOUND')) {
    return {
      readOnly: true,
      failureClass: 'ROUTE_NOT_FOUND',
      routesReachable: false,
      rootRouteReachable: false,
      uiRenderProven: false,
      routeFailureReason: 'Discovered routes returned HTTP 404.',
      successfulRouteCount: 0,
      failedRouteCount,
      spaFallbackDetected: false,
    };
  }

  return {
    readOnly: true,
    failureClass: 'UNKNOWN_ROUTE_FAILURE',
    routesReachable: false,
    rootRouteReachable: false,
    uiRenderProven: false,
    routeFailureReason: 'No discovered route returned HTTP success.',
    successfulRouteCount: 0,
    failedRouteCount,
    spaFallbackDetected: false,
  };
}
