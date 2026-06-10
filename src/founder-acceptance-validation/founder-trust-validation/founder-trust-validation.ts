/**
 * Founder Trust Validation — orchestration and read-only integrations.
 * Trust validation authority in Founder Acceptance stack.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS } from '../../unified-verification-lab/uvl-row-registry.js';
import { buildFounderAcceptanceFramework } from '../founder-acceptance-framework/index.js';
import { evaluateFounderWorkflowValidation } from '../founder-workflow-validation/index.js';
import { evaluateFounderConfidenceEngine } from '../founder-confidence-engine/index.js';
import { evaluateProductRealityOrchestrator } from '../../product-reality-verification/product-reality-orchestrator/index.js';
import { evaluateProductExperienceEngine } from '../../product-reality-verification/product-experience-verification-engine/index.js';
import { evaluateUXHeuristicEngine } from '../../product-reality-verification/ux-heuristic-evaluator/index.js';
import type {
  FounderTrustRecord,
  FounderTrustResultBundle,
  FounderTrustRuntimeReport,
  FounderTrustValidationInput,
} from './founder-trust-types.js';
import {
  FOUNDER_TRUST_VALIDATION_PASS_TOKEN,
  FOUNDER_TRUST_OWNER_MODULE,
} from './founder-trust-types.js';
import { buildAllTrustContexts, getContextBuildCount } from './trust-context-builder.js';
import { validateTruthfulness, getTruthfulnessValidateCount } from './truthfulness-validator.js';
import { validateTransparency, getTransparencyValidateCount } from './transparency-validator.js';
import { validateVerificationIntegrity, getVerificationValidateCount } from './verification-integrity-validator.js';
import { validateGovernanceCompliance, getGovernanceValidateCount } from './governance-compliance-validator.js';
import { validateExecutionPredictability, getExecutionValidateCount } from './execution-predictability-validator.js';
import { validateEvidenceVisibility, getEvidenceValidateCount } from './evidence-visibility-validator.js';
import { validateRollbackConfidence, getRollbackValidateCount } from './rollback-confidence-validator.js';
import { validateSafetyBoundaries, getSafetyValidateCount } from './safety-boundary-validator.js';
import { analyzeTrustGaps, getGapAnalysisCount } from './trust-gap-analyzer.js';
import { buildFounderTrustRoadmap, getRoadmapBuildCount } from './trust-roadmap-builder.js';
import { buildFounderTrustAuthority, getAuthorityBuildCount } from './founder-trust-authority-builder.js';
import { buildFounderTrustScore, evaluateFounderTrust, getEvaluationCount } from './founder-trust-evaluator.js';
import { registerFounderTrustRecord, getFounderTrustRecordCount } from './founder-trust-registry.js';
import { recordFounderTrustHistory } from './bounded-history.js';
import { generateFounderTrustReport, getReportCount } from './founder-trust-report-builder.js';
import { getFounderTrustCacheStats, getCachedSourceText, setCachedSourceText } from './founder-trust-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface FounderTrustSurfaceSnapshot {
  chatPresent: boolean;
  operatorFeedPresent: boolean;
  feedStreamPresent: boolean;
  uvlDiscoverable: boolean;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  frameworkAuthorityId: string;
  workflowAuthorityId: string;
  confidenceAuthorityId: string;
  registeredAt: number;
}

let cachedSnapshot: FounderTrustSurfaceSnapshot | null = null;
let bootstrapReuseCount = 0;
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

function appJsHasRollbackHint(): boolean {
  const appJs = readSourceText(UI_APP_PATH);
  return appJs.includes('rollback') || appJs.includes('Rollback') || appJs.includes('recovery');
}

export function getDevPulseV2FounderTrustValidation(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: FOUNDER_TRUST_OWNER_MODULE,
    passToken: FOUNDER_TRUST_VALIDATION_PASS_TOKEN,
    phase: 24.84,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerFounderTrustValidationWithSurface(): FounderTrustSurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const html = readSourceText(UI_HTML_PATH);
  const appJs = readSourceText(UI_APP_PATH);
  const framework = buildFounderAcceptanceFramework({ requestId: 'bootstrap-framework' });
  const workflow = evaluateFounderWorkflowValidation({ requestId: 'bootstrap-workflow' });
  const confidence = evaluateFounderConfidenceEngine({ requestId: 'bootstrap-confidence' });

  cachedSnapshot = {
    chatPresent: html.includes('id="chat-input"') || html.includes('id="chat-surface"'),
    operatorFeedPresent: html.includes('id="operator-feed"'),
    feedStreamPresent: html.includes('id="feed-stream-log"') || appJs.includes('streamOperatorFeedEvents'),
    uvlDiscoverable: html.includes('UVL') || ALL_UVL_ROWS.length > 0,
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    frameworkAuthorityId: framework.authority.authorityId,
    workflowAuthorityId: workflow.authority.authorityId,
    confidenceAuthorityId: confidence.authority.authorityId,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerFounderTrustValidationWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerFounderTrustValidationWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerFounderTrustValidationWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerFounderTrustValidationWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: ALL_UVL_ROWS.length, readOnly: true };
}

export function registerFounderTrustValidationWithAcceptanceChain(): {
  founderAcceptanceFramework: boolean;
  founderWorkflowValidation: boolean;
  founderConfidenceEngine: boolean;
  productRealityOrchestrator: boolean;
  readOnly: true;
} {
  const caps = INTELLIGENCE_CONSOLE_CAPABILITIES.map((c) => c.capabilityId);
  return {
    founderAcceptanceFramework: caps.includes('FOUNDER_ACCEPTANCE_FRAMEWORK'),
    founderWorkflowValidation: caps.includes('FOUNDER_WORKFLOW_VALIDATION'),
    founderConfidenceEngine: caps.includes('FOUNDER_CONFIDENCE_ENGINE'),
    productRealityOrchestrator: caps.includes('PRODUCT_REALITY_ORCHESTRATOR'),
    readOnly: true,
  };
}

export function evaluateFounderTrustValidation(input: FounderTrustValidationInput): FounderTrustResultBundle {
  const snapshot = registerFounderTrustValidationWithSurface();
  const projectId = input.projectId ?? 'default_project';
  const workspaceId = input.workspaceId ?? 'default_workspace';
  const base = { projectId, workspaceId, governanceBlocked: input.governanceBlocked };

  const framework = buildFounderAcceptanceFramework({ requestId: `${input.requestId}-framework`, ...base });

  const workflow = evaluateFounderWorkflowValidation({
    requestId: `${input.requestId}-workflow`,
    ...base,
    workflowContinuityBreak: input.executionUnpredictable,
  });

  const confidence = evaluateFounderConfidenceEngine({
    requestId: `${input.requestId}-confidence`,
    ...base,
    understandingWeak: input.truthfulnessWeak,
    progressInflated: input.truthfulnessWeak,
    reasoningHidden: input.transparencyWeak,
    uncertaintyHidden: input.evidenceHidden,
    controlBoundaryWeak: input.safetyBoundaryWeak,
    unsupportedPassClaims: input.unsupportedPassClaims,
    missingEvidence: input.missingEvidence,
  });

  const productReality = evaluateProductRealityOrchestrator({
    requestId: `${input.requestId}-pr`,
    ...base,
    trustGap: input.truthfulnessWeak,
    verificationSilo: input.verificationIntegrityWeak,
    governanceBlocked: input.governanceViolation,
  });

  const productExperience = evaluateProductExperienceEngine({
    requestId: `${input.requestId}-pe`,
    ...base,
    experienceBreak: input.transparencyWeak,
  }).report;

  const ux = evaluateUXHeuristicEngine({
    requestId: `${input.requestId}-ux`,
    ...base,
    navigationConfusion: input.transparencyWeak,
  }).report;

  const contexts = buildAllTrustContexts();
  const rollbackVisible = appJsHasRollbackHint();

  const truthfulness = validateTruthfulness(input, {
    progressTruthScore: confidence.score.progressTruthScore,
    productRealityScore: productReality.report.productRealityScore,
    launchBlockerCount: productReality.report.launchBlockers.length,
    confidenceProgressScore: confidence.score.progressTruthScore,
  });

  const transparency = validateTransparency(input, {
    trustClarityScore: ux.trustClarityScore,
    feedbackQualityScore: ux.feedbackQualityScore,
    operatorFeedPresent: snapshot.operatorFeedPresent,
    feedStreamPresent: snapshot.feedStreamPresent,
    reasoningVisibilityScore: confidence.score.reasoningVisibilityScore,
  });

  const verificationIntegrity = validateVerificationIntegrity(input, {
    uvlRowCount: snapshot.uvlRows,
    authorityConflictCount: productReality.report.authorityConflicts.length,
    validationEvidenceScore: productReality.score.overallScore,
    verificationSiloRisk: input.verificationIntegrityWeak === true,
  });

  const governanceCompliance = validateGovernanceCompliance(input, {
    userControlScore: ux.userControlScore,
    readOnlyValidation: getDevPulseV2FounderTrustValidation().noMutations === true,
    governanceBlocked: input.governanceBlocked === true || input.governanceViolation === true,
    safetyControlScore: ux.errorPreventionScore,
  });

  const executionPredictability = validateExecutionPredictability(input, {
    workflowContinuityScore: workflow.score.continuityScore,
    experienceContinuityScore: productExperience.experienceContinuityScore,
    founderUsabilityScore: ux.founderUsabilityScore,
    hiddenExecutionRisk: input.hiddenExecution === true,
  });

  const evidenceGapCount = [
    input.missingEvidence,
    input.evidenceHidden,
    input.unsupportedPassClaims,
  ].filter(Boolean).length;

  const evidenceVisibility = validateEvidenceVisibility(input, {
    uvlRowCount: snapshot.uvlRows,
    evidenceModelComplete: framework.result.frameworkCompleteness === 'FRAMEWORK_COMPLETE',
    gapDisclosureScore: confidence.score.uncertaintyHonestyScore,
    evidenceGapCount,
  });

  const rollbackConfidence = validateRollbackConfidence(input, {
    errorPreventionScore: ux.errorPreventionScore,
    rollbackVisible,
    recoveryVisible: rollbackVisible,
    userControlScore: ux.userControlScore,
  });

  const safetyBoundaries = validateSafetyBoundaries(input, {
    userControlScore: ux.userControlScore,
    errorPreventionScore: ux.errorPreventionScore,
    readOnlyValidation: getDevPulseV2FounderTrustValidation().noMutations === true,
    founderControlScore: confidence.score.founderControlConfidenceScore,
  });

  const gapAnalysis = analyzeTrustGaps(input.requestId, {
    truthfulness,
    transparency,
    verificationIntegrity,
    governanceCompliance,
    executionPredictability,
    evidenceVisibility,
    rollbackConfidence,
    safetyBoundaries,
  });

  const roadmap = buildFounderTrustRoadmap(input.requestId, gapAnalysis);
  const authority = buildFounderTrustAuthority(
    input.requestId, contexts,
    truthfulness, transparency, verificationIntegrity, governanceCompliance,
    executionPredictability, evidenceVisibility, rollbackConfidence, safetyBoundaries,
    gapAnalysis, roadmap, input,
  );

  const evaluation = evaluateFounderTrust(authority);
  const score = buildFounderTrustScore(authority);

  recordCounter += 1;
  const record: FounderTrustRecord = {
    founderTrustId: `founder-trust-${recordCounter}`,
    projectId,
    workspaceId,
    overallScore: evaluation.overallScore,
    founderTrustResult: evaluation.founderTrustResult,
    totalGaps: evaluation.totalGaps,
    criticalGaps: evaluation.criticalGaps,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerFounderTrustRecord(record);
  recordFounderTrustHistory(record);

  const report = generateFounderTrustReport(record, evaluation, authority);

  return {
    record,
    report,
    authority,
    result: evaluation.founderTrustResult,
    score,
  };
}

export function getFounderTrustValidationRuntimeReport(): FounderTrustRuntimeReport {
  const cache = getFounderTrustCacheStats();
  return {
    contextBuildCount: getContextBuildCount(),
    truthfulnessValidateCount: getTruthfulnessValidateCount(),
    transparencyValidateCount: getTransparencyValidateCount(),
    verificationValidateCount: getVerificationValidateCount(),
    governanceValidateCount: getGovernanceValidateCount(),
    executionValidateCount: getExecutionValidateCount(),
    evidenceValidateCount: getEvidenceValidateCount(),
    rollbackValidateCount: getRollbackValidateCount(),
    safetyValidateCount: getSafetyValidateCount(),
    gapAnalysisCount: getGapAnalysisCount(),
    roadmapBuildCount: getRoadmapBuildCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    reportCount: getReportCount(),
    recordCount: getFounderTrustRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetFounderTrustValidationOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
