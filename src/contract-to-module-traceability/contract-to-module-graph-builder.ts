/**
 * Contract-to-Module Traceability Authority V1 — graph builder.
 */

import { createHash } from 'node:crypto';
import type {
  ContractToModuleTraceabilityGraph,
  ContractToModuleTraceabilityInput,
  ConceptPreservationOutcome,
  ModuleAncestryOutcome,
  TraceabilityFinding,
  TransformationBoundary,
} from './contract-to-module-traceability-types.js';
import { CONTRACT_TO_MODULE_TRACEABILITY_SOURCE } from './contract-to-module-traceability-types.js';
import { registerTraceabilityNode } from './contract-to-module-node-registry.js';
import { registerTraceabilityEdge } from './contract-to-module-edge-registry.js';
import { fingerprintTraceabilityValue, normalizeTraceabilityIdentity, traceabilityNodeId } from './contract-to-module-identity.js';
import { resolveInfrastructureModuleAncestry } from './contract-to-module-infrastructure-registry.js';
import { fingerprintWorkspaceFiles } from '../universal-production-readiness/production-readiness-input-loader.js';

function createFinding(
  partial: Omit<TraceabilityFinding, 'findingId' | 'fingerprint' | 'provenance' | 'readOnly'>,
  idx: number,
): TraceabilityFinding {
  const findingId = `cmt-finding-${partial.diagnosticCode}-${idx}`;
  return {
    readOnly: true,
    ...partial,
    findingId,
    provenance: [CONTRACT_TO_MODULE_TRACEABILITY_SOURCE, partial.diagnosticCode],
    fingerprint: fingerprintTraceabilityValue([findingId, partial.diagnosticCode, partial.expectedNodeId]),
  };
}

export function buildContractToModuleTraceabilityGraph(input: ContractToModuleTraceabilityInput): ContractToModuleTraceabilityGraph {
  const envelope = input.envelope;
  const contractFp = input.contract.contractId;
  const envelopeFp = envelope.buildFingerprint;
  const workspaceFp = fingerprintWorkspaceFiles(input.workspaceFiles);
  const approvedModuleIds = new Set(envelope.approvedModulePlan.moduleIds);
  const approvedEntries = envelope.approvedModulePlan.moduleEntries;
  const nodes = [];
  const edges = [];
  const findings: TraceabilityFinding[] = [];
  let findingIdx = 0;

  nodes.push(
    registerTraceabilityNode({
      nodeType: 'CANONICAL_PRODUCT_CONTRACT',
      canonicalIdentity: contractFp,
      displayName: input.contract.productIdentity,
      sourceAuthority: 'CANONICAL_PRODUCT_CONTRACT',
      sourceRecordId: contractFp,
      envelopeFingerprint: envelopeFp,
      contractFingerprint: contractFp,
      conceptIds: input.contract.allConceptNames.map((c) => normalizeTraceabilityIdentity(c)),
    }),
  );

  for (const concept of input.contract.allConceptNames) {
    const conceptId = normalizeTraceabilityIdentity(concept);
    nodes.push(
      registerTraceabilityNode({
        nodeType: 'APPROVED_PRODUCT_CONCEPT',
        canonicalIdentity: conceptId,
        displayName: concept,
        sourceAuthority: 'CANONICAL_PRODUCT_CONTRACT',
        sourceRecordId: concept,
        envelopeFingerprint: envelopeFp,
        contractFingerprint: contractFp,
        conceptIds: [conceptId],
      }),
    );
    edges.push(
      registerTraceabilityEdge({
        edgeType: 'REQUIREMENT_DECLARES_CONCEPT',
        fromNodeId: nodes[0]!.traceabilityNodeId,
        toNodeId: traceabilityNodeId('APPROVED_PRODUCT_CONCEPT', conceptId),
        sourceAuthority: 'CANONICAL_PRODUCT_CONTRACT',
        sourceRecordId: concept,
        reason: 'canonical concept declared',
      }),
    );
  }

  for (const entry of approvedEntries) {
    nodes.push(
      registerTraceabilityNode({
        nodeType: 'APPROVED_MODULE',
        canonicalIdentity: entry.moduleId,
        displayName: entry.displayName,
        sourceAuthority: 'CBGA_MODULE_PLAN',
        sourceRecordId: entry.moduleId,
        envelopeFingerprint: envelopeFp,
        contractFingerprint: contractFp,
        moduleIds: [entry.moduleId],
        conceptIds: entry.contractSource ? [normalizeTraceabilityIdentity(entry.contractSource)] : [],
        routeIds: [entry.route],
      }),
    );
    if (entry.contractSource) {
      const conceptNodeId = traceabilityNodeId('APPROVED_PRODUCT_CONCEPT', normalizeTraceabilityIdentity(entry.contractSource));
      edges.push(
        registerTraceabilityEdge({
          edgeType: 'FEATURE_PLANNED_AS_MODULE',
          fromNodeId: conceptNodeId,
          toNodeId: traceabilityNodeId('APPROVED_MODULE', entry.moduleId),
          sourceAuthority: 'CBGA_MODULE_PLAN',
          sourceRecordId: entry.moduleId,
          reason: 'approved module plan entry',
        }),
      );
    }
  }

  const generatedModuleIds = [...new Set(input.proposedModuleIds)].sort();
  for (const moduleId of generatedModuleIds) {
    nodes.push(
      registerTraceabilityNode({
        nodeType: 'GENERATED_MODULE',
        canonicalIdentity: moduleId,
        displayName: moduleId,
        sourceAuthority: 'MODULAR_FEATURE_MATERIALIZATION',
        sourceRecordId: moduleId,
        envelopeFingerprint: envelopeFp,
        contractFingerprint: contractFp,
        moduleIds: [moduleId],
      }),
    );
    const approvedNodeId = traceabilityNodeId('APPROVED_MODULE', moduleId);
    if (approvedModuleIds.has(moduleId)) {
      edges.push(
        registerTraceabilityEdge({
          edgeType: 'CONTRIBUTION_GENERATES_MODULE',
          fromNodeId: approvedNodeId,
          toNodeId: traceabilityNodeId('GENERATED_MODULE', moduleId),
          sourceAuthority: 'MODULAR_FEATURE_MATERIALIZATION',
          sourceRecordId: moduleId,
          reason: 'approved module materialized',
        }),
      );
    }
  }

  const conceptPreservation: { conceptId: string; outcome: ConceptPreservationOutcome; firstBrokenBoundary: TransformationBoundary | 'UNKNOWN' }[] = [];
  for (const concept of input.contract.allConceptNames) {
    const conceptId = normalizeTraceabilityIdentity(concept);
    const inFeature =
      input.universalFeatureNames.some(
        (f) =>
          normalizeTraceabilityIdentity(f) === conceptId ||
          f.toLowerCase().includes(concept.toLowerCase()),
      ) ||
      // Approved module IDs/display names are authoritative feature surfaces when the UFC
      // projection was bound through CBGA — never treat an empty obsolete-schema parse as absence.
      approvedEntries.some(
        (e) =>
          normalizeTraceabilityIdentity(e.moduleId) === conceptId ||
          normalizeTraceabilityIdentity(e.contractSource ?? '') === conceptId ||
          normalizeTraceabilityIdentity(e.displayName) === conceptId,
      );
    const inCbga = approvedEntries.some((e) => normalizeTraceabilityIdentity(e.contractSource ?? '') === conceptId || normalizeTraceabilityIdentity(e.displayName) === conceptId || normalizeTraceabilityIdentity(e.moduleId) === conceptId);
    const inGenerated = generatedModuleIds.some((m) => m === conceptId || approvedEntries.some((e) => e.moduleId === m && (normalizeTraceabilityIdentity(e.contractSource ?? '') === conceptId || normalizeTraceabilityIdentity(e.displayName) === conceptId)));
    let outcome: ConceptPreservationOutcome = 'PRESERVED';
    let boundary: TransformationBoundary | 'UNKNOWN' = 'UNKNOWN';
    if (!inFeature) {
      outcome = 'MISSING_FROM_FEATURE_CONTRACT';
      boundary = 'CONTRACT_TO_FEATURE_CONTRACT';
      findings.push(
        createFinding(
          {
            diagnosticCode: 'contract_concept_missing_from_feature_contract',
            severity: 'BLOCKER',
            criticality: 'CRITICAL',
            firstBrokenBoundary: boundary,
            expectedNodeId: conceptId,
            observedNodeIds: [],
            requirementIds: [],
            conceptIds: [conceptId],
            featureIds: [],
            behaviorIds: [],
            moduleIds: [],
            contributionIds: [],
            providerIds: [],
            artifactPaths: [],
            routeIds: [],
            runtimeScopeIds: [],
            expectedState: 'PRESERVED',
            observedState: outcome,
            ancestryPath: [concept],
            missingEdges: ['CONCEPT_MATERIALIZES_AS_FEATURE'],
            contradictionEvidence: [],
            repairEligibility: 'REQUIRES_REGENERATION_FROM_FEATURE_STAGE',
            regenerationStage: 'FEATURE_CONTRACT',
            readinessImpact: 'BLOCKS_READINESS',
          },
          ++findingIdx,
        ),
      );
    } else if (!inCbga) {
      outcome = 'MISSING_FROM_CBGA_PLAN';
      boundary = 'FEATURE_CONTRACT_TO_CBGA_PLAN';
      findings.push(
        createFinding(
          {
            diagnosticCode: 'feature_missing_from_cbga_module_plan',
            severity: 'BLOCKER',
            criticality: 'CRITICAL',
            firstBrokenBoundary: boundary,
            expectedNodeId: conceptId,
            observedNodeIds: [],
            requirementIds: [],
            conceptIds: [conceptId],
            featureIds: [],
            behaviorIds: [],
            moduleIds: [],
            contributionIds: [],
            providerIds: [],
            artifactPaths: [],
            routeIds: [],
            runtimeScopeIds: [],
            expectedState: 'PRESERVED',
            observedState: outcome,
            ancestryPath: [concept],
            missingEdges: ['FEATURE_PLANNED_AS_MODULE'],
            contradictionEvidence: [],
            repairEligibility: 'REQUIRES_REGENERATION_FROM_CBGA_STAGE',
            regenerationStage: 'CBGA',
            readinessImpact: 'BLOCKS_READINESS',
          },
          ++findingIdx,
        ),
      );
    } else if (!inGenerated) {
      outcome = 'MISSING_FROM_GENERATED_MODULES';
      boundary = 'MATERIALIZATION_TO_GENERATED_MODULES';
      findings.push(
        createFinding(
          {
            diagnosticCode: 'approved_module_not_generated',
            severity: 'BLOCKER',
            criticality: 'REQUIRED',
            firstBrokenBoundary: boundary,
            expectedNodeId: conceptId,
            observedNodeIds: [],
            requirementIds: [],
            conceptIds: [conceptId],
            featureIds: [],
            behaviorIds: [],
            moduleIds: approvedEntries.filter((e) => normalizeTraceabilityIdentity(e.contractSource ?? '') === conceptId).map((e) => e.moduleId),
            contributionIds: [],
            providerIds: [],
            artifactPaths: [],
            routeIds: [],
            runtimeScopeIds: [],
            expectedState: 'GENERATED',
            observedState: outcome,
            ancestryPath: [concept],
            missingEdges: ['CONTRIBUTION_GENERATES_MODULE'],
            contradictionEvidence: [],
            repairEligibility: 'REQUIRES_REGENERATION_FROM_MATERIALIZATION_STAGE',
            regenerationStage: 'MATERIALIZATION',
            readinessImpact: 'BLOCKS_READINESS',
          },
          ++findingIdx,
        ),
      );
    }
    conceptPreservation.push({ conceptId, outcome, firstBrokenBoundary: boundary });
  }

  const moduleAncestry: { moduleId: string; outcome: ModuleAncestryOutcome; ancestryPath: readonly string[] }[] = [];
  for (const moduleId of generatedModuleIds) {
    let outcome: ModuleAncestryOutcome;
    if (approvedModuleIds.has(moduleId)) {
      outcome = 'DIRECTLY_APPROVED';
    } else if (resolveInfrastructureModuleAncestry(moduleId)) {
      outcome = resolveInfrastructureModuleAncestry(moduleId)!;
    } else {
      outcome = 'UNAPPROVED_MODULE';
      findings.push(
        createFinding(
          {
            diagnosticCode: 'generated_module_not_in_cbga_plan',
            severity: 'BLOCKER',
            criticality: 'CRITICAL',
            firstBrokenBoundary: 'MATERIALIZATION_TO_GENERATED_MODULES',
            expectedNodeId: moduleId,
            observedNodeIds: [moduleId],
            requirementIds: [],
            conceptIds: [],
            featureIds: [],
            behaviorIds: [],
            moduleIds: [moduleId],
            contributionIds: [],
            providerIds: [],
            artifactPaths: [`src/features/${moduleId}/`],
            routeIds: [],
            runtimeScopeIds: [],
            expectedState: 'APPROVED_ANCESTRY',
            observedState: outcome,
            ancestryPath: [moduleId],
            missingEdges: ['FEATURE_PLANNED_AS_MODULE', 'CONTRIBUTION_GENERATES_MODULE'],
            contradictionEvidence: [],
            repairEligibility: 'BLOCKED_UNAPPROVED_MODULE',
            regenerationStage: null,
            readinessImpact: 'BLOCKS_READINESS',
          },
          ++findingIdx,
        ),
      );
    }
    moduleAncestry.push({ moduleId, outcome, ancestryPath: [moduleId] });
  }

  for (const moduleId of approvedModuleIds) {
    if (!generatedModuleIds.includes(moduleId)) {
      findings.push(
        createFinding(
          {
            diagnosticCode: 'approved_module_missing_from_envelope',
            severity: 'BLOCKER',
            criticality: 'REQUIRED',
            firstBrokenBoundary: 'MATERIALIZATION_TO_GENERATED_MODULES',
            expectedNodeId: moduleId,
            observedNodeIds: [],
            requirementIds: [],
            conceptIds: [],
            featureIds: [],
            behaviorIds: [],
            moduleIds: [moduleId],
            contributionIds: [],
            providerIds: [],
            artifactPaths: [],
            routeIds: [],
            runtimeScopeIds: [],
            expectedState: 'GENERATED',
            observedState: 'MISSING',
            ancestryPath: [moduleId],
            missingEdges: ['CONTRIBUTION_GENERATES_MODULE'],
            contradictionEvidence: [],
            repairEligibility: 'REQUIRES_REGENERATION_FROM_MATERIALIZATION_STAGE',
            regenerationStage: 'MATERIALIZATION',
            readinessImpact: 'BLOCKS_READINESS',
          },
          ++findingIdx,
        ),
      );
    }
  }

  const graphId = `cmt-graph-${createHash('sha256').update(`${contractFp}|${envelopeFp}|${workspaceFp}`).digest('hex').slice(0, 12)}`;
  const fingerprint = fingerprintTraceabilityValue([graphId, String(nodes.length), String(edges.length), String(findings.length)]);

  return {
    readOnly: true,
    graphId,
    contractFingerprint: contractFp,
    envelopeFingerprint: envelopeFp,
    workspaceFingerprint: workspaceFp,
    nodes,
    edges,
    findings,
    conceptPreservation,
    moduleAncestry,
    fingerprint,
  };
}


export function fingerprintTraceabilityGraph(graph: Pick<ContractToModuleTraceabilityGraph, 'graphId' | 'fingerprint' | 'nodes' | 'edges'>): string {
  return fingerprintTraceabilityValue([graph.graphId, graph.fingerprint, String(graph.nodes.length), String(graph.edges.length)]);
}

export function fingerprintTraceabilityFinding(finding: Pick<TraceabilityFinding, 'findingId' | 'diagnosticCode' | 'fingerprint'>): string {
  return fingerprintTraceabilityValue([finding.findingId, finding.diagnosticCode, finding.fingerprint]);
}

export function fingerprintTraceabilityReport(report: { fingerprint: string; complianceOutcome: string }): string {
  return fingerprintTraceabilityValue([report.fingerprint, report.complianceOutcome]);
}
