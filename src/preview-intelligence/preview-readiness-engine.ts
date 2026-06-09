/**
 * Preview readiness engine — evaluates readiness level and score.
 */

import type { PreviewContextAnalysis } from './preview-context-analyzer.js';
import type { PreviewLimitationRecord } from './types.js';
import type { PreviewReadinessLevel } from './types.js';

export interface PreviewReadinessResult {
  readinessLevel: PreviewReadinessLevel;
  readinessScore: number;
  blockedReasons: string[];
  warnings: string[];
}

export function evaluatePreviewReadiness(
  context: PreviewContextAnalysis,
  limitations: PreviewLimitationRecord[],
): PreviewReadinessResult {
  const blockedReasons: string[] = [];
  const warnings: string[] = [];

  if (!context.hasSession) {
    blockedReasons.push('Missing preview session — intelligence requires an active preview session');
  }
  if (!context.hasTarget) {
    blockedReasons.push('Missing preview target — target metadata required for intelligence');
  }
  if (context.targetType === 'UNKNOWN_TARGET') {
    blockedReasons.push('Unknown target type — classify target before preview intelligence');
  }
  if (!context.workspaceReady) {
    blockedReasons.push('Workspace not ready for preview intelligence');
  }
  if (!context.projectExists) {
    blockedReasons.push('Project context missing');
  }
  if (!context.workspaceExists) {
    blockedReasons.push('Workspace context missing');
  }
  if (!context.ownershipValid) {
    blockedReasons.push('Preview intelligence ownership gate failed');
  }
  if (context.sessionState === 'PREVIEW_BLOCKED') {
    blockedReasons.push('Preview session is blocked at runtime layer');
  }

  for (const lim of limitations) {
    if (lim.limitation === 'MOBILE_PREVIEW_REQUIRES_DESKTOP') {
      warnings.push(lim.description);
    } else if (lim.severity === 'CRITICAL' || lim.severity === 'HIGH') {
      if (lim.limitation === 'MISSING_PREVIEW_SESSION' || lim.limitation === 'MISSING_PREVIEW_TARGET') {
        blockedReasons.push(lim.description);
      } else {
        warnings.push(lim.description);
      }
    }
  }

  if (blockedReasons.length > 0) {
    return {
      readinessLevel: 'BLOCKED',
      readinessScore: 0,
      blockedReasons,
      warnings,
    };
  }

  if (context.isNonVisualTarget) {
    return {
      readinessLevel: 'PARTIALLY_READY',
      readinessScore: 35,
      blockedReasons,
      warnings: [
        ...warnings,
        'Non-visual target — recommend API health or logs/status preview instead of UI observation',
      ],
    };
  }

  if (context.targetType === 'UNKNOWN_TARGET') {
    return {
      readinessLevel: 'BLOCKED',
      readinessScore: 0,
      blockedReasons: ['Unknown target type'],
      warnings,
    };
  }

  const criticalLimitations = limitations.filter(
    (l) => l.severity === 'CRITICAL' || l.severity === 'HIGH',
  );

  if (!context.previewUrl && context.isVisualTarget) {
    return {
      readinessLevel: 'NOT_READY',
      readinessScore: 25,
      blockedReasons,
      warnings: [...warnings, 'No preview URL — visual observation deferred until URL is available'],
    };
  }

  if (context.requiresDesktopPath) {
    const hasDesktopWarning = limitations.some((l) => l.limitation === 'MOBILE_PREVIEW_REQUIRES_DESKTOP');
    if (hasDesktopWarning) {
      return {
        readinessLevel: 'PARTIALLY_READY',
        readinessScore: 50,
        blockedReasons,
        warnings: [
          ...warnings,
          'Mobile preview requires desktop/laptop compatible preview path before heavy inspection',
        ],
      };
    }
    return {
      readinessLevel: 'READY_FOR_FUTURE_SELF_VISION',
      readinessScore: 75,
      blockedReasons,
      warnings: [...warnings, 'Mobile target ready for future Self Vision with desktop-compatible path'],
    };
  }

  if (criticalLimitations.length > 2) {
    return {
      readinessLevel: 'PARTIALLY_READY',
      readinessScore: 45,
      blockedReasons,
      warnings,
    };
  }

  if (context.targetType === 'WEB_APP' || context.targetType === 'STATIC_PAGE') {
    return {
      readinessLevel: 'READY_FOR_OBSERVATION',
      readinessScore: context.previewUrl ? 85 : 60,
      blockedReasons,
      warnings,
    };
  }

  if (context.targetType === 'DESKTOP_APP') {
    return {
      readinessLevel: 'READY_FOR_FUTURE_SELF_VISION',
      readinessScore: 80,
      blockedReasons,
      warnings,
    };
  }

  return {
    readinessLevel: 'UNKNOWN',
    readinessScore: 20,
    blockedReasons,
    warnings: [...warnings, 'Insufficient context to determine preview readiness'],
  };
}
