/**
 * Preview limitation analyzer — identifies preview constraints.
 */

import type { PreviewContextAnalysis } from './preview-context-analyzer.js';
import type { PreviewLimitationRecord } from './types.js';

export function analyzePreviewLimitations(context: PreviewContextAnalysis): PreviewLimitationRecord[] {
  const limitations: PreviewLimitationRecord[] = [];

  if (!context.hasSession) {
    limitations.push({
      limitation: 'MISSING_PREVIEW_SESSION',
      description: 'No preview session available for intelligence analysis',
      severity: 'CRITICAL',
    });
  }

  if (!context.hasTarget) {
    limitations.push({
      limitation: 'MISSING_PREVIEW_TARGET',
      description: 'No preview target registered for intelligence analysis',
      severity: 'CRITICAL',
    });
  }

  if (context.targetType === 'UNKNOWN_TARGET') {
    limitations.push({
      limitation: 'UNKNOWN_TARGET_TYPE',
      description: 'Target type unknown — classify before preview intelligence',
      severity: 'CRITICAL',
    });
  }

  if (!context.workspaceReady) {
    limitations.push({
      limitation: 'WORKSPACE_NOT_READY',
      description: 'Workspace is not ready for preview intelligence',
      severity: 'HIGH',
    });
  }

  if (context.isVisualTarget && !context.previewUrl) {
    limitations.push({
      limitation: 'NO_PREVIEW_URL',
      description: 'No preview URL — visual observation cannot be planned yet',
      severity: 'HIGH',
    });
  }

  limitations.push({
    limitation: 'NO_SCREEN_CAPTURE',
    description: 'Screen capture not implemented — tracked for future phases only',
    severity: 'MEDIUM',
  });

  limitations.push({
    limitation: 'NO_INTERACTION_LAYER',
    description: 'Interaction testing layer not implemented — tracked for future phases only',
    severity: 'MEDIUM',
  });

  limitations.push({
    limitation: 'NO_SELF_VISION_RUNTIME',
    description: 'Self Vision runtime not connected in Phase 16.2',
    severity: 'MEDIUM',
  });

  limitations.push({
    limitation: 'NO_VISUAL_VERIFICATION',
    description: 'Visual verification not implemented — tracked for future phases only',
    severity: 'MEDIUM',
  });

  if (context.requiresDesktopPath) {
    limitations.push({
      limitation: 'MOBILE_PREVIEW_REQUIRES_DESKTOP',
      description: 'Mobile app preview requires desktop/laptop compatible path before heavy inspection',
      severity: 'HIGH',
    });
  }

  if (context.targetType === 'API_SERVICE') {
    limitations.push({
      limitation: 'API_SERVICE_NOT_VISUAL',
      description: 'API service is not directly visual — recommend API health preview and separate UI surface',
      severity: 'HIGH',
    });
  }

  if (context.targetType === 'BACKGROUND_RUNTIME') {
    limitations.push({
      limitation: 'BACKGROUND_RUNTIME_NOT_VISUAL',
      description: 'Background runtime is not directly visual — recommend logs/status preview',
      severity: 'HIGH',
    });
  }

  return limitations;
}
