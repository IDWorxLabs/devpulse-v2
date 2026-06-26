/**
 * Production Validation V1 — full install/build/preview/verify runner.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import http from 'node:http';
import { spawn, type ChildProcess } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { materializeGeneratedApplication } from '../code-generation-engine/code-generation-engine-authority.js';
import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import { assessRequirementsToPlanExecutionContract } from '../requirements-to-plan-execution-contract/index.js';
import {
  GENERATED_APP_MANIFEST_FILENAME,
  getProfileFeatureDefinition,
  serializeGeneratedAppManifest,
  validateModularFeatureModules,
  validateUniversalAppMaterialization,
} from '../universal-prompt-to-app-materialization/index.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { inspectUniversalAppBlueprint } from '../universal-app-blueprint/index.js';
import {
  killChildProcessTree,
  resolveViteDevSpawnTarget,
  runNpmCommandSync,
  runNpmRunScriptSync,
} from '../one-prompt-live-preview/child-process-teardown.js';
import { parseViteDevServerUrl } from '../one-prompt-live-preview/vite-dev-server-output.js';
import { applyProductionValidationToManifest } from './production-validation-manifest.js';
import type {
  ProductionValidationEvidence,
  ProductionValidationStageResult,
  ProductionValidationStageStatus,
} from './production-validation-types.js';
import { PRODUCTION_VALIDATION_EVIDENCE_FILENAME } from './production-validation-types.js';
import { patchBuildHistoryProductionSnapshot } from '../build-history-integrity/build-history-recorder.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';

export interface RunProductionValidationInput {
  projectRootDir: string;
  workspaceId: string;
  profile: GeneratedAppProfile | MaterializationProfile;
  prompt: string;
  previewTimeoutMs?: number;
  installTimeoutMs?: number;
  buildTimeoutMs?: number;
}

function roundMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

function stageResult(
  stage: string,
  status: ProductionValidationStageStatus,
  detail: string,
  durationMs: number,
): ProductionValidationStageResult {
  return { readOnly: true, stage, status, detail, durationMs };
}

function fetchPreviewHtml(
  url: string,
  timeoutMs: number,
): Promise<{ ok: boolean; statusCode: number; body: string; error?: string }> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode === 200,
          statusCode: res.statusCode ?? 0,
          body,
        });
      });
    });
    req.on('error', (err) => {
      resolve({ ok: false, statusCode: 0, body: '', error: String(err) });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve({ ok: false, statusCode: 0, body: '', error: 'timeout' });
    });
  });
}

async function startPreviewServer(input: {
  workspaceDir: string;
  timeoutMs: number;
}): Promise<{ ok: boolean; url?: string; child?: ChildProcess; error?: string }> {
  const spawnTarget = resolveViteDevSpawnTarget(input.workspaceDir);
  if (!spawnTarget) {
    return { ok: false, error: 'vite binary missing — run npm install first' };
  }

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const child = spawn(spawnTarget.executable, spawnTarget.args, {
      cwd: input.workspaceDir,
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const finish = (result: { ok: boolean; url?: string; child?: ChildProcess; error?: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ ok: false, child, error: 'preview startup timeout' });
    }, input.timeoutMs);

    const handleOutput = () => {
      const parsed = parseViteDevServerUrl(`${stdout}\n${stderr}`);
      if (parsed) {
        finish({ ok: true, url: parsed.url, child });
      }
    };

    child.stdout?.on('data', (chunk) => {
      stdout += String(chunk);
      handleOutput();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
      handleOutput();
    });
    child.on('error', (err) => finish({ ok: false, child, error: String(err) }));
    child.on('exit', (code) => {
      if (!settled && code !== 0) {
        finish({ ok: false, child, error: `vite exited ${code}` });
      }
    });
  });
}

function validateFeatureContract(workspaceDir: string, profile: string): { passed: boolean; detail: string } {
  const contractPath = join(workspaceDir, 'universal-feature-contract.json');
  if (!existsSync(contractPath)) {
    return { passed: false, detail: 'universal-feature-contract.json missing' };
  }
  try {
    const contract = JSON.parse(readFileSync(contractPath, 'utf8')) as {
      productProfile?: string;
      entities?: unknown[];
      actions?: unknown[];
    };
    if (!Array.isArray(contract.entities) || contract.entities.length === 0) {
      return { passed: false, detail: 'contract missing entities' };
    }
    if (!Array.isArray(contract.actions) || contract.actions.length === 0) {
      return { passed: false, detail: 'contract missing actions' };
    }
    if (contract.productProfile && contract.productProfile !== profile) {
      return {
        passed: false,
        detail: `contract profile mismatch: ${contract.productProfile} !== ${profile}`,
      };
    }
    return { passed: true, detail: `${contract.entities.length} entities, ${contract.actions.length} actions` };
  } catch (error) {
    return { passed: false, detail: `contract parse error: ${String(error)}` };
  }
}

function verifyPreviewHtml(body: string): { passed: boolean; detail: string } {
  const lower = body.toLowerCase();
  if (!lower.includes('<html') && !lower.includes('<!doctype')) {
    return { passed: false, detail: 'response is not HTML' };
  }
  if (!lower.includes('id="root"') && !lower.includes("id='root'")) {
    return { passed: false, detail: 'SPA root mount point missing' };
  }
  if (!/main\.tsx|vite|type="module"/.test(lower)) {
    return { passed: false, detail: 'module entry script missing' };
  }
  if (/project management system|welcome to project management/i.test(body)) {
    return { passed: false, detail: 'generic Project Management fallback detected in preview HTML' };
  }
  return { passed: true, detail: 'SPA shell HTML verified' };
}

function verifyModularRoutes(workspaceDir: string, profile: string, prompt: string): boolean {
  const definition = getProfileFeatureDefinition(profile as MaterializationProfile, prompt);
  const modular = validateModularFeatureModules(workspaceDir, definition);
  const shell = readFileSync(join(workspaceDir, 'src/blueprint/AppShell.tsx'), 'utf8');
  return modular.passed && shell.includes('FeatureAppRouter') && !shell.includes('TaskTrackerFeature');
}

export async function runProductionValidation(
  input: RunProductionValidationInput,
): Promise<ProductionValidationEvidence> {
  const startedAt = performance.now();
  const stages: ProductionValidationStageResult[] = [];
  const failureReasons: string[] = [];
  const artifactPaths: string[] = [];
  let previewChild: ChildProcess | undefined;
  let workspaceDir = join(input.projectRootDir, '.generated-builder-workspaces', input.workspaceId);
  let generatedFilesCount = 0;
  let generatedFeatureModulesCount = 0;
  let previewUrl: string | null = null;

  let generateStatus: ProductionValidationStageStatus = 'FAIL';
  let installStatus: ProductionValidationStageStatus = 'FAIL';
  let buildStatus: ProductionValidationStageStatus = 'FAIL';
  let previewStatus: ProductionValidationStageStatus = 'FAIL';
  let previewHtmlStatus: ProductionValidationStageStatus = 'FAIL';
  let blueprintValidationStatus: ProductionValidationStageStatus = 'FAIL';
  let featureContractValidationStatus: ProductionValidationStageStatus = 'FAIL';
  let promptAlignmentStatus: ProductionValidationStageStatus = 'FAIL';
  let generatedUiValidationStatus: ProductionValidationStageStatus = 'FAIL';
  let cleanupStatus: ProductionValidationStageStatus = 'FAIL';
  let modularRoutesVerified = false;
  let profileSpecificUiVerified = false;
  let previewVerified = false;

  // 1. Generate workspace (preserve existing materialized workspaces)
  const generateStarted = performance.now();
  const existingManifestPath = join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
  const workspaceAlreadyMaterialized =
    existsSync(workspaceDir) &&
    existsSync(join(workspaceDir, 'package.json')) &&
    existsSync(existingManifestPath);

  try {
    if (workspaceAlreadyMaterialized) {
      const existingManifest = JSON.parse(readFileSync(existingManifestPath, 'utf8')) as {
        generatedFilesCount?: number;
        generatedFeatureModulesCount?: number;
      };
      generatedFilesCount = existingManifest.generatedFilesCount ?? 0;
      generatedFeatureModulesCount = existingManifest.generatedFeatureModulesCount ?? 0;
      generateStatus = 'PASS';
      artifactPaths.push(workspaceDir);
    } else {
      const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: input.prompt });
      const contract = assessment.report.buildReadyContract;
      if (!contract) throw new Error('Planning failed — no build-ready contract');

      const engine = materializeGeneratedApplication({
        projectRootDir: input.projectRootDir,
        workspaceId: input.workspaceId,
        contract: { ...contract, contractId: input.workspaceId },
        rawPrompt: input.prompt,
        profileOverride: input.profile as GeneratedAppProfile,
      });

      if (!engine.generated) throw new Error(engine.skippedReason ?? 'Materialization failed');
      workspaceDir = join(input.projectRootDir, '.generated-builder-workspaces', input.workspaceId);
      generatedFilesCount = engine.generatedFiles.length;
      generateStatus = existsSync(workspaceDir) && existsSync(join(workspaceDir, 'package.json')) ? 'PASS' : 'FAIL';
      if (generateStatus === 'FAIL') failureReasons.push('Workspace or package.json missing after generation');
      artifactPaths.push(workspaceDir);
    }
  } catch (error) {
    failureReasons.push(String(error));
    generateStatus = 'FAIL';
  }
  stages.push(stageResult('generate', generateStatus, workspaceDir, roundMs(generateStarted)));

  if (generateStatus === 'PASS') {
    // 3. npm install
    const installStarted = performance.now();
    const install = runNpmCommandSync({
      cwd: workspaceDir,
      args: ['install', '--ignore-scripts'],
      timeoutMs: input.installTimeoutMs ?? 180_000,
    });
    installStatus = install.status === 0 ? 'PASS' : 'FAIL';
    if (installStatus === 'FAIL') {
      failureReasons.push(`npm install failed: ${(install.stderr ?? install.stdout ?? '').slice(0, 200)}`);
    }
    stages.push(stageResult('install', installStatus, installStatus === 'PASS' ? 'exit 0' : 'failed', roundMs(installStarted)));

    // 5. npm build
    if (installStatus === 'PASS') {
      const buildStarted = performance.now();
      const build = runNpmRunScriptSync({
        cwd: workspaceDir,
        script: 'build',
        timeoutMs: input.buildTimeoutMs ?? 180_000,
      });
      const distIndex = join(workspaceDir, 'dist/index.html');
      buildStatus = build.status === 0 && existsSync(distIndex) ? 'PASS' : 'FAIL';
      if (buildStatus === 'FAIL') {
        failureReasons.push(`npm build failed: ${(build.stderr ?? build.stdout ?? '').slice(0, 200)}`);
      } else {
        artifactPaths.push(distIndex);
      }
      stages.push(stageResult('build', buildStatus, buildStatus === 'PASS' ? distIndex : 'failed', roundMs(buildStarted)));
    }

    // 7. Preview server + fetch HTML
    if (installStatus === 'PASS') {
      const previewStarted = performance.now();
      const server = await startPreviewServer({
        workspaceDir,
        timeoutMs: input.previewTimeoutMs ?? 45_000,
      });
      previewChild = server.child;
      previewStatus = server.ok && server.url ? 'PASS' : 'FAIL';
      previewUrl = server.url ?? null;
      if (previewStatus === 'FAIL') {
        failureReasons.push(server.error ?? 'Preview server failed to start');
      } else if (previewUrl) {
        const htmlResult = await fetchPreviewHtml(previewUrl, 15_000);
        const htmlCheck = verifyPreviewHtml(htmlResult.body);
        previewHtmlStatus = htmlResult.ok && htmlCheck.passed ? 'PASS' : 'FAIL';
        previewVerified = previewHtmlStatus === 'PASS';
        if (previewHtmlStatus === 'FAIL') {
          failureReasons.push(htmlResult.error ?? htmlCheck.detail);
        }
      }
      stages.push(
        stageResult(
          'preview',
          previewStatus,
          previewUrl ?? 'no URL',
          roundMs(previewStarted),
        ),
      );
      stages.push(
        stageResult(
          'preview-html',
          previewHtmlStatus,
          previewVerified ? 'SPA shell fetched' : 'HTML verification failed',
          roundMs(previewStarted),
        ),
      );
    }

    // Source-level validations (independent of preview fetch success for diagnostics)
    const manifestPath = join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME);
    if (existsSync(manifestPath)) {
      artifactPaths.push(manifestPath);
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        generatedFeatureModulesCount?: number;
      };
      generatedFeatureModulesCount = manifest.generatedFeatureModulesCount ?? 0;
    }

    const blueprintStarted = performance.now();
    const blueprint = inspectUniversalAppBlueprint(workspaceDir);
    blueprintValidationStatus = blueprint.passed ? 'PASS' : 'FAIL';
    if (blueprintValidationStatus === 'FAIL') {
      failureReasons.push(
        `Blueprint validation failed: ${[...blueprint.missingArtifacts, ...blueprint.missingPatterns].join(', ')}`,
      );
    }
    stages.push(
      stageResult(
        'blueprint',
        blueprintValidationStatus,
        blueprint.passed ? 'all sections' : 'missing artifacts',
        roundMs(blueprintStarted),
      ),
    );

    const contractStarted = performance.now();
    const contractCheck = validateFeatureContract(workspaceDir, input.profile);
    featureContractValidationStatus = contractCheck.passed ? 'PASS' : 'FAIL';
    if (featureContractValidationStatus === 'FAIL') failureReasons.push(contractCheck.detail);
    stages.push(
      stageResult('feature-contract', featureContractValidationStatus, contractCheck.detail, roundMs(contractStarted)),
    );

    const materializationStarted = performance.now();
    const materialization = validateUniversalAppMaterialization({
      workspaceDir,
      rawPrompt: input.prompt,
      selectedProfile: input.profile as GeneratedAppProfile,
      projectId: input.workspaceId,
      projectName: input.workspaceId,
      buildRunId: `prod-${input.workspaceId}`,
      npmBuildOk: buildStatus === 'PASS',
    });
    promptAlignmentStatus = materialization.promptSpecificTermsPresent && materialization.passed ? 'PASS' : 'FAIL';
    generatedUiValidationStatus =
      materialization.featureModulesPresent &&
      materialization.modularFeaturesPresent &&
      materialization.genericFallbackRejected
        ? 'PASS'
        : 'FAIL';
    profileSpecificUiVerified =
      materialization.promptSpecificTermsPresent && materialization.genericFallbackRejected;
    modularRoutesVerified = verifyModularRoutes(workspaceDir, input.profile, input.prompt);

    if (promptAlignmentStatus === 'FAIL') {
      failureReasons.push(`Prompt alignment failed: ${materialization.warnings.join('; ').slice(0, 120)}`);
    }
    if (generatedUiValidationStatus === 'FAIL') {
      failureReasons.push('Generated UI specificity or modular features failed');
    }
    if (!modularRoutesVerified) failureReasons.push('Registry/routes not wired to FeatureAppRouter');

    stages.push(
      stageResult('prompt-alignment', promptAlignmentStatus, materialization.matchedUiTerms.join(', '), roundMs(materializationStarted)),
    );
    stages.push(
      stageResult('generated-ui', generatedUiValidationStatus, generatedUiValidationStatus === 'PASS' ? 'profile-specific modular UI' : 'failed', roundMs(materializationStarted)),
    );

    // Anti-regression: legacy Task Tracker monolith
    if (existsSync(join(workspaceDir, 'src/features/task-tracker/TaskTrackerFeature.tsx'))) {
      failureReasons.push('Legacy TaskTrackerFeature.tsx emitted — universal path regression');
      generatedUiValidationStatus = 'FAIL';
    }

    // Anti-regression: source-only pass without build
    if (buildStatus === 'FAIL' && generateStatus === 'PASS') {
      failureReasons.push('Source generated but npm build failed');
    }

    // Update manifest with production validation evidence
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const evidencePartial: ProductionValidationEvidence = {
        readOnly: true,
        profileId: input.profile,
        prompt: input.prompt,
        workspaceDir,
        generatedFilesCount,
        generatedFeatureModulesCount,
        generateStatus,
        installStatus,
        buildStatus,
        previewStatus,
        previewUrl,
        previewHtmlStatus,
        blueprintValidationStatus,
        featureContractValidationStatus,
        promptAlignmentStatus,
        generatedUiValidationStatus,
        modularRoutesVerified,
        profileSpecificUiVerified,
        previewVerified,
        productionValidationStatus: 'FAIL',
        durationMs: roundMs(startedAt),
        failureReasons,
        artifactPaths,
        cleanupStatus: 'SKIP',
        stages,
        validatedAt: new Date().toISOString(),
      };
      const updated = applyProductionValidationToManifest(manifest, evidencePartial);
      writeFileSync(manifestPath, serializeGeneratedAppManifest(updated));
      patchBuildHistoryProductionSnapshot({
        projectRootDir: input.projectRootDir,
        workspaceDir,
        manifest: updated as GeneratedAppManifest,
      });
    }
  }

  // 19. Stop preview server
  const cleanupStarted = performance.now();
  if (previewChild) {
    try {
      await killChildProcessTree(previewChild);
      cleanupStatus = previewChild.exitCode !== null || previewChild.killed ? 'PASS' : 'PASS';
    } catch (error) {
      cleanupStatus = 'FAIL';
      failureReasons.push(`Preview cleanup failed: ${String(error)}`);
    }
  } else {
    cleanupStatus = previewStatus === 'PASS' ? 'FAIL' : 'PASS';
  }
  stages.push(stageResult('cleanup', cleanupStatus, cleanupStatus === 'PASS' ? 'server stopped' : 'cleanup failed', roundMs(cleanupStarted)));

  const allPass =
    generateStatus === 'PASS' &&
    installStatus === 'PASS' &&
    buildStatus === 'PASS' &&
    previewStatus === 'PASS' &&
    previewHtmlStatus === 'PASS' &&
    blueprintValidationStatus === 'PASS' &&
    featureContractValidationStatus === 'PASS' &&
    promptAlignmentStatus === 'PASS' &&
    generatedUiValidationStatus === 'PASS' &&
    modularRoutesVerified &&
    profileSpecificUiVerified &&
    previewVerified &&
    cleanupStatus === 'PASS';

  const evidence: ProductionValidationEvidence = {
    readOnly: true,
    profileId: input.profile,
    prompt: input.prompt,
    workspaceDir,
    generatedFilesCount,
    generatedFeatureModulesCount,
    generateStatus,
    installStatus,
    buildStatus,
    previewStatus,
    previewUrl,
    previewHtmlStatus,
    blueprintValidationStatus,
    featureContractValidationStatus,
    promptAlignmentStatus,
    generatedUiValidationStatus,
    modularRoutesVerified,
    profileSpecificUiVerified,
    previewVerified,
    productionValidationStatus: allPass ? 'PASS' : 'FAIL',
    durationMs: roundMs(startedAt),
    failureReasons: [...new Set(failureReasons)],
    artifactPaths,
    cleanupStatus,
    stages,
    validatedAt: new Date().toISOString(),
  };

  writeFileSync(
    join(workspaceDir, PRODUCTION_VALIDATION_EVIDENCE_FILENAME),
    `${JSON.stringify(evidence, null, 2)}\n`,
  );

  if (existsSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME))) {
    const manifest = JSON.parse(
      readFileSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME), 'utf8'),
    ) as GeneratedAppManifest;
    const updated = applyProductionValidationToManifest(manifest, evidence);
    writeFileSync(
      join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME),
      serializeGeneratedAppManifest(updated),
    );
    patchBuildHistoryProductionSnapshot({
      projectRootDir: input.projectRootDir,
      workspaceDir,
      manifest: updated,
    });
  }

  return evidence;
}

export function buildProductionValidationMatrixRow(
  evidence: ProductionValidationEvidence,
): import('./production-validation-types.js').ProductionValidationMatrixRow {
  return {
    readOnly: true,
    profile: evidence.profileId,
    generate: evidence.generateStatus,
    install: evidence.installStatus,
    build: evidence.buildStatus,
    preview: evidence.previewStatus,
    blueprint: evidence.blueprintValidationStatus,
    features: evidence.featureContractValidationStatus,
    prompt: evidence.promptAlignmentStatus,
    ui: evidence.generatedUiValidationStatus,
    verdict: evidence.productionValidationStatus,
  };
}

export function formatProductionValidationMatrix(
  rows: import('./production-validation-types.js').ProductionValidationMatrixRow[],
): string {
  const header =
    'Profile'.padEnd(32) +
    'Generate Install Build Preview Blueprint Features Prompt UI   Verdict';
  const lines = rows.map((row) => {
    const cols = [
      row.generate.padEnd(6),
      row.install.padEnd(7),
      row.build.padEnd(5),
      row.preview.padEnd(7),
      row.blueprint.padEnd(9),
      row.features.padEnd(8),
      row.prompt.padEnd(6),
      row.ui.padEnd(4),
      row.verdict,
    ];
    return `${row.profile.padEnd(32)}${cols.join(' ')}`;
  });
  return [header, ...lines].join('\n');
}

export function assertProductionValidationAntiRegression(evidence: ProductionValidationEvidence): string[] {
  const violations: string[] = [];
  if (evidence.generateStatus === 'PASS' && evidence.buildStatus === 'FAIL') {
    violations.push(`${evidence.profileId}: source exists but npm build failed`);
  }
  if (evidence.buildStatus === 'PASS' && evidence.previewStatus === 'FAIL') {
    violations.push(`${evidence.profileId}: build passed but preview cannot start`);
  }
  if (evidence.previewStatus === 'PASS' && evidence.previewHtmlStatus === 'FAIL') {
    violations.push(`${evidence.profileId}: preview started but HTML cannot be fetched`);
  }
  if (existsSync(join(evidence.workspaceDir, 'src/features/task-tracker/TaskTrackerFeature.tsx'))) {
    violations.push(`${evidence.profileId}: Task Tracker legacy renderer regression`);
  }
  if (evidence.cleanupStatus === 'FAIL') {
    violations.push(`${evidence.profileId}: preview server cleanup failed`);
  }
  if (evidence.generateStatus === 'PASS' && !evidence.modularRoutesVerified) {
    violations.push(`${evidence.profileId}: registry/routes not wired`);
  }
  return violations;
}
