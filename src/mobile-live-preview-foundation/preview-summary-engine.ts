/**
 * Preview summary engine — creates preview summary and warning packets only.
 * Viewer only. Cloud workspace remains source of truth.
 */

import type {
  PreviewSessionInput,
  PreviewSourceStatus,
  PreviewSummaryPacket,
  PreviewTarget,
  PreviewType,
} from './types.js';

let summaryCounter = 0;

export function resetPreviewSummaryCounterForTests(): void {
  summaryCounter = 0;
}

function createSummaryId(): string {
  summaryCounter += 1;
  return `preview-summary-${summaryCounter.toString().padStart(4, '0')}`;
}

export function generatePreviewSummary(
  input: PreviewSessionInput,
  previewType: PreviewType,
  sourceStatus: PreviewSourceStatus,
  mobileSafe: boolean,
  desktopRequired: boolean,
): { summary: string; warnings: string[]; packet: PreviewSummaryPacket } {
  const warnings: string[] = [];
  const projectId = input.projectId;

  if (sourceStatus === 'NOT_CREATED') {
    warnings.push('Preview not created — cloud workspace is building project artifacts.');
    return {
      summary: `Preview unavailable for ${projectId} — not yet created in cloud workspace.`,
      warnings,
      packet: buildPacket(input, previewType, 'Preview not yet available.'),
    };
  }

  if (sourceStatus === 'FAILED') {
    warnings.push('Preview source failed — check build logs in cloud workspace.');
    return {
      summary: `Preview failed for ${projectId} — cloud workspace reports failure.`,
      warnings,
      packet: buildPacket(input, previewType, 'Preview source failed.'),
    };
  }

  if (sourceStatus === 'BUILDING') {
    warnings.push('Preview is building — summary only until cloud workspace completes.');
    return {
      summary: `Preview building for ${projectId} — ${input.previewTarget} target in progress.`,
      warnings,
      packet: buildPacket(input, 'SUMMARY_ONLY', 'Build in progress.'),
    };
  }

  if (previewType === 'DESKTOP_REQUIRED_NOTICE' || desktopRequired) {
    warnings.push('Desktop preview recommended — mobile shows summary notice only.');
    return {
      summary: `Desktop preview required for ${input.previewTarget} on ${projectId}. Mobile summary available.`,
      warnings,
      packet: buildPacket(input, 'DESKTOP_REQUIRED_NOTICE', 'Desktop preview required.'),
    };
  }

  if (previewType === 'UNAVAILABLE') {
    warnings.push('Preview unavailable for requested target.');
    return {
      summary: `Preview unavailable for ${projectId} — target ${input.previewTarget}.`,
      warnings,
      packet: buildPacket(input, 'UNAVAILABLE', 'Preview unavailable.'),
    };
  }

  if (sourceStatus === 'STALE') {
    warnings.push('Preview source stale — request refresh from cloud workspace.');
  }

  const summaryText = mobileSafe
    ? `Mobile-safe ${input.previewTarget} preview summary for ${projectId} — viewer only, source: cloud workspace.`
    : `Preview summary for ${projectId} — ${input.previewTarget}, source: cloud workspace.`;

  return {
    summary: summaryText,
    warnings,
    packet: buildPacket(input, previewType, summaryText),
  };
}

function buildPacket(
  input: PreviewSessionInput,
  previewType: PreviewType,
  summaryText: string,
): PreviewSummaryPacket {
  return {
    summaryId: createSummaryId(),
    previewSessionId: input.previewSessionId,
    previewTarget: input.previewTarget,
    previewType,
    summaryText,
    sourceOfTruth: 'CLOUD_WORKSPACE',
    viewerOnly: true,
    executed: false,
  };
}

export function generateDesktopRequiredNotice(input: PreviewSessionInput): string {
  return `Desktop preview required for ${input.previewTarget} on project ${input.projectId}. Open DevPulse desktop for full preview.`;
}

export function summaryKey(summary: string, warningCount: number): string {
  return `${summary.slice(0, 50)}|${warningCount}`;
}
