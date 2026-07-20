/**
 * Universal Behavioral Verification Engine V1 — orchestrator.
 *
 * ApprovedProductionBuildEnvelope → extraction → registry → plan →
 * runtime execution → evidence → engineering report.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import {
  augmentWorkspaceFilesWithBehavioralVerification,
  buildBehaviorVerificationMaterializationInputFromEnvelope,
  buildBehaviorVerificationSharedRuntimeFiles,
  materializeBehaviorVerificationForWorkspace,
  shouldMaterializeBehavioralVerification,
} from './behavior-pipeline-integration.js';
import { extractApprovedBehaviorsFromEnvelope } from './approved-behavior-extractor.js';
import { normalizeApprovedBehaviors } from './behavior-normalizer.js';
import {
  bootstrapBehaviorRegistry,
  detectDuplicates,
  detectMissingVerification,
  inspectDependencies,
  listBehaviors,
  lookupBehavior,
  registerBehavior,
  resetBehaviorRegistryForTests,
  unregisterBehavior,
  validateBehavior,
  fingerprintBehaviorDescriptor,
} from './behavior-registry.js';
import { buildBehaviorVerificationPlan } from './behavior-verification-planner.js';
import { executeAllBehaviorVerifications, executeBehaviorVerification } from './behavior-execution-engine.js';
import { buildBehaviorVerificationReport, renderBehaviorVerificationReportMarkdown } from './behavior-report.js';
import { computeBehaviorCoverage, computeBehaviorCoveragePercent } from './behavior-coverage.js';
import { diagnoseBehaviorFailure, diagnoseSilentBehaviorSkips } from './behavior-diagnostics.js';
import { buildBehaviorTraceabilityChains } from './behavior-traceability.js';
import {
  buildBehaviorStaticShellScanSource,
  detectStaticBehaviorShell,
  detectStaticBehaviorShells,
  rejectPlaceholderBehavior,
  validateRuntimeReachability,
} from './behavior-runtime-validator.js';
import {
  UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE,
  UNIVERSAL_BEHAVIORAL_VERIFICATION_VERSION,
  stableBehaviorId,
  fingerprintBehavior,
} from './universal-behavior-types.js';

export interface UniversalBehavioralVerificationResult {
  readonly descriptors: ReturnType<typeof normalizeApprovedBehaviors>;
  readonly plan: ReturnType<typeof buildBehaviorVerificationPlan>;
  readonly results: ReturnType<typeof executeAllBehaviorVerifications>;
  readonly report: ReturnType<typeof buildBehaviorVerificationReport>;
}

export function runUniversalBehavioralVerification(input: {
  envelope: ApprovedProductionBuildEnvelope;
  workspaceFiles: readonly GeneratedWorkspaceFile[];
  materializationInput: Parameters<typeof buildBehaviorVerificationMaterializationInputFromEnvelope>[0];
}): UniversalBehavioralVerificationResult {
  const matInput = buildBehaviorVerificationMaterializationInputFromEnvelope(input.materializationInput);
  const raw = extractApprovedBehaviorsFromEnvelope({
    envelope: input.envelope,
    moduleIds: matInput.moduleIds,
    contractId: matInput.contractId,
    crudBacked: matInput.crudBacked,
    actionBacked: matInput.actionBacked,
    workflowBacked: matInput.workflowBacked,
    relationshipBacked: matInput.relationshipBacked,
    ruleBacked: matInput.ruleBacked,
    capabilityPackBacked: matInput.capabilityPackBacked,
    definition: input.materializationInput.definition,
  });
  const descriptors = normalizeApprovedBehaviors(raw);
  bootstrapBehaviorRegistry(descriptors);
  const plan = buildBehaviorVerificationPlan(descriptors, `${matInput.contractId}-behavior-plan`);
  const results = executeAllBehaviorVerifications(descriptors, {
    envelope: input.envelope,
    workspaceFiles: input.workspaceFiles,
    materializationInput: matInput,
  });
  const report = buildBehaviorVerificationReport({
    reportId: `${matInput.contractId}-behavior-report`,
    descriptors,
    results,
    plan,
    workspaceSources: buildBehaviorStaticShellScanSource(input.workspaceFiles),
  });
  return { descriptors, plan, results, report };
}

export function resetUniversalBehavioralVerificationForTests(): void {
  resetBehaviorRegistryForTests();
}

export {
  UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE,
  UNIVERSAL_BEHAVIORAL_VERIFICATION_VERSION,
  stableBehaviorId,
  fingerprintBehavior,
  extractApprovedBehaviorsFromEnvelope,
  normalizeApprovedBehaviors,
  registerBehavior,
  unregisterBehavior,
  listBehaviors,
  lookupBehavior,
  validateBehavior,
  fingerprintBehaviorDescriptor,
  detectDuplicates,
  detectMissingVerification,
  inspectDependencies,
  bootstrapBehaviorRegistry,
  buildBehaviorVerificationPlan,
  executeBehaviorVerification,
  executeAllBehaviorVerifications,
  buildBehaviorVerificationReport,
  renderBehaviorVerificationReportMarkdown,
  computeBehaviorCoverage,
  computeBehaviorCoveragePercent,
  diagnoseBehaviorFailure,
  diagnoseSilentBehaviorSkips,
  buildBehaviorTraceabilityChains,
  detectStaticBehaviorShell,
  detectStaticBehaviorShells,
  rejectPlaceholderBehavior,
  validateRuntimeReachability,
  augmentWorkspaceFilesWithBehavioralVerification,
  buildBehaviorVerificationMaterializationInputFromEnvelope,
  materializeBehaviorVerificationForWorkspace,
  shouldMaterializeBehavioralVerification,
  buildBehaviorVerificationSharedRuntimeFiles,
};
