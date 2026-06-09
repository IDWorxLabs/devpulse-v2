/**
 * Project Understanding runtime — brain integration and shared memory observation.
 */

import { getSharedMemoryStore } from '../shared-memory/shared-memory-store.js';
import { ensureSharedMemorySeeded } from '../shared-memory/shared-memory-runtime.js';
import { getCurrentProjectProfile, profileKey, resetProjectProfileForTests } from './project-profile-store.js';
import { resetProjectKnowledgeModelForTests, resetProjectFactIdCounterForTests } from './project-knowledge-model.js';
import { processProjectUnderstanding } from './project-understanding-engine.js';
import type { ProjectUnderstandingDiagnostics } from './project-understanding-types.js';

let observationStored = false;
let lastProjectQuery: string | null = null;

export function ensureProjectUnderstandingObservation(): void {
  if (observationStored) return;
  ensureSharedMemorySeeded();
  const store = getSharedMemoryStore();
  const existing = store.searchMemories('Project Understanding Engine connected');
  if (existing.some((m) => m.title === 'Project Understanding Engine connected')) {
    observationStored = true;
    return;
  }
  store.addMemory({
    category: 'OBSERVATION',
    title: 'Project Understanding Engine connected',
    summary: 'Project Understanding Engine is connected to Command Center Brain for structured project comprehension.',
    createdAt: Date.now(),
    sourceSystem: 'project_understanding_engine',
    phase: 11.4,
    tags: ['project understanding', 'connected', 'phase 11.4'],
  });
  observationStored = true;
}

export function resetProjectUnderstandingForTests(): void {
  resetProjectProfileForTests();
  resetProjectKnowledgeModelForTests();
  resetProjectFactIdCounterForTests();
  observationStored = false;
  lastProjectQuery = null;
}

export function processProjectUnderstandingRequest(message: string) {
  ensureProjectUnderstandingObservation();
  lastProjectQuery = message;
  return processProjectUnderstanding(message);
}

export function getProjectUnderstandingDiagnostics(): ProjectUnderstandingDiagnostics {
  const profile = getCurrentProjectProfile();
  return {
    projectUnderstandingActive: true,
    currentProject: profile.name,
    projectStatus: profile.status,
    missingCapabilityCount: profile.missingCapabilities.length,
    riskCount: profile.riskItems.length,
    lastProjectQuery,
  };
}

export function projectUnderstandingKey(): string {
  return profileKey();
}

let singleton: DevPulseV2ProjectUnderstandingEngine | null = null;

export class DevPulseV2ProjectUnderstandingEngine {
  static readonly ownerModule = 'devpulse_v2_project_understanding_engine';
  static readonly ownerDomain = 'project_understanding_engine' as const;

  static getProfile() {
    return getCurrentProjectProfile();
  }
}

export function getDevPulseV2ProjectUnderstandingEngine(): DevPulseV2ProjectUnderstandingEngine {
  if (!singleton) singleton = new DevPulseV2ProjectUnderstandingEngine();
  return singleton;
}
