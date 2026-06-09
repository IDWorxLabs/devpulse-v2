/**
 * Verification Evidence Engine — Phase 16.10 orchestrator.
 * Evidence authority layer — no verification execution, trust decisions, or auto-fix.
 */

import { buildWorkspaceSnapshot } from '../workspace-intelligence/workspace-context-builder.js';
import { resolveActiveProject } from '../workspace-intelligence/workspace-owner-resolver.js';
import { getDevPulseV2Owner } from '../foundation/ownership-registry.js';
import {
  prepareVerificationOrchestration,
} from '../verification-orchestrator/index.js';
import {
  listVerificationTargets,
  prepareVerificationRegistry,
} from '../verification-registry/index.js';
import { publishVerificationEvidenceFeedStages } from '../operator-feed/verification-evidence-feed-bridge.js';
import { countLineageLinks } from './verification-evidence-lineage.js';
import { countTraceabilityKeys, buildTraceabilityIndex } from './verification-evidence-traceability.js';
import {
  listEvidence,
  registerInitialEvidenceFromTargets,
  resetVerificationEvidenceStoreForTests,
} from './verification-evidence-store.js';
import { validateEvidenceIntegrity, evaluateEvidenceGates, validateVerificationEvidence } from './verification-evidence-validator.js';
import {
  buildEvidenceDiagnosticsReport,
  buildEvidenceInventoryReport,
  buildEvidenceLineageReport,
  buildEvidenceOwnershipReport,
  buildEvidenceSummaryReport,
  buildEvidenceTraceabilityReport,
  composeVerificationEvidenceResponse,
  deriveEvidenceAuthorityState,
} from './verification-evidence-report-builder.js';
import {
  getVerificationEvidenceDiagnostics,
  updateVerificationEvidenceDiagnostics,
} from './verification-evidence-diagnostics.js';
import {
  isDuplicateVerificationEvidenceQuestion,
  type EvidenceSummaryReport,
  type PrepareVerificationEvidenceInput,
  type PrepareVerificationEvidenceResult,
} from './verification-evidence-types.js';

function resolveInputFromQuery(
  query: string,
  overrides: Partial<PrepareVerificationEvidenceInput> = {},
): PrepareVerificationEvidenceInput {
  const snapshot = buildWorkspaceSnapshot();
  const project = resolveActiveProject(snapshot);
  const owner = getDevPulseV2Owner('verification_evidence_engine');

  return {
    query,
    projectId: project.projectId,
    workspaceId: project.workspaceId,
    projectExists: project.projectId !== 'none',
    workspaceExists: project.workspaceId !== 'none',
    world1Protected: true,
    ownershipValid: owner.ownerModule === 'devpulse_v2_verification_evidence_engine',
    ...overrides,
  };
}

function blockedResult(
  query: string,
  reason: string,
  partial: Partial<EvidenceSummaryReport> = {},
): PrepareVerificationEvidenceResult {
  const records = listEvidence();
  const validation = validateEvidenceIntegrity(records);
  const inventory = buildEvidenceInventoryReport(records);
  const ownership = buildEvidenceOwnershipReport(records);
  const lineage = buildEvidenceLineageReport(records);
  const traceability = buildEvidenceTraceabilityReport(records);
  const diagnosticsReport = buildEvidenceDiagnosticsReport(validation);
  const summary = buildEvidenceSummaryReport({
    authorityState: 'BLOCKED',
    records,
    validation,
    blockedReasons: [reason],
    ...partial,
  });

  updateVerificationEvidenceDiagnostics(
    query,
    'BLOCKED',
    summary.authorityId,
    records.length,
    countLineageLinks(records),
    countTraceabilityKeys(buildTraceabilityIndex(records)),
    validation.issues.length,
  );
  publishVerificationEvidenceFeedStages(query, false);

  return {
    evidenceSummaryReport: summary,
    diagnostics: getVerificationEvidenceDiagnostics(),
    evidenceRecords: records,
    inventoryReport: inventory,
    ownershipReport: ownership,
    lineageReport: lineage,
    traceabilityReport: traceability,
    diagnosticsReport,
    validationResult: validation,
    responseText: composeVerificationEvidenceResponse(
      query,
      summary,
      inventory,
      ownership,
      lineage,
      traceability,
    ),
  };
}

export function prepareVerificationEvidence(
  input: PrepareVerificationEvidenceInput,
): PrepareVerificationEvidenceResult {
  const query = input.query ?? 'What evidence exists?';

  if (isDuplicateVerificationEvidenceQuestion(query)) {
    return blockedResult(
      query,
      'Duplicate engine rejected — use verification_evidence_engine extension only',
    );
  }

  const registry = prepareVerificationRegistry({
    query,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    projectExists: input.projectExists,
    workspaceExists: input.workspaceExists,
    world1Protected: input.world1Protected,
    ownershipValid: input.ownershipValid,
    suppressRuntimeBootstrap: input.suppressRuntimeBootstrap,
  });

  const orchestration = prepareVerificationOrchestration({
    query,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    projectExists: input.projectExists,
    workspaceExists: input.workspaceExists,
    world1Protected: input.world1Protected,
    ownershipValid: input.ownershipValid,
    suppressRuntimeBootstrap: true,
  });

  if (!input.suppressRuntimeBootstrap) {
    registerInitialEvidenceFromTargets(
      listVerificationTargets(),
      input.projectId ?? 'none',
      input.workspaceId ?? 'none',
      orchestration.orchestrationReport.orchestrationId,
    );
  }

  const records = listEvidence();
  const integrity = validateEvidenceIntegrity(records);

  const gateReport = evaluateEvidenceGates({
    projectExists: input.projectExists,
    workspaceExists: input.workspaceExists,
    ownershipValid: input.ownershipValid,
    world1Protected: input.world1Protected,
    evidenceCount: records.length,
  });

  const validation = validateVerificationEvidence({
    gateReport,
    validationResult: integrity,
  });

  const blocked = gateReport.blockers.length > 0 || registry.registryReport.registryState === 'BLOCKED';
  const authorityState = deriveEvidenceAuthorityState(blocked, validation.valid);

  const inventory = buildEvidenceInventoryReport(records);
  const ownership = buildEvidenceOwnershipReport(records);
  const lineage = buildEvidenceLineageReport(records);
  const traceability = buildEvidenceTraceabilityReport(records);
  const diagnosticsReport = buildEvidenceDiagnosticsReport(validation);
  const summary = buildEvidenceSummaryReport({
    authorityState,
    records,
    validation,
    blockedReasons: blocked ? gateReport.blockers : [],
  });

  publishVerificationEvidenceFeedStages(query, !blocked && validation.valid);
  updateVerificationEvidenceDiagnostics(
    query,
    authorityState,
    summary.authorityId,
    records.length,
    countLineageLinks(records),
    countTraceabilityKeys(buildTraceabilityIndex(records)),
    validation.issues.length,
  );

  return {
    evidenceSummaryReport: summary,
    diagnostics: getVerificationEvidenceDiagnostics(),
    evidenceRecords: records,
    inventoryReport: inventory,
    ownershipReport: ownership,
    lineageReport: lineage,
    traceabilityReport: traceability,
    diagnosticsReport,
    validationResult: validation,
    responseText: composeVerificationEvidenceResponse(
      query,
      summary,
      inventory,
      ownership,
      lineage,
      traceability,
    ),
  };
}

export function processVerificationEvidenceRequest(
  query: string,
): PrepareVerificationEvidenceResult {
  return prepareVerificationEvidence(resolveInputFromQuery(query));
}

export function getVerificationEvidenceContext(
  query: string,
): PrepareVerificationEvidenceResult {
  return processVerificationEvidenceRequest(query);
}
