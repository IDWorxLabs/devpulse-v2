/**
 * Runtime Truth Authority V1 — canonical route contract registry.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RUNTIME_AUTHORITY_V1_CONTRACT_VERSION } from '../autonomous-runtime-authority-v1/runtime-authority-types.js';
import { BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION } from '../build-intent-routing/build-intent-route-parity-v1.js';
import { CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION } from '../chat-to-build-execution-bridge-v1/bridge-types.js';
import {
  ROUTE_CONTRACTS_VERSION,
  RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
  type RouteContract,
} from './rta-types.js';

export interface RouteContractDefinition {
  path: string;
  method: string;
  owner: string;
  contractVersion: string;
  capabilityName: string;
}

export const CANONICAL_ROUTE_DEFINITIONS: RouteContractDefinition[] = [
  {
    path: '/api/brain/respond',
    method: 'POST',
    owner: 'brain-api-handler',
    contractVersion: 'BRAIN_RESPOND_V1',
    capabilityName: 'brainRespond',
  },
  {
    path: '/api/brain/health',
    method: 'GET',
    owner: 'brain-api-handler',
    contractVersion: 'BRAIN_HEALTH_V1',
    capabilityName: 'brainHealth',
  },
  {
    path: '/api/brain/classify-build-intent',
    method: 'POST',
    owner: 'brain-api-handler',
    contractVersion: BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION,
    capabilityName: 'buildIntentClassification',
  },
  {
    path: '/api/chat-to-build/execute',
    method: 'POST',
    owner: 'chat-to-build-execution-bridge-v1',
    contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
    capabilityName: 'chatToBuildExecutionBridge',
  },
  {
    path: '/api/build/from-prompt',
    method: 'POST',
    owner: 'build-from-prompt-handler',
    contractVersion: 'ONE_PROMPT_BUILD_V1',
    capabilityName: 'buildFromPrompt',
  },
  {
    path: '/api/build/live-preview',
    method: 'GET',
    owner: 'build-from-prompt-handler',
    contractVersion: 'LIVE_PREVIEW_V1',
    capabilityName: 'livePreview',
  },
  {
    path: '/api/projects/registry',
    method: 'GET',
    owner: 'project-api-router',
    contractVersion: 'PROJECT_REGISTRY_V1',
    capabilityName: 'projectRegistry',
  },
  {
    path: '/api/projects/delete',
    method: 'POST',
    owner: 'project-api-router',
    contractVersion: 'PROJECT_LIFECYCLE_V1',
    capabilityName: 'projectLifecycleDelete',
  },
  {
    path: '/api/projects/duplicate',
    method: 'POST',
    owner: 'project-api-router',
    contractVersion: 'PROJECT_LIFECYCLE_V1',
    capabilityName: 'projectLifecycleDuplicate',
  },
  {
    path: '/api/projects/restore',
    method: 'POST',
    owner: 'project-api-router',
    contractVersion: 'PROJECT_LIFECYCLE_V1',
    capabilityName: 'projectLifecycleRestore',
  },
  {
    path: '/api/projects/cleanup-test-projects',
    method: 'POST',
    owner: 'project-api-router',
    contractVersion: 'AUDIT_PROJECT_ISOLATION_V1',
    capabilityName: 'projectRegistry',
  },
  {
    path: '/api/projects/resolve-name-conflict',
    method: 'POST',
    owner: 'project-name-conflict-handler',
    contractVersion: 'PROJECT_NAME_CONFLICT_RESOLUTION_V1',
    capabilityName: 'projectNameConflictResolution',
  },
  {
    path: '/api/projects/lifecycle/ownership-audit',
    method: 'GET',
    owner: 'project-lifecycle-handler',
    contractVersion: 'PROJECT_LIFECYCLE_V1',
    capabilityName: 'projectOwnershipAudit',
  },
  {
    path: '/api/founder-test/run',
    method: 'POST',
    owner: 'founder-testing-handler',
    contractVersion: 'FOUNDER_TEST_V1',
    capabilityName: 'founderTest',
  },
  {
    path: '/api/founder-test/runtime-status',
    method: 'GET',
    owner: 'founder-testing-handler',
    contractVersion: 'FOUNDER_TEST_V1',
    capabilityName: 'founderTest',
  },
  {
    path: '/api/runtime/truth',
    method: 'GET',
    owner: 'runtime-truth-authority',
    contractVersion: RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
    capabilityName: 'runtimeTruth',
  },
  {
    path: '/api/runtime/authority',
    method: 'GET',
    owner: 'autonomous-runtime-authority',
    contractVersion: RUNTIME_AUTHORITY_V1_CONTRACT_VERSION,
    capabilityName: 'runtimeAuthority',
  },
];

export const REQUIRED_PRODUCTION_ROUTE_DEFINITIONS: RouteContractDefinition[] = [
  CANONICAL_ROUTE_DEFINITIONS.find((route) => route.capabilityName === 'buildIntentClassification')!,
  CANONICAL_ROUTE_DEFINITIONS.find((route) => route.capabilityName === 'brainRespond')!,
  CANONICAL_ROUTE_DEFINITIONS.find((route) => route.capabilityName === 'brainHealth')!,
  CANONICAL_ROUTE_DEFINITIONS.find((route) => route.capabilityName === 'runtimeTruth')!,
];

let bootRegisteredPaths = new Set<string>();

function routeKey(path: string, method: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export function registerBootRouteContracts(definitions: RouteContractDefinition[]): void {
  bootRegisteredPaths = new Set(definitions.map((definition) => routeKey(definition.path, definition.method)));
}

export function resetBootRouteContractsForTests(): void {
  bootRegisteredPaths = new Set();
}

export function buildRouteContracts(): RouteContract[] {
  return CANONICAL_ROUTE_DEFINITIONS.map((definition) => {
    const registeredAtBoot = bootRegisteredPaths.has(routeKey(definition.path, definition.method));
    return {
      path: definition.path,
      method: definition.method,
      owner: definition.owner,
      contractVersion: definition.contractVersion,
      enabled: registeredAtBoot,
      registeredAtBoot,
    };
  });
}

export function getKnownMethodsForPath(path: string): string[] {
  return CANONICAL_ROUTE_DEFINITIONS.filter((definition) => definition.path === path).map(
    (definition) => definition.method,
  );
}

export function getMissingRequiredRouteContracts(): RouteContract[] {
  return buildRouteContracts().filter(
    (contract) =>
      REQUIRED_PRODUCTION_ROUTE_DEFINITIONS.some(
        (required) => required.path === contract.path && required.method === contract.method,
      ) && !contract.registeredAtBoot,
  );
}

export function getRouteContractsVersion(): typeof ROUTE_CONTRACTS_VERSION {
  return ROUTE_CONTRACTS_VERSION;
}

/** Detect which canonical routes are registered in server source at boot. */
export function detectRegisteredRoutesFromServerSource(rootDir: string): RouteContractDefinition[] {
  const serverPath = join(rootDir, 'server/founder-reality-server.ts');
  const projectRouterPath = join(rootDir, 'server/project-api-router.ts');
  const projectRegistryPath = join(rootDir, 'server/project-registry-handler.ts');
  const serverContent = existsSync(serverPath) ? readFileSync(serverPath, 'utf8') : '';
  const projectRouterContent = existsSync(projectRouterPath) ? readFileSync(projectRouterPath, 'utf8') : '';
  const projectRegistryContent = existsSync(projectRegistryPath) ? readFileSync(projectRegistryPath, 'utf8') : '';
  const usesProjectApiRouter = serverContent.includes('tryHandleProjectApiRequest');

  return CANONICAL_ROUTE_DEFINITIONS.filter((definition) => {
    const pathLiteral = `'${definition.path}'`;
    const altLiteral = `"${definition.path}"`;
    if (serverContent.includes(`urlPath === ${pathLiteral}`) || serverContent.includes(`urlPath === ${altLiteral}`)) {
      return true;
    }
    if (usesProjectApiRouter && projectRouterContent.includes(pathLiteral)) {
      return true;
    }
    if (usesProjectApiRouter && projectRegistryContent.includes(pathLiteral)) {
      return true;
    }
    return false;
  });
}
