/**
 * Preview intelligence report builder and response composer.
 */

import type { PreviewIntelligenceReport } from './types.js';
import { isPreviewIntelligenceQuestion } from './types.js';

let reportCounter = 0;

export function resetPreviewIntelligenceReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextPreviewIntelligenceId(): string {
  reportCounter += 1;
  return `pvint-${reportCounter.toString().padStart(4, '0')}`;
}

export function buildPreviewIntelligenceReport(
  partial: Omit<PreviewIntelligenceReport, 'previewIntelligenceId' | 'createdAt' | 'intelligenceOnly'>,
): PreviewIntelligenceReport {
  return {
    previewIntelligenceId: nextPreviewIntelligenceId(),
    ...partial,
    createdAt: Date.now(),
    intelligenceOnly: true,
  };
}

export function composePreviewIntelligenceResponse(
  query: string,
  report: PreviewIntelligenceReport,
): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['Preview Intelligence Response', ''];

  lines.push(`Intelligence ID: ${report.previewIntelligenceId}`);
  lines.push(`Session: ${report.previewSessionId ?? 'none'}`);
  lines.push(`Target type: ${report.targetType}`);
  lines.push(`Readiness: ${report.readinessLevel} (score ${report.readinessScore})`);
  lines.push('');

  if (lower.includes('ready') || lower.includes('not ready')) {
    lines.push('Readiness assessment:');
    lines.push(`• Level: ${report.readinessLevel}`);
    lines.push(`• Score: ${report.readinessScore}/100`);
    if (report.blockedReasons.length > 0) {
      lines.push('Blocked reasons:');
      for (const b of report.blockedReasons) lines.push(`  - ${b}`);
    }
  }

  if (lower.includes('limitation') || lower.includes('blocked') || lower.includes('why')) {
    lines.push('Limitations:');
    for (const l of report.limitations) {
      lines.push(`• ${l.limitation}: ${l.description}`);
    }
  }

  if (lower.includes('capabilit') || lower.includes('missing')) {
    lines.push('Capability summary:');
    for (const c of report.capabilitySummary) {
      const status = c.available ? 'available' : c.missing ? 'missing' : 'tracked';
      lines.push(`• ${c.capability}: ${status}${c.blockedReason ? ` (${c.blockedReason})` : ''}`);
    }
  }

  if (lower.includes('observe') || lower.includes('observation') || lower.includes('self vision')) {
    lines.push('Observation plan (future only):');
    for (const o of report.observationPlan) {
      lines.push(`• ${o.observation} [P${o.priority}]${o.deferred ? ' (deferred)' : ''}: ${o.rationale}`);
    }
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) lines.push(`• ${w}`);
  }

  lines.push('');
  lines.push('Intelligence only — no browser launch, screenshots, UI inspection, interaction testing, Self Vision, or visual verification.');
  return lines.join('\n');
}

export interface PreviewIntelligenceFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildPreviewIntelligenceFailureContext(query: string): PreviewIntelligenceFailureContext[] {
  if (!isPreviewIntelligenceQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: PreviewIntelligenceFailureContext[] = [
    {
      title: 'Preview intelligence: reasoning only',
      description: 'Phase 16.2 produces intelligence around preview state — no visual execution',
      sourceSystem: 'preview_intelligence',
      severity: 'LOW',
    },
  ];

  if (lower.includes('session') || lower.includes('missing session')) {
    records.push({
      title: 'Missing preview session',
      description: 'Preview session required before intelligence analysis',
      sourceSystem: 'preview_intelligence',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('target') || lower.includes('missing target')) {
    records.push({
      title: 'Missing preview target',
      description: 'Preview target metadata required for intelligence',
      sourceSystem: 'preview_intelligence',
      severity: 'HIGH',
    });
  }

  if (lower.includes('unknown target') || lower.includes('unknown type')) {
    records.push({
      title: 'Unknown target type',
      description: 'Target must be classified before preview intelligence',
      sourceSystem: 'preview_intelligence',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('url') || lower.includes('no preview url')) {
    records.push({
      title: 'Missing preview URL',
      description: 'Visual targets need a preview URL for observation planning',
      sourceSystem: 'preview_intelligence',
      severity: 'HIGH',
    });
  }

  if (lower.includes('screen capture') || lower.includes('screenshot')) {
    records.push({
      title: 'Missing screen capture',
      description: 'Screen capture not implemented in Phase 16.2',
      sourceSystem: 'preview_intelligence',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('self vision')) {
    records.push({
      title: 'Missing Self Vision runtime',
      description: 'Self Vision runtime not connected — observation plan only',
      sourceSystem: 'preview_intelligence',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('mobile')) {
    records.push({
      title: 'Mobile preview requires desktop',
      description: 'Mobile app needs desktop-compatible preview path before heavy inspection',
      sourceSystem: 'preview_intelligence',
      severity: 'HIGH',
    });
  }

  if (lower.includes('api') || lower.includes('non visual') || lower.includes('background')) {
    records.push({
      title: 'Non-visual target',
      description: 'API/background targets are not directly visual — use health/logs preview',
      sourceSystem: 'preview_intelligence',
      severity: 'MEDIUM',
    });
  }

  return records;
}
