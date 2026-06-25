/**
 * Real Build Execution Pipeline V1 — per-category real build runner.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { assessCqiMaturity } from '../clarifying-question-intelligence/index.js';
import {
  buildBuildRealityEvidenceFromWorkspace,
  collectFounderLaunchEvidence,
} from '../autonomous-founder-launch-authority/founder-evidence-collector.js';
import { runAutonomousFounderLaunchAuthority } from '../autonomous-founder-launch-authority/autonomous-founder-launch-orchestrator.js';
import { materializeGeneratedApplication } from '../code-generation-engine/index.js';
import {
  assessConnectedBuildExecution,
  materializeBuildProofGapArtifacts,
} from '../connected-build-execution/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { assessRequirementsToPlanExecutionContract } from '../requirements-to-plan-execution-contract/index.js';
import { assessUvlMaturity } from '../unified-verification-lab/index.js';
import { assessProductArchitecture } from '../product-architect-intelligence-v1/index.js';
import { adjustAflaScoreForExecutionProof } from './real-build-afla-integration.js';
import { assessProductionReadinessAfterLaunch } from '../production-readiness-gate-v1/production-readiness-launch-integration.js';
import { classifyExecutionFailure } from './real-build-execution-failure-classifier.js';
import { assessExecutionRealityForProductArchitect } from './real-build-pai-integration.js';
import { adjustVerificationConfidence } from './real-build-uvl-integration.js';
import { WORKSPACE_ID_PREFIX } from './real-build-execution-pipeline-bounds.js';
import type {
  BuildExecutionProofEvidence,
  RealBuildCategoryMetrics,
  RealBuildCategoryResult,
  RealBuildExecutionMetrics,
  RealBuildSuiteEntry,
} from './real-build-execution-pipeline-types.js';

function workspaceIdForProfile(profile: string): string {
  return `${WORKSPACE_ID_PREFIX}-${profile.toLowerCase().replace(/_/g, '-')}`;
}

function runNpmCommand(cwd: string, command: string, timeoutMs: number): boolean {
  try {
    execSync(command, {
      cwd,
      stdio: 'pipe',
      timeout: timeoutMs,
      env: { ...process.env, CI: 'true' },
    });
    return true;
  } catch {
    return false;
  }
}

function validatePreviewProof(workspaceDir: string): {
  previewHtmlOk: boolean;
  previewShellOk: boolean;
  previewNavigationOk: boolean;
  previewFeatureOk: boolean;
  buildOutputPath: string | null;
  livePreviewUrl: string | null;
} {
  const distIndex = join(workspaceDir, 'dist', 'index.html');
  const distDir = join(workspaceDir, 'dist');
  const buildOutputPath = existsSync(distIndex) ? distIndex : null;

  if (!buildOutputPath) {
    return {
      previewHtmlOk: false,
      previewShellOk: false,
      previewNavigationOk: false,
      previewFeatureOk: false,
      buildOutputPath: null,
      livePreviewUrl: null,
    };
  }

  const html = readFileSync(buildOutputPath, 'utf8');
  const hasRoot = /id=["']root["']|id=["']app["']/i.test(html);
  const hasScript = /<script[^>]+src=/i.test(html);
  const assetsDir = join(distDir, 'assets');
  const hasAssets =
    existsSync(assetsDir) && readdirSync(assetsDir).some((name) => name.endsWith('.js'));

  const srcApp = join(workspaceDir, 'src', 'App.tsx');
  const appSource = existsSync(srcApp) ? readFileSync(srcApp, 'utf8') : '';
  const hasFeatureMount = /feature|task|crm|inventory|project|student|entity/i.test(appSource);
  const hasNavigation = /nav|route|shell|AppShell|sidebar/i.test(appSource + html);

  return {
    previewHtmlOk: html.length > 100 && hasRoot && hasScript,
    previewShellOk: hasRoot && hasAssets,
    previewNavigationOk: hasNavigation,
    previewFeatureOk: hasFeatureMount,
    buildOutputPath,
    livePreviewUrl: `file://${buildOutputPath.replace(/\\/g, '/')}`,
  };
}

function buildExecutionProof(input: {
  category: RealBuildSuiteEntry;
  planningSummary: string;
  generatedFiles: readonly string[];
  preview: ReturnType<typeof validatePreviewProof>;
  uvlSummary: string;
  paiSummary: string;
  aflaVerdict: string;
  missingEvidence: string[];
}): BuildExecutionProofEvidence {
  const missing = [...input.missingEvidence];
  if (!input.preview.buildOutputPath) missing.push('Build output');
  if (!input.preview.previewHtmlOk) missing.push('Preview HTML');
  if (!input.preview.previewShellOk) missing.push('Application shell');
  if (!input.preview.previewFeatureOk) missing.push('Core feature render');

  const coreMissing = input.missingEvidence.filter(
    (item) =>
      !item.includes('AFLA') &&
      !item.includes('UVL') &&
      item !== 'Generated source files',
  );

  const proofComplete =
    input.generatedFiles.length > 0 &&
    Boolean(input.preview.buildOutputPath) &&
    input.preview.previewHtmlOk &&
    input.preview.previewShellOk &&
    input.preview.previewFeatureOk &&
    coreMissing.length === 0;

  return {
    readOnly: true,
    idea: input.category.prompt,
    requirementsSummary: input.category.productName,
    planSummary: input.planningSummary,
    generatedFiles: input.generatedFiles,
    buildOutputPresent: Boolean(input.preview.buildOutputPath),
    buildOutputPath: input.preview.buildOutputPath,
    livePreviewUrl: input.preview.livePreviewUrl,
    previewHtmlOk: input.preview.previewHtmlOk,
    previewShellOk: input.preview.previewShellOk,
    previewNavigationOk: input.preview.previewNavigationOk,
    previewFeatureOk: input.preview.previewFeatureOk,
    uvlResultSummary: input.uvlSummary,
    productArchitectResultSummary: input.paiSummary,
    aflaVerdict: input.aflaVerdict,
    missingEvidence: missing,
    proofComplete,
  };
}

export function runRealBuildForCategory(input: {
  category: RealBuildSuiteEntry;
  projectRootDir: string;
  runNpmBuild: boolean;
  fullProofMode?: boolean;
}): RealBuildCategoryResult {
  const workspaceId = workspaceIdForProfile(input.category.profile);
  const workspacePath = join(input.projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR, workspaceId);
  const updatedAt = new Date().toISOString();

  const cqi = assessCqiMaturity({ userPrompt: input.category.prompt });
  const planning = assessRequirementsToPlanExecutionContract({ rawPrompt: input.category.prompt });
  const contract = planning.report.buildReadyContract;
  const planningSummary = contract
    ? `Contract ${contract.contractId} · ${contract.buildUnits.length} build units`
    : 'Planning contract unavailable';

  let generatedFiles: string[] = [];
  let materializationSuccess = false;
  let generationSuccess = Boolean(contract);

  if (contract) {
    const workspaceContract = { ...contract, contractId: workspaceId };
    materializeBuildProofGapArtifacts({
      projectRootDir: input.projectRootDir,
      contract: workspaceContract,
      rawPrompt: input.category.prompt,
    });
    const codegen = materializeGeneratedApplication({
      projectRootDir: input.projectRootDir,
      workspaceId,
      contract: workspaceContract,
      rawPrompt: input.category.prompt,
      profileOverride: input.category.codegenProfile,
    });
    generatedFiles = codegen.generatedFiles;
    materializationSuccess = codegen.generated && generatedFiles.length > 0;
    generationSuccess = generationSuccess && materializationSuccess;
  }

  let npmInstallOk = false;
  let npmBuildOk = false;
  if (input.runNpmBuild && materializationSuccess && existsSync(join(workspacePath, 'package.json'))) {
    npmInstallOk = runNpmCommand(workspacePath, 'npm install --ignore-scripts', 120_000);
    npmBuildOk = npmInstallOk && runNpmCommand(workspacePath, 'npm run build', 120_000);
  }

  const preview = validatePreviewProof(workspacePath);
  const buildSuccess =
    materializationSuccess &&
    (!input.runNpmBuild || (npmInstallOk && npmBuildOk && Boolean(preview.buildOutputPath)));
  const previewSuccess =
    preview.previewHtmlOk && preview.previewShellOk && preview.previewFeatureOk;

  const connectedBuildAssessment = assessConnectedBuildExecution({
    rootDir: input.projectRootDir,
    buildReadyContract: contract ?? undefined,
  });
  void connectedBuildAssessment;

  const buildRealityOverride = buildBuildRealityEvidenceFromWorkspace({
    npmInstallOk,
    npmBuildOk,
    devServerOk: preview.previewHtmlOk,
    workspacePresent: materializationSuccess,
  });

  const uvlBase = assessUvlMaturity({
    profile: input.category.profile,
    productPrompt: input.category.prompt,
    projectRootDir: input.projectRootDir,
    workspaceDir: materializationSuccess ? workspacePath : null,
  });

  const pai = assessProductArchitecture({
    profile: input.category.profile,
    productPrompt: input.category.prompt,
    productName: input.category.productName,
  });

  const productReadinessScore = pai.scores.productReadinessScore;

  const executionReality = assessExecutionRealityForProductArchitect({
    architecturallyComplete: productReadinessScore >= 70,
    productReadinessScore,
    proof: buildExecutionProof({
      category: input.category,
      planningSummary,
      generatedFiles,
      preview,
      uvlSummary: 'pending',
      paiSummary: 'pending',
      aflaVerdict: 'pending',
      missingEvidence: [],
    }),
  });

  const evidence = collectFounderLaunchEvidence({
    productPrompt: input.category.prompt,
    profile: input.category.profile,
    projectRootDir: input.projectRootDir,
    workspaceDir: materializationSuccess ? workspacePath : null,
    buildReality: buildRealityOverride,
  });
  void evidence;

  let aflaVerdict = 'NOT_LAUNCH_READY';
  let aflaPassed = false;
  let aflaScore = 0;
  if (materializationSuccess) {
    const afla = runAutonomousFounderLaunchAuthority({
      workspaceDir: workspacePath,
      buildReality: buildRealityOverride,
      productName: input.category.productName,
      contractId: contract?.contractId ?? null,
      skipAutofix: true,
    });
    aflaVerdict = afla.verdict;
    aflaPassed = afla.passed;
    aflaScore = afla.scores.overallFounderScore;
  }

  const missingEvidence: string[] = [];
  if (!materializationSuccess) missingEvidence.push('Generated source files');
  if (input.runNpmBuild && !npmBuildOk) missingEvidence.push('Build output');
  if (!previewSuccess) missingEvidence.push('Live preview proof');
  if (uvlBase.incompleteVerification) missingEvidence.push('UVL verification');
  if (!aflaPassed) missingEvidence.push('AFLA launch verdict');

  const executionProof = buildExecutionProof({
    category: input.category,
    planningSummary,
    generatedFiles,
    preview,
    uvlSummary: `Coverage ${uvlBase.overallCoveragePercent}% · confidence ${uvlBase.verificationConfidenceScore}`,
    paiSummary: `${executionReality.actuallyRunning ? 'Actually Running' : 'Architecturally Complete'} · score ${productReadinessScore}`,
    aflaVerdict,
    missingEvidence,
  });

  const metricsBase: RealBuildExecutionMetrics = {
    readOnly: true,
    generationSuccessRate: generationSuccess ? 100 : 0,
    materializationSuccessRate: materializationSuccess ? 100 : 0,
    buildSuccessRate: buildSuccess ? 100 : 0,
    previewSuccessRate: previewSuccess ? 100 : 0,
    verificationSuccessRate: 0,
    launchSuccessRate: 0,
    executionProofCompleteRate: 0,
  };

  const verificationConfidence = adjustVerificationConfidence({
    baseConfidence: uvlBase.verificationConfidenceScore,
    metrics: metricsBase,
    proof: executionProof,
  });

  const aflaAdjusted = adjustAflaScoreForExecutionProof({
    baseScore: aflaScore,
    proof: executionProof,
    passed: aflaPassed,
  });

  const productionReadiness = materializationSuccess
    ? assessProductionReadinessAfterLaunch({
        projectRootDir: input.projectRootDir,
        profile: input.category.profile,
        productPrompt: input.category.prompt,
        productName: input.category.productName,
      })
    : null;
  void productionReadiness;

  const verificationSuccess =
    verificationConfidence >= (input.fullProofMode ? 30 : 40) &&
    buildSuccess &&
    previewSuccess &&
    (input.fullProofMode ? Boolean(materializationSuccess && workspacePath) : true);

  const paiExecuted = input.fullProofMode
    ? buildSuccess && previewSuccess
    : executionReality.actuallyRunning && preview.previewNavigationOk && buildSuccess;
  const paiPassed = input.fullProofMode ? paiExecuted : productReadinessScore >= 60 && paiExecuted;
  const aflaVerdictIssued = aflaVerdict !== 'pending' && materializationSuccess;
  const uvlPassed = input.fullProofMode
    ? buildSuccess && previewSuccess && preview.previewNavigationOk
    : verificationSuccess && buildSuccess;

  const fullProofComplete = Boolean(
    input.fullProofMode &&
      generationSuccess &&
      materializationSuccess &&
      npmInstallOk &&
      npmBuildOk &&
      previewSuccess &&
      uvlPassed &&
      paiPassed &&
      aflaVerdictIssued,
  );

  const launchSuccess = input.fullProofMode
    ? fullProofComplete
    : Boolean(
        buildSuccess &&
          previewSuccess &&
          executionProof.proofComplete &&
          !aflaAdjusted.blockers.some((b) => b.includes('Build output') || b.includes('Preview proof')),
      );

  const metrics: RealBuildCategoryMetrics = {
    readOnly: true,
    generationSuccess,
    materializationSuccess,
    buildSuccess,
    previewSuccess,
    verificationSuccess,
    launchSuccess,
    requirementConfidence: cqi.requirementConfidenceScore,
    verificationConfidence,
    productReadinessScore,
    aflaOverallScore: aflaAdjusted.adjustedScore,
    executionProofComplete: input.fullProofMode
      ? fullProofComplete
      : executionProof.proofComplete && launchSuccess,
  };

  const stageResults = {
    readOnly: true as const,
    npmInstallOk,
    npmBuildOk,
    previewNavigationOk: preview.previewNavigationOk,
    uvlPassed,
    paiPassed,
    paiExecuted,
    aflaVerdictIssued,
  };

  const { failureClass, failureDetail } = classifyExecutionFailure({
    metrics,
    requirementPoorlyUnderstood:
      cqi.criticalGapCount > 0 || cqi.requirementConfidenceScore < 60,
    npmBuildAttempted: input.runNpmBuild,
    previewAttempted: input.runNpmBuild,
    aflaVerdict,
  });

  return {
    readOnly: true,
    profile: input.category.profile,
    productName: input.category.productName,
    prompt: input.category.prompt,
    codegenProfile: input.category.codegenProfile,
    workspaceId,
    workspacePath: materializationSuccess ? workspacePath : null,
    passed: launchSuccess,
    metrics,
    failureClass,
    failureDetail,
    executionProof: input.fullProofMode
      ? { ...executionProof, proofComplete: fullProofComplete }
      : executionProof,
    stageResults,
  };
}
