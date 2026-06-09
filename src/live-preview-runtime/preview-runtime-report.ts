/**
 * Preview runtime report composer and failure context.
 */

import type { PreviewRuntimeReport, PreviewSession } from './types.js';
import { isLivePreviewQuestion } from './types.js';

let reportCounter = 0;

export function resetPreviewReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextPreviewReportId(): string {
  reportCounter += 1;
  return `pvrep-${reportCounter.toString().padStart(4, '0')}`;
}

export function composePreviewResponse(
  query: string,
  report: PreviewRuntimeReport,
  session: PreviewSession | null,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Live Preview Runtime Response', ''];

  lines.push(`Report: ${report.reportId}`);
  lines.push(`State: ${report.state}`);
  lines.push(`Valid: ${report.valid}`);
  lines.push(`Gates: ${report.gatesPassed}/${report.gatesEvaluated}`);
  lines.push(report.summary);
  lines.push('');

  if (lower.includes('blocked') || lower.includes('why is preview')) {
    lines.push('Blocked reasons:');
    for (const b of session?.blockedReasons ?? ['No preview session prepared']) {
      lines.push(`• ${b}`);
    }
  }

  if (lower.includes('capabilities') || lower.includes('what preview capabilities')) {
    lines.push('Tracked capabilities (not implemented in Phase 16.1):');
    for (const c of session?.previewCapabilities ?? []) {
      lines.push(`• ${c} — tracked only`);
    }
  }

  if (lower.includes('targets') || lower.includes('target')) {
    lines.push(`Target: ${session?.previewTargetName ?? 'none'} (${session?.previewTargetType ?? 'UNKNOWN_TARGET'})`);
  }

  if (session) {
    lines.push('');
    lines.push(`Session: ${session.previewSessionId}`);
    lines.push(`Project: ${session.projectId}`);
    lines.push(`Workspace: ${session.workspaceId}`);
    lines.push(`State: ${session.previewState}`);
    lines.push(`URL: ${session.previewUrl ?? 'not set'}`);
  }

  lines.push('');
  lines.push('Management only — no browser launch, screenshots, interaction testing, or self vision.');
  return lines.join('\n');
}

export interface PreviewFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildPreviewFailureContext(query: string): PreviewFailureContext[] {
  if (!isLivePreviewQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: PreviewFailureContext[] = [
    {
      title: 'Preview blocked: Phase 16.1 management only',
      description: 'No UI inspection, screenshots, or browser launch in this phase',
      sourceSystem: 'live_preview_runtime',
      severity: 'CRITICAL',
    },
  ];

  if (lower.includes('project') || lower.includes('missing project')) {
    records.push({
      title: 'Missing project',
      description: 'Project must exist before preview target registration',
      sourceSystem: 'project_understanding',
      severity: 'HIGH',
    });
  }

  if (lower.includes('workspace') || lower.includes('missing workspace')) {
    records.push({
      title: 'Missing workspace',
      description: 'Workspace must exist for preview isolation',
      sourceSystem: 'workspace_intelligence',
      severity: 'HIGH',
    });
  }

  if (lower.includes('target') || lower.includes('missing target')) {
    records.push({
      title: 'Missing target',
      description: 'Preview target must be registered before session creation',
      sourceSystem: 'live_preview_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('duplicate target')) {
    records.push({
      title: 'Duplicate preview target',
      description: 'Same project/workspace/target name cannot register twice',
      sourceSystem: 'live_preview_runtime',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('duplicate session')) {
    records.push({
      title: 'Duplicate preview session',
      description: 'Active preview session already exists for this target',
      sourceSystem: 'live_preview_runtime',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 protection violation',
      description: 'Preview must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  return records;
}
