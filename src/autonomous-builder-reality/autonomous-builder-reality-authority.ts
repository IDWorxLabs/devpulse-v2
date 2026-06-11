/**
 * Autonomous Builder Reality — unified authority (read-only evidence aggregation).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AUTONOMOUS_BUILDER_REALITY_OWNER_MODULE,
  MAX_BUILDER_BLOCKERS,
  MAX_BUILDER_EVIDENCE,
  MAX_CAPABILITY_MATRIX_ROWS,
} from './autonomous-builder-reality-bounds.js';
import {
  collectBuilderExecutionEvidence,
  runAllBuilderRealityAnalyzers,
} from './autonomous-builder-reality-analyzers.js';
import { recordBuilderRealityHistory } from './autonomous-builder-reality-history.js';
import { storeBuilderRealityRegistryEntry } from './autonomous-builder-reality-registry.js';
import type {
  AssessAutonomousBuilderRealityInput,
  AutonomousBuilderRealityAssessment,
  BuilderExecutionBlocker,
  BuilderExecutionReport,
  BuilderRealitySubscores,
  CapabilityMatrixRow,
  ModulePresenceEvidence,
} from './autonomous-builder-reality-types.js';

export { AUTONOMOUS_BUILDER_REALITY_OWNER_MODULE };

let assessmentCounter = 0;

export function resetAutonomousBuilderRealityCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `builder-reality-${assessmentCounter}`;
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scorePlanning(input: AssessAutonomousBuilderRealityInput): number {
  const level = runAllBuilderRealityAnalyzers(input).planningReality;
  if (level === 'PLANNING_AVAILABLE') return 82;
  if (level === 'PLANNING_PARTIAL') return 58;
  return 18;
}

function scoreFileCreation(input: AssessAutonomousBuilderRealityInput): number {
  const level = runAllBuilderRealityAnalyzers(input).fileGenerationReality;
  if (level === 'FILE_GENERATION_PROVEN') return 85;
  if (level === 'FILE_GENERATION_PARTIAL') return 42;
  return 12;
}

function scoreCodeGeneration(input: AssessAutonomousBuilderRealityInput): number {
  if (!input.moduleEvidence.hasCodeGenerationRuntime) return 10;
  if (input.workspace.executionConnected) return 78;
  return 38;
}

function scoreBuildExecution(input: AssessAutonomousBuilderRealityInput): number {
  const level = runAllBuilderRealityAnalyzers(input).buildCapabilityLevel;
  if (level === 'BUILD_CAPABILITY_PROVEN') return 88;
  if (level === 'BUILD_CAPABILITY_OBSERVED') return 35;
  return 14;
}

function scoreValidation(input: AssessAutonomousBuilderRealityInput): number {
  const level = runAllBuilderRealityAnalyzers(input).validationReality;
  if (level === 'VALIDATION_PROVEN') return 80;
  if (level === 'VALIDATION_PARTIAL') return 52;
  return 15;
}

function scoreCompletion(input: AssessAutonomousBuilderRealityInput): number {
  const level = runAllBuilderRealityAnalyzers(input).autonomousCompletion;
  if (level === 'AUTONOMOUS_COMPLETE') return 90;
  if (level === 'AUTONOMOUS_PARTIAL') return 40;
  return 8;
}

function computeSubscores(input: AssessAutonomousBuilderRealityInput): BuilderRealitySubscores {
  return {
    planning: scorePlanning(input),
    fileCreation: scoreFileCreation(input),
    codeGeneration: scoreCodeGeneration(input),
    buildExecution: scoreBuildExecution(input),
    validation: scoreValidation(input),
    completion: scoreCompletion(input),
  };
}

function buildCapabilityMatrix(
  input: AssessAutonomousBuilderRealityInput,
  analyzers: ReturnType<typeof runAllBuilderRealityAnalyzers>,
): CapabilityMatrixRow[] {
  const { workspace, moduleEvidence } = input;
  const rows: CapabilityMatrixRow[] = [
    {
      capability: 'Requirement understanding',
      claimed: workspace.world2FoundationComplete ? 'CLAIMED' : 'NONE',
      observed: moduleEvidence.hasRequirementExtractor ? 'OBSERVED' : 'NONE',
      proven: 'NONE',
    },
    {
      capability: 'Plan generation',
      claimed: workspace.world2FoundationComplete ? 'CLAIMED' : 'NONE',
      observed: moduleEvidence.hasCapabilityPlanning || moduleEvidence.hasBuildPackageGenerator ? 'OBSERVED' : 'NONE',
      proven: 'NONE',
    },
    {
      capability: 'Architecture generation',
      claimed: workspace.world2FoundationComplete ? 'CLAIMED' : 'NONE',
      observed: moduleEvidence.hasBuildPackageGenerator ? 'OBSERVED' : 'NONE',
      proven: 'NONE',
    },
    {
      capability: 'Implementation tasks',
      claimed: moduleEvidence.hasBuildTaskRuntime ? 'CLAIMED' : 'NONE',
      observed: moduleEvidence.hasBuildTaskRuntime ? 'OBSERVED' : 'NONE',
      proven: 'NONE',
    },
    {
      capability: 'File creation / modification',
      claimed: moduleEvidence.hasWorld2ControlledApply ? 'CLAIMED' : 'NONE',
      observed: moduleEvidence.hasWorld2ControlledApply || moduleEvidence.hasCodeGenerationRuntime ? 'OBSERVED' : 'NONE',
      proven: analyzers.fileGenerationReality === 'FILE_GENERATION_PROVEN' ? 'PROVEN' : 'NONE',
    },
    {
      capability: 'Build execution',
      claimed: workspace.world2FoundationComplete ? 'CLAIMED' : 'NONE',
      observed: workspace.livePreviewConnected ? 'OBSERVED' : 'NONE',
      proven: workspace.executionConnected ? 'PROVEN' : 'NONE',
    },
    {
      capability: 'Validation tied to output',
      claimed: moduleEvidence.validatorScriptCount > 0 ? 'CLAIMED' : 'NONE',
      observed: moduleEvidence.validatorScriptCount > 0 ? 'OBSERVED' : 'NONE',
      proven: analyzers.validationReality === 'VALIDATION_PROVEN' ? 'PROVEN' : 'NONE',
    },
    {
      capability: 'Autonomous completion (Req→Plan→Build→Validate)',
      claimed: analyzers.planningReality !== 'PLANNING_MISSING' ? 'CLAIMED' : 'NONE',
      observed: analyzers.autonomousCompletion === 'AUTONOMOUS_PARTIAL' ? 'OBSERVED' : 'NONE',
      proven: analyzers.autonomousCompletion === 'AUTONOMOUS_COMPLETE' ? 'PROVEN' : 'NONE',
    },
  ];
  return rows.slice(0, MAX_CAPABILITY_MATRIX_ROWS);
}

function buildBlockers(
  input: AssessAutonomousBuilderRealityInput,
  analyzers: ReturnType<typeof runAllBuilderRealityAnalyzers>,
): BuilderExecutionBlocker[] {
  const blockers: BuilderExecutionBlocker[] = [];
  let rank = 1;

  if (!input.workspace.executionConnected) {
    blockers.push({
      id: `blocker-${rank}`,
      severity: 'CRITICAL',
      impactRank: rank,
      explanation: 'Autonomous builder execution is not connected to real build output.',
      recommendation: 'Connect execution before claiming end-to-end build capability.',
    });
    rank += 1;
  }

  if (analyzers.fileGenerationReality === 'FILE_GENERATION_UNPROVEN') {
    blockers.push({
      id: `blocker-${rank}`,
      severity: 'HIGH',
      impactRank: rank,
      explanation: 'File generation is not proven — modules exist without observed autonomous file mutation.',
      recommendation: 'Prove file creation through connected World 2 apply or builder execution evidence.',
    });
    rank += 1;
  }

  if (analyzers.validationReality !== 'VALIDATION_PROVEN') {
    blockers.push({
      id: `blocker-${rank}`,
      severity: 'MEDIUM',
      impactRank: rank,
      explanation: 'Validation scripts exist but are not tied to autonomous builder output.',
      recommendation: 'Run validation against actual builder-generated artifacts.',
    });
    rank += 1;
  }

  if (analyzers.autonomousCompletion === 'AUTONOMOUS_BLOCKED' && analyzers.stopPoint) {
    blockers.push({
      id: `blocker-${rank}`,
      severity: 'HIGH',
      impactRank: rank,
      explanation: `Autonomous pipeline blocked at ${analyzers.stopPoint}`,
      recommendation: 'Resolve the blocked stage before autonomous completion.',
    });
  }

  return blockers.slice(0, MAX_BUILDER_BLOCKERS);
}

function buildFounderConclusion(
  score: number,
  analyzers: ReturnType<typeof runAllBuilderRealityAnalyzers>,
  input: AssessAutonomousBuilderRealityInput,
): string {
  if (analyzers.autonomousCompletion === 'AUTONOMOUS_COMPLETE') {
    return 'Yes — measurable evidence shows DevPulse can complete Requirement → Plan → Build → Validate without manual intervention today.';
  }
  if (!input.workspace.executionConnected) {
    return 'Not today for autonomous end-to-end software building. DevPulse can plan and analyze with observed planning modules, but builder execution is not connected — it cannot prove autonomous file generation, build completion, or validation tied to builder output.';
  }
  if (analyzers.autonomousCompletion === 'AUTONOMOUS_PARTIAL') {
    return `Partially — DevPulse demonstrates planning and partial execution signals (score ${score}/100), but autonomous completion stops before full build-and-validate without manual intervention.`;
  }
  return `No — builder reality score ${score}/100 indicates planning/analysis capability without proven autonomous software construction today.`;
}

export function buildAutonomousBuilderRealityReport(
  assessment: Omit<AutonomousBuilderRealityAssessment, 'report'> & { report?: never },
): BuilderExecutionReport {
  const matrixTable = assessment.capabilityMatrix
    .map((r) => `| ${r.capability} | ${r.claimed} | ${r.observed} | ${r.proven} |`)
    .join('\n');

  const markdown = `# Autonomous Builder Reality Report

Generated by Autonomous Builder Reality Authority (${AUTONOMOUS_BUILDER_REALITY_OWNER_MODULE}).

## Executive Summary

**Builder Reality Score: ${assessment.builderRealityScore}/100**

${assessment.builderRealitySummary}

Autonomous completion: **${assessment.analyzers.autonomousCompletion.replace(/_/g, ' ')}**

Planning: ${assessment.analyzers.planningReality} | File generation: ${assessment.analyzers.fileGenerationReality} | Build: ${assessment.analyzers.buildCapabilityLevel} | Validation: ${assessment.analyzers.validationReality}

## Capability Matrix

| Capability | Claimed | Observed | Proven |
| ---------- | ------- | -------- | ------ |
${matrixTable}

## Evidence Found

${assessment.evidenceFound.map((e) => `- ${e}`).join('\n') || '- None'}

## Missing Evidence

${assessment.missingEvidence.map((e) => `- ${e}`).join('\n') || '- None'}

## Builder Bottlenecks

${assessment.builderBottlenecks.map((b, i) => `${i + 1}. ${b}`).join('\n') || 'None ranked'}

## Founder Conclusion

${assessment.founderConclusion}

---

*Reality only — no future-state scoring.*
`;

  return {
    executiveSummary: assessment.builderRealitySummary,
    capabilityMatrix: assessment.capabilityMatrix,
    evidenceFound: assessment.evidenceFound,
    missingEvidence: assessment.missingEvidence,
    builderBottlenecks: assessment.builderBottlenecks,
    founderConclusion: assessment.founderConclusion,
    markdown,
  };
}

export function assessAutonomousBuilderReality(
  input: AssessAutonomousBuilderRealityInput,
): AutonomousBuilderRealityAssessment {
  const analyzers = runAllBuilderRealityAnalyzers(input);
  const portfolio = computeSubscores(input);
  const evidence = collectBuilderExecutionEvidence(input).slice(0, MAX_BUILDER_EVIDENCE);

  let builderRealityScore = clamp(
    portfolio.planning * 0.18 +
      portfolio.fileCreation * 0.18 +
      portfolio.codeGeneration * 0.14 +
      portfolio.buildExecution * 0.2 +
      portfolio.validation * 0.15 +
      portfolio.completion * 0.15,
  );

  if (!input.workspace.executionConnected) {
    builderRealityScore = Math.min(builderRealityScore, 52);
  }
  if (analyzers.autonomousCompletion === 'AUTONOMOUS_BLOCKED') {
    builderRealityScore = Math.min(builderRealityScore, 48);
  }

  const capabilityMatrix = buildCapabilityMatrix(input, analyzers);
  const blockers = buildBlockers(input, analyzers);

  const evidenceFound = evidence
    .filter((e) => e.level === 'OBSERVED' || e.level === 'PROVEN')
    .map((e) => `[${e.level}] ${e.description} (${e.source})`);

  const missingEvidence = [
    !input.workspace.executionConnected ? 'Connected autonomous builder execution (executionConnected=false)' : '',
    analyzers.fileGenerationReality === 'FILE_GENERATION_UNPROVEN'
      ? 'Proven autonomous file generation tied to builder output'
      : '',
    analyzers.validationReality !== 'VALIDATION_PROVEN'
      ? 'Validation executed against actual builder-generated artifacts'
      : '',
    analyzers.buildCapabilityLevel !== 'BUILD_CAPABILITY_PROVEN'
      ? 'Completed build execution with generated output'
      : '',
    analyzers.autonomousCompletion !== 'AUTONOMOUS_COMPLETE'
      ? 'Autonomous Requirement → Plan → Build → Validate without manual intervention'
      : '',
  ].filter(Boolean);

  const builderBottlenecks = blockers
    .sort((a, b) => a.impactRank - b.impactRank)
    .map((b) => `[${b.severity}] ${b.explanation}`);

  const founderConclusion = buildFounderConclusion(builderRealityScore, analyzers, input);
  const builderRealitySummary = `Builder reality ${builderRealityScore}/100 — ${analyzers.autonomousCompletion.replace(/_/g, ' ').toLowerCase()}; executionConnected=${input.workspace.executionConnected}.`;

  const assessmentId = nextAssessmentId();
  const assessedAt = Date.now();

  const base = {
    builderRealityScore,
    portfolioSubscores: portfolio,
    analyzers,
    evidence,
    blockers,
    capabilityMatrix,
    evidenceFound,
    missingEvidence,
    builderBottlenecks,
    founderConclusion,
    builderRealitySummary,
    autonomousBuilderRealityPass: evidenceFound.length > 0 && missingEvidence.length > 0 && Boolean(founderConclusion),
    assessedAt,
  };

  const report = buildAutonomousBuilderRealityReport({ ...base, report: undefined as never });

  storeBuilderRealityRegistryEntry({
    assessmentId,
    builderRealityScore,
    autonomousCompletion: analyzers.autonomousCompletion,
    assessedAt,
  });

  recordBuilderRealityHistory({
    assessmentId,
    builderRealityScore,
    summary: builderRealitySummary,
  });

  return { ...base, report };
}

export function detectModulePresenceEvidence(rootDir: string): ModulePresenceEvidence {
  const pkg = JSON.parse(
    existsSync(join(rootDir, 'package.json'))
      ? readFileSync(join(rootDir, 'package.json'), 'utf8')
      : '{}',
  ) as { scripts?: Record<string, string> };
  const validatorScriptCount = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')).length;

  const pathExists = (rel: string) => existsSync(join(rootDir, rel));

  return {
    hasRequirementExtractor: pathExists('src/requirement-extractor/index.ts'),
    hasCapabilityPlanning: pathExists('src/capability-planning-engine/index.ts'),
    hasBuildPackageGenerator: pathExists('src/build-package-generator/index.ts'),
    hasBuildTaskRuntime: pathExists('src/build-task-runtime/index.ts'),
    hasCodeGenerationRuntime: pathExists('src/code-generation-runtime/index.ts'),
    hasWorld2ControlledApply: pathExists('src/world2-controlled-apply-runtime/index.ts'),
    hasAutonomousBuilderFoundation: pathExists('src/autonomous-builder/index.ts'),
    hasExecutionRuntime: pathExists('src/execution-runtime/index.ts'),
    hasControlledBuilderExecutionEngine: pathExists('src/controlled-builder-execution-engine/index.ts'),
    hasMobileRuntimeExperienceReality: pathExists('src/mobile-runtime-experience-reality/index.ts'),
    hasRealFileWorkspaceExecution: pathExists('src/real-file-workspace-execution/index.ts'),
    validatorScriptCount,
  };
}
