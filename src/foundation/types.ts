/** Shared types for DevPulse V2 foundation enforcement. */

export type DevPulseV2Phase = 1 | 2 | 3 | 4 | 4.5 | 5;

export type DevPulseV2SystemId =
  | 'foundation_enforcement'
  | 'task_governor'
  | 'shell'
  | 'chat'
  | 'chat_authority'
  | 'inline_operator_feed'
  | 'browser_verification_harness'
  | 'phase_1_stability_soak'
  | 'real_browser_runner_attachment'
  | 'trust_engine'
  | 'project_vault'
  | 'evidence_registry'
  | 'validation_budget_policy'
  | 'timeline_event_ledger'
  | 'omega_prompt_safety_policy'
  | 'central_brain'
  | 'intent_architecture'
  | 'context_arbitration'
  | 'answer_authority_protection_policy'
  | 'answer_quality_judge'
  | 'verification_loop'
  | 'visible_ui_clickability_guard'
  | 'aidev_engine'
  | 'requirement_extractor'
  | 'product_architect'
  | 'build_package_generator'
  | 'implementation_strategy_engine'
  | 'code_generation_planner'
  | 'recovery_strategy_planner'
  | 'planning_stack_reality_validation'
  | 'replay'
  | 'self_vision'
  | 'founder_notifications'
  | 'console_intelligence'
  | 'reality_replay'
  | 'mobile_command'
  | 'world2_builder'
  | 'autonomous_execution'
  | 'heavy_diagnostics';

export type OwnershipDomain =
  | 'shell_authority'
  | 'chat_authority'
  | 'startup_scheduling'
  | 'chat_answer_authority'
  | 'chat_rendering'
  | 'inline_operator_feed'
  | 'browser_verification_harness'
  | 'phase_1_stability_soak'
  | 'real_browser_runner_attachment'
  | 'trust_engine'
  | 'project_vault'
  | 'evidence_registry'
  | 'validation_budget_policy'
  | 'timeline_event_ledger'
  | 'omega_prompt_safety_policy'
  | 'central_brain'
  | 'intent_architecture'
  | 'context_arbitration'
  | 'answer_authority_protection_policy'
  | 'answer_quality_judge'
  | 'verification_loop'
  | 'visible_ui_clickability_guard'
  | 'aidev_engine'
  | 'requirement_extractor'
  | 'product_architect'
  | 'build_package_generator'
  | 'implementation_strategy_engine'
  | 'code_generation_planner'
  | 'recovery_strategy_planner'
  | 'planning_stack_reality_validation'
  | 'background_task_budgeting'
  | 'law_enforcement'
  | 'phase_gate'
  | 'performance_gate'
  | 'growth_protection'
  | 'world2_isolation';

export type BuildStage = 'foundation' | 'phase1_impl' | 'release' | 'validation';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type LawReference =
  | 'DEVPULSE_V2_CONSTITUTION'
  | 'DEVPULSE_V2_STARTUP_LAWS'
  | 'DEVPULSE_V2_PERFORMANCE_LAWS'
  | 'DEVPULSE_V2_OWNERSHIP_LAWS'
  | 'DEVPULSE_V2_GROWTH_PROTECTION_LAWS'
  | 'DEVPULSE_V2_WORLD2_LAWS'
  | 'DEVPULSE_V2_SYSTEM_LAWS'
  | 'DEVPULSE_V2_FOUNDER_VISION'
  | 'DEVPULSE_V2_PRODUCT_NORTH_STAR'
  | 'DEVPULSE_V2_FINAL_STATE_ROADMAP'
  | 'DEVPULSE_V2_REBUILD_BLUEPRINT';

export interface Violation {
  code: string;
  message: string;
  lawReference: LawReference;
  systemId?: string;
  phase?: DevPulseV2Phase;
  recommendedAction: string;
  riskLevel: RiskLevel;
}

export interface Warning {
  code: string;
  message: string;
  lawReference: LawReference;
  recommendedAction: string;
}

export interface ConstitutionalValidationInput {
  phase?: DevPulseV2Phase;
  systems?: string[];
  eagerModuleCount?: number;
  startupBudgetMs?: number;
  firstClickableBudgetMs?: number;
  answerAuthorities?: string[];
  truthSources?: Record<string, string[]>;
  operatorFeedOwners?: string[];
  modulePaths?: string[];
  connectModulePaths?: string[];
  hiddenExecutionPaths?: string[];
  diagnosticsOnStartupPath?: boolean;
  browserVerificationPresent?: boolean;
  world2LawModificationAttempt?: boolean;
  buildStage?: BuildStage;
}

export interface ConstitutionalValidationResult {
  passed: boolean;
  violationCount: number;
  violations: Violation[];
  warnings: Warning[];
  summary: string;
}

export interface PhaseGateResult {
  allowed: boolean;
  systemId: string;
  phase: DevPulseV2Phase;
  violation?: Violation;
}

export interface BuildPacket extends ConstitutionalValidationInput {
  phase: DevPulseV2Phase;
  systems: string[];
  buildStage?: BuildStage;
  description?: string;
}

export interface BuildGateResult {
  passed: boolean;
  violationCount: number;
  warningCount: number;
  violations: Violation[];
  warnings: Warning[];
  summary: string;
  phaseResults: PhaseGateResult[];
  buildAllowed: boolean;
}

export interface FounderGateReport {
  verdict: 'PASS' | 'FAIL';
  lawViolations: Violation[];
  warnings: Warning[];
  affectedSystems: string[];
  riskLevel: RiskLevel;
  recommendedRepair: string[];
  buildAllowed: boolean;
  summary: string;
}

export const FOUNDATION_ENFORCEMENT_PASS_TOKEN =
  'DEVPULSE_V2_FOUNDATION_ENFORCEMENT_LAYER_V1_PASS';
