/**
 * Preview context analyzer — combines session, target, and workspace context.
 */

import type { PreviewSession, PreviewTargetMetadata, PreviewTargetType } from '../live-preview-runtime/types.js';

export interface PreviewContextAnalysis {
  hasSession: boolean;
  hasTarget: boolean;
  projectId: string;
  workspaceId: string;
  targetType: PreviewTargetType;
  targetName: string;
  previewUrl: string | null;
  sessionState: string | null;
  projectExists: boolean;
  workspaceExists: boolean;
  workspaceReady: boolean;
  ownershipValid: boolean;
  isVisualTarget: boolean;
  isNonVisualTarget: boolean;
  requiresDesktopPath: boolean;
  basis: string[];
}

export function analyzePreviewContext(opts: {
  session: PreviewSession | null;
  target: PreviewTargetMetadata | null;
  projectExists: boolean;
  workspaceExists: boolean;
  workspaceReady: boolean;
  ownershipValid: boolean;
  targetType?: PreviewTargetType;
  targetName?: string;
  projectId?: string;
  workspaceId?: string;
  previewUrl?: string | null;
}): PreviewContextAnalysis {
  const session = opts.session;
  const target = opts.target;
  const targetType = session?.previewTargetType ?? target?.targetType ?? opts.targetType ?? 'UNKNOWN_TARGET';
  const projectId = session?.projectId ?? target?.projectId ?? opts.projectId ?? 'unknown';
  const workspaceId = session?.workspaceId ?? target?.workspaceId ?? opts.workspaceId ?? 'unknown';
  const targetName = session?.previewTargetName ?? target?.targetName ?? opts.targetName ?? 'unknown';
  const previewUrl = session?.previewUrl ?? target?.previewUrl ?? opts.previewUrl ?? null;

  const isVisualTarget =
    targetType === 'WEB_APP' ||
    targetType === 'STATIC_PAGE' ||
    targetType === 'MOBILE_APP' ||
    targetType === 'DESKTOP_APP';
  const isNonVisualTarget = targetType === 'API_SERVICE' || targetType === 'BACKGROUND_RUNTIME';
  const requiresDesktopPath = targetType === 'MOBILE_APP';

  const basis: string[] = [];
  if (session) basis.push(`Preview session ${session.previewSessionId} (${session.previewState})`);
  if (target) basis.push(`Preview target ${target.targetName} (${target.targetType})`);
  if (!opts.projectExists) basis.push('Project context missing');
  if (!opts.workspaceExists) basis.push('Workspace context missing');
  if (!opts.workspaceReady) basis.push('Workspace not ready for preview intelligence');
  if (!opts.ownershipValid) basis.push('Preview intelligence ownership invalid');

  return {
    hasSession: session !== null,
    hasTarget: target !== null,
    projectId,
    workspaceId,
    targetType,
    targetName,
    previewUrl,
    sessionState: session?.previewState ?? null,
    projectExists: opts.projectExists,
    workspaceExists: opts.workspaceExists,
    workspaceReady: opts.workspaceReady,
    ownershipValid: opts.ownershipValid,
    isVisualTarget,
    isNonVisualTarget,
    requiresDesktopPath,
    basis,
  };
}
