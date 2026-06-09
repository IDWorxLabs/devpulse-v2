/**
 * Self Vision runtime report composer and failure context.
 */

import type { SelfVisionRuntimeReport, SelfVisionSession } from './types.js';
import { isSelfVisionRuntimeQuestion } from './types.js';

let reportCounter = 0;

export function resetSelfVisionReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextSelfVisionReportId(): string {
  reportCounter += 1;
  return `svrep-${reportCounter.toString().padStart(4, '0')}`;
}

export function composeSelfVisionResponse(
  query: string,
  report: SelfVisionRuntimeReport,
  session: SelfVisionSession | null,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Self Vision Runtime Response', ''];

  lines.push(`Report: ${report.reportId}`);
  lines.push(`State: ${report.state}`);
  lines.push(`Valid: ${report.valid}`);
  lines.push(`Gates: ${report.gatesPassed}/${report.gatesEvaluated}`);
  lines.push(report.summary);
  lines.push('');

  if (lower.includes('blocked') || lower.includes('why is self vision')) {
    lines.push('Blocked reasons:');
    for (const b of session?.blockedReasons ?? ['No self vision session prepared']) {
      lines.push(`• ${b}`);
    }
  }

  if (lower.includes('target') || lower.includes('observation target')) {
    lines.push('Observation targets (planned only):');
    for (const t of report.observationTargets) {
      lines.push(`• ${t.target} [P${t.priority}]: ${t.rationale}`);
    }
  }

  if (lower.includes('capture plan') || lower.includes('capture')) {
    lines.push('Capture plan (deferred):');
    for (const c of session?.capturePlan ?? []) {
      lines.push(`• ${c.captureType} [P${c.priority}]: ${c.rationale}`);
    }
  }

  if (lower.includes('capabilit')) {
    lines.push('Tracked observation capabilities (not executed):');
    for (const c of session?.observationCapabilities ?? []) {
      lines.push(`• ${c} — tracked only`);
    }
  }

  if (session) {
    lines.push('');
    lines.push(`Self Vision Session: ${session.selfVisionSessionId}`);
    lines.push(`Preview Session: ${session.previewSessionId}`);
    lines.push(`Project: ${session.projectId}`);
    lines.push(`Workspace: ${session.workspaceId}`);
    lines.push(`Target type: ${session.targetType}`);
    lines.push(`Observation state: ${session.observationState}`);
  }

  lines.push('');
  lines.push('Runtime only — no screenshot analysis, UI inspection, interaction testing, or visual verification.');
  return lines.join('\n');
}

export interface SelfVisionFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildSelfVisionFailureContext(query: string): SelfVisionFailureContext[] {
  if (!isSelfVisionRuntimeQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: SelfVisionFailureContext[] = [
    {
      title: 'Self vision blocked: Phase 16.3 runtime only',
      description: 'No layout inspection, screenshot analysis, or interaction testing in this phase',
      sourceSystem: 'self_vision_runtime',
      severity: 'CRITICAL',
    },
  ];

  if (lower.includes('preview session') || lower.includes('missing preview session')) {
    records.push({
      title: 'Missing preview session',
      description: 'Preview session required before self vision session creation',
      sourceSystem: 'live_preview_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('preview target') || lower.includes('missing target')) {
    records.push({
      title: 'Missing preview target',
      description: 'Preview target must be registered before self vision session',
      sourceSystem: 'live_preview_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('workspace') || lower.includes('missing workspace')) {
    records.push({
      title: 'Missing workspace',
      description: 'Workspace must exist for observation isolation',
      sourceSystem: 'workspace_intelligence',
      severity: 'HIGH',
    });
  }

  if (lower.includes('project') || lower.includes('missing project')) {
    records.push({
      title: 'Missing project',
      description: 'Project must exist for self vision association',
      sourceSystem: 'project_understanding',
      severity: 'HIGH',
    });
  }

  if (lower.includes('duplicate')) {
    records.push({
      title: 'Duplicate self vision session',
      description: 'One self vision session per preview session is allowed',
      sourceSystem: 'self_vision_runtime',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 protection violation',
      description: 'Self vision must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('capture unavailable') || lower.includes('capture')) {
    records.push({
      title: 'Capture unavailable',
      description: 'Capture plan prepared only — no capture execution in Phase 16.3',
      sourceSystem: 'self_vision_runtime',
      severity: 'MEDIUM',
    });
  }

  return records;
}
