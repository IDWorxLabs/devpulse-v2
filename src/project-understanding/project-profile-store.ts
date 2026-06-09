/**
 * Project profile store — in-memory project profile. No persistence.
 */

import type { ProjectProfile } from './project-understanding-types.js';

const DEFAULT_PROFILE: ProjectProfile = {
  projectId: 'devpulse-v2',
  name: 'DevPulse V2',
  summary:
    'Chat-first intelligent development command center with governance, World 2 foundations, mobile command foundations, self-evolution foundations, runtime shell, Command Center Brain, cross-system awareness, and shared memory.',
  currentPhase: '11.6 — Unified Decision Layer Foundation',
  goal: 'Build a governed, chat-first intelligent development command center with honest foundation maturity and no fake execution claims.',
  status: 'FOUNDATION_BUILDING',
  completedMilestones: [
    'Governance Stack',
    'World 2 Foundation',
    'Mobile Command Foundation',
    'Self-Evolution Foundation',
    'Experience Layer Foundation',
    'Trust Engine Expansion',
    'Founder Reality Surface',
    'Command Center Runtime Shell',
    'Unified Command Center Brain',
    'Runtime Verification',
    'UX Stabilization',
    'Cross-System Awareness',
    'Shared Memory Layer',
    'Project Understanding Engine',
    'Project Knowledge Reasoning',
    'General Question Understanding Router',
    'Timeline Intelligence',
  ],
  missingCapabilities: [
    'Project execution runtime',
    'Code generation',
    'Live Preview runtime',
    'Persistent project storage',
    'Cloud runtime',
    'World 2 execution',
    'Development Reasoning',
    'Debugging Reasoning',
    'Execution Reasoning',
  ],
  blockedItems: [
    'Execution must not start until intelligence layers are complete.',
    'Cloud runtime must wait until local runtime understanding is stable.',
    'Project Vault UI must wait until Project Understanding foundation exists.',
  ],
  relatedSystems: [
    'Command Center Brain',
    'Shared Memory Layer',
    'Cross-System Awareness',
    'Trust Engine',
    'Governance Stack',
    'Operator Feed',
    'Founder Reality Surface',
  ],
  riskItems: [
    'Premature execution could bypass governance gates.',
    'Duplicate system ownership could fragment intelligence layers.',
    'Stale runtime servers can serve outdated brain behavior.',
    'Over-claiming maturity before runtime connection erodes founder trust.',
  ],
  nextRecommendedStep:
    'Complete Unified Decision Layer validation, then advance toward Development Reasoning Foundation — intelligence only, no execution.',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

let currentProfile: ProjectProfile = { ...DEFAULT_PROFILE };

export function getCurrentProjectProfile(): ProjectProfile {
  return { ...currentProfile };
}

export function setProjectProfileForTests(profile: ProjectProfile): void {
  currentProfile = { ...profile };
}

export function resetProjectProfileForTests(): void {
  currentProfile = { ...DEFAULT_PROFILE, createdAt: Date.now(), updatedAt: Date.now() };
}

export function profileKey(): string {
  return `${currentProfile.projectId}:${currentProfile.currentPhase}:${currentProfile.status}`;
}
