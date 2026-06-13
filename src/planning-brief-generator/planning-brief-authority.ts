/**
 * Planning Brief Authority — read-only planning brief orchestrator (V1).
 */

import { buildPlanningBrief, resetPlanningBriefCounterForTests } from './planning-brief-builder.js';
import {
  getPlanningBriefHistory,
  getPlanningBriefs,
  recordPlanningBrief,
  resetPlanningBriefHistoryForTests,
} from './planning-brief-history.js';
import {
  buildPlanningBriefGeneratorReport,
  buildPlanningBriefGeneratorReportMarkdown,
} from './planning-brief-report-builder.js';
import { resetScreenInventoryCounterForTests } from './screen-inventory-builder.js';
import type {
  GeneratePlanningBriefInput,
  PlanningBrief,
  PlanningBriefGeneration,
  PlanningBriefGeneratorReport,
} from './planning-brief-types.js';
import { resetWorkflowSummarizerCounterForTests } from './workflow-summarizer.js';

export function resetPlanningBriefGeneratorModuleForTests(): void {
  resetPlanningBriefCounterForTests();
  resetScreenInventoryCounterForTests();
  resetWorkflowSummarizerCounterForTests();
  resetPlanningBriefHistoryForTests();
}

export function generatePlanningBrief(input: GeneratePlanningBriefInput): PlanningBrief | null {
  const gate = input.planningGateAnalysis;
  if (!gate) return null;
  if (gate.planningGateDecision === 'REJECT_PLANNING') return null;

  const brief = buildPlanningBrief(input);
  if (!brief) return null;

  if (!input.skipHistoryRecording) {
    recordPlanningBrief(brief);
  }

  return brief;
}

export function runPlanningBriefGenerator(input: GeneratePlanningBriefInput): PlanningBriefGeneration {
  const gate = input.planningGateAnalysis;

  if (!gate) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'PLANNING_BRIEF_GENERATOR_FAILED',
      planningBrief: null,
      failureReason: 'MISSING_PLANNING_GATE_ANALYSIS',
    };
  }

  if (gate.planningGateDecision === 'REJECT_PLANNING') {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'PLANNING_BRIEF_GENERATOR_FAILED',
      planningBrief: null,
      failureReason: 'PLANNING_GATE_REJECTED',
    };
  }

  if (!input.unifiedIntakeAnalysis) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'PLANNING_BRIEF_GENERATOR_FAILED',
      planningBrief: null,
      failureReason: 'MISSING_UNIFIED_INTAKE_EVIDENCE',
    };
  }

  const planningBrief = generatePlanningBrief(input);

  if (!planningBrief) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'PLANNING_BRIEF_GENERATOR_FAILED',
      planningBrief: null,
      failureReason: 'BRIEF_GENERATION_FAILED',
    };
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'PLANNING_BRIEF_GENERATOR_COMPLETE',
    planningBrief,
    failureReason: null,
  };
}

export function buildPlanningBriefGeneratorArtifacts(input: {
  briefs?: readonly PlanningBrief[];
} = {}): {
  report: PlanningBriefGeneratorReport;
  markdown: string;
} {
  const history = getPlanningBriefHistory();
  const storedBriefs = input.briefs ?? getPlanningBriefs();
  const report = buildPlanningBriefGeneratorReport({
    briefs: storedBriefs,
    history,
  });

  const latestBriefs =
    storedBriefs.length > 0 ? storedBriefs : report.latestBrief ? [report.latestBrief] : [];

  return {
    report,
    markdown: buildPlanningBriefGeneratorReportMarkdown(report, latestBriefs),
  };
}
