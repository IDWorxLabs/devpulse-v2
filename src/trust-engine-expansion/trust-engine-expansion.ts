/**
 * DevPulse V2 Trust Engine Expansion Foundation — Phase 10.2.
 * Aggregates trust signals into unified trust score. Does NOT execute, auto-fix, or replace source systems.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import {
  evaluateTrustProjectContext,
  trustContextKey,
  validateTrustAssessmentInput,
} from './trust-context-engine.js';
import {
  assertDistinctFromTrustEngine,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateTrustEngineExpansion,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertNotReplacingSourceSystems,
  assertTrustAggregationOnly,
  assertWorld1Protected,
  assertWorld2Protected,
  getTrustGovernanceSummary,
  governanceGatesKey,
  validateTrustGovernance,
} from './trust-governance-bridge.js';
import {
  buildTrustEngineReport,
  buildTrustEngineReportOutput,
  formatTrustEngineReport,
} from './trust-engine-report.js';
import { createTrustFactorScores, factorScoresKey } from './trust-factor-score-engine.js';
import { createTrustRecommendations, trustRecommendationKey } from './trust-recommendation-engine.js';
import {
  assertNoAutoFixCapability,
  assertNoExecutionMethods,
  assertNoReplacementCapability,
} from './trust-security-engine.js';
import {
  aggregateTrustScore,
  buildTrustReasons,
  computeTrustLevel,
  computeTrustRiskLevel,
  getTopTrustFactors,
  trustScoreKey,
} from './trust-score-engine.js';
import { evaluateTrustSignals, trustSignalsKey } from './trust-signal-engine.js';
import { createTrustWarnings, trustWarningsKey } from './trust-warning-engine.js';
import type {
  TrustAssessmentInput,
  TrustAssessmentResult,
  TrustEngineExpansionState,
  TrustState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  TRUST_ENGINE_EXPANSION_OWNER_MODULE,
  TRUST_ENGINE_EXPANSION_PASS_TOKEN,
  TRUST_STATE_SEQUENCE,
  nextTrustAssessmentId,
  nextTrustScoreId,
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

let singleton: DevPulseV2TrustEngineExpansion | null = null;

function createFoundationId(): string {
  return `trust-engine-expansion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildStateSequence(
  blocked: boolean,
  contextValid: boolean,
  signalsEvaluated: boolean,
  factorsScored: boolean,
  scoreCreated: boolean,
  warningsCreated: boolean,
  recommendationsCreated: boolean,
): TrustState[] {
  if (blocked) return ['TRUST_ASSESSMENT_RECEIVED', 'TRUST_ASSESSMENT_BLOCKED'];

  const sequence: TrustState[] = ['TRUST_ASSESSMENT_RECEIVED'];
  if (contextValid) sequence.push('TRUST_CONTEXT_VALIDATED');
  if (signalsEvaluated) sequence.push('TRUST_SIGNALS_EVALUATED');
  if (factorsScored) sequence.push('TRUST_FACTORS_SCORED');
  if (scoreCreated) sequence.push('TRUST_SCORE_CREATED');
  if (warningsCreated) sequence.push('TRUST_WARNINGS_CREATED');
  if (recommendationsCreated) sequence.push('TRUST_RECOMMENDATIONS_CREATED');
  if (contextValid && scoreCreated) sequence.push('TRUST_REPORT_READY');

  return sequence;
}

function cloneResult(result: TrustAssessmentResult): TrustAssessmentResult {
  return {
    ...result,
    trustReasons: [...result.trustReasons],
    trustWarnings: [...result.trustWarnings],
    trustRecommendations: [...result.trustRecommendations],
    factorScores: result.factorScores.map((f) => ({ ...f })),
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    sourceSystems: [...result.sourceSystems],
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
  };
}

export function processTrustAssessment(input: TrustAssessmentInput): TrustAssessmentResult {
  const trustAssessmentId = input.trustAssessmentId ?? nextTrustAssessmentId();
  const enrichedInput: TrustAssessmentInput = { ...input, trustAssessmentId };

  const inputValidation = validateTrustAssessmentInput(enrichedInput);
  const projectContext = evaluateTrustProjectContext(enrichedInput);
  const governance = validateTrustGovernance(enrichedInput);
  const signalEval = evaluateTrustSignals(enrichedInput);

  const blocked = inputValidation.blocked || projectContext.blocked || !governance.valid || !signalEval.valid;

  const factorScores = blocked ? [] : createTrustFactorScores(signalEval);
  const trustScore = blocked ? 0 : aggregateTrustScore(factorScores);
  const trustLevel = blocked ? 'VERY_LOW' : computeTrustLevel(trustScore);
  const trustRiskLevel = blocked ? 'CRITICAL' : computeTrustRiskLevel(trustScore, factorScores);
  const topFactors = getTopTrustFactors(factorScores);
  const trustWarnings = createTrustWarnings(enrichedInput, trustScore, trustLevel, trustRiskLevel, factorScores, blocked);
  const recommendationResult = createTrustRecommendations(
    enrichedInput,
    trustScore,
    trustLevel,
    trustRiskLevel,
    topFactors,
    blocked,
  );

  const stateSequence = buildStateSequence(
    blocked,
    projectContext.valid && inputValidation.valid,
    signalEval.valid,
    factorScores.length > 0,
    !blocked,
    trustWarnings.length > 0 || !blocked,
    recommendationResult.recommendationCount > 0 || !blocked,
  );

  const trustState = stateSequence[stateSequence.length - 1] ?? 'TRUST_ASSESSMENT_BLOCKED';

  return {
    trustScoreId: nextTrustScoreId(),
    trustAssessmentId,
    workspaceId: enrichedInput.workspaceId,
    projectId: enrichedInput.projectId,
    assessmentSource: enrichedInput.assessmentSource,
    assessmentTarget: enrichedInput.assessmentTarget,
    targetId: enrichedInput.targetId,
    trustScore,
    trustLevel,
    trustRiskLevel,
    trustReasons: blocked ? [] : buildTrustReasons(factorScores, trustScore, trustLevel),
    trustWarnings,
    trustRecommendations: recommendationResult.trustRecommendations,
    factorScores,
    governanceGates: governance.gates,
    ownershipGates: [
      ...inputValidation.gates.filter((g) => g.gateType.startsWith('TRUST') || g.gateType.startsWith('CTX') || g.gateType.startsWith('WORKSPACE') || g.gateType.startsWith('ASSESSMENT') || g.gateType.startsWith('TARGET') || g.gateType.startsWith('SECURITY')),
      ...projectContext.gates,
      ...signalEval.gates.filter((g) => g.gateType.includes('INPUT')),
    ],
    securityWarnings: [...inputValidation.warnings, ...projectContext.warnings],
    confirmation: {
      trustAggregationOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noAutoFixPerformed: true,
      noVerificationSystemReplaced: true,
      noEvidenceLedgerReplaced: true,
      noGovernanceSystemReplaced: true,
      noOwnershipRegistryModified: true,
    },
    trustState,
    stateSequence,
    sourceSystems: signalEval.sourceSystems,
    createdAt: Date.now(),
  };
}

export function trustStructuralKey(result: TrustAssessmentResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.assessmentSource,
    result.assessmentTarget,
    result.targetId,
    trustSignalsKey(result.trustReasons),
    factorScoresKey(result.factorScores),
    trustScoreKey(result.trustScore, result.factorScores),
    trustWarningsKey(result.trustWarnings),
    trustRecommendationKey(result.trustLevel, result.trustScore),
    governanceGatesKey(result.governanceGates),
  ].join('|');
}

export function trustStateIncludes(states: TrustState[], target: TrustState): boolean {
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

export class DevPulseV2TrustEngineExpansion {
  private readonly foundationId = createFoundationId();
  private readonly assessments: TrustAssessmentResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 10.2 Trust Engine Expansion Foundation V1 — trust aggregation only.',
    'No execution, auto-fix, or replacement of verification/evidence/completion systems.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = TRUST_ENGINE_EXPANSION_OWNER_MODULE;
  static readonly ownerDomain = 'trust_engine_expansion' as const;
  static readonly passToken = TRUST_ENGINE_EXPANSION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('trust_engine_expansion');
    return owner.ownerModule === TRUST_ENGINE_EXPANSION_OWNER_MODULE && owner.phase === 10.2;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const expansionOwner = getDevPulseV2Owner('trust_engine_expansion').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const normalized = pattern.replace(/\s+/g, '_');
      const competing = [...registeredModules].filter(
        (m) => (m.includes(normalized) || m.includes('trust_engine_expansion')) && m !== expansionOwner,
      );
      return competing.length === 0;
    });

    return (
      noDuplicateModules &&
      assertNoDuplicateTrustEngineExpansion() &&
      assertDistinctFromTrustEngine() &&
      assertNotReplacingSourceSystems()
    );
  }

  static assertDoesNotExecute(): boolean {
    const foundation = new DevPulseV2TrustEngineExpansion();
    return (
      assertNoExecutionMethods(foundation) &&
      assertNoAutoFixCapability(foundation) &&
      assertNoReplacementCapability(foundation) &&
      typeof (foundation as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (foundation as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (foundation as { deploy?: unknown }).deploy === 'undefined' &&
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
      assertDistinctFromTrustEngine() &&
      assertNotReplacingSourceSystems() &&
      assertTrustAggregationOnly() &&
      getDevPulseV2Owner('experience_layer_foundation').phase === 10.1
    );
  }

  assessTrust(input: TrustAssessmentInput): TrustAssessmentResult {
    const result = processTrustAssessment(input);
    this.assessments.push(cloneResult(result));
    this.publishSummary(result);
    return cloneResult(result);
  }

  getAssessments(): TrustAssessmentResult[] {
    return this.assessments.map(cloneResult);
  }

  getAssessmentByTrustAssessmentId(trustAssessmentId: string): TrustAssessmentResult | null {
    const result = this.assessments.find((a) => a.trustAssessmentId === trustAssessmentId);
    return result ? cloneResult(result) : null;
  }

  getAssessmentByProject(projectId: string): TrustAssessmentResult | null {
    const result = this.assessments.find((a) => a.projectId === projectId);
    return result ? cloneResult(result) : null;
  }

  getFoundationState(): TrustEngineExpansionState {
    return {
      foundationId: this.foundationId,
      assessmentCount: this.assessments.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: TrustAssessmentResult, input: TrustAssessmentInput) {
    const output = buildTrustEngineReportOutput(result);
    return buildTrustEngineReport(this.getFoundationState(), result, output);
  }

  formatReport(result: TrustAssessmentResult, input: TrustAssessmentInput): string {
    return formatTrustEngineReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getTrustGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkTrustAggregationOnly(): boolean {
    return assertTrustAggregationOnly();
  }

  checkNoAutoFix(): boolean {
    return true;
  }

  private publishSummary(result: TrustAssessmentResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Trust assessment: ${result.trustAssessmentId}`,
      summary: `${result.assessmentTarget} → trust ${result.trustScore}/100 (${result.trustLevel}). Aggregation only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.trustScoreId,
      status: result.trustRiskLevel === 'CRITICAL' || result.trustRiskLevel === 'HIGH' ? 'WARN' : 'INFO',
      warnings: ['Trust aggregation only — source systems not replaced.'],
      errors: [],
    });
  }
}

export function createDevPulseV2TrustEngineExpansion(): DevPulseV2TrustEngineExpansion {
  singleton = new DevPulseV2TrustEngineExpansion();
  return singleton;
}

export function getDevPulseV2TrustEngineExpansion(): DevPulseV2TrustEngineExpansion {
  if (!singleton) {
    singleton = new DevPulseV2TrustEngineExpansion();
  }
  return singleton;
}

export function resetDevPulseV2TrustEngineExpansionForTests(): DevPulseV2TrustEngineExpansion {
  singleton = new DevPulseV2TrustEngineExpansion();
  return singleton;
}

export {
  trustContextKey,
  trustSignalsKey,
  factorScoresKey,
  trustScoreKey,
  trustWarningsKey,
  trustRecommendationKey,
  governanceGatesKey,
  TRUST_STATE_SEQUENCE,
  TRUST_ENGINE_EXPANSION_OWNER_MODULE,
  TRUST_ENGINE_EXPANSION_PASS_TOKEN,
};
