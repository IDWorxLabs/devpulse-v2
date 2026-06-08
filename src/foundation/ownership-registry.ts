/**
 * DevPulse V2 ownership registry — one owner per domain.
 */

import type { OwnershipDomain, Violation } from './types.js';

export interface OwnerRecord {
  domain: OwnershipDomain;
  ownerModule: string;
  ownerFunction: string;
  phase: number;
  description: string;
}

const OWNERSHIP_REGISTRY: Readonly<Record<OwnershipDomain, OwnerRecord>> = {
  shell_authority: {
    domain: 'shell_authority',
    ownerModule: 'devpulse_v2_shell_authority',
    ownerFunction: 'createDevPulseV2ShellAuthority',
    phase: 1,
    description: 'Shell readiness, clickability, status, and startup timing',
  },
  startup_scheduling: {
    domain: 'startup_scheduling',
    ownerModule: 'devpulse_v2_task_governor',
    ownerFunction: 'scheduleStartupWork',
    phase: 1,
    description: 'All startup and background scheduling',
  },
  chat_authority: {
    domain: 'chat_authority',
    ownerModule: 'devpulse_v2_chat_authority',
    ownerFunction: 'createDevPulseV2ChatAuthority',
    phase: 1,
    description: 'User message intake, response creation, answer contract, chat state',
  },
  chat_answer_authority: {
    domain: 'chat_answer_authority',
    ownerModule: 'devpulse_v2_chat_authority',
    ownerFunction: 'createDevPulseV2ChatAuthority',
    phase: 1,
    description: 'Final answer authority for user messages — same owner as chat_authority',
  },
  chat_rendering: {
    domain: 'chat_rendering',
    ownerModule: 'devpulse_v2_chat_surface',
    ownerFunction: 'renderChatSurface',
    phase: 1,
    description: 'Chat display and turn rendering',
  },
  inline_operator_feed: {
    domain: 'inline_operator_feed',
    ownerModule: 'devpulse_v2_inline_operator_feed_authority',
    ownerFunction: 'createDevPulseV2InlineOperatorFeedAuthority',
    phase: 1,
    description: 'Inline feed event creation, ordering, visibility, turn attachment',
  },
  background_task_budgeting: {
    domain: 'background_task_budgeting',
    ownerModule: 'devpulse_v2_task_governor',
    ownerFunction: 'registerBackgroundTask',
    phase: 1,
    description: 'Background work budgets and queue tiers',
  },
  browser_verification_harness: {
    domain: 'browser_verification_harness',
    ownerModule: 'devpulse_v2_browser_verification_harness',
    ownerFunction: 'createDevPulseV2BrowserVerificationHarness',
    phase: 1,
    description: 'Browser reality checks — visible, clickable, chat, feed verification',
  },
  phase_1_stability_soak: {
    domain: 'phase_1_stability_soak',
    ownerModule: 'devpulse_v2_phase_1_stability_soak_authority',
    ownerFunction: 'createDevPulseV2Phase1StabilitySoakAuthority',
    phase: 1,
    description: 'Repeated Phase 1 validation cycles and Phase 2 readiness summary',
  },
  real_browser_runner_attachment: {
    domain: 'real_browser_runner_attachment',
    ownerModule: 'devpulse_v2_real_browser_runner_adapter',
    ownerFunction: 'createRealBrowserRunnerAdapter',
    phase: 1,
    description: 'Playwright real browser runner attachment for Browser Verification Harness',
  },
  trust_engine: {
    domain: 'trust_engine',
    ownerModule: 'devpulse_v2_trust_engine_authority',
    ownerFunction: 'createDevPulseV2TrustEngineAuthority',
    phase: 2,
    description: 'Trust scoring and evidence-based trust recommendations — observes only',
  },
  project_vault: {
    domain: 'project_vault',
    ownerModule: 'devpulse_v2_project_vault_authority',
    ownerFunction: 'createDevPulseV2ProjectVaultAuthority',
    phase: 2,
    description: 'Lightweight in-memory project identity, metadata, facts, and snapshots',
  },
  evidence_registry: {
    domain: 'evidence_registry',
    ownerModule: 'devpulse_v2_evidence_registry_authority',
    ownerFunction: 'createDevPulseV2EvidenceRegistryAuthority',
    phase: 2,
    description: 'Single source of truth for proof references — stores evidence only',
  },
  validation_budget_policy: {
    domain: 'validation_budget_policy',
    ownerModule: 'devpulse_v2_validation_budget_policy_authority',
    ownerFunction: 'createDevPulseV2ValidationBudgetPolicyAuthority',
    phase: 2,
    description: 'Fast-check vs full-stack validation governance and nested validator detection',
  },
  timeline_event_ledger: {
    domain: 'timeline_event_ledger',
    ownerModule: 'devpulse_v2_timeline_ledger_authority',
    ownerFunction: 'createDevPulseV2TimelineLedgerAuthority',
    phase: 2,
    description: 'Chronological timeline of DevPulse events with evidence and project references',
  },
  omega_prompt_safety_policy: {
    domain: 'omega_prompt_safety_policy',
    ownerModule: 'devpulse_v2_omega_prompt_safety_authority',
    ownerFunction: 'createDevPulseV2OmegaPromptSafetyAuthority',
    phase: 2,
    description: 'Classifies OMEGA build prompts for authority scope and validation safety',
  },
  central_brain: {
    domain: 'central_brain',
    ownerModule: 'devpulse_v2_central_brain_authority',
    ownerFunction: 'createDevPulseV2CentralBrainAuthority',
    phase: 3,
    description: 'Shared awareness and coordination — read-only, does not answer or execute',
  },
  intent_architecture: {
    domain: 'intent_architecture',
    ownerModule: 'devpulse_v2_intent_architecture_authority',
    ownerFunction: 'createDevPulseV2IntentArchitectureAuthority',
    phase: 3,
    description: 'Structured intent understanding — does not answer, execute, or generate code',
  },
  context_arbitration: {
    domain: 'context_arbitration',
    ownerModule: 'devpulse_v2_context_arbitration_authority',
    ownerFunction: 'createDevPulseV2ContextArbitrationAuthority',
    phase: 3,
    description: 'Context selection and prioritization — read-only, does not answer or execute',
  },
  answer_authority_protection_policy: {
    domain: 'answer_authority_protection_policy',
    ownerModule: 'devpulse_v2_answer_authority_protection_authority',
    ownerFunction: 'createDevPulseV2AnswerAuthorityProtectionAuthority',
    phase: 3,
    description: 'Permanent answer ownership protection — validates Chat Authority as sole visible answer owner',
  },
  answer_quality_judge: {
    domain: 'answer_quality_judge',
    ownerModule: 'devpulse_v2_answer_quality_judge_authority',
    ownerFunction: 'createDevPulseV2AnswerQualityJudgeAuthority',
    phase: 3,
    description: 'Post-answer quality review — does not create, modify, or replace answers',
  },
  verification_loop: {
    domain: 'verification_loop',
    ownerModule: 'devpulse_v2_verification_loop_authority',
    ownerFunction: 'createDevPulseV2VerificationLoopAuthority',
    phase: 3,
    description: 'Claim verification against evidence — read-only, does not answer or execute',
  },
  visible_ui_clickability_guard: {
    domain: 'visible_ui_clickability_guard',
    ownerModule: 'devpulse_v2_visible_ui_guard_authority',
    ownerFunction: 'createDevPulseV2VisibleUiGuardAuthority',
    phase: 3,
    description: 'Visible UI registration and clickability proof — guardrail only, does not build UI',
  },
  aidev_engine: {
    domain: 'aidev_engine',
    ownerModule: 'devpulse_v2_aidev_engine_authority',
    ownerFunction: 'createDevPulseV2AiDevEngineAuthority',
    phase: 4,
    description: 'AiDev build request intake and reporting — no code generation or execution in Foundation V1',
  },
  requirement_extractor: {
    domain: 'requirement_extractor',
    ownerModule: 'devpulse_v2_requirement_extractor_authority',
    ownerFunction: 'createDevPulseV2RequirementExtractorAuthority',
    phase: 4,
    description: 'Structured requirement discovery from build requests — extraction only',
  },
  product_architect: {
    domain: 'product_architect',
    ownerModule: 'devpulse_v2_product_architect_authority',
    ownerFunction: 'createDevPulseV2ProductArchitectAuthority',
    phase: 4,
    description: 'Product architecture blueprint design from requirements — design only',
  },
  build_package_generator: {
    domain: 'build_package_generator',
    ownerModule: 'devpulse_v2_build_package_generator_authority',
    ownerFunction: 'createDevPulseV2BuildPackageGeneratorAuthority',
    phase: 4,
    description: 'Structured implementation package generation from blueprints — package generation only',
  },
  implementation_strategy_engine: {
    domain: 'implementation_strategy_engine',
    ownerModule: 'devpulse_v2_implementation_strategy_authority',
    ownerFunction: 'createDevPulseV2ImplementationStrategyAuthority',
    phase: 4,
    description: 'Implementation sequencing and rollback planning from build packages — strategy only',
  },
  code_generation_planner: {
    domain: 'code_generation_planner',
    ownerModule: 'devpulse_v2_code_generation_planner_authority',
    ownerFunction: 'createDevPulseV2CodeGenerationPlannerAuthority',
    phase: 4,
    description: 'Code generation planning from implementation strategies — planning only',
  },
  recovery_strategy_planner: {
    domain: 'recovery_strategy_planner',
    ownerModule: 'devpulse_v2_recovery_strategy_authority',
    ownerFunction: 'createDevPulseV2RecoveryStrategyAuthority',
    phase: 4,
    description: 'Recovery and rollback planning from code plans — planning only, no execution',
  },
  planning_stack_reality_validation: {
    domain: 'planning_stack_reality_validation',
    ownerModule: 'devpulse_v2_planning_stack_validation_authority',
    ownerFunction: 'createDevPulseV2PlanningStackValidationAuthority',
    phase: 4.5,
    description: 'End-to-end planning stack handoff validation — validation layer only',
  },
  self_vision: {
    domain: 'self_vision',
    ownerModule: 'devpulse_v2_self_vision_authority',
    ownerFunction: 'createDevPulseV2SelfVisionAuthority',
    phase: 5,
    description: 'Structured read-only UI observation — no execution, repair, or code generation',
  },
  reality_replay: {
    domain: 'reality_replay',
    ownerModule: 'devpulse_v2_reality_replay_authority',
    ownerFunction: 'createDevPulseV2RealityReplayAuthority',
    phase: 5,
    description: 'Historical sequence reconstruction from evidence — no execution, repair, or diagnosis',
  },
  session_replay: {
    domain: 'session_replay',
    ownerModule: 'devpulse_v2_session_replay_authority',
    ownerFunction: 'createDevPulseV2SessionReplayAuthority',
    phase: 5,
    description: 'Complete session reconstruction from history — no execution, repair, or diagnosis',
  },
  failure_prediction: {
    domain: 'failure_prediction',
    ownerModule: 'devpulse_v2_failure_prediction_authority',
    ownerFunction: 'createDevPulseV2FailurePredictionAuthority',
    phase: 5,
    description: 'Rule-based failure risk prediction — no execution, repair, or root cause analysis',
  },
  root_cause_attribution: {
    domain: 'root_cause_attribution',
    ownerModule: 'devpulse_v2_root_cause_attribution_authority',
    ownerFunction: 'createDevPulseV2RootCauseAttributionAuthority',
    phase: 5,
    description: 'Rule-based likely cause attribution — no execution, repair, or recovery',
  },
  observability_stack_reality_validation: {
    domain: 'observability_stack_reality_validation',
    ownerModule: 'devpulse_v2_observability_stack_validation_authority',
    ownerFunction: 'createDevPulseV2ObservabilityStackValidationAuthority',
    phase: 5.5,
    description: 'End-to-end observability stack handoff validation — validation layer only',
  },
  execution_authority: {
    domain: 'execution_authority',
    ownerModule: 'devpulse_v2_execution_authority',
    ownerFunction: 'createDevPulseV2ExecutionAuthority',
    phase: 6.1,
    description: 'Single execution governance authority — policy and classification only, no execution',
  },
  execution_package_runtime: {
    domain: 'execution_package_runtime',
    ownerModule: 'devpulse_v2_execution_package_runtime',
    ownerFunction: 'createDevPulseV2ExecutionPackageRuntime',
    phase: 6.2,
    description: 'Controlled execution package intake runtime — depends on execution_authority, no execution',
  },
  execution_verification_loop: {
    domain: 'execution_verification_loop',
    ownerModule: 'devpulse_v2_execution_verification_loop',
    ownerFunction: 'createDevPulseV2ExecutionVerificationLoop',
    phase: 6.3,
    description: 'Verifies execution package runtime outcomes — depends on execution_authority and execution_package_runtime',
  },
  recovery_execution_engine: {
    domain: 'recovery_execution_engine',
    ownerModule: 'devpulse_v2_recovery_execution_engine',
    ownerFunction: 'createDevPulseV2RecoveryExecutionEngine',
    phase: 6.4,
    description: 'Recovery planning from verification outcomes — depends on execution stack, no recovery execution',
  },
  founder_approval_execution_gate: {
    domain: 'founder_approval_execution_gate',
    ownerModule: 'devpulse_v2_founder_approval_execution_gate',
    ownerFunction: 'createDevPulseV2FounderApprovalExecutionGate',
    phase: 6.5,
    description: 'Constitutional founder approval gate — depends on execution stack and recovery engine, no execution',
  },
  execution_reality_validation: {
    domain: 'execution_reality_validation',
    ownerModule: 'devpulse_v2_execution_reality_validation',
    ownerFunction: 'createDevPulseV2ExecutionRealityValidation',
    phase: 6.6,
    description: 'Phase 6 governance chain reality validation — validation layer only, no execution',
  },
  execution_evidence_ledger: {
    domain: 'execution_evidence_ledger',
    ownerModule: 'devpulse_v2_execution_evidence_ledger',
    ownerFunction: 'createDevPulseV2ExecutionEvidenceLedger',
    phase: 6.7,
    description: 'Phase 6 permanent execution evidence history ledger — records only, no execution or validation',
  },
  recovery_chains: {
    domain: 'recovery_chains',
    ownerModule: 'devpulse_v2_recovery_chains',
    ownerFunction: 'createDevPulseV2RecoveryChains',
    phase: 6.8,
    description: 'Recovery chain planning above Phase 6 stack — orchestration only, no execution or repair',
  },
  auto_fix_control_panel: {
    domain: 'auto_fix_control_panel',
    ownerModule: 'devpulse_v2_auto_fix_control_panel',
    ownerFunction: 'createDevPulseV2AutoFixControlPanel',
    phase: 6.9,
    description: 'Auto-fix permission control layer — governs allowed fixes only, no execution or repair',
  },
  rollback_retry_engine: {
    domain: 'rollback_retry_engine',
    ownerModule: 'devpulse_v2_rollback_retry_engine',
    ownerFunction: 'createDevPulseV2RollbackRetryEngine',
    phase: 6.10,
    description: 'Rollback and retry planning engine — strategy only, no execution or file modification',
  },
  verification_gated_apply: {
    domain: 'verification_gated_apply',
    ownerModule: 'devpulse_v2_verification_gated_apply',
    ownerFunction: 'createDevPulseV2VerificationGatedApply',
    phase: 6.11,
    description: 'Final pre-execution apply decision gate — determines allow/block/pending only, no execution',
  },
  law_enforcement: {
    domain: 'law_enforcement',
    ownerModule: 'devpulse_v2_foundation_enforcement',
    ownerFunction: 'runDevPulseV2ConstitutionalValidation',
    phase: 1,
    description: 'Constitutional and law enforcement layer',
  },
  phase_gate: {
    domain: 'phase_gate',
    ownerModule: 'devpulse_v2_phase_gate',
    ownerFunction: 'assertSystemAllowedInCurrentPhase',
    phase: 1,
    description: 'Phase boundary enforcement',
  },
  performance_gate: {
    domain: 'performance_gate',
    ownerModule: 'devpulse_v2_task_governor',
    ownerFunction: 'enforcePerformanceBudget',
    phase: 1,
    description: 'Main-thread and render budget enforcement',
  },
  growth_protection: {
    domain: 'growth_protection',
    ownerModule: 'devpulse_v2_foundation_enforcement',
    ownerFunction: 'runDevPulseV2ConstitutionalValidation',
    phase: 1,
    description: 'Module size, connect-module, and drift detection',
  },
  world2_isolation: {
    domain: 'world2_isolation',
    ownerModule: 'devpulse_v2_world2_isolation_gate',
    ownerFunction: 'assertWorld2Isolation',
    phase: 5,
    description: 'World 2 sandbox isolation gate — distinct from workspace foundation',
  },
  world2_workspace_foundation: {
    domain: 'world2_workspace_foundation',
    ownerModule: 'devpulse_v2_world2_workspace_foundation',
    ownerFunction: 'createDevPulseV2World2WorkspaceFoundation',
    phase: 7.1,
    description: 'World 2 isolated project workspace foundation — multi-workspace isolation, no autonomous builder',
  },
  world2_execution_planner: {
    domain: 'world2_execution_planner',
    ownerModule: 'devpulse_v2_world2_execution_planner',
    ownerFunction: 'createDevPulseV2World2ExecutionPlanner',
    phase: 7.2,
    description: 'World 2 execution planner — creates execution plans only, no execution or code generation',
  },
  world2_simulation_runtime: {
    domain: 'world2_simulation_runtime',
    ownerModule: 'devpulse_v2_world2_simulation_runtime',
    ownerFunction: 'createDevPulseV2World2SimulationRuntime',
    phase: 7.3,
    description: 'World 2 simulation runtime — simulates execution plans only, no execution or file modification',
  },
  world2_autonomous_builder: {
    domain: 'world2_autonomous_builder',
    ownerModule: 'devpulse_v2_world2_autonomous_builder',
    ownerFunction: 'createDevPulseV2World2AutonomousBuilder',
    phase: 7.4,
    description: 'World 2 autonomous builder foundation — prepares dry-run build packets only, no execution or file modification',
  },
  world2_completion_verifier: {
    domain: 'world2_completion_verifier',
    ownerModule: 'devpulse_v2_world2_completion_verifier',
    ownerFunction: 'createDevPulseV2World2CompletionVerifier',
    phase: 7.5,
    description: 'World 2 completion verifier foundation — determines completion truth only, no execution or file modification',
  },
  world2_learning_loop: {
    domain: 'world2_learning_loop',
    ownerModule: 'devpulse_v2_world2_learning_loop',
    ownerFunction: 'createDevPulseV2World2LearningLoop',
    phase: 7.6,
    description: 'World 2 learning loop foundation — captures structured lessons only, no execution or file modification',
  },
  controlled_execution_bridge: {
    domain: 'controlled_execution_bridge',
    ownerModule: 'devpulse_v2_controlled_execution_bridge',
    ownerFunction: 'createDevPulseV2ControlledExecutionBridge',
    phase: 7.7,
    description: 'Phase 7.7 controlled execution bridge foundation — classifies gated execution eligibility only, no execution or file modification',
  },
  mobile_command_foundation: {
    domain: 'mobile_command_foundation',
    ownerModule: 'devpulse_v2_mobile_command_foundation',
    ownerFunction: 'createDevPulseV2MobileCommandFoundation',
    phase: 8.1,
    description: 'Phase 8.1 mobile command foundation — remote command center session establishment only, no execution or file modification',
  },
  mobile_chat_interface: {
    domain: 'mobile_chat_interface',
    ownerModule: 'devpulse_v2_mobile_chat_interface',
    ownerFunction: 'createDevPulseV2MobileChatInterface',
    phase: 8.2,
    description: 'Phase 8.2 mobile chat interface foundation — project-aware chat command interface only, no execution or file modification',
  },
  mobile_live_preview_foundation: {
    domain: 'mobile_live_preview_foundation',
    ownerModule: 'devpulse_v2_mobile_live_preview_foundation',
    ownerFunction: 'createDevPulseV2MobileLivePreviewFoundation',
    phase: 8.3,
    description: 'Phase 8.3 mobile live preview foundation — remote preview viewer only, no execution, rendering, or file modification',
  },
  mobile_approval_flow_foundation: {
    domain: 'mobile_approval_flow_foundation',
    ownerModule: 'devpulse_v2_mobile_approval_flow_foundation',
    ownerFunction: 'createDevPulseV2MobileApprovalFlowFoundation',
    phase: 8.4,
    description: 'Phase 8.4 mobile approval flow foundation — decision interface only, records governed approval decisions, no execution',
  },
  cross_device_continuity_foundation: {
    domain: 'cross_device_continuity_foundation',
    ownerModule: 'devpulse_v2_cross_device_continuity_foundation',
    ownerFunction: 'createDevPulseV2CrossDeviceContinuityFoundation',
    phase: 8.5,
    description: 'Phase 8.5 cross-device continuity foundation — context transfer only, cloud workspace remains source of truth, no execution',
  },
  missing_capability_detector: {
    domain: 'missing_capability_detector',
    ownerModule: 'devpulse_v2_missing_capability_detector',
    ownerFunction: 'createDevPulseV2MissingCapabilityDetector',
    phase: 9.1,
    description: 'Phase 9.1 missing capability detector foundation — detects capability gaps only, no acquisition, execution, or modification',
  },
  safe_capability_acquisition: {
    domain: 'safe_capability_acquisition',
    ownerModule: 'devpulse_v2_safe_capability_acquisition',
    ownerFunction: 'createDevPulseV2SafeCapabilityAcquisition',
    phase: 9.2,
    description: 'Phase 9.2 safe capability acquisition foundation — plans safe acquisition only, no execution, download, install, or modification',
  },
  self_learning_engine: {
    domain: 'self_learning_engine',
    ownerModule: 'devpulse_v2_self_learning_engine',
    ownerFunction: 'createDevPulseV2SelfLearningEngine',
    phase: 9.3,
    description: 'Phase 9.3 self-learning engine foundation — records structured lessons and future guidance only, no model training, execution, or automatic behavior change',
  },
  architecture_drift_detection: {
    domain: 'architecture_drift_detection',
    ownerModule: 'devpulse_v2_architecture_drift_detection',
    ownerFunction: 'createDevPulseV2ArchitectureDriftDetection',
    phase: 9.4,
    description: 'Phase 9.4 architecture drift detection foundation — detects architectural drift and produces review recommendations only, no refactoring, auto-fix, or modification',
  },
  complexity_score_foundation: {
    domain: 'complexity_score_foundation',
    ownerModule: 'devpulse_v2_complexity_score_foundation',
    ownerFunction: 'createDevPulseV2ComplexityScoreFoundation',
    phase: 9.5,
    description: 'Phase 9.5 complexity score foundation — measures system complexity and produces review recommendations only, no refactoring, auto-optimization, or modification',
  },
  future_problem_prediction: {
    domain: 'future_problem_prediction',
    ownerModule: 'devpulse_v2_future_problem_prediction',
    ownerFunction: 'createDevPulseV2FutureProblemPrediction',
    phase: 9.6,
    description: 'Phase 9.6 future problem prediction foundation — predicts likely future failures and produces prevention recommendations only, no auto-fix, execution, or modification',
  },
  experience_layer_foundation: {
    domain: 'experience_layer_foundation',
    ownerModule: 'devpulse_v2_experience_layer_foundation',
    ownerFunction: 'createDevPulseV2ExperienceLayerFoundation',
    phase: 10.1,
    description: 'Phase 10.1 experience layer foundation — exposes existing DevPulse systems via founder experience map only, no execution, UI rendering, file modification, or governance changes',
  },
  trust_engine_expansion: {
    domain: 'trust_engine_expansion',
    ownerModule: 'devpulse_v2_trust_engine_expansion',
    ownerFunction: 'createDevPulseV2TrustEngineExpansion',
    phase: 10.2,
    description: 'Phase 10.2 trust engine expansion foundation — aggregates trust signals from existing systems into unified founder-readable trust assessment only, no execution, auto-fix, or replacement of verification/evidence/completion systems',
  },
  founder_reality_surface: {
    domain: 'founder_reality_surface',
    ownerModule: 'devpulse_v2_founder_reality_surface',
    ownerFunction: 'startFounderRealityServer',
    phase: 10.3,
    description: 'Phase 10.3 founder reality surface foundation — minimal runnable visibility surface exposing foundation status only, no execution, validator auto-run, file modification, or autonomous building claims',
  },
  command_center_runtime_shell: {
    domain: 'command_center_runtime_shell',
    ownerModule: 'devpulse_v2_command_center_runtime_shell',
    ownerFunction: 'startFounderRealityServer',
    phase: 10.31,
    description: 'Phase 10.3.1 command center runtime shell foundation — three-zone UI shell for future Command Center intelligence, local chat append only, no execution, persistence, or intelligence connection',
  },
  command_center_brain: {
    domain: 'command_center_brain',
    ownerModule: 'devpulse_v2_command_center_brain',
    ownerFunction: 'getDevPulseV2CommandCenterBrain',
    phase: 11.1,
    description: 'Phase 11.1 unified command center brain foundation — local intelligence orchestration for Command Center chat, understands registered systems and roadmap, no execution, file modification, external AI, or system replacement',
  },
};

export function getDevPulseV2Owner(domain: OwnershipDomain): OwnerRecord {
  return OWNERSHIP_REGISTRY[domain];
}

export function listDevPulseV2Owners(): OwnerRecord[] {
  return Object.values(OWNERSHIP_REGISTRY);
}

export interface SingleOwnerAssertionResult {
  ok: boolean;
  domain: OwnershipDomain;
  violation?: Violation;
}

/**
 * Assert that a domain has exactly one registered owner.
 * Fails if competing owners are supplied for the same domain.
 */
export function assertSingleOwner(
  domain: OwnershipDomain,
  competingOwners?: string[],
): SingleOwnerAssertionResult {
  const registered = OWNERSHIP_REGISTRY[domain];

  if (!registered) {
    return {
      ok: false,
      domain,
      violation: {
        code: 'OWNERSHIP_DOMAIN_UNKNOWN',
        message: `Unknown ownership domain: ${domain}`,
        lawReference: 'DEVPULSE_V2_OWNERSHIP_LAWS',
        recommendedAction: 'Register domain in ownership-registry.ts before use.',
        riskLevel: 'high',
      },
    };
  }

  if (competingOwners && competingOwners.length > 1) {
    return {
      ok: false,
      domain,
      violation: {
        code: 'DUPLICATE_DOMAIN_OWNER',
        message: `Domain "${domain}" has ${competingOwners.length} competing owners: ${competingOwners.join(', ')}`,
        lawReference: 'DEVPULSE_V2_OWNERSHIP_LAWS',
        recommendedAction: `Assign single owner. Registered owner: ${registered.ownerModule}.${registered.ownerFunction}`,
        riskLevel: 'critical',
      },
    };
  }

  return { ok: true, domain };
}

/** Validate truth-source map: each domain may have at most one owner. */
export function assertSingleSourceOfTruth(
  truthSources: Record<string, string[]>,
): Violation[] {
  const violations: Violation[] = [];

  for (const [domain, owners] of Object.entries(truthSources)) {
    if (owners.length > 1) {
      violations.push({
        code: 'DUPLICATE_TRUTH_SOURCE',
        message: `Domain "${domain}" has ${owners.length} truth sources: ${owners.join(', ')}`,
        lawReference: 'DEVPULSE_V2_OWNERSHIP_LAWS',
        recommendedAction: 'Remove duplicate writers. One source of truth per domain.',
        riskLevel: 'critical',
      });
    }
  }

  return violations;
}
