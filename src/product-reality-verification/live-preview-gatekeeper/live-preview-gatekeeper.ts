/**
 * Live Preview Gatekeeper — orchestration and read-only integrations.
 * Preview verification only. No UI, server, or browser automation.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDevPulseV2Owners } from '../../foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../../intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES } from '../../find-panel/alias-registry.js';
import { ALL_UVL_ROWS, listLivePreviewGatekeeperUvlRows } from '../../unified-verification-lab/uvl-row-registry.js';
import { getDevPulseV2FirstImpressionJudge } from '../first-impression-judge/index.js';
import { getDevPulseV2LivePreviewRuntime } from '../../live-preview-runtime/index.js';
import type {
  LivePreviewInput,
  LivePreviewRecord,
  LivePreviewResultBundle,
  LivePreviewRuntimeReport,
  PreviewContextType,
} from './live-preview-types.js';
import {
  LIVE_PREVIEW_GATEKEEPER_OWNER_MODULE,
  LIVE_PREVIEW_GATEKEEPER_PASS_TOKEN,
} from './live-preview-types.js';
import { buildPreviewContext, getContextBuildCount } from './preview-context-builder.js';
import { analyzePreviewVisibility, getPreviewVisibilityAnalysisCount } from './preview-visibility-analyzer.js';
import { analyzePreviewUnderstandability, getPreviewUnderstandabilityAnalysisCount } from './preview-understandability-analyzer.js';
import { analyzePreviewStateMeaningfulness, getPreviewMeaningfulnessAnalysisCount } from './preview-state-meaningfulness-analyzer.js';
import { analyzeFounderVerificationSupport, getFounderVerificationAnalysisCount } from './founder-verification-support-analyzer.js';
import { analyzeResponsivePreviewSupport, getResponsivePreviewAnalysisCount } from './responsive-preview-support-analyzer.js';
import { analyzePreviewUnavailableHonesty, getUnavailableHonestyAnalysisCount } from './preview-unavailable-honesty-analyzer.js';
import { analyzePreviewMisleadingRisk, getMisleadingRiskAnalysisCount } from './preview-misleading-risk-analyzer.js';
import { analyzePreviewNextAction, getPreviewNextActionAnalysisCount } from './preview-next-action-analyzer.js';
import { analyzePreviewReportConnection, getReportConnectionAnalysisCount } from './preview-report-connection-analyzer.js';
import { analyzeProductReadinessPreview, getProductReadinessAnalysisCount } from './product-readiness-preview-analyzer.js';
import { buildLivePreviewAuthority, getAuthorityBuildCount } from './live-preview-authority-builder.js';
import { evaluateLivePreview, getEvaluationCount } from './live-preview-evaluator.js';
import { registerLivePreviewRecord, getLivePreviewRecordCount } from './live-preview-registry.js';
import { recordLivePreviewHistory } from './bounded-history.js';
import { generateLivePreviewReport } from './live-preview-report-builder.js';
import { getCachedSourceText, getLivePreviewCacheStats, setCachedSourceText } from './live-preview-cache.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const LIVE_PREVIEW_TYPES_PATH = join(ROOT, 'src/live-preview-runtime/types.ts');
const LIVE_PREVIEW_REPORT_PATH = join(ROOT, 'src/live-preview-runtime/preview-runtime-report.ts');
const LIVE_PREVIEW_VALIDATOR_PATH = join(ROOT, 'src/live-preview-runtime/preview-runtime-validator.ts');
const MOBILE_PREVIEW_TYPES_PATH = join(ROOT, 'src/mobile-preview-runtime/mobile-preview-types.ts');
const MOBILE_PREVIEW_POLICY_PATH = join(ROOT, 'src/mobile-preview-runtime/mobile-preview-device-policy.ts');
const UI_HTML_PATH = join(ROOT, 'public/founder-reality/index.html');
const UI_APP_PATH = join(ROOT, 'public/founder-reality/app.js');

export interface LivePreviewSurfaceSnapshot {
  livePreviewRuntimePresent: boolean;
  previewSessionManagerPresent: boolean;
  previewBlockedStatePresent: boolean;
  mobilePreviewRuntimePresent: boolean;
  previewTargetRegistryPresent: boolean;
  previewStateLabelsPresent: boolean;
  previewLimitationCopyPresent: boolean;
  previewBlockedReasonPresent: boolean;
  previewCapabilityLabelsPresent: boolean;
  previewUrlSupportPresent: boolean;
  liveViewCapabilityPresent: boolean;
  previewSessionSupportPresent: boolean;
  founderPreviewCategoryPresent: boolean;
  previewReportPresent: boolean;
  desktopRecommendationPresent: boolean;
  previewComparisonSupportPresent: boolean;
  mobilePreviewBlockedReasonPresent: boolean;
  viewportPolicyPresent: boolean;
  desktopRequiredPresent: boolean;
  previewFailureContextPresent: boolean;
  buildPreviewFailureContextPresent: boolean;
  previewStateHonestyPresent: boolean;
  noFalseReadyCopyPresent: boolean;
  previewGateValidationPresent: boolean;
  previewDiagnosticsPresent: boolean;
  previewNextStepPresent: boolean;
  uvlConnectionPresent: boolean;
  previewReportCopyPresent: boolean;
  previewFixPathPresent: boolean;
  visualQaUpstreamPresent: boolean;
  uxHeuristicUpstreamPresent: boolean;
  firstImpressionUpstreamPresent: boolean;
  uvlRowsPresent: boolean;
  launchSignalPresent: boolean;
  readinessGatesPresent: boolean;
  previewRuntimeValidatorPresent: boolean;
  mobileDesktopGapSignalsPresent: boolean;
  foundationDomains: number;
  capabilityEntries: number;
  findPanelAliases: number;
  uvlRows: number;
  livePreviewRuntimeToken: string;
  firstImpressionJudgeToken: string;
  registeredAt: number;
}

let cachedSnapshot: LivePreviewSurfaceSnapshot | null = null;
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

export function getDevPulseV2LivePreviewGatekeeper(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  readOnly: true;
  noExecution: true;
  noMutations: true;
} {
  return {
    ownerModule: LIVE_PREVIEW_GATEKEEPER_OWNER_MODULE,
    passToken: LIVE_PREVIEW_GATEKEEPER_PASS_TOKEN,
    phase: 24.75,
    readOnly: true,
    noExecution: true,
    noMutations: true,
  };
}

export function registerLivePreviewGatekeeperWithSurface(): LivePreviewSurfaceSnapshot {
  if (cachedSnapshot) {
    bootstrapReuseCount += 1;
    return cachedSnapshot;
  }

  const liveTypes = readSourceText(LIVE_PREVIEW_TYPES_PATH);
  const liveReport = readSourceText(LIVE_PREVIEW_REPORT_PATH);
  const liveValidator = readSourceText(LIVE_PREVIEW_VALIDATOR_PATH);
  const mobileTypes = readSourceText(MOBILE_PREVIEW_TYPES_PATH);
  const mobilePolicy = readSourceText(MOBILE_PREVIEW_POLICY_PATH);
  const html = readSourceText(UI_HTML_PATH);
  const appJs = readSourceText(UI_APP_PATH);

  cachedSnapshot = {
    livePreviewRuntimePresent: liveTypes.includes('LIVE_PREVIEW_RUNTIME_PASS_TOKEN'),
    previewSessionManagerPresent: liveTypes.includes('PreviewSession'),
    previewBlockedStatePresent: liveTypes.includes('PREVIEW_BLOCKED'),
    mobilePreviewRuntimePresent: mobileTypes.includes('MOBILE_PREVIEW_RUNTIME_FOUNDATION_PASS_TOKEN'),
    previewTargetRegistryPresent: liveTypes.includes('PreviewTargetMetadata'),
    previewStateLabelsPresent: liveTypes.includes('PreviewState'),
    previewLimitationCopyPresent: liveReport.includes('PreviewFailureContext') || liveTypes.includes('blockedReason'),
    previewBlockedReasonPresent: liveTypes.includes('why is preview blocked') || mobilePolicy.includes('mobilePreviewBlockedReason'),
    previewCapabilityLabelsPresent: liveTypes.includes('TRACKED_PREVIEW_CAPABILITIES'),
    previewUrlSupportPresent: liveTypes.includes('previewUrl'),
    liveViewCapabilityPresent: liveTypes.includes('LIVE_VIEW'),
    previewSessionSupportPresent: liveTypes.includes('previewSessionId'),
    founderPreviewCategoryPresent: mobileTypes.includes('FOUNDER_MOBILE_PREVIEW'),
    previewReportPresent: liveReport.includes('composePreviewResponse'),
    desktopRecommendationPresent: mobileTypes.includes('DESKTOP_RECOMMENDED') || mobilePolicy.includes('registerDesktopRecommendation'),
    previewComparisonSupportPresent: liveReport.includes('buildPreviewFailureContext'),
    mobilePreviewBlockedReasonPresent: mobilePolicy.includes('mobilePreviewBlockedReason'),
    viewportPolicyPresent: mobilePolicy.includes('MobilePreviewDevicePolicy'),
    desktopRequiredPresent: mobileTypes.includes('DESKTOP_REQUIRED'),
    previewFailureContextPresent: liveReport.includes('buildPreviewFailureContext'),
    buildPreviewFailureContextPresent: liveReport.includes('PreviewFailureContext'),
    previewStateHonestyPresent: liveTypes.includes('PREVIEW_READY') && liveTypes.includes('PREVIEW_BLOCKED'),
    noFalseReadyCopyPresent: liveReport.includes('failure') || liveReport.includes('blocked'),
    previewGateValidationPresent: liveValidator.includes('evaluatePreviewGates'),
    previewDiagnosticsPresent: liveTypes.includes('PreviewRuntimeDiagnostics'),
    previewNextStepPresent: liveReport.includes('nextPreviewReportId') || html.includes('next-step'),
    uvlConnectionPresent: ALL_UVL_ROWS.some((r) => r.module === 'live_preview_gatekeeper' || r.module === 'visual_qa_engine'),
    previewReportCopyPresent: liveReport.includes('composePreviewResponse'),
    previewFixPathPresent: liveReport.includes('buildPreviewFailureContext'),
    visualQaUpstreamPresent: INTELLIGENCE_CONSOLE_CAPABILITIES.some((c) => c.capabilityId === 'VISUAL_QA_ENGINE'),
    uxHeuristicUpstreamPresent: INTELLIGENCE_CONSOLE_CAPABILITIES.some((c) => c.capabilityId === 'UX_HEURISTIC_EVALUATOR'),
    firstImpressionUpstreamPresent: INTELLIGENCE_CONSOLE_CAPABILITIES.some((c) => c.capabilityId === 'FIRST_IMPRESSION_JUDGE'),
    uvlRowsPresent: ALL_UVL_ROWS.length > 0,
    launchSignalPresent: liveTypes.includes('PREVIEW_READY'),
    readinessGatesPresent: liveValidator.includes('evaluatePreviewGates'),
    previewRuntimeValidatorPresent: liveValidator.includes('validatePreviewRuntime'),
    mobileDesktopGapSignalsPresent: mobilePolicy.includes('MOBILE_PREVIEW_BLOCKED') || mobileTypes.includes('MOBILE_PREVIEW_BLOCKED'),
    foundationDomains: listDevPulseV2Owners().length,
    capabilityEntries: INTELLIGENCE_CONSOLE_CAPABILITIES.length,
    findPanelAliases: WORLD2_BUILDER_PACKET_FIND_ALIASES.length,
    uvlRows: ALL_UVL_ROWS.length,
    livePreviewRuntimeToken: getDevPulseV2LivePreviewRuntime().passToken,
    firstImpressionJudgeToken: getDevPulseV2FirstImpressionJudge().passToken,
    registeredAt: Date.now(),
  };

  return cachedSnapshot;
}

export function registerLivePreviewGatekeeperWithFirstImpressionJudge(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2FirstImpressionJudge().passToken, readOnly: true };
}

export function registerLivePreviewGatekeeperWithLivePreviewRuntime(): { passToken: string; readOnly: true } {
  return { passToken: getDevPulseV2LivePreviewRuntime().passToken, readOnly: true };
}

export function registerLivePreviewGatekeeperWithFoundation(): { domainCount: number; readOnly: true } {
  return { domainCount: listDevPulseV2Owners().length, readOnly: true };
}

export function registerLivePreviewGatekeeperWithCapabilityRegistry(): { capabilityCount: number; readOnly: true } {
  return { capabilityCount: INTELLIGENCE_CONSOLE_CAPABILITIES.length, readOnly: true };
}

export function registerLivePreviewGatekeeperWithFindPanel(): { aliasCount: number; readOnly: true } {
  return { aliasCount: WORLD2_BUILDER_PACKET_FIND_ALIASES.length, readOnly: true };
}

export function registerLivePreviewGatekeeperWithUvl(): { uvlRowCount: number; readOnly: true } {
  return { uvlRowCount: listLivePreviewGatekeeperUvlRows().length, readOnly: true };
}

export function evaluateLivePreviewGatekeeper(input: LivePreviewInput): LivePreviewResultBundle {
  const snapshot = registerLivePreviewGatekeeperWithSurface();
  const contextType: PreviewContextType = input.contextType ?? 'FOUNDER_ACCEPTANCE_REVIEW';
  const context = buildPreviewContext(contextType);

  const visibility = analyzePreviewVisibility(input, context, {
    livePreviewRuntimePresent: snapshot.livePreviewRuntimePresent,
    previewSessionManagerPresent: snapshot.previewSessionManagerPresent,
    previewBlockedStatePresent: snapshot.previewBlockedStatePresent,
    mobilePreviewRuntimePresent: snapshot.mobilePreviewRuntimePresent,
    previewTargetRegistryPresent: snapshot.previewTargetRegistryPresent,
  });
  const understandability = analyzePreviewUnderstandability(input, context, {
    previewStateLabelsPresent: snapshot.previewStateLabelsPresent,
    previewLimitationCopyPresent: snapshot.previewLimitationCopyPresent,
    previewBlockedReasonPresent: snapshot.previewBlockedReasonPresent,
    previewCapabilityLabelsPresent: snapshot.previewCapabilityLabelsPresent,
  });
  const meaningfulness = analyzePreviewStateMeaningfulness(input, context, {
    previewTargetRegistryPresent: snapshot.previewTargetRegistryPresent,
    previewUrlSupportPresent: snapshot.previewUrlSupportPresent,
    liveViewCapabilityPresent: snapshot.liveViewCapabilityPresent,
    previewSessionSupportPresent: snapshot.previewSessionSupportPresent,
  });
  const founder = analyzeFounderVerificationSupport(input, context, {
    founderPreviewCategoryPresent: snapshot.founderPreviewCategoryPresent,
    previewReportPresent: snapshot.previewReportPresent,
    desktopRecommendationPresent: snapshot.desktopRecommendationPresent,
    previewComparisonSupportPresent: snapshot.previewComparisonSupportPresent,
  });
  const responsive = analyzeResponsivePreviewSupport(input, context, {
    mobilePreviewBlockedReasonPresent: snapshot.mobilePreviewBlockedReasonPresent,
    viewportPolicyPresent: snapshot.viewportPolicyPresent,
    desktopRequiredPresent: snapshot.desktopRequiredPresent,
    mobilePreviewRuntimePresent: snapshot.mobilePreviewRuntimePresent,
  });
  const unavailable = analyzePreviewUnavailableHonesty(input, context, {
    previewFailureContextPresent: snapshot.previewFailureContextPresent,
    previewBlockedReasonPresent: snapshot.previewBlockedReasonPresent,
    buildPreviewFailureContextPresent: snapshot.buildPreviewFailureContextPresent,
    previewBlockedStatePresent: snapshot.previewBlockedStatePresent,
  });
  const misleading = analyzePreviewMisleadingRisk(input, context, {
    previewStateHonestyPresent: snapshot.previewStateHonestyPresent,
    noFalseReadyCopyPresent: snapshot.noFalseReadyCopyPresent,
    previewGateValidationPresent: snapshot.previewGateValidationPresent,
    previewDiagnosticsPresent: snapshot.previewDiagnosticsPresent,
  });
  const nextAction = analyzePreviewNextAction(input, context, {
    previewNextStepPresent: snapshot.previewNextStepPresent,
    uvlConnectionPresent: snapshot.uvlConnectionPresent,
    previewReportCopyPresent: snapshot.previewReportCopyPresent,
    previewFixPathPresent: snapshot.previewFixPathPresent,
  });
  const reportConnection = analyzePreviewReportConnection(input, context, {
    visualQaUpstreamPresent: snapshot.visualQaUpstreamPresent,
    uxHeuristicUpstreamPresent: snapshot.uxHeuristicUpstreamPresent,
    firstImpressionUpstreamPresent: snapshot.firstImpressionUpstreamPresent,
    uvlRowsPresent: snapshot.uvlRowsPresent,
  });
  const readiness = analyzeProductReadinessPreview(input, context, {
    launchSignalPresent: snapshot.launchSignalPresent,
    readinessGatesPresent: snapshot.readinessGatesPresent,
    previewRuntimeValidatorPresent: snapshot.previewRuntimeValidatorPresent,
    mobileDesktopGapSignalsPresent: snapshot.mobileDesktopGapSignalsPresent,
  });

  const authority = buildLivePreviewAuthority(
    input.requestId,
    context,
    visibility,
    understandability,
    meaningfulness,
    founder,
    responsive,
    unavailable,
    misleading,
    nextAction,
    reportConnection,
    readiness,
    input,
  );
  const evaluation = evaluateLivePreview(authority);

  recordCounter += 1;
  const record: LivePreviewRecord = {
    livePreviewId: `live-preview-${recordCounter}`,
    projectId: input.projectId ?? 'default_project',
    workspaceId: input.workspaceId ?? 'default_workspace',
    contextType,
    overallScore: evaluation.overallScore,
    livePreviewResult: evaluation.livePreviewResult,
    confidence: evaluation.confidence,
    generatedAt: Date.now(),
  };

  registerLivePreviewRecord(record);
  recordLivePreviewHistory(record);

  const report = generateLivePreviewReport(
    record,
    evaluation,
    context,
    visibility,
    understandability,
    meaningfulness,
    founder,
    responsive,
    unavailable,
    misleading,
    nextAction,
    reportConnection,
    readiness,
  );

  return { record, report, context };
}

export function getLivePreviewRuntimeReport(): LivePreviewRuntimeReport {
  const cache = getLivePreviewCacheStats();
  return {
    contextBuildCount: getContextBuildCount(),
    previewVisibilityAnalysisCount: getPreviewVisibilityAnalysisCount(),
    previewUnderstandabilityAnalysisCount: getPreviewUnderstandabilityAnalysisCount(),
    previewMeaningfulnessAnalysisCount: getPreviewMeaningfulnessAnalysisCount(),
    founderVerificationAnalysisCount: getFounderVerificationAnalysisCount(),
    responsivePreviewAnalysisCount: getResponsivePreviewAnalysisCount(),
    unavailableHonestyAnalysisCount: getUnavailableHonestyAnalysisCount(),
    misleadingRiskAnalysisCount: getMisleadingRiskAnalysisCount(),
    previewNextActionAnalysisCount: getPreviewNextActionAnalysisCount(),
    reportConnectionAnalysisCount: getReportConnectionAnalysisCount(),
    productReadinessAnalysisCount: getProductReadinessAnalysisCount(),
    authorityBuildCount: getAuthorityBuildCount(),
    evaluationCount: getEvaluationCount(),
    recordCount: getLivePreviewRecordCount(),
    cacheHits: cache.hits,
    cacheMisses: cache.misses,
    cacheEvictions: cache.evictions,
    bootstrapReuseCount,
    sourceTextCacheHits: cache.sourceTextCacheHits,
  };
}

export function resetLivePreviewGatekeeperOrchestrationForTests(): void {
  cachedSnapshot = null;
  bootstrapReuseCount = 0;
  recordCounter = 0;
}
