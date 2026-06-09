/**
 * Intelligence Console capability registry.
 */

export interface IntelligenceConsoleCapability {
  capabilityId: string;
  label: string;
  phase: number;
  ownerModule: string;
  extensionOnly: boolean;
}

export const INTELLIGENCE_CONSOLE_CAPABILITIES: readonly IntelligenceConsoleCapability[] = [
  {
    capabilityId: 'WORLD2_BUILDER_PACKET_EXECUTION',
    label: 'World 2 Builder Packet Execution',
    phase: 15.2,
    ownerModule: 'devpulse_v2_world2_builder_packet_execution',
    extensionOnly: true,
  },
  {
    capabilityId: 'WORLD2_CONTROLLED_APPLY_RUNTIME',
    label: 'World 2 Controlled Apply Runtime',
    phase: 15.3,
    ownerModule: 'devpulse_v2_world2_controlled_apply_runtime',
    extensionOnly: true,
  },
  {
    capabilityId: 'WORLD2_ROLLBACK_RUNTIME',
    label: 'World 2 Rollback Runtime',
    phase: 15.4,
    ownerModule: 'devpulse_v2_world2_rollback_runtime',
    extensionOnly: true,
  },
  {
    capabilityId: 'WORLD2_RECOVERY_RUNTIME',
    label: 'World 2 Recovery Runtime',
    phase: 15.5,
    ownerModule: 'devpulse_v2_world2_recovery_runtime',
    extensionOnly: true,
  },
  {
    capabilityId: 'WORLD2_COMPLETION_RUNTIME',
    label: 'World 2 Completion Runtime',
    phase: 15.6,
    ownerModule: 'devpulse_v2_world2_completion_runtime',
    extensionOnly: true,
  },
  {
    capabilityId: 'LIVE_PREVIEW_RUNTIME',
    label: 'Live Preview Runtime',
    phase: 16.1,
    ownerModule: 'devpulse_v2_live_preview_runtime',
    extensionOnly: true,
  },
  {
    capabilityId: 'PREVIEW_INTELLIGENCE',
    label: 'Preview Intelligence',
    phase: 16.2,
    ownerModule: 'devpulse_v2_preview_intelligence',
    extensionOnly: true,
  },
  {
    capabilityId: 'SELF_VISION_RUNTIME',
    label: 'Self Vision Runtime',
    phase: 16.3,
    ownerModule: 'devpulse_v2_self_vision_runtime',
    extensionOnly: true,
  },
  {
    capabilityId: 'UI_INSPECTION_ENGINE',
    label: 'UI Inspection Engine',
    phase: 16.4,
    ownerModule: 'devpulse_v2_ui_inspection_engine',
    extensionOnly: true,
  },
  {
    capabilityId: 'INTERACTION_TESTING_ENGINE',
    label: 'Interaction Testing Engine',
    phase: 16.5,
    ownerModule: 'devpulse_v2_interaction_testing_engine',
    extensionOnly: true,
  },
  {
    capabilityId: 'VISUAL_VERIFICATION_ENGINE',
    label: 'Visual Verification Engine',
    phase: 16.6,
    ownerModule: 'devpulse_v2_visual_verification_engine',
    extensionOnly: true,
  },
  {
    capabilityId: 'UNIFIED_VERIFICATION_LAB_RUNTIME',
    label: 'Unified Verification Lab Runtime',
    phase: 16.7,
    ownerModule: 'devpulse_v2_unified_verification_lab_runtime',
    extensionOnly: true,
  },
  {
    capabilityId: 'VERIFICATION_REGISTRY',
    label: 'Verification Registry',
    phase: 16.8,
    ownerModule: 'devpulse_v2_verification_registry',
    extensionOnly: true,
  },
  {
    capabilityId: 'VERIFICATION_ORCHESTRATOR',
    label: 'Verification Orchestrator',
    phase: 16.9,
    ownerModule: 'devpulse_v2_verification_orchestrator',
    extensionOnly: true,
  },
] as const;

export function isIntelligenceConsoleCapability(capabilityId: string): boolean {
  return INTELLIGENCE_CONSOLE_CAPABILITIES.some((c) => c.capabilityId === capabilityId);
}
