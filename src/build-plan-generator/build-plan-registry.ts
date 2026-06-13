/**
 * Build Plan Generator — registry constants (V1).
 */

export const BUILD_PLAN_GENERATOR_V1_PASS = 'BUILD_PLAN_GENERATOR_V1_PASS';

export const BUILD_PLAN_GENERATOR_OWNER_MODULE = 'build-plan-generator';

export const BUILD_PLAN_GENERATOR_PHASE = '26.32';

export const BUILD_PLAN_GENERATOR_REPORT_TITLE = 'Build Plan Generator Report';

export const MAX_BUILD_PLAN_HISTORY = 32;

export const BUILD_COMPLEXITY_CATEGORIES = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const;

export const BUILD_PLAN_READINESS_LEVELS = [
  'NOT_READY',
  'DRAFT_BUILD_PLAN',
  'READY_FOR_EXECUTION_PLANNING',
] as const;

export const ALLOWED_ARCHITECTURE_READINESS_FOR_BUILD = [
  'ARCHITECTURE_DRAFT_READY',
  'ARCHITECTURE_READY',
] as const;

export const STANDARD_MILESTONES = [
  'Foundation',
  'Authentication',
  'Data Layer',
  'Core Features',
  'Integrations',
  'Testing',
  'Launch Readiness',
] as const;

export const SAFETY_GUARANTEES = [
  'READ_ONLY_BUILD_PREPARATION',
  'NO_CODE_GENERATION',
  'NO_ARCHITECTURE_IMPLEMENTATION',
  'NO_PROJECT_MODIFICATION',
  'NO_AUTONOMOUS_BUILDING',
  'NO_EXECUTION',
  'ARCHITECTURE_READINESS_ENFORCED',
  'EVIDENCE_BASED_OUTPUTS_ONLY',
  'BOUNDED_PLAN_HISTORY',
] as const;
