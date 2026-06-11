/**
 * Live Preview Reality — unified evidence authority (Phase 24A.2).
 * Read-only analysis. No preview execution, deployment, or runtime mutation.
 *
 * Reality rules (never proof): Route exists, URL exists, panel exists, menu item, HTML page, roadmap.
 * May count as evidence: runtime/startup/readiness signals, execution outcomes, workspace-linked preview.
 * Required for proof: execution + runtime + availability + builder linkage evidence.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  LIVE_PREVIEW_REALITY_OWNER_MODULE,
  MAX_PREVIEW_BLOCKERS,
  MAX_PREVIEW_EVIDENCE,
} from './live-preview-reality-bounds.js';
import {
  collectLivePreviewEvidence,
  runAllLivePreviewRealityAnalyzers,
} from './live-preview-reality-analyzers.js';
import { recordLivePreviewHistory } from './live-preview-reality-history.js';
import { storeLivePreviewRegistryEntry } from './live-preview-reality-registry.js';
import { assessLivePreviewReality } from './live-preview-reality-authority.js';
import type {
  AssessLivePreviewRealityAuthorityInput,
  FounderRealityBottleneck,
  LivePreviewBlocker,
  LivePreviewRealityAuthorityAssessment,
  LivePreviewRealitySubscores,
  LivePreviewReport,
  LivePreviewStage,
  PreviewRealityMatrixRow,
} from './live-preview-reality-types.js';

export { LIVE_PREVIEW_REALITY_OWNER_MODULE };

let assessmentCounter = 0;

export function resetLivePreviewRealityAuthorityCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `preview-reality-${assessmentCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreInfrastructure(input: AssessLivePreviewRealityAuthorityInput): number {
  const level = runAllLivePreviewRealityAnalyzers(input).previewInfrastructure;
  if (level === 'PREVIEW_INFRASTRUCTURE_PRESENT') return 78;
  if (level === 'PREVIEW_INFRASTRUCTURE_PARTIAL') return 52;
  return 14;
}

function scoreRuntime(input: AssessLivePreviewRealityAuthorityInput): number {
  const level = runAllLivePreviewRealityAnalyzers(input).runtimeEvidence;
  if (level === 'RUNTIME_PROVEN') return 86;
  if (level === 'RUNTIME_OBSERVED') return 38;
  return 10;
}

function scoreConnectivity(input: AssessLivePreviewRealityAuthorityInput): number {
  const level = runAllLivePreviewRealityAnalyzers(input).previewConnectivity;
  if (level === 'PREVIEW_CONNECTED') return 82;
  if (level === 'PREVIEW_PARTIAL') return 34;
  return 8;
}

function scoreUsability(input: AssessLivePreviewRealityAuthorityInput): number {
  const level = runAllLivePreviewRealityAnalyzers(input).previewUsability;
  if (level === 'PREVIEW_USABLE') return 88;
  if (level === 'PREVIEW_LIMITED') return 42;
  return 12;
}

function scoreBuilderIntegration(input: AssessLivePreviewRealityAuthorityInput): number {
  const level = runAllLivePreviewRealityAnalyzers(input).buildToPreview;
  if (level === 'BUILD_TO_PREVIEW_PROVEN') return 85;
  if (level === 'BUILD_TO_PREVIEW_PARTIAL') return 36;
  return 11;
}

function computeSubscores(input: AssessLivePreviewRealityAuthorityInput): LivePreviewRealitySubscores {
  return {
    infrastructure: scoreInfrastructure(input),
    runtime: scoreRuntime(input),
    connectivity: scoreConnectivity(input),
    usability: scoreUsability(input),
    builderIntegration: scoreBuilderIntegration(input),
  };
}

function buildPreviewRealityMatrix(
  input: AssessLivePreviewRealityAuthorityInput,
  analyzers: ReturnType<typeof runAllLivePreviewRealityAnalyzers>,
): PreviewRealityMatrixRow[] {
  const { workspace, moduleEvidence } = input;
  return [
    {
      area: 'Preview Infrastructure',
      claimed: moduleEvidence.hasLivePreviewRuntime ? 'CLAIMED' : 'NONE',
      observed:
        analyzers.previewInfrastructure !== 'PREVIEW_INFRASTRUCTURE_MISSING' ? 'OBSERVED' : 'NONE',
      proven: 'NONE',
    },
    {
      area: 'Runtime Availability',
      claimed: workspace.previewRuntimeActive || Boolean(workspace.previewUrl) ? 'CLAIMED' : 'NONE',
      observed: analyzers.runtimeEvidence !== 'RUNTIME_CLAIMED' ? 'OBSERVED' : 'NONE',
      proven: analyzers.runtimeEvidence === 'RUNTIME_PROVEN' ? 'PROVEN' : 'NONE',
    },
    {
      area: 'Preview Connectivity',
      claimed: Boolean(workspace.previewUrl) ? 'CLAIMED' : 'NONE',
      observed:
        analyzers.previewConnectivity !== 'PREVIEW_DISCONNECTED' ? 'OBSERVED' : 'NONE',
      proven: analyzers.previewConnectivity === 'PREVIEW_CONNECTED' ? 'PROVEN' : 'NONE',
    },
    {
      area: 'Preview Usability',
      claimed: input.legacyInput.uiSurfacePresent ? 'CLAIMED' : 'NONE',
      observed: analyzers.previewUsability !== 'PREVIEW_UNPROVEN' ? 'OBSERVED' : 'NONE',
      proven: analyzers.previewUsability === 'PREVIEW_USABLE' ? 'PROVEN' : 'NONE',
    },
    {
      area: 'Builder Integration',
      claimed: moduleEvidence.hasLivePreviewRuntime ? 'CLAIMED' : 'NONE',
      observed: analyzers.buildToPreview !== 'BUILD_TO_PREVIEW_MISSING' ? 'OBSERVED' : 'NONE',
      proven: analyzers.buildToPreview === 'BUILD_TO_PREVIEW_PROVEN' ? 'PROVEN' : 'NONE',
    },
  ];
}

function buildStages(analyzers: ReturnType<typeof runAllLivePreviewRealityAnalyzers>): LivePreviewStage[] {
  const infraStatus =
    analyzers.previewInfrastructure === 'PREVIEW_INFRASTRUCTURE_PRESENT'
      ? 'COMPLETE'
      : analyzers.previewInfrastructure === 'PREVIEW_INFRASTRUCTURE_PARTIAL'
        ? 'PARTIAL'
        : 'NOT_STARTED';
  const runtimeStatus =
    analyzers.runtimeEvidence === 'RUNTIME_PROVEN'
      ? 'COMPLETE'
      : analyzers.runtimeEvidence === 'RUNTIME_OBSERVED'
        ? 'PARTIAL'
        : 'BLOCKED';
  const connectivityStatus =
    analyzers.previewConnectivity === 'PREVIEW_CONNECTED'
      ? 'COMPLETE'
      : analyzers.previewConnectivity === 'PREVIEW_PARTIAL'
        ? 'PARTIAL'
        : 'BLOCKED';
  const usabilityStatus =
    analyzers.previewUsability === 'PREVIEW_USABLE'
      ? 'COMPLETE'
      : analyzers.previewUsability === 'PREVIEW_LIMITED'
        ? 'PARTIAL'
        : 'NOT_STARTED';
  const builderStatus =
    analyzers.buildToPreview === 'BUILD_TO_PREVIEW_PROVEN'
      ? 'COMPLETE'
      : analyzers.buildToPreview === 'BUILD_TO_PREVIEW_PARTIAL'
        ? 'PARTIAL'
        : 'BLOCKED';

  return [
    { stage: 'INFRASTRUCTURE', status: infraStatus, detail: analyzers.previewInfrastructure },
    { stage: 'RUNTIME', status: runtimeStatus, detail: analyzers.runtimeEvidence },
    { stage: 'CONNECTIVITY', status: connectivityStatus, detail: analyzers.previewConnectivity },
    { stage: 'USABILITY', status: usabilityStatus, detail: analyzers.previewUsability },
    { stage: 'BUILDER_LINK', status: builderStatus, detail: analyzers.buildToPreview },
  ];
}

function buildBlockers(
  input: AssessLivePreviewRealityAuthorityInput,
  analyzers: ReturnType<typeof runAllLivePreviewRealityAnalyzers>,
): LivePreviewBlocker[] {
  const blockers: LivePreviewBlocker[] = [];
  let rank = 1;

  if (!input.workspace.executionConnected) {
    blockers.push({
      id: `preview-blocker-${rank}`,
      severity: 'CRITICAL',
      impactRank: rank,
      explanation: 'Autonomous builder execution is not connected — preview cannot be proven as output of a completed build.',
      recommendation: 'Resolve BUILD bottleneck (24A.1) before expecting proven preview runtime.',
    });
    rank += 1;
  }

  if (analyzers.runtimeEvidence !== 'RUNTIME_PROVEN') {
    blockers.push({
      id: `preview-blocker-${rank}`,
      severity: 'HIGH',
      impactRank: rank,
      explanation: 'No proven running application — runtime signals are claimed or partially observed only.',
      recommendation: 'Collect startup, readiness, and availability evidence tied to active preview sessions.',
    });
    rank += 1;
  }

  if (analyzers.previewConnectivity === 'PREVIEW_PARTIAL' && Boolean(input.workspace.previewUrl)) {
    blockers.push({
      id: `preview-blocker-${rank}`,
      severity: 'HIGH',
      impactRank: rank,
      explanation: 'Preview URL or route exists without workspace-linked, reachable runtime proof.',
      recommendation: 'Prove preview connectivity with ready session, project match, and load evidence — not URL alone.',
    });
    rank += 1;
  }

  if (analyzers.previewUsability !== 'PREVIEW_USABLE') {
    blockers.push({
      id: `preview-blocker-${rank}`,
      severity: 'MEDIUM',
      impactRank: rank,
      explanation: 'Preview is not proven usable for founder validation (visible, interactive, current).',
      recommendation: 'Reach PREVIEW_READY with load and interactivity evidence before claiming usability.',
    });
    rank += 1;
  }

  if (analyzers.buildToPreview === 'BUILD_TO_PREVIEW_MISSING') {
    blockers.push({
      id: `preview-blocker-${rank}`,
      severity: 'MEDIUM',
      impactRank: rank,
      explanation: 'Builder output → preview runtime linkage is missing or unproven.',
      recommendation: 'Tie preview sessions to build artifacts and execution outcomes from the autonomous builder.',
    });
  }

  return blockers.slice(0, MAX_PREVIEW_BLOCKERS);
}

function resolveFounderBottleneck(
  input: AssessLivePreviewRealityAuthorityInput,
  analyzers: ReturnType<typeof runAllLivePreviewRealityAnalyzers>,
): FounderRealityBottleneck {
  if (!input.workspace.executionConnected) return 'BUILD';
  if (analyzers.runtimeEvidence !== 'RUNTIME_PROVEN' || analyzers.previewUsability !== 'PREVIEW_USABLE') {
    return 'PREVIEW';
  }
  return 'NONE';
}

function buildFounderConclusion(
  score: number,
  bottleneck: FounderRealityBottleneck,
  analyzers: ReturnType<typeof runAllLivePreviewRealityAnalyzers>,
  input: AssessLivePreviewRealityAuthorityInput,
): string {
  if (analyzers.runtimeEvidence === 'RUNTIME_PROVEN' && analyzers.previewUsability === 'PREVIEW_USABLE') {
    return `Yes — observable evidence shows a built application running in preview (score ${score}/100). Runtime is proven with validation-ready load and interactivity signals.`;
  }

  if (bottleneck === 'BUILD') {
    return `Not today for proven running applications. Preview infrastructure exists (score ${score}/100), but builder execution is not connected (executionConnected=false). DevPulse cannot prove that built output reaches a running preview — the founder-reality bottleneck remains BUILD, not PREVIEW.`;
  }

  if (bottleneck === 'PREVIEW') {
    return `Partially — preview modules and signals are observed (score ${score}/100), but DevPulse cannot yet prove that applications are actually running. Runtime: ${analyzers.runtimeEvidence}; usability: ${analyzers.previewUsability}. The bottleneck has moved to PREVIEW.`;
  }

  return `No — live preview reality score ${score}/100 with insufficient execution, runtime, and availability evidence. URL or UI surface presence does not prove a running application.`;
}

export function buildLivePreviewRealityReport(
  assessment: Omit<LivePreviewRealityAuthorityAssessment, 'report'> & { report?: never },
): LivePreviewReport {
  const matrixTable = assessment.previewRealityMatrix
    .map((r) => `| ${r.area} | ${r.claimed} | ${r.observed} | ${r.proven} |`)
    .join('\n');

  const markdown = `# Live Preview Reality Report

Generated by Live Preview Reality Authority (${LIVE_PREVIEW_REALITY_OWNER_MODULE}).

## Executive Summary

**Live Preview Reality Score: ${assessment.livePreviewRealityScore}/100**

${assessment.livePreviewRealitySummary}

Founder bottleneck: **${assessment.founderBottleneck}**

Legacy preview state: **${assessment.legacyAssessment.state}**

## Preview Reality Matrix

| Area | Claimed | Observed | Proven |
| ---- | ------- | -------- | ------ |
${matrixTable}

## Evidence Found

${assessment.evidenceFound.map((e) => `- ${e}`).join('\n') || '- None'}

## Missing Evidence

${assessment.missingEvidence.map((e) => `- ${e}`).join('\n') || '- None'}

## Preview Blockers

${assessment.previewBlockers.map((b, i) => `${i + 1}. ${b}`).join('\n') || 'None ranked'}

## Founder Conclusion

${assessment.founderConclusion}

> Can DevPulse prove that built applications are actually running?

${assessment.founderConclusion}

---

*Reality only — URL/route/panel/HTML ≠ proof. No future-state scoring.*
`;

  return {
    executiveSummary: assessment.livePreviewRealitySummary,
    previewRealityMatrix: assessment.previewRealityMatrix,
    evidenceFound: assessment.evidenceFound,
    missingEvidence: assessment.missingEvidence,
    previewBlockers: assessment.previewBlockers,
    founderConclusion: assessment.founderConclusion,
    founderBottleneck: assessment.founderBottleneck,
    markdown,
  };
}

export function assessLivePreviewRealityAuthority(
  input: AssessLivePreviewRealityAuthorityInput,
): LivePreviewRealityAuthorityAssessment {
  const legacyAssessment = assessLivePreviewReality(input.legacyInput);
  const analyzers = runAllLivePreviewRealityAnalyzers(input);
  const portfolio = computeSubscores(input);
  const evidence = collectLivePreviewEvidence(input).slice(0, MAX_PREVIEW_EVIDENCE);
  const stages = buildStages(analyzers);
  const previewRealityMatrix = buildPreviewRealityMatrix(input, analyzers);
  const blockers = buildBlockers(input, analyzers);
  const founderBottleneck = resolveFounderBottleneck(input, analyzers);

  let livePreviewRealityScore = clamp(
    portfolio.infrastructure * 0.18 +
      portfolio.runtime * 0.22 +
      portfolio.connectivity * 0.2 +
      portfolio.usability * 0.22 +
      portfolio.builderIntegration * 0.18,
  );

  if (analyzers.runtimeEvidence !== 'RUNTIME_PROVEN') {
    livePreviewRealityScore = Math.min(livePreviewRealityScore, 54);
  }
  if (analyzers.previewUsability !== 'PREVIEW_USABLE') {
    livePreviewRealityScore = Math.min(livePreviewRealityScore, 58);
  }
  if (!input.workspace.executionConnected) {
    livePreviewRealityScore = Math.min(livePreviewRealityScore, 46);
  }
  if (legacyAssessment.falsePositiveReadiness) {
    livePreviewRealityScore = Math.min(livePreviewRealityScore, 44);
  }

  const evidenceFound = evidence
    .filter((e) => e.level === 'OBSERVED' || e.level === 'PROVEN')
    .map((e) => `[${e.level}] ${e.description} (${e.source})`);

  const missingEvidence = [
    analyzers.runtimeEvidence !== 'RUNTIME_PROVEN'
      ? 'Proven running application (startup + readiness + availability tied to preview session)'
      : '',
    analyzers.previewConnectivity !== 'PREVIEW_CONNECTED'
      ? 'Workspace-linked preview connectivity beyond URL or route presence'
      : '',
    analyzers.previewUsability !== 'PREVIEW_USABLE'
      ? 'Founder-usable preview (visible, interactive, rendering correctly, current project)'
      : '',
    analyzers.buildToPreview !== 'BUILD_TO_PREVIEW_PROVEN'
      ? 'Builder output → preview runtime linkage with execution evidence'
      : '',
    !input.workspace.executionConnected ? 'Connected builder execution (executionConnected=false)' : '',
    input.legacyInput.uiSurfacePresent && analyzers.previewUsability === 'PREVIEW_UNPROVEN'
      ? 'Proof that UI panel presence reflects a running application'
      : '',
  ].filter(Boolean);

  const previewBlockers = blockers
    .sort((a, b) => a.impactRank - b.impactRank)
    .map((b) => `[${b.severity}] ${b.explanation}`);

  const founderConclusion = buildFounderConclusion(
    livePreviewRealityScore,
    founderBottleneck,
    analyzers,
    input,
  );

  const runtimeLabel = analyzers.runtimeEvidence.replace(/^RUNTIME_/, '').toLowerCase().replace(/_/g, ' ');
  const usabilityLabel = analyzers.previewUsability.replace(/^PREVIEW_/, '').toLowerCase().replace(/_/g, ' ');
  const livePreviewRealitySummary = `Live preview reality ${livePreviewRealityScore}/100 — runtime ${runtimeLabel}; usability ${usabilityLabel}; bottleneck ${founderBottleneck}.`;

  const assessmentId = nextAssessmentId();
  const assessedAt = Date.now();

  const base = {
    assessmentId,
    livePreviewRealityScore,
    portfolioSubscores: portfolio,
    analyzers,
    stages,
    evidence,
    blockers,
    previewRealityMatrix,
    evidenceFound,
    missingEvidence,
    previewBlockers,
    founderConclusion,
    founderBottleneck,
    livePreviewRealitySummary,
    legacyAssessment,
    assessedAt,
  };

  const report = buildLivePreviewRealityReport({ ...base, report: undefined as never });

  storeLivePreviewRegistryEntry({
    assessmentId,
    livePreviewRealityScore,
    founderBottleneck,
    assessedAt,
  });

  recordLivePreviewHistory({
    assessmentId,
    livePreviewRealityScore,
    summary: livePreviewRealitySummary,
  });

  return { ...base, report };
}

export function writeLivePreviewRealityReportFile(
  assessment: LivePreviewRealityAuthorityAssessment,
  rootDir: string,
): string {
  const reportPath = join(rootDir, 'architecture', 'LIVE_PREVIEW_REALITY_REPORT.md');
  writeFileSync(reportPath, assessment.report.markdown, 'utf8');
  return reportPath;
}
