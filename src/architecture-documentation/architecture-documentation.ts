/**
 * Architecture Documentation — orchestration and read-only integrations.
 * Architecture documentation intelligence only. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import {
  ALL_UVL_ROWS,
  listArchitectureDocumentationUvlRows,
} from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2SelfDocumentation } from '../self-documentation/index.js';
import { getDevPulseV2FounderGuides } from '../founder-guides/index.js';
import { getDevPulseV2UserGuides } from '../user-guides/index.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { getDevPulseV2MobileCommandRuntimeFoundation } from '../mobile-command-runtime/index.js';
import { getDevPulseV2CloudRuntimeFoundation } from '../cloud-runtime/index.js';
import { getDevPulseV2ProjectVaultAuthority } from '../project-vault/project-vault-authority.js';
import type {
  ArchitectureDocumentationInput,
  ArchitectureDocumentationRecord,
  ArchitectureDocumentationResult,
  ArchitectureDocumentationRuntimeReport,
} from './architecture-documentation-types.js';
import {
  ARCHITECTURE_DOCUMENTATION_OWNER_MODULE,
  ARCHITECTURE_DOCUMENTATION_PASS_TOKEN,
} from './architecture-documentation-types.js';
import { analyzeDomainArchitecture, getDomainAnalysisCount } from './domain-architecture-analyzer.js';
import { analyzeDependencyGraph, getDependencyAnalysisCount } from './dependency-graph-analyzer.js';
import { analyzeIntegrationPoints, getIntegrationAnalysisCount } from './integration-point-analyzer.js';
import { analyzeArchitectureBoundaries, getBoundaryAnalysisCount } from './architecture-boundary-analyzer.js';
import {
  analyzeAuthorityChainArchitecture,
  getAuthorityAnalysisCount,
} from './authority-chain-architecture-analyzer.js';
import {
  buildUnifiedArchitectureDocumentationAuthority,
  getAuthorityBuildCount,
} from './architecture-documentation-authority-builder.js';
import {
  evaluateArchitectureDocumentation,
  getEvaluationCount,
} from './architecture-documentation-evaluator.js';
import {
  registerArchitectureDocumentationRecord,
  getArchitectureDocumentationRecordCount,
} from './architecture-documentation-registry.js';
import { recordArchitectureDocumentationHistory } from './architecture-documentation-history.js';
import { generateArchitectureDocumentationReport } from './architecture-documentation-reporting.js';
import { getArchitectureDocumentationCacheStats } from './architecture-documentation-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';
const PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN = 'PRODUCT_HARDENING_VERIFICATION_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface ArchitectureDocumentationSystemSnapshot {
  centralBrainSystems: number;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  validationScripts: number;
  selfDocumentationToken: string;
  founderGuidesToken: string;
  userGuidesToken: string;
  unifiedTrustScoreToken: string;
  trustEngineCheckpointToken: string;
  productHardeningCheckpointToken: string;
  world2Token: string;
  mobileCommandToken: string;
  cloudWorkerRuntimeToken: string;
  projectVaultProjectCount: number;
  selfEvolutionGovernanceToken: string;
  missingCapabilityEscalationToken: string;
  registeredAt: number;
}

let cachedSnapshot: ArchitectureDocumentationSystemSnapshot | null = null;
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

export function getDevPulseV2ArchitectureDocumentation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: ARCHITECTURE_DOCUMENTATION_OWNER_MODULE,
    passToken: ARCHITECTURE_DOCUMENTATION_PASS_TOKEN,
    phase: 24.4,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerArchitectureDocumentationWithCentralBrain(): ArchitectureDocumentationSystemSnapshot {
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
    unifiedTrustScoreToken: getDevPulseV2UnifiedTrustScore().passToken,
    trustEngineCheckpointToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN,
    productHardeningCheckpointToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    mobileCommandToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken,
    cloudWorkerRuntimeToken: getDevPulseV2CloudRuntimeFoundation().passToken,
    projectVaultProjectCount: vaultState.projectCount,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerArchitectureDocumentationWithSelfDocumentation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfDocumentation().passToken, readOnly: true };
}

export function registerArchitectureDocumentationWithFounderGuides(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FounderGuides().passToken, readOnly: true };
}

export function registerArchitectureDocumentationWithUserGuides(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UserGuides().passToken, readOnly: true };
}

export function registerArchitectureDocumentationWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerArchitectureDocumentationWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerArchitectureDocumentationWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerArchitectureDocumentationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listArchitectureDocumentationUvlRows().length, readOnly: true };
}

export function registerArchitectureDocumentationWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerArchitectureDocumentationWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerArchitectureDocumentationWithProductHardeningCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN, readOnly: true };
}

export function registerArchitectureDocumentationWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerArchitectureDocumentationWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerArchitectureDocumentationWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function registerArchitectureDocumentationWithProjectVault(): { projectCount: number; readOnly: true } {
  return {
    projectCount: getDevPulseV2ProjectVaultAuthority().getVaultState().projectCount,
    readOnly: true,
  };
}

export function registerArchitectureDocumentationWithMobileCommand(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MobileCommandRuntimeFoundation().passToken, readOnly: true };
}

export function registerArchitectureDocumentationWithCloudWorkerRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2CloudRuntimeFoundation().passToken, readOnly: true };
}

export function evaluateArchitectureDocumentationEngine(
  input: ArchitectureDocumentationInput,
): ArchitectureDocumentationResult {
  const snapshot = registerArchitectureDocumentationWithCentralBrain();

  const domain = analyzeDomainArchitecture(input, {
    foundationDomainCount: snapshot.foundationDomains,
    capabilityDomainCount: snapshot.capabilityEntries,
    documentationDomainCount: 3,
  });
  const dependency = analyzeDependencyGraph(input, {
    moduleDependencyCount: snapshot.centralBrainSystems,
    capabilityDependencyCount: snapshot.capabilityEntries,
    validationDependencyCount: snapshot.validationScripts,
  });
  const integration = analyzeIntegrationPoints(input, {
    registryIntegrationCount: snapshot.foundationDomains,
    uvlIntegrationCount: snapshot.uvlRows,
    validationIntegrationCount: snapshot.validationScripts,
    hasWorld2Integration: snapshot.world2Token.length > 0,
    hasMobileIntegration: snapshot.mobileCommandToken.length > 0,
    hasCloudIntegration: snapshot.cloudWorkerRuntimeToken.length > 0,
  });
  const boundary = analyzeArchitectureBoundaries(input, {
    hasReadOnlyBoundaries: true,
    hasGovernanceBoundaries: snapshot.selfEvolutionGovernanceToken.length > 0,
    hasWorld2Boundaries: snapshot.world2Token.length > 0,
    hasMobileBoundaries: snapshot.mobileCommandToken.length > 0,
  });
  const authorityChain = analyzeAuthorityChainArchitecture(input, {
    hasTrustEngineChain: snapshot.trustEngineCheckpointToken.length > 0,
    hasProductHardeningChain: snapshot.productHardeningCheckpointToken.length > 0,
    hasDocumentationChain: snapshot.selfDocumentationToken.length > 0,
    hasGovernanceChains: snapshot.selfEvolutionGovernanceToken.length > 0,
  });

  const authority = buildUnifiedArchitectureDocumentationAuthority(
    input.requestId,
    domain,
    dependency,
    integration,
    boundary,
    authorityChain,
    input,
  );
  const evaluation = evaluateArchitectureDocumentation(authority);

  recordCounter += 1;
  const record: ArchitectureDocumentationRecord = {
    documentationId: `architecture-documentation-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    coverageLevel: evaluation.coverageLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    architectureCoverageScore: evaluation.architectureCoverageScore,
    dependencyCoverageScore: evaluation.dependencyCoverageScore,
    integrationCoverageScore: evaluation.integrationCoverageScore,
    generatedAt: Date.now(),
  };

  registerArchitectureDocumentationRecord(record);
  recordArchitectureDocumentationHistory(record);

  const missingSignals: string[] = [];
  if (domain.undocumentedDomains.length > 0) missingSignals.push('undocumented_domains');
  if (dependency.undocumentedDependencies.length > 0) missingSignals.push('undocumented_dependencies');
  if (integration.undocumentedIntegrations.length > 0) missingSignals.push('undocumented_integrations');
  if (boundary.undocumentedBoundaries.length > 0) missingSignals.push('undocumented_boundaries');
  if (authorityChain.undocumentedAuthorityChains.length > 0) missingSignals.push('undocumented_authority_chains');

  const report = generateArchitectureDocumentationReport(
    record,
    evaluation,
    domain,
    dependency,
    integration,
    boundary,
    authorityChain,
    missingSignals,
  );

  return { record, report };
}

export function getArchitectureDocumentationRuntimeReport(): ArchitectureDocumentationRuntimeReport {
  const cache = getArchitectureDocumentationCacheStats();
  return {
    domainAnalysisCount: getDomainAnalysisCount(),
    dependencyAnalysisCount: getDependencyAnalysisCount(),
    integrationAnalysisCount: getIntegrationAnalysisCount(),
    boundaryAnalysisCount: getBoundaryAnalysisCount(),
    authorityAnalysisCount: getAuthorityAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getArchitectureDocumentationRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetArchitectureDocumentationOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
