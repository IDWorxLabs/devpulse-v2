/**
 * Universal Build Pipeline Verification V1 — pipeline stage tracer.
 * Traces every build through all stages and records decisions without stopping at first abort.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { assessRequirementsToPlanExecutionContract } from '../requirements-to-plan-execution-contract/index.js';
import { resolvePromptFaithfulBuildPlan } from '../prompt-faithful-generation/index.js';
import {
  collectWorkspaceFeatureRealityFallback,
  workspaceHasGeneratedFeatureModules,
} from '../feature-contract-reality/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import type {
  PipelineStageId,
  PipelineStageTrace,
  StageDecision,
  UniversalBuildMatrixEntry,
} from './universal-build-pipeline-types.js';
import { PIPELINE_STAGE_ORDER } from './universal-build-pipeline-bounds.js';
import { evaluateProfilePolicy, shouldInjectAuthRequirement } from './build-profile-policy.js';
import { evaluateFeatureRealityPolicy } from './build-feature-reality-policy.js';
import { evaluateBuildContinuationPolicy } from './build-continuation-policy.js';
import { classifyBlocker } from './blocker-classifier.js';

const STAGE_META: Record<
  PipelineStageId,
  { stageName: string; authorityModule: string; evidenceRequired: string }
> = {
  PROMPT_INTAKE: {
    stageName: 'Prompt Intake',
    authorityModule: 'aidev-engine-authority',
    evidenceRequired: 'Non-empty user prompt',
  },
  INTENT_UNDERSTANDING: {
    stageName: 'Intent Understanding',
    authorityModule: 'intent-understanding-engine',
    evidenceRequired: 'Product intelligence model with domain and purpose',
  },
  PROFILE_RESOLUTION: {
    stageName: 'Profile Resolution',
    authorityModule: 'build-profile-classification',
    evidenceRequired: 'Selected profile matching prompt domain',
  },
  PROMPT_FAITHFULNESS: {
    stageName: 'Prompt Faithfulness',
    authorityModule: 'prompt-faithful-generation',
    evidenceRequired: 'Faithfulness contract with approved modules',
  },
  MODULE_EXTRACTION: {
    stageName: 'Module Extraction',
    authorityModule: 'prompt-bounded-materialization',
    evidenceRequired: 'Approved module IDs from prompt',
  },
  PLAN_CONTRACT: {
    stageName: 'Plan Contract',
    authorityModule: 'requirements-to-plan-execution-contract',
    evidenceRequired: 'Build-ready execution contract',
  },
  ASE_AUTHORIZATION: {
    stageName: 'ASE Authorization',
    authorityModule: 'ase-enforcement-engine',
    evidenceRequired: 'materializationAuthorized from ASE pipeline',
  },
  WORKSPACE_GENERATION: {
    stageName: 'Workspace Generation',
    authorityModule: 'code-generation-engine',
    evidenceRequired: 'Generated source files in workspace',
  },
  FEATURE_REALITY: {
    stageName: 'Feature Reality',
    authorityModule: 'feature-contract-reality',
    evidenceRequired: 'Module registry, routes, App rendering, interactions',
  },
  MATERIALIZATION_QUALITY: {
    stageName: 'Materialization Quality',
    authorityModule: 'materialization-quality-score',
    evidenceRequired: 'Quality score and manifest completeness',
  },
  PERSISTENT_PROMOTION: {
    stageName: 'Persistent Promotion',
    authorityModule: 'materialization-evidence',
    evidenceRequired: 'Forensic manifest and project registry promotion',
  },
  NPM_INSTALL: {
    stageName: 'npm install',
    authorityModule: 'one-prompt-build-orchestrator',
    evidenceRequired: 'node_modules installed without fatal error',
  },
  NPM_BUILD: {
    stageName: 'npm build',
    authorityModule: 'one-prompt-build-orchestrator',
    evidenceRequired: 'dist/ build output',
  },
  AUTOFIX_ELIGIBILITY: {
    stageName: 'AutoFix Eligibility',
    authorityModule: 'autonomous-recovery-authority',
    evidenceRequired: 'Recoverable build errors with autofix path',
  },
  PREVIEW_STARTUP: {
    stageName: 'Preview Startup',
    authorityModule: 'one-prompt-live-preview',
    evidenceRequired: 'Dev server or static preview URL',
  },
  DEVICE_VIEWPORT_PREVIEW: {
    stageName: 'Device / Viewport Preview',
    authorityModule: 'virtual-device-laboratory',
    evidenceRequired: 'Viewport-specific preview verification',
  },
  FINAL_REPORT: {
    stageName: 'Final Report',
    authorityModule: 'universal-build-pipeline-verification',
    evidenceRequired: 'Consolidated build outcome report',
  },
};

function traceStage(input: {
  stage: PipelineStageId;
  decision: StageDecision;
  evidenceAvailable: string;
  blocksContinuation: boolean;
  blockerReason: string | null;
  downstreamSkipped: PipelineStageId[];
  matrixEntry: UniversalBuildMatrixEntry;
  hasGeneratedSource?: boolean;
  hasWorkspaceModules?: boolean;
  selectedProfile?: string | null;
  authInjectedWithoutPrompt?: boolean;
}): PipelineStageTrace {
  const meta = STAGE_META[input.stage];
  const blockerClass =
    input.blockerReason && input.blocksContinuation
      ? classifyBlocker({
          stage: input.stage,
          reason: input.blockerReason,
          hasGeneratedSource: input.hasGeneratedSource,
          hasWorkspaceModules: input.hasWorkspaceModules,
          selectedProfile: input.selectedProfile,
          expectedProfile: String(input.matrixEntry.expectedProfile),
          authInjectedWithoutPrompt: input.authInjectedWithoutPrompt,
        }).blockerClass
      : null;

  return {
    readOnly: true,
    stage: input.stage,
    stageName: meta.stageName,
    authorityModule: meta.authorityModule,
    decision: input.decision,
    evidenceRequired: meta.evidenceRequired,
    evidenceAvailable: input.evidenceAvailable,
    blocksContinuation: input.blocksContinuation,
    blockerReason: input.blockerReason,
    blockerClass,
    legitimateBlocker: blockerClass === 'LEGITIMATE_BLOCKER' ? true : blockerClass ? false : null,
    downstreamStagesSkipped: input.downstreamSkipped,
  };
}

function downstreamFrom(stage: PipelineStageId): PipelineStageId[] {
  const idx = PIPELINE_STAGE_ORDER.indexOf(stage);
  if (idx < 0) return [];
  return PIPELINE_STAGE_ORDER.slice(idx + 1);
}

export interface TraceUniversalBuildPipelineInput {
  matrixEntry: UniversalBuildMatrixEntry;
  projectRootDir: string;
  leafMode?: boolean;
  workspaceId?: string;
}

export interface TraceUniversalBuildPipelineResult {
  readOnly: true;
  stageTraces: PipelineStageTrace[];
  allBlockers: Array<{ stage: PipelineStageId; reason: string }>;
  buildPlan: ReturnType<typeof resolvePromptFaithfulBuildPlan>;
  profilePolicy: ReturnType<typeof evaluateProfilePolicy>;
  promptFaithfulnessPassed: boolean;
  workspaceMaterialized: boolean;
  featureRealityStatus: string | null;
  continuationPolicy: ReturnType<typeof evaluateBuildContinuationPolicy>;
}

export function traceUniversalBuildPipeline(
  input: TraceUniversalBuildPipelineInput,
): TraceUniversalBuildPipelineResult {
  const { matrixEntry, projectRootDir, leafMode = false } = input;
  const prompt = matrixEntry.prompt;
  const workspaceId = input.workspaceId ?? `ubpv1-${matrixEntry.categoryId}-${Date.now()}`;
  const workspaceDir = join(projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR, workspaceId);

  const traces: PipelineStageTrace[] = [];
  const allBlockers: Array<{ stage: PipelineStageId; reason: string }> = [];
  let abortStage: PipelineStageId | null = null;

  const addBlocker = (stage: PipelineStageId, reason: string): void => {
    allBlockers.push({ stage, reason });
    if (!abortStage) abortStage = stage;
  };

  // PROMPT_INTAKE
  traces.push(
    traceStage({
      stage: 'PROMPT_INTAKE',
      decision: prompt.trim().length > 0 ? 'PASS' : 'FAIL',
      evidenceAvailable: prompt.trim().length > 0 ? `Prompt length ${prompt.length}` : 'Empty prompt',
      blocksContinuation: prompt.trim().length === 0,
      blockerReason: prompt.trim().length === 0 ? 'Empty prompt' : null,
      downstreamSkipped: prompt.trim().length === 0 ? downstreamFrom('PROMPT_INTAKE') : [],
      matrixEntry,
    }),
  );
  if (prompt.trim().length === 0) {
    return finalize(traces, allBlockers, prompt, workspaceDir, leafMode);
  }

  const buildPlan = resolvePromptFaithfulBuildPlan(prompt);

  // INTENT_UNDERSTANDING
  const intentBlocked = Boolean(buildPlan.intentUnderstanding.blockedReason);
  traces.push(
    traceStage({
      stage: 'INTENT_UNDERSTANDING',
      decision: intentBlocked ? 'FAIL' : 'PASS',
      evidenceAvailable: buildPlan.productIntelligenceModel.product.productName,
      blocksContinuation: intentBlocked,
      blockerReason: buildPlan.intentUnderstanding.blockedReason,
      downstreamSkipped: intentBlocked ? downstreamFrom('INTENT_UNDERSTANDING') : [],
      matrixEntry,
    }),
  );
  if (intentBlocked) addBlocker('INTENT_UNDERSTANDING', buildPlan.intentUnderstanding.blockedReason!);

  // PROFILE_RESOLUTION
  const profilePolicy = evaluateProfilePolicy({
    rawPrompt: prompt,
    buildPlan,
    expectedProfile: matrixEntry.expectedProfile,
  });
  const profileBlocked = !profilePolicy.accepted;
  traces.push(
    traceStage({
      stage: 'PROFILE_RESOLUTION',
      decision: profileBlocked ? 'FAIL' : 'PASS',
      evidenceAvailable: `selected=${profilePolicy.selectedProfile}`,
      blocksContinuation: profileBlocked,
      blockerReason: profilePolicy.reason,
      downstreamSkipped: profileBlocked ? downstreamFrom('PROFILE_RESOLUTION') : [],
      matrixEntry,
      selectedProfile: profilePolicy.selectedProfile,
    }),
  );
  if (profileBlocked && profilePolicy.reason) addBlocker('PROFILE_RESOLUTION', profilePolicy.reason);

  // PROMPT_FAITHFULNESS
  const faithBlocked = Boolean(buildPlan.promptFaithfulness.blockedReason);
  const faithPassed = buildPlan.promptFaithfulness.status === 'PASS' && !faithBlocked;
  traces.push(
    traceStage({
      stage: 'PROMPT_FAITHFULNESS',
      decision: faithPassed ? 'PASS' : faithBlocked ? 'FAIL' : 'WARN',
      evidenceAvailable: `status=${buildPlan.promptFaithfulness.status}`,
      blocksContinuation: faithBlocked,
      blockerReason: buildPlan.promptFaithfulness.blockedReason,
      downstreamSkipped: faithBlocked ? downstreamFrom('PROMPT_FAITHFULNESS') : [],
      matrixEntry,
    }),
  );
  if (faithBlocked && buildPlan.promptFaithfulness.blockedReason) {
    addBlocker('PROMPT_FAITHFULNESS', buildPlan.promptFaithfulness.blockedReason);
  }

  // MODULE_EXTRACTION
  const modules = buildPlan.modulePlan.approvedModuleIds;
  const moduleBlocked = modules.length === 0;
  traces.push(
    traceStage({
      stage: 'MODULE_EXTRACTION',
      decision: moduleBlocked ? 'FAIL' : 'PASS',
      evidenceAvailable: `approved=${modules.join(', ') || 'none'}`,
      blocksContinuation: moduleBlocked,
      blockerReason: moduleBlocked ? 'No approved modules extracted from prompt' : null,
      downstreamSkipped: moduleBlocked ? downstreamFrom('MODULE_EXTRACTION') : [],
      matrixEntry,
      hasWorkspaceModules: modules.length > 0,
    }),
  );
  if (moduleBlocked) addBlocker('MODULE_EXTRACTION', 'No approved modules extracted from prompt');

  // PLAN_CONTRACT
  const contractAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: prompt });
  const contract = contractAssessment.report.buildReadyContract;
  const planBlocked = !contract;
  traces.push(
    traceStage({
      stage: 'PLAN_CONTRACT',
      decision: planBlocked ? 'FAIL' : 'PASS',
      evidenceAvailable: contract
        ? `units=${contract.buildUnits.length}`
        : 'No build-ready contract',
      blocksContinuation: planBlocked,
      blockerReason: planBlocked ? 'Planning did not produce a build-ready contract' : null,
      downstreamSkipped: planBlocked ? downstreamFrom('PLAN_CONTRACT') : [],
      matrixEntry,
    }),
  );
  if (planBlocked) addBlocker('PLAN_CONTRACT', 'Planning did not produce a build-ready contract');

  // ASE_AUTHORIZATION — simulated from upstream readiness
  const aseBlockers: string[] = [];
  if (!buildPlan.readyForGeneration) {
    aseBlockers.push(
      buildPlan.capabilityPlanning.blockedReason ??
        buildPlan.behaviorSimulation.blockedReason ??
        'ASE upstream stage blocked generation',
    );
  }
  const authInjected =
    !shouldInjectAuthRequirement(prompt) &&
    aseBlockers.some((b) => /auth|login|authentication/i.test(b));
  if (authInjected) {
    aseBlockers.push('Authentication required without explicit prompt request');
  }
  const aseBlocked = aseBlockers.length > 0 && !leafMode;
  traces.push(
    traceStage({
      stage: 'ASE_AUTHORIZATION',
      decision: aseBlocked ? 'FAIL' : buildPlan.readyForGeneration ? 'PASS' : 'WARN',
      evidenceAvailable: buildPlan.readyForGeneration ? 'readyForGeneration=true' : 'upstream blockers present',
      blocksContinuation: aseBlocked,
      blockerReason: aseBlockers[0] ?? null,
      downstreamSkipped: aseBlocked ? downstreamFrom('ASE_AUTHORIZATION') : [],
      matrixEntry,
      authInjectedWithoutPrompt: authInjected,
    }),
  );
  for (const b of aseBlockers) addBlocker('ASE_AUTHORIZATION', b);

  const workspaceExists = existsSync(workspaceDir);
  const hasModules = workspaceExists && workspaceHasGeneratedFeatureModules(workspaceDir);

  // WORKSPACE_GENERATION — in leaf mode, check if prior workspace exists or defer
  const workspaceBlocked = !leafMode && !workspaceExists && abortStage !== null;
  traces.push(
    traceStage({
      stage: 'WORKSPACE_GENERATION',
      decision: workspaceExists ? 'PASS' : leafMode ? 'SKIP' : workspaceBlocked ? 'FAIL' : 'WARN',
      evidenceAvailable: workspaceExists ? workspaceDir : leafMode ? 'deferred in leaf mode' : 'not materialized',
      blocksContinuation: workspaceBlocked,
      blockerReason: workspaceBlocked ? 'Workspace not generated' : null,
      downstreamSkipped: workspaceBlocked ? downstreamFrom('WORKSPACE_GENERATION') : [],
      matrixEntry,
      hasGeneratedSource: workspaceExists,
      hasWorkspaceModules: hasModules,
    }),
  );

  // FEATURE_REALITY
  let featureRealityStatus: string | null = null;
  if (workspaceExists && hasModules) {
    const fallback = collectWorkspaceFeatureRealityFallback({
      workspaceDir,
      requiredModuleIds: modules,
      contractId: buildPlan.promptFaithfulness.contract.id,
      previewUrl: 'workspace://ubpv1-trace',
      registerAssessment: false,
    });
    const frPolicy = evaluateFeatureRealityPolicy(fallback);
    featureRealityStatus = frPolicy.status;
    traces.push(
      traceStage({
        stage: 'FEATURE_REALITY',
        decision: frPolicy.isHardBlocker ? 'FAIL' : frPolicy.isWarning ? 'DEGRADED' : 'PASS',
        evidenceAvailable: frPolicy.detail,
        blocksContinuation: frPolicy.isHardBlocker,
        blockerReason: frPolicy.isHardBlocker ? frPolicy.detail : null,
        downstreamSkipped: frPolicy.isHardBlocker ? downstreamFrom('FEATURE_REALITY') : [],
        matrixEntry,
        hasWorkspaceModules: hasModules,
      }),
    );
    if (frPolicy.isHardBlocker) addBlocker('FEATURE_REALITY', frPolicy.detail);
  } else {
    traces.push(
      traceStage({
        stage: 'FEATURE_REALITY',
        decision: 'SKIP',
        evidenceAvailable: 'Workspace modules not yet available',
        blocksContinuation: false,
        blockerReason: null,
        downstreamSkipped: [],
        matrixEntry,
      }),
    );
  }

  // Continuation policy evaluation
  const continuationPolicy = evaluateBuildContinuationPolicy({
    promptFaithfulnessPassed: faithPassed,
    workspaceExists,
    generatedModulesExist: modules.length > 0,
    hasGeneratedSourceFiles: workspaceExists,
    blockers: allBlockers.map((b) => b.reason),
    featureRealityStatus,
    selectedProfile: profilePolicy.selectedProfile,
    prompt,
  });

  // Remaining stages — leaf mode marks as SKIP unless continuation allows
  const postStages: PipelineStageId[] = [
    'MATERIALIZATION_QUALITY',
    'PERSISTENT_PROMOTION',
    'NPM_INSTALL',
    'NPM_BUILD',
    'AUTOFIX_ELIGIBILITY',
    'PREVIEW_STARTUP',
    'DEVICE_VIEWPORT_PREVIEW',
    'FINAL_REPORT',
  ];

  for (const stage of postStages) {
    const canContinue = continuationPolicy.shouldContinueToBuild || !abortStage;
    traces.push(
      traceStage({
        stage,
        decision: leafMode ? 'SKIP' : canContinue ? 'WARN' : 'SKIP',
        evidenceAvailable: leafMode
          ? 'leaf mode — execution deferred'
          : canContinue
            ? 'continuation policy authorized'
            : `skipped after ${abortStage}`,
        blocksContinuation: false,
        blockerReason: null,
        downstreamSkipped: [],
        matrixEntry,
      }),
    );
  }

  return finalize(traces, allBlockers, prompt, workspaceDir, leafMode, {
    buildPlan,
    profilePolicy,
    promptFaithfulnessPassed: faithPassed,
    workspaceMaterialized: workspaceExists,
    featureRealityStatus,
    continuationPolicy,
  });
}

function finalize(
  traces: PipelineStageTrace[],
  allBlockers: Array<{ stage: PipelineStageId; reason: string }>,
  prompt: string,
  workspaceDir: string,
  leafMode: boolean,
  extra?: Partial<TraceUniversalBuildPipelineResult>,
): TraceUniversalBuildPipelineResult {
  void prompt;
  void workspaceDir;
  void leafMode;
  const buildPlan = extra?.buildPlan ?? resolvePromptFaithfulBuildPlan('');
  const profilePolicy =
    extra?.profilePolicy ??
    evaluateProfilePolicy({
      rawPrompt: '',
      buildPlan,
      expectedProfile: 'GENERIC_CUSTOM_APP_V1',
    });

  return {
    readOnly: true,
    stageTraces: traces,
    allBlockers,
    buildPlan,
    profilePolicy,
    promptFaithfulnessPassed: extra?.promptFaithfulnessPassed ?? false,
    workspaceMaterialized: extra?.workspaceMaterialized ?? false,
    featureRealityStatus: extra?.featureRealityStatus ?? null,
    continuationPolicy:
      extra?.continuationPolicy ??
      evaluateBuildContinuationPolicy({
        promptFaithfulnessPassed: false,
        workspaceExists: false,
        generatedModulesExist: false,
        hasGeneratedSourceFiles: false,
        blockers: allBlockers.map((b) => b.reason),
      }),
  };
}
