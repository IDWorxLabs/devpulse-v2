/**
 * AEL Report Builder — final report and artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AelCycleRecord,
  AelEvidenceBundle,
  AelFinalOutcome,
  AelFinalReport,
  AelState,
} from './ael-types.js';
import type { AeeStage } from '../autonomous-engineering-executive/aee-types.js';

export function buildAelFinalReport(input: {
  enabled: boolean;
  initialPrompt: string;
  domain: string;
  cyclesExecuted: number;
  aeeFurthestStage: AeeStage | null;
  productRealityScore: number;
  founderLoopResult: string;
  capabilitiesEvolved: readonly string[];
  autofixAttempts: number;
  previewRecoveryAttempts: number;
  capabilityEvolutionAttempts: number;
  finalOutcome: AelFinalOutcome;
  remainingGaps: readonly string[];
  humanReviewRequired: boolean;
  cycleHistory: readonly AelCycleRecord[];
}): AelFinalReport {
  return {
    readOnly: true,
    enabled: input.enabled,
    initialPrompt: input.initialPrompt,
    domain: input.domain,
    cyclesExecuted: input.cyclesExecuted,
    aeeFurthestStage: input.aeeFurthestStage,
    productRealityScore: input.productRealityScore,
    founderLoopResult: input.founderLoopResult,
    capabilitiesEvolved: input.capabilitiesEvolved,
    autofixAttempts: input.autofixAttempts,
    previewRecoveryAttempts: input.previewRecoveryAttempts,
    capabilityEvolutionAttempts: input.capabilityEvolutionAttempts,
    finalOutcome: input.finalOutcome,
    remainingGaps: input.remainingGaps,
    humanReviewRequired: input.humanReviewRequired,
    cycleHistory: input.cycleHistory,
    recordedAt: new Date().toISOString(),
  };
}

export function formatAelReportMarkdown(report: AelFinalReport): string {
  const lines = [
    '# Autonomous Engineering Loop Report',
    '',
    `**Recorded:** ${report.recordedAt}`,
    `**AEL Enabled:** ${report.enabled}`,
    `**Final Outcome:** ${report.finalOutcome}`,
    `**Cycles Executed:** ${report.cyclesExecuted}`,
    '',
    '## Prompt',
    '',
    report.initialPrompt.slice(0, 500),
    '',
    '## Summary',
    '',
    `- Domain: ${report.domain}`,
    `- AEE furthest stage: ${report.aeeFurthestStage ?? 'unknown'}`,
    `- Product Reality score: ${report.productRealityScore}/100`,
    `- Founder Loop result: ${report.founderLoopResult}`,
    `- Capabilities evolved: ${report.capabilitiesEvolved.join(', ') || 'none'}`,
    `- AutoFix attempts: ${report.autofixAttempts}`,
    `- Preview recovery attempts: ${report.previewRecoveryAttempts}`,
    `- Capability evolution attempts: ${report.capabilityEvolutionAttempts}`,
    `- Human review required: ${report.humanReviewRequired ? 'yes' : 'no'}`,
    '',
  ];

  if (report.remainingGaps.length > 0) {
    lines.push('## Remaining Gaps', '');
    for (const gap of report.remainingGaps) {
      lines.push(`- ${gap}`);
    }
    lines.push('');
  }

  if (report.cycleHistory.length > 0) {
    lines.push('## Cycle History', '');
    lines.push('| Cycle | State | PRE Score | Founder | Decision |');
    lines.push('|-------|-------|-----------|---------|----------|');
    for (const cycle of report.cycleHistory) {
      lines.push(
        `| ${cycle.cycle} | ${cycle.state} | ${cycle.productRealityScore} | ${cycle.founderVerdict} | ${cycle.decision} |`,
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeAelReportArtifacts(input: {
  projectRootDir: string;
  buildRunId: string;
  report: AelFinalReport;
}): { json: string; markdown: string } {
  const runDir = join(input.projectRootDir, '.generated-build-history', input.buildRunId);
  mkdirSync(runDir, { recursive: true });
  const jsonPath = join(runDir, 'ael-report.json');
  const mdPath = join(runDir, 'ael-report.md');
  const json = JSON.stringify(input.report, null, 2) + '\n';
  const markdown = formatAelReportMarkdown(input.report);
  writeFileSync(jsonPath, json, 'utf8');
  writeFileSync(mdPath, markdown, 'utf8');
  return { json: jsonPath, markdown: mdPath };
}

export function buildAelCycleRecord(input: {
  cycle: number;
  state: AelState;
  productRealityScore: number;
  founderVerdict: string;
  decision: string;
  repairAction: string | null;
}): AelCycleRecord {
  return {
    readOnly: true,
    cycle: input.cycle,
    state: input.state,
    productRealityScore: input.productRealityScore,
    founderVerdict: input.founderVerdict,
    decision: input.decision as AelCycleRecord['decision'],
    repairAction: input.repairAction,
  };
}

export function summarizeAelEvidenceForResponse(evidence: AelEvidenceBundle, report: AelFinalReport): Record<string, unknown> {
  return {
    aelEnabled: report.enabled,
    aelCyclesExecuted: report.cyclesExecuted,
    aeeFurthestStage: report.aeeFurthestStage,
    productRealityScore: report.productRealityScore,
    founderLoopResult: report.founderLoopResult,
    capabilitiesEvolved: report.capabilitiesEvolved,
    autofixAttempts: report.autofixAttempts,
    previewRecoveryAttempts: report.previewRecoveryAttempts,
    capabilityEvolutionAttempts: report.capabilityEvolutionAttempts,
    finalOutcome: report.finalOutcome,
    remainingGaps: report.remainingGaps,
    humanReviewRequired: report.humanReviewRequired,
    aelFinalState: report.finalOutcome,
    npmBuildOk: evidence.npmBuildOk,
    previewOk: evidence.previewOk,
    previewDegraded: evidence.previewDegraded,
  };
}
