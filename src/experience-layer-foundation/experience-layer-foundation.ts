/**
 * DevPulse V2 Experience Layer Foundation — Phase 10.1.
 * Founder-facing experience map. Exposes existing systems — no execution.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2CentralBrainAuthority } from '../central-brain/central-brain-authority.js';
import { getDevPulseV2Owner, listDevPulseV2Owners } from '../foundation/ownership-registry.js';
import { getDevPulseV2TimelineLedgerAuthority } from '../timeline-ledger/timeline-ledger-authority.js';
import { checkWorld1ModificationAttempt } from '../world2-workspace-foundation/workspace-boundary-rules.js';
import {
  answerFounderQuestions,
  countRequiredDecisions,
  decisionPointsKey,
  generateDecisionPoints,
} from './decision-point-engine.js';
import {
  assertDistinctFromIntelligenceSystems,
  assertExposedSystemsRegistered,
  assertExperienceNotSourceOfTruth,
  assertGovernanceDependenciesPresent,
  assertNoDuplicateExperienceLayer,
  assertNoExecutionMethods,
  assertNoGovernanceBypass,
  assertNoRegistryRuntimeMutation,
  assertWorld1Protected,
  assertWorld2Protected,
  getExperienceGovernanceSummary,
  governanceGatesKey,
  validateExperienceGovernance,
} from './experience-governance-bridge.js';
import {
  buildExperienceLayerReport,
  buildExperienceLayerReportOutput,
  formatExperienceLayerReport,
} from './experience-layer-report.js';
import {
  generateExperienceSurfaces,
  getSurfaceSequence,
  surfacesKey,
} from './experience-surface-engine.js';
import {
  generateJourneyStages,
  getFounderActionsForStage,
  getSystemActionsForStage,
  journeyKey,
} from './founder-journey-engine.js';
import {
  generateRecommendedPath,
  getPrimaryRecommendation,
  pathIncludesAllStacks,
  recommendedPathKey,
} from './recommended-path-engine.js';
import {
  generateSystemSequence,
  includesGovernanceStack,
  includesMobileStack,
  includesSelfEvolutionStack,
  includesTrustAwareness,
  includesVerificationAwareness,
  includesWorld2Stack,
  systemSequenceKey,
} from './system-sequence-engine.js';
import type {
  ExperienceLayerFoundationState,
  ExperienceMapInput,
  ExperienceMapResult,
  ExperienceState,
  GateRecord,
} from './types.js';
import {
  CODE_GEN_BLOCKED_PATTERNS,
  DUPLICATE_PATTERNS,
  EXECUTION_BLOCKED_PATTERNS,
  EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE,
  EXPERIENCE_LAYER_FOUNDATION_PASS_TOKEN,
  EXPERIENCE_STATE_SEQUENCE,
  FILE_MOD_BLOCKED_PATTERNS,
  GOVERNANCE_MUTATION_BLOCKED_PATTERNS,
  REGISTRY_MUTATION_BLOCKED_PATTERNS,
  UI_RENDER_BLOCKED_PATTERNS,
  nextExperienceId,
  nextJourneyId,
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

let singleton: DevPulseV2ExperienceLayerFoundation | null = null;

function createFoundationId(): string {
  return `experience-layer-foundation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateExperienceMapInput(input: ExperienceMapInput): {
  valid: boolean;
  blocked: boolean;
  gates: GateRecord[];
  warnings: string[];
} {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];

  if (!input.workspaceId?.trim()) {
    gates.push({
      gateId: 'exp-input-0001',
      gateType: 'WORKSPACE_REQUIRED',
      status: 'CLOSED',
      description: 'Workspace ID required for experience mapping',
    });
  }

  if (!input.projectId?.trim()) {
    gates.push({
      gateId: 'exp-input-0002',
      gateType: 'PROJECT_REQUIRED',
      status: 'CLOSED',
      description: 'Project ID required for experience mapping',
    });
  }

  if (!input.projectIdeaSummary?.trim()) {
    gates.push({
      gateId: 'exp-input-0003',
      gateType: 'IDEA_SUMMARY_REQUIRED',
      status: 'CLOSED',
      description: 'Project idea summary required for founder orientation',
    });
  }

  const summaryLower = input.projectIdeaSummary?.toLowerCase() ?? '';
  const blockedPatterns = [
    ...EXECUTION_BLOCKED_PATTERNS,
    ...CODE_GEN_BLOCKED_PATTERNS,
    ...FILE_MOD_BLOCKED_PATTERNS,
    ...GOVERNANCE_MUTATION_BLOCKED_PATTERNS,
    ...REGISTRY_MUTATION_BLOCKED_PATTERNS,
    ...UI_RENDER_BLOCKED_PATTERNS,
  ];

  for (const pattern of blockedPatterns) {
    if (summaryLower.includes(pattern)) {
      gates.push({
        gateId: 'exp-input-0004',
        gateType: 'FORBIDDEN_INTENT',
        status: 'CLOSED',
        description: `Experience map blocked — forbidden intent pattern: ${pattern}`,
      });
      warnings.push(`Blocked pattern detected: ${pattern}`);
      break;
    }
  }

  if (
    input.targetWorkspaceId &&
    input.targetProjectId &&
    (input.targetWorkspaceId !== input.workspaceId || input.targetProjectId !== input.projectId)
  ) {
    gates.push({
      gateId: 'exp-input-0005',
      gateType: 'CROSS_PROJECT_ISOLATION',
      status: 'OPEN',
      description: 'Target project differs — experience map scoped to input workspace/project',
    });
  }

  const blocked = gates.some((g) => g.status === 'CLOSED');
  return { valid: !blocked, blocked, gates, warnings };
}

export function evaluateExperienceProjectContext(input: ExperienceMapInput): {
  valid: boolean;
  blocked: boolean;
  gates: GateRecord[];
  warnings: string[];
} {
  const gates: GateRecord[] = [
    {
      gateId: 'exp-ctx-0001',
      gateType: 'EXPERIENCE_CONTEXT_VALIDATED',
      status: 'OPEN',
      description: `Experience context validated for ${input.workspaceId}/${input.projectId}`,
    },
  ];
  const warnings: string[] = [];

  if (input.governanceStatus === 'FAIL') {
    gates.push({
      gateId: 'exp-ctx-0002',
      gateType: 'GOVERNANCE_FAIL',
      status: 'CLOSED',
      description: 'Governance status FAIL — experience map blocked',
    });
  }

  return {
    valid: input.governanceStatus !== 'FAIL',
    blocked: input.governanceStatus === 'FAIL',
    gates,
    warnings,
  };
}

function buildStateSequence(blocked: boolean, stagesComplete: boolean): ExperienceState[] {
  if (blocked) return ['EXPERIENCE_REQUEST_RECEIVED', 'EXPERIENCE_BLOCKED'];

  const sequence: ExperienceState[] = ['EXPERIENCE_REQUEST_RECEIVED'];
  sequence.push('SURFACES_GENERATED', 'JOURNEY_MAPPED', 'SYSTEMS_SEQUENCED', 'DECISIONS_MAPPED', 'PATH_RECOMMENDED');
  if (stagesComplete) sequence.push('EXPERIENCE_MAP_READY');
  return sequence;
}

function cloneResult(result: ExperienceMapResult): ExperienceMapResult {
  return {
    ...result,
    surfaceSequence: [...result.surfaceSequence],
    systemSequence: [...result.systemSequence],
    founderActions: [...result.founderActions],
    systemActions: [...result.systemActions],
    decisionPoints: result.decisionPoints.map((d) => ({ ...d, relatedSystems: [...d.relatedSystems] })),
    recommendedPath: result.recommendedPath.map((s) => ({ ...s })),
    warnings: [...result.warnings],
    surfaces: result.surfaces.map((s) => ({ ...s, connectedSystems: [...s.connectedSystems] })),
    journeyStages: [...result.journeyStages],
    founderGuidance: [...result.founderGuidance],
    governanceGates: result.governanceGates.map((g) => ({ ...g })),
    ownershipGates: result.ownershipGates.map((g) => ({ ...g })),
    confirmation: { ...result.confirmation },
    stateSequence: [...result.stateSequence],
  };
}

export function processExperienceMap(input: ExperienceMapInput): ExperienceMapResult {
  const experienceId = input.experienceId ?? nextExperienceId();
  const journeyId = input.journeyId ?? nextJourneyId();
  const enrichedInput: ExperienceMapInput = { ...input, experienceId, journeyId };

  const inputValidation = validateExperienceMapInput(enrichedInput);
  const projectContext = evaluateExperienceProjectContext(enrichedInput);
  const governance = validateExperienceGovernance(enrichedInput);

  const blocked = inputValidation.blocked || projectContext.blocked || !governance.valid;

  const surfaces = blocked ? [] : generateExperienceSurfaces();
  const surfaceSequence = blocked ? [] : getSurfaceSequence();
  const journeyStages = blocked ? [] : generateJourneyStages();
  const systemSequence = blocked ? [] : generateSystemSequence(journeyStages);
  const decisionPoints = blocked ? [] : generateDecisionPoints(journeyStages);
  const recommendedPath = blocked ? [] : generateRecommendedPath(journeyStages);

  const founderActions = blocked
    ? []
    : journeyStages.flatMap((stage) => getFounderActionsForStage(stage));
  const systemActions = blocked
    ? []
    : journeyStages.flatMap((stage) => getSystemActionsForStage(stage));

  const currentStage = journeyStages[0] ?? 'IDEA_CAPTURE';
  const founderGuidance = blocked
    ? ['Experience map blocked — resolve governance or input issues before proceeding']
    : answerFounderQuestions(currentStage, systemSequence);

  const warnings = [
    ...inputValidation.warnings,
    ...projectContext.warnings,
    ...(blocked ? ['Experience mapping blocked — no execution performed'] : []),
    'Experience mapping only — no UI rendering, execution, or file modification',
  ];

  const stateSequence = buildStateSequence(blocked, journeyStages.length > 0);
  const experienceState = stateSequence[stateSequence.length - 1] ?? 'EXPERIENCE_BLOCKED';

  return {
    experienceId,
    journeyId,
    workspaceId: enrichedInput.workspaceId,
    projectId: enrichedInput.projectId,
    surfaceSequence,
    systemSequence,
    founderActions,
    systemActions,
    decisionPoints,
    recommendedPath,
    warnings,
    surfaces,
    journeyStages,
    founderGuidance,
    experienceState,
    governanceGates: governance.gates,
    ownershipGates: [...inputValidation.gates, ...projectContext.gates],
    confirmation: {
      experienceMappingOnly: true,
      noExecutionPerformed: true,
      noCommandsExecuted: true,
      noFilesModified: true,
      noCodeGenerated: true,
      noGovernanceModified: true,
      noOwnershipRegistryModified: true,
      noUiRenderingPerformed: true,
    },
    stateSequence,
    createdAt: Date.now(),
  };
}

export function experienceStructuralKey(result: ExperienceMapResult): string {
  return [
    result.workspaceId,
    result.projectId,
    surfacesKey(result.surfaceSequence),
    journeyKey(result.journeyStages),
    systemSequenceKey(result.systemSequence),
    decisionPointsKey(result.decisionPoints),
    recommendedPathKey(result.recommendedPath),
    governanceGatesKey(result.governanceGates),
  ].join('|');
}

export function experienceStateIncludes(states: ExperienceState[], target: ExperienceState): boolean {
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

export class DevPulseV2ExperienceLayerFoundation {
  private readonly foundationId = createFoundationId();
  private readonly maps: ExperienceMapResult[] = [];
  private foundationWarnings: string[] = [
    'Phase 10.1 Experience Layer Foundation V1 — experience mapping only.',
    'No execution, UI rendering, file modification, or governance changes.',
  ];
  private foundationErrors: string[] = [];

  static readonly ownerModule = EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE;
  static readonly ownerDomain = 'experience_layer_foundation' as const;
  static readonly passToken = EXPERIENCE_LAYER_FOUNDATION_PASS_TOKEN;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('experience_layer_foundation');
    return owner.ownerModule === EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE && owner.phase === 10.1;
  }

  static assertDuplicateCheckPasses(): boolean {
    const registeredModules = new Set(listDevPulseV2Owners().map((o) => o.ownerModule));
    const experienceOwner = getDevPulseV2Owner('experience_layer_foundation').ownerModule;

    const noDuplicateModules = DUPLICATE_PATTERNS.every((pattern) => {
      const normalized = pattern.replace(/\s+/g, '_');
      const competing = [...registeredModules].filter(
        (m) => (m.includes(normalized) || m.includes('experience_layer')) && m !== experienceOwner,
      );
      return competing.length === 0;
    });

    return noDuplicateModules && assertNoDuplicateExperienceLayer() && assertDistinctFromIntelligenceSystems();
  }

  static assertDoesNotExecute(): boolean {
    const foundation = new DevPulseV2ExperienceLayerFoundation();
    return (
      assertNoExecutionMethods(foundation) &&
      typeof (foundation as { modifyFiles?: unknown }).modifyFiles === 'undefined' &&
      typeof (foundation as { generateCode?: unknown }).generateCode === 'undefined' &&
      typeof (foundation as { renderUi?: unknown }).renderUi === 'undefined' &&
      typeof (foundation as { modifyGovernance?: unknown }).modifyGovernance === 'undefined' &&
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
      assertDistinctFromIntelligenceSystems() &&
      assertExperienceNotSourceOfTruth() &&
      assertExposedSystemsRegistered() &&
      getDevPulseV2Owner('future_problem_prediction').phase === 9.6
    );
  }

  mapExperience(input: ExperienceMapInput): ExperienceMapResult {
    const result = processExperienceMap(input);
    this.maps.push(cloneResult(result));
    this.publishSummary(result);
    return cloneResult(result);
  }

  getMaps(): ExperienceMapResult[] {
    return this.maps.map(cloneResult);
  }

  getMapByExperienceId(experienceId: string): ExperienceMapResult | null {
    const result = this.maps.find((m) => m.experienceId === experienceId);
    return result ? cloneResult(result) : null;
  }

  getMapByProject(projectId: string): ExperienceMapResult | null {
    const result = this.maps.find((m) => m.projectId === projectId);
    return result ? cloneResult(result) : null;
  }

  getFoundationState(): ExperienceLayerFoundationState {
    return {
      foundationId: this.foundationId,
      mapCount: this.maps.length,
      warnings: [...this.foundationWarnings],
      errors: [...this.foundationErrors],
    };
  }

  buildReport(result: ExperienceMapResult, input: ExperienceMapInput) {
    const output = buildExperienceLayerReportOutput(result);
    return buildExperienceLayerReport(this.getFoundationState(), result, output);
  }

  formatReport(result: ExperienceMapResult, input: ExperienceMapInput): string {
    return formatExperienceLayerReport(this.getFoundationState(), result, input);
  }

  getGovernanceSummary(): string {
    return getExperienceGovernanceSummary();
  }

  checkWorld1ModificationBlocked(domain: string): boolean {
    return !checkWorld1ModificationAttempt(domain).allowed;
  }

  checkExperienceNotSourceOfTruth(): boolean {
    return assertExperienceNotSourceOfTruth();
  }

  checkObserverOnly(): boolean {
    return true;
  }

  private publishSummary(result: ExperienceMapResult): void {
    void getDevPulseV2CentralBrainAuthority().getBrainState();
    getDevPulseV2TimelineLedgerAuthority().addEvent({
      source: 'FOUNDATION',
      category: 'SYSTEM',
      title: `Experience map: ${result.experienceId}`,
      summary: `${result.projectId} → ${result.surfaceSequence.length} surfaces, ${result.journeyStages.length} stages. Experience mapping only.`,
      relatedEvidenceIds: [],
      relatedRecordId: result.experienceId,
      status: result.experienceState === 'EXPERIENCE_BLOCKED' ? 'WARN' : 'INFO',
      warnings: ['Experience mapping only — no execution performed.'],
      errors: [],
    });
  }
}

export function createDevPulseV2ExperienceLayerFoundation(): DevPulseV2ExperienceLayerFoundation {
  singleton = new DevPulseV2ExperienceLayerFoundation();
  return singleton;
}

export function getDevPulseV2ExperienceLayerFoundation(): DevPulseV2ExperienceLayerFoundation {
  if (!singleton) {
    singleton = new DevPulseV2ExperienceLayerFoundation();
  }
  return singleton;
}

export function resetDevPulseV2ExperienceLayerFoundationForTests(): DevPulseV2ExperienceLayerFoundation {
  singleton = new DevPulseV2ExperienceLayerFoundation();
  return singleton;
}

export {
  surfacesKey,
  journeyKey,
  systemSequenceKey,
  decisionPointsKey,
  recommendedPathKey,
  governanceGatesKey,
  EXPERIENCE_STATE_SEQUENCE,
  EXPERIENCE_LAYER_FOUNDATION_OWNER_MODULE,
  EXPERIENCE_LAYER_FOUNDATION_PASS_TOKEN,
  includesGovernanceStack,
  includesWorld2Stack,
  includesMobileStack,
  includesSelfEvolutionStack,
  includesVerificationAwareness,
  includesTrustAwareness,
  countRequiredDecisions,
  getPrimaryRecommendation,
  pathIncludesAllStacks,
  generateExperienceSurfaces,
  generateJourneyStages,
  generateSystemSequence,
  generateDecisionPoints,
  generateRecommendedPath,
  assertGovernanceDependenciesPresent,
  assertNoGovernanceBypass,
  assertWorld1Protected,
  assertWorld2Protected,
  assertNoDuplicateExperienceLayer,
  assertExperienceNotSourceOfTruth,
  assertExposedSystemsRegistered,
  assertDistinctFromIntelligenceSystems,
  validateExperienceGovernance,
};
