/**
 * Maps V1 audit categories to V2 categories for inherited inventory entries.
 */

import type { AuditCategoryId as AuditCategoryIdV1 } from '../capability-audit-v1/capability-audit-types.js';
import type { AuditCategoryId } from './capability-audit-types.js';

const V1_TO_V2_CATEGORY: Partial<Record<AuditCategoryIdV1, AuditCategoryId>> = {
  IDEA_INTAKE: 'IDEA_INTAKE',
  REQUIREMENT_INTELLIGENCE: 'REQUIREMENT_INTELLIGENCE',
  PLANNING_INTELLIGENCE: 'PLANNING_INTELLIGENCE',
  CODE_GENERATION: 'CODE_GENERATION',
  BLUEPRINT_SYSTEMS: 'BLUEPRINT_SYSTEMS',
  FEATURE_VALIDATION: 'FEATURE_VALIDATION',
  ENGINEERING_REVIEW: 'ENGINEERING_REVIEW',
  FOUNDER_REVIEW: 'FOUNDER_REVIEW',
  PRODUCT_INTELLIGENCE: 'PRODUCT_ARCHITECT_INTELLIGENCE',
  UI_UX_INTELLIGENCE: 'FEATURE_VALIDATION',
  SELF_EVOLUTION: 'SELF_EVOLUTION',
  MULTI_PROJECT_EXECUTION: 'MULTI_PROJECT_EXECUTION',
};

const V1_CAPABILITY_OVERRIDES: Partial<Record<string, AuditCategoryId>> = {
  'Unified Verification Lab (UVL)': 'VERIFICATION_SYSTEMS',
  'Verification Orchestrator': 'VERIFICATION_SYSTEMS',
  'Verification Registry': 'VERIFICATION_SYSTEMS',
  'Unified Verification Entry': 'VERIFICATION_SYSTEMS',
  'Launch Readiness Authority': 'LAUNCH_READINESS',
  'Autonomous Founder Launch Authority': 'LAUNCH_READINESS',
  'Founder Launch Decision Authority': 'LAUNCH_READINESS',
  'Launch Council': 'LAUNCH_READINESS',
  'World2 Execution Engine': 'WORLD2',
  'World2 Disposable Workspace Pipeline (24E–24Y)': 'WORLD2',
  'World2 Controlled Execution Runtime': 'WORLD2',
  'Command Center Brain': 'OPERATOR_SYSTEMS',
  'Inline Operator Feed': 'OPERATOR_SYSTEMS',
};

export function remapV1Category(
  capabilityName: string,
  v1Category: AuditCategoryIdV1,
): AuditCategoryId {
  return V1_CAPABILITY_OVERRIDES[capabilityName] ?? V1_TO_V2_CATEGORY[v1Category] ?? 'OPERATOR_SYSTEMS';
}
