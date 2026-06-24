/**
 * General-Purpose Code Generation V1 — per-domain generation runner.
 */

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assessCqiMaturity } from '../clarifying-question-intelligence/index.js';
import { materializeGeneratedApplication } from '../code-generation-engine/index.js';
import { materializeBuildProofGapArtifacts } from '../connected-build-execution/index.js';
import { assessRequirementsToPlanExecutionContract } from '../requirements-to-plan-execution-contract/index.js';
import { assessUvlMaturity } from '../unified-verification-lab/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import { analyzeWorkspaceProductionSignals } from '../production-readiness-gate-v1/workspace-production-checks.js';
import type { GeneralPurposeProofSuiteEntry } from './general-purpose-code-generation-v1-suite-registry.js';
import { GENERAL_PURPOSE_WORKSPACE_PREFIX } from './general-purpose-code-generation-v1-bounds.js';
import {
  buildDomainLogicReport,
  buildGeneralPurposeAppModel,
  buildRoleContract,
  buildWorkflowContract,
} from './general-purpose-app-model-builder.js';
import { validateGeneralPurposeDomain } from './general-purpose-domain-validator.js';
import { assessGeneralPurposeAfla } from './general-purpose-afla-integration.js';
import { assessGeneralPurposeProductArchitecture } from './general-purpose-pai-integration.js';
import { writeGeneralPurposeExtensions } from './general-purpose-extension-writer.js';
import type { GeneralPurposeDomainResult } from './general-purpose-code-generation-v1-types.js';

function workspaceIdForProfile(profile: string): string {
  return `${GENERAL_PURPOSE_WORKSPACE_PREFIX}-${profile.toLowerCase().replace(/_/g, '-')}`;
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
  previewFeatureOk: boolean;
  buildOutputPath: string | null;
} {
  const distIndex = join(workspaceDir, 'dist', 'index.html');
  if (!existsSync(distIndex)) {
    return { previewHtmlOk: false, previewShellOk: false, previewFeatureOk: false, buildOutputPath: null };
  }
  const html = readFileSync(distIndex, 'utf8');
  const hasRoot = /id=["']root["']|id=["']app["']/i.test(html);
  const hasScript = /<script[^>]+src=/i.test(html);
  const assetsDir = join(workspaceDir, 'dist', 'assets');
  const hasAssets =
    existsSync(assetsDir) && readdirSync(assetsDir).some((name) => name.endsWith('.js'));
  const srcApp = join(workspaceDir, 'src', 'App.tsx');
  const appSource = existsSync(srcApp) ? readFileSync(srcApp, 'utf8') : '';
  const hasFeatureMount = /feature|task|crm|inventory|project|student|entity|marketplace|gpcg/i.test(
    appSource,
  );

  return {
    previewHtmlOk: html.length > 100 && hasRoot && hasScript,
    previewShellOk: hasRoot && hasAssets,
    previewFeatureOk: hasFeatureMount,
    buildOutputPath: distIndex,
  };
}

function computeProductionScore(workspaceDir: string, buildSuccess: boolean, previewSuccess: boolean): number {
  const signals = analyzeWorkspaceProductionSignals(workspaceDir);
  let score = 0;
  if (buildSuccess) score += 35;
  if (previewSuccess) score += 25;
  if (signals.hasBuildOutput) score += 15;
  if (signals.hasBuildScript) score += 10;
  if (signals.hasModularStructure) score += 10;
  if (existsSync(join(workspaceDir, 'src', 'gpcg', 'GeneralPurposeManifest.json'))) score += 5;
  return Math.min(100, score);
}

export function runGeneralPurposeGenerationForDomain(input: {
  suiteEntry: GeneralPurposeProofSuiteEntry;
  projectRootDir: string;
  runNpmBuild?: boolean;
}): GeneralPurposeDomainResult {
  const runNpmBuild = input.runNpmBuild !== false;
  const workspaceId = workspaceIdForProfile(input.suiteEntry.profile);
  const workspacePath = join(input.projectRootDir, GENERATED_BUILDER_WORKSPACES_DIR, workspaceId);

  const appModel = buildGeneralPurposeAppModel({ suiteEntry: input.suiteEntry });
  const workflowContract = buildWorkflowContract(appModel);
  const roleContract = buildRoleContract(appModel);
  void buildDomainLogicReport(appModel);

  void assessCqiMaturity({ userPrompt: input.suiteEntry.prompt });
  const planning = assessRequirementsToPlanExecutionContract({ rawPrompt: input.suiteEntry.prompt });
  const contract = planning.report.buildReadyContract;

  let generatedFiles: string[] = [];
  let generated = false;

  if (contract) {
    const workspaceContract = { ...contract, contractId: workspaceId };
    materializeBuildProofGapArtifacts({
      projectRootDir: input.projectRootDir,
      contract: workspaceContract,
      rawPrompt: input.suiteEntry.prompt,
    });
    const codegen = materializeGeneratedApplication({
      projectRootDir: input.projectRootDir,
      workspaceId,
      contract: workspaceContract,
      rawPrompt: input.suiteEntry.prompt,
      profileOverride: input.suiteEntry.codegenProfile,
    });
    generatedFiles = [...codegen.generatedFiles];
    generated = codegen.generated && generatedFiles.length > 0;

    if (generated && existsSync(workspacePath)) {
      const extensionFiles = writeGeneralPurposeExtensions({ workspaceDir: workspacePath, model: appModel });
      generatedFiles = [...generatedFiles, ...extensionFiles];
    }
  }

  let npmInstallOk = false;
  let npmBuildOk = false;
  if (runNpmBuild && generated && existsSync(join(workspacePath, 'package.json'))) {
    npmInstallOk = runNpmCommand(workspacePath, 'npm install --ignore-scripts', 120_000);
    npmBuildOk = npmInstallOk && runNpmCommand(workspacePath, 'npm run build', 120_000);
  }

  const preview = validatePreviewProof(workspacePath);
  const buildSuccess =
    generated && (!runNpmBuild || (npmInstallOk && npmBuildOk && Boolean(preview.buildOutputPath)));
  const previewSuccess = preview.previewHtmlOk && preview.previewShellOk && preview.previewFeatureOk;

  const domainValidation = generated
    ? validateGeneralPurposeDomain({ workspaceDir: workspacePath, model: appModel })
    : {
        workflowValidationPassed: false,
        roleCoveragePassed: false,
        domainLogicPassed: false,
      };

  void assessUvlMaturity({
    profile: input.suiteEntry.profile,
    productPrompt: input.suiteEntry.prompt,
    projectRootDir: input.projectRootDir,
    workspaceDir: generated ? workspacePath : null,
  });

  const pai = assessGeneralPurposeProductArchitecture({
    model: appModel,
    workspaceDir: generated ? workspacePath : null,
    buildSuccess,
    previewSuccess,
  });

  const afla = generated
    ? assessGeneralPurposeAfla({
        workspaceDir: workspacePath,
        productName: input.suiteEntry.productName,
        strategy: input.suiteEntry.strategy,
        workflowValidationPassed: domainValidation.workflowValidationPassed,
        roleCoveragePassed: domainValidation.roleCoveragePassed,
        domainLogicPassed: domainValidation.domainLogicPassed,
        npmInstallOk,
        npmBuildOk,
        previewSuccess,
      })
    : {
        aflaReviewPassed: false,
        aflaScore: 0,
        crudOnlyPenalty: 0,
        blockers: ['Generation failed'] as readonly string[],
      };

  const productionReadinessScore = generated
    ? computeProductionScore(workspacePath, buildSuccess, previewSuccess)
    : null;
  const productionReadinessPassed =
    buildSuccess &&
    previewSuccess &&
    domainValidation.workflowValidationPassed &&
    domainValidation.roleCoveragePassed &&
    (productionReadinessScore ?? 0) >= 70;

  const overallPassed =
    generated &&
    buildSuccess &&
    previewSuccess &&
    domainValidation.workflowValidationPassed &&
    domainValidation.roleCoveragePassed &&
    domainValidation.domainLogicPassed &&
    pai.paiReviewPassed &&
    afla.aflaReviewPassed &&
    productionReadinessPassed;

  void workflowContract;
  void roleContract;
  void afla.blockers;

  return {
    readOnly: true,
    profile: input.suiteEntry.profile,
    domain: input.suiteEntry.domain,
    productName: input.suiteEntry.productName,
    strategy: input.suiteEntry.strategy,
    appModel,
    workflowContract,
    roleContract,
    generated,
    buildSuccess,
    previewSuccess,
    workflowValidationPassed: domainValidation.workflowValidationPassed,
    roleCoveragePassed: domainValidation.roleCoveragePassed,
    domainLogicPassed: domainValidation.domainLogicPassed,
    paiReviewPassed: pai.paiReviewPassed,
    aflaReviewPassed: afla.aflaReviewPassed,
    productionReadinessPassed,
    productionReadinessScore,
    overallPassed,
    generatedFiles,
    workspacePath: generated ? workspacePath : null,
  };
}
