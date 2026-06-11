/**
 * Autonomous Builder Reality — read-only analyzers.
 */

import {
  getBuilderExecutionSessionCount,
  listControlledExecutionEvidence,
} from '../controlled-builder-execution-engine/index.js';
import {
  getRealFileWorkspaceExecutionSessionCount,
  listRealFileExecutionEvidence,
} from '../real-file-workspace-execution/index.js';
import type {
  AssessAutonomousBuilderRealityInput,
  BuilderAnalyzerResults,
  BuilderExecutionEvidence,
  BuilderExecutionStage,
  BuildCapabilityLevel,
  FileGenerationRealityLevel,
  ModulePresenceEvidence,
  PlanningRealityLevel,
  AutonomousCompletionLevel,
  ValidationRealityLevel,
  WorkspaceBuilderSignals,
} from './autonomous-builder-reality-types.js';

function planningSignals(modules: ModulePresenceEvidence, workspace: WorkspaceBuilderSignals) {
  return {
    requirements: modules.hasRequirementExtractor,
    plans: modules.hasCapabilityPlanning || modules.hasBuildPackageGenerator,
    architecture: modules.hasBuildPackageGenerator,
    tasks: modules.hasBuildTaskRuntime,
    foundation: workspace.world2FoundationComplete,
  };
}

export function analyzePlanningReality(input: AssessAutonomousBuilderRealityInput): PlanningRealityLevel {
  const s = planningSignals(input.moduleEvidence, input.workspace);
  const count = [s.requirements, s.plans, s.architecture, s.tasks].filter(Boolean).length;
  if (count >= 4 && s.foundation) return 'PLANNING_AVAILABLE';
  if (count >= 2 || s.foundation) return 'PLANNING_PARTIAL';
  return 'PLANNING_MISSING';
}

export function analyzeFileGenerationReality(input: AssessAutonomousBuilderRealityInput): FileGenerationRealityLevel {
  const { workspace, moduleEvidence } = input;
  if (workspace.executionConnected && moduleEvidence.hasWorld2ControlledApply) {
    return 'FILE_GENERATION_PROVEN';
  }
  if (moduleEvidence.hasWorld2ControlledApply || moduleEvidence.hasCodeGenerationRuntime) {
    return 'FILE_GENERATION_PARTIAL';
  }
  return 'FILE_GENERATION_UNPROVEN';
}

export function analyzeBuildExecutionReality(input: AssessAutonomousBuilderRealityInput): BuildCapabilityLevel {
  const { workspace } = input;
  if (workspace.executionConnected) return 'BUILD_CAPABILITY_PROVEN';
  if (workspace.livePreviewConnected || workspace.readiness === 'partial') {
    return 'BUILD_CAPABILITY_OBSERVED';
  }
  if (workspace.world2FoundationComplete) return 'BUILD_CAPABILITY_CLAIMED';
  return 'BUILD_CAPABILITY_CLAIMED';
}

export function analyzeValidationReality(input: AssessAutonomousBuilderRealityInput): ValidationRealityLevel {
  const { workspace, moduleEvidence } = input;
  if (workspace.executionConnected && moduleEvidence.validatorScriptCount > 0) {
    return 'VALIDATION_PROVEN';
  }
  if (moduleEvidence.validatorScriptCount > 0) {
    return 'VALIDATION_PARTIAL';
  }
  return 'VALIDATION_MISSING';
}

export function analyzeAutonomousCompletion(input: AssessAutonomousBuilderRealityInput): {
  level: AutonomousCompletionLevel;
  stages: BuilderExecutionStage[];
  stopPoint: string | null;
} {
  const planning = analyzePlanningReality(input);
  const fileGen = analyzeFileGenerationReality(input);
  const build = analyzeBuildExecutionReality(input);
  const validation = analyzeValidationReality(input);

  const requirementStatus: BuilderExecutionStage['status'] =
    planning !== 'PLANNING_MISSING' ? 'COMPLETE' : 'BLOCKED';
  const planStatus: BuilderExecutionStage['status'] =
    planning === 'PLANNING_AVAILABLE' ? 'COMPLETE' : planning === 'PLANNING_PARTIAL' ? 'PARTIAL' : 'NOT_STARTED';
  const buildStatus: BuilderExecutionStage['status'] =
    build === 'BUILD_CAPABILITY_PROVEN'
      ? 'COMPLETE'
      : build === 'BUILD_CAPABILITY_OBSERVED'
        ? 'PARTIAL'
        : input.workspace.executionConnected
          ? 'PARTIAL'
          : 'BLOCKED';
  const validateStatus: BuilderExecutionStage['status'] =
    validation === 'VALIDATION_PROVEN'
      ? 'COMPLETE'
      : validation === 'VALIDATION_PARTIAL'
        ? 'PARTIAL'
        : 'NOT_STARTED';

  const stages: BuilderExecutionStage[] = [
    {
      stage: 'REQUIREMENT',
      status: requirementStatus,
      detail: requirementStatus === 'COMPLETE' ? 'Requirement extraction modules present' : 'Requirement pipeline not evidenced',
    },
    {
      stage: 'PLAN',
      status: planStatus,
      detail: planStatus === 'COMPLETE' ? 'Planning stack modules present' : 'Planning partial or missing',
    },
    {
      stage: 'BUILD',
      status: buildStatus,
      detail:
        build === 'BUILD_CAPABILITY_PROVEN'
          ? 'Build execution connected'
          : build === 'BUILD_CAPABILITY_OBSERVED'
            ? 'Preview/build signals observed without connected execution'
            : 'Build execution not connected — stop before autonomous build',
    },
    {
      stage: 'VALIDATE',
      status: validateStatus,
      detail:
        validation === 'VALIDATION_PROVEN'
          ? 'Validation tied to execution evidence'
          : validation === 'VALIDATION_PARTIAL'
            ? 'Validation scripts exist but not tied to builder output'
            : 'Validation missing',
    },
  ];

  const stopStage = stages.find((s) => s.status === 'BLOCKED') ?? stages.find((s) => s.status === 'PARTIAL');
  const stopPoint = stopStage ? `${stopStage.stage}: ${stopStage.detail}` : null;

  if (
    build === 'BUILD_CAPABILITY_PROVEN' &&
    validation === 'VALIDATION_PROVEN' &&
    planning === 'PLANNING_AVAILABLE' &&
    fileGen === 'FILE_GENERATION_PROVEN'
  ) {
    return { level: 'AUTONOMOUS_COMPLETE', stages, stopPoint: null };
  }

  if (planning === 'PLANNING_MISSING' || buildStatus === 'BLOCKED') {
    return { level: 'AUTONOMOUS_BLOCKED', stages, stopPoint };
  }

  return { level: 'AUTONOMOUS_PARTIAL', stages, stopPoint };
}

export function collectBuilderExecutionEvidence(input: AssessAutonomousBuilderRealityInput): BuilderExecutionEvidence[] {
  const evidence: BuilderExecutionEvidence[] = [];
  let id = 0;
  const push = (category: string, description: string, level: BuilderExecutionEvidence['level'], source: string) => {
    id += 1;
    evidence.push({ id: `evidence-${id}`, category, description, level, source });
  };

  const { workspace, moduleEvidence } = input;

  if (workspace.world2FoundationComplete) {
    push('Planning', 'World 2 autonomous builder foundation complete', 'CLAIMED', 'workspace.autonomousBuilder.world2FoundationComplete');
  }
  if (moduleEvidence.hasRequirementExtractor) {
    push('Planning', 'Requirement extractor module exists', 'OBSERVED', 'src/requirement-extractor');
  }
  if (moduleEvidence.hasCapabilityPlanning) {
    push('Planning', 'Capability planning engine exists', 'OBSERVED', 'src/capability-planning-engine');
  }
  if (moduleEvidence.hasBuildPackageGenerator) {
    push('Planning', 'Build package generator exists', 'OBSERVED', 'src/build-package-generator');
  }
  if (moduleEvidence.hasBuildTaskRuntime) {
    push('Planning', 'Build task runtime exists', 'OBSERVED', 'src/build-task-runtime');
  }
  if (moduleEvidence.hasCodeGenerationRuntime) {
    push('Code Generation', 'Code generation runtime exists', 'OBSERVED', 'src/code-generation-runtime');
  }
  if (moduleEvidence.hasWorld2ControlledApply) {
    push('File Generation', 'World 2 controlled apply runtime exists', 'OBSERVED', 'src/world2-controlled-apply-runtime');
  }
  if (workspace.livePreviewConnected) {
    push('Build Execution', 'Live preview connected', 'OBSERVED', 'workspace.livePreview.connected');
  }
  if (workspace.executionConnected) {
    push('Build Execution', 'Autonomous builder execution connected', 'PROVEN', 'workspace.autonomousBuilder.executionConnected');
  } else {
    push('Build Execution', 'Autonomous builder execution not connected', 'CLAIMED', 'workspace.autonomousBuilder.executionConnected=false');
  }
  if (moduleEvidence.validatorScriptCount > 0) {
    push(
      'Validation',
      `${moduleEvidence.validatorScriptCount} validate:* scripts available`,
      workspace.executionConnected ? 'PROVEN' : 'OBSERVED',
      'package.json scripts',
    );
  }
  if (moduleEvidence.hasAutonomousBuilderFoundation) {
    push('Planning', 'Autonomous builder foundation module exists (planningOnly readiness)', 'OBSERVED', 'src/autonomous-builder');
  }
  if (moduleEvidence.hasControlledBuilderExecutionEngine) {
    push('Build Execution', 'Controlled builder execution engine exists (Phase 24C)', 'OBSERVED', 'src/controlled-builder-execution-engine');
  }
  if (moduleEvidence.hasMobileRuntimeExperienceReality) {
    push('Build Execution', 'Mobile Runtime Experience Reality authority exists (Phase 24C.5)', 'OBSERVED', 'src/mobile-runtime-experience-reality');
  }
  if (moduleEvidence.hasRealFileWorkspaceExecution) {
    push('Build Execution', 'Real file workspace execution module exists (Phase 24D)', 'OBSERVED', 'src/real-file-workspace-execution');
  }
  if (getRealFileWorkspaceExecutionSessionCount() > 0) {
    push('Build Execution', 'Real file workspace execution session recorded', 'OBSERVED', 'real-file-workspace-execution');
  }
  if (listRealFileExecutionEvidence().some((e) => e.evidenceType === 'FILE_CREATED')) {
    push('Build Execution', 'Real isolated workspace file created with evidence', 'OBSERVED', 'real-file-workspace-execution');
  }
  const controlledSessionCount = getBuilderExecutionSessionCount();
  if (controlledSessionCount > 0) {
    push(
      'Build Execution',
      `${controlledSessionCount} controlled execution session(s) recorded`,
      'OBSERVED',
      'controlled-builder-execution-engine',
    );
  }
  const controlledEvidence = listControlledExecutionEvidence();
  if (controlledEvidence.some((e) => e.evidenceType === 'ACTION_COMPLETED')) {
    push('Build Execution', 'Controlled execution actions completed with evidence', 'OBSERVED', 'controlled-builder-execution-engine');
  }
  if (controlledEvidence.some((e) => e.evidenceType === 'SESSION_COMPLETED')) {
    push(
      'Build Execution',
      'Controlled execution session completed — path toward executionConnected=true',
      'OBSERVED',
      'controlled-builder-execution-engine',
    );
  }

  return evidence;
}

export function runAllBuilderRealityAnalyzers(input: AssessAutonomousBuilderRealityInput): BuilderAnalyzerResults {
  const completion = analyzeAutonomousCompletion(input);
  return {
    planningReality: analyzePlanningReality(input),
    fileGenerationReality: analyzeFileGenerationReality(input),
    buildCapabilityLevel: analyzeBuildExecutionReality(input),
    validationReality: analyzeValidationReality(input),
    autonomousCompletion: completion.level,
    executionStages: completion.stages,
    stopPoint: completion.stopPoint,
  };
}
