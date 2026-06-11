/**
 * Verification Reality — unified authority (read-only evidence aggregation).
 * No validator execution cascades. No runtime mutation.
 *
 * Reality rules (never proof): Validator count, pass token exists, NPM script exists,
 * Route exists, URL exists, panel exists, menu item, roadmap promise.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MAX_VERIFICATION_BLOCKERS,
  MAX_VERIFICATION_EVIDENCE,
  VERIFICATION_REALITY_OWNER_MODULE,
} from './verification-reality-bounds.js';
import {
  collectVerificationRealityEvidence,
  runAllVerificationRealityAnalyzers,
} from './verification-reality-analyzers.js';
import { recordVerificationHistory } from './verification-reality-history.js';
import { storeVerificationRegistryEntry } from './verification-reality-registry.js';
import type {
  AssessVerificationRealityInput,
  VerificationRealityAssessment,
  VerificationRealityBlocker,
  VerificationRealityReport,
  VerificationRealityStage,
  VerificationRealitySubscores,
  VerificationRealityMatrixRow,
} from './verification-reality-types.js';
import type { VerificationInventoryLevel } from './verification-reality-analyzer-types.js';

export { VERIFICATION_REALITY_OWNER_MODULE };

let assessmentCounter = 0;

export function resetVerificationRealityCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `verification-reality-${assessmentCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreValidationInfrastructure(input: AssessVerificationRealityInput): number {
  const { moduleEvidence } = input;
  const count = moduleEvidence.validatorScriptCount;
  let score = 12;
  if (count > 0) score = 28;
  if (moduleEvidence.hasFounderTestingMode) score += 12;
  if (moduleEvidence.hasExecutionRealityEngine) score += 10;
  if (moduleEvidence.hasVerificationResultsVisibility) score += 8;
  // High validator count must not create high proof score — hard cap on infrastructure alone.
  if (count >= 40) score = Math.min(score, 52);
  else if (count >= 20) score = Math.min(score, 48);
  return clamp(score);
}

function scoreRuntimeLink(input: AssessVerificationRealityInput): number {
  const level = runAllVerificationRealityAnalyzers(input).runtimeLink;
  if (level === 'RUNTIME_LINK_PROVEN') return 88;
  if (level === 'RUNTIME_LINK_PARTIAL') return 38;
  return 10;
}

function scoreBuildOutputLink(input: AssessVerificationRealityInput): number {
  const level = runAllVerificationRealityAnalyzers(input).buildOutputLink;
  if (level === 'BUILD_OUTPUT_LINK_PROVEN') return 86;
  if (level === 'BUILD_OUTPUT_LINK_PARTIAL') return 32;
  return 8;
}

function scorePreviewLink(input: AssessVerificationRealityInput): number {
  const level = runAllVerificationRealityAnalyzers(input).previewLink;
  if (level === 'PREVIEW_LINK_PROVEN') return 84;
  if (level === 'PREVIEW_LINK_PARTIAL') return 40;
  return 10;
}

function scoreEvidenceChain(input: AssessVerificationRealityInput): number {
  const level = runAllVerificationRealityAnalyzers(input).evidenceChain;
  if (level === 'EVIDENCE_CHAIN_PROVEN') return 90;
  if (level === 'EVIDENCE_CHAIN_PARTIAL') return 36;
  return 6;
}

function computeSubscores(input: AssessVerificationRealityInput): VerificationRealitySubscores {
  return {
    validationInfrastructure: scoreValidationInfrastructure(input),
    runtimeLink: scoreRuntimeLink(input),
    buildOutputLink: scoreBuildOutputLink(input),
    previewLink: scorePreviewLink(input),
    evidenceChain: scoreEvidenceChain(input),
  };
}

function buildVerificationRealityMatrix(
  input: AssessVerificationRealityInput,
  analyzers: ReturnType<typeof runAllVerificationRealityAnalyzers>,
): VerificationRealityMatrixRow[] {
  const { workspace, moduleEvidence } = input;
  return [
    {
      area: 'Validation Infrastructure',
      claimed: workspace.validatorCount > 0 || workspace.verificationSurfacePresent ? 'CLAIMED' : 'NONE',
      observed: analyzers.validationInventory === 'VERIFICATION_OBSERVED' ? 'OBSERVED' : 'NONE',
      proven: analyzers.validationInventory === 'VERIFICATION_PROVEN' ? 'PROVEN' : 'NONE',
    },
    {
      area: 'Runtime Link',
      claimed: workspace.runtimeDiagnosticsActive ? 'CLAIMED' : 'NONE',
      observed: analyzers.runtimeLink !== 'RUNTIME_LINK_MISSING' ? 'OBSERVED' : 'NONE',
      proven: analyzers.runtimeLink === 'RUNTIME_LINK_PROVEN' ? 'PROVEN' : 'NONE',
    },
    {
      area: 'Build Output Link',
      claimed: workspace.world2FoundationComplete ? 'CLAIMED' : 'NONE',
      observed: analyzers.buildOutputLink !== 'BUILD_OUTPUT_LINK_MISSING' ? 'OBSERVED' : 'NONE',
      proven: analyzers.buildOutputLink === 'BUILD_OUTPUT_LINK_PROVEN' ? 'PROVEN' : 'NONE',
    },
    {
      area: 'Preview Link',
      claimed: Boolean(workspace.previewRealityState) && workspace.previewRealityState !== 'NO_PREVIEW' ? 'CLAIMED' : 'NONE',
      observed: analyzers.previewLink !== 'PREVIEW_LINK_MISSING' ? 'OBSERVED' : 'NONE',
      proven: analyzers.previewLink === 'PREVIEW_LINK_PROVEN' ? 'PROVEN' : 'NONE',
    },
    {
      area: 'Continuous Evidence Chain',
      claimed: moduleEvidence.validatorScriptCount > 0 ? 'CLAIMED' : 'NONE',
      observed: analyzers.evidenceChain !== 'EVIDENCE_CHAIN_MISSING' ? 'OBSERVED' : 'NONE',
      proven: analyzers.evidenceChain === 'EVIDENCE_CHAIN_PROVEN' ? 'PROVEN' : 'NONE',
    },
  ];
}

function buildStages(analyzers: ReturnType<typeof runAllVerificationRealityAnalyzers>): VerificationRealityStage[] {
  const inventoryStatus =
    analyzers.validationInventory === 'VERIFICATION_PROVEN'
      ? 'COMPLETE'
      : analyzers.validationInventory === 'VERIFICATION_OBSERVED'
        ? 'PARTIAL'
        : 'NOT_STARTED';
  const runtimeStatus =
    analyzers.runtimeLink === 'RUNTIME_LINK_PROVEN'
      ? 'COMPLETE'
      : analyzers.runtimeLink === 'RUNTIME_LINK_PARTIAL'
        ? 'PARTIAL'
        : 'BLOCKED';
  const buildStatus =
    analyzers.buildOutputLink === 'BUILD_OUTPUT_LINK_PROVEN'
      ? 'COMPLETE'
      : analyzers.buildOutputLink === 'BUILD_OUTPUT_LINK_PARTIAL'
        ? 'PARTIAL'
        : 'BLOCKED';
  const previewStatus =
    analyzers.previewLink === 'PREVIEW_LINK_PROVEN'
      ? 'COMPLETE'
      : analyzers.previewLink === 'PREVIEW_LINK_PARTIAL'
        ? 'PARTIAL'
        : 'NOT_STARTED';
  const chainStatus =
    analyzers.evidenceChain === 'EVIDENCE_CHAIN_PROVEN'
      ? 'COMPLETE'
      : analyzers.evidenceChain === 'EVIDENCE_CHAIN_PARTIAL'
        ? 'PARTIAL'
        : 'BLOCKED';

  return [
    { stage: 'INVENTORY', status: inventoryStatus, detail: analyzers.validationInventory },
    { stage: 'RUNTIME', status: runtimeStatus, detail: analyzers.runtimeLink },
    { stage: 'BUILD_OUTPUT', status: buildStatus, detail: analyzers.buildOutputLink },
    { stage: 'PREVIEW', status: previewStatus, detail: analyzers.previewLink },
    { stage: 'EVIDENCE_CHAIN', status: chainStatus, detail: `${analyzers.evidenceChain} @ ${analyzers.evidenceChainBreakPoint}` },
  ];
}

function buildBlockers(
  input: AssessVerificationRealityInput,
  analyzers: ReturnType<typeof runAllVerificationRealityAnalyzers>,
): VerificationRealityBlocker[] {
  const blockers: VerificationRealityBlocker[] = [];
  let rank = 1;

  if (!input.workspace.executionConnected) {
    blockers.push({
      id: `verification-blocker-${rank}`,
      severity: 'CRITICAL',
      impactRank: rank,
      explanation:
        'Builder execution is disconnected — verification cannot be proven tied to build output or autonomous execution outcomes.',
      recommendation: 'Connect builder execution before claiming verification proves real product execution.',
    });
    rank += 1;
  }

  if (analyzers.validationInventory !== 'VERIFICATION_PROVEN') {
    blockers.push({
      id: `verification-blocker-${rank}`,
      severity: 'HIGH',
      impactRank: rank,
      explanation: `Verification remains ${analyzers.validationInventory.replace(/_/g, ' ').toLowerCase()} — validator inventory alone does not prove execution verification.`,
      recommendation: 'Tie validators to runtime, build, and preview outcomes rather than expanding script count.',
    });
    rank += 1;
  }

  if (analyzers.runtimeLink !== 'RUNTIME_LINK_PROVEN') {
    blockers.push({
      id: `verification-blocker-${rank}`,
      severity: 'HIGH',
      impactRank: rank,
      explanation: 'Verification is not proven linked to runtime outcomes (startup, readiness, live process evidence).',
      recommendation: 'Consume runtime result records in verification authority assessments.',
    });
    rank += 1;
  }

  if (analyzers.buildOutputLink !== 'BUILD_OUTPUT_LINK_PROVEN') {
    blockers.push({
      id: `verification-blocker-${rank}`,
      severity: 'HIGH',
      impactRank: rank,
      explanation: 'Verification is not proven linked to builder-generated files or build artifacts.',
      recommendation: 'Record and consume build output IDs in verification pipelines.',
    });
    rank += 1;
  }

  if (analyzers.previewLink !== 'PREVIEW_LINK_PROVEN') {
    blockers.push({
      id: `verification-blocker-${rank}`,
      severity: 'MEDIUM',
      impactRank: rank,
      explanation: 'Preview readiness exists in places but verification does not fully consume preview execution outcomes.',
      recommendation: 'Require preview result consumption in verification — preview existence alone is not proof.',
    });
    rank += 1;
  }

  if (analyzers.evidenceChainBreakPoint !== 'NONE') {
    blockers.push({
      id: `verification-blocker-${rank}`,
      severity: 'CRITICAL',
      impactRank: rank,
      explanation: `Continuous evidence chain breaks at ${analyzers.evidenceChainBreakPoint}.`,
      recommendation: `Restore chain link after ${analyzers.evidenceChainBreakPoint} before marking verification proven.`,
    });
  }

  return blockers.slice(0, MAX_VERIFICATION_BLOCKERS);
}

function buildFounderConclusion(
  score: number,
  status: VerificationInventoryLevel,
  analyzers: ReturnType<typeof runAllVerificationRealityAnalyzers>,
  input: AssessVerificationRealityInput,
): string {
  if (status === 'VERIFICATION_PROVEN') {
    return `Yes — observable evidence shows verification tied to build, runtime, preview, and execution outcomes (score ${score}/100).`;
  }

  if (!input.workspace.executionConnected) {
    return `Not today for proven execution-linked verification. DevPulse has substantial validation infrastructure (${input.workspace.validatorCount} scripts, status ${status}), but builder execution is disconnected (executionConnected=false). Validators and pass tokens exist — they do not prove verification of real build or runtime outcomes. Evidence chain breaks at **${analyzers.evidenceChainBreakPoint}**.`;
  }

  if (status === 'VERIFICATION_OBSERVED') {
    return `Partially — verification infrastructure is observed (score ${score}/100) with Founder Testing and results visibility consuming some preview/runtime signals, but proof is blocked until build output, runtime, and preview links are proven. Chain break: **${analyzers.evidenceChainBreakPoint}**.`;
  }

  return `No — verification reality score ${score}/100. Validator count and pass tokens are claimed infrastructure only — not proof of execution-linked verification. Chain break: **${analyzers.evidenceChainBreakPoint}**.`;
}

export function buildVerificationRealityReport(
  assessment: Omit<VerificationRealityAssessment, 'report'> & { report?: never },
): VerificationRealityReport {
  const matrixTable = assessment.verificationRealityMatrix
    .map((r) => `| ${r.area} | ${r.claimed} | ${r.observed} | ${r.proven} |`)
    .join('\n');

  const markdown = `# Verification Reality Report

Generated by Verification Reality Authority (${VERIFICATION_REALITY_OWNER_MODULE}).

## Executive Summary

**Verification Reality Score: ${assessment.verificationRealityScore}/100**

${assessment.verificationRealitySummary}

Verification status: **${assessment.verificationStatus}**

Evidence chain break point: **${assessment.evidenceChainBreakPoint}**

## Verification Reality Matrix

| Area | Claimed | Observed | Proven |
| ---- | ------- | -------- | ------ |
${matrixTable}

## Evidence Found

${assessment.evidenceFound.map((e) => `- ${e}`).join('\n') || '- None'}

## Missing Evidence

${assessment.missingEvidence.map((e) => `- ${e}`).join('\n') || '- None'}

## Verification Blockers

${assessment.verificationBlockers.map((b, i) => `${i + 1}. ${b}`).join('\n') || 'None ranked'}

## Founder Conclusion

${assessment.founderConclusion}

> Can DevPulse prove verification is tied to real execution outcomes?

${assessment.founderConclusion}

---

*Reality only — validator count/pass token/URL/route/panel ≠ proof. No future-state scoring.*
`;

  return {
    executiveSummary: assessment.verificationRealitySummary,
    verificationRealityMatrix: assessment.verificationRealityMatrix,
    evidenceFound: assessment.evidenceFound,
    missingEvidence: assessment.missingEvidence,
    verificationBlockers: assessment.verificationBlockers,
    founderConclusion: assessment.founderConclusion,
    verificationStatus: assessment.verificationStatus,
    evidenceChainBreakPoint: assessment.evidenceChainBreakPoint,
    markdown,
  };
}

export function assessVerificationReality(
  input: AssessVerificationRealityInput,
): VerificationRealityAssessment {
  const analyzers = runAllVerificationRealityAnalyzers(input);
  const portfolio = computeSubscores(input);
  const evidence = collectVerificationRealityEvidence(input).slice(0, MAX_VERIFICATION_EVIDENCE);
  const stages = buildStages(analyzers);
  const verificationRealityMatrix = buildVerificationRealityMatrix(input, analyzers);
  const blockers = buildBlockers(input, analyzers);
  const verificationStatus = analyzers.validationInventory;

  let verificationRealityScore = clamp(
    portfolio.validationInfrastructure * 0.2 +
      portfolio.runtimeLink * 0.22 +
      portfolio.buildOutputLink * 0.22 +
      portfolio.previewLink * 0.18 +
      portfolio.evidenceChain * 0.18,
  );

  if (!input.workspace.executionConnected) {
    verificationRealityScore = Math.min(verificationRealityScore, 44);
  }
  if (analyzers.runtimeLink !== 'RUNTIME_LINK_PROVEN') {
    verificationRealityScore = Math.min(verificationRealityScore, 52);
  }
  if (analyzers.buildOutputLink !== 'BUILD_OUTPUT_LINK_PROVEN') {
    verificationRealityScore = Math.min(verificationRealityScore, 50);
  }
  if (analyzers.evidenceChain === 'EVIDENCE_CHAIN_MISSING') {
    verificationRealityScore = Math.min(verificationRealityScore, 42);
  }
  if (verificationStatus !== 'VERIFICATION_PROVEN') {
    verificationRealityScore = Math.min(verificationRealityScore, 56);
  }

  const evidenceFound = evidence
    .filter((e) => e.level === 'OBSERVED' || e.level === 'PROVEN')
    .map((e) => `[${e.level}] ${e.description} (${e.source})`);

  const missingEvidence = [
    analyzers.runtimeLink !== 'RUNTIME_LINK_PROVEN'
      ? 'Verification proven linked to runtime outcomes (startup, readiness, live process consumption)'
      : '',
    analyzers.buildOutputLink !== 'BUILD_OUTPUT_LINK_PROVEN'
      ? 'Verification proven linked to builder-generated files and build result records'
      : '',
    analyzers.previewLink !== 'PREVIEW_LINK_PROVEN'
      ? 'Verification consuming preview readiness/interactivity results — not preview existence alone'
      : '',
    analyzers.evidenceChain !== 'EVIDENCE_CHAIN_PROVEN'
      ? `Continuous evidence chain Requirement → Builder → Runtime → Preview → Verification (break: ${analyzers.evidenceChainBreakPoint})`
      : '',
    !input.workspace.executionConnected ? 'Connected builder execution (executionConnected=false)' : '',
    verificationStatus !== 'VERIFICATION_PROVEN'
      ? 'Verification result linkage to execution outcomes beyond validator inventory'
      : '',
  ].filter(Boolean);

  const verificationBlockers = blockers
    .sort((a, b) => a.impactRank - b.impactRank)
    .map((b) => `[${b.severity}] ${b.explanation}`);

  const founderConclusion = buildFounderConclusion(
    verificationRealityScore,
    verificationStatus,
    analyzers,
    input,
  );

  const verificationRealitySummary = `Verification reality ${verificationRealityScore}/100 — status ${verificationStatus.replace(/^VERIFICATION_/, '').toLowerCase()}; chain break ${analyzers.evidenceChainBreakPoint}; executionConnected=${input.workspace.executionConnected}.`;

  const assessmentId = nextAssessmentId();
  const assessedAt = Date.now();

  const base = {
    assessmentId,
    verificationRealityScore,
    verificationStatus,
    portfolioSubscores: portfolio,
    analyzers,
    stages,
    evidence,
    blockers,
    verificationRealityMatrix,
    evidenceFound,
    missingEvidence,
    verificationBlockers,
    founderConclusion,
    evidenceChainBreakPoint: analyzers.evidenceChainBreakPoint,
    verificationRealitySummary,
    assessedAt,
  };

  const report = buildVerificationRealityReport({ ...base, report: undefined as never });

  storeVerificationRegistryEntry({
    assessmentId,
    verificationRealityScore,
    verificationStatus,
    evidenceChainBreakPoint: analyzers.evidenceChainBreakPoint,
    assessedAt,
  });

  recordVerificationHistory({
    assessmentId,
    verificationRealityScore,
    summary: verificationRealitySummary,
  });

  return { ...base, report };
}

export function writeVerificationRealityReportFile(
  assessment: VerificationRealityAssessment,
  rootDir: string,
): string {
  const reportPath = join(rootDir, 'architecture', 'VERIFICATION_REALITY_REPORT.md');
  writeFileSync(reportPath, assessment.report.markdown, 'utf8');
  return reportPath;
}
