/**
 * Interaction testing report builder and response composer.
 */

import type { InteractionTestingReport, InteractionState } from './types.js';
import { isInteractionTestingQuestion } from './types.js';

let reportCounter = 0;

export function resetInteractionTestingReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextInteractionTestId(): string {
  reportCounter += 1;
  return `itest-${reportCounter.toString().padStart(4, '0')}`;
}

export function buildInteractionTestingReport(
  partial: Omit<InteractionTestingReport, 'interactionTestId' | 'createdAt' | 'testingOnly'>,
): InteractionTestingReport {
  return {
    interactionTestId: nextInteractionTestId(),
    ...partial,
    createdAt: Date.now(),
    testingOnly: true,
  };
}

export function composeInteractionTestingResponse(
  query: string,
  report: InteractionTestingReport,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Interaction Testing Engine Response', ''];

  lines.push(`Test ID: ${report.interactionTestId}`);
  lines.push(`Inspection: ${report.inspectionId ?? 'none'}`);
  lines.push(`Self Vision Session: ${report.selfVisionSessionId ?? 'none'}`);
  lines.push(`State: ${report.interactionState}`);
  lines.push(`Plans: ${report.interactionPlans.length}`);
  lines.push(`Executed: ${report.executedInteractions.length}`);
  lines.push(`Results: ${report.interactionResults.length}`);
  lines.push('');

  if (lower.includes('button') || lower.includes('discovered')) {
    lines.push('Button interactions:');
    for (const r of report.interactionResults.filter(
      (x) => x.interactionType === 'BUTTON_INTERACTION' || x.interactionType === 'MENU_INTERACTION',
    )) {
      lines.push(`• ${r.target}: ${r.observedOutcome}`);
    }
  }

  if (lower.includes('navigation') || lower.includes('route') || lower.includes('path')) {
    lines.push('Navigation interactions:');
    for (const r of report.interactionResults.filter(
      (x) =>
        x.interactionType === 'NAVIGATION_INTERACTION' ||
        x.interactionType === 'ROUTE_INTERACTION' ||
        x.interactionType === 'TAB_INTERACTION',
    )) {
      lines.push(`• ${r.target}: ${r.observedOutcome}`);
    }
  }

  if (lower.includes('workflow')) {
    lines.push('Workflow interactions:');
    for (const r of report.interactionResults.filter((x) => x.interactionType === 'WORKFLOW_INTERACTION')) {
      lines.push(`• ${r.target}: ${r.observedOutcome}`);
    }
  }

  if (lower.includes('outcome') || lower.includes('results') || lower.includes('tested')) {
    lines.push('Interaction outcomes:');
    for (const r of report.interactionResults.slice(0, 10)) {
      lines.push(`• [${r.interactionType}] ${r.target}: ${r.observedOutcome}`);
    }
  }

  if (report.blockedReasons.length > 0) {
    lines.push('Blocked reasons:');
    for (const b of report.blockedReasons) lines.push(`• ${b}`);
  }

  lines.push('');
  lines.push('Testing only — no correctness verdicts, quality scoring, or visual regression pass/fail.');
  return lines.join('\n');
}

export interface InteractionTestingFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildInteractionTestingFailureContext(query: string): InteractionTestingFailureContext[] {
  if (!isInteractionTestingQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: InteractionTestingFailureContext[] = [
    {
      title: 'Interaction testing: simulation only',
      description: 'Phase 16.5 records interaction outcomes without correctness verdicts',
      sourceSystem: 'interaction_testing_engine',
      severity: 'LOW',
    },
  ];

  if (lower.includes('inspection') || lower.includes('missing inspection')) {
    records.push({
      title: 'Missing inspection report',
      description: 'UI inspection report required before interaction testing',
      sourceSystem: 'ui_inspection_engine',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('self vision') || lower.includes('missing session')) {
    records.push({
      title: 'Missing self vision session',
      description: 'Self vision session required for interaction context',
      sourceSystem: 'self_vision_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('preview context') || lower.includes('missing preview')) {
    records.push({
      title: 'Missing preview context',
      description: 'Preview context required for interaction linkage',
      sourceSystem: 'live_preview_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('blocked') || lower.includes('interaction blocked')) {
    records.push({
      title: 'Interaction blocked',
      description: 'Interaction testing gates failed',
      sourceSystem: 'interaction_testing_engine',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('surface unavailable') || lower.includes('unavailable')) {
    records.push({
      title: 'Surface unavailable',
      description: 'Interaction surface not available from inspection report',
      sourceSystem: 'interaction_testing_engine',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('workflow unavailable')) {
    records.push({
      title: 'Workflow unavailable',
      description: 'Workflow path not available for interaction testing',
      sourceSystem: 'interaction_testing_engine',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 protection violation',
      description: 'Interaction testing must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  return records;
}
