/** Shared types for DevPulse V2 foundation enforcement. */

export type DevPulseV2Phase = 1 | 2 | 3 | 4 | 4.5 | 5 | 5.5 | 6.1 | 6.2 | 6.3 | 6.4 | 6.5 | 6.6 | 6.7 | 6.8 | 6.9 | 6.10 | 6.11 | 7.1 | 7.2 | 7.3 | 7.4 | 7.5 | 7.6 | 7.7 | 8.1 | 8.2 | 8.3 | 8.4 | 8.5 | 9.1 | 9.2 | 9.3 | 9.4 | 9.5 | 9.6 | 10.1 | 10.2 | 10.3 | 10.31 | 11.1 | 11.2 | 11.6 | 12.1 | 12.2 | 12.3 | 12.4 | 12.5 | 14.1 | 14.2 | 14.3 | 14.4 | 14.5 | 14.6 | 15.1 | 15.2 | 15.3 | 15.4 | 15.5 | 15.6 | 16.1 | 16.2 | 16.3 | 16.4 | 16.5 | 16.6 | 16.7 | 16.8;

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
  | 'session_replay'
  | 'failure_prediction'
  | 'root_cause_attribution'
  | 'observability_stack_reality_validation'
  | 'execution_authority'
  | 'execution_package_runtime'
  | 'execution_verification_loop'
  | 'recovery_execution_engine'
  | 'founder_approval_execution_gate'
  | 'execution_reality_validation'
  | 'execution_evidence_ledger'
  | 'recovery_chains'
  | 'auto_fix_control_panel'
  | 'rollback_retry_engine'
  | 'verification_gated_apply'
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
  | 'self_vision'
  | 'reality_replay'
  | 'session_replay'
  | 'failure_prediction'
  | 'root_cause_attribution'
  | 'observability_stack_reality_validation'
  | 'execution_authority'
  | 'execution_package_runtime'
  | 'execution_verification_loop'
  | 'recovery_execution_engine'
  | 'founder_approval_execution_gate'
  | 'execution_reality_validation'
  | 'execution_evidence_ledger'
  | 'recovery_chains'
  | 'auto_fix_control_panel'
  | 'rollback_retry_engine'
  | 'verification_gated_apply'
  | 'background_task_budgeting'
  | 'law_enforcement'
  | 'phase_gate'
  | 'performance_gate'
  | 'growth_protection'
  | 'world2_isolation'
  | 'world2_workspace_foundation'
  | 'world2_execution_planner'
  | 'world2_simulation_runtime'
  | 'world2_autonomous_builder'
  | 'world2_completion_verifier'
  | 'world2_learning_loop'
  | 'controlled_execution_bridge'
  | 'mobile_command_foundation'
  | 'mobile_chat_interface'
  | 'mobile_live_preview_foundation'
  | 'mobile_approval_flow_foundation'
  | 'cross_device_continuity_foundation'
  | 'missing_capability_detector'
  | 'safe_capability_acquisition'
  | 'self_learning_engine'
  | 'architecture_drift_detection'
  | 'complexity_score_foundation'
  | 'future_problem_prediction'
  | 'experience_layer_foundation'
  | 'trust_engine_expansion'
  | 'founder_reality_surface'
  | 'command_center_runtime_shell'
  | 'command_center_brain'
  | 'cross_system_awareness'
  | 'shared_memory_layer'
  | 'project_understanding_engine'
  | 'general_question_understanding'
  | 'timeline_intelligence'
  | 'unified_decision_layer'
  | 'project_vault_intelligence'
  | 'dependency_intelligence'
  | 'workspace_intelligence'
  | 'project_history_intelligence'
  | 'project_summarization_engine'
  | 'portfolio_intelligence'
  | 'operator_feed'
  | 'action_visibility_engine'
  | 'reasoning_visibility_engine'
  | 'progress_intelligence'
  | 'failure_visibility_engine'
  | 'learning_visibility_engine'
  | 'execution_runtime'
  | 'build_task_runtime'
  | 'code_generation_runtime'
  | 'testing_runtime'
  | 'auto_fix_runtime'
  | 'runtime_verification_layer'
  | 'world2_execution_activation'
  | 'world2_builder_packet_execution'
  | 'world2_controlled_apply_runtime'
  | 'world2_rollback_runtime'
  | 'world2_recovery_runtime'
  | 'world2_completion_runtime'
  | 'live_preview_runtime'
  | 'preview_intelligence'
  | 'self_vision_runtime'
  | 'ui_inspection_engine'
  | 'interaction_testing_engine'
  | 'visual_verification_engine'
  | 'unified_verification_lab_runtime'
  | 'verification_registry'
  | 'verification_orchestrator'
  | 'verification_evidence_engine'
  | 'verification_reporting_engine'
  | 'unified_verification_entry'
  | 'cloud_runtime_foundation'
  | 'workspace_hosting_foundation'
  | 'persistent_build_runtime_foundation'
  | 'cloud_verification_foundation'
  | 'cloud_recovery_foundation'
  | 'cloud_monitoring_foundation'
  | 'mobile_command_runtime_foundation'
  | 'mobile_chat_runtime_foundation'
  | 'mobile_preview_runtime_foundation'
  | 'mobile_approval_runtime_foundation'
  | 'cross_device_runtime_foundation'
  | 'founder_notification_runtime_foundation'
  | 'founder_inbox_foundation'
  | 'notification_delivery_foundation'
  | 'mobile_push_foundation'
  | 'autonomous_builder_foundation'
  | 'build_strategy_engine'
  | 'verification_strategy_core'
  | 'verification_intelligence'
  | 'verification_integration'
  | 'autonomous_testing'
  | 'autonomous_fixing'
  | 'autonomous_verification'
  | 'autonomous_completion_engine'
  | 'multi_project_foundation'
  | 'workspace_isolation_expansion'
  | 'resource_allocation'
  | 'parallel_build_orchestration'
  | 'multi_project_verification'
  | 'multi_project_verification_orchestration'
  | 'multi_project_monitoring'
  | 'missing_capability_escalation'
  | 'capability_research_engine'
  | 'capability_planning_engine'
  | 'capability_build_engine'
  | 'capability_verification_engine'
  | 'self_evolution_governance'
  | 'unified_trust_runtime'
  | 'evidence_intelligence'
  | 'reality_verification_expansion'
  | 'completion_truth_engine'
  | 'prediction_trust_layer'
  | 'unified_trust_score'
  | 'reliability_hardening'
  | 'performance_hardening'
  | 'security_hardening'
  | 'privacy_hardening'
  | 'recovery_hardening'
  | 'scale_hardening'
  | 'self_documentation'
  | 'founder_guides'
  | 'user_guides'
  | 'architecture_documentation'
  | 'api_documentation'
  | 'interactive_explanations'
  | 'visual_qa_engine'
  | 'ux_heuristic_evaluator'
  | 'first_impression_judge'
  | 'live_preview_gatekeeper'
  | 'auto_polish_loop';

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
