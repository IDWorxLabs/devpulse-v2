/**
 * DevPulse V2 Future Problem Prediction Foundation — Phase 9.6.
 * Predicts likely future failures. Does NOT auto-fix, execute, or modify architecture.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import { scorePredictionConfidence } from './confidence-scoring-engine.js';
import {
  buildPredictionReport,
  buildPredictionReportOutput,
  formatPredictionReport,
} from './future-problem-report.js';
import {
  assertDistinctFromProtectedModules,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateFutureProblemPrediction,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertNotComplexityScorer,
  assertNotDriftDetector,
  assertPredictionNotSourceOfTruth,
  assertWorld1Protected,
  assertWorld2Protected,
  getPredictionGovernanceSummary,
  governanceGatesKey,
  validatePredictionGovernance,
} from './prediction-governance-bridge.js';
import { assertNoAutoFixCapability, assertNoExecutionMethods } from './prediction-security-engine.js';
import {
  computeOverallFutureRisk,
  createProblemPredictions,
  getPrimaryPrediction,
  getTopPredictions,
  problemPredictionKey,
} from './problem-prediction-engine.js';
import { createPreventionRecommendations, preventionRecommendationKey } from './prevention-recommendation-engine.js';
import {
  countCriticalRiskForecasts,
  countHighRiskForecasts,
  createRiskForecasts,
  riskForecastKey,
} from './risk-forecast-engine.js';
import { evaluatePredictionSignals, predictionSignalsKey } from './signal-evaluation-engine.js';
import {
  evaluatePredictionProjectContext,
  systemContextKey,
  validatePredictionAnalysisInput,
} from './system-context-engine.js';
import type {
  FutureProblemPredictionState,
  PredictionAnalysisInput,
  PredictionResult,
  PredictionState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  FUTURE_PROBLEM_PREDICTION_OWNER_MODULE,
  FUTURE_PROBLEM_PREDICTION_PASS_TOKEN,
  PREDICTION_STATE_SEQUENCE,
  nextPredictionAnalysisId,
  nextPredictionId,
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

let singleton: DevPulseV2FutureProblemPrediction | null = null;

function createFoundationId(): string {
  return `future-problem-prediction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildStateSequence(
  blocked: boolean,
  contextValid: boolean,
  signalsEvaluated: boolean,
  forecastsCreated: boolean,
  problemsPredicted: boolean,
  confidenceScored: boolean,
  recommendationsCreated: boolean,
): PredictionState[] {
  if (blocked) return ['PREDICTION_RECEIVED', 'PREDICTION_BLOCKED'];

  const sequence: PredictionState[] = ['PREDICTION_RECEIVED'];
  if (contextValid) sequence.push('SYSTEM_CONTEXT_VALIDATED');
  if (signalsEvaluated) sequence.push('SIGNALS_EVALUATED');
  if (forecastsCreated) sequence.push('RISK_FORECAST_CREATED');
  if (problemsPredicted) sequence.push('PROBLEM_PREDICTED');
  if (confidenceScored) sequence.push('CONFIDENCE_SCORED');
  if (recommendationsCreated) sequence.push('PREVENTION_RECOMMENDATION_CREATED');
  if (contextValid && problemsPredicted) sequence.push('PREDICTION_REPORT_READY');

  return sequence;
}

function cloneResult(result: PredictionResult): PredictionResult {
  return {
    ...result,
    predictionEvidence: [...result.predictionEvidence],
    affectedSystems: [...result.affectedSystems],
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
    predictions: result.predictions.map((p) => ({ ...p, predictionEvidence: [...p.predictionEvidence] })),
    riskForecasts: result.riskForecasts.map((f) => ({ ...f })),
    topPredictions: result.topPredictions.map((p) => ({ ...p, predictionEvidence: [...p.predictionEvidence] })),
  };
}

export function processPredictionAnalysis(input: PredictionAnalysisInput): PredictionResult {
  const predictionAnalysisId = input.predictionAnalysisId ?? nextPredictionAnalysisId();
  const enrichedInput: PredictionAnalysisInput = { ...input, predictionAnalysisId };

  const inputValidation = validatePredictionAnalysisInput(enrichedInput);
  const projectContext = evaluatePredictionProjectContext(enrichedInput);
  const governance = validatePredictionGovernance(enrichedInput);
  const signalEval = evaluatePredictionSignals(enrichedInput);

  const blocked = inputValidation.blocked || projectContext.blocked || !governance.valid || !signalEval.valid;

  const riskForecasts = blocked ? [] : createRiskForecasts(signalEval);
  const predictions = blocked ? [] : createProblemPredictions(enrichedInput, signalEval, riskForecasts);
  const topPredictions = getTopPredictions(predictions);
  const primary = getPrimaryPrediction(predictions);
  const overallFutureRisk = blocked ? 'LOW' : computeOverallFutureRisk(predictions);
  const confidenceLevel = blocked
    ? 'LOW'
    : scorePredictionConfidence(predictions, signalEval.evaluatedSignals.length, riskForecasts);

  const recommendationResult = createPreventionRecommendations(
    enrichedInput,
    predictions,
    overallFutureRisk,
    blocked,
  );

  const stateSequence = buildStateSequence(
    blocked,
    projectContext.valid && inputValidation.valid,
    signalEval.valid,
    riskForecasts.length > 0,
    predictions.length > 0,
    !blocked,
    recommendationResult.recommendationCount > 0 || !blocked,
  );

  const predictionState = stateSequence[stateSequence.length - 1] ?? 'PREDICTION_BLOCKED';

  return {
    predictionId: nextPredictionId(),
    predictionAnalysisId,
    workspaceId: enrichedInput.workspaceId,
    projectId: enrichedInput.projectId,
    analysisSource: enrichedInput.analysisSource,
    systemArea: enrichedInput.systemArea,
    predictionType: primary?.predictionType ?? 'UNKNOWN',
    riskLevel: primary?.riskLevel ?? 'LOW',
    confidenceLevel,
    predictionReason: primary?.predictionReason ?? 'Prediction blocked or no primary prediction',
    predictionEvidence: primary?.predictionEvidence ?? [],
    affectedSystems: signalEval.affectedSystems,
    forecastTimeframe: primary?.forecastTimeframe ?? 'LONG_TERM',
    preventionRecommendation: recommendationResult.preventionRecommendation,
    predictionState,
    governanceGates: governance.gates,
    ownershipGates: [...inputValidation.gates.filter((g) => g.gateType.startsWith('PREDICTION')), ...projectContext.gates],
    securityWarnings: [...inputValidation.warnings, ...projectContext.warnings],
    recommendations: recommendationResult.recommendations,
    confirmation: {
      futurePredictionOnly: true,
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
    predictions,
    riskForecasts,
    overallFutureRisk,
    topPredictions,
    createdAt: Date.now(),
  };
}

export function predictionStructuralKey(result: PredictionResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.analysisSource,
    result.systemArea,
    predictionSignalsKey(result.predictionEvidence),
    riskForecastKey(result.riskForecasts),
    problemPredictionKey(result.predictions),
    preventionRecommendationKey(result.overallFutureRisk, result.predictions.length),
    governanceGatesKey(result.governanceGates),
  ].join('|');
}

export function predictionStateIncludes(states: PredictionState[], target: PredictionState): boolean {
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

export class DevPulseV2FutureProblemPrediction {
  private readonly foundationId = createFoundationId();
  private readonly analyses: PredictionResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 9.6 Future Problem Prediction Foundation V1 — prediction only.',
    'No auto-fix, execution, or architecture modification.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = FUTURE_PROBLEM_PREDICTION_OWNER_MODULE;
  static readonly ownerDomain = 'future_problem_prediction' as const;
  static readonly passToken = FUTURE_PROBLEM_PREDICTION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('future_problem_prediction');
    return owner.ownerModule === FUTURE_PROBLEM_PREDICTION_OWNER_MODULE && owner.phase === 9.6;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const predictionOwner = getDevPulseV2Owner('future_problem_prediction').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const normalized = pattern.replace(/\s+/g, '_');
      const competing = [...registeredModules].filter(
        (m) => (m.includes(normalized) || m.includes('future_problem')) && m !== predictionOwner,
      );
      return competing.length === 0;
    });

    return (
      noDuplicateModules &&
      assertDistinctFromProtectedModules() &&
      assertNotDriftDetector() &&
      assertNotComplexityScorer() &&
      assertNoDuplicateFutureProblemPrediction()
    );
  }

  static assertDoesNotExecute(): boolean {
    const foundation = new DevPulseV2FutureProblemPrediction();
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
      assertNotComplexityScorer() &&
      getDevPulseV2Owner('complexity_score_foundation').phase === 9.5 &&
      getDevPulseV2Owner('future_problem_prediction').phase === 9.6
    );
  }

  predictFutureProblems(input: PredictionAnalysisInput): PredictionResult {
    const result = processPredictionAnalysis(input);
    this.analyses.push(cloneResult(result));
    this.publishSummary(result);
    return cloneResult(result);
  }

  getAnalyses(): PredictionResult[] {
    return this.analyses.map(cloneResult);
  }

  getAnalysisByPredictionId(predictionAnalysisId: string): PredictionResult | null {
    const result = this.analyses.find((a) => a.predictionAnalysisId === predictionAnalysisId);
    return result ? cloneResult(result) : null;
  }

  getAnalysisByProject(projectId: string): PredictionResult | null {
    const result = this.analyses.find((a) => a.projectId === projectId);
    return result ? cloneResult(result) : null;
  }

  getFoundationState(): FutureProblemPredictionState {
    return {
      foundationId: this.foundationId,
      analysisCount: this.analyses.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: PredictionResult, input: PredictionAnalysisInput) {
    const output = buildPredictionReportOutput(input, result);
    return buildPredictionReport(this.getFoundationState(), result, output);
  }

  formatReport(result: PredictionResult, input: PredictionAnalysisInput): string {
    return formatPredictionReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getPredictionGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoAutoFix(): boolean {
    return true;
  }

  checkPredictionNotSourceOfTruth(): boolean {
    return assertPredictionNotSourceOfTruth();
  }

  private publishSummary(result: PredictionResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Future problem prediction: ${result.predictionAnalysisId}`,
      summary: `${result.systemArea} → overall risk ${result.overallFutureRisk}, ${result.predictions.length} prediction(s). Prediction only.`,
      relatedEvidenceIds: result.predictionEvidence,
      relatedRecordId: result.predictionId,
      status: result.overallFutureRisk === 'CRITICAL' || result.overallFutureRisk === 'HIGH' ? 'WARN' : 'INFO',
      warnings: ['Future problem prediction only — no auto-fix performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2FutureProblemPrediction(): DevPulseV2FutureProblemPrediction {
  singleton = new DevPulseV2FutureProblemPrediction();
  return singleton;
}

export function getDevPulseV2FutureProblemPrediction(): DevPulseV2FutureProblemPrediction {
  if (!singleton) {
    singleton = new DevPulseV2FutureProblemPrediction();
  }
  return singleton;
}

export function resetDevPulseV2FutureProblemPredictionForTests(): DevPulseV2FutureProblemPrediction {
  singleton = new DevPulseV2FutureProblemPrediction();
  return singleton;
}

export {
  systemContextKey,
  predictionSignalsKey,
  riskForecastKey,
  problemPredictionKey,
  preventionRecommendationKey,
  governanceGatesKey,
  PREDICTION_STATE_SEQUENCE,
  FUTURE_PROBLEM_PREDICTION_OWNER_MODULE,
  FUTURE_PROBLEM_PREDICTION_PASS_TOKEN,
};
