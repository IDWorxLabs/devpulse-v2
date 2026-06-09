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
  {
    capabilityId: 'VERIFICATION_EVIDENCE_ENGINE',
    label: 'Verification Evidence Engine',
    phase: 16.10,
    ownerModule: 'devpulse_v2_verification_evidence_engine',
    extensionOnly: true,
  },
  {
    capabilityId: 'VERIFICATION_REPORTING_ENGINE',
    label: 'Verification Reporting Engine',
    phase: 16.11,
    ownerModule: 'devpulse_v2_verification_reporting_engine',
    extensionOnly: true,
  },
  {
    capabilityId: 'UNIFIED_VERIFICATION_ENTRY',
    label: 'Unified Verification Entry',
    phase: 16.12,
    ownerModule: 'devpulse_v2_unified_verification_entry',
    extensionOnly: true,
  },
  {
    capabilityId: 'CLOUD_RUNTIME_FOUNDATION',
    label: 'Cloud Runtime Foundation',
    phase: 17.1,
    ownerModule: 'devpulse_v2_cloud_runtime_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'WORKSPACE_HOSTING_FOUNDATION',
    label: 'Workspace Hosting Foundation',
    phase: 17.2,
    ownerModule: 'devpulse_v2_workspace_hosting_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'PERSISTENT_BUILD_RUNTIME_FOUNDATION',
    label: 'Persistent Build Runtime Foundation',
    phase: 17.3,
    ownerModule: 'devpulse_v2_persistent_build_runtime_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'CLOUD_VERIFICATION_FOUNDATION',
    label: 'Cloud Verification Foundation',
    phase: 17.4,
    ownerModule: 'devpulse_v2_cloud_verification_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'CLOUD_RECOVERY_FOUNDATION',
    label: 'Cloud Recovery Foundation',
    phase: 17.5,
    ownerModule: 'devpulse_v2_cloud_recovery_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'CLOUD_MONITORING_FOUNDATION',
    label: 'Cloud Monitoring Foundation',
    phase: 17.6,
    ownerModule: 'devpulse_v2_cloud_monitoring_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'MOBILE_COMMAND_RUNTIME_FOUNDATION',
    label: 'Mobile Command Runtime Foundation',
    phase: 18.1,
    ownerModule: 'devpulse_v2_mobile_command_runtime_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'MOBILE_CHAT_RUNTIME_FOUNDATION',
    label: 'Mobile Chat Runtime Foundation',
    phase: 18.2,
    ownerModule: 'devpulse_v2_mobile_chat_runtime_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'MOBILE_PREVIEW_RUNTIME_FOUNDATION',
    label: 'Mobile Preview Runtime Foundation',
    phase: 18.3,
    ownerModule: 'devpulse_v2_mobile_preview_runtime_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'MOBILE_APPROVAL_RUNTIME_FOUNDATION',
    label: 'Mobile Approval Runtime Foundation',
    phase: 18.4,
    ownerModule: 'devpulse_v2_mobile_approval_runtime_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'CROSS_DEVICE_RUNTIME_FOUNDATION',
    label: 'Cross Device Runtime Foundation',
    phase: 18.5,
    ownerModule: 'devpulse_v2_cross_device_runtime_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'FOUNDER_NOTIFICATION_RUNTIME_FOUNDATION',
    label: 'Founder Notification Runtime Foundation',
    phase: 18.6,
    ownerModule: 'devpulse_v2_founder_notification_runtime_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'FOUNDER_INBOX_FOUNDATION',
    label: 'Founder Inbox Foundation',
    phase: 18.7,
    ownerModule: 'devpulse_v2_founder_inbox_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'NOTIFICATION_DELIVERY_FOUNDATION',
    label: 'Notification Delivery Foundation',
    phase: 18.8,
    ownerModule: 'devpulse_v2_notification_delivery_foundation',
    extensionOnly: true,
  },
  {
    capabilityId: 'MOBILE_PUSH_FOUNDATION',
    label: 'Mobile Push Foundation',
    phase: 18.9,
    ownerModule: 'devpulse_v2_mobile_push_foundation',
    extensionOnly: true,
  },
] as const;

export function isIntelligenceConsoleCapability(capabilityId: string): boolean {
  return INTELLIGENCE_CONSOLE_CAPABILITIES.some((c) => c.capabilityId === capabilityId);
}
