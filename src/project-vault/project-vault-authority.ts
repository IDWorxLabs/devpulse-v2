/**
 * DevPulse V2 Project Vault Authority — lightweight in-memory project memory.
 * Does NOT calculate trust, become answer authority, or execute work.
 */

import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import { TRUST_OWNER_MODULE } from '../trust-engine/types.js';
import type { TrustResult } from '../trust-engine/types.js';
import { formatProjectVaultReport } from './project-vault-report.js';
import type {
  ProjectFact,
  ProjectRecord,
  ProjectSnapshot,
  ProjectVaultState,
} from './types.js';
import {
  DEFAULT_PROJECT_PHASE,
  VAULT_OWNER_MODULE,
} from './types.js';

let singleton: DevPulseV2ProjectVaultAuthority | null = null;

function createProjectId(): string {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createFactId(): string {
  return `fact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSnapshotId(): string {
  return `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneProject(project: ProjectRecord): ProjectRecord {
  return {
    ...project,
    facts: project.facts.map((f) => ({ ...f })),
    warnings: [...project.warnings],
    errors: [...project.errors],
  };
}

export class DevPulseV2ProjectVaultAuthority {
  private readonly projects = new Map<string, ProjectRecord>();
  private readonly snapshots = new Map<string, ProjectSnapshot[]>();
  private vaultWarnings: string[] = [];
  private vaultErrors: string[] = [];

  static readonly ownerModule = VAULT_OWNER_MODULE;
  static readonly ownerDomain = 'project_vault' as const;

  static assertRegistryOwnership(): boolean {
    const owner = getDevPulseV2Owner('project_vault');
    return owner.ownerModule === VAULT_OWNER_MODULE;
  }

  static assertDoesNotReplaceTrustEngine(): boolean {
    const trustOwner = getDevPulseV2Owner('trust_engine');
    return trustOwner.ownerModule === TRUST_OWNER_MODULE;
  }

  createProject(name: string, summary: string): ProjectRecord {
    const now = Date.now();
    const project: ProjectRecord = {
      projectId: createProjectId(),
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      status: 'ACTIVE',
      phase: DEFAULT_PROJECT_PHASE,
      summary: summary.trim(),
      facts: [],
      warnings: [],
      errors: [],
    };

    if (!project.name) {
      project.errors.push('Project name is required');
      this.vaultErrors.push('createProject rejected empty name');
    } else {
      this.projects.set(project.projectId, project);
    }

    return cloneProject(project);
  }

  getProject(projectId: string): ProjectRecord | null {
    const project = this.projects.get(projectId);
    return project ? cloneProject(project) : null;
  }

  listProjects(): ProjectRecord[] {
    return [...this.projects.values()]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(cloneProject);
  }

  addProjectFact(
    projectId: string,
    fact: Omit<ProjectFact, 'factId' | 'projectId' | 'createdAt'>,
  ): ProjectFact | null {
    const project = this.projects.get(projectId);
    if (!project) {
      this.vaultErrors.push(`addProjectFact: project not found: ${projectId}`);
      return null;
    }

    const record: ProjectFact = {
      factId: createFactId(),
      projectId,
      createdAt: Date.now(),
      source: fact.source,
      label: fact.label.trim(),
      value: fact.value.trim(),
      confidence: fact.confidence,
    };

    project.facts.push(record);
    project.updatedAt = Date.now();
    return { ...record };
  }

  /**
   * Store Trust Engine summary facts — vault stores only; Trust Engine remains trust owner.
   */
  storeTrustEngineSummaryFacts(
    projectId: string,
    trustResult: TrustResult,
  ): ProjectFact[] {
    const stored: ProjectFact[] = [];

    const summaryFact = this.addProjectFact(projectId, {
      source: 'TRUST_ENGINE',
      label: 'trust_status',
      value: trustResult.status,
      confidence: trustResult.confidence,
    });
    if (summaryFact) stored.push(summaryFact);

    const scoreFact = this.addProjectFact(projectId, {
      source: 'TRUST_ENGINE',
      label: 'trust_score',
      value: String(trustResult.trustScore),
      confidence: trustResult.confidence,
    });
    if (scoreFact) stored.push(scoreFact);

    const idFact = this.addProjectFact(projectId, {
      source: 'TRUST_ENGINE',
      label: 'trust_id',
      value: trustResult.trustId,
      confidence: 'HIGH',
    });
    if (idFact) stored.push(idFact);

    return stored;
  }

  createProjectSnapshot(projectId: string): ProjectSnapshot | null {
    const project = this.projects.get(projectId);
    if (!project) {
      this.vaultErrors.push(`createProjectSnapshot: project not found: ${projectId}`);
      return null;
    }

    const snapshot: ProjectSnapshot = {
      snapshotId: createSnapshotId(),
      projectId,
      capturedAt: Date.now(),
      name: project.name,
      status: project.status,
      phase: project.phase,
      summary: project.summary,
      factCount: project.facts.length,
      facts: project.facts.map((f) => ({ ...f })),
    };

    const existing = this.snapshots.get(projectId) ?? [];
    existing.push(snapshot);
    this.snapshots.set(projectId, existing);
    project.updatedAt = snapshot.capturedAt;

    return { ...snapshot, facts: snapshot.facts.map((f) => ({ ...f })) };
  }

  getVaultState(): ProjectVaultState {
    const projects = [...this.projects.values()];
    const factCount = projects.reduce((sum, p) => sum + p.facts.length, 0);
    const snapshotCount = [...this.snapshots.values()].reduce(
      (sum, list) => sum + list.length,
      0,
    );
    const latest = projects.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

    return {
      ownerModule: VAULT_OWNER_MODULE,
      projectCount: projects.length,
      activeProjectCount: projects.filter((p) => p.status === 'ACTIVE').length,
      factCount,
      snapshotCount,
      latestProjectId: latest?.projectId ?? null,
      warnings: [...this.vaultWarnings],
      errors: [...this.vaultErrors],
    };
  }

  formatReport(): string {
    const state = this.getVaultState();
    const latest =
      state.latestProjectId !== null
        ? this.getProject(state.latestProjectId)
        : null;
    return formatProjectVaultReport(state, latest);
  }
}

export function createDevPulseV2ProjectVaultAuthority(): DevPulseV2ProjectVaultAuthority {
  singleton = new DevPulseV2ProjectVaultAuthority();
  return singleton;
}

export function getDevPulseV2ProjectVaultAuthority(): DevPulseV2ProjectVaultAuthority {
  if (!singleton) {
    singleton = new DevPulseV2ProjectVaultAuthority();
  }
  return singleton;
}

export function resetDevPulseV2ProjectVaultAuthorityForTests(): DevPulseV2ProjectVaultAuthority {
  singleton = new DevPulseV2ProjectVaultAuthority();
  return singleton;
}
