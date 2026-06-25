/**
 * AIDEVENGINE_BUILD_PROOF_V1_2 — launch evidence handoff adapter.
 * Registers real build-proof evidence for UVL, AFLA, and Founder launch authorities.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { recordCqiMaturityAssessment } from '../clarifying-question-intelligence/cqi-maturity-history.js';
import {
  buildBuildRealityEvidenceFromWorkspace,
  collectFounderLaunchEvidence,
  runAutonomousFounderLaunchAuthority,
} from '../autonomous-founder-launch-authority/index.js';
import { registerSourceDerivedEngineeringRealityAssessment } from '../engineering-reality-authority/engineering-reality-authority.js';
import { registerSourceDerivedFeatureRealityAssessment } from '../feature-reality-validation/feature-reality-validation-authority.js';
import { inspectUniversalAppBlueprint } from '../universal-app-blueprint/index.js';
import { registerSourceDerivedBlueprintVisualAssessment } from '../universal-app-blueprint-visual/universal-app-blueprint-visual-authority.js';
import { assessUvlMaturity } from '../unified-verification-lab/uvl-maturity-assessor.js';
import type { FeatureRealityCheck } from '../feature-reality-validation/feature-reality-validation-types.js';
import type { BlueprintVisualCheck } from '../universal-app-blueprint-visual/universal-app-blueprint-visual-types.js';
import type { EngineeringRealityCheck } from '../engineering-reality-authority/engineering-reality-types.js';
import type {
  AuthorityConsumptionEntry,
  AuthorityConsumptionMap,
  BuildMaterializationEvidence,
  EnrichedRequirementsEvidence,
  LaunchEvidenceBundle,
  UvlBehaviourEvidenceRecord,
  UvlBehaviourKey,
} from './launch-evidence-handoff-types.js';

const BEHAVIOUR_TO_FEATURE_CHECK: Record<
  UvlBehaviourKey,
  { id: string; label: string; category: string; critical: boolean }
> = {
  addTask: {
    id: 'handoff-add-task',
    label: 'Add task capability (source-derived)',
    category: 'execution',
    critical: true,
  },
  markComplete: {
    id: 'handoff-mark-complete',
    label: 'Mark complete capability (source-derived)',
    category: 'execution',
    critical: true,
  },
  deleteTask: {
    id: 'handoff-delete-task',
    label: 'Delete task capability (source-derived)',
    category: 'delete',
    critical: true,
  },
  filterAllActiveCompleted: {
    id: 'handoff-filter',
    label: 'Filter all/active/completed (source-derived)',
    category: 'discoverability',
    critical: true,
  },
  activeCountUpdates: {
    id: 'handoff-active-count',
    label: 'Active task count updates (source-derived)',
    category: 'ux',
    critical: false,
  },
  browserBuildArtifactExists: {
    id: 'handoff-build-artifact',
    label: 'Browser build artifact exists',
    category: 'persistence',
    critical: true,
  },
};

export function buildLaunchEvidenceBundle(input: {
  enrichedRequirements: EnrichedRequirementsEvidence;
  buildMaterialization: BuildMaterializationEvidence;
  uvlBehaviour: UvlBehaviourEvidenceRecord;
  profile: string;
  productName: string;
}): LaunchEvidenceBundle {
  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    profile: input.profile,
    productName: input.productName,
    enrichedRequirements: input.enrichedRequirements,
    buildMaterialization: input.buildMaterialization,
    uvlBehaviour: input.uvlBehaviour,
    materializationHandoff: {
      readOnly: true,
      workspaceMaterialized: Boolean(input.buildMaterialization.workspacePath),
      npmBuildOk: input.buildMaterialization.npmBuildOk,
      previewArtifactExists: input.buildMaterialization.previewArtifactExists,
      generatedFileCount: input.buildMaterialization.generatedFileCount,
    },
  };
}

export function applyLaunchEvidenceHandoff(input: {
  bundle: LaunchEvidenceBundle;
  projectRootDir: string;
}): {
  consumption: AuthorityConsumptionMap;
  uvlAfterHandoff: ReturnType<typeof assessUvlMaturity>;
  aflaAfterHandoff: ReturnType<typeof runAutonomousFounderLaunchAuthority>;
  founderEvidenceAfterHandoff: ReturnType<typeof collectFounderLaunchEvidence>;
} {
  const { bundle } = input;
  const entries: AuthorityConsumptionEntry[] = [];
  const workspacePath = bundle.buildMaterialization.workspacePath;
  const previewUrl = bundle.buildMaterialization.previewArtifactPath
    ? `file://${bundle.buildMaterialization.previewArtifactPath.replace(/\\/g, '/')}`
    : 'file://dist/index.html';
  const contractId = bundle.buildMaterialization.buildReadyContractId ?? 'build-proof-handoff';

  recordCqiMaturityAssessment(bundle.enrichedRequirements.cqiEnriched);
  entries.push({
    readOnly: true,
    authority: 'Clarifying Question Intelligence',
    consumed: true,
    fieldsUsed: [
      'requirementConfidenceScore',
      'canProceedToPlanning',
      'coverageMatrix',
      'enrichedPrompt',
    ],
    fieldsIgnored: ['openQuestions when enriched canProceedToPlanning'],
    fieldsUnsupported: [],
    detail: `Recorded enriched CQI assessment (confidence ${bundle.enrichedRequirements.enrichedConfidence})`,
  });

  const featureChecks: FeatureRealityCheck[] = bundle.uvlBehaviour.behaviours
    .filter((b) => b.behaviour !== 'browserBuildArtifactExists')
    .map((item) => {
      const meta = BEHAVIOUR_TO_FEATURE_CHECK[item.behaviour];
      return {
        id: meta.id,
        category: meta.category,
        label: meta.label,
        featureId: item.behaviour,
        passed: item.passed,
        detail: `source-derived static inspection: ${item.detail}`,
        critical: meta.critical,
      };
    });

  const featureAssessment = registerSourceDerivedFeatureRealityAssessment({
    previewUrl,
    contractId,
    checks: featureChecks,
  });
  entries.push({
    readOnly: true,
    authority: 'Feature Reality Validation',
    consumed: true,
    fieldsUsed: ['checks from UVL behaviour evidence', 'previewUrl', 'contractId'],
    fieldsIgnored: [],
    fieldsUnsupported: ['playwright runtime execution'],
    detail: `Registered source-derived assessment passed=${featureAssessment.passed} score=${featureAssessment.scores.overallFeatureScore}`,
  });

  const blueprintInspection = workspacePath ? inspectUniversalAppBlueprint(workspacePath) : null;
  const visualChecks: BlueprintVisualCheck[] = [
    {
      id: 'handoff-blueprint-structure',
      category: 'launch',
      label: 'Universal App Blueprint structure (source-derived)',
      passed: blueprintInspection?.passed ?? false,
      detail: blueprintInspection?.passed
        ? 'Blueprint sections present in workspace'
        : `Missing: ${blueprintInspection?.missingArtifacts.join(', ') ?? 'workspace unavailable'}`,
      critical: true,
    },
    {
      id: 'handoff-dist-artifact',
      category: 'launch',
      label: 'Production dist/index.html artifact',
      passed: bundle.buildMaterialization.previewArtifactExists,
      detail: bundle.buildMaterialization.previewArtifactPath ?? 'missing',
      critical: true,
    },
    {
      id: 'handoff-viewport-not-run',
      category: 'responsive',
      label: 'Rendered viewport validation',
      passed: false,
      detail: 'Playwright viewport checks not run in build-proof handoff',
      critical: false,
    },
  ];
  const visualAssessment = registerSourceDerivedBlueprintVisualAssessment({
    previewUrl,
    checks: visualChecks,
    viewportEvidence: ['build-proof-handoff: viewport not measured'],
  });
  entries.push({
    readOnly: true,
    authority: 'Universal App Blueprint Visual',
    consumed: true,
    fieldsUsed: ['blueprint structure inspection', 'dist artifact path'],
    fieldsIgnored: ['viewportEvidence runtime measurements'],
    fieldsUnsupported: ['playwright responsive viewport runs'],
    detail: `Registered source-derived assessment passed=${visualAssessment.passed} score=${visualAssessment.scores.overallBlueprintScore}`,
  });

  const engineeringChecks: EngineeringRealityCheck[] = [
    {
      id: 'handoff-npm-build',
      category: 'build',
      label: 'npm run build completes',
      passed: bundle.buildMaterialization.npmBuildOk,
      detail: bundle.buildMaterialization.npmBuildOk
        ? `exit ${bundle.buildMaterialization.npmBuildExitCode}`
        : 'build failed or not run',
      critical: true,
    },
    {
      id: 'handoff-build-output',
      category: 'build',
      label: 'Build output artifact present',
      passed: bundle.buildMaterialization.previewArtifactExists,
      detail: bundle.buildMaterialization.previewArtifactPath ?? 'missing',
      critical: true,
    },
    {
      id: 'handoff-runtime-not-run',
      category: 'performance',
      label: 'Playwright runtime engineering checks',
      passed: false,
      detail: 'Not run in build-proof handoff — build-only evidence',
      critical: false,
    },
  ];
  const engineeringAssessment = registerSourceDerivedEngineeringRealityAssessment({
    previewUrl,
    contractId,
    productName: bundle.productName,
    checks: engineeringChecks,
    buildAnalysis: {
      passed: bundle.buildMaterialization.npmBuildOk,
      exitCode: bundle.buildMaterialization.npmBuildExitCode ?? 1,
      outputBytes: bundle.buildMaterialization.previewArtifactExists ? 1 : 0,
      warnings: [],
      detail: bundle.buildMaterialization.npmBuildOk ? 'Build proof handoff' : 'Build not proven',
    },
  });
  entries.push({
    readOnly: true,
    authority: 'Engineering Reality',
    consumed: true,
    fieldsUsed: ['build checks', 'buildAnalysis from materialization evidence'],
    fieldsIgnored: [],
    fieldsUnsupported: ['playwright runtime security/accessibility/performance probes'],
    detail: `Registered build-only assessment passed=${engineeringAssessment.passed} score=${engineeringAssessment.scores.overallEngineeringScore}`,
  });

  const buildReality = workspacePath
    ? buildBuildRealityEvidenceFromWorkspace({
        npmInstallOk: true,
        npmBuildOk: bundle.buildMaterialization.npmBuildOk,
        devServerOk: bundle.buildMaterialization.previewArtifactExists,
        workspacePresent: true,
      })
    : null;

  const aflaAssessment = runAutonomousFounderLaunchAuthority({
    workspaceDir: workspacePath,
    buildReality: buildReality ?? undefined,
    contractId,
    productName: bundle.productName,
    skipAutofix: true,
  });
  entries.push({
    readOnly: true,
    authority: 'Autonomous Founder Launch Authority (AFLA)',
    consumed: true,
    fieldsUsed: ['workspaceDir', 'buildReality from materialization', 'enriched CQI via getLastCqiMaturityAssessment'],
    fieldsIgnored: ['productPrompt direct injection'],
    fieldsUnsupported: ['playwright-derived feature/visual overrides without registration'],
    detail: `AFLA verdict=${aflaAssessment.verdict} score=${aflaAssessment.scores.overallFounderScore}`,
  });

  const uvlAfterHandoff = assessUvlMaturity({
    profile: bundle.profile,
    productPrompt: bundle.enrichedRequirements.enrichedPrompt,
    projectRootDir: input.projectRootDir,
    workspaceDir: workspacePath,
    buildProofHandoff: bundle.materializationHandoff,
  });
  entries.push({
    readOnly: true,
    authority: 'UVL Verification Hub',
    consumed: true,
    fieldsUsed: [
      'buildProofHandoff',
      'workspaceDir',
      'getLastCqiMaturityAssessment',
      'getLastFeatureRealityAssessment',
      'getLastBlueprintVisualAssessment',
      'getLastEngineeringRealityAssessment',
      'getLastAutonomousFounderLaunchAssessment',
    ],
    fieldsIgnored: [],
    fieldsUnsupported: ['uvlBehaviour direct field — consumed via registered assessments'],
    detail: `UVL coverage=${uvlAfterHandoff.overallCoveragePercent}% confidence=${uvlAfterHandoff.verificationConfidenceScore}`,
  });

  const founderEvidenceAfterHandoff = collectFounderLaunchEvidence({
    projectRootDir: input.projectRootDir,
    workspaceDir: workspacePath,
    buildReality,
    productPrompt: bundle.enrichedRequirements.enrichedPrompt,
    profile: bundle.profile,
    synthesizeLaunchReadiness: true,
  });
  entries.push({
    readOnly: true,
    authority: 'Founder Launch Readiness (evidence collector)',
    consumed: true,
    fieldsUsed: [
      'workspaceDir',
      'buildReality',
      'productPrompt enriched',
      'registered feature/visual/engineering assessments',
    ],
    fieldsIgnored: [],
    fieldsUnsupported: ['founderExecutionProofInput connected assessment injection in this path'],
    detail: `Prerequisites passed=${founderEvidenceAfterHandoff.allPrerequisitesPassed} missing=${founderEvidenceAfterHandoff.missingPrerequisites.length}`,
  });

  return {
    consumption: {
      readOnly: true,
      generatedAt: new Date().toISOString(),
      entries,
    },
    uvlAfterHandoff,
    aflaAfterHandoff: aflaAssessment,
    founderEvidenceAfterHandoff,
  };
}

export function previewArtifactPath(workspacePath: string | null): string | null {
  if (!workspacePath) return null;
  const distIndex = join(workspacePath, 'dist', 'index.html');
  return existsSync(distIndex) ? distIndex : null;
}
