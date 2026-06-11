/**
 * Execution Proof API — read-only aggregation of 24A reality authorities.
 * No workspace snapshot, brain, validators, builds, or previews.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessFounderWorkflowReality } from '../src/end-to-end-founder-workflow-reality/index.js';
import type { FounderWorkflowStageId } from '../src/end-to-end-founder-workflow-reality/index.js';
import {
  getBuilderExecutionFoundationSummary,
  getBuilderExecutionWorkspaceCount,
  prepareBuilderExecutionFoundation,
  type BuilderExecutionFoundationSummary,
} from '../src/autonomous-builder-execution-foundation/index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = join(__dirname, '..');

export const EXECUTION_PROOF_DASHBOARD_PASS_TOKEN = 'EXECUTION_PROOF_DASHBOARD_PASS';
export const EXECUTION_PROOF_OWNER_MODULE = 'aidevengine_execution_proof_dashboard';

const STAGE_DISPLAY: Record<FounderWorkflowStageId, string> = {
  IDEA: 'IDEA',
  PLAN: 'PLAN',
  ARCHITECTURE: 'ARCHITECTURE',
  TASK_BREAKDOWN: 'TASKS',
  BUILD: 'BUILD',
  RUNTIME: 'RUNTIME',
  PREVIEW: 'PREVIEW',
  VERIFY: 'VERIFY',
  LAUNCH_READINESS: 'LAUNCH',
};

export interface ExecutionProofTruthMapRow {
  stage: FounderWorkflowStageId;
  display: string;
  label: string;
  detail: string;
}

export interface ExecutionProofContinuityRow {
  from: string;
  to: string;
  result: string;
}

export interface ExecutionProofPayload {
  ownerModule: string;
  scores: {
    builderReality: number;
    livePreviewReality: number;
    verificationReality: number;
    founderWorkflowReality: number;
  };
  workflowTruthMap: ExecutionProofTruthMapRow[];
  workflowContinuity: ExecutionProofContinuityRow[];
  currentBottleneck: string;
  nextRequiredCapability: string;
  lastProvenStage: string;
  launchReadiness: {
    status: string;
    reason: string;
  };
  founderExperience: string;
  evidenceFound: string[];
  missingEvidence: string[];
  founderBlockers: string[];
  founderConclusion: string;
  executionFoundation: BuilderExecutionFoundationSummary;
  copyReportText: string;
}

function launchReadinessReason(
  status: string,
  bottleneck: string,
  executionConnected: boolean,
): string {
  if (status === 'LAUNCH_READINESS_PROVEN') {
    return 'Build, runtime, preview, and verification evidence are linked.';
  }
  if (!executionConnected || bottleneck === 'BUILD') {
    return 'No connected build execution evidence.';
  }
  if (status === 'LAUNCH_READINESS_PARTIAL') {
    return 'Partial launch signals exist without a complete execution proof chain.';
  }
  return 'Launch readiness requires connected build, runtime, preview, and verification proof.';
}

function buildCopyReportText(payload: Omit<ExecutionProofPayload, 'copyReportText'>): string {
  const truthLines = payload.workflowTruthMap
    .map((r) => `${r.display.padEnd(20)} ${r.label}`)
    .join('\n');
  const continuityLines = payload.workflowContinuity
    .map((r) => `${r.from} → ${r.to}`.padEnd(28) + r.result)
    .join('\n');

  return `# Execution Proof Report

Current execution truth for AiDevEngine (read-only 24A authorities).

## Reality Scores

- Autonomous Builder Reality: ${payload.scores.builderReality}/100
- Live Preview Reality: ${payload.scores.livePreviewReality}/100
- Verification Reality: ${payload.scores.verificationReality}/100
- End-to-End Founder Workflow Reality: ${payload.scores.founderWorkflowReality}/100

## Founder Workflow Truth Map

${truthLines}

## Workflow Continuity

${continuityLines}

## Bottleneck

Current Bottleneck: ${payload.currentBottleneck}
Next Required Capability: ${payload.nextRequiredCapability}
Last Proven Stage: ${payload.lastProvenStage}

## Launch Readiness

${payload.launchReadiness.status}
Reason: ${payload.launchReadiness.reason}

## Evidence Found

${payload.evidenceFound.map((e) => `- ${e}`).join('\n') || '- None'}

## Missing Evidence

${payload.missingEvidence.map((e) => `- ${e}`).join('\n') || '- None'}

## Founder Blockers

${payload.founderBlockers.map((e, i) => `${i + 1}. ${e}`).join('\n') || '- None'}

## Founder Conclusion

${payload.founderConclusion}

## Execution Foundation (24B)

Execution Workspace: ${payload.executionFoundation.workspace.label}
Execution Queue: ${payload.executionFoundation.queue.label}
Execution Evidence: ${payload.executionFoundation.evidence.label}
Execution Plans: ${payload.executionFoundation.plan.label}

${payload.executionFoundation.founderConclusion}

---
Reality only — not a pass token or marketing score.`;
}

function ensureExecutionFoundationSeed(): void {
  if (getBuilderExecutionWorkspaceCount() > 0) return;
  prepareBuilderExecutionFoundation({
    projectId: 'proj-foundation-demo',
    sourceProject: 'World 2 isolated target app',
    requirements: ['Capture founder requirements', 'Install dependencies when needed'],
    architecture: ['src/generated/output.ts', 'src/components/App.tsx'],
    tasks: [
      { taskId: 'task-1', title: 'Generate application shell', actionType: 'GENERATE_SCREEN' },
      { taskId: 'task-2', title: 'Generate API scaffold', actionType: 'GENERATE_API' },
      { taskId: 'task-3', title: 'Create configuration files', actionType: 'UPDATE_CONFIGURATION' },
    ],
  });
}

export function buildExecutionProofPayload(rootDir = ROOT_DIR): ExecutionProofPayload {
  ensureExecutionFoundationSeed();
  const assessment = assessFounderWorkflowReality(rootDir);
  const executionFoundation = getBuilderExecutionFoundationSummary();

  const workflowTruthMap = assessment.analyzers.stages.map((s) => ({
    stage: s.stage,
    display: STAGE_DISPLAY[s.stage],
    label: s.truthLabel,
    detail: s.detail,
  }));

  const workflowContinuity = assessment.analyzers.continuityTransitions.map((t) => ({
    from: STAGE_DISPLAY[t.from],
    to: STAGE_DISPLAY[t.to],
    result: t.result,
  }));

  const launchReadiness = {
    status: assessment.launchReadinessStatus,
    reason: launchReadinessReason(
      assessment.launchReadinessStatus,
      assessment.currentBottleneck,
      assessment.upstream.builderExecutionConnected,
    ),
  };

  const foundationEvidence = executionFoundation.realityEvidenceLines.slice(0, 4);
  const mergedEvidenceFound = [...assessment.evidenceFound.slice(0, 6), ...foundationEvidence].slice(0, 10);

  const base = {
    ownerModule: EXECUTION_PROOF_OWNER_MODULE,
    scores: {
      builderReality: assessment.upstream.builderScore,
      livePreviewReality: assessment.upstream.previewScore,
      verificationReality: assessment.upstream.verificationScore,
      founderWorkflowReality: assessment.founderWorkflowRealityScore,
    },
    workflowTruthMap,
    workflowContinuity,
    currentBottleneck: assessment.currentBottleneck,
    nextRequiredCapability: assessment.nextRequiredCapability,
    lastProvenStage: assessment.lastProvenStage,
    launchReadiness,
    founderExperience: assessment.analyzers.founderExperience.level,
    evidenceFound: mergedEvidenceFound,
    missingEvidence: assessment.missingEvidence.slice(0, 8),
    founderBlockers: assessment.founderBlockers.slice(0, 6),
    founderConclusion: assessment.founderConclusion,
    executionFoundation,
  };

  return {
    ...base,
    copyReportText: buildCopyReportText(base),
  };
}

export function sendExecutionProofJson(res: import('node:http').ServerResponse, rootDir = ROOT_DIR): void {
  const payload = buildExecutionProofPayload(rootDir);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-DevPulse-Surface': 'execution-proof',
    'X-DevPulse-Phase': '24B',
  });
  res.end(JSON.stringify(payload));
}
