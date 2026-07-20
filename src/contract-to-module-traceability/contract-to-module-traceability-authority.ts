/**
 * Contract-to-Module Traceability Authority V1 — canonical orchestrator.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { CanonicalProductContract } from '../product-faithfulness-v2/generation-faithfulness-types.js';
import type {
  ContractToModuleTraceabilityGraph,
  ContractToModuleTraceabilityInput,
  ContractToModuleTraceabilityReport,
  TransformationBoundary,
} from './contract-to-module-traceability-types.js';
import {
  buildContractToModuleTraceabilityGraph,
  fingerprintTraceabilityGraph,
  fingerprintTraceabilityFinding,
  fingerprintTraceabilityReport,
} from './contract-to-module-graph-builder.js';
import { validateTraceabilityGraph } from './contract-to-module-graph-validator.js';
import { validateTransformationBoundary } from './contract-to-module-boundary-validator.js';
import { detectSilentConceptLoss, detectMissingApprovedDescendants } from './contract-to-module-silent-loss-detector.js';
import { detectIllegalModuleIntroduction } from './contract-to-module-illegal-introduction-detector.js';
import { detectUnapprovedGeneratedAncestors } from './contract-to-module-module-ancestry.js';
import { generateTraceabilityReport } from './contract-to-module-report.js';
import { runPreMaterializationTraceabilityGate, filterModulesByApprovedPlan, resolveMaterializationModuleIdsFromEnvelope, isModuleAllowedForMaterialization } from './contract-to-module-materialization-gate.js';
import { normalizeTraceabilityIdentity } from './contract-to-module-identity.js';
import { registerTraceabilityNode } from './contract-to-module-node-registry.js';
import { registerTraceabilityEdge } from './contract-to-module-edge-registry.js';

export {
  normalizeTraceabilityIdentity,
  registerTraceabilityNode,
  registerTraceabilityEdge,
  buildContractToModuleTraceabilityGraph,
  validateTraceabilityGraph,
  validateTransformationBoundary,
  detectMissingApprovedDescendants,
  detectUnapprovedGeneratedAncestors,
  detectSilentConceptLoss,
  detectIllegalModuleIntroduction,
  generateTraceabilityReport,
  fingerprintTraceabilityGraph,
  fingerprintTraceabilityFinding,
  fingerprintTraceabilityReport,
  filterModulesByApprovedPlan,
  runPreMaterializationTraceabilityGate,
  resolveMaterializationModuleIdsFromEnvelope,
  isModuleAllowedForMaterialization,
};

export function requireCompleteContractToModuleTraceability(report: ContractToModuleTraceabilityReport): void {
  if (report.complianceOutcome !== 'TRACEABILITY_COMPLIANT') {
    throw new Error(`traceability_blocked:${report.complianceOutcome}:${report.graph.findings.map((f) => f.diagnosticCode).join(',')}`);
  }
}

export function runContractToModuleTraceabilityEvaluation(input: {
  contract: CanonicalProductContract;
  envelope: ApprovedProductionBuildEnvelope;
  workspaceFiles: readonly GeneratedWorkspaceFile[];
  proposedModuleIds: readonly string[];
  universalFeatureNames: readonly string[];
}): ContractToModuleTraceabilityReport {
  const graph = buildContractToModuleTraceabilityGraph({
    contract: input.contract,
    envelope: input.envelope,
    workspaceFiles: input.workspaceFiles,
    proposedModuleIds: input.proposedModuleIds,
    universalFeatureNames: input.universalFeatureNames,
  });
  validateTraceabilityGraph(graph);
  return generateTraceabilityReport(graph);
}

function featureContractNamesFromJson(source: string): string[] {
  if (!source.trim()) return [];
  try {
    const parsed = JSON.parse(source) as {
      entities?: Array<Record<string, unknown>>;
      actions?: Array<Record<string, unknown>>;
      rules?: Array<Record<string, unknown>>;
      workflows?: Array<Record<string, unknown>>;
      outcomes?: Array<Record<string, unknown>>;
      modules?: unknown[];
      navigation?: unknown[];
      features?: Array<Record<string, unknown>>;
    };
    const names = new Set<string>();
    const add = (value: unknown): void => {
      if (typeof value === 'string' && value.trim()) names.add(value.trim());
    };
    for (const entry of parsed.entities ?? []) {
      add(entry.id);
      add(entry.label);
      add(entry.pluralLabel);
      add(entry.navLabel);
      add(entry.slug);
    }
    for (const collection of [
      parsed.actions,
      parsed.rules,
      parsed.workflows,
      parsed.outcomes,
      parsed.features,
    ]) {
      for (const entry of collection ?? []) {
        add(entry.id);
        add(entry.label);
        add(entry.featureName);
      }
    }
    for (const value of parsed.modules ?? []) add(value);
    for (const value of parsed.navigation ?? []) add(value);
    return [...names];
  } catch {
    return [...source.matchAll(/"featureName"\s*:\s*"([^"]+)"/g)].map((match) => match[1]!);
  }
}

export function loadTraceabilityInputFromWorkspace(input: {
  contract: CanonicalProductContract;
  envelope: ApprovedProductionBuildEnvelope;
  workspaceFiles: readonly GeneratedWorkspaceFile[];
  proposedModuleIds: readonly string[];
}): ContractToModuleTraceabilityInput {
  const featureContractContent =
    input.workspaceFiles.find((file) => file.relativePath === 'feature-contract.json')?.content ??
    input.workspaceFiles.find((file) => file.relativePath === 'universal-feature-contract.json')?.content ??
    '';
  const universalFeatureNames = featureContractNamesFromJson(featureContractContent);
  return {
    contract: input.contract,
    envelope: input.envelope,
    workspaceFiles: input.workspaceFiles,
    proposedModuleIds: input.proposedModuleIds,
    universalFeatureNames,
  };
}
