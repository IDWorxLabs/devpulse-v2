/**
 * DevPulse V2 World 2 Learning Loop Foundation — Phase 7.6 learning layer.
 * Captures structured lessons only. Does NOT execute, modify files, or generate code.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import type { VerifierResult } from '../world2-completion-verifier/types.js';
import {
  checkCrossWorkspaceAccess,
  checkWorld1ModificationAttempt,
  getDevPulseV2World2WorkspaceFoundation,
} from '../world2-workspace-foundation/index.js';
import { extractFailurePatterns, failurePatternsKey } from './failure-pattern-engine.js';
import { extractGovernancePatterns, governancePatternsKey } from './governance-pattern-engine.js';
import {
  assertDistinctFromCompletionVerifier,
  assertExecutionAuthorityPresent,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  getLearningGovernanceSummary,
} from './learning-governance-bridge.js';
import {
  analyzeProjectData,
  projectAnalysisKey,
} from './project-analysis-engine.js';
import {
  extractRecommendationPatterns,
  recommendationPatternsKey,
} from './recommendation-pattern-engine.js';
import { extractRiskPatterns, riskPatternsKey } from './risk-pattern-engine.js';
import { extractRollbackPatterns, rollbackPatternsKey } from './rollback-pattern-engine.js';
import { extractSuccessPatterns, successPatternsKey } from './success-pattern-engine.js';
import {
  compileLessonCount,
  determineLearningConfidence,
  futureRecommendationsKey,
  generateFutureRecommendations,
} from './future-recommendation-engine.js';
import { extractVerificationPatterns, verificationPatternsKey } from './verification-pattern-engine.js';
import { extractWarningPatterns, warningPatternsKey } from './warning-pattern-engine.js';
import { extractWorkspacePatterns, workspacePatternsKey } from './workspace-pattern-engine.js';
import { buildWorld2LearningReport, formatWorld2LearningReport } from './world2-learning-report.js';
import type {
  LearningInput,
  LearningResult,
  LearningState,
  World2LearningLoopState,
} from './types.js';
import {
  DUPLICATE_PATTERNS,
  LEARNING_STATE_SEQUENCE,
  WORLD2_LEARNING_LOOP_OWNER_MODULE,
  WORLD2_LEARNING_LOOP_PASS_TOKEN,
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

let singleton: DevPulseV2World2LearningLoop | null = null;
let learningCounter = 0;

export function resetLearningCounterForTests(): void {
  learningCounter = 0;
}

function createLoopId(): string {
  return `world2-learning-loop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLearningId(): string {
  learningCounter += 1;
  return `world2-learning-${learningCounter.toString().padStart(4, '0')}`;
}

function cloneLearningResult(result: LearningResult): LearningResult {
  return {
    ...result,
    successPatterns: result.successPatterns.map((p) => ({ ...p })),
    failurePatterns: result.failurePatterns.map((p) => ({ ...p })),
    warningPatterns: result.warningPatterns.map((p) => ({ ...p })),
    recommendationPatterns: result.recommendationPatterns.map((p) => ({ ...p })),
    verificationPatterns: result.verificationPatterns.map((p) => ({ ...p })),
    riskPatterns: result.riskPatterns.map((p) => ({ ...p })),
    rollbackPatterns: result.rollbackPatterns.map((p) => ({ ...p })),
    governancePatterns: result.governancePatterns.map((p) => ({ ...p })),
    workspacePatterns: result.workspacePatterns.map((p) => ({ ...p })),
    futureRecommendations: [...result.futureRecommendations],
    stateSequence: [...result.stateSequence],
    confirmation: { ...result.confirmation },
  };
}

export function learningInputFromVerification(
  verification: VerifierResult,
  overrides: Partial<LearningInput> = {},
): LearningInput {
  return {
    workspaceId: verification.workspaceId,
    projectId: verification.projectId,
    planId: verification.planId,
    simulationId: verification.simulationId,
    builderId: verification.builderId,
    verificationId: verification.verificationId,
    completionStatus: verification.completionStatus,
    completionConfidence: verification.completionConfidence,
    verificationResults: verification.verificationResults.map((v) => ({ ...v })),
    riskControlResults: verification.riskControlResults.map((r) => ({ ...r })),
    rollbackResults: verification.rollbackResults.map((r) => ({ ...r })),
    workspaceIntegrityResults: verification.workspaceIntegrityResults.map((w) => ({ ...w })),
    governanceResults: verification.governanceResults.map((g) => ({ ...g })),
    evidenceResults: verification.evidenceResults.map((e) => ({ ...e })),
    recommendations: [...verification.recommendations],
    outcomes: [`Project outcome: ${verification.completionStatus}`],
    observations: [`Completion confidence: ${verification.completionConfidence}`],
    warnings: verification.completionStatus === 'COMPLETE_WITH_WARNINGS'
      ? ['Project completed with warnings']
      : [],
    ...overrides,
  };
}

export function validateLearningOwnership(input: LearningInput): { valid: boolean; reason: string } {
  if (
    !input.workspaceId ||
    !input.projectId ||
    !input.planId ||
    !input.simulationId ||
    !input.builderId ||
    !input.verificationId
  ) {
    return {
      valid: false,
      reason: 'Learning requires workspaceId, projectId, planId, simulationId, builderId, and verificationId',
    };
  }

  const foundation = getDevPulseV2World2WorkspaceFoundation();
  const workspace = foundation.getManager().getWorkspace(input.workspaceId);

  if (!workspace) {
    return { valid: false, reason: `Workspace not found: ${input.workspaceId}` };
  }

  const normalizedProjectId = input.projectId.trim().toLowerCase().replace(/\s+/g, '-');
  if (workspace.projectId !== normalizedProjectId) {
    return { valid: false, reason: 'projectId does not match workspace ownership' };
  }

  return { valid: true, reason: 'Learning ownership confirmed' };
}

export function learningStructuralKey(result: LearningResult): string {
  return [
    result.workspaceId,
    result.projectId,
    result.planId,
    successPatternsKey(result.successPatterns),
    failurePatternsKey(result.failurePatterns),
    warningPatternsKey(result.warningPatterns),
    recommendationPatternsKey(result.recommendationPatterns),
    verificationPatternsKey(result.verificationPatterns),
    riskPatternsKey(result.riskPatterns),
    rollbackPatternsKey(result.rollbackPatterns),
    governancePatternsKey(result.governancePatterns),
    workspacePatternsKey(result.workspacePatterns),
    futureRecommendationsKey(result.futureRecommendations),
    result.learningConfidence,
    String(result.lessonCount),
  ].join('|');
}

export function learningStateIncludes(states: LearningState[], target: LearningState): boolean {
  return states.includes(target);
}

export function generateLearning(input: LearningInput): LearningResult {
  const ownership = validateLearningOwnership(input);
  if (!ownership.valid) {
    throw new Error(ownership.reason);
  }

  const analysis = analyzeProjectData(input);
  const successPatterns = extractSuccessPatterns(input, analysis);
  const failurePatterns = extractFailurePatterns(input, analysis);
  const warningPatterns = extractWarningPatterns(input, analysis);
  const recommendationPatterns = extractRecommendationPatterns(input);
  const verificationPatterns = extractVerificationPatterns(input);
  const riskPatterns = extractRiskPatterns(input);
  const rollbackPatterns = extractRollbackPatterns(input);
  const governancePatterns = extractGovernancePatterns(input);
  const workspacePatterns = extractWorkspacePatterns(input);
  const lessonCount = compileLessonCount(
    successPatterns,
    failurePatterns,
    warningPatterns,
    recommendationPatterns,
    verificationPatterns,
    riskPatterns,
    rollbackPatterns,
    governancePatterns,
    workspacePatterns,
  );
  const futureRecommendations = generateFutureRecommendations(
    input,
    analysis,
    successPatterns,
    failurePatterns,
    warningPatterns,
  );
  const learningConfidence = determineLearningConfidence(lessonCount, input.completionConfidence);

  return {
    learningId: createLearningId(),
    workspaceId: input.workspaceId,
    projectId: input.projectId.trim().toLowerCase().replace(/\s+/g, '-'),
    planId: input.planId,
    simulationId: input.simulationId,
    builderId: input.builderId,
    verificationId: input.verificationId,
    lessonCount,
    successPatterns,
    failurePatterns,
    warningPatterns,
    recommendationPatterns,
    verificationPatterns,
    riskPatterns,
    rollbackPatterns,
    governancePatterns,
    workspacePatterns,
    futureRecommendations,
    learningConfidence,
    confirmation: {
      learningOnlyFoundation: true,
      noExecutionPerformed: true,
      noFilesModified: true,
      noCodeGenerated: true,
    },
    stateSequence: [...LEARNING_STATE_SEQUENCE],
    createdAt: Date.now(),
  };
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

export class DevPulseV2World2LearningLoop {
  private readonly loopId = createLoopId();
  private readonly learnings: LearningResult[] = [];
  private loopWarnings: string[] = [
    'World 2 Learning Loop Foundation V1 — learning only.',
    'No execution, file modification, or code generation.',
  ];
  private loopErrors: string[] = [];

  static readonly ownerModule = WORLD2_LEARNING_LOOP_OWNER_MODULE;
  static readonly ownerDomain = 'world2_learning_loop' as const;
  static readonly passToken = WORLD2_LEARNING_LOOP_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('world2_learning_loop');
    return owner.ownerModule === WORLD2_LEARNING_LOOP_OWNER_MODULE && owner.phase === 7.6;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const learningOwner = getDevPulseV2Owner('world2_learning_loop').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const competing = [...registeredModules].filter(
        (m) => m.includes(pattern) && m !== learningOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertDistinctFromCompletionVerifier();
  }

  static assertDoesNotExecute(): boolean {
    const loop = new DevPulseV2World2LearningLoop();
    return (
      typeof (loop as { execute?: unknown }).execute === 'undefined' &&
      typeof (loop as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (loop as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (loop as { runCommand?: unknown }).runCommand === 'undefined' &&
      typeof (loop as { deploy?: unknown }).deploy === 'undefined' &&
      typeof (loop as { writeFile?: unknown }).writeFile === 'undefined' &&
      typeof (loop as { verifyCompletion?: unknown }).verifyCompletion === 'undefined' &&
      typeof (loop as { prepareBuildPacket?: unknown }).prepareBuildPacket === 'undefined' &&
      typeof (loop as { trainModel?: unknown }).trainModel === 'undefined'
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
      assertExecutionAuthorityPresent() &&
      assertNoRegistryRuntimeMutation() &&
      getDevPulseV2Owner('world2_workspace_foundation').phase === 7.1 &&
      getDevPulseV2Owner('world2_execution_planner').phase === 7.2 &&
      getDevPulseV2Owner('world2_simulation_runtime').phase === 7.3 &&
      getDevPulseV2Owner('world2_autonomous_builder').phase === 7.4 &&
      getDevPulseV2Owner('world2_completion_verifier').phase === 7.5 &&
      getDevPulseV2Owner('world2_learning_loop').phase === 7.6
    );
  }

  captureLessons(input: LearningInput): LearningResult {
    const result = generateLearning(input);
    this.learnings.push(cloneLearningResult(result));
    this.publishSummary(result);
    return cloneLearningResult(result);
  }

  getLearnings(): LearningResult[] {
    return this.learnings.map(cloneLearningResult);
  }

  getLearningByWorkspace(workspaceId: string): LearningResult | null {
    const result = this.learnings.find((l) => l.workspaceId === workspaceId);
    return result ? cloneLearningResult(result) : null;
  }

  getLearningByVerification(verificationId: string): LearningResult | null {
    const result = this.learnings.find((l) => l.verificationId === verificationId);
    return result ? cloneLearningResult(result) : null;
  }

  getLearningByProject(projectId: string): LearningResult | null {
    const normalized = projectId.trim().toLowerCase().replace(/\s+/g, '-');
    const result = this.learnings.find((l) => l.projectId === normalized);
    return result ? cloneLearningResult(result) : null;
  }

  getLoopState(): World2LearningLoopState {
    return {
      loopId: this.loopId,
      learningCount: this.learnings.length,
      warnings: [...this.loopWarnings],
      errors: [...this.loopErrors],
    };
  }

  buildReport(result: LearningResult) {
    return buildWorld2LearningReport(this.getLoopState(), result);
  }

  formatReport(result: LearningResult): string {
    return formatWorld2LearningReport(this.getLoopState(), result);
  }

  getGovernanceSummary(): string {
    return getLearningGovernanceSummary();
  }

  checkCrossWorkspaceLearningAccess(
    actorWorkspaceId: string,
    targetWorkspaceId: string,
  ): boolean {
    const foundation = getDevPulseV2World2WorkspaceFoundation();
    const target = foundation.getManager().getWorkspace(targetWorkspaceId);
    const check = checkCrossWorkspaceAccess(actorWorkspaceId, target);
    return check.allowed;
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  private publishSummary(result: LearningResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Learning captured: ${result.learningId}`,
      summary: `World 2 lessons for ${result.projectId} — ${result.lessonCount} patterns. Learning only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.learningId,
      status: 'INFO',
      warnings: ['Learning captured only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2World2LearningLoop(): DevPulseV2World2LearningLoop {
  singleton = new DevPulseV2World2LearningLoop();
  return singleton;
}

export function getDevPulseV2World2LearningLoop(): DevPulseV2World2LearningLoop {
  if (!singleton) {
    singleton = new DevPulseV2World2LearningLoop();
  }
  return singleton;
}

export function resetDevPulseV2World2LearningLoopForTests(): DevPulseV2World2LearningLoop {
  resetLearningCounterForTests();
  singleton = new DevPulseV2World2LearningLoop();
  return singleton;
}

export {
  projectAnalysisKey,
  successPatternsKey,
  failurePatternsKey,
  warningPatternsKey,
  recommendationPatternsKey,
  verificationPatternsKey,
  riskPatternsKey,
  rollbackPatternsKey,
  governancePatternsKey,
  workspacePatternsKey,
  futureRecommendationsKey,
  WORLD2_LEARNING_LOOP_OWNER_MODULE,
  WORLD2_LEARNING_LOOP_PASS_TOKEN,
};
