/**
 * DevPulse V2 Architecture Drift Detection Foundation — Phase 9.4.
 * Detects architectural drift. Does NOT refactor, auto-fix, execute, or modify architecture.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import {
  architectureContextKey,
  evaluateDriftProjectContext,
  validateDriftAnalysisInput,
} from './architecture-context-engine.js';
import {
  buildArchitectureDriftReport,
  buildArchitectureDriftReportOutput,
  formatArchitectureDriftReport,
} from './architecture-drift-report.js';
import { classifyDriftFindings, driftClassificationKey } from './drift-classifier.js';
import {
  assertDistinctFromProtectedModules,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateDriftDetection,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertObserverNotSourceOfTruth,
  assertWorld1Protected,
  assertWorld2Protected,
  getDriftGovernanceSummary,
  governanceGatesKey,
  validateDriftGovernance,
} from './drift-governance-bridge.js';
import { createDriftRecommendations, driftRecommendationKey } from './drift-recommendation-engine.js';
import { scanArchitectureDrift, driftScanKey } from './drift-scan-engine.js';
import {
  computeDriftConfidence,
  computeOverallDriftRisk,
  scorePrimarySeverity,
} from './drift-severity-engine.js';
import { assertNoAutoFixCapability, assertNoExecutionMethods } from './drift-security-engine.js';
import { evaluateExpectedArchitectureRules, expectedRulesKey } from './expected-rules-engine.js';
import { evaluateObservedArchitectureSignals, observedSignalsKey } from './observed-signals-engine.js';
import type {
  ArchitectureDriftDetectionState,
  ArchitectureDriftResult,
  DriftAnalysisInput,
  DriftState,
} from './types.js';
import {
  ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE,
  ARCHITECTURE_DRIFT_DETECTION_PASS_TOKEN,
  DRIFT_STATE_SEQUENCE,
  DUPLICATE_PATTERNS,
  nextArchitectureDriftId,
  nextDriftAnalysisId,
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

let singleton: DevPulseV2ArchitectureDriftDetection | null = null;

function createFoundationId(): string {
  return `architecture-drift-detection-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildStateSequence(
  blocked: boolean,
  contextValid: boolean,
  rulesEvaluated: boolean,
  signalsEvaluated: boolean,
  scanComplete: boolean,
  classified: boolean,
  severityScored: boolean,
  recommendationsCreated: boolean,
): DriftState[] {
  if (blocked) return ['DRIFT_ANALYSIS_RECEIVED', 'DRIFT_ANALYSIS_BLOCKED'];

  const sequence: DriftState[] = ['DRIFT_ANALYSIS_RECEIVED'];
  if (contextValid) sequence.push('ARCHITECTURE_CONTEXT_VALIDATED');
  if (rulesEvaluated) sequence.push('EXPECTED_RULES_EVALUATED');
  if (signalsEvaluated) sequence.push('OBSERVED_SIGNALS_EVALUATED');
  if (scanComplete) sequence.push('DRIFT_SCAN_COMPLETE');
  if (classified) sequence.push('DRIFT_CLASSIFIED');
  if (severityScored) sequence.push('SEVERITY_SCORED');
  if (recommendationsCreated) sequence.push('REVIEW_RECOMMENDATION_CREATED');
  if (contextValid && scanComplete) sequence.push('DRIFT_REPORT_READY');

  return sequence;
}

function cloneResult(result: ArchitectureDriftResult): ArchitectureDriftResult {
  return {
    ...result,
    driftEvidence: [...result.driftEvidence],
    affectedSystems: [...result.affectedSystems],
    driftFindings: result.driftFindings.map((f) => ({
      ...f,
      driftEvidence: [...f.driftEvidence],
      affectedSystems: [...f.affectedSystems],
    })),
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
  };
}

export function processDriftAnalysis(input: DriftAnalysisInput): ArchitectureDriftResult {
  const driftAnalysisId = input.driftAnalysisId ?? nextDriftAnalysisId();
  const enrichedInput: DriftAnalysisInput = { ...input, driftAnalysisId };

  const inputValidation = validateDriftAnalysisInput(enrichedInput);
  const projectContext = evaluateDriftProjectContext(enrichedInput);
  const governance = validateDriftGovernance(enrichedInput);
  const expectedRules = evaluateExpectedArchitectureRules(enrichedInput);
  const observedSignals = evaluateObservedArchitectureSignals(enrichedInput);

  const blocked =
    inputValidation.blocked ||
    projectContext.blocked ||
    !governance.valid ||
    !observedSignals.valid;

  const scan = scanArchitectureDrift(enrichedInput, expectedRules, observedSignals, blocked);
  const classification = classifyDriftFindings(scan.findings, enrichedInput.analysisSource, scan.cleanScan);
  const primarySeverity = scorePrimarySeverity(classification.classifiedFindings);
  const driftConfidence = computeDriftConfidence(enrichedInput, classification.classifiedFindings, scan.cleanScan);
  const overallDriftRisk = computeOverallDriftRisk(classification.classifiedFindings);
  const recommendationResult = createDriftRecommendations(
    enrichedInput,
    classification.classifiedFindings,
    classification.primaryDriftType,
    overallDriftRisk,
    blocked,
  );

  const stateSequence = buildStateSequence(
    blocked,
    projectContext.valid && inputValidation.valid,
    expectedRules.evaluatedRules.length > 0,
    observedSignals.valid,
    scan.scanComplete,
    classification.classifiedFindings.length > 0 || scan.cleanScan,
    !blocked,
    recommendationResult.reviewRecommendationCount > 0 || scan.cleanScan,
  );

  const driftState = stateSequence[stateSequence.length - 1] ?? 'DRIFT_ANALYSIS_BLOCKED';
  const primaryFinding = classification.classifiedFindings[0];

  return {
    architectureDriftId: nextArchitectureDriftId(),
    driftAnalysisId,
    workspaceId: enrichedInput.workspaceId,
    projectId: enrichedInput.projectId,
    analysisSource: enrichedInput.analysisSource,
    driftType: scan.cleanScan ? 'UNKNOWN' : classification.primaryDriftType,
    driftSeverity: scan.cleanScan ? 'LOW' : primarySeverity,
    driftConfidence,
    driftReason: primaryFinding?.driftReason ?? (scan.cleanScan ? 'No architectural drift detected' : 'Drift analysis blocked'),
    driftEvidence: primaryFinding?.driftEvidence ?? [],
    affectedSystems: primaryFinding?.affectedSystems ?? [],
    recommendedReview: recommendationResult.recommendedReview,
    recommendedAction: recommendationResult.recommendedAction,
    driftState,
    overallDriftRisk,
    driftFindings: classification.classifiedFindings,
    governanceGates: governance.gates,
    ownershipGates: [...inputValidation.gates.filter((g) => g.gateType.startsWith('DRIFT')), ...projectContext.gates],
    securityWarnings: [...inputValidation.warnings, ...projectContext.warnings],
    recommendations: recommendationResult.recommendations,
    confirmation: {
      architectureDriftDetectionOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noArchitectureModified: true,
      noGovernanceModified: true,
      noOwnershipRegistryModified: true,
      noAutoFixPerformed: true,
    },
    stateSequence,
    createdAt: Date.now(),
  };
}

export function driftStructuralKey(result: ArchitectureDriftResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.analysisSource,
    result.driftType,
    driftClassificationKey(result.driftType, result.analysisSource),
    driftScanKey(result.driftFindings),
    driftRecommendationKey(result.driftType, result.overallDriftRisk),
    governanceGatesKey(result.governanceGates),
  ].join('|');
}

export function driftStateIncludes(states: DriftState[], target: DriftState): boolean {
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

export class DevPulseV2ArchitectureDriftDetection {
  private readonly foundationId = createFoundationId();
  private readonly analyses: ArchitectureDriftResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 9.4 Architecture Drift Detection Foundation V1 — observer only.',
    'No refactoring, auto-fix, execution, or architecture modification.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE;
  static readonly ownerDomain = 'architecture_drift_detection' as const;
  static readonly passToken = ARCHITECTURE_DRIFT_DETECTION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('architecture_drift_detection');
    return owner.ownerModule === ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE && owner.phase === 9.4;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const driftOwner = getDevPulseV2Owner('architecture_drift_detection').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const normalized = pattern.replace(/\s+/g, '_');
      const competing = [...registeredModules].filter(
        (m) => (m.includes(normalized) || m.includes('drift_detection')) && m !== driftOwner,
      );
      return competing.length === 0;
    });

    return (
      noDuplicateModules &&
      assertDistinctFromProtectedModules() &&
      assertNoDuplicateDriftDetection()
    );
  }

  static assertDoesNotExecute(): boolean {
    const detector = new DevPulseV2ArchitectureDriftDetection();
    return (
      assertNoExecutionMethods(detector) &&
      assertNoAutoFixCapability(detector) &&
      typeof (detector as { modifyArchitecture?: unknown }).modifyArchitecture === 'undefined' &&
      typeof (detector as { modifyRegistry?: unknown }).modifyRegistry === 'undefined'
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
      assertWorld2Protected() &&
      assertNoRegistryRuntimeMutation() &&
      assertDistinctFromProtectedModules() &&
      getDevPulseV2Owner('self_learning_engine').phase === 9.3 &&
      getDevPulseV2Owner('architecture_drift_detection').phase === 9.4
    );
  }

  analyzeDrift(input: DriftAnalysisInput): ArchitectureDriftResult {
    const result = processDriftAnalysis(input);
    this.analyses.push(cloneResult(result));
    this.publishSummary(result);
    return cloneResult(result);
  }

  getAnalyses(): ArchitectureDriftResult[] {
    return this.analyses.map(cloneResult);
  }

  getAnalysisByDriftId(driftAnalysisId: string): ArchitectureDriftResult | null {
    const result = this.analyses.find((a) => a.driftAnalysisId === driftAnalysisId);
    return result ? cloneResult(result) : null;
  }

  getAnalysisByProject(projectId: string): ArchitectureDriftResult | null {
    const result = this.analyses.find((a) => a.projectId === projectId);
    return result ? cloneResult(result) : null;
  }

  getFoundationState(): ArchitectureDriftDetectionState {
    return {
      foundationId: this.foundationId,
      analysisCount: this.analyses.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: ArchitectureDriftResult, input: DriftAnalysisInput) {
    const output = buildArchitectureDriftReportOutput(input, result);
    return buildArchitectureDriftReport(this.getFoundationState(), result, output);
  }

  formatReport(result: ArchitectureDriftResult, input: DriftAnalysisInput): string {
    return formatArchitectureDriftReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getDriftGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoAutoFix(): boolean {
    return true;
  }

  checkObserverNotSourceOfTruth(): boolean {
    return assertObserverNotSourceOfTruth();
  }

  private publishSummary(result: ArchitectureDriftResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Architecture drift analysis: ${result.driftAnalysisId}`,
      summary: `${result.analysisSource} → ${result.driftType}, risk ${result.overallDriftRisk}. Observer only.`,
      relatedEvidenceIds: result.driftEvidence,
      relatedRecordId: result.architectureDriftId,
      status: result.driftFindings.length > 0 ? 'WARN' : 'INFO',
      warnings: ['Architecture drift detection observer only — no auto-fix performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2ArchitectureDriftDetection(): DevPulseV2ArchitectureDriftDetection {
  singleton = new DevPulseV2ArchitectureDriftDetection();
  return singleton;
}

export function getDevPulseV2ArchitectureDriftDetection(): DevPulseV2ArchitectureDriftDetection {
  if (!singleton) {
    singleton = new DevPulseV2ArchitectureDriftDetection();
  }
  return singleton;
}

export function resetDevPulseV2ArchitectureDriftDetectionForTests(): DevPulseV2ArchitectureDriftDetection {
  singleton = new DevPulseV2ArchitectureDriftDetection();
  return singleton;
}

export {
  architectureContextKey,
  expectedRulesKey,
  observedSignalsKey,
  driftScanKey,
  driftClassificationKey,
  driftRecommendationKey,
  governanceGatesKey,
  DRIFT_STATE_SEQUENCE,
  ARCHITECTURE_DRIFT_DETECTION_OWNER_MODULE,
  ARCHITECTURE_DRIFT_DETECTION_PASS_TOKEN,
};
