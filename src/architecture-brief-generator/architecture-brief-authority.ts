/**
 * Architecture Brief Authority — read-only architecture brief orchestrator (V1).
 */

import {
  buildArchitectureBrief,
  resetArchitectureBriefCounterForTests,
} from './architecture-brief-builder.js';
import {
  getArchitectureBriefHistory,
  getArchitectureBriefs,
  recordArchitectureBrief,
  resetArchitectureBriefHistoryForTests,
} from './architecture-brief-history.js';
import {
  buildArchitectureBriefGeneratorReport,
  buildArchitectureBriefGeneratorReportMarkdown,
} from './architecture-brief-report-builder.js';
import { resetArchitectureRiskCounterForTests } from './architecture-risk-detector.js';
import { resetDataModelCounterForTests } from './data-model-summarizer.js';
import { resetIntegrationCounterForTests } from './integration-architecture-summarizer.js';
import type {
  ArchitectureBrief,
  ArchitectureBriefGeneration,
  ArchitectureBriefGeneratorReport,
  GenerateArchitectureBriefInput,
} from './architecture-brief-types.js';
import { ALLOWED_GATE_DECISIONS_FOR_ARCHITECTURE } from './architecture-brief-registry.js';

export function resetArchitectureBriefGeneratorModuleForTests(): void {
  resetArchitectureBriefCounterForTests();
  resetArchitectureRiskCounterForTests();
  resetDataModelCounterForTests();
  resetIntegrationCounterForTests();
  resetArchitectureBriefHistoryForTests();
}

function isGateAllowedForArchitecture(decision: string | undefined): boolean {
  return ALLOWED_GATE_DECISIONS_FOR_ARCHITECTURE.includes(
    decision as (typeof ALLOWED_GATE_DECISIONS_FOR_ARCHITECTURE)[number],
  );
}

export function generateArchitectureBrief(input: GenerateArchitectureBriefInput): ArchitectureBrief | null {
  const gate = input.planningGateAnalysis;
  if (!gate || !isGateAllowedForArchitecture(gate.planningGateDecision)) return null;
  if (!input.planningBrief) return null;

  const brief = buildArchitectureBrief(input);
  if (!brief) return null;

  if (!input.skipHistoryRecording) {
    recordArchitectureBrief(brief);
  }

  return brief;
}

export function runArchitectureBriefGenerator(input: GenerateArchitectureBriefInput): ArchitectureBriefGeneration {
  const gate = input.planningGateAnalysis;

  if (!gate) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'ARCHITECTURE_BRIEF_GENERATOR_FAILED',
      architectureBrief: null,
      failureReason: 'MISSING_PLANNING_GATE_ANALYSIS',
    };
  }

  if (!isGateAllowedForArchitecture(gate.planningGateDecision)) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'ARCHITECTURE_BRIEF_GENERATOR_FAILED',
      architectureBrief: null,
      failureReason: gate.planningGateDecision === 'REJECT_PLANNING'
        ? 'PLANNING_GATE_REJECTED'
        : 'PLANNING_GATE_NOT_ALLOWED_FOR_ARCHITECTURE',
    };
  }

  if (!input.planningBrief) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'ARCHITECTURE_BRIEF_GENERATOR_FAILED',
      architectureBrief: null,
      failureReason: 'MISSING_PLANNING_BRIEF',
    };
  }

  const architectureBrief = generateArchitectureBrief(input);

  if (!architectureBrief) {
    return {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'ARCHITECTURE_BRIEF_GENERATOR_FAILED',
      architectureBrief: null,
      failureReason: 'ARCHITECTURE_BRIEF_GENERATION_FAILED',
    };
  }

  return {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'ARCHITECTURE_BRIEF_GENERATOR_COMPLETE',
    architectureBrief,
    failureReason: null,
  };
}

export function buildArchitectureBriefGeneratorArtifacts(input: {
  briefs?: readonly ArchitectureBrief[];
} = {}): {
  report: ArchitectureBriefGeneratorReport;
  markdown: string;
} {
  const history = getArchitectureBriefHistory();
  const storedBriefs = input.briefs ?? getArchitectureBriefs();
  const report = buildArchitectureBriefGeneratorReport({
    briefs: storedBriefs,
    history,
  });

  const latestBriefs =
    storedBriefs.length > 0 ? storedBriefs : report.latestBrief ? [report.latestBrief] : [];

  return {
    report,
    markdown: buildArchitectureBriefGeneratorReportMarkdown(report, latestBriefs),
  };
}
