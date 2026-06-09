/**
 * Verification target registry — defines what DevPulse can verify.
 */

import {
  INITIAL_VERIFICATION_TARGET_CATEGORIES,
  type VerificationTarget,
  type VerificationTargetCategory,
} from './types.js';

const TARGET_META: Record<
  VerificationTargetCategory,
  { name: string; ownerModule: string; phase: number; evidence: string[] }
> = {
  WORLD2_TARGET: {
    name: 'World 2 Verification',
    ownerModule: 'devpulse_v2_world2_completion_runtime',
    phase: 15.6,
    evidence: ['WORLD2_COMPLETION_EVIDENCE', 'ROLLBACK_EVIDENCE'],
  },
  PREVIEW_TARGET: {
    name: 'Preview Verification',
    ownerModule: 'devpulse_v2_live_preview_runtime',
    phase: 16.1,
    evidence: ['PREVIEW_SESSION_EVIDENCE', 'PREVIEW_TARGET_EVIDENCE'],
  },
  SELF_VISION_TARGET: {
    name: 'Self Vision Verification',
    ownerModule: 'devpulse_v2_self_vision_runtime',
    phase: 16.3,
    evidence: ['OBSERVATION_SESSION_EVIDENCE', 'CAPTURE_PLAN_EVIDENCE'],
  },
  UI_INSPECTION_TARGET: {
    name: 'UI Inspection Verification',
    ownerModule: 'devpulse_v2_ui_inspection_engine',
    phase: 16.4,
    evidence: ['LAYOUT_STRUCTURE_EVIDENCE', 'NAVIGATION_STRUCTURE_EVIDENCE'],
  },
  INTERACTION_TARGET: {
    name: 'Interaction Verification',
    ownerModule: 'devpulse_v2_interaction_testing_engine',
    phase: 16.5,
    evidence: ['INTERACTION_OUTCOME_EVIDENCE', 'INTERACTION_PLAN_EVIDENCE'],
  },
  VISUAL_VERIFICATION_TARGET: {
    name: 'Visual Verification',
    ownerModule: 'devpulse_v2_visual_verification_engine',
    phase: 16.6,
    evidence: ['LAYOUT_EVIDENCE', 'INTERACTION_EVIDENCE', 'SELF_VISION_EVIDENCE'],
  },
  RUNTIME_TARGET: {
    name: 'Runtime Verification',
    ownerModule: 'devpulse_v2_runtime_verification_layer',
    phase: 14.6,
    evidence: ['TRUST_ASSESSMENT_EVIDENCE', 'VERIFICATION_GAP_EVIDENCE'],
  },
  COMMAND_CENTER_TARGET: {
    name: 'Command Center Verification',
    ownerModule: 'devpulse_v2_command_center_brain',
    phase: 13,
    evidence: ['ROUTING_EVIDENCE', 'RESPONSE_EVIDENCE'],
  },
  PROJECT_VAULT_TARGET: {
    name: 'Project Vault Verification',
    ownerModule: 'devpulse_v2_project_vault_intelligence',
    phase: 12,
    evidence: ['VAULT_PROFILE_EVIDENCE', 'VAULT_FACT_EVIDENCE'],
  },
  OPERATOR_FEED_TARGET: {
    name: 'Operator Feed Verification',
    ownerModule: 'devpulse_v2_operator_feed',
    phase: 13.1,
    evidence: ['FEED_STAGE_EVIDENCE', 'FEED_EVENT_EVIDENCE'],
  },
  TRUST_TARGET: {
    name: 'Trust Verification',
    ownerModule: 'devpulse_v2_trust_engine',
    phase: 6,
    evidence: ['TRUST_SCORE_EVIDENCE', 'TRUST_POLICY_EVIDENCE'],
  },
};

const targets = new Map<string, VerificationTarget>();
const categories = new Set<VerificationTargetCategory>();

export function resetVerificationTargetRegistryForTests(): void {
  targets.clear();
  categories.clear();
}

function targetIdFor(category: VerificationTargetCategory): string {
  return `vtarg-${category.toLowerCase().replace(/_/g, '-')}`;
}

export function buildInitialTargetDefinition(
  category: VerificationTargetCategory,
): VerificationTarget {
  const meta = TARGET_META[category];
  return {
    verificationTargetId: targetIdFor(category),
    verificationTargetName: meta.name,
    verificationCategory: category,
    ownerModule: meta.ownerModule,
    phase: meta.phase,
    dependencies: [],
    requirements: [],
    supportedEvidence: [...meta.evidence],
    createdAt: Date.now(),
    registryOnly: true,
  };
}

export interface RegisterTargetResult {
  ok: boolean;
  target: VerificationTarget | null;
  duplicate: boolean;
  error: string | null;
}

export function registerVerificationTarget(target: VerificationTarget): RegisterTargetResult {
  if (targets.has(target.verificationTargetId)) {
    return { ok: false, target: null, duplicate: true, error: 'Duplicate target rejected' };
  }
  if (categories.has(target.verificationCategory)) {
    return { ok: false, target: null, duplicate: true, error: 'Duplicate target category rejected' };
  }
  targets.set(target.verificationTargetId, target);
  categories.add(target.verificationCategory);
  return { ok: true, target, duplicate: false, error: null };
}

export function registerInitialTargets(): RegisterTargetResult[] {
  const results: RegisterTargetResult[] = [];
  for (const category of INITIAL_VERIFICATION_TARGET_CATEGORIES) {
    results.push(registerVerificationTarget(buildInitialTargetDefinition(category)));
  }
  return results;
}

export function getVerificationTarget(targetId: string): VerificationTarget | null {
  return targets.get(targetId) ?? null;
}

export function getVerificationTargetByCategory(
  category: VerificationTargetCategory,
): VerificationTarget | null {
  for (const target of targets.values()) {
    if (target.verificationCategory === category) return target;
  }
  return null;
}

export function listVerificationTargets(): VerificationTarget[] {
  return [...targets.values()];
}

export function updateVerificationTarget(
  targetId: string,
  patch: Partial<Pick<VerificationTarget, 'dependencies' | 'requirements'>>,
): VerificationTarget | null {
  const existing = targets.get(targetId);
  if (!existing) return null;
  const updated = { ...existing, ...patch };
  targets.set(targetId, updated);
  return updated;
}
