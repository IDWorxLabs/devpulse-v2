/**
 * Build Plan Authority — read-only build plan orchestrator (V1).
 */

import { buildBuildPlan, resetBuildPlanCounterForTests } from './build-plan-builder.js';
import {
  getBuildPlanHistory,
  getBuildPlans,
  recordBuildPlan,
  resetBuildPlanHistoryForTests,
} from './build-plan-history.js';
import {
  buildBuildPlanGeneratorReport,
  buildBuildPlanGeneratorReportMarkdown,
} from './build-plan-report-builder.js';
import { resetDependencyCounterForTests } from './dependency-analyzer.js';
import { resetMilestoneCounterForTests } from './milestone-generator.js';
import { resetPrioritizerCountersForTests } from './risk-aware-prioritizer.js';
import { ALLOWED_ARCHITECTURE_READINESS_FOR_BUILD } from './build-plan-registry.js';
import type {
  BuildPlan,
  BuildPlanGeneration,
  BuildPlanGeneratorReport,
  GenerateBuildPlanInput,
} from './build-plan-types.js';

export function resetBuildPlanGeneratorModuleForTests(): void {
  resetBuildPlanCounterForTests();
  resetMilestoneCounterForTests();
  resetDependencyCounterForTests();
  resetPrioritizerCountersForTests();
  resetBuildPlanHistoryForTests();
}

function isArchitectureReadinessAllowed(readiness: string | undefined): boolean {
  return ALLOWED_ARCHITECTURE_READINESS_FOR_BUILD.includes(
    readiness as (typeof ALLOWED_ARCHITECTURE_READINESS_FOR_BUILD)[number],
  );
}

export function generateBuildPlan(input: GenerateBuildPlanInput): BuildPlan | null {
  const arch = input.architectureBrief;
  if (!arch || !isArchitectureReadinessAllowed(arch.architectureBriefReadiness)) return null;

  const plan = buildBuildPlan(input);
  if (!plan) return null;

  if (!input.skipHistoryRecording) {
    recordBuildPlan(plan);
  }

  return plan;
}

export function runBuildPlanGenerator(input: GenerateBuildPlanInput): BuildPlanGeneration {
  const arch = input.architectureBrief;

  if (!arch) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'BUILD_PLAN_GENERATOR_FAILED',
      buildPlan: null,
      failureReason: 'MISSING_ARCHITECTURE_BRIEF',
    };
  }

  if (!isArchitectureReadinessAllowed(arch.architectureBriefReadiness)) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'BUILD_PLAN_GENERATOR_FAILED',
      buildPlan: null,
      failureReason: 'ARCHITECTURE_READINESS_NOT_ALLOWED',
    };
  }

  const buildPlan = generateBuildPlan(input);

  if (!buildPlan) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'BUILD_PLAN_GENERATOR_FAILED',
      buildPlan: null,
      failureReason: 'BUILD_PLAN_GENERATION_FAILED',
    };
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'BUILD_PLAN_GENERATOR_COMPLETE',
    buildPlan,
    failureReason: null,
  };
}

export function buildBuildPlanGeneratorArtifacts(input: {
  plans?: readonly BuildPlan[];
} = {}): {
  report: BuildPlanGeneratorReport;
  markdown: string;
} {
  const history = getBuildPlanHistory();
  const storedPlans = input.plans ?? getBuildPlans();
  const report = buildBuildPlanGeneratorReport({ plans: storedPlans, history });

  const latestPlans =
    storedPlans.length > 0 ? storedPlans : report.latestPlan ? [report.latestPlan] : [];

  return {
    report,
    markdown: buildBuildPlanGeneratorReportMarkdown(report, latestPlans),
  };
}
