/**
 * Runtime Truth Authority V1 — capability manifest from routes and authority modules.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION } from '../build-intent-routing/build-intent-route-parity-v1.js';
import { CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION } from '../chat-to-build-execution-bridge-v1/bridge-types.js';
import {
  CANONICAL_ROUTE_DEFINITIONS,
  buildRouteContracts,
  type RouteContractDefinition,
} from './route-contract-registry.js';
import {
  CAPABILITY_MANIFEST_VERSION,
  RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
  type CapabilityDescriptor,
} from './rta-types.js';

export interface ModuleCapabilityDefinition {
  name: string;
  ownerModule: string;
  contractVersion: string;
  sourceFile: string;
  routeCapabilityName?: string;
}

export const MODULE_CAPABILITY_DEFINITIONS: ModuleCapabilityDefinition[] = [
  {
    name: 'brainRespond',
    ownerModule: 'command-center-brain',
    contractVersion: 'BRAIN_RESPOND_V1',
    sourceFile: 'server/brain-api-handler.ts',
    routeCapabilityName: 'brainRespond',
  },
  {
    name: 'brainHealth',
    ownerModule: 'local-runtime-launcher',
    contractVersion: 'BRAIN_HEALTH_V1',
    sourceFile: 'server/brain-api-handler.ts',
    routeCapabilityName: 'brainHealth',
  },
  {
    name: 'buildIntentClassification',
    ownerModule: 'build-intent-routing',
    contractVersion: BUILD_INTENT_ROUTE_PARITY_V1_CONTRACT_VERSION,
    sourceFile: 'src/build-intent-routing/index.ts',
    routeCapabilityName: 'buildIntentClassification',
  },
  {
    name: 'chatToBuildExecutionBridge',
    ownerModule: 'chat-to-build-execution-bridge-v1',
    contractVersion: CHAT_TO_BUILD_EXECUTION_BRIDGE_CONTRACT_VERSION,
    sourceFile: 'src/chat-to-build-execution-bridge-v1/index.ts',
    routeCapabilityName: 'chatToBuildExecutionBridge',
  },
  {
    name: 'buildFromPrompt',
    ownerModule: 'one-prompt-live-preview',
    contractVersion: 'ONE_PROMPT_BUILD_V1',
    sourceFile: 'server/build-from-prompt-handler.ts',
    routeCapabilityName: 'buildFromPrompt',
  },
  {
    name: 'projectRegistry',
    ownerModule: 'project-registry-v1',
    contractVersion: 'PROJECT_REGISTRY_V1',
    sourceFile: 'src/project-registry-v1/index.ts',
    routeCapabilityName: 'projectRegistry',
  },
  {
    name: 'projectNameConflictResolution',
    ownerModule: 'project-name-conflict-resolution-v1',
    contractVersion: 'PROJECT_NAME_CONFLICT_RESOLUTION_V1',
    sourceFile: 'src/project-name-conflict-resolution-v1/index.ts',
    routeCapabilityName: 'projectNameConflictResolution',
  },
  {
    name: 'projectLifecycleDelete',
    ownerModule: 'project-lifecycle-management-v1',
    contractVersion: 'PROJECT_LIFECYCLE_V1',
    sourceFile: 'src/project-lifecycle-management-v1/index.ts',
    routeCapabilityName: 'projectLifecycleDelete',
  },
  {
    name: 'projectLifecycleDuplicate',
    ownerModule: 'project-lifecycle-management-v1',
    contractVersion: 'PROJECT_LIFECYCLE_V1',
    sourceFile: 'src/project-lifecycle-management-v1/index.ts',
    routeCapabilityName: 'projectLifecycleDuplicate',
  },
  {
    name: 'projectLifecycleRestore',
    ownerModule: 'project-lifecycle-management-v1',
    contractVersion: 'PROJECT_LIFECYCLE_V1',
    sourceFile: 'src/project-lifecycle-management-v1/index.ts',
    routeCapabilityName: 'projectLifecycleRestore',
  },
  {
    name: 'projectOwnershipAudit',
    ownerModule: 'project-lifecycle-management-v1',
    contractVersion: 'PROJECT_LIFECYCLE_V1',
    sourceFile: 'src/project-lifecycle-management-v1/index.ts',
    routeCapabilityName: 'projectOwnershipAudit',
  },
  {
    name: 'aee',
    ownerModule: 'autonomous-engineering-executive',
    contractVersion: 'AEE_V1',
    sourceFile: 'src/autonomous-engineering-executive/index.ts',
  },
  {
    name: 'ael',
    ownerModule: 'autonomous-engineering-loop',
    contractVersion: 'AEL_V1',
    sourceFile: 'src/autonomous-engineering-loop/index.ts',
  },
  {
    name: 'engineeringIntelligence',
    ownerModule: 'engineering-intelligence-runtime',
    contractVersion: 'ENGINEERING_INTELLIGENCE_V1',
    sourceFile: 'src/engineering-intelligence-runtime/index.ts',
  },
  {
    name: 'safePaymentPlaceholderPolicy',
    ownerModule: 'safe-payment-placeholder-policy',
    contractVersion: 'SAFE_PAYMENT_PLACEHOLDER_V1',
    sourceFile: 'src/safe-payment-placeholder-policy/index.ts',
  },
  {
    name: 'autofixBuildRepair',
    ownerModule: 'adaptive-autofix-intelligence',
    contractVersion: 'AUTOFIX_V1',
    sourceFile: 'src/adaptive-autofix-intelligence/index.ts',
  },
  {
    name: 'previewRecovery',
    ownerModule: 'recovery-escalation-authority',
    contractVersion: 'PREVIEW_RECOVERY_V1',
    sourceFile: 'src/recovery-escalation-authority/index.ts',
  },
  {
    name: 'previewContract',
    ownerModule: 'aep-preview-gate-authority',
    contractVersion: 'PREVIEW_CONTRACT_V1',
    sourceFile: 'src/aep-preview-gate-authority/index.ts',
  },
  {
    name: 'missingCapabilityRuntime',
    ownerModule: 'missing-capability-evolution-engine',
    contractVersion: 'MISSING_CAPABILITY_V1',
    sourceFile: 'src/missing-capability-evolution-engine/index.ts',
  },
  {
    name: 'founderTest',
    ownerModule: 'founder-testing-mode',
    contractVersion: 'FOUNDER_TEST_V1',
    sourceFile: 'server/founder-testing-handler.ts',
    routeCapabilityName: 'founderTest',
  },
  {
    name: 'livePreview',
    ownerModule: 'live-preview-runtime',
    contractVersion: 'LIVE_PREVIEW_V1',
    sourceFile: 'src/live-preview-runtime/index.ts',
    routeCapabilityName: 'livePreview',
  },
  {
    name: 'restartResilience',
    ownerModule: 'command-center-restart-resilience',
    contractVersion: 'RESTART_RESILIENCE_V1',
    sourceFile: 'src/command-center-restart-resilience/index.ts',
  },
  {
    name: 'commandCenterStaleProjectPurge',
    ownerModule: 'command-center-stale-project-purge',
    contractVersion: 'STALE_PROJECT_PURGE_V1',
    sourceFile: 'src/command-center-stale-project-purge/index.ts',
  },
  {
    name: 'runtimeTruth',
    ownerModule: 'runtime-truth-authority',
    contractVersion: RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
    sourceFile: 'src/runtime-truth-authority/index.ts',
    routeCapabilityName: 'runtimeTruth',
  },
  {
    name: 'runtimeAuthority',
    ownerModule: 'autonomous-runtime-authority-v1',
    contractVersion: 'AUTONOMOUS_RUNTIME_AUTHORITY_V1',
    sourceFile: 'src/autonomous-runtime-authority-v1/index.ts',
    routeCapabilityName: 'runtimeAuthority',
  },
];

function resolveRouteDefinition(name: string): RouteContractDefinition | undefined {
  return CANONICAL_ROUTE_DEFINITIONS.find((definition) => definition.capabilityName === name);
}

export function buildCapabilityManifest(rootDir: string): CapabilityDescriptor[] {
  const routeContracts = buildRouteContracts();
  return MODULE_CAPABILITY_DEFINITIONS.map((definition) => {
    const sourceExists = existsSync(join(rootDir, definition.sourceFile));
    const routeDefinition = definition.routeCapabilityName
      ? resolveRouteDefinition(definition.routeCapabilityName)
      : undefined;
    const routeContract = routeDefinition
      ? routeContracts.find(
          (contract) => contract.path === routeDefinition.path && contract.method === routeDefinition.method,
        )
      : undefined;
    const routeRegistered = routeContract?.registeredAtBoot === true;
    const enabled = sourceExists && (routeDefinition ? routeRegistered : true);
    return {
      name: definition.name,
      enabled,
      route: routeDefinition?.path ?? null,
      method: routeDefinition?.method ?? null,
      contractVersion: definition.contractVersion,
      ownerModule: definition.ownerModule,
      registeredAtBoot: routeDefinition ? routeRegistered : sourceExists,
      sourceFile: definition.sourceFile,
    };
  });
}

export function getCapabilityManifestVersion(): typeof CAPABILITY_MANIFEST_VERSION {
  return CAPABILITY_MANIFEST_VERSION;
}

export function isCapabilityRegistered(name: string, rootDir: string): boolean {
  return buildCapabilityManifest(rootDir).some((capability) => capability.name === name && capability.enabled);
}
