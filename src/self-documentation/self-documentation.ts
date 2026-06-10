/**
 * Self Documentation — orchestration and read-only integrations.
 * Documentation intelligence only. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listSelfDocumentationUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { getDevPulseV2ReliabilityHardening } from '../reliability-hardening/index.js';
import { getDevPulseV2PerformanceHardening } from '../performance-hardening/index.js';
import { getDevPulseV2SecurityHardening } from '../security-hardening/index.js';
import { getDevPulseV2PrivacyHardening } from '../privacy-hardening/index.js';
import { getDevPulseV2RecoveryHardening } from '../recovery-hardening/index.js';
import { getDevPulseV2ScaleHardening } from '../scale-hardening/index.js';
import { DevPulseV2ProjectVaultIntelligence } from '../project-vault-intelligence/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import type {
  SelfDocumentationInput,
  SelfDocumentationRecord,
  SelfDocumentationResult,
  SelfDocumentationRuntimeReport,
} from './self-documentation-types.js';
import {
  SELF_DOCUMENTATION_OWNER_MODULE,
  SELF_DOCUMENTATION_PASS_TOKEN,
} from './self-documentation-types.js';
import {
  analyzeCapabilityDocumentation,
  getCapabilityAnalysisCount,
} from './capability-documentation-analyzer.js';
import {
  analyzeModuleDocumentation,
  getModuleAnalysisCount,
} from './module-documentation-analyzer.js';
import {
  analyzeDependencyDocumentation,
  getDependencyAnalysisCount,
  listBaseDependencies,
} from './dependency-documentation-analyzer.js';
import {
  analyzeAuthorityChainDocumentation,
  getAuthorityAnalysisCount,
  listBaseAuthorityChains,
} from './authority-chain-documentation-analyzer.js';
import {
  analyzeValidationDocumentation,
  getValidationAnalysisCount,
} from './validation-documentation-analyzer.js';
import {
  buildUnifiedSelfDocumentationAuthority,
  getAuthorityBuildCount,
} from './self-documentation-authority-builder.js';
import { evaluateSelfDocumentation, getEvaluationCount } from './self-documentation-evaluator.js';
import {
  registerSelfDocumentationRecord,
  getSelfDocumentationRecordCount,
} from './self-documentation-registry.js';
import { recordSelfDocumentationHistory } from './self-documentation-history.js';
import { generateSelfDocumentationReport } from './self-documentation-reporting.js';
import { getSelfDocumentationCacheStats } from './self-documentation-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';
const PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN = 'PRODUCT_HARDENING_VERIFICATION_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface SelfDocumentationSystemSnapshot {
  centralBrainSystems: number;
  foundationDomains: number;
  capabilityEntries: number;
  capabilityIds: string[];
  findPanelAliases: number;
  uvlRows: number;
  validationScripts: number;
  checkpointCount: number;
  unifiedTrustScoreToken: string;
  trustEngineCheckpointToken: string;
  productHardeningCheckpointToken: string;
  reliabilityHardeningToken: string;
  performanceHardeningToken: string;
  securityHardeningToken: string;
  privacyHardeningToken: string;
  recoveryHardeningToken: string;
  scaleHardeningToken: string;
  projectVaultToken: string;
  world2Token: string;
  selfEvolutionGovernanceToken: string;
  missingCapabilityEscalationToken: string;
  documentedAuthorityChains: string[];
  knownDependencies: string[];
  registeredAt: number;
}

let cachedSnapshot: SelfDocumentationSystemSnapshot | null = null;
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

function countCheckpoints(scripts: Record<string, string> | undefined): number {
  if (!scripts) return 0;
  return Object.keys(scripts).filter((k) => k.includes('checkpoint') || k.includes('verification')).length;
}

export function getDevPulseV2SelfDocumentation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: SELF_DOCUMENTATION_OWNER_MODULE,
    passToken: SELF_DOCUMENTATION_PASS_TOKEN,
    phase: 24.1,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerSelfDocumentationWithCentralBrain(): SelfDocumentationSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { scripts?: Record<string, string> };
  const validationScripts = countValidationScripts();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    capabilityIds: INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId),
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    validationScripts,
    checkpointCount: countCheckpoints(pkg.scripts),
    unifiedTrustScoreToken: getDevPulseV2UnifiedTrustScore().passToken,
    trustEngineCheckpointToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN,
    productHardeningCheckpointToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN,
    reliabilityHardeningToken: getDevPulseV2ReliabilityHardening().passToken,
    performanceHardeningToken: getDevPulseV2PerformanceHardening().passToken,
    securityHardeningToken: getDevPulseV2SecurityHardening().passToken,
    privacyHardeningToken: getDevPulseV2PrivacyHardening().passToken,
    recoveryHardeningToken: getDevPulseV2RecoveryHardening().passToken,
    scaleHardeningToken: getDevPulseV2ScaleHardening().passToken,
    projectVaultToken: DevPulseV2ProjectVaultIntelligence.passToken,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    documentedAuthorityChains: [...listBaseAuthorityChains()],
    knownDependencies: [...listBaseDependencies()],
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerSelfDocumentationWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerSelfDocumentationWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerSelfDocumentationWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerSelfDocumentationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listSelfDocumentationUvlRows().length, readOnly: true };
}

export function registerSelfDocumentationWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerSelfDocumentationWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerSelfDocumentationWithProductHardeningCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN, readOnly: true };
}

export function registerSelfDocumentationWithReliabilityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ReliabilityHardening().passToken, readOnly: true };
}

export function registerSelfDocumentationWithPerformanceHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2PerformanceHardening().passToken, readOnly: true };
}

export function registerSelfDocumentationWithSecurityHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SecurityHardening().passToken, readOnly: true };
}

export function registerSelfDocumentationWithPrivacyHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2PrivacyHardening().passToken, readOnly: true };
}

export function registerSelfDocumentationWithRecoveryHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2RecoveryHardening().passToken, readOnly: true };
}

export function registerSelfDocumentationWithScaleHardening(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2ScaleHardening().passToken, readOnly: true };
}

export function registerSelfDocumentationWithProjectVault(): { passToken: string; readOnly: true } {
  return { passToken: DevPulseV2ProjectVaultIntelligence.passToken, readOnly: true };
}

export function registerSelfDocumentationWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerSelfDocumentationWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerSelfDocumentationWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function evaluateSelfDocumentationEngine(input: SelfDocumentationInput): SelfDocumentationResult {
  const snapshot = registerSelfDocumentationWithCentralBrain();

  const capability = analyzeCapabilityDocumentation(input, {
    capabilityCount: snapshot.capabilityEntries,
    capabilityIds: snapshot.capabilityIds,
    aliasCount: snapshot.findPanelAliases,
  });
  const module = analyzeModuleDocumentation(input, {
    moduleCount: snapshot.foundationDomains,
    moduleDomains: listDevPulseV2Owners().map((o) => o.domain),
  });
  const dependency = analyzeDependencyDocumentation(input, {
    knownDependencies: snapshot.knownDependencies,
  });
  const authorityChain = analyzeAuthorityChainDocumentation(input, {
    documentedChains: snapshot.documentedAuthorityChains,
  });
  const validation = analyzeValidationDocumentation(input, {
    validationScriptCount: snapshot.validationScripts,
    checkpointCount: snapshot.checkpointCount,
    uvlRowCount: snapshot.uvlRows,
  });

  const authority = buildUnifiedSelfDocumentationAuthority(
    input.requestId,
    capability,
    module,
    dependency,
    authorityChain,
    validation,
    input,
  );
  const evaluation = evaluateSelfDocumentation(authority);

  recordCounter += 1;
  const record: SelfDocumentationRecord = {
    documentationId: `self-documentation-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    completenessLevel: evaluation.completenessLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    documentationCoverageScore: evaluation.documentationCoverageScore,
    capabilityCoverageScore: evaluation.capabilityCoverageScore,
    dependencyCoverageScore: evaluation.dependencyCoverageScore,
    generatedAt: Date.now(),
  };

  registerSelfDocumentationRecord(record);
  recordSelfDocumentationHistory(record);

  const missingSignals: string[] = [];
  if (capability.undocumentedCapabilities.length > 0) {
    missingSignals.push('undocumented_capabilities');
  }
  if (module.undocumentedModules.length > 0) {
    missingSignals.push('undocumented_modules');
  }
  if (dependency.undocumentedDependencies.length > 0) {
    missingSignals.push('undocumented_dependencies');
  }
  if (authorityChain.undocumentedAuthorityChains.length > 0) {
    missingSignals.push('undocumented_authority_chains');
  }
  if (validation.undocumentedValidators.length > 0) {
    missingSignals.push('undocumented_validators');
  }

  const report = generateSelfDocumentationReport(
    record,
    evaluation,
    capability.undocumentedCapabilities,
    module.undocumentedModules,
    dependency.undocumentedDependencies,
    authorityChain.undocumentedAuthorityChains,
    validation.undocumentedValidators,
    missingSignals,
  );

  return { record, report };
}

export function getSelfDocumentationRuntimeReport(): SelfDocumentationRuntimeReport {
  const cache = getSelfDocumentationCacheStats();
  return {
    capabilityAnalysisCount: getCapabilityAnalysisCount(),
    moduleAnalysisCount: getModuleAnalysisCount(),
    dependencyAnalysisCount: getDependencyAnalysisCount(),
    authorityAnalysisCount: getAuthorityAnalysisCount(),
    validationAnalysisCount: getValidationAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getSelfDocumentationRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetSelfDocumentationOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
