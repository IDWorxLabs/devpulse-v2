/**
 * Preview source engine — evaluates preview source status from cloud workspace.
 * Viewer only. Does not mutate preview source of truth.
 */

import type { GateRecord, PreviewSessionInput, PreviewSourceStatus, PreviewTarget, PreviewType } from './types.js';

export interface PreviewSourceEvaluation {
  sourceStatus: PreviewSourceStatus;
  previewType: PreviewType;
  gates: GateRecord[];
  warnings: string[];
}

export function evaluatePreviewSource(input: PreviewSessionInput): PreviewSourceEvaluation {
  const gates: GateRecord[] = [];
  const warnings: string[] = [];
  const status = input.previewSourceStatus;

  gates.push({
    gateId: 'src-status-0001',
    gateType: 'PREVIEW_SOURCE',
    status: status === 'AVAILABLE' ? 'OPEN' : status === 'BUILDING' ? 'REQUIRED' : 'CLOSED',
    description: `Preview source status: ${status}`,
  });

  if (status === 'NOT_CREATED') {
    warnings.push('Preview not yet created in cloud workspace.');
    return { sourceStatus: status, previewType: 'UNAVAILABLE', gates, warnings };
  }
  if (status === 'FAILED') {
    warnings.push('Preview source failed — check cloud workspace build status.');
    return { sourceStatus: status, previewType: 'UNAVAILABLE', gates, warnings };
  }
  if (status === 'STALE') {
    warnings.push('Preview source is stale — refresh recommended.');
  }
  if (status === 'UNKNOWN') {
    warnings.push('Preview source status unknown — summary only.');
    return { sourceStatus: status, previewType: 'SUMMARY_ONLY', gates, warnings };
  }
  if (status === 'BUILDING') {
    warnings.push('Preview is building in cloud workspace — summary only until ready.');
    return { sourceStatus: status, previewType: 'SUMMARY_ONLY', gates, warnings };
  }

  const previewType = classifyPreviewType(input.previewTarget, status);
  return { sourceStatus: status, previewType, gates, warnings };
}

export function classifyPreviewType(target: PreviewTarget, status: PreviewSourceStatus): PreviewType {
  if (status === 'NOT_CREATED' || status === 'FAILED') return 'UNAVAILABLE';
  if (status !== 'AVAILABLE' && status !== 'STALE') return 'SUMMARY_ONLY';
  if (target === 'UNKNOWN') return 'UNAVAILABLE';
  if (target === 'DESKTOP_APP') return 'DESKTOP_REQUIRED_NOTICE';
  if (target === 'WEB_APP') return 'RESPONSIVE_SCREEN_SUMMARY';
  if (target === 'MOBILE_APP') return 'RESPONSIVE_SCREEN_SUMMARY';
  if (target === 'BUILD_PROGRESS') return 'SUMMARY_ONLY';
  if (target === 'SYSTEM_TOPOLOGY') return 'SUMMARY_ONLY';
  if (target === 'BACKEND_API') return 'SUMMARY_ONLY';
  if (target === 'PROJECT_OVERVIEW') return 'SUMMARY_ONLY';
  return 'STATIC_SNAPSHOT';
}

export function previewSourceKey(status: PreviewSourceStatus, type: PreviewType): string {
  return `${status}|${type}`;
}
