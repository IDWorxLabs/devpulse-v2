/**
 * End-to-End Founder Workflow Reality — unified authority (read-only).
 * No execution, preview launch, builder activation, or validator runs.
 *
 * Reality rules (never proof): Menu item, panel, route, URL, roadmap, future phase,
 * authority module exists, report exists.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  END_TO_END_FOUNDER_WORKFLOW_REALITY_OWNER_MODULE,
  MAX_WORKFLOW_BLOCKERS,
  MAX_WORKFLOW_EVIDENCE,
} from './end-to-end-founder-workflow-reality-bounds.js';
import {
  collectFounderWorkflowEvidence,
  collectUpstreamRealityBundle,
  detectWorkflowModulePresenceEvidence,
  resolveLastProvenStage,
  runAllFounderWorkflowRealityAnalyzers,
} from './end-to-end-founder-workflow-reality-analyzers.js';
import { buildUpstreamBundleFromChainTruth } from '../founder-test-integration/execution-proof-authority-sync.js';
import type { ConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import { recordFounderWorkflowHistory } from './end-to-end-founder-workflow-reality-history.js';
import { storeFounderWorkflowRegistryEntry } from './end-to-end-founder-workflow-reality-registry.js';
import type {
  AssessFounderWorkflowRealityInput,
  FounderWorkflowBlocker,
  FounderWorkflowRealityAssessment,
  FounderWorkflowReport,
  FounderWorkflowSubscores,
} from './end-to-end-founder-workflow-reality-types.js';
import type { FounderWorkflowStageId } from './end-to-end-founder-workflow-reality-analyzer-types.js';

export { END_TO_END_FOUNDER_WORKFLOW_REALITY_OWNER_MODULE };

let assessmentCounter = 0;

export function resetFounderWorkflowRealityCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `founder-workflow-reality-${assessmentCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreFromStageStatus(status: string, proven: number, observed: number, claimed: number, missing: number): number {
  if (status === 'PROVEN') return proven;
  if (status === 'OBSERVED') return observed;
  if (status === 'CLAIMED') return claimed;
  return missing;
}

function computeSubscores(input: AssessFounderWorkflowRealityInput): FounderWorkflowSubscores {
  const analyzers = runAllFounderWorkflowRealityAnalyzers(input);
  const byStage = new Map(analyzers.stages.map((s) => [s.stage, s.status]));

  const build =
    !input.upstream.builderExecutionConnected && !input.executionChainTruth?.buildProven
      ? 12
      : scoreFromStageStatus(byStage.get('BUILD') ?? 'MISSING', 88, 42, 18, 8);

  let runtime = scoreFromStageStatus(byStage.get('RUNTIME') ?? 'MISSING', 86, 38, 12, 6);
  let preview = scoreFromStageStatus(byStage.get('PREVIEW') ?? 'MISSING', 84, 44, 16, 8);
  let verification = scoreFromStageStatus(byStage.get('VERIFY') ?? 'MISSING', 82, 40, 14, 6);
  let launchReadiness = scoreFromStageStatus(byStage.get('LAUNCH_READINESS') ?? 'MISSING', 90, 36, 10, 4);

  runtime = Math.min(runtime, build + 8);
  preview = Math.min(preview, runtime + 8);
  verification = Math.min(verification, preview + 8);
  launchReadiness = Math.min(launchReadiness, verification + 8);

  return {
    ideaCapture: scoreFromStageStatus(byStage.get('IDEA') ?? 'MISSING', 90, 72, 24, 8),
    planning: scoreFromStageStatus(byStage.get('PLAN') ?? 'MISSING', 85, 62, 28, 10),
    architecture: scoreFromStageStatus(byStage.get('ARCHITECTURE') ?? 'MISSING', 82, 58, 26, 10),
    taskBreakdown: scoreFromStageStatus(byStage.get('TASK_BREAKDOWN') ?? 'MISSING', 80, 56, 24, 8),
    build,
    runtime,
    preview,
    verification,
    launchReadiness,
  };
}

function buildBlockers(
  input: AssessFounderWorkflowRealityInput,
  analyzers: ReturnType<typeof runAllFounderWorkflowRealityAnalyzers>,
): FounderWorkflowBlocker[] {
  const blockers: FounderWorkflowBlocker[] = [];
  let rank = 1;

  if (!input.upstream.builderExecutionConnected && !input.executionChainTruth?.buildProven) {
    blockers.push({
      id: `workflow-blocker-${rank}`,
      severity: 'CRITICAL',
      impactRank: rank,
      stage: 'BUILD',
      explanation: 'Autonomous builder execution is not connected — founder cannot complete BUILD → RUNTIME → PREVIEW chain.',
      recommendation: 'Connect builder execution (24A.1) before claiming end-to-end founder workflow.',
    });
    rank += 1;
  }

  if (analyzers.continuity === 'CONTINUITY_BROKEN') {
    blockers.push({
      id: `workflow-blocker-${rank}`,
      severity: 'HIGH',
      impactRank: rank,
      stage: analyzers.continuityBreakPoint,
      explanation: `Workflow continuity broken at ${analyzers.continuityBreakPoint}.`,
      recommendation: `Restore evidence link after ${analyzers.continuityBreakPoint}.`,
    });
    rank += 1;
  }

  if (analyzers.launchReadiness === 'LAUNCH_READINESS_UNAVAILABLE') {
    blockers.push({
      id: `workflow-blocker-${rank}`,
      severity: 'HIGH',
      impactRank: rank,
      stage: 'LAUNCH_READINESS',
      explanation: 'Launch readiness cannot be assessed without build, runtime, preview, and verification execution evidence.',
      recommendation: 'Prove execution-linked build, runtime, preview, and verification before launch readiness.',
    });
    rank += 1;
  }

  if (input.upstream.verificationStatus !== 'VERIFICATION_PROVEN') {
    blockers.push({
      id: `workflow-blocker-${rank}`,
      severity: 'MEDIUM',
      impactRank: rank,
      stage: 'VERIFY',
      explanation: `Verification remains ${input.upstream.verificationStatus} — validator inventory ≠ execution verification.`,
      recommendation: 'Tie verification to runtime and build outcomes (24A.3).',
    });
  }

  return blockers.slice(0, MAX_WORKFLOW_BLOCKERS);
}

function describeNextRequiredCapability(bottleneck: FounderWorkflowStageId): string {
  switch (bottleneck) {
    case 'BUILD':
      return 'Connected autonomous builder execution producing real build output';
    case 'RUNTIME':
      return 'Proven running application runtime with startup and readiness evidence';
    case 'PREVIEW':
      return 'Workspace-linked preview proven usable for founder validation';
    case 'VERIFY':
      return 'Verification proven tied to build, runtime, and preview outcomes';
    case 'LAUNCH_READINESS':
      return 'Continuous evidence chain through launch readiness gates';
    default:
      return 'Restore workflow continuity at the identified break point';
  }
}

function buildFounderConclusion(
  score: number,
  input: AssessFounderWorkflowRealityInput,
  analyzers: ReturnType<typeof runAllFounderWorkflowRealityAnalyzers>,
  lastProvenStage: FounderWorkflowStageId,
): string {
  if (analyzers.founderExperience.level === 'FOUNDER_SUCCESSFUL') {
    return `Yes — a founder can go from idea to launch inside DevPulse today with proven evidence (score ${score}/100).`;
  }

  if (!input.upstream.builderExecutionConnected && !input.executionChainTruth?.buildProven) {
    return `No — a founder cannot go from idea to launch inside DevPulse today. Planning and early workflow stages are proven through ${lastProvenStage}, but BUILD is blocked (executionConnected=false from 24A.1). Live preview and verification infrastructure exist (24A.2/24A.3) but cannot be proven as outcomes of a completed build. Primary bottleneck: BUILD.`;
  }

  if (analyzers.founderExperience.level === 'FOUNDER_PARTIAL') {
    return `Partially — a founder can reach ${analyzers.founderExperience.finalReachableStage} today (score ${score}/100), but the workflow breaks at ${analyzers.continuityBreakPoint} before launch readiness.`;
  }

  return `No — founder workflow reality score ${score}/100. Workflow blocked at ${analyzers.continuityBreakPoint}. Reality only — no roadmap promises.`;
}

export function buildFounderWorkflowRealityReport(
  assessment: Omit<FounderWorkflowRealityAssessment, 'report'> & { report?: never },
): FounderWorkflowReport {
  const truthMap = assessment.analyzers.stages
    .map((s) => `${s.stage.padEnd(20)} ${s.truthLabel}`)
    .join('\n');

  const continuityMap = assessment.analyzers.continuityTransitions
    .map((t) => `${t.from} → ${t.to}`.padEnd(28) + t.result)
    .join('\n');

  const markdown = `# Founder Workflow Reality Report

Generated by End-to-End Founder Workflow Reality Authority (${END_TO_END_FOUNDER_WORKFLOW_REALITY_OWNER_MODULE}).

## Executive Summary

**Founder Workflow Reality Score: ${assessment.founderWorkflowRealityScore}/100**

${assessment.founderWorkflowSummary}

Last proven stage: **${assessment.lastProvenStage}**

Current bottleneck: **${assessment.currentBottleneck}**

Next required capability: **${assessment.nextRequiredCapability}**

Launch readiness: **${assessment.launchReadinessStatus}**

Upstream: 24A.1 builder ${assessment.upstream.builderScore}/100 | 24A.2 preview ${assessment.upstream.previewScore}/100 | 24A.3 verification ${assessment.upstream.verificationScore}/100

## Founder Workflow Truth Map

\`\`\`text
${truthMap}
\`\`\`

## Workflow Continuity Map

\`\`\`text
${continuityMap}
\`\`\`

Continuity: **${assessment.analyzers.continuity}** | Break point: **${assessment.analyzers.continuityBreakPoint}**

## Evidence Found

${assessment.evidenceFound.map((e) => `- ${e}`).join('\n') || '- None'}

## Missing Evidence

${assessment.missingEvidence.map((e) => `- ${e}`).join('\n') || '- None'}

## Founder Blockers

${assessment.founderBlockers.map((b, i) => `${i + 1}. ${b}`).join('\n') || 'None ranked'}

## Founder Conclusion

${assessment.founderConclusion}

> Can a founder go from idea to launch inside DevPulse today?

${assessment.founderConclusion}

---

*Reality only — menu/panel/route/URL/roadmap/authority module/report ≠ proof. No future-state scoring.*
`;

  return {
    executiveSummary: assessment.founderWorkflowSummary,
    founderWorkflowTruthMap: truthMap,
    workflowContinuityMap: continuityMap,
    evidenceFound: assessment.evidenceFound,
    missingEvidence: assessment.missingEvidence,
    founderBlockers: assessment.founderBlockers,
    founderConclusion: assessment.founderConclusion,
    lastProvenStage: assessment.lastProvenStage,
    currentBottleneck: assessment.currentBottleneck,
    nextRequiredCapability: assessment.nextRequiredCapability,
    launchReadinessStatus: assessment.launchReadinessStatus,
    markdown,
  };
}

export function assessFounderWorkflowReality(
  rootDir: string,
  options?: {
    builderExecutionConnected?: boolean;
    executionChainTruth?: ConnectedExecutionChainTruth;
  },
): FounderWorkflowRealityAssessment {
  const upstream =
    options?.executionChainTruth != null
      ? buildUpstreamBundleFromChainTruth(rootDir, options.executionChainTruth)
      : collectUpstreamRealityBundle(rootDir, options?.builderExecutionConnected ?? false);
  const workflowModuleEvidence = detectWorkflowModulePresenceEvidence(rootDir);
  const input: AssessFounderWorkflowRealityInput = {
    rootDir,
    upstream,
    workflowModuleEvidence,
    executionChainTruth: options?.executionChainTruth,
  };
  const analyzers = runAllFounderWorkflowRealityAnalyzers(input);
  const portfolio = computeSubscores(input);
  const evidence = collectFounderWorkflowEvidence(input).slice(0, MAX_WORKFLOW_EVIDENCE);
  const blockers = buildBlockers(input, analyzers);
  const lastProvenStage = resolveLastProvenStage(analyzers.stages);
  const currentBottleneck = analyzers.bottlenecks.primary;
  const nextRequiredCapability = describeNextRequiredCapability(currentBottleneck);
  const launchReadinessStatus = analyzers.launchReadiness;

  let founderWorkflowRealityScore = clamp(
    portfolio.ideaCapture * 0.1 +
      portfolio.planning * 0.1 +
      portfolio.architecture * 0.08 +
      portfolio.taskBreakdown * 0.08 +
      portfolio.build * 0.16 +
      portfolio.runtime * 0.14 +
      portfolio.preview * 0.12 +
      portfolio.verification * 0.12 +
      portfolio.launchReadiness * 0.1,
  );

  if (!upstream.builderExecutionConnected && !input.executionChainTruth?.buildProven) {
    founderWorkflowRealityScore = Math.min(founderWorkflowRealityScore, 46);
  }
  founderWorkflowRealityScore = Math.min(founderWorkflowRealityScore, portfolio.build + 18);
  founderWorkflowRealityScore = Math.min(founderWorkflowRealityScore, portfolio.runtime + 14);
  founderWorkflowRealityScore = Math.min(founderWorkflowRealityScore, portfolio.preview + 12);
  founderWorkflowRealityScore = Math.min(founderWorkflowRealityScore, portfolio.verification + 10);
  founderWorkflowRealityScore = Math.min(founderWorkflowRealityScore, portfolio.launchReadiness + 8);

  const evidenceFound = evidence
    .filter((e) => e.level === 'OBSERVED' || e.level === 'PROVEN')
    .map((e) => `[${e.level}] ${e.description} (${e.source})`);

  const missingEvidence = [
    !upstream.builderExecutionConnected && !input.executionChainTruth?.buildProven
      ? 'Connected builder execution (24A.1 executionConnected=false)'
      : '',
    upstream.previewRuntimeLevel !== 'RUNTIME_PROVEN' && !input.executionChainTruth?.runtimeProven
      ? 'Proven running application runtime (24A.2)'
      : '',
    upstream.verificationStatus !== 'VERIFICATION_PROVEN' && !input.executionChainTruth?.verificationProven
      ? 'Verification proven tied to execution outcomes (24A.3)'
      : '',
    launchReadinessStatus !== 'LAUNCH_READINESS_PROVEN'
      ? 'Launch readiness with build + runtime + preview + verification proof'
      : '',
    analyzers.continuity !== 'CONTINUITY_PROVEN'
      ? `Continuous workflow evidence through ${analyzers.continuityBreakPoint} → launch`
      : '',
  ].filter(Boolean);

  const founderBlockers = blockers
    .sort((a, b) => a.impactRank - b.impactRank)
    .map((b) => `[${b.severity}] ${b.stage}: ${b.explanation}`);

  const founderConclusion = buildFounderConclusion(
    founderWorkflowRealityScore,
    input,
    analyzers,
    lastProvenStage,
  );

  const founderWorkflowSummary = `Founder workflow ${founderWorkflowRealityScore}/100 — last proven ${lastProvenStage}; bottleneck ${currentBottleneck}; experience ${analyzers.founderExperience.level}.`;

  const assessmentId = nextAssessmentId();
  const assessedAt = Date.now();

  const base = {
    assessmentId,
    founderWorkflowRealityScore,
    portfolioSubscores: portfolio,
    analyzers,
    evidence,
    blockers,
    evidenceFound,
    missingEvidence,
    founderBlockers,
    founderConclusion,
    lastProvenStage,
    currentBottleneck,
    nextRequiredCapability,
    launchReadinessStatus,
    founderWorkflowSummary,
    upstream,
    assessedAt,
  };

  const report = buildFounderWorkflowRealityReport({ ...base, report: undefined as never });

  storeFounderWorkflowRegistryEntry({
    assessmentId,
    founderWorkflowRealityScore,
    currentBottleneck,
    lastProvenStage,
    assessedAt,
  });

  recordFounderWorkflowHistory({
    assessmentId,
    founderWorkflowRealityScore,
    summary: founderWorkflowSummary,
  });

  return { ...base, report };
}

export function writeFounderWorkflowRealityReportFile(
  assessment: FounderWorkflowRealityAssessment,
  rootDir: string,
): string {
  const reportPath = join(rootDir, 'architecture', 'FOUNDER_WORKFLOW_REALITY_REPORT.md');
  writeFileSync(reportPath, assessment.report.markdown, 'utf8');
  return reportPath;
}
