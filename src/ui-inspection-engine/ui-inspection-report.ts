/**
 * UI inspection report builder and response composer.
 */

import type { UiInspectionReport, InspectionState } from './types.js';
import { isUiInspectionQuestion } from './types.js';

let reportCounter = 0;

export function resetUiInspectionReportCounterForTests(): void {
  reportCounter = 0;
}

export function nextInspectionId(): string {
  reportCounter += 1;
  return `uinsp-${reportCounter.toString().padStart(4, '0')}`;
}

export function buildUiInspectionReport(
  partial: Omit<UiInspectionReport, 'inspectionId' | 'createdAt' | 'inspectionOnly'>,
): UiInspectionReport {
  return {
    inspectionId: nextInspectionId(),
    ...partial,
    createdAt: Date.now(),
    inspectionOnly: true,
  };
}

export function composeUiInspectionResponse(query: string, report: UiInspectionReport): string {
  const lower = query.toLowerCase();
  const lines: string[] = ['UI Inspection Engine Response', ''];

  lines.push(`Inspection ID: ${report.inspectionId}`);
  lines.push(`Self Vision Session: ${report.selfVisionSessionId ?? 'none'}`);
  lines.push(`State: ${report.inspectionState}`);
  lines.push(`Surfaces inspected: ${report.inspectedSurfaces.length}`);
  lines.push('');

  if (lower.includes('layout') || lower.includes('structures')) {
    lines.push('Layout structures:');
    for (const l of report.layoutStructures) {
      lines.push(`• ${l.structureId}: header=${l.headerPresent}, sidebar=${l.sidebarPresent}, panels=${l.panelCount}`);
      lines.push(`  Regions: ${l.layoutRegions.join(', ')}`);
    }
  }

  if (lower.includes('navigation')) {
    lines.push('Navigation structures:');
    for (const n of report.navigationStructures) {
      lines.push(`• ${n.structureId}: areas=${n.navigationAreas.join(', ')}`);
      lines.push(`  Menus: ${n.menuStructures.join(', ')}`);
    }
  }

  if (lower.includes('loading')) {
    lines.push('Loading structures:');
    for (const l of report.loadingStructures) {
      lines.push(`• ${l.structureId}: indicators=${l.loadingIndicators.join(', ')}`);
      lines.push(`  Empty states: ${l.emptyStates.join(', ')}`);
    }
  }

  if (lower.includes('responsive')) {
    lines.push('Responsive structures:');
    for (const r of report.responsiveStructures) {
      lines.push(`• ${r.structureId}: mobile=${r.mobileSurfaces.length}, tablet=${r.tabletSurfaces.length}, desktop=${r.desktopSurfaces.length}`);
    }
  }

  if (report.blockedReasons.length > 0) {
    lines.push('Blocked reasons:');
    for (const b of report.blockedReasons) lines.push(`• ${b}`);
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const w of report.warnings) lines.push(`• ${w}`);
  }

  lines.push('');
  lines.push('Inspection only — no clicking, interaction testing, visual verification, or quality scoring.');
  return lines.join('\n');
}

export interface UiInspectionFailureContext {
  title: string;
  description: string;
  sourceSystem: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export function buildUiInspectionFailureContext(query: string): UiInspectionFailureContext[] {
  if (!isUiInspectionQuestion(query)) return [];

  const lower = query.toLowerCase();
  const records: UiInspectionFailureContext[] = [
    {
      title: 'UI inspection: structure only',
      description: 'Phase 16.4 identifies UI structures without interaction or verification',
      sourceSystem: 'ui_inspection_engine',
      severity: 'LOW',
    },
  ];

  if (lower.includes('self vision') || lower.includes('missing session')) {
    records.push({
      title: 'Missing self vision session',
      description: 'Self vision session required before UI inspection',
      sourceSystem: 'self_vision_runtime',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('observation target') || lower.includes('missing target')) {
    records.push({
      title: 'Missing observation targets',
      description: 'Observation targets required for surface inspection',
      sourceSystem: 'self_vision_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('preview context') || lower.includes('missing preview')) {
    records.push({
      title: 'Missing preview context',
      description: 'Preview context required for inspection linkage',
      sourceSystem: 'live_preview_runtime',
      severity: 'HIGH',
    });
  }

  if (lower.includes('blocked') || lower.includes('inspection blocked')) {
    records.push({
      title: 'Inspection blocked',
      description: 'UI inspection gates failed — inspect session and context',
      sourceSystem: 'ui_inspection_engine',
      severity: 'CRITICAL',
    });
  }

  if (lower.includes('surface unavailable') || lower.includes('unavailable')) {
    records.push({
      title: 'Surface unavailable',
      description: 'Requested surface not available in observation targets',
      sourceSystem: 'ui_inspection_engine',
      severity: 'MEDIUM',
    });
  }

  if (lower.includes('world 1') || lower.includes('world1')) {
    records.push({
      title: 'World 1 protection violation',
      description: 'UI inspection must not target or modify World 1',
      sourceSystem: 'workspace_intelligence',
      severity: 'CRITICAL',
    });
  }

  return records;
}
