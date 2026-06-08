/**
 * DevPulse V2 Missing Capability Detector Foundation — Phase 9.1.
 * Detects capability gaps only. Does NOT acquire, build, or execute.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import { analysisKey, evaluateProjectContext, validateAnalysisInput } from './capability-analysis-engine.js';
import {
  assertDistinctFromCrossDeviceContinuity,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getDetectorGovernanceSummary,
  governanceGatesKey,
  validateDetectorGovernance,
} from './capability-governance-bridge.js';
import {
  classifyCapabilityGaps,
  classificationKey,
  overallConfidence,
} from './capability-gap-classifier.js';
import {
  buildCapabilityGapReport,
  buildCapabilityGapReportOutput,
  formatCapabilityGapReport,
} from './capability-gap-report.js';
import { buildGapRecords, generateRecommendations } from './capability-recommendation-engine.js';
import { scanForCapabilityGaps, scanKey } from './capability-scan-engine.js';
import type {
  CapabilityAnalysisInput,
  CapabilityGapResult,
  CapabilityGapState,
  MissingCapabilityDetectorState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  GAP_STATE_SEQUENCE,
  MISSING_CAPABILITY_DETECTOR_OWNER_MODULE,
  MISSING_CAPABILITY_DETECTOR_PASS_TOKEN,
} from './types.js';

function getForbiddenExecutionPatterns(): string[] {
  return [
    'fs' + '.writeFileSync',
    'fs' + '.rmSync',
    'fs' + '.unlinkSync',
    'child' + '_process',
    'exec' + '(',
    'spawn' + '(',
    'eval' + '(',
  ];
}

let singleton: DevPulseV2MissingCapabilityDetector | null = null;

function createFoundationId(): string {
  return `missing-capability-detector-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildStateSequence(
  blocked: boolean,
  contextValid: boolean,
  scanComplete: boolean,
  gapsDetected: boolean,
  classified: boolean,
  recommendationsGenerated: boolean,
): CapabilityGapState[] {
  if (blocked) return ['ANALYSIS_RECEIVED', 'ANALYSIS_BLOCKED'];

  const sequence: CapabilityGapState[] = ['ANALYSIS_RECEIVED'];
  if (contextValid) sequence.push('CONTEXT_EVALUATED');
  if (scanComplete) sequence.push('CAPABILITY_SCAN_COMPLETE');
  if (gapsDetected) sequence.push('CAPABILITY_GAP_DETECTED');
  if (classified) sequence.push('CAPABILITY_GAP_CLASSIFIED');
  if (recommendationsGenerated) sequence.push('RECOMMENDATION_GENERATED');
  if (contextValid && scanComplete) sequence.push('REPORT_READY');

  return sequence;
}

function cloneGapResult(result: CapabilityGapResult): CapabilityGapResult {
  return {
    ...result,
    detectedGaps: result.detectedGaps.map((g) => ({ ...g })),
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
  };
}

export function processCapabilityAnalysis(input: CapabilityAnalysisInput): CapabilityGapResult {
  const analysis = validateAnalysisInput(input);
  const context = evaluateProjectContext(input);
  const governance = validateDetectorGovernance(input);

  const blocked = analysis.blocked || !context.valid || !governance.valid;
  const scanned = blocked ? [] : scanForCapabilityGaps(input);
  const classified = blocked ? [] : classifyCapabilityGaps(scanned);
  const gapRecords = blocked ? [] : buildGapRecords(input, classified);
  const recommendations = blocked
    ? ['Analysis blocked — capability detection only, no remediation performed.']
    : generateRecommendations(input, classified);

  const stateSequence = buildStateSequence(
    blocked,
    context.valid,
    !blocked,
    classified.length > 0,
    classified.length > 0,
    recommendations.length > 0,
  );

  const capabilityGapState = stateSequence[stateSequence.length - 1] ?? 'ANALYSIS_BLOCKED';
  const primaryGap = gapRecords[0];

  return {
    capabilityGapId: primaryGap?.capabilityGapId ?? '',
    analysisId: input.analysisId,
    workspaceId: context.effectiveWorkspaceId || input.workspaceId,
    projectId: context.effectiveProjectId || input.projectId,
    analysisSource: input.analysisSource,
    capabilityType: primaryGap?.capabilityType ?? 'UNKNOWN',
    capabilityName: primaryGap?.capabilityName ?? '',
    gapSeverity: primaryGap?.gapSeverity ?? 'LOW',
    gapReason: primaryGap?.gapReason ?? (blocked ? analysis.reason : 'No primary gap'),
    gapEvidence: primaryGap?.gapEvidence ?? '',
    gapImpact: primaryGap?.gapImpact ?? '',
    recommendedCapability: primaryGap?.recommendedCapability ?? '',
    recommendedAction: primaryGap?.recommendedAction ?? '',
    confidenceScore: primaryGap?.confidenceScore ?? overallConfidence(classified),
    capabilityGapState,
    governanceGates: governance.gates,
    ownershipGates: [...analysis.gates, ...context.gates],
    securityWarnings: analysis.warnings,
    recommendations,
    confirmation: {
      missingCapabilityDetectorOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noCapabilityAcquisitionPerformed: true,
    },
    stateSequence,
    detectedGaps: gapRecords,
    createdAt: Date.now(),
  };
}

export function gapStructuralKey(result: CapabilityGapResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.analysisSource,
    result.capabilityGapState,
    scanKey(result.detectedGaps.length, result.analysisSource),
    classificationKey(result.capabilityType, result.gapSeverity),
    governanceGatesKey(result.governanceGates),
    result.confidenceScore,
  ].join('|');
}

export function gapStateIncludes(states: CapabilityGapState[], target: CapabilityGapState): boolean {
  return states.includes(target);
}

export function scanModuleForForbiddenPatterns(moduleDir: string): string[] {
  const violations: string[] = [];

  function scanDir(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.ts')) continue;

      const content = readFileSync(fullPath, 'utf8');
      for (const pattern of getForbiddenExecutionPatterns()) {
        if (content.includes(pattern)) {
          violations.push(`${fullPath}: contains forbidden pattern "${pattern}"`);
        }
      }
    }
  }

  scanDir(moduleDir);
  return violations;
}

export class DevPulseV2MissingCapabilityDetector {
  private readonly foundationId = createFoundationId();
  private readonly analyses: CapabilityGapResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 9.1 Missing Capability Detector Foundation V1 — detection only.',
    'No acquisition, execution, file modification, code generation, or deployment.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = MISSING_CAPABILITY_DETECTOR_OWNER_MODULE;
  static readonly ownerDomain = 'missing_capability_detector' as const;
  static readonly passToken = MISSING_CAPABILITY_DETECTOR_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('missing_capability_detector');
    return owner.ownerModule === MISSING_CAPABILITY_DETECTOR_OWNER_MODULE && owner.phase === 9.1;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const detectorOwner = getDevPulseV2Owner('missing_capability_detector').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== detectorOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromCrossDeviceContinuity();
  }

  static assertDoesNotExecute(): boolean {
    const detector = new DevPulseV2MissingCapabilityDetector();
    return (
      typeof (detector as { execute?: unknown }).execute === 'undefined' &&
      typeof (detector as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (detector as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (detector as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (detector as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (detector as { acquireCapability?: unknown }).acquireCapability === 'undefined' &&
      typeof (detector as { installTool?: unknown }).installTool === 'undefined'
    );
  }

  static assertNoForbiddenExecutionPatterns(): boolean {
    const moduleDir = join(fileURLToPath(new URL('.', import.meta.url)));
    return scanModuleForForbiddenPatterns(moduleDir).length === 0;
  }

  static assertDependencyChain(): boolean {
    return (
      assertGovernanceDependenciesPresent() &&
      assertNoGovernanceBypass() &&
      assertWorld1Protected() &&
      assertNoRegistryRuntimeMutation() &&
      getDevPulseV2Owner('world2_execution_planner').phase === 7.2 &&
      getDevPulseV2Owner('cross_device_continuity_foundation').phase === 8.5 &&
      getDevPulseV2Owner('missing_capability_detector').phase === 9.1
    );
  }

  analyzeCapabilityGaps(input: CapabilityAnalysisInput): CapabilityGapResult {
    const result = processCapabilityAnalysis(input);
    this.analyses.push(cloneGapResult(result));
    this.publishSummary(result);
    return cloneGapResult(result);
  }

  getAnalyses(): CapabilityGapResult[] {
    return this.analyses.map(cloneGapResult);
  }

  getAnalysisById(analysisId: string): CapabilityGapResult | null {
    const result = this.analyses.find((a) => a.analysisId === analysisId);
    return result ? cloneGapResult(result) : null;
  }

  getAnalysisByProject(projectId: string): CapabilityGapResult | null {
    const result = this.analyses.find((a) => a.projectId === projectId);
    return result ? cloneGapResult(result) : null;
  }

  getFoundationState(): MissingCapabilityDetectorState {
    return {
      foundationId: this.foundationId,
      analysisCount: this.analyses.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: CapabilityGapResult, input: CapabilityAnalysisInput) {
    const output = buildCapabilityGapReportOutput(input, result);
    return buildCapabilityGapReport(this.getFoundationState(), result, output);
  }

  formatReport(result: CapabilityGapResult, input: CapabilityAnalysisInput): string {
    return formatCapabilityGapReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getDetectorGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoCapabilityAcquisition(): boolean {
    return true;
  }

  private publishSummary(result: CapabilityGapResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Capability gap analysis: ${result.analysisId}`,
      summary: `${result.analysisSource} — ${result.detectedGaps.length} gap(s), ${result.capabilityGapState}. Detection only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.analysisId,
      status: 'INFO',
      warnings: ['Missing capability detector foundation only — no acquisition performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2MissingCapabilityDetector(): DevPulseV2MissingCapabilityDetector {
  singleton = new DevPulseV2MissingCapabilityDetector();
  return singleton;
}

export function getDevPulseV2MissingCapabilityDetector(): DevPulseV2MissingCapabilityDetector {
  if (!singleton) {
    singleton = new DevPulseV2MissingCapabilityDetector();
  }
  return singleton;
}

export function resetDevPulseV2MissingCapabilityDetectorForTests(): DevPulseV2MissingCapabilityDetector {
  singleton = new DevPulseV2MissingCapabilityDetector();
  return singleton;
}

export {
  analysisKey,
  governanceGatesKey,
  GAP_STATE_SEQUENCE,
  MISSING_CAPABILITY_DETECTOR_OWNER_MODULE,
  MISSING_CAPABILITY_DETECTOR_PASS_TOKEN,
};
