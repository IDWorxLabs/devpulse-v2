/**
 * Universal Capability Pack Framework V1 — orchestrator.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { extractCapabilityRequirementsFromEnvelope } from './approved-capability-requirement-extractor.js';
import { normalizeCapabilityRequirements } from './capability-requirement-normalizer.js';
import { bootstrapCapabilityPackRegistry, resetCapabilityPackRegistryForTests } from './capability-pack-registry.js';
import { buildAllPackDescriptors } from './capability-pack-descriptor-builder.js';
import { buildCapabilityCompositionPlan } from './capability-pack-composition-plan.js';
import {
  buildCapabilityPackSharedRuntimeFiles,
  materializeSelectedPacks,
  augmentServiceWithAuditTrail,
} from './capability-pack-materializer.js';
import { verifyPackBehavior, detectStaticCapabilityShell, diagnoseCapabilityPackGaps } from './capability-pack-behavior-verification.js';
import { buildCapabilityPackMaterializationReport, computeCapabilityPackCoverageScore } from './capability-pack-generation-report.js';
import type {
  CapabilityPackMaterializationInput,
  CapabilityPackMaterializationReport,
} from './universal-capability-pack-types.js';

let registryBootstrapped = false;

function ensureRegistry(): void {
  if (!registryBootstrapped) {
    bootstrapCapabilityPackRegistry(buildAllPackDescriptors());
    registryBootstrapped = true;
  }
}

export function buildCapabilityPackMaterializationInputFromEnvelope(input: {
  envelope: ApprovedProductionBuildEnvelope;
  appTitle: string;
  moduleIds: readonly string[];
  crudBacked: boolean;
  actionBacked: boolean;
  workflowBacked: boolean;
  relationshipBacked: boolean;
  runtimeBacked: boolean;
  ruleBacked: boolean;
  rawPrompt?: string;
}): CapabilityPackMaterializationInput {
  return {
    appTitle: input.appTitle,
    buildId: input.envelope.buildId,
    promptHash: input.envelope.promptHash,
    moduleIds: input.moduleIds,
    crudBacked: input.crudBacked,
    actionBacked: input.actionBacked,
    workflowBacked: input.workflowBacked,
    relationshipBacked: input.relationshipBacked,
    runtimeBacked: input.runtimeBacked,
    ruleBacked: input.ruleBacked,
    rawPrompt: input.rawPrompt,
  };
}

export interface CapabilityPackWorkspaceMaterializationResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly report: CapabilityPackMaterializationReport;
}

export function materializeCapabilityPacksForWorkspace(
  envelope: ApprovedProductionBuildEnvelope,
  input: CapabilityPackMaterializationInput,
): CapabilityPackWorkspaceMaterializationResult {
  ensureRegistry();

  const rawRequirements = extractCapabilityRequirementsFromEnvelope({
    envelope,
    supplementalTexts: input.rawPrompt
      ? [{ text: input.rawPrompt, path: 'approvedProductionBuildEnvelope.promptEvidence' }]
      : [],
  });
  const requirements = normalizeCapabilityRequirements(rawRequirements);
  const plan = buildCapabilityCompositionPlan({ requirements, materializationInput: input });

  const materialization = materializeSelectedPacks(plan);
  const packArtifactContent = materialization.files.map((f) => f.content).join('\n');
  const registryContent = materialization.files.find((f) => f.relativePath.endsWith('registry.ts'))?.content ?? '';

  const verifications = plan.selectedPacks.map((p) =>
    verifyPackBehavior(p.packId, { packArtifacts: packArtifactContent, registrySource: registryContent }),
  );

  const report = buildCapabilityPackMaterializationReport({ plan, verifications });

  const files: GeneratedWorkspaceFile[] = [
    ...buildCapabilityPackSharedRuntimeFiles(),
    ...materialization.files,
    {
      relativePath: 'src/universal-capability-packs/capability-report.json',
      content: `${JSON.stringify(report, null, 2)}\n`,
    },
  ];

  return { files, report };
}

export function augmentWorkspaceFilesWithCapabilityPacks(
  workspaceFiles: GeneratedWorkspaceFile[],
  envelope: ApprovedProductionBuildEnvelope,
  input: CapabilityPackMaterializationInput,
): { files: GeneratedWorkspaceFile[]; report: CapabilityPackMaterializationReport } {
  const result = materializeCapabilityPacksForWorkspace(envelope, input);
  let files = [...workspaceFiles, ...result.files];

  const auditActive = result.report.compositionPlan.selectedPacks.some((p) => p.packId === 'universal-audit-trail-pack');
  if (auditActive) {
    files = files.map((f) => {
      if (f.relativePath.endsWith('.service.ts') && f.relativePath.startsWith('src/features/')) {
        const moduleId = f.relativePath.split('/')[2] ?? 'module';
        return { ...f, content: augmentServiceWithAuditTrail(f.content, moduleId, true) };
      }
      return f;
    });
  }

  return { files, report: result.report };
}

export function shouldMaterializeCapabilityPacks(
  envelope?: ApprovedProductionBuildEnvelope | null,
  options?: { crudBacked?: boolean },
): boolean {
  if (!envelope) return false;
  return options?.crudBacked === true;
}

export function resetCapabilityPackFrameworkForTests(): void {
  registryBootstrapped = false;
  resetCapabilityPackRegistryForTests();
}

export { buildCapabilityPackSharedRuntimeFiles } from './capability-pack-materializer.js';
export {
  bootstrapCapabilityPackRegistry,
  resetCapabilityPackRegistryForTests,
  registerPack,
  getPack,
  listPacks,
  listProductionReadyPacks,
  findProvidersForCapability,
  validatePack,
  fingerprintPack,
  detectDuplicateCapabilityProvider,
} from './capability-pack-registry.js';
export { resolveCapabilityRequirement, resolveAllCapabilityRequirements } from './capability-pack-resolver.js';
export { resolvePackDependencies } from './capability-pack-dependency-resolver.js';
export { validatePackCompatibility } from './capability-pack-compatibility-validator.js';
export { validatePackConfiguration, mergePackConfiguration } from './capability-pack-configuration.js';
export { buildCapabilityCompositionPlan } from './capability-pack-composition-plan.js';
export { detectContributionCollisions } from './capability-pack-collision-detector.js';
export { verifyPackBehavior, detectStaticCapabilityShell, diagnoseCapabilityPackGaps } from './capability-pack-behavior-verification.js';
export { buildCapabilityPackMaterializationReport, computeCapabilityPackCoverageScore } from './capability-pack-generation-report.js';
export { enforceLifecycleOrder } from './capability-pack-lifecycle.js';
export { FUTURE_CAPABILITY_PACK_CATALOG } from './future-capability-pack-catalog.js';
export {
  UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_VERSION,
  UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE,
  stableCapabilityRequirementId,
} from './universal-capability-pack-types.js';
export { CAPABILITY_PACK_RUNTIME_EVENT_TYPES } from './capability-pack-runtime-integration.js';
