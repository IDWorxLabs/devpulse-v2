/**
 * AIDEVENGINE_BUILD_PROOF_V1_4 — launch evidence handoff with bounded product architecture proof.
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
import {
  buildUniversalFeatureContract,
  generateFeatureRealityValidationPlan,
  registerSourceDerivedUniversalFeatureContractAssessment,
} from '../universal-feature-contract-intelligence/index.js';
import {
  assessProductArchitecture,
  registerSourceDerivedProductArchitectureAssessment,
} from '../product-architect-intelligence-v1/index.js';
import { deriveLaunchPrerequisitesFromRegisteredAssessments } from '../unified-verification-lab/uvl-verification-coverage-assessor.js';
import type { ProductArchitectureAssessment } from '../product-architect-intelligence-v1/product-architect-intelligence-types.js';
import type { ProductArchitectureEvidence } from './product-architecture-evidence-types.js';
import type { FeatureRealityCheck } from '../feature-reality-validation/feature-reality-validation-types.js';
import type { BlueprintVisualCheck } from '../universal-app-blueprint-visual/universal-app-blueprint-visual-types.js';
import type { EngineeringRealityCheck } from '../engineering-reality-authority/engineering-reality-types.js';
import type { UniversalFeatureRealityCheck } from '../universal-feature-contract-intelligence/universal-feature-contract-types.js';
import type {
  AuthorityConsumptionEntry,
  AuthorityConsumptionMap,
  LaunchEvidenceBundle,
  UvlBehaviourKey,
} from '../aidevengine-build-proof-v1-2/launch-evidence-handoff-types.js';
import type { VisualRuntimeEvidence } from '../aidevengine-build-proof-v1-3/visual-runtime-evidence-types.js';

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

const RUNTIME_TO_FEATURE: Record<string, { id: string; label: string; category: string; critical: boolean }> = {
  'runtime-task-input': {
    id: 'runtime-task-input',
    label: 'Task input present (bounded runtime)',
    category: 'execution',
    critical: true,
  },
  'runtime-add-action': {
    id: 'runtime-add-action',
    label: 'Add task action visible (bounded runtime)',
    category: 'execution',
    critical: true,
  },
  'runtime-task-list': {
    id: 'runtime-task-list',
    label: 'Task list region exists (bounded runtime)',
    category: 'execution',
    critical: true,
  },
  'runtime-filter-controls': {
    id: 'runtime-filter-controls',
    label: 'Filter controls exist (bounded runtime)',
    category: 'discoverability',
    critical: true,
  },
  'runtime-active-count': {
    id: 'runtime-active-count',
    label: 'Active count visible (bounded runtime)',
    category: 'ux',
    critical: false,
  },
};

export function applyLaunchEvidenceHandoffV14(input: {
  bundle: LaunchEvidenceBundle;
  visualRuntime: VisualRuntimeEvidence;
  productArchitectureEvidence: ProductArchitectureEvidence;
  projectRootDir: string;
}): {
  consumption: AuthorityConsumptionMap;
  uvlAfterHandoff: ReturnType<typeof assessUvlMaturity>;
  aflaAfterHandoff: ReturnType<typeof runAutonomousFounderLaunchAuthority>;
  uvlBeforeAfla: ReturnType<typeof assessUvlMaturity>;
  launchPrerequisitesBeforeAfla: ReturnType<typeof deriveLaunchPrerequisitesFromRegisteredAssessments>;
  founderEvidenceAfterHandoff: ReturnType<typeof collectFounderLaunchEvidence>;
  blueprintVisualScore: number;
  blueprintVisualPassed: boolean;
  blueprintVisualVerdict: string;
  universalFeaturePassed: boolean;
  universalFeatureScore: number | null;
  universalFeatureVerdict: string | null;
  productArchitectureBefore: ProductArchitectureAssessment;
  productArchitectureAfter: ProductArchitectureAssessment;
} {
  const { bundle, visualRuntime, productArchitectureEvidence } = input;
  const entries: AuthorityConsumptionEntry[] = [];
  const workspacePath = bundle.buildMaterialization.workspacePath;
  const previewUrl =
    visualRuntime.previewUrl ??
    (bundle.buildMaterialization.previewArtifactPath
      ? `file://${bundle.buildMaterialization.previewArtifactPath.replace(/\\/g, '/')}`
      : 'file://dist/index.html');
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

  const productArchitectureBefore = assessProductArchitecture({
    productPrompt: bundle.enrichedRequirements.enrichedPrompt,
    profile: bundle.profile,
  });

  const productArchitectureAfter = registerSourceDerivedProductArchitectureAssessment({
    profile: bundle.profile,
    productName: bundle.productName,
    productPrompt: bundle.enrichedRequirements.enrichedPrompt,
    workspacePath: workspacePath ?? '',
    observedEvidence: productArchitectureEvidence.observedEvidence,
    evidenceItems: productArchitectureEvidence.items,
    knownLimitations: productArchitectureEvidence.knownLimitations,
  });
  entries.push({
    readOnly: true,
    authority: 'Product Architect Intelligence',
    consumed: true,
    fieldsUsed: [
      'product-architecture-evidence.json',
      'workspace inspection',
      'UVL behaviour linkage',
      'visual-runtime linkage',
      'known limitations',
    ],
    fieldsIgnored: ['generic PROJECT_MANAGEMENT pattern without workspace scope'],
    fieldsUnsupported: [],
    detail: `Architecture readiness ${productArchitectureBefore.scores.productReadinessScore} → ${productArchitectureAfter.scores.productReadinessScore}; critical gaps ${productArchitectureBefore.gapReport.criticalGapCount} → ${productArchitectureAfter.gapReport.criticalGapCount}`,
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

  for (const runtimeCheck of visualRuntime.checks.filter((c) => c.category === 'runtime-ui')) {
    const meta = RUNTIME_TO_FEATURE[runtimeCheck.id];
    if (!meta) continue;
    featureChecks.push({
      id: meta.id,
      category: meta.category,
      label: meta.label,
      featureId: runtimeCheck.id,
      passed: runtimeCheck.passed,
      detail: `bounded runtime: ${runtimeCheck.detail}`,
      critical: meta.critical,
    });
  }

  const featureAssessment = registerSourceDerivedFeatureRealityAssessment({
    previewUrl,
    contractId,
    checks: featureChecks,
  });
  entries.push({
    readOnly: true,
    authority: 'Feature Reality Validation',
    consumed: true,
    fieldsUsed: [
      'checks from UVL behaviour evidence',
      'bounded runtime UI checks when Playwright supported',
      'previewUrl',
      'contractId',
    ],
    fieldsIgnored: [],
    fieldsUnsupported: visualRuntime.playwrightSupported ? [] : ['full Playwright feature workflow suite'],
    detail: `Registered assessment passed=${featureAssessment.passed} score=${featureAssessment.scores.overallFeatureScore}`,
  });

  const blueprintInspection = workspacePath ? inspectUniversalAppBlueprint(workspacePath) : null;
  const viewportChecks = visualRuntime.checks.filter((c) => c.category === 'viewport');
  const viewportPassed = viewportChecks.length > 0 && viewportChecks.every((c) => c.passed);
  const viewportDetail = visualRuntime.playwrightSupported
    ? viewportPassed
      ? `Viewport checks passed: ${visualRuntime.viewportEvidence.join('; ')}`
      : `Viewport gaps: ${visualRuntime.viewportEvidence.join('; ')}`
    : visualRuntime.playwrightUnsupportedReason ?? 'Playwright viewport checks not run';

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
      id: 'handoff-preview-loads',
      category: 'launch',
      label: 'Preview artifact loads in browser runtime',
      passed: visualRuntime.checks.find((c) => c.id === 'runtime-preview-loads')?.passed ?? false,
      detail:
        visualRuntime.checks.find((c) => c.id === 'runtime-preview-loads')?.detail ??
        (visualRuntime.playwrightSupported ? 'runtime load check missing' : 'Playwright not run'),
      critical: true,
    },
    {
      id: 'handoff-viewport-runtime',
      category: 'responsive',
      label: 'Rendered viewport validation (bounded)',
      passed: visualRuntime.playwrightSupported ? viewportPassed : false,
      detail: viewportDetail,
      critical: false,
    },
  ];

  for (const runtimeCheck of visualRuntime.checks.filter(
    (c) => c.category === 'runtime-ui' || c.category === 'static-artifact',
  )) {
    if (runtimeCheck.id === 'runtime-preview-loads') continue;
    visualChecks.push({
      id: `visual-${runtimeCheck.id}`,
      category: runtimeCheck.category === 'static-artifact' ? 'launch' : 'home',
      label: runtimeCheck.label,
      passed: runtimeCheck.passed,
      detail: runtimeCheck.detail,
      critical: runtimeCheck.critical,
    });
  }

  const visualAssessment = registerSourceDerivedBlueprintVisualAssessment({
    previewUrl,
    checks: visualChecks,
    viewportEvidence: visualRuntime.playwrightSupported
      ? [...visualRuntime.viewportEvidence]
      : [`build-proof-v1-3: ${visualRuntime.playwrightUnsupportedReason ?? 'viewport not measured'}`],
  });
  entries.push({
    readOnly: true,
    authority: 'Universal App Blueprint Visual',
    consumed: true,
    fieldsUsed: [
      'blueprint structure inspection',
      'dist artifact path',
      'bounded visual-runtime-evidence checks',
      'viewportEvidence',
    ],
    fieldsIgnored: [],
    fieldsUnsupported: visualRuntime.playwrightSupported
      ? ['full blueprint visual runner (uses bounded checks instead)']
      : ['playwright responsive viewport runs'],
    detail: `Registered assessment passed=${visualAssessment.passed} score=${visualAssessment.scores.overallBlueprintScore}`,
  });

  const runtimePreviewPassed =
    visualRuntime.checks.find((c) => c.id === 'runtime-preview-loads')?.passed ?? false;
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
      id: 'handoff-runtime-preview',
      category: 'performance',
      label: 'Bounded Playwright runtime preview check',
      passed: visualRuntime.playwrightSupported ? runtimePreviewPassed : false,
      detail: visualRuntime.playwrightSupported
        ? runtimePreviewPassed
          ? 'Preview loaded with core UI controls'
          : 'Preview load or core controls failed'
        : visualRuntime.playwrightUnsupportedReason ?? 'Playwright not available',
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
      detail: bundle.buildMaterialization.npmBuildOk ? 'Build proof V1.3 handoff' : 'Build not proven',
    },
  });
  entries.push({
    readOnly: true,
    authority: 'Engineering Reality',
    consumed: true,
    fieldsUsed: ['build checks', 'buildAnalysis', 'bounded runtime preview probe'],
    fieldsIgnored: [],
    fieldsUnsupported: visualRuntime.playwrightSupported
      ? ['full engineering Playwright security/accessibility suite']
      : ['playwright runtime security/accessibility/performance probes'],
    detail: `Registered assessment passed=${engineeringAssessment.passed} score=${engineeringAssessment.scores.overallEngineeringScore}`,
  });

  let universalFeaturePassed = false;
  let universalFeatureScore: number | null = null;
  let universalFeatureVerdict: string | null = null;

  if (visualRuntime.playwrightSupported) {
    const contract = buildUniversalFeatureContract({
      contractId,
      rawPrompt: bundle.enrichedRequirements.enrichedPrompt,
    });
    const plan = generateFeatureRealityValidationPlan(contract);
    const universalChecks: UniversalFeatureRealityCheck[] = visualRuntime.checks
      .filter((c) => c.category === 'runtime-ui' && c.id !== 'runtime-preview-loads')
      .map((c) => ({
        id: c.id,
        category:
          c.id.includes('filter') ? 'discoverability' : c.id.includes('active') ? 'workflow' : 'execution',
        entityId: 'task',
        actionId: c.id.replace('runtime-', ''),
        label: c.label,
        passed: c.passed,
        detail: c.detail,
        critical: c.critical,
      }));
    const universalAssessment = registerSourceDerivedUniversalFeatureContractAssessment({
      previewUrl,
      contract,
      plan,
      checks: universalChecks,
    });
    universalFeaturePassed = universalAssessment.passed;
    universalFeatureScore = universalAssessment.scores.overallFeatureRealityScore;
    universalFeatureVerdict = universalAssessment.verdict;
    entries.push({
      readOnly: true,
      authority: 'Universal Feature Contract Intelligence',
      consumed: true,
      fieldsUsed: ['bounded runtime UI checks', 'contract from enriched prompt'],
      fieldsIgnored: ['full universal validation plan execution'],
      fieldsUnsupported: ['complete Playwright CRUD workflow suite'],
      detail: `Registered assessment passed=${universalAssessment.passed} score=${universalAssessment.scores.overallFeatureRealityScore}`,
    });
  } else {
    entries.push({
      readOnly: true,
      authority: 'Universal Feature Contract Intelligence',
      consumed: false,
      fieldsUsed: [],
      fieldsIgnored: [],
      fieldsUnsupported: ['Playwright runtime required for universal feature contract validation'],
      detail: visualRuntime.playwrightUnsupportedReason ?? 'Playwright unavailable — not faking pass',
    });
  }

  const buildReality = workspacePath
    ? buildBuildRealityEvidenceFromWorkspace({
        npmInstallOk: true,
        npmBuildOk: bundle.buildMaterialization.npmBuildOk,
        devServerOk: visualRuntime.devServerOk || bundle.buildMaterialization.previewArtifactExists,
        workspacePresent: true,
      })
    : null;

  const launchPrerequisitesBeforeAfla = deriveLaunchPrerequisitesFromRegisteredAssessments();

  const uvlBeforeAfla = assessUvlMaturity({
    profile: bundle.profile,
    productPrompt: bundle.enrichedRequirements.enrichedPrompt,
    projectRootDir: input.projectRootDir,
    workspaceDir: workspacePath,
    buildProofHandoff: bundle.materializationHandoff,
  });

  const aflaAssessment = runAutonomousFounderLaunchAuthority({
    workspaceDir: workspacePath,
    buildReality: buildReality ?? undefined,
    contractId,
    productName: bundle.productName,
    projectRootDir: input.projectRootDir,
    productPrompt: bundle.enrichedRequirements.enrichedPrompt,
    profile: bundle.profile,
    useRegisteredProductArchitecture: true,
    useRegisteredVerificationHub: true,
    skipAutofix: true,
  });
  entries.push({
    readOnly: true,
    authority: 'Autonomous Founder Launch Authority (AFLA)',
    consumed: true,
    fieldsUsed: [
      'workspaceDir',
      'buildReality from materialization + dev server',
      'registerSourceDerivedProductArchitectureAssessment',
      'registered visual/feature/engineering assessments',
      'UVL hub assessment before AFLA (useRegisteredVerificationHub)',
      'blockingRules trace',
    ],
    fieldsIgnored: [],
    fieldsUnsupported: [],
    detail: `AFLA verdict=${aflaAssessment.verdict} score=${aflaAssessment.scores.overallFounderScore} blockers=${aflaAssessment.blockingRules.join('; ') || 'none'}`,
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
      'visual-runtime-evidence',
      'getLastCqiMaturityAssessment',
      'getLastFeatureRealityAssessment',
      'getLastBlueprintVisualAssessment',
      'getLastEngineeringRealityAssessment',
      'getLastUniversalFeatureContractAssessment',
      'getLastAutonomousFounderLaunchAssessment',
    ],
    fieldsIgnored: [],
    fieldsUnsupported: [],
    detail: `UVL coverage=${uvlAfterHandoff.overallCoveragePercent}% confidence=${uvlAfterHandoff.verificationConfidenceScore} criticalGaps=${uvlAfterHandoff.verificationGapReport.criticalGapCount}`,
  });

  const founderEvidenceAfterHandoff = collectFounderLaunchEvidence({
    projectRootDir: input.projectRootDir,
    workspaceDir: workspacePath,
    buildReality,
    productPrompt: bundle.enrichedRequirements.enrichedPrompt,
    profile: bundle.profile,
    synthesizeLaunchReadiness: true,
    useRegisteredProductArchitecture: true,
    useRegisteredVerificationHub: true,
  });
  entries.push({
    readOnly: true,
    authority: 'Founder Launch Readiness (evidence collector)',
    consumed: true,
    fieldsUsed: [
      'workspaceDir',
      'buildReality',
      'productPrompt enriched',
      'registered feature/visual/engineering/universal contract assessments',
      'visual-runtime-evidence',
    ],
    fieldsIgnored: [],
    fieldsUnsupported: [],
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
    uvlBeforeAfla,
    launchPrerequisitesBeforeAfla,
    founderEvidenceAfterHandoff,
    blueprintVisualScore: visualAssessment.scores.overallBlueprintScore,
    blueprintVisualPassed: visualAssessment.passed,
    blueprintVisualVerdict: visualAssessment.verdict,
    universalFeaturePassed,
    universalFeatureScore,
    universalFeatureVerdict,
    productArchitectureBefore,
    productArchitectureAfter,
  };
}

export function previewArtifactPath(workspacePath: string | null): string | null {
  if (!workspacePath) return null;
  const distIndex = join(workspacePath, 'dist', 'index.html');
  return existsSync(distIndex) ? distIndex : null;
}
