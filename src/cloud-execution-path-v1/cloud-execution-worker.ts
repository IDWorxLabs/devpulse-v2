/**
 * Cloud Execution Path V1 — cloud execution worker.
 * Reuses Real Build Execution, UVL, Product Architect, AFLA, and Production Readiness Gate.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assessCqiMaturity } from '../clarifying-question-intelligence/index.js';
import {
  buildBuildRealityEvidenceFromWorkspace,
  collectFounderLaunchEvidence,
} from '../autonomous-founder-launch-authority/founder-evidence-collector.js';
import { runAutonomousFounderLaunchAuthority } from '../autonomous-founder-launch-authority/autonomous-founder-launch-orchestrator.js';
import { materializeGeneratedApplication } from '../code-generation-engine/index.js';
import { materializeBuildProofGapArtifacts } from '../connected-build-execution/index.js';
import { assessRequirementsToPlanExecutionContract } from '../requirements-to-plan-execution-contract/index.js';
import { assessUvlMaturity } from '../unified-verification-lab/index.js';
import { assessProductArchitecture } from '../product-architect-intelligence-v1/index.js';
import { assessProductionReadinessAfterLaunch } from '../production-readiness-gate-v1/production-readiness-launch-integration.js';
import { resolveRealBuildSuiteEntry } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import type {
  CloudExecutionJob,
  CloudExecutionJobResult,
  CloudJobArtifactStatus,
} from './cloud-execution-path-v1-types.js';
import { buildCloudJobPackage } from './cloud-execution-job-lifecycle.js';
import { classifyCloudExecutionFailure } from './cloud-execution-failure-classifier.js';
import {
  completeCloudExecutionJob,
  failCloudExecutionJob,
  setJobStatus,
  updateCloudExecutionJob,
} from './cloud-execution-queue.js';
import { CLOUD_EXECUTION_JOBS_DIR } from './cloud-execution-path-v1-bounds.js';

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
  const hasFeatureMount = /feature|task|crm|inventory|project|student|entity|marketplace/i.test(appSource);

  return {
    previewHtmlOk: html.length > 100 && hasRoot && hasScript,
    previewShellOk: hasRoot && hasAssets,
    previewFeatureOk: hasFeatureMount,
    buildOutputPath: distIndex,
  };
}

function writeJobArtifact(jobDir: string, name: string, content: unknown): void {
  mkdirSync(jobDir, { recursive: true });
  const path = join(jobDir, name);
  if (typeof content === 'string') {
    writeFileSync(path, content, 'utf8');
  } else {
    writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
  }
}

function verifyContamination(
  projectRootDir: string,
  job: CloudExecutionJob,
  otherJobIds: readonly string[],
): boolean {
  const markerPath = join(job.workspaceSpec.workspacePath, '.cep-isolation-marker');
  if (!existsSync(markerPath)) return false;
  const marker = readFileSync(markerPath, 'utf8').trim();
  if (marker !== job.jobId) return false;

  for (const otherId of otherJobIds) {
    if (otherId === job.jobId) continue;
    const otherMarker = join(
      projectRootDir,
      job.workspaceSpec.workspacePath.replace(job.jobId, otherId),
      '.cep-isolation-marker',
    );
    if (existsSync(otherMarker) && readFileSync(otherMarker, 'utf8').trim() === job.jobId) {
      return false;
    }
  }
  return true;
}

export function runCloudExecutionWorker(input: {
  projectRootDir: string;
  job: CloudExecutionJob;
  workerId: string;
  otherJobIds?: readonly string[];
}): CloudExecutionJobResult {
  const start = Date.now();
  const suite = resolveRealBuildSuiteEntry(input.job.requirementsSnapshot.profile);
  const workspaceId = input.job.workspaceSpec.workspaceId;
  const workspacePath = input.job.workspaceSpec.workspacePath;
  const jobDir = join(input.projectRootDir, CLOUD_EXECUTION_JOBS_DIR, input.job.jobId);
  const buildLogs: string[] = [];

  let job = setJobStatus(input.job, 'PREPARING', 'PREPARING');
  updateCloudExecutionJob(input.projectRootDir, job);

  try {
    mkdirSync(workspacePath, { recursive: true });
    writeFileSync(
      join(workspacePath, '.cep-isolation-marker'),
      input.job.jobId,
      'utf8',
    );
    writeFileSync(
      join(workspacePath, '.cep-project-id'),
      input.job.projectId,
      'utf8',
    );

    const planning = assessRequirementsToPlanExecutionContract({ rawPrompt: suite.prompt });
    const contract = planning.report.buildReadyContract;
    if (!contract) {
      throw new Error('Materialization failure: planning contract unavailable');
    }

    const workspaceContract = { ...contract, contractId: workspaceId };
    materializeBuildProofGapArtifacts({
      projectRootDir: input.projectRootDir,
      contract: workspaceContract,
      rawPrompt: suite.prompt,
    });

    job = setJobStatus(job, 'BUILDING', 'BUILDING');
    updateCloudExecutionJob(input.projectRootDir, job);

    const codegen = materializeGeneratedApplication({
      projectRootDir: input.projectRootDir,
      workspaceId,
      contract: workspaceContract,
      rawPrompt: suite.prompt,
      profileOverride: suite.codegenProfile,
    });
    buildLogs.push(`Generated ${codegen.generatedFiles.length} files`);

    if (!codegen.generated || codegen.generatedFiles.length === 0) {
      throw new Error('Materialization failure: no generated files');
    }

    writeJobArtifact(jobDir, 'generated-source-manifest.json', {
      readOnly: true,
      files: codegen.generatedFiles,
      workspaceId,
      isolationToken: input.job.jobId,
    });

    let npmInstallOk = false;
    let npmBuildOk = false;
    if (existsSync(join(workspacePath, 'package.json'))) {
      buildLogs.push('Running npm install…');
      npmInstallOk = runNpmCommand(workspacePath, 'npm install --ignore-scripts', 120_000);
      if (npmInstallOk) {
        buildLogs.push('Running npm run build…');
        npmBuildOk = runNpmCommand(workspacePath, 'npm run build', 120_000);
      }
    }

    if (!npmBuildOk) {
      throw new Error('Build failure: npm build did not succeed');
    }

    writeJobArtifact(jobDir, 'build-logs.txt', buildLogs.join('\n'));

    job = setJobStatus(job, 'PREVIEWING', 'PREVIEWING');
    updateCloudExecutionJob(input.projectRootDir, job);

    const preview = validatePreviewProof(workspacePath);
    if (!preview.previewHtmlOk || !preview.buildOutputPath) {
      throw new Error('Preview failure: dist/index.html not valid');
    }

    writeJobArtifact(jobDir, 'preview-proof.json', {
      readOnly: true,
      ...preview,
      passed: preview.previewHtmlOk && preview.previewShellOk && preview.previewFeatureOk,
    });

    job = setJobStatus(job, 'VERIFYING', 'VERIFYING');
    updateCloudExecutionJob(input.projectRootDir, job);

    const uvl = assessUvlMaturity({
      profile: suite.profile,
      productPrompt: suite.prompt,
      projectRootDir: input.projectRootDir,
      workspaceDir: workspacePath,
    });
    writeJobArtifact(jobDir, 'uvl-verification-proof.json', {
      readOnly: true,
      coveragePercent: uvl.overallCoveragePercent,
      confidenceScore: uvl.verificationConfidenceScore,
      passed: uvl.overallCoveragePercent >= 40,
    });

    job = setJobStatus(job, 'REVIEWING', 'REVIEWING');
    updateCloudExecutionJob(input.projectRootDir, job);

    const pai = assessProductArchitecture({
      profile: suite.profile,
      productPrompt: suite.prompt,
      productName: suite.productName,
    });
    writeJobArtifact(jobDir, 'product-architect-proof.json', {
      readOnly: true,
      productReadinessScore: pai.productReadinessScore,
      passed: pai.productReadinessScore >= 60,
    });

    const buildRealityOverride = buildBuildRealityEvidenceFromWorkspace({
      npmInstallOk,
      npmBuildOk,
      devServerOk: preview.previewHtmlOk,
      workspacePresent: true,
    });

    const afla = runAutonomousFounderLaunchAuthority({
      workspaceDir: workspacePath,
      buildReality: buildRealityOverride,
      productName: suite.productName,
      skipAutofix: true,
    });
    writeJobArtifact(jobDir, 'afla-verdict.json', {
      readOnly: true,
      verdict: afla.verdict,
      score: afla.scores.overallFounderScore,
      passed: afla.passed,
    });

    job = setJobStatus(job, 'PRODUCTION_CHECK', 'PRODUCTION_CHECK');
    updateCloudExecutionJob(input.projectRootDir, job);

    const prg = assessProductionReadinessAfterLaunch({
      projectRootDir: input.projectRootDir,
      profile: suite.profile,
      productPrompt: suite.prompt,
      productName: suite.productName,
    });
    writeJobArtifact(jobDir, 'production-readiness-result.json', {
      readOnly: true,
      score: prg.productionReadinessScore,
      verdict: prg.productionVerdict,
      passed: !prg.blocksProductionDeployment,
    });

    const cloudJobPackage = buildCloudJobPackage(job);
    writeJobArtifact(jobDir, 'cloud-job-package.json', cloudJobPackage);

    const executionSummary = {
      readOnly: true,
      jobId: input.job.jobId,
      profile: suite.profile,
      executionMode: input.job.executionMode,
      buildProof: npmBuildOk,
      previewProof: preview.previewHtmlOk,
      verificationProof: uvl.overallCoveragePercent >= 40,
      aflaVerdict: afla.verdict,
      productionReadinessScore: prg.productionReadinessScore,
      runtimeDurationMs: Date.now() - start,
    };
    writeJobArtifact(jobDir, 'execution-summary.json', executionSummary);

    const artifactStatus: CloudJobArtifactStatus = {
      readOnly: true,
      sourceManifest: true,
      buildLogs: true,
      previewProof: true,
      uvlVerificationProof: true,
      productArchitectProof: true,
      aflaVerdict: true,
      productionReadinessResult: true,
      executionSummary: true,
      cloudJobPackage: true,
    };

    const contaminationCheckPassed = verifyContamination(
      input.projectRootDir,
      input.job,
      input.otherJobIds ?? [],
    );

    const completedJob = completeCloudExecutionJob(input.projectRootDir, {
      ...job,
      runtimeDurationMs: Date.now() - start,
      workerId: input.workerId,
    });

    return {
      readOnly: true,
      job: completedJob,
      passed: npmBuildOk && preview.previewHtmlOk && contaminationCheckPassed,
      failureReport: null,
      artifactStatus,
      cloudJobPackage,
      buildProof: npmBuildOk,
      previewProof: preview.previewHtmlOk,
      verificationProof: uvl.overallCoveragePercent >= 40,
      aflaVerdict: afla.verdict,
      productionReadinessScore: prg.productionReadinessScore,
      productionReadinessVerdict: prg.productionVerdict,
      executionSummary: `Cloud execution completed for ${suite.productName} in ${Date.now() - start}ms`,
      contaminationCheckPassed,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const failureReport = classifyCloudExecutionFailure({
      jobId: input.job.jobId,
      stage: job.status,
      detail,
    });
    writeJobArtifact(jobDir, 'failure-report.json', failureReport);
    failCloudExecutionJob(input.projectRootDir, {
      ...job,
      runtimeDurationMs: Date.now() - start,
      workerId: input.workerId,
    });

    return {
      readOnly: true,
      job: { ...job, status: 'FAILED' },
      passed: false,
      failureReport,
      artifactStatus: {
        readOnly: true,
        sourceManifest: existsSync(join(jobDir, 'generated-source-manifest.json')),
        buildLogs: existsSync(join(jobDir, 'build-logs.txt')),
        previewProof: existsSync(join(jobDir, 'preview-proof.json')),
        uvlVerificationProof: existsSync(join(jobDir, 'uvl-verification-proof.json')),
        productArchitectProof: existsSync(join(jobDir, 'product-architect-proof.json')),
        aflaVerdict: existsSync(join(jobDir, 'afla-verdict.json')),
        productionReadinessResult: existsSync(join(jobDir, 'production-readiness-result.json')),
        executionSummary: existsSync(join(jobDir, 'execution-summary.json')),
        cloudJobPackage: existsSync(join(jobDir, 'cloud-job-package.json')),
      },
      cloudJobPackage: null,
      buildProof: false,
      previewProof: false,
      verificationProof: false,
      aflaVerdict: null,
      productionReadinessScore: null,
      productionReadinessVerdict: null,
      executionSummary: detail,
      contaminationCheckPassed: false,
    };
  }
}
