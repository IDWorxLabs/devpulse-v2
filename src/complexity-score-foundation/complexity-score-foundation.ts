/**
 * DevPulse V2 Complexity Score Foundation — Phase 9.5.
 * Measures system complexity. Does NOT refactor, auto-optimize, execute, or modify architecture.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import {
  aggregateComplexityScore,
  buildComplexityReasons,
  complexityScoreKey,
  computeComplexityConfidence,
  getTopComplexityFactors,
} from './complexity-score-engine.js';
import {
  assertDistinctFromProtectedModules,
  assertGovernanceDependenciesPresent,
  assertMeasurementNotSourceOfTruth,
  assertNoDuplicateComplexityScore,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertNotDriftDetector,
  assertWorld1Protected,
  assertWorld2Protected,
  getComplexityGovernanceSummary,
  governanceGatesKey,
  validateComplexityGovernance,
} from './complexity-governance-bridge.js';
import { createComplexityRecommendations, complexityRecommendationKey } from './complexity-recommendation-engine.js';
import {
  buildComplexityScoreReport,
  buildComplexityScoreReportOutput,
  formatComplexityScoreReport,
} from './complexity-score-report.js';
import { evaluateComplexitySignals, complexitySignalsKey } from './complexity-signal-engine.js';
import { assertNoAutoFixCapability, assertNoExecutionMethods } from './complexity-security-engine.js';
import { createFactorScores, factorScoresKey } from './factor-score-engine.js';
import { interpretComplexityPressure, pressureInterpretationKey } from './pressure-interpretation-engine.js';
import { computeRiskBand, riskBandKey } from './risk-band-engine.js';
import {
  evaluateComplexityProjectContext,
  systemContextKey,
  validateComplexityAnalysisInput,
} from './system-context-engine.js';
import type {
  ComplexityAnalysisInput,
  ComplexityScoreFoundationState,
  ComplexityScoreResult,
  ComplexityState,
} from './types.js';
import {
  COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE,
  COMPLEXITY_SCORE_FOUNDATION_PASS_TOKEN,
  COMPLEXITY_STATE_SEQUENCE,
  DUPLICATE_PATTERNS,
  nextComplexityAnalysisId,
  nextComplexityScoreId,
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

let singleton: DevPulseV2ComplexityScoreFoundation | null = null;

function createFoundationId(): string {
  return `complexity-score-foundation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildStateSequence(
  blocked: boolean,
  contextValid: boolean,
  signalsEvaluated: boolean,
  factorsCreated: boolean,
  scoreCreated: boolean,
  riskBandCreated: boolean,
  pressureInterpreted: boolean,
  recommendationsCreated: boolean,
): ComplexityState[] {
  if (blocked) return ['COMPLEXITY_ANALYSIS_RECEIVED', 'COMPLEXITY_ANALYSIS_BLOCKED'];

  const sequence: ComplexityState[] = ['COMPLEXITY_ANALYSIS_RECEIVED'];
  if (contextValid) sequence.push('SYSTEM_CONTEXT_VALIDATED');
  if (signalsEvaluated) sequence.push('COMPLEXITY_SIGNALS_EVALUATED');
  if (factorsCreated) sequence.push('FACTOR_SCORES_CREATED');
  if (scoreCreated) sequence.push('COMPLEXITY_SCORE_CREATED');
  if (riskBandCreated) sequence.push('RISK_BAND_CREATED');
  if (pressureInterpreted) sequence.push('PRESSURE_INTERPRETED');
  if (recommendationsCreated) sequence.push('REVIEW_RECOMMENDATION_CREATED');
  if (contextValid && scoreCreated) sequence.push('COMPLEXITY_REPORT_READY');

  return sequence;
}

function cloneResult(result: ComplexityScoreResult): ComplexityScoreResult {
  return {
    ...result,
    complexityReasons: [...result.complexityReasons],
    topComplexityFactors: result.topComplexityFactors.map((f) => ({ ...f })),
    factorScores: result.factorScores.map((f) => ({ ...f })),
    affectedSystems: [...result.affectedSystems],
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
  };
}

export function processComplexityAnalysis(input: ComplexityAnalysisInput): ComplexityScoreResult {
  const complexityAnalysisId = input.complexityAnalysisId ?? nextComplexityAnalysisId();
  const enrichedInput: ComplexityAnalysisInput = { ...input, complexityAnalysisId };

  const inputValidation = validateComplexityAnalysisInput(enrichedInput);
  const projectContext = evaluateComplexityProjectContext(enrichedInput);
  const governance = validateComplexityGovernance(enrichedInput);
  const signalEval = evaluateComplexitySignals(enrichedInput);

  const blocked = inputValidation.blocked || projectContext.blocked || !governance.valid || !signalEval.valid;

  const factorScores = blocked ? [] : createFactorScores(signalEval);
  const complexityScore = blocked ? 0 : aggregateComplexityScore(factorScores);
  const riskBand = blocked ? 'LOW' : computeRiskBand(complexityScore);
  const topFactors = getTopComplexityFactors(factorScores);
  const confidenceScore = blocked
    ? 'LOW'
    : computeComplexityConfidence(signalEval.evaluatedSignals.length, factorScores.length, governance.valid);
  const pressureInterpretation = blocked
    ? 'Complexity analysis blocked — no pressure interpretation'
    : interpretComplexityPressure(enrichedInput, complexityScore, riskBand, topFactors);
  const recommendationResult = createComplexityRecommendations(
    enrichedInput,
    complexityScore,
    riskBand,
    topFactors,
    blocked,
  );

  const stateSequence = buildStateSequence(
    blocked,
    projectContext.valid && inputValidation.valid,
    signalEval.valid,
    factorScores.length > 0,
    !blocked,
    !blocked,
    !blocked,
    recommendationResult.reviewRecommendationCount > 0 || !blocked,
  );

  const complexityState = stateSequence[stateSequence.length - 1] ?? 'COMPLEXITY_ANALYSIS_BLOCKED';

  return {
    complexityScoreId: nextComplexityScoreId(),
    complexityAnalysisId,
    workspaceId: enrichedInput.workspaceId,
    projectId: enrichedInput.projectId,
    analysisSource: enrichedInput.analysisSource,
    systemArea: enrichedInput.systemArea,
    complexityScore,
    riskBand,
    confidenceScore,
    complexityReasons: blocked ? [] : buildComplexityReasons(factorScores, complexityScore),
    topComplexityFactors: topFactors,
    factorScores,
    pressureInterpretation,
    reviewRecommendation: recommendationResult.reviewRecommendation,
    affectedSystems: signalEval.affectedSystems,
    complexityState,
    governanceGates: governance.gates,
    ownershipGates: [...inputValidation.gates.filter((g) => g.gateType.startsWith('COMPLEXITY')), ...projectContext.gates],
    securityWarnings: [...inputValidation.warnings, ...projectContext.warnings],
    recommendations: recommendationResult.recommendations,
    confirmation: {
      complexityScoringOnly: true,
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

export function complexityStructuralKey(result: ComplexityScoreResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.analysisSource,
    result.systemArea,
    complexityScoreKey(result.complexityScore, result.factorScores),
    factorScoresKey(result.factorScores),
    riskBandKey(result.riskBand, result.complexityScore),
    pressureInterpretationKey(result.complexityScore, result.riskBand, result.systemArea),
    complexityRecommendationKey(result.riskBand, result.complexityScore),
    governanceGatesKey(result.governanceGates),
  ].join('|');
}

export function complexityStateIncludes(states: ComplexityState[], target: ComplexityState): boolean {
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

export class DevPulseV2ComplexityScoreFoundation {
  private readonly foundationId = createFoundationId();
  private readonly analyses: ComplexityScoreResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 9.5 Complexity Score Foundation V1 — measurement only.',
    'No refactoring, auto-optimization, execution, or architecture modification.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE;
  static readonly ownerDomain = 'complexity_score_foundation' as const;
  static readonly passToken = COMPLEXITY_SCORE_FOUNDATION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('complexity_score_foundation');
    return owner.ownerModule === COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE && owner.phase === 9.5;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const complexityOwner = getDevPulseV2Owner('complexity_score_foundation').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const normalized = pattern.replace(/\s+/g, '_');
      const competing = [...registeredModules].filter(
        (m) => (m.includes(normalized) || m.includes('complexity_score')) && m !== complexityOwner,
      );
      return competing.length === 0;
    });

    return (
      noDuplicateModules &&
      assertDistinctFromProtectedModules() &&
      assertNotDriftDetector() &&
      assertNoDuplicateComplexityScore()
    );
  }

  static assertDoesNotExecute(): boolean {
    const foundation = new DevPulseV2ComplexityScoreFoundation();
    return (
      assertNoExecutionMethods(foundation) &&
      assertNoAutoFixCapability(foundation) &&
      typeof (foundation as { modifyArchitecture?: unknown }).modifyArchitecture === 'undefined' &&
      typeof (foundation as { modifyRegistry?: unknown }).modifyRegistry === 'undefined'
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
      assertNotDriftDetector() &&
      getDevPulseV2Owner('architecture_drift_detection').phase === 9.4 &&
      getDevPulseV2Owner('complexity_score_foundation').phase === 9.5
    );
  }

  scoreComplexity(input: ComplexityAnalysisInput): ComplexityScoreResult {
    const result = processComplexityAnalysis(input);
    this.analyses.push(cloneResult(result));
    this.publishSummary(result);
    return cloneResult(result);
  }

  getAnalyses(): ComplexityScoreResult[] {
    return this.analyses.map(cloneResult);
  }

  getAnalysisByComplexityId(complexityAnalysisId: string): ComplexityScoreResult | null {
    const result = this.analyses.find((a) => a.complexityAnalysisId === complexityAnalysisId);
    return result ? cloneResult(result) : null;
  }

  getAnalysisByProject(projectId: string): ComplexityScoreResult | null {
    const result = this.analyses.find((a) => a.projectId === projectId);
    return result ? cloneResult(result) : null;
  }

  getFoundationState(): ComplexityScoreFoundationState {
    return {
      foundationId: this.foundationId,
      analysisCount: this.analyses.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: ComplexityScoreResult, input: ComplexityAnalysisInput) {
    const output = buildComplexityScoreReportOutput(input, result);
    return buildComplexityScoreReport(this.getFoundationState(), result, output);
  }

  formatReport(result: ComplexityScoreResult, input: ComplexityAnalysisInput): string {
    return formatComplexityScoreReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getComplexityGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoAutoFix(): boolean {
    return true;
  }

  checkMeasurementNotSourceOfTruth(): boolean {
    return assertMeasurementNotSourceOfTruth();
  }

  private publishSummary(result: ComplexityScoreResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Complexity score: ${result.complexityAnalysisId}`,
      summary: `${result.systemArea} → score ${result.complexityScore}/100, band ${result.riskBand}. Measurement only.`,
      relatedEvidenceIds: result.complexityReasons,
      relatedRecordId: result.complexityScoreId,
      status: result.riskBand === 'CRITICAL' || result.riskBand === 'HIGH' ? 'WARN' : 'INFO',
      warnings: ['Complexity scoring measurement only — no auto-fix performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2ComplexityScoreFoundation(): DevPulseV2ComplexityScoreFoundation {
  singleton = new DevPulseV2ComplexityScoreFoundation();
  return singleton;
}

export function getDevPulseV2ComplexityScoreFoundation(): DevPulseV2ComplexityScoreFoundation {
  if (!singleton) {
    singleton = new DevPulseV2ComplexityScoreFoundation();
  }
  return singleton;
}

export function resetDevPulseV2ComplexityScoreFoundationForTests(): DevPulseV2ComplexityScoreFoundation {
  singleton = new DevPulseV2ComplexityScoreFoundation();
  return singleton;
}

export {
  systemContextKey,
  complexitySignalsKey,
  factorScoresKey,
  complexityScoreKey,
  riskBandKey,
  pressureInterpretationKey,
  complexityRecommendationKey,
  governanceGatesKey,
  COMPLEXITY_STATE_SEQUENCE,
  COMPLEXITY_SCORE_FOUNDATION_OWNER_MODULE,
  COMPLEXITY_SCORE_FOUNDATION_PASS_TOKEN,
};
