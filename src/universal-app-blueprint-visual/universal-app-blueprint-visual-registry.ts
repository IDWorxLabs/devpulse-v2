/**
 * Universal App Blueprint Visual Validation Authority V1 — registry.
 */

export const UNIVERSAL_APP_BLUEPRINT_VISUAL_V1_PASS_TOKEN =
  'UNIVERSAL_APP_BLUEPRINT_VISUAL_V1_PASS' as const;

export const UNIVERSAL_APP_BLUEPRINT_VISUAL_OWNER_MODULE =
  'universal_app_blueprint_visual' as const;

export const UNIVERSAL_APP_BLUEPRINT_VISUAL_PHASE = 'blueprint-visual-validation-v1' as const;

export const BLUEPRINT_VISUAL_MIN_LAUNCH_SCORE = 80;

export const VIEWPORTS = {
  desktop: { width: 1280, height: 800, label: 'desktop' },
  tablet: { width: 768, height: 1024, label: 'tablet' },
  mobile: { width: 375, height: 667, label: 'mobile' },
} as const;
