/**
 * Universal Prompt-to-App Materialization — generated workspace manifest.
 * Materialization Evidence + Failed Build Forensic Manifest lifecycle fields.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { MaterializationProfile } from './profile-feature-map.js';
import type { GeneratedFileInventoryEntry } from '../materialization-evidence/materialization-evidence-types.js';
import type { GeneratedFeatureModuleManifestEntry } from './modular-feature-module-generator.js';
import type {
  ForensicBuildStage,
  ForensicManifestStageRecord,
  ForensicManifestStatus,
} from '../materialization-evidence/forensic-manifest-types.js';
import type { ProductionValidationStageResult } from '../production-validation/production-validation-types.js';
import type {
  MaterializationQualityCategoryScore,
  MaterializationQualityVerdict,
} from '../materialization-quality-score/materialization-quality-score-types.js';
import type {
  FeatureContractRealityStatus,
  FeatureRealityRecord,
} from '../feature-contract-reality/feature-contract-reality-types.js';
import type { WorkspaceRealityAuditStatus } from '../workspace-reality-audit/workspace-reality-audit-types.js';
import type { PromptFaithfulnessManifestFields } from '../prompt-faithful-generation/prompt-faithful-generation-types.js';
import { partitionProductAndInfrastructureModules } from '../contract-to-module-traceability/contract-to-module-infrastructure-registry.js';

export const GENERATED_APP_MANIFEST_FILENAME = '.generated-app-manifest.json';

export interface GeneratedAppManifest {
  readOnly: true;
  projectId: string;
  projectName: string;
  buildRunId: string;
  prompt: string;
  promptSummary: string;
  selectedProfile: GeneratedAppProfile | MaterializationProfile | string;
  expectedAppType: string;
  confidence: string;
  workspacePath: string | null;
  status: ForensicManifestStatus;
  currentStage: ForensicBuildStage;
  generatedFilesCount: number;
  generatedDirectoriesCount: number;
  generatedComponentsCount: number;
  generatedPagesCount: number;
  generatedRoutesCount: number;
  generatedFeatureModulesCount: number;
  generatedFeatureModuleFiles: string[];
  featureModuleDirectories: string[];
  featureModuleDetails: GeneratedFeatureModuleManifestEntry[];
  generatedServicesCount: number;
  generatedModelsCount: number;
  generatedAssetsCount: number;
  generatedStylesCount: number;
  generatedTestsCount: number;
  totalLinesGenerated: number;
  workspaceSizeBytes: number;
  generationDurationMs: number;
  materializationDurationMs: number;
  npmInstallDurationMs: number;
  npmBuildDurationMs: number;
  previewDurationMs: number;
  validationDurationMs: number;
  manifestWriteDurationMs: number;
  planningDurationMs: number;
  fileGenerationDurationMs: number;
  blueprintShellPresent: boolean;
  featureModulesPresent: boolean;
  promptSpecificTermsPresent: boolean;
  generatedFiles: GeneratedFileInventoryEntry[];
  generatedDirectories: string[];
  /** User/domain-facing product modules only — never infrastructure shells. */
  featureModules: string[];
  /**
   * Infrastructure / system-shell capabilities recorded separately from product featureModules.
   * Exact-id shells (persistence adapters, auth plumbing, routing infrastructure, etc.) live here.
   */
  infrastructureModules?: string[];
  routes: string[];
  /**
   * Navigation Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved, CBGA-repaired
   * navigation plan's labels (`ApprovedNavigationPlan.productEntries`) for this build. Absent for
   * pre-CBGA/isolated/test-only manifests built without an approved navigation plan.
   */
  navigationLabels?: string[];
  /**
   * Module Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved, CBGA-repaired
   * module plan's moduleIds (`ApprovedModulePlan.moduleIds`) for this build. Absent for
   * pre-CBGA/isolated/test-only manifests built without an approved module plan.
   */
  approvedModuleIds?: string[];
  /**
   * Metadata Computation Collapse V1 (PPC-1207 No Parallel Truth) — the approved, CBGA-composed
   * metadata plan's canonical subtitle (`ApprovedMetadataPlan.applicationSubtitle`) and manifest
   * summary string (`ApprovedMetadataPlan.manifestSummary`) for this build. Absent for
   * pre-CBGA/isolated/test-only manifests built without an approved metadata plan.
   */
  approvedApplicationSubtitle?: string;
  approvedMetadataSummary?: string;
  /**
   * Sample Data Computation Collapse V1 — the approved sample data plan's canonical summary and
   * presence flag for this build. Absent for pre-CBGA/isolated/test-only manifests.
   */
  approvedSampleSummary?: string;
  approvedSamplesPresent?: boolean;
  approvedProvenanceSummary?: string;
  /** Repair Reality Alignment V1 — canonical repair summary from ApprovedRepairRealityPlan. */
  approvedRepairRealitySummary?: string;
  services: string[];
  models: string[];
  assets: string[];
  styles: string[];
  previewEntry: string;
  validationStatus: 'PASS' | 'FAIL' | 'PENDING' | 'PARTIAL';
  warnings: string[];
  errors: string[];
  fallbackUsed: boolean;
  workspaceHash: string;
  manifestHash: string;
  materializationHash: string;
  partialWorkspaceHash: string;
  partialMaterializationHash: string;
  lastSuccessfulStage: ForensicBuildStage | null;
  lastGeneratedFileCount: number;
  lastGeneratedDirectoryCount: number;
  failureStage: ForensicBuildStage | null;
  failureReason: string | null;
  failureMessage: string | null;
  errorCode: string | null;
  stackPreview: string | null;
  failedCommand: string | null;
  exitCode: number | null;
  stderrPreview: string | null;
  stdoutPreview: string | null;
  stageHistory: ForensicManifestStageRecord[];
  productionValidationStatus: 'PASS' | 'FAIL' | 'PENDING';
  productionValidationProfile: string | null;
  productionValidationStages: ProductionValidationStageResult[];
  previewVerified: boolean;
  previewUrl: string | null;
  previewHtmlStatus: 'PASS' | 'FAIL' | 'PENDING';
  visiblePreviewValidationStatus: 'PASS' | 'FAIL' | 'PENDING' | 'SKIPPED';
  visiblePreviewValidationFailureReasons: string[];
  profileSpecificUiVerified: boolean;
  modularRoutesVerified: boolean;
  productionValidationDurationMs: number;
  productionValidationFailureReasons: string[];
  blueprintPurityStatus: 'PASS' | 'FAIL' | 'PENDING';
  blueprintPurityCheckedFiles: string[];
  blueprintPurityViolationCount: number;
  blueprintPurityAllowedDomainSources: string[];
  blueprintPurityFailureReasons: string[];
  shellPurityVerified: boolean;
  domainLanguageBoundaryVerified: boolean;
  buildHistoryRecorded: boolean;
  buildHistoryRunId: string | null;
  buildHistoryRecordPath: string | null;
  buildHistoryRecordHash: string | null;
  buildHistoryImmutable: boolean;
  replayMetadataPath: string | null;
  auditTimelinePath: string | null;
  buildHistoryIntegrityStatus: 'PASS' | 'FAIL' | 'PENDING';
  buildHistoryFailureReasons: string[];
  buildHistoryDeduplicatedRunId: boolean;
  buildHistoryRecordedAt: string | null;
  persistentProjectRealityStatus: 'PASS' | 'FAIL' | 'PENDING' | 'SKIPPED';
  persistentProjectId: string | null;
  persistentProjectWorkspacePath: string | null;
  persistentProjectSourceRoot: string | null;
  projectFileIndexPath: string | null;
  exportMetadataPath: string | null;
  promotedFromBuildWorkspace: string | null;
  promotionStatus: 'PASS' | 'FAIL' | 'PENDING' | 'SKIPPED';
  promotionFailureReasons: string[];
  persistentProjectRecordedAt: string | null;
  activeWorkspacePath: string | null;
  materializationQualityScore: number;
  materializationQualityVerdict: MaterializationQualityVerdict | 'PENDING';
  materializationQualityCategories: MaterializationQualityCategoryScore[];
  materializationQualityGaps: string[];
  materializationQualityStrengths: string[];
  materializationQualityCriticalFailures: string[];
  materializationQualityScorePath: string | null;
  materializationQualityPersistentScorePath: string | null;
  materializationQualityRecordedAt: string | null;
  featureContractRealityStatus: FeatureContractRealityStatus | 'PENDING';
  featureContractRealityScore: number;
  featureRealityRecords: FeatureRealityRecord[];
  featureRealityFailureReasons: string[];
  featureContractRealityArtifactPath: string | null;
  featureContractRealityPersistentArtifactPath: string | null;
  featureContractRealityRecordedAt: string | null;
  workspaceRealityAuditStatus: WorkspaceRealityAuditStatus | 'PENDING';
  workspaceRealityAuditScore: number;
  workspaceRealityAuditArtifactPath: string | null;
  workspaceRealityReportPath: string | null;
  workspaceRealityFailureReasons: string[];
  workspaceRealityRecordedAt: string | null;
  universalProductionProofRunId: string | null;
  universalProductionProofStatus:
    | 'UNIVERSAL_PRODUCTION_READY'
    | 'UNIVERSAL_PRODUCTION_READY_WITH_WARNINGS'
    | 'NOT_UNIVERSALLY_PRODUCTION_READY'
    | 'PENDING';
  universalProductionProofProfileVerdict: string | null;
  universalProductionProofArtifactPath: string | null;
  universalProductionProofRecordedAt: string | null;
  createdAt: string;
  completedAt: string | null;
  promptFaithfulnessStatus?: PromptFaithfulnessManifestFields['promptFaithfulnessStatus'];
  promptFaithfulnessScore?: number;
  promptDerivedAppName?: string;
  promptDerivedDomain?: string;
  promptDerivedModules?: string[];
  promptDerivedInteractions?: string[];
  rejectedFallbackProfiles?: string[];
  bannedFallbackModulesDetected?: string[];
  promptFaithfulnessFailureReasons?: string[];
  androidPhonePreviewRequired?: boolean;
  androidPhonePreviewStatus?: PromptFaithfulnessManifestFields['androidPhonePreviewStatus'];
}

export function buildInitialGeneratedAppManifest(input: {
  projectId: string;
  projectName: string;
  buildRunId: string;
  prompt: string;
  selectedProfile: GeneratedAppProfile | MaterializationProfile | string;
  expectedAppType: string;
  promptSummary: string;
  confidence: string;
  featureModules?: string[];
  infrastructureModules?: string[];
  routes?: string[];
  navigationLabels?: string[];
  approvedModuleIds?: string[];
  approvedApplicationSubtitle?: string;
  approvedMetadataSummary?: string;
  approvedSampleSummary?: string;
  approvedSamplesPresent?: boolean;
  approvedProvenanceSummary?: string;
  approvedRepairRealitySummary?: string;
  featureModuleDetails?: GeneratedFeatureModuleManifestEntry[];
  generatedFeatureModuleFiles?: string[];
  featureModuleDirectories?: string[];
  workspacePath?: string | null;
  fallbackUsed?: boolean;
  promptFaithfulness?: PromptFaithfulnessManifestFields;
}): GeneratedAppManifest {
  const now = new Date().toISOString();
  const partitioned = partitionProductAndInfrastructureModules([
    ...(input.featureModules ?? []),
    ...(input.infrastructureModules ?? []),
  ]);
  return {
    readOnly: true,
    projectId: input.projectId,
    projectName: input.projectName,
    buildRunId: input.buildRunId,
    prompt: input.prompt,
    promptSummary: input.promptSummary,
    selectedProfile: input.selectedProfile,
    expectedAppType: input.expectedAppType,
    confidence: input.confidence,
    workspacePath: input.workspacePath ?? null,
    status: 'IN_PROGRESS',
    currentStage: 'STARTED',
    generatedFilesCount: 0,
    generatedDirectoriesCount: 0,
    generatedComponentsCount: 0,
    generatedPagesCount: 0,
    generatedRoutesCount: 0,
    generatedFeatureModulesCount: 0,
    generatedFeatureModuleFiles: input.generatedFeatureModuleFiles ?? [],
    featureModuleDirectories: input.featureModuleDirectories ?? [],
    featureModuleDetails: input.featureModuleDetails ?? [],
    generatedServicesCount: 0,
    generatedModelsCount: 0,
    generatedAssetsCount: 0,
    generatedStylesCount: 0,
    generatedTestsCount: 0,
    totalLinesGenerated: 0,
    workspaceSizeBytes: 0,
    generationDurationMs: 0,
    materializationDurationMs: 0,
    npmInstallDurationMs: 0,
    npmBuildDurationMs: 0,
    previewDurationMs: 0,
    validationDurationMs: 0,
    manifestWriteDurationMs: 0,
    planningDurationMs: 0,
    fileGenerationDurationMs: 0,
    blueprintShellPresent: false,
    featureModulesPresent: false,
    promptSpecificTermsPresent: false,
    generatedFiles: [],
    generatedDirectories: [],
    featureModules: partitioned.productFeatureModules,
    ...(partitioned.infrastructureModules.length > 0
      ? { infrastructureModules: partitioned.infrastructureModules }
      : {}),
    routes: input.routes ?? [],
    ...(input.navigationLabels !== undefined ? { navigationLabels: input.navigationLabels } : {}),
    ...(input.approvedModuleIds !== undefined ? { approvedModuleIds: input.approvedModuleIds } : {}),
    ...(input.approvedApplicationSubtitle !== undefined
      ? { approvedApplicationSubtitle: input.approvedApplicationSubtitle }
      : {}),
    ...(input.approvedMetadataSummary !== undefined
      ? { approvedMetadataSummary: input.approvedMetadataSummary }
      : {}),
    ...(input.approvedSampleSummary !== undefined
      ? { approvedSampleSummary: input.approvedSampleSummary }
      : {}),
    ...(input.approvedSamplesPresent !== undefined
      ? { approvedSamplesPresent: input.approvedSamplesPresent }
      : {}),
    ...(input.approvedProvenanceSummary !== undefined
      ? { approvedProvenanceSummary: input.approvedProvenanceSummary }
      : {}),
    ...(input.approvedRepairRealitySummary !== undefined
      ? { approvedRepairRealitySummary: input.approvedRepairRealitySummary }
      : {}),
    services: [],
    models: [],
    assets: [],
    styles: [],
    previewEntry: '/src/main.tsx',
    validationStatus: 'PENDING',
    warnings: [],
    errors: [],
    fallbackUsed: input.fallbackUsed ?? false,
    workspaceHash: '',
    manifestHash: '',
    materializationHash: '',
    partialWorkspaceHash: '',
    partialMaterializationHash: '',
    lastSuccessfulStage: null,
    lastGeneratedFileCount: 0,
    lastGeneratedDirectoryCount: 0,
    failureStage: null,
    failureReason: null,
    failureMessage: null,
    errorCode: null,
    stackPreview: null,
    failedCommand: null,
    exitCode: null,
    stderrPreview: null,
    stdoutPreview: null,
    stageHistory: [],
    productionValidationStatus: 'PENDING',
    productionValidationProfile: null,
    productionValidationStages: [],
    previewVerified: false,
    previewUrl: null,
    previewHtmlStatus: 'PENDING',
    visiblePreviewValidationStatus: 'PENDING',
    visiblePreviewValidationFailureReasons: [],
    profileSpecificUiVerified: false,
    modularRoutesVerified: false,
    productionValidationDurationMs: 0,
    productionValidationFailureReasons: [],
    blueprintPurityStatus: 'PENDING',
    blueprintPurityCheckedFiles: [],
    blueprintPurityViolationCount: 0,
    blueprintPurityAllowedDomainSources: [],
    blueprintPurityFailureReasons: [],
    shellPurityVerified: false,
    domainLanguageBoundaryVerified: false,
    buildHistoryRecorded: false,
    buildHistoryRunId: null,
    buildHistoryRecordPath: null,
    buildHistoryRecordHash: null,
    buildHistoryImmutable: false,
    replayMetadataPath: null,
    auditTimelinePath: null,
    buildHistoryIntegrityStatus: 'PENDING',
    buildHistoryFailureReasons: [],
    buildHistoryDeduplicatedRunId: false,
    buildHistoryRecordedAt: null,
    persistentProjectRealityStatus: 'PENDING',
    persistentProjectId: null,
    persistentProjectWorkspacePath: null,
    persistentProjectSourceRoot: null,
    projectFileIndexPath: null,
    exportMetadataPath: null,
    promotedFromBuildWorkspace: null,
    promotionStatus: 'PENDING',
    promotionFailureReasons: [],
    persistentProjectRecordedAt: null,
    activeWorkspacePath: null,
    materializationQualityScore: 0,
    materializationQualityVerdict: 'PENDING',
    materializationQualityCategories: [],
    materializationQualityGaps: [],
    materializationQualityStrengths: [],
    materializationQualityCriticalFailures: [],
    materializationQualityScorePath: null,
    materializationQualityPersistentScorePath: null,
    materializationQualityRecordedAt: null,
    featureContractRealityStatus: 'PENDING',
    featureContractRealityScore: 0,
    featureRealityRecords: [],
    featureRealityFailureReasons: [],
    featureContractRealityArtifactPath: null,
    featureContractRealityPersistentArtifactPath: null,
    featureContractRealityRecordedAt: null,
    workspaceRealityAuditStatus: 'PENDING',
    workspaceRealityAuditScore: 0,
    workspaceRealityAuditArtifactPath: null,
    workspaceRealityReportPath: null,
    workspaceRealityFailureReasons: [],
    workspaceRealityRecordedAt: null,
    universalProductionProofRunId: null,
    universalProductionProofStatus: 'PENDING',
    universalProductionProofProfileVerdict: null,
    universalProductionProofArtifactPath: null,
    universalProductionProofRecordedAt: null,
    ...(input.promptFaithfulness ?? {}),
    createdAt: now,
    completedAt: null,
  };
}

/** @deprecated Use buildInitialGeneratedAppManifest */
export function buildGeneratedAppManifest(input: {
  projectId: string;
  projectName: string;
  buildRunId: string;
  selectedProfile: GeneratedAppProfile | MaterializationProfile;
  expectedAppType: string;
  promptSummary: string;
  featureModules: string[];
  routes: string[];
  generatedFiles: string[];
  validation?: Partial<GeneratedAppManifest>;
}): GeneratedAppManifest {
  return buildInitialGeneratedAppManifest({
    projectId: input.projectId,
    projectName: input.projectName,
    buildRunId: input.buildRunId,
    prompt: input.promptSummary,
    selectedProfile: input.selectedProfile,
    expectedAppType: input.expectedAppType,
    promptSummary: input.promptSummary,
    confidence: 'UNKNOWN',
    featureModules: input.featureModules,
    routes: input.routes,
    fallbackUsed: input.validation?.fallbackUsed ?? false,
  });
}

export function serializeGeneratedAppManifest(manifest: GeneratedAppManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function isManifestEvidenceComplete(manifest: GeneratedAppManifest): boolean {
  if (!manifest.completedAt) return false;
  if (manifest.status === 'IN_PROGRESS') return false;
  if (manifest.status === 'PASS') {
    if (manifest.generatedFilesCount <= 0) return false;
    if (manifest.generatedFiles.length <= 0) return false;
    if (!manifest.workspaceHash || !manifest.materializationHash) return false;
    return manifest.validationStatus === 'PASS';
  }
  if (manifest.status === 'FAIL' || manifest.status === 'PARTIAL' || manifest.status === 'ABORTED') {
    return Boolean(manifest.failureStage && manifest.failureReason);
  }
  return false;
}

export function isForensicManifestPresent(manifest: GeneratedAppManifest | null): boolean {
  return manifest !== null && manifest.buildRunId.length > 0 && manifest.createdAt.length > 0;
}

export function listManifestPlaceholderFields(manifest: GeneratedAppManifest): string[] {
  const missing: string[] = [];
  if (manifest.status === 'IN_PROGRESS') missing.push('status');
  if (!manifest.completedAt) missing.push('completedAt');
  if (manifest.status === 'PASS') {
    if (manifest.generatedFilesCount <= 0) missing.push('generatedFilesCount');
    if (manifest.generatedFiles.length === 0) missing.push('generatedFiles');
    if (!manifest.workspaceHash) missing.push('workspaceHash');
    if (!manifest.materializationHash) missing.push('materializationHash');
    if (manifest.featureModuleDetails.length <= 0 && manifest.generatedFeatureModulesCount <= 0) {
      missing.push('featureModuleDetails');
    }
  }
  if (manifest.status === 'FAIL' || manifest.status === 'PARTIAL' || manifest.status === 'ABORTED') {
    if (!manifest.failureStage) missing.push('failureStage');
    if (!manifest.failureReason) missing.push('failureReason');
  }
  if (manifest.validationStatus === 'PENDING' && manifest.status === 'PASS') {
    missing.push('validationStatus');
  }
  return missing;
}
