/**
 * Find Panel alias registry — searchable aliases for intelligence modules.
 */

export interface FindPanelAlias {
  alias: string;
  capabilityId: string;
  ownerModule: string;
}

export const WORLD2_BUILDER_PACKET_FIND_ALIASES: readonly FindPanelAlias[] = [
  { alias: 'Builder Packet Execution', capabilityId: 'WORLD2_BUILDER_PACKET_EXECUTION', ownerModule: 'devpulse_v2_world2_builder_packet_execution' },
  { alias: 'World 2 Builder Packet', capabilityId: 'WORLD2_BUILDER_PACKET_EXECUTION', ownerModule: 'devpulse_v2_world2_builder_packet_execution' },
  { alias: 'Execution Packet', capabilityId: 'WORLD2_BUILDER_PACKET_EXECUTION', ownerModule: 'devpulse_v2_world2_builder_packet_execution' },
  { alias: 'Packet Readiness', capabilityId: 'WORLD2_BUILDER_PACKET_EXECUTION', ownerModule: 'devpulse_v2_world2_builder_packet_execution' },
  { alias: 'Builder Packet Approval', capabilityId: 'WORLD2_BUILDER_PACKET_EXECUTION', ownerModule: 'devpulse_v2_world2_builder_packet_execution' },
  { alias: 'World 2 Build Preparation', capabilityId: 'WORLD2_BUILDER_PACKET_EXECUTION', ownerModule: 'devpulse_v2_world2_builder_packet_execution' },
  { alias: 'Controlled Apply', capabilityId: 'WORLD2_CONTROLLED_APPLY_RUNTIME', ownerModule: 'devpulse_v2_world2_controlled_apply_runtime' },
  { alias: 'Apply Plan', capabilityId: 'WORLD2_CONTROLLED_APPLY_RUNTIME', ownerModule: 'devpulse_v2_world2_controlled_apply_runtime' },
  { alias: 'World 2 Apply', capabilityId: 'WORLD2_CONTROLLED_APPLY_RUNTIME', ownerModule: 'devpulse_v2_world2_controlled_apply_runtime' },
  { alias: 'Apply Readiness', capabilityId: 'WORLD2_CONTROLLED_APPLY_RUNTIME', ownerModule: 'devpulse_v2_world2_controlled_apply_runtime' },
  { alias: 'Apply Approval', capabilityId: 'WORLD2_CONTROLLED_APPLY_RUNTIME', ownerModule: 'devpulse_v2_world2_controlled_apply_runtime' },
  { alias: 'Future Apply', capabilityId: 'WORLD2_CONTROLLED_APPLY_RUNTIME', ownerModule: 'devpulse_v2_world2_controlled_apply_runtime' },
  { alias: 'Rollback Runtime', capabilityId: 'WORLD2_ROLLBACK_RUNTIME', ownerModule: 'devpulse_v2_world2_rollback_runtime' },
  { alias: 'World 2 Rollback', capabilityId: 'WORLD2_ROLLBACK_RUNTIME', ownerModule: 'devpulse_v2_world2_rollback_runtime' },
  { alias: 'Rollback Plan', capabilityId: 'WORLD2_ROLLBACK_RUNTIME', ownerModule: 'devpulse_v2_world2_rollback_runtime' },
  { alias: 'Rollback Safety', capabilityId: 'WORLD2_ROLLBACK_RUNTIME', ownerModule: 'devpulse_v2_world2_rollback_runtime' },
  { alias: 'Snapshot Requirement', capabilityId: 'WORLD2_ROLLBACK_RUNTIME', ownerModule: 'devpulse_v2_world2_rollback_runtime' },
  { alias: 'Change Reversal', capabilityId: 'WORLD2_ROLLBACK_RUNTIME', ownerModule: 'devpulse_v2_world2_rollback_runtime' },
  { alias: 'Recovery Runtime', capabilityId: 'WORLD2_RECOVERY_RUNTIME', ownerModule: 'devpulse_v2_world2_recovery_runtime' },
  { alias: 'World 2 Recovery', capabilityId: 'WORLD2_RECOVERY_RUNTIME', ownerModule: 'devpulse_v2_world2_recovery_runtime' },
  { alias: 'Recovery Plan', capabilityId: 'WORLD2_RECOVERY_RUNTIME', ownerModule: 'devpulse_v2_world2_recovery_runtime' },
  { alias: 'Failure Recovery', capabilityId: 'WORLD2_RECOVERY_RUNTIME', ownerModule: 'devpulse_v2_world2_recovery_runtime' },
  { alias: 'Recovery Strategy', capabilityId: 'WORLD2_RECOVERY_RUNTIME', ownerModule: 'devpulse_v2_world2_recovery_runtime' },
  { alias: 'Self Evolution Escalation', capabilityId: 'WORLD2_RECOVERY_RUNTIME', ownerModule: 'devpulse_v2_world2_recovery_runtime' },
  { alias: 'Three Failure Rule', capabilityId: 'WORLD2_RECOVERY_RUNTIME', ownerModule: 'devpulse_v2_world2_recovery_runtime' },
  { alias: 'Completion Runtime', capabilityId: 'WORLD2_COMPLETION_RUNTIME', ownerModule: 'devpulse_v2_world2_completion_runtime' },
  { alias: 'World 2 Completion', capabilityId: 'WORLD2_COMPLETION_RUNTIME', ownerModule: 'devpulse_v2_world2_completion_runtime' },
  { alias: 'Completion Plan', capabilityId: 'WORLD2_COMPLETION_RUNTIME', ownerModule: 'devpulse_v2_world2_completion_runtime' },
  { alias: 'Completion Criteria', capabilityId: 'WORLD2_COMPLETION_RUNTIME', ownerModule: 'devpulse_v2_world2_completion_runtime' },
  { alias: 'Completion Evidence', capabilityId: 'WORLD2_COMPLETION_RUNTIME', ownerModule: 'devpulse_v2_world2_completion_runtime' },
  { alias: 'Project Done', capabilityId: 'WORLD2_COMPLETION_RUNTIME', ownerModule: 'devpulse_v2_world2_completion_runtime' },
  { alias: 'Verification Required', capabilityId: 'WORLD2_COMPLETION_RUNTIME', ownerModule: 'devpulse_v2_world2_completion_runtime' },
  { alias: 'Live Preview', capabilityId: 'LIVE_PREVIEW_RUNTIME', ownerModule: 'devpulse_v2_live_preview_runtime' },
  { alias: 'Preview Runtime', capabilityId: 'LIVE_PREVIEW_RUNTIME', ownerModule: 'devpulse_v2_live_preview_runtime' },
  { alias: 'Preview Session', capabilityId: 'LIVE_PREVIEW_RUNTIME', ownerModule: 'devpulse_v2_live_preview_runtime' },
  { alias: 'Preview Target', capabilityId: 'LIVE_PREVIEW_RUNTIME', ownerModule: 'devpulse_v2_live_preview_runtime' },
  { alias: 'Preview Ready', capabilityId: 'LIVE_PREVIEW_RUNTIME', ownerModule: 'devpulse_v2_live_preview_runtime' },
  { alias: 'Preview Blocked', capabilityId: 'LIVE_PREVIEW_RUNTIME', ownerModule: 'devpulse_v2_live_preview_runtime' },
  { alias: 'Preview Intelligence', capabilityId: 'PREVIEW_INTELLIGENCE', ownerModule: 'devpulse_v2_preview_intelligence' },
  { alias: 'Preview Readiness', capabilityId: 'PREVIEW_INTELLIGENCE', ownerModule: 'devpulse_v2_preview_intelligence' },
  { alias: 'Preview Capabilities', capabilityId: 'PREVIEW_INTELLIGENCE', ownerModule: 'devpulse_v2_preview_intelligence' },
  { alias: 'Preview Limitations', capabilityId: 'PREVIEW_INTELLIGENCE', ownerModule: 'devpulse_v2_preview_intelligence' },
  { alias: 'Observation Plan', capabilityId: 'PREVIEW_INTELLIGENCE', ownerModule: 'devpulse_v2_preview_intelligence' },
  { alias: 'Self Vision Preparation', capabilityId: 'PREVIEW_INTELLIGENCE', ownerModule: 'devpulse_v2_preview_intelligence' },
  { alias: 'Self Vision', capabilityId: 'SELF_VISION_RUNTIME', ownerModule: 'devpulse_v2_self_vision_runtime' },
  { alias: 'Self Vision Runtime', capabilityId: 'SELF_VISION_RUNTIME', ownerModule: 'devpulse_v2_self_vision_runtime' },
  { alias: 'Observation Session', capabilityId: 'SELF_VISION_RUNTIME', ownerModule: 'devpulse_v2_self_vision_runtime' },
  { alias: 'Observation Targets', capabilityId: 'SELF_VISION_RUNTIME', ownerModule: 'devpulse_v2_self_vision_runtime' },
  { alias: 'Capture Plan', capabilityId: 'SELF_VISION_RUNTIME', ownerModule: 'devpulse_v2_self_vision_runtime' },
  { alias: 'Vision Ready', capabilityId: 'SELF_VISION_RUNTIME', ownerModule: 'devpulse_v2_self_vision_runtime' },
  { alias: 'UI Inspection', capabilityId: 'UI_INSPECTION_ENGINE', ownerModule: 'devpulse_v2_ui_inspection_engine' },
  { alias: 'Layout Inspection', capabilityId: 'UI_INSPECTION_ENGINE', ownerModule: 'devpulse_v2_ui_inspection_engine' },
  { alias: 'Navigation Inspection', capabilityId: 'UI_INSPECTION_ENGINE', ownerModule: 'devpulse_v2_ui_inspection_engine' },
  { alias: 'Loading Inspection', capabilityId: 'UI_INSPECTION_ENGINE', ownerModule: 'devpulse_v2_ui_inspection_engine' },
  { alias: 'Responsive Inspection', capabilityId: 'UI_INSPECTION_ENGINE', ownerModule: 'devpulse_v2_ui_inspection_engine' },
  { alias: 'Inspection Ready', capabilityId: 'UI_INSPECTION_ENGINE', ownerModule: 'devpulse_v2_ui_inspection_engine' },
  { alias: 'Interaction Testing', capabilityId: 'INTERACTION_TESTING_ENGINE', ownerModule: 'devpulse_v2_interaction_testing_engine' },
  { alias: 'Button Testing', capabilityId: 'INTERACTION_TESTING_ENGINE', ownerModule: 'devpulse_v2_interaction_testing_engine' },
  { alias: 'Navigation Testing', capabilityId: 'INTERACTION_TESTING_ENGINE', ownerModule: 'devpulse_v2_interaction_testing_engine' },
  { alias: 'Workflow Testing', capabilityId: 'INTERACTION_TESTING_ENGINE', ownerModule: 'devpulse_v2_interaction_testing_engine' },
  { alias: 'Interaction Results', capabilityId: 'INTERACTION_TESTING_ENGINE', ownerModule: 'devpulse_v2_interaction_testing_engine' },
  { alias: 'Interaction Ready', capabilityId: 'INTERACTION_TESTING_ENGINE', ownerModule: 'devpulse_v2_interaction_testing_engine' },
  { alias: 'Visual Verification', capabilityId: 'VISUAL_VERIFICATION_ENGINE', ownerModule: 'devpulse_v2_visual_verification_engine' },
  { alias: 'Verification Results', capabilityId: 'VISUAL_VERIFICATION_ENGINE', ownerModule: 'devpulse_v2_visual_verification_engine' },
  { alias: 'Verification Evidence', capabilityId: 'VISUAL_VERIFICATION_ENGINE', ownerModule: 'devpulse_v2_visual_verification_engine' },
  { alias: 'Verification Risks', capabilityId: 'VISUAL_VERIFICATION_ENGINE', ownerModule: 'devpulse_v2_visual_verification_engine' },
  { alias: 'Verification Ready', capabilityId: 'VISUAL_VERIFICATION_ENGINE', ownerModule: 'devpulse_v2_visual_verification_engine' },
  { alias: 'Verification Failed', capabilityId: 'VISUAL_VERIFICATION_ENGINE', ownerModule: 'devpulse_v2_visual_verification_engine' },
] as const;

export function resolveFindPanelAlias(query: string): FindPanelAlias | null {
  const lower = query.toLowerCase().trim();
  return WORLD2_BUILDER_PACKET_FIND_ALIASES.find((a) => lower.includes(a.alias.toLowerCase())) ?? null;
}
