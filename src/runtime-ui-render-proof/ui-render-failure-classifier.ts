/**
 * UI render failure classifier — UI render truth rules (Phase 26.84).
 */

import { isUiRenderedProbe } from './html-render-analyzer.js';
import type {
  DiscoveredUiRoute,
  UiRenderFailureClass,
  UiRenderProbeResult,
  UiRenderProbeSessionResult,
  UiSourceFileEvidence,
} from './runtime-ui-render-proof-types.js';

export interface UiRenderClassification {
  readOnly: true;
  failureClass: UiRenderFailureClass;
  uiRenders: boolean;
  rootRouteJsonOnly: boolean;
  uiFailureReason: string;
  renderedRouteCount: number;
  jsonOnlyRouteCount: number;
}

function findProbe(probes: readonly UiRenderProbeResult[], path: string): UiRenderProbeResult | null {
  return probes.find((p) => p.path === path) ?? null;
}

export function classifyUiRender(input: {
  applicationBootsBeforeProbe: boolean;
  routesReachableBeforeProbe: boolean;
  discoveredUiRoutes: readonly DiscoveredUiRoute[];
  uiSourceFiles: UiSourceFileEvidence;
  probeSession: UiRenderProbeSessionResult;
}): UiRenderClassification {
  if (!input.applicationBootsBeforeProbe || !input.routesReachableBeforeProbe) {
    return {
      readOnly: true,
      failureClass: 'RUNTIME_NOT_ROUTE_READY',
      uiRenders: false,
      rootRouteJsonOnly: false,
      uiFailureReason: 'UI render probe requires applicationBoots=true and routesReachable=true.',
      renderedRouteCount: 0,
      jsonOnlyRouteCount: 0,
    };
  }

  const probes = input.probeSession.probeResults;
  const rootProbe = findProbe(probes, '/');
  const renderedProbes = probes.filter(isUiRenderedProbe);
  const jsonOnlyProbes = probes.filter((p) => p.isJsonOnly && p.statusCode !== null && p.statusCode >= 200 && p.statusCode < 400);
  const htmlProbes = probes.filter((p) => p.isHtml);
  const rootRouteJsonOnly =
    rootProbe !== null &&
    rootProbe.isJsonOnly &&
    rootProbe.statusCode !== null &&
    rootProbe.statusCode >= 200 &&
    rootProbe.statusCode < 400;

  if (input.probeSession.probeSkipped && probes.length === 0) {
    return {
      readOnly: true,
      failureClass: 'UNKNOWN_UI_RENDER_FAILURE',
      uiRenders: false,
      rootRouteJsonOnly,
      uiFailureReason: input.probeSession.skipReason ?? 'UI render probe session skipped.',
      renderedRouteCount: 0,
      jsonOnlyRouteCount: jsonOnlyProbes.length,
    };
  }

  if (renderedProbes.length > 0) {
    return {
      readOnly: true,
      failureClass: 'UI_RENDERED',
      uiRenders: true,
      rootRouteJsonOnly: false,
      uiFailureReason: 'At least one UI route returned HTML with root mount and script bundle (Rule 1).',
      renderedRouteCount: renderedProbes.length,
      jsonOnlyRouteCount: jsonOnlyProbes.length,
    };
  }

  const allSuccessfulJson =
    probes.length > 0 &&
    probes.every(
      (p) =>
        p.isJsonOnly ||
        p.verdict === 'NOT_FOUND' ||
        p.verdict === 'NO_RESPONSE' ||
        p.verdict === 'TIMEOUT',
    ) &&
    jsonOnlyProbes.length > 0;

  if (allSuccessfulJson || (rootRouteJsonOnly && htmlProbes.length === 0)) {
    const sourceHint = input.uiSourceFiles.uiSourceFilesPresent
      ? ' React/Vite UI source files exist on disk but runtime only serves JSON (Rule 4).'
      : '';
    return {
      readOnly: true,
      failureClass: 'JSON_ONLY_RUNTIME',
      uiRenders: false,
      rootRouteJsonOnly: true,
      uiFailureReason: `Runtime serves JSON-only health/status responses; routesReachable does not imply UI render (Rules 2–3).${sourceHint}`,
      renderedRouteCount: 0,
      jsonOnlyRouteCount: jsonOnlyProbes.length,
    };
  }

  if (input.uiSourceFiles.hasIndexHtml && !htmlProbes.some((p) => p.path === '/' || p.path === '/index.html')) {
    return {
      readOnly: true,
      failureClass: 'SPA_ENTRY_MISSING',
      uiRenders: false,
      rootRouteJsonOnly,
      uiFailureReason: 'index.html exists on disk but runtime does not serve HTML at SPA entry routes.',
      renderedRouteCount: 0,
      jsonOnlyRouteCount: jsonOnlyProbes.length,
    };
  }

  const htmlWithoutMount = htmlProbes.filter((p) => !p.hasRootMount);
  if (htmlWithoutMount.length > 0 && htmlProbes.length > 0 && renderedProbes.length === 0) {
    return {
      readOnly: true,
      failureClass: 'HTML_WITHOUT_ROOT_MOUNT',
      uiRenders: false,
      rootRouteJsonOnly,
      uiFailureReason: 'HTML responses lack a root mount element (#root, #app).',
      renderedRouteCount: 0,
      jsonOnlyRouteCount: jsonOnlyProbes.length,
    };
  }

  const htmlWithMountNoBundle = htmlProbes.filter((p) => p.hasRootMount && !p.hasScriptBundle);
  if (htmlWithMountNoBundle.length > 0) {
    return {
      readOnly: true,
      failureClass: input.uiSourceFiles.uiSourceFilesPresent ? 'CLIENT_BUNDLE_MISSING' : 'HTML_WITHOUT_BUNDLE',
      uiRenders: false,
      rootRouteJsonOnly,
      uiFailureReason: 'HTML includes root mount but no client script bundle reference.',
      renderedRouteCount: 0,
      jsonOnlyRouteCount: jsonOnlyProbes.length,
    };
  }

  const blankHtml = htmlProbes.filter((p) => p.blankHtml);
  if (blankHtml.length > 0) {
    return {
      readOnly: true,
      failureClass: 'BLANK_HTML',
      uiRenders: false,
      rootRouteJsonOnly,
      uiFailureReason: 'HTML responses are blank or contain no visible content.',
      renderedRouteCount: 0,
      jsonOnlyRouteCount: jsonOnlyProbes.length,
    };
  }

  if (probes.every((p) => p.verdict === 'NOT_FOUND')) {
    return {
      readOnly: true,
      failureClass: 'UI_ROUTE_NOT_FOUND',
      uiRenders: false,
      rootRouteJsonOnly,
      uiFailureReason: 'All UI candidate routes returned HTTP 404.',
      renderedRouteCount: 0,
      jsonOnlyRouteCount: jsonOnlyProbes.length,
    };
  }

  return {
    readOnly: true,
    failureClass: 'UNKNOWN_UI_RENDER_FAILURE',
    uiRenders: false,
    rootRouteJsonOnly,
    uiFailureReason: 'No UI route returned usable HTML with mount and bundle.',
    renderedRouteCount: 0,
    jsonOnlyRouteCount: jsonOnlyProbes.length,
  };
}
