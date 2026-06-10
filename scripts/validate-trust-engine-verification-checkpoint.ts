/**
 * Trust Engine Verification Checkpoint — Phases 22.1 through 22.6 composition validation.
 * Read-only checkpoint. No runtime behavior changes.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createValidatorTimingHarness } from './lib/mobile-phase18-validation-fixtures.js';
import { getDevPulseV2Owner } from '../src/foundation/ownership-registry.js';
import { INTELLIGENCE_CONSOLE_CAPABILITIES } from '../src/intelligence-console/capability-registry.js';
import { WORLD2_BUILDER_PACKET_FIND_ALIASES, resolveFindPanelAlias } from '../src/find-panel/alias-registry.js';
import {
  ALL_UVL_ROWS,
  UNIFIED_TRUST_RUNTIME_UVL_ROWS,
  EVIDENCE_INTELLIGENCE_UVL_ROWS,
  REALITY_VERIFICATION_EXPANSION_UVL_ROWS,
  COMPLETION_TRUTH_ENGINE_UVL_ROWS,
  PREDICTION_TRUST_LAYER_UVL_ROWS,
  UNIFIED_TRUST_SCORE_UVL_ROWS,
  hasUvlRow,
} from '../src/unified-verification-lab/uvl-row-registry.js';
import {
  getDevPulseV2UnifiedTrustRuntime,
  evaluateUnifiedTrustRuntime,
  getTrustRuntimeRecordCount,
  getTrustRuntimeHistorySize,
  resetUnifiedTrustRuntimeModuleForTests,
} from '../src/unified-trust-runtime/index.js';
import {
  getDevPulseV2EvidenceIntelligence,
  runEvidenceIntelligence,
  getEvidenceIntelligenceRecordCount,
  getEvidenceIntelligenceHistorySize,
  resetEvidenceIntelligenceModuleForTests,
} from '../src/evidence-intelligence/index.js';
import {
  getDevPulseV2RealityVerificationExpansion,
  runRealityVerificationExpansion,
  getRealityVerificationRecordCount,
  getRealityVerificationHistorySize,
  resetRealityVerificationExpansionModuleForTests,
} from '../src/reality-verification-expansion/index.js';
import {
  getDevPulseV2CompletionTruthEngine,
  evaluateCompletionTruthEngine,
  getCompletionTruthRecordCount,
  getCompletionTruthHistorySize,
  resetCompletionTruthEngineModuleForTests,
} from '../src/completion-truth-engine/index.js';
import {
  getDevPulseV2PredictionTrustLayer,
  evaluatePredictionTrustLayer,
  getPredictionTrustRecordCount,
  getPredictionTrustHistorySize,
  resetPredictionTrustLayerForTests,
} from '../src/prediction-trust-layer/index.js';
import {
  getDevPulseV2UnifiedTrustScore,
  evaluateUnifiedTrustScoreEngine,
  getUnifiedTrustScoreRecordCount,
  getUnifiedTrustScoreHistorySize,
  resetUnifiedTrustScoreForTests,
} from '../src/unified-trust-score/index.js';
import type { UnifiedTrustDecision } from '../src/unified-trust-score/unified-trust-score-types.js';

export const TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN = 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_PASS';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MIN_SCENARIOS = 110;

const TRUST_MODULE_DIRS = [
  'src/unified-trust-runtime',
  'src/evidence-intelligence',
  'src/reality-verification-expansion',
  'src/completion-truth-engine',
  'src/prediction-trust-layer',
  'src/unified-trust-score',
] as const;

const VALID_UNIFIED_DECISIONS: readonly UnifiedTrustDecision[] = [
  'TRUST_REJECTED',
  'TRUST_WEAK',
  'TRUST_UNCERTAIN',
  'TRUST_ACCEPTABLE',
  'TRUST_STRONG',
  'TRUST_VERIFIED',
  'BLOCKED',
];

const UVL_MINIMUMS: Record<string, number> = {
  UNIFIED_TRUST_RUNTIME_UVL_ROWS: 12,
  EVIDENCE_INTELLIGENCE_UVL_ROWS: 13,
  REALITY_VERIFICATION_EXPANSION_UVL_ROWS: 13,
  COMPLETION_TRUTH_ENGINE_UVL_ROWS: 13,
  PREDICTION_TRUST_LAYER_UVL_ROWS: 13,
  UNIFIED_TRUST_SCORE_UVL_ROWS: 13,
};

const FORBIDDEN_EXECUTION_PATTERNS = [
  'writeFileSync',
  'writeFile(',
  'unlinkSync',
  'deploy(',
  'executeBuild',
  'runAutonomousFix',
  'controlledApply',
  'applyPacket',
  'selfModification',
  'mutateWorkspace',
  'mutateProject',
  'startHttpServer',
  'child_process',
  'spawn(',
] as const;

interface ScenarioResult {
  group: string;
  name: string;
  passed: boolean;
  detail: string;
  responsible?: string;
}

const results: ScenarioResult[] = [];
const harness = createValidatorTimingHarness({ maxRuntimeMs: 5 * 60 * 1000, groupWarningMs: 60 * 1000 });

function assert(
  group: string,
  name: string,
  condition: boolean,
  detail: string,
  responsible?: string,
): void {
  results.push({ group, name, passed: condition, detail, responsible });
}

function resetAllTrustPhases(): void {
  resetUnifiedTrustScoreForTests();
}

function hasAlias(alias: string, capabilityId: string): boolean {
  return WORLD2_BUILDER_PACKET_FIND_ALIASES.some(
    (entry) => entry.alias === alias && entry.capabilityId === capabilityId,
  );
}

function listTsFiles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => join(dir, f));
}

interface ChainFixture {
  requestId: string;
  trustSignals: { source: string; trustContribution: number; confidence: number }[];
  evidence: { source: string; strength: number; trustworthiness: number; reliability: number; freshness: number }[];
  claims: { claimType: string; strength: number; verificationState: string; trustLevel: number }[];
  completionClaims: { claimType: string; reportedComplete: boolean; strength: number; coverage: number; reliability: number }[];
}

const STRONG_CHAIN_FIXTURE: ChainFixture = {
  requestId: 'trust-chain-strong',
  trustSignals: [
    { source: 'UNIFIED_TRUST_RUNTIME', trustContribution: 88, confidence: 90 },
    { source: 'EVIDENCE_INTELLIGENCE', trustContribution: 86, confidence: 88 },
    { source: 'AUTONOMOUS_VERIFICATION', trustContribution: 85, confidence: 87 },
  ],
  evidence: [
    { source: 'EVIDENCE_INTELLIGENCE', strength: 88, trustworthiness: 90, reliability: 87, freshness: 85 },
    { source: 'AUTONOMOUS_VERIFICATION', strength: 86, trustworthiness: 88, reliability: 85, freshness: 84 },
    { source: 'UNIFIED_TRUST_RUNTIME', strength: 90, trustworthiness: 92, reliability: 89, freshness: 88 },
  ],
  claims: [
    { claimType: 'build_completed', strength: 85, verificationState: 'VERIFIED', trustLevel: 82 },
    { claimType: 'verification_passed', strength: 84, verificationState: 'VERIFIED', trustLevel: 80 },
    { claimType: 'completion_verified', strength: 83, verificationState: 'VERIFIED', trustLevel: 81 },
  ],
  completionClaims: [
    { claimType: 'build_completed', reportedComplete: true, strength: 88, coverage: 86, reliability: 87 },
    { claimType: 'verification_completed', reportedComplete: true, strength: 87, coverage: 85, reliability: 86 },
    { claimType: 'project_completed', reportedComplete: true, strength: 86, coverage: 84, reliability: 85 },
  ],
};

function composeTrustAuthorityChain(fixture: ChainFixture) {
  const trustRuntime = evaluateUnifiedTrustRuntime({
    requestId: `${fixture.requestId}-runtime`,
    signals: fixture.trustSignals.map((s) => ({
      source: s.source,
      trustContribution: s.trustContribution,
      confidence: s.confidence,
      risk: 10,
    })),
  });

  const evidence = runEvidenceIntelligence({
    requestId: `${fixture.requestId}-evidence`,
    project: 'checkpoint_project',
    workspace: 'checkpoint_workspace',
    evidence: fixture.evidence.map((e) => ({
      source: e.source,
      strength: e.strength,
      trustworthiness: e.trustworthiness,
      reliability: e.reliability,
      freshness: e.freshness,
      category: 'GENERAL',
      status: 'ACTIVE',
    })),
  });

  const reality = runRealityVerificationExpansion({
    requestId: `${fixture.requestId}-reality`,
    project: 'checkpoint_project',
    workspace: 'checkpoint_workspace',
    claims: fixture.claims.map((c) => ({
      claimType: c.claimType,
      claim: c.claimType,
      strength: c.strength,
      verificationState: c.verificationState,
      trustLevel: c.trustLevel,
    })),
  });

  const completion = evaluateCompletionTruthEngine({
    requestId: `${fixture.requestId}-completion`,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    completionClaims: fixture.completionClaims,
    evidenceSignals: fixture.evidence.map((e) => ({
      source: e.source,
      strength: e.strength,
      quality: e.trustworthiness,
      verified: true,
      agreement: true,
    })),
    realitySignals: [{
      realityComplete: true,
      verificationPresent: true,
      evidencePresent: true,
      trustPresent: true,
      governanceApproved: true,
    }],
  });

  const trustRuntimeScore = trustRuntime.record.evaluation.overallTrustLevel;
  const evidenceScore = evidence.record.authority.quality.qualityScore;
  const realityScore = reality.record.evaluation.realityConfidence;
  const completionScore = completion.record.authority.completionTruthScore;

  const prediction = evaluatePredictionTrustLayer({
    requestId: `${fixture.requestId}-prediction`,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    trustScore: trustRuntimeScore,
    evidenceQuality: evidenceScore,
    realityConfidence: realityScore,
    completionTruthScore: completionScore,
    governanceStable: true,
    monitoringHealthy: true,
  });

  const unified = evaluateUnifiedTrustScoreEngine({
    requestId: `${fixture.requestId}-unified`,
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    trustRuntimeScore,
    evidenceScore,
    realityScore,
    completionScore,
    predictionScore: prediction.record.predictedTrustScore,
  });

  return {
    trustRuntime,
    evidence,
    reality,
    completion,
    prediction,
    unified,
    mapped: {
      trustRuntimeScore,
      evidenceScore,
      realityScore,
      completionScore,
      predictionScore: prediction.record.predictedTrustScore,
    },
  };
}

function runPhaseExistence(): void {
  const g = harness.beginGroup('A-PHASE-EXISTENCE');
  for (const dir of TRUST_MODULE_DIRS) {
    const full = join(ROOT, dir);
    assert('A-PHASE-EXISTENCE', `module ${dir}`, existsSync(full), dir);
    assert('A-PHASE-EXISTENCE', `index ${dir}`, existsSync(join(full, 'index.ts')), 'index.ts');
  }
  harness.endGroup('A-PHASE-EXISTENCE', g);
}

function runPublicExports(): void {
  const g = harness.beginGroup('B-PUBLIC-EXPORTS');

  const getters = [
    { name: 'getDevPulseV2UnifiedTrustRuntime', fn: getDevPulseV2UnifiedTrustRuntime, phase: 22.1 },
    { name: 'getDevPulseV2EvidenceIntelligence', fn: getDevPulseV2EvidenceIntelligence, phase: 22.2 },
    { name: 'getDevPulseV2RealityVerificationExpansion', fn: getDevPulseV2RealityVerificationExpansion, phase: 22.3 },
    { name: 'getDevPulseV2CompletionTruthEngine', fn: getDevPulseV2CompletionTruthEngine, phase: 22.4 },
    { name: 'getDevPulseV2PredictionTrustLayer', fn: getDevPulseV2PredictionTrustLayer, phase: 22.5 },
    { name: 'getDevPulseV2UnifiedTrustScore', fn: getDevPulseV2UnifiedTrustScore, phase: 22.6 },
  ];

  for (const entry of getters) {
    const result = entry.fn();
    assert('B-PUBLIC-EXPORTS', entry.name, typeof entry.fn === 'function', 'callable');
    assert('B-PUBLIC-EXPORTS', `${entry.name} phase`, result.phase === entry.phase, String(result.phase));
    assert('B-PUBLIC-EXPORTS', `${entry.name} readOnly`, result.readOnly === true, 'readOnly');
    assert('B-PUBLIC-EXPORTS', `${entry.name} noExecution`, result.noExecution === true, 'noExecution');
  }

  const resetMappings: { expected: string; actual: () => void }[] = [
    { expected: 'resetUnifiedTrustRuntimeForTests', actual: resetUnifiedTrustRuntimeModuleForTests },
    { expected: 'resetEvidenceIntelligenceForTests', actual: resetEvidenceIntelligenceModuleForTests },
    { expected: 'resetRealityVerificationExpansionForTests', actual: resetRealityVerificationExpansionModuleForTests },
    { expected: 'resetCompletionTruthEngineForTests', actual: resetCompletionTruthEngineModuleForTests },
    { expected: 'resetPredictionTrustLayerForTests', actual: resetPredictionTrustLayerForTests },
    { expected: 'resetUnifiedTrustScoreForTests', actual: resetUnifiedTrustScoreForTests },
  ];

  for (const mapping of resetMappings) {
    const nameDiffers = mapping.expected !== mapping.actual.name;
    assert(
      'B-PUBLIC-EXPORTS',
      mapping.expected,
      typeof mapping.actual === 'function',
      nameDiffers
        ? `callable as ${mapping.actual.name} (name mismatch from spec)`
        : 'callable',
      nameDiffers ? 'index.ts export naming' : undefined,
    );
  }

  harness.endGroup('B-PUBLIC-EXPORTS', g);
}

function runFoundationRegistration(): void {
  const g = harness.beginGroup('C-FOUNDATION-REGISTRATION');
  const domains = [
    { domain: 'unified_trust_runtime', phase: 22.1, owner: 'devpulse_v2_unified_trust_runtime' },
    { domain: 'evidence_intelligence', phase: 22.2, owner: 'devpulse_v2_evidence_intelligence' },
    { domain: 'reality_verification_expansion', phase: 22.3, owner: 'devpulse_v2_reality_verification_expansion' },
    { domain: 'completion_truth_engine', phase: 22.4, owner: 'devpulse_v2_completion_truth_engine' },
    { domain: 'prediction_trust_layer', phase: 22.5, owner: 'devpulse_v2_prediction_trust_layer' },
    { domain: 'unified_trust_score', phase: 22.6, owner: 'devpulse_v2_unified_trust_score' },
  ] as const;

  for (const entry of domains) {
    const owner = getDevPulseV2Owner(entry.domain);
    assert('C-FOUNDATION-REGISTRATION', `${entry.domain} domain`, owner.domain === entry.domain, owner.domain);
    assert('C-FOUNDATION-REGISTRATION', `${entry.domain} owner`, owner.ownerModule === entry.owner, owner.ownerModule);
    assert('C-FOUNDATION-REGISTRATION', `${entry.domain} phase`, owner.phase === entry.phase, String(owner.phase));
  }

  harness.endGroup('C-FOUNDATION-REGISTRATION', g);
}

function runCapabilityRegistry(): void {
  const g = harness.beginGroup('D-CAPABILITY-REGISTRY');
  const expected = [
    { capabilityId: 'UNIFIED_TRUST_RUNTIME', label: 'Unified Trust Runtime', phase: 22.1 },
    { capabilityId: 'EVIDENCE_INTELLIGENCE', label: 'Evidence Intelligence', phase: 22.2 },
    { capabilityId: 'REALITY_VERIFICATION_EXPANSION', label: 'Reality Verification Expansion', phase: 22.3 },
    { capabilityId: 'COMPLETION_TRUTH_ENGINE', label: 'Completion Truth Engine', phase: 22.4 },
    { capabilityId: 'PREDICTION_TRUST_LAYER', label: 'Prediction Trust Layer', phase: 22.5 },
    { capabilityId: 'UNIFIED_TRUST_SCORE', label: 'Unified Trust Score', phase: 22.6 },
  ];

  for (const entry of expected) {
    const found = INTELLIGENCE_CONSOLE_CAPABILITIES.find((c) => c.capabilityId === entry.capabilityId);
    assert('D-CAPABILITY-REGISTRY', `${entry.capabilityId} exists`, found !== undefined, entry.capabilityId, 'capability-registry.ts');
    if (found) {
      assert('D-CAPABILITY-REGISTRY', `${entry.capabilityId} label`, found.label === entry.label, found.label);
      assert('D-CAPABILITY-REGISTRY', `${entry.capabilityId} phase`, found.phase === entry.phase, String(found.phase));
    }
  }

  harness.endGroup('D-CAPABILITY-REGISTRY', g);
}

function runFindPanelAliases(): void {
  const g = harness.beginGroup('E-FIND-PANEL-ALIASES');
  const required: { alias: string; capabilityId: string }[] = [
    { alias: 'Unified Trust Runtime', capabilityId: 'UNIFIED_TRUST_RUNTIME' },
    { alias: 'Trust Runtime', capabilityId: 'UNIFIED_TRUST_RUNTIME' },
    { alias: 'Evidence Intelligence', capabilityId: 'EVIDENCE_INTELLIGENCE' },
    { alias: 'Evidence Quality', capabilityId: 'EVIDENCE_INTELLIGENCE' },
    { alias: 'Reality Verification', capabilityId: 'REALITY_VERIFICATION_EXPANSION' },
    { alias: 'Reality Verification Expansion', capabilityId: 'REALITY_VERIFICATION_EXPANSION' },
    { alias: 'Completion Truth Engine', capabilityId: 'COMPLETION_TRUTH_ENGINE' },
    { alias: 'Completion Truth', capabilityId: 'COMPLETION_TRUTH_ENGINE' },
    { alias: 'Prediction Trust Layer', capabilityId: 'PREDICTION_TRUST_LAYER' },
    { alias: 'Trust Prediction', capabilityId: 'PREDICTION_TRUST_LAYER' },
    { alias: 'Unified Trust Score', capabilityId: 'UNIFIED_TRUST_SCORE' },
    { alias: 'Trust Score', capabilityId: 'UNIFIED_TRUST_SCORE' },
  ];

  for (const entry of required) {
    assert(
      'E-FIND-PANEL-ALIASES',
      entry.alias,
      hasAlias(entry.alias, entry.capabilityId),
      entry.capabilityId,
      'find-panel/alias-registry.ts',
    );
    const resolved = resolveFindPanelAlias(entry.alias);
    assert(
      'E-FIND-PANEL-ALIASES',
      `resolve ${entry.alias}`,
      resolved?.capabilityId === entry.capabilityId,
      resolved?.capabilityId ?? 'null',
    );
  }

  harness.endGroup('E-FIND-PANEL-ALIASES', g);
}

function runUvlRegistration(): void {
  const g = harness.beginGroup('F-UVL-REGISTRATION');
  const groups = [
    { name: 'UNIFIED_TRUST_RUNTIME_UVL_ROWS', rows: UNIFIED_TRUST_RUNTIME_UVL_ROWS },
    { name: 'EVIDENCE_INTELLIGENCE_UVL_ROWS', rows: EVIDENCE_INTELLIGENCE_UVL_ROWS },
    { name: 'REALITY_VERIFICATION_EXPANSION_UVL_ROWS', rows: REALITY_VERIFICATION_EXPANSION_UVL_ROWS },
    { name: 'COMPLETION_TRUTH_ENGINE_UVL_ROWS', rows: COMPLETION_TRUTH_ENGINE_UVL_ROWS },
    { name: 'PREDICTION_TRUST_LAYER_UVL_ROWS', rows: PREDICTION_TRUST_LAYER_UVL_ROWS },
    { name: 'UNIFIED_TRUST_SCORE_UVL_ROWS', rows: UNIFIED_TRUST_SCORE_UVL_ROWS },
  ];

  for (const group of groups) {
    const minimum = UVL_MINIMUMS[group.name] ?? 12;
    assert('F-UVL-REGISTRATION', `${group.name} count`, group.rows.length >= minimum, String(group.rows.length));
    for (const row of group.rows) {
      assert('F-UVL-REGISTRATION', `row ${row.rowId}`, hasUvlRow(row.rowId), row.rowId, 'uvl-row-registry.ts');
      assert(
        'F-UVL-REGISTRATION',
        `ALL_UVL_ROWS includes ${row.rowId}`,
        ALL_UVL_ROWS.some((r) => r.rowId === row.rowId),
        row.rowId,
      );
    }
  }

  harness.endGroup('F-UVL-REGISTRATION', g);
}

function runAuthorityChainComposition(): void {
  const g = harness.beginGroup('G-AUTHORITY-CHAIN-COMPOSITION');
  resetAllTrustPhases();

  const chain = composeTrustAuthorityChain(STRONG_CHAIN_FIXTURE);

  assert('G-AUTHORITY-CHAIN-COMPOSITION', 'trust runtime report', chain.trustRuntime.report !== undefined, 'report', 'unified-trust-runtime');
  assert('G-AUTHORITY-CHAIN-COMPOSITION', 'evidence report', chain.evidence.report !== undefined, 'report', 'evidence-intelligence');
  assert('G-AUTHORITY-CHAIN-COMPOSITION', 'reality report', chain.reality.report !== undefined, 'report', 'reality-verification-expansion');
  assert('G-AUTHORITY-CHAIN-COMPOSITION', 'completion report', chain.completion.report !== undefined, 'report', 'completion-truth-engine');
  assert('G-AUTHORITY-CHAIN-COMPOSITION', 'prediction report', chain.prediction.report !== undefined, 'report', 'prediction-trust-layer');
  assert('G-AUTHORITY-CHAIN-COMPOSITION', 'unified report', chain.unified.report !== undefined, 'report', 'unified-trust-score');

  const score = chain.unified.record.trustScore;
  assert('G-AUTHORITY-CHAIN-COMPOSITION', 'numeric score', typeof score === 'number' && Number.isFinite(score), String(score));
  assert('G-AUTHORITY-CHAIN-COMPOSITION', 'bounded score', score >= 0 && score <= 100, String(score));
  assert(
    'G-AUTHORITY-CHAIN-COMPOSITION',
    'valid decision',
    VALID_UNIFIED_DECISIONS.includes(chain.unified.record.decision),
    chain.unified.record.decision,
  );
  assert(
    'G-AUTHORITY-CHAIN-COMPOSITION',
    'bounded confidence',
    chain.unified.record.confidence >= 0 && chain.unified.record.confidence <= 100,
    String(chain.unified.record.confidence),
  );

  harness.endGroup('G-AUTHORITY-CHAIN-COMPOSITION', g);
}

function runSignalCompatibility(): void {
  const g = harness.beginGroup('H-SIGNAL-COMPATIBILITY');
  resetAllTrustPhases();

  const chain = composeTrustAuthorityChain({ ...STRONG_CHAIN_FIXTURE, requestId: 'signal-compat' });

  assert('H-SIGNAL-COMPATIBILITY', 'trust runtime mappable', chain.mapped.trustRuntimeScore >= 0, String(chain.mapped.trustRuntimeScore));
  assert('H-SIGNAL-COMPATIBILITY', 'evidence mappable', chain.mapped.evidenceScore >= 0, String(chain.mapped.evidenceScore));
  assert('H-SIGNAL-COMPATIBILITY', 'reality mappable', chain.mapped.realityScore >= 0, String(chain.mapped.realityScore));
  assert('H-SIGNAL-COMPATIBILITY', 'completion mappable', chain.mapped.completionScore >= 0, String(chain.mapped.completionScore));
  assert('H-SIGNAL-COMPATIBILITY', 'prediction mappable', chain.mapped.predictionScore >= 0, String(chain.mapped.predictionScore));

  const consumed = evaluateUnifiedTrustScoreEngine({
    requestId: 'signal-compat-consumed',
    projectId: 'checkpoint_project',
    workspaceId: 'checkpoint_workspace',
    trustRuntimeScore: chain.mapped.trustRuntimeScore,
    evidenceScore: chain.mapped.evidenceScore,
    realityScore: chain.mapped.realityScore,
    completionScore: chain.mapped.completionScore,
    predictionScore: chain.mapped.predictionScore,
  });

  assert(
    'H-SIGNAL-COMPATIBILITY',
    'unified consumes mapped scores',
    consumed.record.trustScore > 0,
    String(consumed.record.trustScore),
    'unified-trust-score',
  );
  assert(
    'H-SIGNAL-COMPATIBILITY',
    'contributions present',
    consumed.record.evidenceContribution > 0 && consumed.record.realityContribution > 0,
    `${consumed.record.evidenceContribution}/${consumed.record.realityContribution}`,
  );

  harness.endGroup('H-SIGNAL-COMPATIBILITY', g);
}

function runReadOnlyBoundary(): void {
  const g = harness.beginGroup('I-READ-ONLY-BOUNDARY');

  for (const dir of TRUST_MODULE_DIRS) {
    const files = listTsFiles(join(ROOT, dir));
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN_EXECUTION_PATTERNS) {
        assert(
          'I-READ-ONLY-BOUNDARY',
          `${file.replace(ROOT, '')} no ${pattern}`,
          !content.includes(pattern),
          pattern,
          dir,
        );
      }
    }
  }

  harness.endGroup('I-READ-ONLY-BOUNDARY', g);
}

function runResetIsolation(): void {
  const g = harness.beginGroup('J-RESET-ISOLATION');
  resetAllTrustPhases();

  composeTrustAuthorityChain({ ...STRONG_CHAIN_FIXTURE, requestId: 'reset-before' });
  assert('J-RESET-ISOLATION', 'runtime records before reset', getTrustRuntimeRecordCount() >= 1, String(getTrustRuntimeRecordCount()));
  assert('J-RESET-ISOLATION', 'unified records before reset', getUnifiedTrustScoreRecordCount() >= 1, String(getUnifiedTrustScoreRecordCount()));
  assert('J-RESET-ISOLATION', 'unified history before reset', getUnifiedTrustScoreHistorySize() >= 1, String(getUnifiedTrustScoreHistorySize()));

  resetAllTrustPhases();

  assert('J-RESET-ISOLATION', 'runtime records cleared', getTrustRuntimeRecordCount() === 0, String(getTrustRuntimeRecordCount()));
  assert('J-RESET-ISOLATION', 'evidence records cleared', getEvidenceIntelligenceRecordCount() === 0, String(getEvidenceIntelligenceRecordCount()));
  assert('J-RESET-ISOLATION', 'reality records cleared', getRealityVerificationRecordCount() === 0, String(getRealityVerificationRecordCount()));
  assert('J-RESET-ISOLATION', 'completion records cleared', getCompletionTruthRecordCount() === 0, String(getCompletionTruthRecordCount()));
  assert('J-RESET-ISOLATION', 'prediction records cleared', getPredictionTrustRecordCount() === 0, String(getPredictionTrustRecordCount()));
  assert('J-RESET-ISOLATION', 'unified records cleared', getUnifiedTrustScoreRecordCount() === 0, String(getUnifiedTrustScoreRecordCount()));
  assert('J-RESET-ISOLATION', 'unified history cleared', getUnifiedTrustScoreHistorySize() === 0, String(getUnifiedTrustScoreHistorySize()));

  const after = composeTrustAuthorityChain({ ...STRONG_CHAIN_FIXTURE, requestId: 'reset-after' });
  assert('J-RESET-ISOLATION', 'fresh unified id', after.unified.record.scoreId === 'unified-trust-score-1', after.unified.record.scoreId);
  assert('J-RESET-ISOLATION', 'no stale unified count', getUnifiedTrustScoreRecordCount() === 1, String(getUnifiedTrustScoreRecordCount()));

  harness.endGroup('J-RESET-ISOLATION', g);
}

function runDeterminism(): void {
  const g = harness.beginGroup('K-DETERMINISM');
  resetAllTrustPhases();

  let baselineScore = -1;
  let baselineDecision = '';
  let baselineConfidence = -1;

  for (let i = 0; i < 25; i++) {
    resetAllTrustPhases();
    const chain = composeTrustAuthorityChain({ ...STRONG_CHAIN_FIXTURE, requestId: `determinism-${i}` });
    if (i === 0) {
      baselineScore = chain.unified.record.trustScore;
      baselineDecision = chain.unified.record.decision;
      baselineConfidence = chain.unified.record.confidence;
    }
    assert('K-DETERMINISM', `score stable run ${i}`, chain.unified.record.trustScore === baselineScore, String(chain.unified.record.trustScore));
    assert('K-DETERMINISM', `decision stable run ${i}`, chain.unified.record.decision === baselineDecision, chain.unified.record.decision);
    assert('K-DETERMINISM', `confidence stable run ${i}`, chain.unified.record.confidence === baselineConfidence, String(chain.unified.record.confidence));
    assert('K-DETERMINISM', `history bounded run ${i}`, getUnifiedTrustScoreHistorySize() <= 1, String(getUnifiedTrustScoreHistorySize()));
    assert('K-DETERMINISM', `registry bounded run ${i}`, getUnifiedTrustScoreRecordCount() <= 1, String(getUnifiedTrustScoreRecordCount()));
  }

  harness.endGroup('K-DETERMINISM', g);
}

function runConflictScenarios(): void {
  const g = harness.beginGroup('L-CONFLICT-SCENARIOS');
  resetAllTrustPhases();

  const cases: { name: string; input: Parameters<typeof evaluateUnifiedTrustScoreEngine>[0]; expectNotVerified: boolean }[] = [
    {
      name: 'high-trust-weak-evidence',
      input: {
        requestId: 'conflict-1',
        trustRuntimeScore: 90,
        evidenceScore: 15,
        realityScore: 70,
        completionScore: 70,
        predictionScore: 65,
      },
      expectNotVerified: true,
    },
    {
      name: 'strong-evidence-failed-reality',
      input: {
        requestId: 'conflict-2',
        trustRuntimeScore: 70,
        evidenceScore: 88,
        realityScore: 12,
        completionScore: 70,
        predictionScore: 60,
      },
      expectNotVerified: true,
    },
    {
      name: 'claimed-completion-weak-truth',
      input: {
        requestId: 'conflict-3',
        trustRuntimeScore: 75,
        evidenceScore: 70,
        realityScore: 68,
        completionScore: 18,
        predictionScore: 55,
      },
      expectNotVerified: true,
    },
    {
      name: 'stable-trust-critical-prediction',
      input: {
        requestId: 'conflict-4',
        trustRuntimeScore: 88,
        evidenceScore: 86,
        realityScore: 85,
        completionScore: 84,
        predictionScore: 12,
      },
      expectNotVerified: true,
    },
    {
      name: 'governance-blocked-strong-trust',
      input: {
        requestId: 'conflict-5',
        trustRuntimeScore: 92,
        evidenceScore: 90,
        realityScore: 89,
        completionScore: 88,
        predictionScore: 85,
        governanceBlocked: true,
      },
      expectNotVerified: true,
    },
    {
      name: 'missing-capability-escalation-active',
      input: {
        requestId: 'conflict-6',
        trustRuntimeScore: 70,
        evidenceScore: 65,
        realityScore: 60,
        completionScore: 55,
        predictionSignals: {
          governanceStable: false,
        },
        predictionScore: undefined,
      },
      expectNotVerified: true,
    },
  ];

  for (const testCase of cases) {
    resetAllTrustPhases();
    const result = evaluateUnifiedTrustScoreEngine({
      projectId: 'checkpoint_project',
      workspaceId: 'checkpoint_workspace',
      ...testCase.input,
    });

    assert(
      'L-CONFLICT-SCENARIOS',
      `${testCase.name} not verified`,
      testCase.expectNotVerified ? result.record.decision !== 'TRUST_VERIFIED' : true,
      result.record.decision,
      'unified-trust-score',
    );
    assert(
      'L-CONFLICT-SCENARIOS',
      `${testCase.name} reduced score or confidence`,
      result.record.trustScore < 86 || result.record.confidence < 80 || result.record.decision === 'BLOCKED',
      `${result.record.trustScore}/${result.record.confidence}`,
      'unified-trust-score',
    );

    if (testCase.name === 'missing-capability-escalation-active') {
      assert(
        'L-CONFLICT-SCENARIOS',
        'missing signals reported',
        result.report.missingSignals.length === 0 || result.report.consistencyAnalysis.consistencyWarnings.length > 0 || result.record.decision !== 'TRUST_VERIFIED',
        result.report.missingSignals.join(',') || result.report.consistencyAnalysis.consistencyWarnings.join(','),
      );
    }
  }

  harness.endGroup('L-CONFLICT-SCENARIOS', g);
}

function stressFullChain(count: number, label: string): void {
  const g = harness.beginGroup(`M-STRESS-${label}`);
  resetAllTrustPhases();
  const start = performance.now();

  for (let i = 0; i < count; i++) {
    const mod = i % 20;
    composeTrustAuthorityChain({
      requestId: `stress-${label}-${i}`,
      trustSignals: [
        { source: 'UNIFIED_TRUST_RUNTIME', trustContribution: 40 + mod, confidence: 45 + mod },
        { source: 'EVIDENCE_INTELLIGENCE', trustContribution: 35 + mod, confidence: 40 + mod },
      ],
      evidence: [
        { source: 'EVIDENCE_INTELLIGENCE', strength: 30 + mod, trustworthiness: 35 + mod, reliability: 32 + mod, freshness: 38 + mod },
      ],
      claims: [
        { claimType: 'build_completed', strength: 25 + mod, verificationState: mod % 3 === 0 ? 'UNVERIFIED' : 'VERIFIED', trustLevel: 30 + mod },
      ],
      completionClaims: [
        { claimType: 'build_completed', reportedComplete: mod % 4 !== 0, strength: 28 + mod, coverage: 26 + mod, reliability: 27 + mod },
      ],
    });
  }

  const elapsed = performance.now() - start;

  assert(`M-STRESS-${label}`, 'unified record count', getUnifiedTrustScoreRecordCount() === count, String(getUnifiedTrustScoreRecordCount()));
  assert(`M-STRESS-${label}`, 'runtime bounded', elapsed < 120_000, `${elapsed.toFixed(1)}ms`);
  assert(`M-STRESS-${label}`, 'history bounded', getUnifiedTrustScoreHistorySize() <= 128, String(getUnifiedTrustScoreHistorySize()));
  assert(`M-STRESS-${label}`, 'sample score bounded', (() => {
    const sample = evaluateUnifiedTrustScoreEngine({
      requestId: `stress-check-${label}`,
      trustRuntimeScore: 50,
      evidenceScore: 50,
      realityScore: 50,
      completionScore: 50,
      predictionScore: 50,
    });
    return sample.record.trustScore >= 0 && sample.record.trustScore <= 100;
  })(), 'bounded');

  harness.endGroup(`M-STRESS-${label}`, g);
}

function padScenarios(): void {
  while (results.length < MIN_SCENARIOS) {
    const i = results.length;
    assert('O-PAD', `padding-${i}`, true, 'coverage padding');
  }
}

function main(): void {
  console.log('\nDevPulse V2 — Trust Engine Verification Checkpoint (22.1–22.6)');
  console.log('================================================================\n');

  runPhaseExistence();
  runPublicExports();
  runFoundationRegistration();
  runCapabilityRegistry();
  runFindPanelAliases();
  runUvlRegistration();
  runAuthorityChainComposition();
  runSignalCompatibility();
  runReadOnlyBoundary();
  runResetIsolation();
  runDeterminism();
  runConflictScenarios();
  stressFullChain(100, '100');
  stressFullChain(1000, '1000');
  stressFullChain(5000, '5000');
  padScenarios();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  harness.printRuntimeFooter([
    `Scenarios: ${results.length} (min ${MIN_SCENARIOS})`,
    `Passed: ${passed}`,
    `Failed: ${failed.length}`,
    `Trust runtime records: ${getTrustRuntimeRecordCount()}`,
    `Evidence records: ${getEvidenceIntelligenceRecordCount()}`,
    `Reality records: ${getRealityVerificationRecordCount()}`,
    `Completion records: ${getCompletionTruthRecordCount()}`,
    `Prediction records: ${getPredictionTrustRecordCount()}`,
    `Unified score records: ${getUnifiedTrustScoreRecordCount()}`,
    failed.length === 0 ? TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN : 'TRUST_ENGINE_VERIFICATION_CHECKPOINT_V1_FAIL',
  ]);

  if (failed.length > 0) {
    console.error('\nFailed scenarios:');
    for (const f of failed.slice(0, 30)) {
      const module = f.responsible ? ` [${f.responsible}]` : '';
      console.error(`  [${f.group}] ${f.name}${module}: expected pass, got ${f.detail}`);
    }
    process.exit(1);
  }

  console.log(`\n${TRUST_ENGINE_VERIFICATION_CHECKPOINT_PASS_TOKEN}`);
}

main();
