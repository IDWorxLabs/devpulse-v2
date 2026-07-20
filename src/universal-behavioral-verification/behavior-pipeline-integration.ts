/**
 * Universal Behavioral Verification Engine V1 — production pipeline integration.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type {
  BehaviorVerificationMaterializationInput,
  UniversalBehaviorVerificationReport,
} from './universal-behavior-types.js';
import { UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE } from './universal-behavior-types.js';
import { extractApprovedBehaviorsFromEnvelope } from './approved-behavior-extractor.js';
import { normalizeApprovedBehaviors } from './behavior-normalizer.js';
import { bootstrapBehaviorRegistry } from './behavior-registry.js';
import { buildBehaviorVerificationPlan } from './behavior-verification-planner.js';
import { executeAllBehaviorVerifications } from './behavior-execution-engine.js';
import { buildBehaviorVerificationReport } from './behavior-report.js';
import { buildBehaviorStaticShellScanSource } from './behavior-runtime-validator.js';

export interface BehaviorVerificationWorkspaceResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly report: UniversalBehaviorVerificationReport;
}

export function buildBehaviorVerificationMaterializationInputFromEnvelope(input: {
  envelope: ApprovedProductionBuildEnvelope;
  appTitle: string;
  moduleIds: readonly string[];
  contractId: string;
  crudBacked: boolean;
  actionBacked: boolean;
  workflowBacked: boolean;
  relationshipBacked: boolean;
  runtimeBacked: boolean;
  ruleBacked: boolean;
  capabilityPackBacked: boolean;
  rawPrompt?: string;
  definition?: { readonly safePaymentPlaceholderActive?: boolean };
}): BehaviorVerificationMaterializationInput {
  return {
    envelope: input.envelope,
    appTitle: input.appTitle,
    moduleIds: input.moduleIds,
    contractId: input.contractId,
    crudBacked: input.crudBacked,
    actionBacked: input.actionBacked,
    workflowBacked: input.workflowBacked,
    relationshipBacked: input.relationshipBacked,
    runtimeBacked: input.runtimeBacked,
    ruleBacked: input.ruleBacked,
    capabilityPackBacked: input.capabilityPackBacked,
    rawPrompt: input.rawPrompt,
  };
}

export function materializeBehaviorVerificationForWorkspace(
  workspaceFiles: readonly GeneratedWorkspaceFile[],
  envelope: ApprovedProductionBuildEnvelope,
  input: BehaviorVerificationMaterializationInput,
): BehaviorVerificationWorkspaceResult {
  const raw = extractApprovedBehaviorsFromEnvelope({
    envelope,
    moduleIds: input.moduleIds,
    contractId: input.contractId,
    crudBacked: input.crudBacked,
    actionBacked: input.actionBacked,
    workflowBacked: input.workflowBacked,
    relationshipBacked: input.relationshipBacked,
    ruleBacked: input.ruleBacked,
    capabilityPackBacked: input.capabilityPackBacked,
    definition: { safePaymentPlaceholderActive: false },
  });
  const descriptors = normalizeApprovedBehaviors(raw);
  bootstrapBehaviorRegistry(descriptors);

  const plan = buildBehaviorVerificationPlan(descriptors, `${input.contractId}-behavior-plan`);
  const results = executeAllBehaviorVerifications(descriptors, {
    envelope,
    workspaceFiles,
    materializationInput: input,
  });
  const workspaceSources = buildBehaviorStaticShellScanSource(workspaceFiles);
  const report = buildBehaviorVerificationReport({
    reportId: `${input.contractId}-behavior-report`,
    descriptors,
    results,
    plan,
    workspaceSources,
  });

  const files: GeneratedWorkspaceFile[] = [
    {
      relativePath: 'src/universal-behavioral-verification/behavior-verification-plan.json',
      content: `${JSON.stringify(plan, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-behavioral-verification/behavior-verification-report.json',
      content: `${JSON.stringify(report, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-behavioral-verification/behavior-registry.json',
      content: `${JSON.stringify(descriptors, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-behavioral-verification/runtime-marker.ts',
      content: `/** ${UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE} — behavioral verification artifacts */
export const UNIVERSAL_BEHAVIORAL_VERIFICATION_MARKER = '${UNIVERSAL_BEHAVIORAL_VERIFICATION_SOURCE}' as const;
export const BEHAVIOR_VERIFICATION_COVERAGE = ${report.coveragePercent};
export const BEHAVIOR_VERIFICATION_EXECUTED = ${report.verifiedCount + report.partiallyVerifiedCount};
`,
    },
  ];

  return { files, report };
}

export function augmentWorkspaceFilesWithBehavioralVerification(
  workspaceFiles: GeneratedWorkspaceFile[],
  envelope: ApprovedProductionBuildEnvelope,
  input: BehaviorVerificationMaterializationInput,
): { files: GeneratedWorkspaceFile[]; report: UniversalBehaviorVerificationReport } {
  const result = materializeBehaviorVerificationForWorkspace(workspaceFiles, envelope, input);
  return { files: [...workspaceFiles, ...result.files], report: result.report };
}

export function shouldMaterializeBehavioralVerification(
  envelope?: ApprovedProductionBuildEnvelope | null,
  options?: { crudBacked?: boolean },
): boolean {
  if (!envelope) return false;
  return options?.crudBacked === true;
}

export function buildBehaviorVerificationSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: 'src/universal-behavioral-verification/index.ts',
      content: `/** Universal Behavioral Verification runtime marker */
export const UNIVERSAL_BEHAVIORAL_VERIFICATION_ENGINE = 'UNIVERSAL_BEHAVIORAL_VERIFICATION_ENGINE_V1' as const;
`,
    },
  ];
}
