/**
 * Experience surface engine — descriptive surfaces only. No UI rendering.
 */

import type { ExperienceSurface, ExperienceSurfaceRecord } from './types.js';
import { KNOWN_EXPERIENCE_SURFACES } from './types.js';

const SURFACE_DEFINITIONS: Record<
  ExperienceSurface,
  { label: string; description: string; systems: string[]; purpose: string }
> = {
  FOUNDER_HOME: {
    label: 'Founder Home',
    description: 'Entry point — understand what DevPulse is and where to begin',
    systems: ['central_brain', 'shell_authority'],
    purpose: 'Orient the founder before entering a project',
  },
  PROJECT_ENTRY: {
    label: 'Project Entry',
    description: 'Capture a project idea and open a World 2 workspace',
    systems: ['world2_workspace_foundation', 'intent_architecture'],
    purpose: 'Start a new project journey from an idea',
  },
  PROJECT_WORKSPACE: {
    label: 'Project Workspace',
    description: 'Primary project context — planning, status, and navigation hub',
    systems: ['world2_workspace_foundation', 'world2_execution_planner'],
    purpose: 'Work within a single governed project',
  },
  WORLD2_WORKSPACE: {
    label: 'World 2 Workspace',
    description: 'Simulation, build preparation, and autonomous builder exposure',
    systems: [
      'world2_simulation_runtime',
      'world2_autonomous_builder',
      'world2_completion_verifier',
      'world2_learning_loop',
    ],
    purpose: 'See how World 2 participates without modifying World 1',
  },
  VERIFICATION_WORKSPACE: {
    label: 'Verification Workspace',
    description: 'Verification loops, evidence ledger, and gated apply awareness',
    systems: ['verification_gated_apply', 'execution_evidence_ledger', 'execution_verification_loop'],
    purpose: 'Understand verification gates before any apply',
  },
  TRUST_WORKSPACE: {
    label: 'Trust Workspace',
    description: 'Trust engine review and confidence signals',
    systems: ['trust_engine', 'evidence_registry'],
    purpose: 'Review trust posture — does not replace trust engine',
  },
  MOBILE_WORKSPACE: {
    label: 'Mobile Workspace',
    description: 'Mobile command, chat, preview, approval, and continuity surfaces',
    systems: [
      'mobile_command_foundation',
      'mobile_chat_interface',
      'mobile_live_preview_foundation',
      'mobile_approval_flow_foundation',
      'cross_device_continuity_foundation',
    ],
    purpose: 'Monitor and approve remotely — no mobile execution duplication',
  },
  SELF_EVOLUTION_WORKSPACE: {
    label: 'Self-Evolution Workspace',
    description: 'Capability gaps, learning, drift, complexity, and future prediction exposure',
    systems: [
      'missing_capability_detector',
      'safe_capability_acquisition',
      'self_learning_engine',
      'architecture_drift_detection',
      'complexity_score_foundation',
      'future_problem_prediction',
    ],
    purpose: 'Review self-evolution intelligence outputs — observer only',
  },
  PROJECT_COMPLETION_WORKSPACE: {
    label: 'Project Completion',
    description: 'Completion verification and founder sign-off path',
    systems: ['world2_completion_verifier', 'founder_approval_execution_gate'],
    purpose: 'Understand how project completion happens',
  },
};

export function surfacesKey(surfaces: ExperienceSurface[]): string {
  return surfaces.join('|');
}

export function generateExperienceSurfaces(): ExperienceSurfaceRecord[] {
  return KNOWN_EXPERIENCE_SURFACES.map((surfaceType, index) => {
    const def = SURFACE_DEFINITIONS[surfaceType];
    return {
      surfaceId: `surface-${(index + 1).toString().padStart(2, '0')}`,
      surfaceType,
      surfaceLabel: def.label,
      surfaceDescription: def.description,
      connectedSystems: [...def.systems],
      founderPurpose: def.purpose,
    };
  });
}

export function getSurfaceSequence(): ExperienceSurface[] {
  return [...KNOWN_EXPERIENCE_SURFACES];
}

export function getSurfaceForStage(stage: string): ExperienceSurface | null {
  const map: Partial<Record<string, ExperienceSurface>> = {
    IDEA_CAPTURE: 'PROJECT_ENTRY',
    PROJECT_PLANNING: 'PROJECT_WORKSPACE',
    WORLD2_SIMULATION: 'WORLD2_WORKSPACE',
    BUILD_PREPARATION: 'WORLD2_WORKSPACE',
    VERIFICATION: 'VERIFICATION_WORKSPACE',
    TRUST_REVIEW: 'TRUST_WORKSPACE',
    MOBILE_MONITORING: 'MOBILE_WORKSPACE',
    SELF_EVOLUTION_ANALYSIS: 'SELF_EVOLUTION_WORKSPACE',
    PROJECT_COMPLETION: 'PROJECT_COMPLETION_WORKSPACE',
  };
  return map[stage] ?? null;
}

export function isWorld2Surface(surface: ExperienceSurface): boolean {
  return surface === 'WORLD2_WORKSPACE' || surface === 'PROJECT_WORKSPACE';
}

export function isMobileSurface(surface: ExperienceSurface): boolean {
  return surface === 'MOBILE_WORKSPACE';
}

export function isSelfEvolutionSurface(surface: ExperienceSurface): boolean {
  return surface === 'SELF_EVOLUTION_WORKSPACE';
}
