/**
 * Founder Acceptance Framework — orchestration and read-only integrations.
 * Framework construction only. No acceptance validation, UI mutation, or execution.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS } from '../../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2ProductRealityOrchestrator } from '../../product-reality-verification/product-reality-orchestrator/index.js';
import type {
  FounderAcceptanceFrameworkBundle,
  FounderAcceptanceFrameworkInput,
  FounderAcceptanceRecord,
  FounderAcceptanceRuntimeReport,
} from './founder-acceptance-types.js';
import {
  FOUNDER_ACCEPTANCE_FRAMEWORK_PASS_TOKEN,
  FOUNDER_ACCEPTANCE_OWNER_MODULE,
} from './founder-acceptance-types.js';
import { buildDimensionRegistry, getDimensionRegistryBuilds } from './founder-acceptance-dimensions.js';
import { buildCriteriaRegistry, getCriteriaRegistryBuilds } from './founder-acceptance-criteria-registry.js';
import { buildCategoryRegistry, getCategoryBuilds } from './founder-acceptance-category-builder.js';
import { buildFounderAcceptanceEvidenceModel, getEvidenceModelBuilds } from './founder-acceptance-evidence-model.js';
import { buildFounderAcceptanceScoreModel, getScoringModelBuilds } from './founder-acceptance-scoring-model.js';
import { buildFounderAcceptanceReportModel, getReportModelBuilds } from './founder-acceptance-report-model.js';
import {
  buildFounderAcceptanceFrameworkAuthority,
  getAuthorityBuilds,
  getRoadmapBuilds,
} from './founder-acceptance-authority-builder.js';
import { evaluateFounderAcceptanceFramework, getEvaluationCount } from './founder-acceptance-evaluator.js';
import { registerFounderAcceptanceRecord, getFounderAcceptanceRecordCount } from './founder-acceptance-registry.js';
import { recordFounderAcceptanceHistory } from './bounded-history.js';
import { getCachedFramework, setCachedFramework, getFounderAcceptanceCacheStats, getCachedSourceText, setCachedSourceText } from './founder-acceptance-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');

export interface FounderAcceptanceSurfaceSnapshot {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  devPulseBrandingPresent: boolean;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  productRealityToken: string;
  registeredAt: number;
}

let cachedSnapshot: FounderAcceptanceSurfaceSnapshot | null = null;
let bootstrapReuseCount = 0;
let frameworkBuilds = 0;
let recordCounter = 0;

function readSourceText(path: string): string {
  const cached = getCachedSourceText(path);
  if (cached !== undefined) return cached;
  try {
    if (!existsSync(path)) {
      setCachedSourceText(path, '');
      return '';
    }
    const text = readFileSync(path, 'utf8');
    setCachedSourceText(path, text);
    return text;
  } catch {
    setCachedSourceText(path, '');
    return '';
  }
}

export function getDevPulseV2FounderAcceptanceFramework(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FOUNDER_ACCEPTANCE_OWNER_MODULE,
    passToken: FOUNDER_ACCEPTANCE_FRAMEWORK_PASS_TOKEN,
    phase: 24.81,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFounderAcceptanceFrameworkWithSurface(): FounderAcceptanceSurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const html = readSourceText(UI_HTML_PATH);

  cachedSnapshot = {
    chatPresent: html.includes('id="chat-input"') || html.includes('id="chat-surface"'),
    operatorFeedPresent: html.includes('id="operator-feed"'),
    devPulseBrandingPresent: html.includes('DevPulse'),
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    productRealityToken: getDevPulseV2ProductRealityOrchestrator().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFounderAcceptanceFrameworkWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFounderAcceptanceFrameworkWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFounderAcceptanceFrameworkWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFounderAcceptanceFrameworkWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerFounderAcceptanceFrameworkWithProductRealityChain(): {
  productRealityOrchestrator: boolean;
  readOnly: true;
} {
  const caps = INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId);
  return {
    productRealityOrchestrator: caps.includes('PRODUCT_REALITY_ORCHESTRATOR'),
    readOnly: true,
  };
}

export function buildFounderAcceptanceFramework(input: FounderAcceptanceFrameworkInput): FounderAcceptanceFrameworkBundle {
  registerFounderAcceptanceFrameworkWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';

  const cacheKey = `framework-${input.requestId}`;
  const cachedFramework = getCachedFramework(cacheKey);

  const dimensions = buildDimensionRegistry(input.requestId);
  const criteria = buildCriteriaRegistry(input.requestId);
  const categories = buildCategoryRegistry(input.requestId, criteria);
  const evidenceModel = buildFounderAcceptanceEvidenceModel(input.requestId);
  const scoreModel = buildFounderAcceptanceScoreModel(input.requestId, dimensions, categories);
  const reportModel = buildFounderAcceptanceReportModel(input.requestId);
  const authority = buildFounderAcceptanceFrameworkAuthority(
    input.requestId, dimensions, criteria, categories, evidenceModel, scoreModel, reportModel,
  );

  frameworkBuilds += 1;
  const framework = cachedFramework ?? {
    frameworkId: `founder-acceptance-framework-${frameworkBuilds}`,
    authority,
    dimensionCount: dimensions.dimensions.length,
    criteriaCount: criteria.totalCriteria,
    categoryCount: categories.categories.length,
    evidenceSlotCount: evidenceModel.evidenceSlots.length,
    frameworkComplete: dimensions.dimensions.length >= 10
      && criteria.totalCriteria >= 20
      && categories.categories.length >= 7,
    generatedAt: Date.now(),
  };
  if (!cachedFramework) {
    setCachedFramework(cacheKey, framework);
  }

  const result = evaluateFounderAcceptanceFramework(framework, authority);

  recordCounter += 1;
  const record: FounderAcceptanceRecord = {
    recordId: `founder-acceptance-record-${recordCounter}`,
    projectId,
    workspaceId,
    frameworkCompleteness: result.frameworkCompleteness,
    dimensionCount: result.dimensionCount,
    criteriaCount: result.criteriaCount,
    confidence: result.confidence,
    generatedAt: Date.now(),
  };

  registerFounderAcceptanceRecord(record);
  recordFounderAcceptanceHistory(record);

  return { framework, authority, result, record };
}

export function getFounderAcceptanceFrameworkRuntimeReport(): FounderAcceptanceRuntimeReport {
  const cache = getFounderAcceptanceCacheStats();
  return {
    dimensionRegistryBuilds: getDimensionRegistryBuilds(),
    criteriaRegistryBuilds: getCriteriaRegistryBuilds(),
    categoryBuilds: getCategoryBuilds(),
    evidenceModelBuilds: getEvidenceModelBuilds(),
    scoringModelBuilds: getScoringModelBuilds(),
    reportModelBuilds: getReportModelBuilds(),
    roadmapBuilds: getRoadmapBuilds(),
    authorityBuilds: getAuthorityBuilds(),
    frameworkBuilds,
    evaluationCount: getEvaluationCount(),
    recordCount: getFounderAcceptanceRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetFounderAcceptanceFrameworkOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  frameworkBuilds = 0;
  recordCounter = 0;
}
