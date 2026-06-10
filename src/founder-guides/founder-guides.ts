/**
 * Founder Guides — orchestration and read-only integrations.
 * Founder documentation intelligence only. Read-only — no execution, mutations, or deployment.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBrainRoadmapContext } from '../command-center-brain/brain-roadmap-awareness.js';
import { readAllSystemSummaries } from '../central-brain/system-awareness-adapters.js';
import { listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listFounderGuidesUvlRows } from '../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2SelfDocumentation } from '../self-documentation/index.js';
import { getDevPulseV2UnifiedTrustScore } from '../unified-trust-score/index.js';
import { WORLD2_WORKSPACE_PASS_TOKEN } from '../world2-workspace-foundation/index.js';
import { getDevPulseV2SelfEvolutionGovernance } from '../self-evolution-governance/index.js';
import { getDevPulseV2MissingCapabilityEscalation } from '../missing-capability-escalation/index.js';
import type {
  FounderGuideRecord,
  FounderGuidesInput,
  FounderGuidesResult,
  FounderGuidesRuntimeReport,
} from './founder-guides-types.js';
import {
  FOUNDER_GUIDES_OWNER_MODULE,
  FOUNDER_GUIDES_PASS_TOKEN,
} from './founder-guides-types.js';
import { analyzeRoadmapGuide, getRoadmapAnalysisCount } from './roadmap-guide-analyzer.js';
import { analyzeCheckpointGuide, getCheckpointAnalysisCount, listBaseCheckpoints } from './checkpoint-guide-analyzer.js';
import { analyzeSystemNavigationGuide, getNavigationAnalysisCount } from './system-navigation-guide-analyzer.js';
import { analyzeModificationSafetyGuide, getSafetyAnalysisCount } from './modification-safety-guide-analyzer.js';
import { analyzeEvolutionGuide, getEvolutionAnalysisCount } from './evolution-guide-analyzer.js';
import { buildUnifiedFounderGuidesAuthority, getAuthorityBuildCount } from './founder-guides-authority-builder.js';
import { evaluateFounderGuides, getEvaluationCount } from './founder-guides-evaluator.js';
import {
  registerFounderGuideRecord,
  getFounderGuideRecordCount,
} from './founder-guides-registry.js';
import { recordFounderGuidesHistory } from './founder-guides-history.js';
import { generateFounderGuidesReport } from './founder-guides-reporting.js';
import { getFounderGuidesCacheStats } from './founder-guides-cache.js';

const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';
const PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN = 'PRODUCT_HARDENING_VERIFICATION_V1_PASS';

const PACKAGE_JSON_PATH = join(dirname(fileURLToPath(import.meta.url)), '../../package.json');

export interface FounderGuidesSystemSnapshot {
  centralBrainSystems: number;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  validationScripts: number;
  completedPhaseCount: number;
  currentPhase: string;
  nextPhase: string;
  hasRecommendedNextStep: boolean;
  selfDocumentationToken: string;
  unifiedTrustScoreToken: string;
  trustEngineCheckpointToken: string;
  productHardeningCheckpointToken: string;
  world2Token: string;
  selfEvolutionGovernanceToken: string;
  missingCapabilityEscalationToken: string;
  documentedCheckpoints: string[];
  authorityChainCount: number;
  protectedFoundationCount: number;
  governanceControlledCount: number;
  registeredAt: number;
}

let cachedSnapshot: FounderGuidesSystemSnapshot | null = null;
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

export function getDevPulseV2FounderGuides(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FOUNDER_GUIDES_OWNER_MODULE,
    passToken: FOUNDER_GUIDES_PASS_TOKEN,
    phase: 24.2,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFounderGuidesWithCentralBrain(): FounderGuidesSystemSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const summaries = readAllSystemSummaries();
  const roadmap = getBrainRoadmapContext();
  const owners = listDevPulseV2Owners();

  cachedSnapshot = {
    centralBrainSystems: summaries.length,
    foundationDomains: owners.length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    validationScripts: countValidationScripts(),
    completedPhaseCount: roadmap.completedPhases.length,
    currentPhase: roadmap.currentPhase,
    nextPhase: roadmap.nextPhase,
    hasRecommendedNextStep: roadmap.recommendedNextStep.length > 0,
    selfDocumentationToken: getDevPulseV2SelfDocumentation().passToken,
    unifiedTrustScoreToken: getDevPulseV2UnifiedTrustScore().passToken,
    trustEngineCheckpointToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN,
    productHardeningCheckpointToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN,
    world2Token: WORLD2_WORKSPACE_PASS_TOKEN,
    selfEvolutionGovernanceToken: getDevPulseV2SelfEvolutionGovernance().passToken,
    missingCapabilityEscalationToken: getDevPulseV2MissingCapabilityEscalation().passToken,
    documentedCheckpoints: [...listBaseCheckpoints()],
    authorityChainCount: 5,
    protectedFoundationCount: owners.filter((o) => o.phase <= 23.6).length,
    governanceControlledCount: owners.filter((o) =>
      o.domain.includes('governance')
      || o.domain.includes('hardening')
      || o.domain.includes('trust'),
    ).length,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFounderGuidesWithSelfDocumentation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfDocumentation().passToken, readOnly: true };
}

export function registerFounderGuidesWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFounderGuidesWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFounderGuidesWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFounderGuidesWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listFounderGuidesUvlRows().length, readOnly: true };
}

export function registerFounderGuidesWithRoadmap(): { currentPhase: string; readOnly: true } {
  return { currentPhase: getBrainRoadmapContext().currentPhase, readOnly: true };
}

export function registerFounderGuidesWithUnifiedTrustScore(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2UnifiedTrustScore().passToken, readOnly: true };
}

export function registerFounderGuidesWithTrustEngineCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN, readOnly: true };
}

export function registerFounderGuidesWithProductHardeningCheckpoint(): { passToken: string; readOnly: true } {
  return { passToken: PRODUCT_HARDENING_VERIFICATION_PASS_TOKEN, readOnly: true };
}

export function registerFounderGuidesWithWorld2(): { passToken: string; readOnly: true } {
  return { passToken: WORLD2_WORKSPACE_PASS_TOKEN, readOnly: true };
}

export function registerFounderGuidesWithSelfEvolutionGovernance(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2SelfEvolutionGovernance().passToken, readOnly: true };
}

export function registerFounderGuidesWithMissingCapabilityEscalation(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2MissingCapabilityEscalation().passToken, readOnly: true };
}

export function evaluateFounderGuidesEngine(input: FounderGuidesInput): FounderGuidesResult {
  const snapshot = registerFounderGuidesWithCentralBrain();

  const roadmap = analyzeRoadmapGuide(input, {
    completedPhaseCount: snapshot.completedPhaseCount,
    currentPhase: snapshot.currentPhase,
    nextPhase: snapshot.nextPhase,
    hasRecommendedNextStep: snapshot.hasRecommendedNextStep,
  });
  const checkpoint = analyzeCheckpointGuide(input, {
    documentedCheckpoints: snapshot.documentedCheckpoints,
  });
  const navigation = analyzeSystemNavigationGuide(input, {
    capabilityCount: snapshot.capabilityEntries,
    aliasCount: snapshot.findPanelAliases,
    ownerCount: snapshot.foundationDomains,
    authorityChainCount: snapshot.authorityChainCount,
  });
  const safety = analyzeModificationSafetyGuide(input, {
    protectedFoundationCount: snapshot.protectedFoundationCount,
    governanceControlledCount: snapshot.governanceControlledCount,
  });
  const evolution = analyzeEvolutionGuide(input, {
    hasSelfEvolutionGovernance: snapshot.selfEvolutionGovernanceToken.length > 0,
    hasMissingCapabilityEscalation: snapshot.missingCapabilityEscalationToken.length > 0,
    hasWorld2Growth: snapshot.world2Token.length > 0,
    hasFounderApprovalBoundaries: true,
  });

  const authority = buildUnifiedFounderGuidesAuthority(
    input.requestId,
    roadmap,
    checkpoint,
    navigation,
    safety,
    evolution,
    input,
  );
  const evaluation = evaluateFounderGuides(authority);

  recordCounter += 1;
  const record: FounderGuideRecord = {
    guideId: `founder-guides-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    completenessLevel: evaluation.completenessLevel,
    state: evaluation.state,
    confidence: evaluation.confidence,
    founderCoverageScore: evaluation.founderCoverageScore,
    roadmapCoverageScore: evaluation.roadmapCoverageScore,
    checkpointCoverageScore: evaluation.checkpointCoverageScore,
    generatedAt: Date.now(),
  };

  registerFounderGuideRecord(record);
  recordFounderGuidesHistory(record);

  const missingSignals: string[] = [];
  if (roadmap.undocumentedRoadmapAreas.length > 0) missingSignals.push('undocumented_roadmap');
  if (checkpoint.undocumentedCheckpoints.length > 0) missingSignals.push('undocumented_checkpoints');
  if (navigation.undocumentedNavigationAreas.length > 0) missingSignals.push('undocumented_navigation');
  if (safety.unsafeModificationAreas.length > 0) missingSignals.push('unsafe_modification_areas');
  if (evolution.undocumentedEvolutionAreas.length > 0) missingSignals.push('undocumented_evolution');

  const report = generateFounderGuidesReport(
    record,
    evaluation,
    roadmap,
    checkpoint,
    navigation,
    safety,
    evolution,
    missingSignals,
  );

  return { record, report };
}

export function getFounderGuidesRuntimeReport(): FounderGuidesRuntimeReport {
  const cache = getFounderGuidesCacheStats();
  return {
    roadmapAnalysisCount: getRoadmapAnalysisCount(),
    checkpointAnalysisCount: getCheckpointAnalysisCount(),
    navigationAnalysisCount: getNavigationAnalysisCount(),
    safetyAnalysisCount: getSafetyAnalysisCount(),
    evolutionAnalysisCount: getEvolutionAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getFounderGuideRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
  };
}

export function resetFounderGuidesOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
