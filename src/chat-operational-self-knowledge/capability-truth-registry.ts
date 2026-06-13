/**
 * Capability truth registry — PROVEN / PARTIALLY_PROVEN / NOT_PROVEN / UNKNOWN from authorities.
 */

import { assessAutonomousBuildExecutionProof } from '../autonomous-build-execution-proof/index.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import {
  assessRepositoryTypecheckReality,
  getLatestRepositoryTypecheckBaseline,
} from '../repository-typecheck-reality/index.js';
import { CORE_CAPABILITY_DEFINITIONS } from './chat-operational-self-knowledge-registry.js';
import type {
  CapabilityTruthEntry,
  CapabilityTruthLevel,
  CapabilityTruthRegistry,
} from './chat-operational-self-knowledge-types.js';

function stageTruth(proofLevel: string | undefined): CapabilityTruthLevel {
  if (proofLevel === 'PROVEN') return 'PROVEN';
  if (proofLevel === 'PARTIAL') return 'PARTIALLY_PROVEN';
  if (proofLevel === 'NOT_PROVEN') return 'NOT_PROVEN';
  return 'UNKNOWN';
}

function countByLevel(entries: CapabilityTruthEntry[], level: CapabilityTruthLevel): number {
  return entries.filter((e) => e.truthLevel === level).length;
}

export function buildCapabilityTruthRegistry(rootDir: string): CapabilityTruthRegistry {
  const executionProof = assessAutonomousBuildExecutionProof({ rootDir });
  const buildMaterialization = assessConnectedBuildExecution({ rootDir });
  const typecheck =
    getLatestRepositoryTypecheckBaseline() ??
    assessRepositoryTypecheckReality({ source: 'NOT_RUN' });

  const stageByName = new Map(
    executionProof.report.stageProofs.map((stage) => [stage.stage, stage.proofLevel]),
  );

  const entries: CapabilityTruthEntry[] = [
    {
      readOnly: true,
      capabilityId: 'requirements_extraction',
      label: 'Requirements extraction',
      truthLevel: stageTruth(stageByName.get('REQUIREMENTS')),
      evidenceSource: 'autonomous-build-execution-proof',
      detail: `Stage REQUIREMENTS: ${stageByName.get('REQUIREMENTS') ?? 'UNKNOWN'}`,
    },
    {
      readOnly: true,
      capabilityId: 'planning',
      label: 'Planning',
      truthLevel: stageTruth(stageByName.get('PLAN')),
      evidenceSource: 'autonomous-build-execution-proof',
      detail: `Stage PLAN: ${stageByName.get('PLAN') ?? 'UNKNOWN'}`,
    },
    {
      readOnly: true,
      capabilityId: 'build_materialization',
      label: 'Build materialization',
      truthLevel: stageTruth(stageByName.get('BUILD')),
      evidenceSource: 'connected-build-execution',
      detail: `BUILD proof ${buildMaterialization.report.proofLevel}; materialization ${buildMaterialization.report.buildMaterialization.materializationState}`,
    },
    {
      readOnly: true,
      capabilityId: 'runtime_execution',
      label: 'Runtime execution',
      truthLevel: stageTruth(stageByName.get('RUNTIME')),
      evidenceSource: 'autonomous-build-execution-proof',
      detail: `Stage RUNTIME: ${stageByName.get('RUNTIME') ?? 'UNKNOWN'}`,
    },
    {
      readOnly: true,
      capabilityId: 'preview_execution',
      label: 'Preview execution',
      truthLevel: stageTruth(stageByName.get('PREVIEW')),
      evidenceSource: 'autonomous-build-execution-proof',
      detail: `Stage PREVIEW: ${stageByName.get('PREVIEW') ?? 'UNKNOWN'}`,
    },
    {
      readOnly: true,
      capabilityId: 'verification_execution',
      label: 'Verification execution',
      truthLevel: stageTruth(stageByName.get('VERIFY')),
      evidenceSource: 'autonomous-build-execution-proof',
      detail: `Stage VERIFY: ${stageByName.get('VERIFY') ?? 'UNKNOWN'}`,
    },
    {
      readOnly: true,
      capabilityId: 'launch_execution',
      label: 'Launch execution',
      truthLevel: stageTruth(stageByName.get('LAUNCH')),
      evidenceSource: 'autonomous-build-execution-proof',
      detail: `Stage LAUNCH: ${stageByName.get('LAUNCH') ?? 'UNKNOWN'}`,
    },
    {
      readOnly: true,
      capabilityId: 'repository_typecheck',
      label: 'Repository typecheck baseline',
      truthLevel:
        typecheck.readinessState === 'TYPECHECK_CLEAN'
          ? 'PROVEN'
          : typecheck.readinessState === 'TYPECHECK_NOT_RUN'
            ? 'UNKNOWN'
            : typecheck.readinessState === 'TYPECHECK_WARNINGS'
              ? 'PARTIALLY_PROVEN'
              : 'NOT_PROVEN',
      evidenceSource: 'repository-typecheck-reality',
      detail: `Typecheck ${typecheck.readinessState}; errors ${typecheck.errorCount}`,
    },
    {
      readOnly: true,
      capabilityId: 'chat_intelligence',
      label: 'Chat operational intelligence',
      truthLevel: 'PARTIALLY_PROVEN',
      evidenceSource: 'chat-operational-self-knowledge',
      detail: 'Operational self-knowledge layer active with bounded evidence snapshot',
    },
  ];

  for (const def of CORE_CAPABILITY_DEFINITIONS) {
    if (!entries.some((e) => e.capabilityId === def.id)) {
      entries.push({
        readOnly: true,
        capabilityId: def.id,
        label: def.label,
        truthLevel: 'UNKNOWN',
        evidenceSource: 'none',
        detail: 'No authority assessment available',
      });
    }
  }

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    entries,
    provenCount: countByLevel(entries, 'PROVEN'),
    partiallyProvenCount: countByLevel(entries, 'PARTIALLY_PROVEN'),
    notProvenCount: countByLevel(entries, 'NOT_PROVEN'),
    unknownCount: countByLevel(entries, 'UNKNOWN'),
  };
}

export function listCapabilitiesByTruthLevel(
  registry: CapabilityTruthRegistry,
  level: CapabilityTruthLevel,
): CapabilityTruthEntry[] {
  return registry.entries.filter((e) => e.truthLevel === level);
}

export function highestImpactWeakness(registry: CapabilityTruthRegistry): CapabilityTruthEntry | null {
  const priority = ['runtime_execution', 'preview_execution', 'verification_execution', 'launch_execution', 'build_materialization'];
  for (const id of priority) {
    const entry = registry.entries.find((e) => e.capabilityId === id);
    if (entry && (entry.truthLevel === 'NOT_PROVEN' || entry.truthLevel === 'UNKNOWN')) {
      return entry;
    }
  }
  return registry.entries.find((e) => e.truthLevel === 'NOT_PROVEN') ?? null;
}
