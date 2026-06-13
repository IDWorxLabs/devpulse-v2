/**
 * Requirements-to-Plan Execution Contract — constants and registry.
 */

export const REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS_TOKEN =
  'REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_PASS';
export const REQUIREMENTS_TO_PLAN_CONTRACT_OWNER_MODULE =
  'devpulse_requirements_to_plan_execution_contract';
export const REQUIREMENTS_TO_PLAN_CONTRACT_PHASE =
  'Phase 26.7 — Requirements-to-Plan Execution Contract Repair';
export const REQUIREMENTS_TO_PLAN_CONTRACT_REPORT_TITLE =
  'REQUIREMENTS_TO_PLAN_EXECUTION_CONTRACT_REPORT';
export const REQUIREMENTS_TO_PLAN_CONTRACT_CACHE_KEY_PREFIX =
  'requirements-to-plan-contract-v1';
export const MAX_REQUIREMENTS_TO_PLAN_CONTRACT_HISTORY = 16;
export const MAX_REQUIREMENTS = 32;
export const MAX_PLAN_TASKS = 48;
export const MAX_BUILD_UNITS = 32;
export const MAX_CLARIFYING_GAPS = 16;

export const REQUIREMENTS_TO_PLAN_CONTRACT_CORE_QUESTION =
  'Can AiDevEngine prove that a user idea became a structured, build-ready requirements contract linked to plan tasks?';

/** Reference prompt for execution-proof capability probe when no live user prompt exists. */
export const EXECUTION_PROOF_REFERENCE_PROMPT =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';

export const VAGUE_PROMPT_PATTERNS: readonly RegExp[] = [
  /^build\s+(me\s+)?an?\s+app\.?$/i,
  /^make\s+(me\s+)?an?\s+app\.?$/i,
  /^create\s+(me\s+)?an?\s+app\.?$/i,
  /^build\s+something\.?$/i,
  /^i\s+want\s+an?\s+app\.?$/i,
];

export const CRITICAL_GAP_CATEGORIES = [
  'target_users',
  'roles_permissions',
  'platform',
  'data_model',
  'authentication',
  'integrations',
  'design_theme',
  'payment_needs',
  'admin_needs',
  'deployment_target',
  'mvp_scope',
] as const;

export const ORCHESTRATION_FLOW = [
  'Raw user prompt',
  'User Idea Contract',
  'Requirement Contract',
  'Clarifying Gap Analysis',
  'Plan Contract',
  'Build-Ready Execution Contract',
  'Contract Linkage Analysis',
  'Autonomous Build Execution Proof (REQUIREMENTS + PLAN stages)',
] as const;
