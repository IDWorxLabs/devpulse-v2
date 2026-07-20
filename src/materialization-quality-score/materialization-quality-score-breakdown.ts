/**
 * Materialization Quality Score V1 — per-category score breakdown from evidence.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import { PRODUCTION_VALIDATION_EVIDENCE_FILENAME } from '../production-validation/production-validation-types.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import {
  getProfileFeatureDefinition,
} from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { validateUniversalAppMaterialization } from '../universal-prompt-to-app-materialization/materialization-validator.js';
import {
  AIDEV_EXPORT_METADATA_FILENAME,
  type PersistentProjectExportMetadata,
} from '../persistent-project-reality/persistent-project-reality-types.js';
import { persistentProjectPaths } from '../persistent-project-reality/persistent-project-reality-paths.js';
import type {
  MaterializationQualityCategoryScore,
  MaterializationQualityCategoryStatus,
} from './materialization-quality-score-types.js';
import { MATERIALIZATION_QUALITY_CATEGORIES } from './materialization-quality-score-registry.js';

const GENERIC_PM_MARKERS = ['Project Management System', 'Welcome to Project Management'];

export interface MaterializationQualityEvidenceBundle {
  readOnly: true;
  manifest: GeneratedAppManifest;
  workspaceDir: string;
  projectRootDir: string;
  validation: ReturnType<typeof validateUniversalAppMaterialization>;
  exportMetadata: PersistentProjectExportMetadata | null;
  shellSource: string;
  distIndexExists: boolean;
  serviceFiles: string[];
  typesFiles: string[];
  validationFiles: string[];
}

export function loadMaterializationQualityEvidence(input: {
  projectRootDir: string;
  workspaceDir: string;
  manifest: GeneratedAppManifest;
}): MaterializationQualityEvidenceBundle {
  const validation = validateUniversalAppMaterialization({
    workspaceDir: input.workspaceDir,
    rawPrompt: input.manifest.prompt,
    selectedProfile: String(input.manifest.selectedProfile) as import('../code-generation-engine/code-generation-engine-types.js').GeneratedAppProfile,
    projectId: input.manifest.projectId,
    projectName: input.manifest.projectName,
    buildRunId: input.manifest.buildRunId,
    npmInstallOk: input.manifest.npmInstallDurationMs > 0,
    npmBuildOk: input.manifest.npmBuildDurationMs > 0 && input.manifest.validationStatus !== 'FAIL',
  });

  const shellSource = readIfExists(join(input.workspaceDir, 'src/blueprint/AppShell.tsx'));
  const distIndexExists = existsSync(join(input.workspaceDir, 'dist/index.html'));

  let exportMetadata: PersistentProjectExportMetadata | null = null;
  if (input.manifest.persistentProjectId) {
    const paths = persistentProjectPaths(input.projectRootDir, input.manifest.persistentProjectId);
    const exportPath = join(paths.aidev, AIDEV_EXPORT_METADATA_FILENAME);
    if (existsSync(exportPath)) {
      exportMetadata = JSON.parse(readFileSync(exportPath, 'utf8')) as PersistentProjectExportMetadata;
    }
  }

  const serviceFiles = listMatchingFiles(input.workspaceDir, '.service.ts');
  const typesFiles = listMatchingFiles(input.workspaceDir, '.types.ts');
  const validationFiles = listMatchingFiles(input.workspaceDir, '.validation.ts');

  return {
    readOnly: true,
    manifest: input.manifest,
    workspaceDir: input.workspaceDir,
    projectRootDir: input.projectRootDir,
    validation,
    exportMetadata,
    shellSource,
    distIndexExists,
    serviceFiles,
    typesFiles,
    validationFiles,
  };
}

export function buildMaterializationQualityCategoryScores(
  bundle: MaterializationQualityEvidenceBundle,
): MaterializationQualityCategoryScore[] {
  const { manifest } = bundle;
  const profile = String(manifest.selectedProfile) as MaterializationProfile;
  const definition = getProfileFeatureDefinition(profile, manifest.prompt);
  const expectedModules = definition.featureModules.filter((moduleId) => moduleId !== 'persistence');
  // featureModuleDetails can be empty after forensic finalize even when modules exist on disk.
  // Use every identity surface already present on the manifest so coverage does not false-report
  // 0/N missing while featureModules / directories prove the modules were generated.
  const presentModules = [
    ...manifest.featureModules,
    ...manifest.featureModuleDirectories.map((directory) =>
      directory.replace(/\\/g, '/').split('/').filter(Boolean).at(-1) ?? directory,
    ),
    ...manifest.featureModuleDetails.map((entry) => entry.id),
    ...manifest.featureModuleDetails.map((entry) => entry.name),
  ].filter(Boolean);
  const missingModules = expectedModules.filter(
    (moduleId) =>
      !presentModules.some((present) => {
        const left = present.toLowerCase();
        const right = moduleId.toLowerCase();
        return left === right || left.includes(right) || right.includes(left);
      }),
  );

  const manifestPath = join(bundle.workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
  const prodPath = join(bundle.workspaceDir, PRODUCTION_VALIDATION_EVIDENCE_FILENAME);
  const contractPath = join(bundle.workspaceDir, 'universal-feature-contract.json');

  const categories: MaterializationQualityCategoryScore[] = [
    scoreBlueprint(manifest, manifestPath),
    scorePromptAlignment(manifest, bundle.validation, manifestPath),
    scoreFeatureCoverage(manifest, expectedModules, missingModules, contractPath),
    scoreModularArchitecture(manifest, bundle.workspaceDir),
    scoreRouteReachability(manifest, definition.routes, bundle.workspaceDir),
    scoreServiceTypesValidation(manifest, expectedModules.length, bundle),
    scoreBuild(manifest, bundle.distIndexExists, manifestPath),
    scorePreview(manifest, manifestPath),
    scoreProductionValidation(manifest, prodPath),
    scoreBuildHistory(manifest),
    scorePersistentProjectReality(manifest, bundle.exportMetadata),
    scoreGenericityAvoidance(manifest, bundle.shellSource, manifestPath),
    scoreLaunchReadiness(manifest, bundle.exportMetadata, missingModules.length),
  ];

  return categories.map((category) => {
    const def = MATERIALIZATION_QUALITY_CATEGORIES.find((entry) => entry.id === category.id)!;
    return {
      ...category,
      weight: def.weight,
      weightedContribution: Math.round(category.score * def.weight),
    };
  });
}

function scoreBlueprint(
  manifest: GeneratedAppManifest,
  manifestPath: string,
): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 0;

  if (manifest.blueprintPurityStatus === 'PASS') {
    score += 50;
    reasons.push('Blueprint purity passed');
  } else if (manifest.blueprintPurityStatus === 'PENDING') {
    score += 25;
    missingEvidence.push('blueprintPurityStatus pending');
  } else {
    reasons.push('Blueprint purity failed');
  }

  if (manifest.shellPurityVerified) {
    score += 25;
    reasons.push('Shell purity verified');
  } else {
    missingEvidence.push('shellPurityVerified');
  }

  if (manifest.domainLanguageBoundaryVerified) {
    score += 25;
    reasons.push('Domain language boundary verified');
  } else {
    missingEvidence.push('domainLanguageBoundaryVerified');
  }

  return categoryResult('blueprint', 'Blueprint', clamp(score), [manifestPath], reasons, missingEvidence);
}

function scorePromptAlignment(
  manifest: GeneratedAppManifest,
  validation: MaterializationQualityEvidenceBundle['validation'],
  manifestPath: string,
): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 0;

  if (manifest.promptFaithfulnessStatus === 'PASS') {
    score += 35;
    reasons.push(`Prompt faithfulness PASS (score ${manifest.promptFaithfulnessScore ?? 0})`);
  } else if (manifest.promptFaithfulnessStatus === 'FAIL') {
    score = Math.min(score, 20);
    reasons.push(
      `Prompt faithfulness FAIL: ${(manifest.promptFaithfulnessFailureReasons ?? []).join('; ') || 'profile/module mismatch'}`,
    );
  } else if (manifest.promptFaithfulnessStatus === 'WARN') {
    score += 15;
    reasons.push('Prompt faithfulness WARN — partial module alignment');
  }

  if (manifest.promptSpecificTermsPresent) {
    score += 25;
    reasons.push(`Prompt-specific UI terms detected (${validation.matchedUiTerms.join(', ') || 'terms present'})`);
  } else {
    missingEvidence.push('promptSpecificTermsPresent');
  }

  if (manifest.profileSpecificUiVerified) {
    score += 20;
    reasons.push('Profile-specific UI verified');
  } else {
    missingEvidence.push('profileSpecificUiVerified');
  }

  if (validation.passed) {
    score += 20;
    reasons.push('Universal materialization validation passed');
  } else {
    reasons.push('Materialization validation incomplete');
  }

  if (manifest.promptFaithfulnessStatus === 'FAIL') {
    score = Math.min(score, 35);
  }

  return categoryResult('promptAlignment', 'Prompt Alignment', clamp(score), [manifestPath], reasons, missingEvidence);
}

function scoreFeatureCoverage(
  manifest: GeneratedAppManifest,
  expectedModules: string[],
  missingModules: string[],
  contractPath: string,
): MaterializationQualityCategoryScore {
  const presentCount = expectedModules.length - missingModules.length;
  const ratio = expectedModules.length > 0 ? presentCount / expectedModules.length : 1;
  const realityRatio =
    manifest.featureRealityRecords.length > 0
      ? manifest.featureRealityRecords.filter((record) => record.score >= 90).length /
        manifest.featureRealityRecords.length
      : ratio;
  const effectiveRatio = manifest.featureContractRealityRecordedAt ? Math.min(ratio, realityRatio) : ratio;
  const score = clamp(Math.round(effectiveRatio * 100));
  const reasons =
    missingModules.length === 0
      ? [`All ${expectedModules.length} expected feature modules present`]
      : [`${presentCount}/${expectedModules.length} expected modules present`];
  const missingEvidence = missingModules.map((moduleId) => `feature module missing: ${moduleId}`);
  const evidencePaths = [
    contractPath,
    ...manifest.featureModuleDetails.map((entry) => entry.componentPath),
  ].filter(Boolean);
  return categoryResult('featureCoverage', 'Feature Coverage', score, evidencePaths, reasons, missingEvidence);
}

function scoreModularArchitecture(
  manifest: GeneratedAppManifest,
  workspaceDir: string,
): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 0;
  const required = [
    'src/features/registry.ts',
    'src/features/routes.ts',
    'src/features/FeatureAppRouter.tsx',
  ];
  const evidencePaths = required.map((rel) => join(workspaceDir, rel));

  for (const rel of required) {
    if (existsSync(join(workspaceDir, rel))) score += 20;
    else missingEvidence.push(rel);
  }

  if (manifest.generatedFeatureModulesCount >= manifest.featureModules.length) {
    score += 20;
    reasons.push(`${manifest.generatedFeatureModulesCount} modular feature modules generated`);
  } else {
    missingEvidence.push('generatedFeatureModulesCount below expected');
  }

  if (manifest.featureModuleDirectories.length >= manifest.featureModules.length) {
    score += 20;
    reasons.push('Separate module directories present');
  } else {
    missingEvidence.push('featureModuleDirectories incomplete');
  }

  reasons.push('Modular registry/router architecture verified');
  return categoryResult('modularArchitecture', 'Modular Architecture', clamp(score), evidencePaths, reasons, missingEvidence);
}

function scoreRouteReachability(
  manifest: GeneratedAppManifest,
  expectedRoutes: string[],
  workspaceDir: string,
): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 0;

  const routesPath = join(workspaceDir, 'src/features/routes.ts');
  const registryPath = join(workspaceDir, 'src/features/registry.ts');
  const routerPath = join(workspaceDir, 'src/features/FeatureAppRouter.tsx');

  if (existsSync(routesPath)) score += 30;
  else missingEvidence.push('src/features/routes.ts');
  if (existsSync(registryPath)) score += 20;
  else missingEvidence.push('src/features/registry.ts');
  if (existsSync(routerPath)) score += 20;
  else missingEvidence.push('src/features/FeatureAppRouter.tsx');

  if (manifest.modularRoutesVerified) {
    score += 15;
    reasons.push('Modular routes verified');
  } else {
    missingEvidence.push('modularRoutesVerified');
  }

  const routeRatio =
    expectedRoutes.length > 0 ? Math.min(1, manifest.generatedRoutesCount / expectedRoutes.length) : 1;
  score += Math.round(routeRatio * 15);
  reasons.push(`${manifest.generatedRoutesCount}/${expectedRoutes.length || manifest.generatedRoutesCount} routes generated`);

  return categoryResult(
    'routeReachability',
    'Routes',
    clamp(score),
    [routesPath, registryPath, routerPath],
    reasons,
    missingEvidence,
  );
}

function scoreServiceTypesValidation(
  manifest: GeneratedAppManifest,
  expectedModuleCount: number,
  bundle: MaterializationQualityEvidenceBundle,
): MaterializationQualityCategoryScore {
  const expectedArtifacts = Math.max(1, expectedModuleCount) * 2;
  const foundArtifacts = bundle.serviceFiles.length + bundle.typesFiles.length + bundle.validationFiles.length;
  const ratio = Math.min(1, foundArtifacts / expectedArtifacts);
  const score = clamp(Math.round(ratio * 100));
  const evidencePaths = [...bundle.serviceFiles, ...bundle.typesFiles, ...bundle.validationFiles].slice(0, 8);
  return categoryResult(
    'serviceTypesValidation',
    'Services/Types/Validation',
    score,
    evidencePaths,
    [
      `${bundle.serviceFiles.length} service files`,
      `${bundle.typesFiles.length} types files`,
      `${bundle.validationFiles.length} validation files`,
    ],
    foundArtifacts < expectedArtifacts ? ['service/types/validation coverage incomplete'] : [],
  );
}

function scoreBuild(
  manifest: GeneratedAppManifest,
  distIndexExists: boolean,
  manifestPath: string,
): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 0;

  if (manifest.validationStatus === 'PASS') {
    score += 40;
    reasons.push('Validation status PASS');
  } else if (manifest.validationStatus === 'PARTIAL') {
    score += 20;
    reasons.push('Validation status PARTIAL');
  } else {
    missingEvidence.push('validationStatus');
  }

  if (manifest.npmBuildDurationMs > 0) {
    score += 30;
    reasons.push(`npm build completed in ${manifest.npmBuildDurationMs}ms`);
  } else {
    missingEvidence.push('npmBuildDurationMs');
  }

  if (distIndexExists) {
    score += 30;
    reasons.push('dist/index.html present');
  } else {
    missingEvidence.push('dist/index.html');
  }

  return categoryResult('build', 'Build', clamp(score), [manifestPath], reasons, missingEvidence);
}

function scorePreview(manifest: GeneratedAppManifest, manifestPath: string): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 0;

  if (manifest.previewVerified) {
    score += 40;
    reasons.push('Preview verified');
  } else {
    missingEvidence.push('previewVerified');
  }

  if (manifest.previewHtmlStatus === 'PASS') {
    score += 35;
    reasons.push('Preview HTML status PASS');
  } else if (manifest.previewHtmlStatus === 'PENDING') {
    score += 15;
    missingEvidence.push('previewHtmlStatus pending');
  } else {
    missingEvidence.push('previewHtmlStatus FAIL');
  }

  if (manifest.previewUrl) {
    score += 25;
    reasons.push(`Preview URL recorded (${manifest.previewUrl})`);
  } else {
    missingEvidence.push('previewUrl');
  }

  return categoryResult('preview', 'Preview', clamp(score), [manifestPath], reasons, missingEvidence);
}

function scoreProductionValidation(
  manifest: GeneratedAppManifest,
  prodPath: string,
): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 0;

  if (manifest.productionValidationStatus === 'PASS') {
    score += 60;
    reasons.push('Production validation PASS');
  } else if (manifest.productionValidationStatus === 'PENDING') {
    score += 25;
    missingEvidence.push('productionValidationStatus pending');
  } else {
    missingEvidence.push('productionValidationStatus FAIL');
    reasons.push(...manifest.productionValidationFailureReasons.slice(0, 2));
  }

  const passedStages = manifest.productionValidationStages.filter((stage) => stage.status === 'PASS').length;
  const totalStages = manifest.productionValidationStages.length;
  if (totalStages > 0) {
    score += Math.round((passedStages / totalStages) * 40);
    reasons.push(`${passedStages}/${totalStages} production validation stages passed`);
  } else {
    missingEvidence.push('productionValidationStages');
  }

  return categoryResult(
    'productionValidation',
    'Production Validation',
    clamp(score),
    existsSync(prodPath) ? [prodPath] : [],
    reasons,
    missingEvidence,
  );
}

function scoreBuildHistory(manifest: GeneratedAppManifest): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 0;
  const evidencePaths: string[] = [];

  if (manifest.buildHistoryRecorded) {
    score += 30;
    reasons.push('Build history recorded');
  } else {
    missingEvidence.push('buildHistoryRecorded');
  }

  if (manifest.buildHistoryRecordPath) {
    score += 20;
    evidencePaths.push(manifest.buildHistoryRecordPath);
  } else {
    missingEvidence.push('buildHistoryRecordPath');
  }

  if (manifest.replayMetadataPath) {
    score += 15;
    evidencePaths.push(manifest.replayMetadataPath);
  } else {
    missingEvidence.push('replayMetadataPath');
  }

  if (manifest.auditTimelinePath) {
    score += 15;
    evidencePaths.push(manifest.auditTimelinePath);
  } else {
    missingEvidence.push('auditTimelinePath');
  }

  if (manifest.buildHistoryRecordHash) {
    score += 20;
    reasons.push('Immutable build record hash present');
  } else {
    missingEvidence.push('buildHistoryRecordHash');
  }

  return categoryResult('buildHistory', 'Build History', clamp(score), evidencePaths, reasons, missingEvidence);
}

function scorePersistentProjectReality(
  manifest: GeneratedAppManifest,
  exportMetadata: PersistentProjectExportMetadata | null,
): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 0;
  const evidencePaths: string[] = [];

  if (manifest.persistentProjectRealityStatus === 'PASS') {
    score += 35;
    reasons.push('Persistent project reality PASS');
  } else if (manifest.persistentProjectRealityStatus === 'SKIPPED') {
    score += 10;
    missingEvidence.push('persistent project promotion skipped');
  } else {
    missingEvidence.push('persistentProjectRealityStatus');
  }

  if (manifest.persistentProjectSourceRoot) {
    score += 20;
    evidencePaths.push(manifest.persistentProjectSourceRoot);
  } else {
    missingEvidence.push('persistentProjectSourceRoot');
  }

  if (manifest.projectFileIndexPath) {
    score += 15;
    evidencePaths.push(manifest.projectFileIndexPath);
  } else {
    missingEvidence.push('projectFileIndexPath');
  }

  if (manifest.exportMetadataPath) {
    score += 10;
    evidencePaths.push(manifest.exportMetadataPath);
  } else {
    missingEvidence.push('exportMetadataPath');
  }

  if (exportMetadata?.exportReady) {
    score += 20;
    reasons.push('Export metadata reports exportReady');
  } else {
    missingEvidence.push('exportReady');
  }

  if (manifest.workspaceRealityAuditStatus === 'FAIL') {
    score -= 30;
    missingEvidence.push('workspace reality audit FAIL');
    reasons.push('Workspace structural audit failed');
  } else if (
    manifest.persistentProjectRealityStatus === 'PASS' &&
    manifest.workspaceRealityRecordedAt &&
    manifest.workspaceRealityAuditStatus === 'PASS'
  ) {
    score += 10;
    reasons.push('Workspace reality audit passed');
  }

  return categoryResult(
    'persistentProjectReality',
    'Persistent Project Reality',
    clamp(score),
    evidencePaths,
    reasons,
    missingEvidence,
  );
}

function scoreGenericityAvoidance(
  manifest: GeneratedAppManifest,
  shellSource: string,
  manifestPath: string,
): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 100;

  if (manifest.fallbackUsed) {
    score -= 40;
    reasons.push('Generic profile fallback was used');
  }

  if (!manifest.promptSpecificTermsPresent) {
    score -= 30;
    missingEvidence.push('promptSpecificTermsPresent');
  } else {
    reasons.push('Prompt-specific terms present in allowed areas');
  }

  if (GENERIC_PM_MARKERS.some((marker) => shellSource.includes(marker))) {
    score -= 50;
    reasons.push('Project Management fallback detected in shell');
  } else {
    reasons.push('No generic Project Management fallback in shell');
  }

  return categoryResult(
    'genericityAvoidance',
    'Genericity Avoidance',
    clamp(score),
    [manifestPath],
    reasons,
    missingEvidence,
  );
}

function scoreLaunchReadiness(
  manifest: GeneratedAppManifest,
  exportMetadata: PersistentProjectExportMetadata | null,
  missingModuleCount: number,
): MaterializationQualityCategoryScore {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  let score = 100;

  if (manifest.status !== 'PASS') {
    score -= 50;
    missingEvidence.push('manifest.status not PASS');
  }

  if (!manifest.previewVerified || manifest.previewHtmlStatus !== 'PASS') {
    score -= 20;
    missingEvidence.push('preview not verified');
  }

  if (manifest.productionValidationStatus !== 'PASS') {
    score -= 20;
    missingEvidence.push('production validation not PASS');
  }

  if (!exportMetadata?.exportReady) {
    score -= 15;
    missingEvidence.push('exportReady false');
  }

  if (manifest.validationStatus !== 'PASS') {
    score -= 15;
    missingEvidence.push('validationStatus not PASS');
  }

  if (manifest.workspaceRealityAuditStatus === 'FAIL') {
    score -= 40;
    missingEvidence.push('workspace reality audit FAIL');
    reasons.push('Workspace reality audit failed — launch blocked');
  } else if (manifest.workspaceRealityAuditStatus === 'WARN') {
    score -= 15;
    reasons.push('Workspace reality audit warnings present');
  }

  score -= Math.min(30, missingModuleCount * 8);

  if (manifest.failureReason) {
    score -= 40;
    reasons.push(manifest.failureReason);
  }

  if (score >= 80) reasons.push('Launch readiness evidence strong');
  else if (score >= 50) reasons.push('Launch readiness partially met');
  else reasons.push('Launch readiness blocked by critical gaps');

  return categoryResult(
    'launchReadiness',
    'Launch Readiness',
    clamp(score),
    [manifest.exportMetadataPath ?? '', manifest.persistentProjectSourceRoot ?? ''].filter(Boolean),
    reasons,
    missingEvidence,
  );
}

function categoryResult(
  id: MaterializationQualityCategoryScore['id'],
  label: string,
  score: number,
  evidencePaths: string[],
  reasons: string[],
  missingEvidence: string[],
): MaterializationQualityCategoryScore {
  const status: MaterializationQualityCategoryStatus =
    score >= 80 ? 'PASS' : score >= 50 ? 'WARN' : 'FAIL';
  return {
    readOnly: true,
    id,
    label,
    score,
    weight: 0,
    weightedContribution: 0,
    status,
    evidencePaths: evidencePaths.map((path) => path.replace(/\\/g, '/')),
    reasons,
    missingEvidence,
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function listMatchingFiles(baseDir: string, suffix: string): string[] {
  const results: string[] = [];
  walk(baseDir, baseDir, suffix, results);
  return results;
}

function walk(currentDir: string, baseDir: string, suffix: string, results: string[]): void {
  if (!existsSync(currentDir)) return;
  for (const name of readdirSync(currentDir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const full = join(currentDir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, baseDir, suffix, results);
      continue;
    }
    if (full.endsWith(suffix)) {
      results.push(full.replace(/\\/g, '/').slice(baseDir.replace(/\\/g, '/').length + 1));
    }
  }
}
