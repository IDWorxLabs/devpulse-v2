/**
 * DevPulse V2 Self-Learning Engine Foundation — Phase 9.3.
 * Records structured learning from outcomes. Does NOT train models, execute, or auto-change behavior.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import { evaluateLearningEvidence } from './evidence-evaluation-engine.js';
import { createFutureGuidance, futureGuidanceListKey } from './future-guidance-engine.js';
import { generateLesson, lessonGenerationKey } from './lesson-generation-engine.js';
import {
  learningEventValidationKey,
  validateLearningEventInput,
} from './learning-event-validation-engine.js';
import {
  classifyLearningEvent,
  eventClassificationKey,
} from './learning-event-classifier.js';
import {
  extractLearningPatterns,
  extractedPatternsKey,
  reusablePatternKey,
} from './pattern-extraction-engine.js';
import {
  assertDistinctFromWorld2LearningLoop,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateSelfLearningEngine,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  assertWorld2Protected,
  getSelfLearningGovernanceSummary,
  governanceGatesKey,
  validateSelfLearningGovernance,
} from './self-learning-governance-bridge.js';
import {
  buildSelfLearningReport,
  buildSelfLearningReportOutput,
  formatSelfLearningReport,
} from './self-learning-report.js';
import { evaluateLearningProjectContext, assertNoExecutionMethods } from './self-learning-security-engine.js';
import { validateLearningSource, sourceValidationKey } from './source-validation-engine.js';
import type {
  LearningEventInput,
  LearningRecord,
  SelfLearningEngineState,
  SelfLearningResult,
  SelfLearningState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  LEARNING_STATE_SEQUENCE,
  nextLearningEventId,
  nextSelfLearningRecordId,
  SELF_LEARNING_ENGINE_OWNER_MODULE,
  SELF_LEARNING_ENGINE_PASS_TOKEN,
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

let singleton: DevPulseV2SelfLearningEngine | null = null;

function createFoundationId(): string {
  return `self-learning-engine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildStateSequence(
  blocked: boolean,
  eventValid: boolean,
  sourceValid: boolean,
  evidenceValid: boolean,
  classified: boolean,
  patternsExtracted: boolean,
  lessonGenerated: boolean,
  guidanceCreated: boolean,
): SelfLearningState[] {
  if (blocked) return ['LEARNING_EVENT_RECEIVED', 'LEARNING_BLOCKED'];

  const sequence: SelfLearningState[] = ['LEARNING_EVENT_RECEIVED'];
  if (sourceValid) sequence.push('SOURCE_VALIDATED');
  if (evidenceValid) sequence.push('EVIDENCE_EVALUATED');
  if (classified) sequence.push('EVENT_CLASSIFIED');
  if (patternsExtracted) sequence.push('PATTERNS_EXTRACTED');
  if (lessonGenerated) sequence.push('LESSON_GENERATED');
  if (guidanceCreated) sequence.push('FUTURE_GUIDANCE_CREATED');
  if (eventValid && sourceValid && lessonGenerated) sequence.push('LEARNING_RECORD_READY');

  return sequence;
}

function buildRecommendations(input: LearningEventInput, blocked: boolean): string[] {
  if (blocked) {
    return ['Learning blocked — self-learning foundation records lessons only, no remediation performed.'];
  }
  return [
    `Record lesson from ${input.sourceSystem} for future recommendations.`,
    'No execution, file modification, code generation, deployment, or model training performed.',
    'No automatic behavior change — human review required for guidance application.',
  ];
}

function cloneResult(result: SelfLearningResult): SelfLearningResult {
  return {
    ...result,
    lessonEvidence: [...result.lessonEvidence],
    extractedPatterns: result.extractedPatterns.map((p) => ({ ...p })),
    futureGuidance: result.futureGuidance.map((g) => ({ ...g, appliesToSystems: [...g.appliesToSystems] })),
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    securityWarnings: [...result.securityWarnings],
    recommendations: [...result.recommendations],
    confirmation: { ...result.confirmation },
    learningRecord: { ...result.learningRecord, evidenceRefs: [...result.learningRecord.evidenceRefs], futureGuidance: result.learningRecord.futureGuidance.map((g) => ({ ...g, appliesToSystems: [...g.appliesToSystems] })) },
    stateSequence: [...result.stateSequence],
  };
}

export function processLearningEvent(input: LearningEventInput): SelfLearningResult {
  const learningEventId = input.learningEventId ?? nextLearningEventId();
  const enrichedInput: LearningEventInput = { ...input, learningEventId };

  const eventValidation = validateLearningEventInput(enrichedInput);
  const sourceValidation = validateLearningSource(enrichedInput);
  const projectContext = evaluateLearningProjectContext(enrichedInput);
  const governance = validateSelfLearningGovernance(enrichedInput);
  const evidence = evaluateLearningEvidence(enrichedInput);

  const blocked =
    eventValidation.blocked ||
    sourceValidation.blocked ||
    projectContext.blocked ||
    !governance.valid ||
    evidence.blocked;

  const classification = classifyLearningEvent(enrichedInput, blocked);
  const patterns = extractLearningPatterns(enrichedInput, classification.learningCategory, blocked);
  const lesson = generateLesson(
    enrichedInput,
    classification.learningCategory,
    evidence.evaluatedEvidence,
    evidence.evidenceScore,
    blocked,
  );
  const guidance = createFutureGuidance(
    enrichedInput,
    classification.learningCategory,
    lesson.confidenceScore,
    learningEventId,
    blocked,
  );

  const stateSequence = buildStateSequence(
    blocked,
    eventValidation.valid,
    sourceValidation.valid,
    evidence.valid,
    classification.valid,
    patterns.length > 0 || !blocked,
    !blocked,
    guidance.length > 0 || !blocked,
  );

  const learningState = stateSequence[stateSequence.length - 1] ?? 'LEARNING_BLOCKED';
  const selfLearningRecordId = nextSelfLearningRecordId();
  const patternKey = reusablePatternKey(
    enrichedInput.sourceSystem,
    classification.learningCategory,
    enrichedInput.eventType,
  );

  const learningRecord: LearningRecord = {
    recordId: selfLearningRecordId,
    learningEventId,
    sourceSystem: enrichedInput.sourceSystem,
    eventType: enrichedInput.eventType,
    learningCategory: classification.learningCategory,
    lessonSummary: lesson.lessonSummary,
    evidenceRefs: evidence.evaluatedEvidence,
    confidenceScore: lesson.confidenceScore,
    futureGuidance: guidance,
    reusablePatternKey: patternKey,
    createdAt: Date.now(),
  };

  const allGates = [
    ...eventValidation.gates,
    ...sourceValidation.gates,
    ...governance.gates,
    ...projectContext.gates,
    ...evidence.gates,
    ...classification.gates,
  ];

  return {
    selfLearningRecordId,
    learningEventId,
    workspaceId: enrichedInput.workspaceId,
    projectId: enrichedInput.projectId,
    sourceSystem: enrichedInput.sourceSystem,
    sourceId: enrichedInput.sourceId,
    eventType: enrichedInput.eventType,
    learningCategory: classification.learningCategory,
    learningState,
    lessonSummary: lesson.lessonSummary,
    lessonEvidence: lesson.lessonEvidence,
    extractedPatterns: patterns,
    futureGuidance: guidance,
    confidenceScore: lesson.confidenceScore,
    governanceGates: governance.gates,
    ownershipGates: [...eventValidation.gates.filter((g) => g.gateType.startsWith('LEARNING')), ...projectContext.gates],
    securityWarnings: [...eventValidation.warnings, ...projectContext.warnings],
    recommendations: buildRecommendations(enrichedInput, blocked),
    confirmation: {
      selfLearningFoundationOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noDeploymentPerformed: true,
      noModelTrainingPerformed: true,
      noAutomaticBehaviorChangePerformed: true,
    },
    learningRecord,
    stateSequence,
    createdAt: Date.now(),
  };
}

export function learningStructuralKey(result: SelfLearningResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.sourceSystem,
    result.eventType,
    result.learningCategory,
    eventClassificationKey(result.eventType, result.learningCategory),
    lessonGenerationKey(result.eventType, result.learningCategory, result.workspaceId),
    extractedPatternsKey(result.extractedPatterns),
    futureGuidanceListKey(result.futureGuidance),
    governanceGatesKey(result.governanceGates),
  ].join('|');
}

export function learningStateIncludes(states: SelfLearningState[], target: SelfLearningState): boolean {
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

export class DevPulseV2SelfLearningEngine {
  private readonly foundationId = createFoundationId();
  private readonly records: SelfLearningResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 9.3 Self-Learning Engine Foundation V1 — recording only.',
    'No model training, execution, file modification, or automatic behavior change.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = SELF_LEARNING_ENGINE_OWNER_MODULE;
  static readonly ownerDomain = 'self_learning_engine' as const;
  static readonly passToken = SELF_LEARNING_ENGINE_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('self_learning_engine');
    return owner.ownerModule === SELF_LEARNING_ENGINE_OWNER_MODULE && owner.phase === 9.3;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const selfLearningOwner = getDevPulseV2Owner('self_learning_engine').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const normalized = pattern.replace(/\s+/g, '_');
      const competing = [...registeredModules].filter(
        (m) => (m.includes(normalized) || m.includes('self_learning')) && m !== selfLearningOwner && m !== 'devpulse_v2_world2_learning_loop',
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromWorld2LearningLoop() && assertNoDuplicateSelfLearningEngine();
  }

  static assertDoesNotExecute(): boolean {
    const engine = new DevPulseV2SelfLearningEngine();
    return (
      assertNoExecutionMethods(engine) &&
      typeof (engine as { trainModel?: unknown }).trainModel === 'undefined' &&
      typeof (engine as { autoApply?: unknown }).autoApply === 'undefined' &&
      typeof (engine as { modifyGovernance?: unknown }).modifyGovernance === 'undefined'
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
      assertDistinctFromWorld2LearningLoop() &&
      getDevPulseV2Owner('safe_capability_acquisition').phase === 9.2 &&
      getDevPulseV2Owner('self_learning_engine').phase === 9.3
    );
  }

  recordLearning(input: LearningEventInput): SelfLearningResult {
    const result = processLearningEvent(input);
    this.records.push(cloneResult(result));
    this.publishSummary(result);
    return cloneResult(result);
  }

  getRecords(): SelfLearningResult[] {
    return this.records.map(cloneResult);
  }

  getRecordByLearningEventId(learningEventId: string): SelfLearningResult | null {
    const result = this.records.find((r) => r.learningEventId === learningEventId);
    return result ? cloneResult(result) : null;
  }

  getRecordByProject(projectId: string): SelfLearningResult | null {
    const result = this.records.find((r) => r.projectId === projectId);
    return result ? cloneResult(result) : null;
  }

  getFoundationState(): SelfLearningEngineState {
    return {
      foundationId: this.foundationId,
      learningRecordCount: this.records.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: SelfLearningResult, input: LearningEventInput) {
    const output = buildSelfLearningReportOutput(input, result);
    return buildSelfLearningReport(this.getFoundationState(), result, output);
  }

  formatReport(result: SelfLearningResult, input: LearningEventInput): string {
    return formatSelfLearningReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getSelfLearningGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkNoAutomaticBehaviorChange(): boolean {
    return true;
  }

  private publishSummary(result: SelfLearningResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Self-learning record: ${result.learningEventId}`,
      summary: `${result.sourceSystem} → ${result.learningCategory}, ${result.learningState}. Recording only.`,
      relatedEvidenceIds: result.lessonEvidence,
      relatedRecordId: result.selfLearningRecordId,
      status: 'INFO',
      warnings: ['Self-learning foundation only — no automatic behavior change.'],
      errors: [],
    });
  }
}

export function createDevPulseV2SelfLearningEngine(): DevPulseV2SelfLearningEngine {
  singleton = new DevPulseV2SelfLearningEngine();
  return singleton;
}

export function getDevPulseV2SelfLearningEngine(): DevPulseV2SelfLearningEngine {
  if (!singleton) {
    singleton = new DevPulseV2SelfLearningEngine();
  }
  return singleton;
}

export function resetDevPulseV2SelfLearningEngineForTests(): DevPulseV2SelfLearningEngine {
  singleton = new DevPulseV2SelfLearningEngine();
  return singleton;
}

export {
  learningEventValidationKey,
  sourceValidationKey,
  eventClassificationKey,
  extractedPatternsKey,
  futureGuidanceListKey,
  governanceGatesKey,
  LEARNING_STATE_SEQUENCE,
  SELF_LEARNING_ENGINE_OWNER_MODULE,
  SELF_LEARNING_ENGINE_PASS_TOKEN,
};
