/**
 * Capability truth registry — PROVEN / PARTIALLY_PROVEN / NOT_PROVEN / UNKNOWN from synchronized chain truth.
 */

import {
  assessRepositoryTypecheckReality,
  getLatestRepositoryTypecheckBaseline,
} from '../repository-typecheck-reality/index.js';
import type { ConnectedExecutionChainTruth } from '../founder-test-integration/connected-execution-chain-truth.js';
import { CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE } from '../founder-test-integration/connected-execution-chain-truth.js';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import { CORE_CAPABILITY_DEFINITIONS } from './chat-operational-self-knowledge-registry.js';
import type {
  CapabilityTruthEntry,
  CapabilityTruthLevel,
  CapabilityTruthRegistry,
} from './chat-operational-self-knowledge-types.js';

function truthFromProven(proven: boolean): CapabilityTruthLevel {
  return proven ? 'PROVEN' : 'NOT_PROVEN';
}

function countByLevel(entries: CapabilityTruthEntry[], level: CapabilityTruthLevel): number {
  return entries.filter((e) => e.truthLevel === level).length;
}

export function buildCapabilityTruthRegistry(
  rootDir: string,
  executionChainTruth: ConnectedExecutionChainTruth,
): CapabilityTruthRegistry {
  const buildMaterialization = assessConnectedBuildExecution({ rootDir });
  const typecheck =
    getLatestRepositoryTypecheckBaseline() ??
    assessRepositoryTypecheckReality({ source: 'NOT_RUN' });

  const truthSource = CONNECTED_EXECUTION_CHAIN_TRUTH_SOURCE;
  const buildTruth =
    executionChainTruth.buildProven && buildMaterialization.report.proofLevel === 'PROVEN'
      ? 'PROVEN'
      : executionChainTruth.buildProven
        ? 'PROVEN'
        : buildMaterialization.report.proofLevel === 'PARTIAL'
          ? 'PARTIALLY_PROVEN'
          : 'NOT_PROVEN';

  const entries: CapabilityTruthEntry[] = [
    {
      readOnly: true,
      capabilityId: 'requirements_extraction',
      label: 'Requirements extraction',
      truthLevel: truthFromProven(executionChainTruth.requirementsProven),
      evidenceSource: truthSource,
      detail: `Requirements proven: ${executionChainTruth.requirementsProven}`,
    },
    {
      readOnly: true,
      capabilityId: 'planning',
      label: 'Planning',
      truthLevel: truthFromProven(executionChainTruth.planProven),
      evidenceSource: truthSource,
      detail: `Plan proven: ${executionChainTruth.planProven}`,
    },
    {
      readOnly: true,
      capabilityId: 'build_materialization',
      label: 'Build materialization',
      truthLevel: buildTruth,
      evidenceSource: truthSource,
      detail: `BUILD proven: ${executionChainTruth.buildProven}; materialization ${buildMaterialization.report.buildMaterialization.materializationState}`,
    },
    {
      readOnly: true,
      capabilityId: 'runtime_execution',
      label: 'Runtime execution',
      truthLevel: truthFromProven(executionChainTruth.runtimeProven),
      evidenceSource: truthSource,
      detail: `Runtime proven: ${executionChainTruth.runtimeProven}`,
    },
    {
      readOnly: true,
      capabilityId: 'preview_execution',
      label: 'Preview execution',
      truthLevel: truthFromProven(executionChainTruth.previewProven),
      evidenceSource: truthSource,
      detail: `Preview proven: ${executionChainTruth.previewProven}`,
    },
    {
      readOnly: true,
      capabilityId: 'verification_execution',
      label: 'Verification execution',
      truthLevel: truthFromProven(executionChainTruth.verificationProven),
      evidenceSource: truthSource,
      detail: `Verification proven: ${executionChainTruth.verificationProven}`,
    },
    {
      readOnly: true,
      capabilityId: 'launch_execution',
      label: 'Launch execution',
      truthLevel: truthFromProven(executionChainTruth.launchProven),
      evidenceSource: truthSource,
      detail: `Launch proven: ${executionChainTruth.launchProven}`,
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
      detail: 'Operational self-knowledge synchronized to connected execution chain truth',
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
  const priority = [
    'runtime_execution',
    'preview_execution',
    'verification_execution',
    'launch_execution',
    'build_materialization',
  ];
  for (const id of priority) {
    const entry = registry.entries.find((e) => e.capabilityId === id);
    if (entry && (entry.truthLevel === 'NOT_PROVEN' || entry.truthLevel === 'UNKNOWN')) {
      return entry;
    }
  }
  return registry.entries.find((e) => e.truthLevel === 'NOT_PROVEN') ?? null;
}

export function getCapabilityTruthEntry(
  registry: CapabilityTruthRegistry,
  capabilityId: string,
): CapabilityTruthEntry | null {
  return registry.entries.find((e) => e.capabilityId === capabilityId) ?? null;
}
