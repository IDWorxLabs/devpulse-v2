/**
 * Founder flow candidate discovery — evidence-backed flow steps (Phase 26.86).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FOUNDER_FLOW_RESULT_ENDPOINTS } from './founder-flow-runtime-proof-registry.js';
import type {
  DiscoveredFounderFlowCandidate,
  FounderFlowCandidateSource,
  FounderFlowStepExpectation,
} from './founder-flow-runtime-proof-types.js';
import type { RuntimeRouteReachabilityProofReport } from '../runtime-route-reachability-proof/runtime-route-reachability-proof-types.js';
import type { RuntimeUiRenderProofReport } from '../runtime-ui-render-proof/runtime-ui-render-proof-types.js';

function addCandidate(
  list: DiscoveredFounderFlowCandidate[],
  stepId: string,
  path: string | null,
  source: FounderFlowCandidateSource,
  expectation: FounderFlowStepExpectation,
  confidence: number,
): void {
  list.push({
    readOnly: true,
    stepId,
    path,
    source,
    expectation,
    confidence,
  });
}

function discoverFromVerificationContracts(
  rootDir: string,
  workspaceId: string,
  list: DiscoveredFounderFlowCandidate[],
): void {
  const contractPaths = [
    join(rootDir, 'architecture', 'verification-contracts', `${workspaceId}.json`),
    join(rootDir, 'architecture', 'verification-contracts', 'default.json'),
  ];
  for (const contractPath of contractPaths) {
    if (!existsSync(contractPath)) continue;
    try {
      const contract = JSON.parse(readFileSync(contractPath, 'utf8')) as {
        founderFlowSteps?: string[];
        resultEndpoint?: string;
      };
      for (const step of contract.founderFlowSteps ?? []) {
        addCandidate(list, step, null, 'VERIFICATION_CONTRACT', 'COMPLETE_FLOW', 0.85);
      }
      if (contract.resultEndpoint) {
        addCandidate(list, 'result-endpoint', contract.resultEndpoint, 'VERIFICATION_CONTRACT', 'DELIVER_RESULT', 0.9);
      }
    } catch {
      // ignore
    }
  }
}

export function discoverFounderFlowCandidates(input: {
  rootDir: string;
  workspaceId: string;
  routeReachabilityProof: RuntimeRouteReachabilityProofReport | null;
  uiRenderProof: RuntimeUiRenderProofReport | null;
}): readonly DiscoveredFounderFlowCandidate[] {
  const list: DiscoveredFounderFlowCandidate[] = [];

  addCandidate(list, 'open-runtime', '/', 'UI_RENDER_PROOF', 'OPEN_RUNTIME', 1);
  addCandidate(list, 'load-ui', '/', 'UI_RENDER_PROOF', 'LOAD_UI', 0.95);

  if (input.uiRenderProof?.probeSession.baseUrl) {
    addCandidate(list, 'ui-base-url', input.uiRenderProof.probeSession.baseUrl, 'UI_RENDER_PROOF', 'LOAD_UI', 0.9);
  }

  for (const route of input.routeReachabilityProof?.discoveredRoutes ?? []) {
    addCandidate(list, `route-${route.path}`, route.path, 'ROUTE_REACHABILITY_PROOF', 'OPEN_RUNTIME', route.confidence * 0.85);
  }

  for (const endpoint of FOUNDER_FLOW_RESULT_ENDPOINTS) {
    addCandidate(list, `endpoint-${endpoint}`, endpoint, 'RESULT_ENDPOINT', 'DELIVER_RESULT', 0.88);
  }

  addCandidate(list, 'result-store', null, 'RESULT_STORE', 'DELIVER_RESULT', 0.92);
  addCandidate(list, 'client-cache', null, 'CLIENT_CACHE', 'DELIVER_RESULT', 0.9);
  addCandidate(list, 'bridge-founder-flow', null, 'RUNTIME_BRIDGE', 'COMPLETE_FLOW', 0.75);

  discoverFromVerificationContracts(input.rootDir, input.workspaceId, list);

  return list;
}
