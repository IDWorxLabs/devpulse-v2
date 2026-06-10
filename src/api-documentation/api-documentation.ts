/**
 * API Documentation — orchestration and read-only integrations.
 * API documentation intelligence only. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listApiDocumentationUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2SelfDocumentation } from '../self-documentation/index.js';
import { getDevPulseV2FounderGuides } from '../founder-guides/index.js';
import { getDevPulseV2UserGuides } from '../user-guides/index.js';
import { getDevPulseV2ArchitectureDocumentation } from '../architecture-documentation/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { getDevPulseV2MobileCommandRuntimeFoundation } from '../mobile-command-runtime/index.js';
import { getDevPulseV2CloudRuntimeFoundation } from '../cloud-runtime/index.js';
import { getDevPulseV2FounderInboxFoundation } from '../founder-inbox/index.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import type {
  ApiDocumentationInput,
  ApiDocumentationRecord,
  ApiDocumentationResult,
  ApiDocumentationRuntimeReport,
} from './api-documentation-types.js';
import {
  API_DOCUMENTATION_OWNER_MODULE,
  API_DOCUMENTATION_PASS_TOKEN,
} from './api-documentation-types.js';
import { analyzeApiSurface, getApiSurfaceAnalysisCount } from './api-surface-analyzer.js';
import { analyzeInterfaceDocumentation, getInterfaceAnalysisCount } from './interface-documentation-analyzer.js';
import { analyzeContractDocumentation, getContractAnalysisCount } from './contract-documentation-analyzer.js';
import { analyzeIntegrationApis, getIntegrationAnalysisCount } from './integration-api-analyzer.js';
import { analyzeCommandSurface, getCommandAnalysisCount } from './command-surface-analyzer.js';
import { buildUnifiedApiDocumentationAuthority, getAuthorityBuildCount } from './api-documentation-authority-builder.js';
import { evaluateApiDocumentation, getEvaluationCount } from './api-documentation-evaluator.js';
import {
  registerApiDocumentationRecord,
  getApiDocumentationRecordCount,
} from './api-documentation-registry.js';
import { recordApiDocumentationHistory } from './api-documentation-history.js';
import { generateApiDocumentationReport } from './api-documentation-reporting.js';
import { getApiDocumentationCacheStats } from './api-documentation-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';
const PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN = 'PRODUCT_HARDENING_VERIFICATION_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface ApiDocumentationSystemSnapshot {
  centralBrainSystems: number;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  validationScripts: number;
  selfDocumentationToken: string;
  founderGuidesToken: string;
  userGuidesToken: string;
  architectureDocumentationToken: string;
  trustEngineCheckpointToken: string;
  productHardeningCheckpointToken: string;
  world2Token: string;
  mobileCommandToken: string;
  cloudWorkerRuntimeToken: string;
  notificationToken: string;
  projectVaultProjectCount: number;
  selfEvolutionGovernanceToken: string;
  missingCapabilityEscalationToken: string;
  registeredAt: number;
}

let cachedSnapshot: ApiDocumentationSystemSnapshot | null = null;
let bootstrapReuseCount = 0;
let recordCounter = 0;

function countValidationScripts(): number {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { scripts?: Record<string, string> };
    return Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')).length;
  } catch {
    return 0;
  }
}

export function getDevPulseV2ApiDocumentation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: API_DOCUMENTATION_OWNER_MODULE,
    passToken: API_DOCUMENTATION_PASS_TOKEN,
    phase: 24.5,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerApiDocumentationWithCentralBrain(): ApiDocumentationSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const vaultState = getDevPulseV2ProjectVaultAuthority().getVaultState();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    validationScripts: countValidationScripts(),
    selfDocumentationToken: getDevPulseV2SelfDocumentation().passToken,
    founderGuidesToken: getDevPulseV2FounderGuides().passToken,
    userGuidesToken: getDevPulseV2UserGuides().passToken,
    architectureDocumentationToken: getDevPulseV2ArchitectureDocumentation().passToken,
    trustEngineCheckpointToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN,
    productHardeningCheckpointToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    mobileCommandToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken,
    cloudWorkerRuntimeToken: getDevPulseV2CloudRuntimeFoundation().passToken,
    notificationToken: getDevPulseV2FounderInboxFoundation().passToken,
    projectVaultProjectCount: vaultState.projectCount,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerApiDocumentationWithSelfDocumentation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfDocumentation().passToken, readOnly: true };
}

export function registerApiDocumentationWithFounderGuides(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderGuides().passToken, readOnly: true };
}

export function registerApiDocumentationWithUserGuides(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UserGuides().passToken, readOnly: true };
}

export function registerApiDocumentationWithArchitectureDocumentation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ArchitectureDocumentation().passToken, readOnly: true };
}

export function registerApiDocumentationWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerApiDocumentationWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerApiDocumentationWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerApiDocumentationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listApiDocumentationUvlRows().length, readOnly: true };
}

export function registerApiDocumentationWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerApiDocumentationWithProductHardeningCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN, readOnly: true };
}

export function registerApiDocumentationWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerApiDocumentationWithMobileCommand(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken, readOnly: true };
}

export function registerApiDocumentationWithCloudWorkerRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CloudRuntimeFoundation().passToken, readOnly: true };
}

export function registerApiDocumentationWithNotificationSystems(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderInboxFoundation().passToken, readOnly: true };
}

export function registerApiDocumentationWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerApiDocumentationWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerApiDocumentationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function evaluateApiDocumentationEngine(input: ApiDocumentationInput): ApiDocumentationResult {
  const snapshot = registerApiDocumentationWithCentralBrain();

  const apiSurface = analyzeApiSurface(input, {
    publicApiCount: snapshot.capabilityEntries,
    serviceApiCount: snapshot.centralBrainSystems,
    validationApiCount: snapshot.validationScripts,
  });
  const interfaces = analyzeInterfaceDocumentation(input, {
    publicInterfaceCount: snapshot.capabilityEntries,
    moduleInterfaceCount: snapshot.foundationDomains,
    authorityInterfaceCount: snapshot.foundationDomains,
  });
  const contracts = analyzeContractDocumentation(input, {
    inputContractCount: snapshot.capabilityEntries,
    outputContractCount: snapshot.foundationDomains,
    typeContractCount: snapshot.uvlRows,
  });
  const integration = analyzeIntegrationApis(input, {
    registryIntegrationCount: snapshot.foundationDomains,
    uvlIntegrationCount: snapshot.uvlRows,
    hasWorld2Integration: snapshot.world2Token.length > 0,
    hasMobileIntegration: snapshot.mobileCommandToken.length > 0,
    hasCloudIntegration: snapshot.cloudWorkerRuntimeToken.length > 0,
    hasNotificationIntegration: snapshot.notificationToken.length > 0,
  });
  const commands = analyzeCommandSurface(input, {
    validationCommandCount: snapshot.validationScripts,
    orchestrationCommandCount: snapshot.centralBrainSystems,
    reportingCommandCount: 5,
  });

  const authority = buildUnifiedApiDocumentationAuthority(
    input.requestId,
    apiSurface,
    interfaces,
    contracts,
    integration,
    commands,
    input,
  );
  const evaluation = evaluateApiDocumentation(authority);

  recordCounter += 1;
  const record: ApiDocumentationRecord = {
    documentationId: `api-documentation-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    coverageLevel: evaluation.coverageLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    apiCoverageScore: evaluation.apiCoverageScore,
    interfaceCoverageScore: evaluation.interfaceCoverageScore,
    integrationCoverageScore: evaluation.integrationCoverageScore,
    generatedAt: Date.now(),
  };

  registerApiDocumentationRecord(record);
  recordApiDocumentationHistory(record);

  const missingSignals: string[] = [];
  if (apiSurface.undocumentedApis.length > 0) missingSignals.push('undocumented_apis');
  if (interfaces.undocumentedInterfaces.length > 0) missingSignals.push('undocumented_interfaces');
  if (contracts.undocumentedContracts.length > 0) missingSignals.push('undocumented_contracts');
  if (integration.undocumentedIntegrations.length > 0) missingSignals.push('undocumented_integrations');
  if (commands.undocumentedCommands.length > 0) missingSignals.push('undocumented_commands');

  const report = generateApiDocumentationReport(
    record,
    evaluation,
    apiSurface,
    interfaces,
    contracts,
    integration,
    commands,
    missingSignals,
  );

  return { record, report };
}

export function getApiDocumentationRuntimeReport(): ApiDocumentationRuntimeReport {
  const cache = getApiDocumentationCacheStats();
  return {
    apiSurfaceAnalysisCount: getApiSurfaceAnalysisCount(),
    interfaceAnalysisCount: getInterfaceAnalysisCount(),
    contractAnalysisCount: getContractAnalysisCount(),
    integrationAnalysisCount: getIntegrationAnalysisCount(),
    commandAnalysisCount: getCommandAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getApiDocumentationRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetApiDocumentationOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
