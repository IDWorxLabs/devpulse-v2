/**
 * End-to-End Founder Workflow Reality — read-only analyzers (Phase 24A.4).
 * Aggregates 24A.1 / 24A.2 / 24A.3 without workspace snapshot or brain calls.
 * Menu item, panel, route, URL, roadmap, authority module, report ≠ proof.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assessAutonomousBuilderReality,
  detectModulePresenceEvidence as detectBuilderModuleEvidence,
} from '../autonomous-builder-reality/index.js';
import {
  assessLivePreviewReality,
  assessLivePreviewRealityAuthority,
  buildPreviewWorkspaceSignalsFromLegacy,
  detectPreviewModulePresenceEvidence,
} from '../live-preview-reality/index.js';
import type { LivePreviewRealityInput } from '../live-preview-reality/index.js';
import {
  assessVerificationReality,
  buildVerificationWorkspaceSignalsForValidation,
  detectVerificationModulePresenceEvidence,
} from '../verification-reality/index.js';
import {
  getBuilderExecutionSessionCount,
  listControlledExecutionEvidence,
} from '../controlled-builder-execution-engine/index.js';
import {
  getRealFileWorkspaceExecutionSessionCount,
  listRealFileExecutionEvidence,
} from '../real-file-workspace-execution/index.js';
import type {
  AssessFounderWorkflowRealityInput,
  FounderWorkflowAnalyzerResults,
  FounderWorkflowEvidence,
  FounderWorkflowMatrixRow,
  FounderWorkflowStage,
  UpstreamRealityBundle,
  WorkflowModulePresenceEvidence,
  WorkflowContinuityTransition,
} from './end-to-end-founder-workflow-reality-types.js';
import type {
  FounderExperienceLevel,
  FounderWorkflowStageId,
  LaunchReadinessRealityLevel,
  StageEvidenceLevel,
  WorkflowContinuityLevel,
  WorkflowTransitionResult,
  WorkflowTruthMapLabel,
} from './end-to-end-founder-workflow-reality-analyzer-types.js';

const STAGE_ORDER: FounderWorkflowStageId[] = [
  'IDEA',
  'PLAN',
  'ARCHITECTURE',
  'TASK_BREAKDOWN',
  'BUILD',
  'RUNTIME',
  'PREVIEW',
  'VERIFY',
  'LAUNCH_READINESS',
];

const TRANSITIONS: Array<[FounderWorkflowStageId, FounderWorkflowStageId]> = [
  ['IDEA', 'PLAN'],
  ['PLAN', 'ARCHITECTURE'],
  ['ARCHITECTURE', 'TASK_BREAKDOWN'],
  ['TASK_BREAKDOWN', 'BUILD'],
  ['BUILD', 'RUNTIME'],
  ['RUNTIME', 'PREVIEW'],
  ['PREVIEW', 'VERIFY'],
  ['VERIFY', 'LAUNCH_READINESS'],
];

function readBounded(rootDir: string, rel: string, maxBytes = 96_000): string {
  const fullPath = join(rootDir, rel);
  if (!existsSync(fullPath)) return '';
  const buf = readFileSync(fullPath);
  return buf.subarray(0, Math.min(buf.length, maxBytes)).toString('utf8');
}

export function detectWorkflowModulePresenceEvidence(rootDir: string): WorkflowModulePresenceEvidence {
  const pathExists = (rel: string) => existsSync(join(rootDir, rel));
  const appJs = readBounded(rootDir, 'public/founder-reality/app.js');
  const html = readBounded(rootDir, 'public/founder-reality/index.html', 48_000);
  return {
    hasCommandCenterBrain: pathExists('src/command-center-brain/index.ts'),
    hasRequirementExtractor: pathExists('src/requirement-extractor/index.ts'),
    hasCapabilityPlanning: pathExists('src/capability-planning-engine/index.ts'),
    hasBuildPackageGenerator: pathExists('src/build-package-generator/index.ts'),
    hasBuildTaskRuntime: pathExists('src/build-task-runtime/index.ts'),
    hasFounderRealityUi: pathExists('public/founder-reality/app.js'),
    hasIdeaCaptureSignals: appJs.includes('askBrain') && html.includes('chat-input'),
    hasAutonomousBuilderReality: pathExists('src/autonomous-builder-reality/index.ts'),
    hasLivePreviewReality: pathExists('src/live-preview-reality/index.ts'),
    hasVerificationReality: pathExists('src/verification-reality/index.ts'),
    hasControlledBuilderExecutionEngine: pathExists('src/controlled-builder-execution-engine/index.ts'),
    hasMobileRuntimeExperienceReality: pathExists('src/mobile-runtime-experience-reality/index.ts'),
    hasRealFileWorkspaceExecution: pathExists('src/real-file-workspace-execution/index.ts'),
  };
}

function buildLeafPreviewInput(): LivePreviewRealityInput {
  return {
    uiSurfacePresent: true,
    connected: false,
    previewUrl: null,
    activeSession: null,
    sessions: [],
    diagnostics: {
      previewRuntimeActive: false,
      previewSessionCount: 0,
      registeredTargetCount: 0,
      readyPreviewCount: 0,
      blockedPreviewCount: 0,
    },
    latestProjectId: 'proj-leaf',
    projectCount: 1,
    generatedAt: 1,
  };
}

/** Collect scores/signals from 24A.1 / 24A.2 / 24A.3 using leaf inputs only. */
export function collectUpstreamRealityBundle(rootDir: string): UpstreamRealityBundle {
  const builderModule = detectBuilderModuleEvidence(rootDir);
  const builder = assessAutonomousBuilderReality({
    workspace: {
      world2FoundationComplete: true,
      executionConnected: false,
      readiness: 'foundation',
      readinessLabel: 'Foundation complete — isolated workspace execution not fully active',
      livePreviewConnected: false,
    },
    moduleEvidence: builderModule,
  });

  const previewModule = detectPreviewModulePresenceEvidence(rootDir);
  const legacyInput = buildLeafPreviewInput();
  const legacyAssessment = assessLivePreviewReality(legacyInput);
  const preview = assessLivePreviewRealityAuthority({
    workspace: buildPreviewWorkspaceSignalsFromLegacy(legacyInput, false, legacyAssessment),
    moduleEvidence: previewModule,
    legacyInput,
  });

  const verificationModule = detectVerificationModulePresenceEvidence(rootDir);
  const verification = assessVerificationReality({
    workspace: buildVerificationWorkspaceSignalsForValidation(verificationModule),
    moduleEvidence: verificationModule,
  });

  return {
    builderScore: builder.builderRealityScore,
    builderExecutionConnected: false,
    builderStopPoint: builder.analyzers.stopPoint,
    builderPlanning: builder.analyzers.planningReality,
    builderBuildCapability: builder.analyzers.buildCapabilityLevel,
    previewScore: preview.livePreviewRealityScore,
    previewBottleneck: preview.founderBottleneck,
    previewRuntimeLevel: preview.analyzers.runtimeEvidence,
    verificationScore: verification.verificationRealityScore,
    verificationStatus: verification.verificationStatus,
    verificationChainBreak: verification.evidenceChainBreakPoint,
  };
}

function toTruthLabel(stage: FounderWorkflowStageId, status: StageEvidenceLevel, upstream: UpstreamRealityBundle): WorkflowTruthMapLabel {
  if (stage === 'BUILD' && !upstream.builderExecutionConnected) return 'BLOCKED';
  if (stage === 'LAUNCH_READINESS' && status !== 'PROVEN') {
    return status === 'OBSERVED' || status === 'CLAIMED' ? 'PARTIAL' : 'UNAVAILABLE';
  }
  if (status === 'PROVEN') return 'PROVEN';
  if (status === 'OBSERVED' || status === 'CLAIMED') return 'PARTIAL';
  return 'UNPROVEN';
}

function stageLevelRank(status: StageEvidenceLevel): number {
  if (status === 'PROVEN') return 4;
  if (status === 'OBSERVED') return 3;
  if (status === 'CLAIMED') return 2;
  return 1;
}

function evaluateStageStatus(
  stage: FounderWorkflowStageId,
  input: AssessFounderWorkflowRealityInput,
): FounderWorkflowStage {
  const { upstream, workflowModuleEvidence: m } = input;
  let status: StageEvidenceLevel = 'MISSING';
  let detail = 'No evidence';

  switch (stage) {
    case 'IDEA':
      if (m.hasIdeaCaptureSignals && m.hasRequirementExtractor) {
        status = 'PROVEN';
        detail = 'Idea capture via Command Center with requirement extraction modules';
      } else if (m.hasCommandCenterBrain || m.hasFounderRealityUi) {
        status = 'OBSERVED';
        detail = 'Command Center / founder UI present — panel alone is not proof';
      }
      break;
    case 'PLAN':
      if (upstream.builderPlanning === 'PLANNING_AVAILABLE') {
        status = 'PROVEN';
        detail = 'Planning stack modules observed with foundation complete';
      } else if (upstream.builderPlanning === 'PLANNING_PARTIAL') {
        status = 'OBSERVED';
        detail = 'Partial planning capability';
      } else {
        status = 'CLAIMED';
        detail = 'Planning claimed via modules only';
      }
      break;
    case 'ARCHITECTURE':
      if (m.hasBuildPackageGenerator && m.hasCapabilityPlanning) {
        status = 'PROVEN';
        detail = 'Architecture generation modules present';
      } else if (m.hasBuildPackageGenerator || m.hasCapabilityPlanning) {
        status = 'OBSERVED';
        detail = 'Partial architecture stack';
      }
      break;
    case 'TASK_BREAKDOWN':
      if (m.hasBuildTaskRuntime) {
        status = 'PROVEN';
        detail = 'Build task runtime module present';
      } else {
        status = 'OBSERVED';
        detail = 'Task surfaces partial in founder journey';
      }
      break;
    case 'BUILD':
      if (upstream.builderExecutionConnected && upstream.builderBuildCapability === 'BUILD_CAPABILITY_PROVEN') {
        status = 'PROVEN';
        detail = 'Builder execution connected with proven build capability';
      } else if (!upstream.builderExecutionConnected) {
        status = 'MISSING';
        detail = 'executionConnected=false — build blocked (24A.1)';
      } else {
        status = 'OBSERVED';
        detail = 'Build signals without proven execution';
      }
      break;
    case 'RUNTIME':
      if (upstream.previewRuntimeLevel === 'RUNTIME_PROVEN') {
        status = 'PROVEN';
        detail = 'Runtime proven via live preview reality (24A.2)';
      } else if (upstream.previewRuntimeLevel === 'RUNTIME_OBSERVED') {
        status = 'OBSERVED';
        detail = 'Runtime partially observed';
      } else {
        status = 'MISSING';
        detail = 'No proven running application runtime';
      }
      break;
    case 'PREVIEW':
      if (upstream.previewScore >= 70 && upstream.previewBottleneck === 'NONE') {
        status = 'PROVEN';
        detail = 'Preview proven with no founder bottleneck';
      } else if (m.hasLivePreviewReality && upstream.previewScore > 30) {
        status = 'OBSERVED';
        detail = `Preview infrastructure observed — bottleneck ${upstream.previewBottleneck} (24A.2)`;
      } else if (m.hasLivePreviewReality) {
        status = 'CLAIMED';
        detail = 'Preview modules exist — URL/panel ≠ proof';
      }
      break;
    case 'VERIFY':
      if (upstream.verificationStatus === 'VERIFICATION_PROVEN') {
        status = 'PROVEN';
        detail = 'Verification proven tied to execution outcomes (24A.3)';
      } else if (upstream.verificationStatus === 'VERIFICATION_OBSERVED') {
        status = 'OBSERVED';
        detail = 'Verification infrastructure observed — not proven linked to execution';
      } else {
        status = 'CLAIMED';
        detail = 'Validator inventory claimed only';
      }
      break;
    case 'LAUNCH_READINESS':
      if (
        upstream.builderExecutionConnected &&
        upstream.previewRuntimeLevel === 'RUNTIME_PROVEN' &&
        upstream.verificationStatus === 'VERIFICATION_PROVEN'
      ) {
        status = 'PROVEN';
        detail = 'Launch readiness assessable with build, runtime, preview, and verification proof';
      } else if (upstream.verificationStatus === 'VERIFICATION_OBSERVED' && m.hasLivePreviewReality) {
        status = 'OBSERVED';
        detail = 'Partial launch signals without execution proof';
      } else {
        status = 'MISSING';
        detail = 'Launch readiness unavailable without execution evidence';
      }
      break;
    default:
      break;
  }

  return {
    stage,
    status,
    truthLabel: toTruthLabel(stage, status, upstream),
    detail,
  };
}

export function analyzeWorkflowStageReality(input: AssessFounderWorkflowRealityInput): {
  stages: FounderWorkflowStage[];
  stageMatrix: FounderWorkflowMatrixRow[];
} {
  const stages = STAGE_ORDER.map((stage) => evaluateStageStatus(stage, input));
  const stageMatrix: FounderWorkflowMatrixRow[] = stages.map((s) => ({
    stage: s.stage,
    claimed: s.status === 'CLAIMED' ? 'CLAIMED' : s.status === 'MISSING' ? 'NONE' : 'CLAIMED',
    observed: s.status === 'OBSERVED' || s.status === 'PROVEN' ? 'OBSERVED' : 'NONE',
    proven: s.status === 'PROVEN' ? 'PROVEN' : 'NONE',
  }));
  return { stages, stageMatrix };
}

function transitionResult(from: StageEvidenceLevel, to: StageEvidenceLevel): WorkflowTransitionResult {
  if (stageLevelRank(from) >= 3 && stageLevelRank(to) >= 3) return 'PASS';
  if (stageLevelRank(from) >= 2 && stageLevelRank(to) >= 2) return 'PARTIAL';
  return 'FAIL';
}

export function analyzeWorkflowContinuity(input: AssessFounderWorkflowRealityInput): {
  level: WorkflowContinuityLevel;
  breakPoint: FounderWorkflowStageId;
  transitions: WorkflowContinuityTransition[];
} {
  const { stages } = analyzeWorkflowStageReality(input);
  const byStage = new Map(stages.map((s) => [s.stage, s]));
  const transitions: WorkflowContinuityTransition[] = TRANSITIONS.map(([from, to]) => {
    const fromStage = byStage.get(from)!;
    const toStage = byStage.get(to)!;
    const result = transitionResult(fromStage.status, toStage.status);
    return {
      from,
      to,
      result,
      detail: `${fromStage.truthLabel} → ${toStage.truthLabel}`,
    };
  });

  let breakPoint: FounderWorkflowStageId = 'LAUNCH_READINESS';
  for (const t of transitions) {
    if (t.result === 'FAIL') {
      breakPoint = t.from;
      break;
    }
  }

  if (!input.upstream.builderExecutionConnected) {
    breakPoint = 'BUILD';
  } else if (input.upstream.verificationChainBreak !== 'NONE') {
    breakPoint = input.upstream.verificationChainBreak as FounderWorkflowStageId;
  }

  const failCount = transitions.filter((t) => t.result === 'FAIL').length;
  const passCount = transitions.filter((t) => t.result === 'PASS').length;
  let level: WorkflowContinuityLevel = 'CONTINUITY_BROKEN';
  if (failCount === 0 && passCount === transitions.length) level = 'CONTINUITY_PROVEN';
  else if (passCount > 0 || transitions.some((t) => t.result === 'PARTIAL')) level = 'CONTINUITY_PARTIAL';

  return { level, breakPoint, transitions };
}

export function analyzeFounderExperience(input: AssessFounderWorkflowRealityInput): FounderWorkflowAnalyzerResults['founderExperience'] {
  const { stages } = analyzeWorkflowStageReality(input);
  const continuity = analyzeWorkflowContinuity(input);

  let finalReachableStage: FounderWorkflowStageId = 'IDEA';
  for (const s of stages) {
    if (s.status === 'PROVEN' || s.status === 'OBSERVED') finalReachableStage = s.stage;
    if (s.truthLabel === 'BLOCKED') break;
  }

  const firstBlocker = continuity.breakPoint;
  const highestImpactBlocker: FounderWorkflowStageId = !input.upstream.builderExecutionConnected
    ? 'BUILD'
    : continuity.breakPoint;

  let level: FounderExperienceLevel = 'FOUNDER_BLOCKED';
  if (finalReachableStage === 'LAUNCH_READINESS' && stages.find((s) => s.stage === 'LAUNCH_READINESS')?.status === 'PROVEN') {
    level = 'FOUNDER_SUCCESSFUL';
  } else if (finalReachableStage !== 'IDEA' && finalReachableStage !== 'PLAN') {
    level = 'FOUNDER_PARTIAL';
  } else if (stageLevelRank(stages.find((s) => s.stage === 'TASK_BREAKDOWN')?.status ?? 'MISSING') >= 3) {
    level = 'FOUNDER_PARTIAL';
  }

  if (!input.upstream.builderExecutionConnected) {
    level = 'FOUNDER_BLOCKED';
  } else if (level === 'FOUNDER_SUCCESSFUL') {
    level = 'FOUNDER_PARTIAL';
  }

  return { level, firstBlocker, highestImpactBlocker, finalReachableStage };
}

export function analyzeLaunchReadinessReality(input: AssessFounderWorkflowRealityInput): LaunchReadinessRealityLevel {
  const { upstream } = input;

  if (!upstream.builderExecutionConnected) {
    return 'LAUNCH_READINESS_UNAVAILABLE';
  }

  const hasBuild = upstream.builderExecutionConnected;
  const hasRuntime = upstream.previewRuntimeLevel === 'RUNTIME_PROVEN';
  const hasPreview = upstream.previewScore >= 60 && upstream.previewBottleneck !== 'BUILD';
  const hasVerify = upstream.verificationStatus === 'VERIFICATION_PROVEN';

  if (hasBuild && hasRuntime && hasPreview && hasVerify) return 'LAUNCH_READINESS_PROVEN';
  if (hasBuild || hasRuntime || hasPreview || upstream.verificationStatus === 'VERIFICATION_OBSERVED') {
    return 'LAUNCH_READINESS_PARTIAL';
  }
  return 'LAUNCH_READINESS_UNAVAILABLE';
}

export function analyzeFounderBottlenecks(input: AssessFounderWorkflowRealityInput): FounderWorkflowAnalyzerResults['bottlenecks'] {
  const continuity = analyzeWorkflowContinuity(input);
  const { upstream } = input;

  let primary: FounderWorkflowStageId = continuity.breakPoint;
  if (!upstream.builderExecutionConnected) primary = 'BUILD';

  let secondary: FounderWorkflowStageId = 'RUNTIME';
  if (primary === 'BUILD') secondary = 'RUNTIME';
  else if (primary === 'RUNTIME') secondary = 'PREVIEW';
  else secondary = 'VERIFY';

  let future: FounderWorkflowStageId = 'VERIFY';
  if (primary === 'BUILD') future = 'VERIFY';
  else if (primary === 'RUNTIME') future = 'LAUNCH_READINESS';
  else future = 'LAUNCH_READINESS';

  if (upstream.previewBottleneck === 'BUILD') {
    secondary = 'RUNTIME';
    future = 'VERIFY';
  }

  return {
    primary,
    secondary,
    future,
    continuityBreakPoint: continuity.breakPoint,
  };
}

export function runAllFounderWorkflowRealityAnalyzers(
  input: AssessFounderWorkflowRealityInput,
): FounderWorkflowAnalyzerResults {
  const { stages, stageMatrix } = analyzeWorkflowStageReality(input);
  const continuity = analyzeWorkflowContinuity(input);
  const founderExperience = analyzeFounderExperience(input);
  const launchReadiness = analyzeLaunchReadinessReality(input);
  const bottlenecks = analyzeFounderBottlenecks(input);

  return {
    stages,
    stageMatrix,
    continuity: continuity.level,
    continuityBreakPoint: continuity.breakPoint,
    continuityTransitions: continuity.transitions,
    founderExperience,
    launchReadiness,
    bottlenecks,
  };
}

export function collectFounderWorkflowEvidence(input: AssessFounderWorkflowRealityInput): FounderWorkflowEvidence[] {
  const { upstream, workflowModuleEvidence: m } = input;
  const evidence: FounderWorkflowEvidence[] = [];
  let counter = 0;
  const push = (level: FounderWorkflowEvidence['level'], description: string, source: string) => {
    counter += 1;
    evidence.push({ id: `workflow-evidence-${counter}`, level, description, source });
  };

  push('OBSERVED', `24A.1 builder score ${upstream.builderScore}/100 executionConnected=${upstream.builderExecutionConnected}`, 'autonomous-builder-reality');
  push('OBSERVED', `24A.2 preview score ${upstream.previewScore}/100 bottleneck=${upstream.previewBottleneck}`, 'live-preview-reality');
  push('OBSERVED', `24A.3 verification score ${upstream.verificationScore}/100 status=${upstream.verificationStatus}`, 'verification-reality');
  if (m.hasIdeaCaptureSignals) push('PROVEN', 'Idea capture signals in Command Center shell', 'founder-reality-ui');
  if (m.hasBuildTaskRuntime) push('OBSERVED', 'Task breakdown runtime module present', 'build-task-runtime');
  if (!upstream.builderExecutionConnected) {
    push('OBSERVED', 'Build stage blocked — executionConnected=false (24A.1)', 'autonomous-builder-reality');
  }
  if (m.hasControlledBuilderExecutionEngine) {
    push('OBSERVED', 'Controlled builder execution engine present (Phase 24C)', 'controlled-builder-execution-engine');
  }
  if (getBuilderExecutionSessionCount() > 0) {
    push('OBSERVED', 'Execution session exists in controlled builder engine', 'controlled-builder-execution-engine');
  }
  if (listControlledExecutionEvidence().some((e) => e.evidenceType === 'SESSION_COMPLETED')) {
    push('OBSERVED', 'Controlled execution evidence produced — session completed', 'controlled-builder-execution-engine');
  }
  if (m.hasMobileRuntimeExperienceReality) {
    push('OBSERVED', 'Mobile Runtime Experience Reality authority present (Phase 24C.5)', 'mobile-runtime-experience-reality');
  }
  if (m.hasRealFileWorkspaceExecution) {
    push('OBSERVED', 'Real file workspace execution present (Phase 24D)', 'real-file-workspace-execution');
  }
  if (getRealFileWorkspaceExecutionSessionCount() > 0) {
    push('OBSERVED', 'Real file workspace execution session exists', 'real-file-workspace-execution');
  }
  if (listRealFileExecutionEvidence().some((e) => e.evidenceType === 'FILE_CREATED')) {
    push('OBSERVED', 'Real isolated workspace file evidence produced', 'real-file-workspace-execution');
  }
  if (m.hasFounderRealityUi) {
    push('CLAIMED', 'Founder UI surface exists — panel presence is not proof', 'founder-reality-ui');
  }

  return evidence;
}

export function resolveLastProvenStage(stages: FounderWorkflowStage[]): FounderWorkflowStageId {
  let last: FounderWorkflowStageId = 'IDEA';
  for (const s of stages) {
    if (s.status === 'PROVEN') last = s.stage;
    if (s.truthLabel === 'BLOCKED') break;
  }
  return last;
}
