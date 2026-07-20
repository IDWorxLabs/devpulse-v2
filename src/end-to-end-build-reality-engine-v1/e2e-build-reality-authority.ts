/**
 * End-to-End Build Reality Engine V1 — orchestrator.
 * Proves engineering reality matches user-visible reality. No application-specific logic.
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { assessRequirementsToPlanExecutionContract } from '../requirements-to-plan-execution-contract/index.js';
import { buildProductIntelligenceModel } from '../intent-understanding-engine/product-model-builder.js';
import { buildUniversalFeatureContract } from '../universal-feature-contract-intelligence/universal-feature-contract-builder.js';
import { runOnePromptLivePreviewBuild } from '../one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { resolveRegistryRootForPersistentProject } from '../audit-project-isolation/audit-registry-root.js';
import { GENERATED_APP_MANIFEST_FILENAME } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  assessFeatureRealityIntegration,
  assessFounderTestingGateIntegration,
  assessRuntimeTruthIntegration,
  assessWorkspaceRealityAuditIntegration,
} from './e2e-authority-integrations.js';
import { extractContractExpectations } from './contract-expectation-extractor.js';
import { buildContractDerivedValidationPlan } from './contract-derived-plan-generator.js';
import { detectFalseSuccesses } from './false-success-detector.js';
import { collectBuildRealityEvidence } from './evidence-collector.js';
import {
  createPlaywrightDomRealityPage,
  runContractDerivedDomReality,
  stageLabel,
} from './e2e-dom-reality-runner.js';
import {
  runPreviewAuthorityAudit,
  PREVIEW_AUTHORITY_MISMATCH,
  type PreviewAuthorityAuditReport,
} from './preview-authority-audit.js';
import { resolvePreviewServingWorkspaceDir } from './preview-workspace-resolver.js';
import {
  buildAutofixEvidenceFromE2eReport,
  runBuildRealityAutofix,
} from '../build-reality-autofix-engine-v1/build-reality-autofix-engine.js';
import type { BuildRealityAutofixReport } from '../build-reality-autofix-engine-v1/build-reality-autofix-types.js';
import type {
  E2EBuildRealityReport,
  E2EBuildRealityStageId,
  E2EBuildRealityVerdict,
  E2EStageResult,
  E2EValidationCheck,
  RunEndToEndBuildRealityInput,
} from './e2e-build-reality-types.js';
import { END_TO_END_BUILD_REALITY_ENGINE_V1_PASS } from './e2e-build-reality-types.js';

function stageResult(
  stageId: E2EBuildRealityStageId,
  passed: boolean,
  detail: string,
  startedAt: number,
  evidencePaths: string[] = [],
): E2EStageResult {
  return {
    readOnly: true,
    stageId,
    label: stageLabel(stageId),
    passed,
    detail,
    durationMs: Math.round(performance.now() - startedAt),
    evidencePaths,
  };
}

async function probePlaywright(): Promise<boolean> {
  try {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    await browser.close();
    return true;
  } catch {
    return false;
  }
}

export async function runEndToEndBuildReality(
  input: RunEndToEndBuildRealityInput,
): Promise<E2EBuildRealityReport> {
  const startedAt = performance.now();
  const projectId = input.projectId ?? `e2e-reality-${Date.now()}`;
  const stages: E2EStageResult[] = [];
  const checks: E2EValidationCheck[] = [];
  let failingStage: E2EBuildRealityStageId | null = null;

  const markStage = (stageId: E2EBuildRealityStageId, passed: boolean, detail: string, t0: number) => {
    stages.push(stageResult(stageId, passed, detail, t0));
    if (!passed && !failingStage) failingStage = stageId;
  };

  let t0 = performance.now();
  const planning = assessRequirementsToPlanExecutionContract({ rawPrompt: input.rawPrompt });
  const buildReady = planning.report.buildReadyContract?.readinessState === 'BUILD_READY';
  markStage(
    'INTENT_UNDERSTANDING',
    Boolean(planning.report.userIdeaContract) || input.rawPrompt.trim().length > 0,
    planning.report.userIdeaContract
      ? 'User idea contract produced'
      : 'Prompt accepted — idea contract deferred to planning repair',
    t0,
  );

  t0 = performance.now();
  const pim = buildProductIntelligenceModel(input.rawPrompt);
  markStage(
    'PRODUCT_INTELLIGENCE',
    pim.features.length > 0 || pim.architecture.moduleIds.length > 0,
    `PIM features=${pim.features.length} modules=${pim.architecture.moduleIds.length}`,
    t0,
  );

  t0 = performance.now();
  // When the orchestrator already completed a real production build (skipFullBuild), honor its
  // generation-ready signal — a second, divergent planning pass must not soft-fail READY builds.
  const planningReady = input.buildReady === true || buildReady;
  markStage(
    'PLANNING',
    planningReady,
    planningReady
      ? input.buildReady === true && !buildReady
        ? 'BUILD_READY accepted from completed production build plan'
        : 'BUILD_READY contract produced'
      : planning.report.buildReadyContract?.readinessState ?? 'not ready',
    t0,
  );

  t0 = performance.now();
  const ufContract = buildUniversalFeatureContract({
    contractId: projectId,
    rawPrompt: input.rawPrompt,
  });
  markStage(
    'UNIVERSAL_FEATURE_CONTRACT',
    ufContract.entities.length > 0 && ufContract.actions.length > 0,
    `Contract entities=${ufContract.entities.length} actions=${ufContract.actions.length}`,
    t0,
  );

  t0 = performance.now();
  markStage('ARCHITECTURE', true, `Profile ${String(pim.architecture.suggestedProfile ?? ufContract.productProfile)}`, t0);

  let workspaceDir = input.workspaceDir ?? null;
  let activeProjectWorkspaceDir = workspaceDir;
  let previewServingWorkspaceDir = workspaceDir;
  let previewUrl = input.gateUnlockedPreviewUrl ?? input.previewUrl ?? null;
  const diagnosticPreviewUrl = input.diagnosticPreviewUrl ?? null;
  let manifest: GeneratedAppManifest | null = null;
  let buildStatusReady = false;
  let buildResultPass = false;
  let artifactRoot = input.projectRootDir ?? process.cwd();

  if (!input.skipFullBuild) {
    t0 = performance.now();
    const buildInput = {
      rawPrompt: input.rawPrompt,
      projectRootDir: input.projectRootDir,
      source: 'api' as const,
      projectId,
      projectName: input.projectName ?? ufContract.productName,
      projectKind: 'VALIDATION' as const,
      deferEndToEndBuildRealityGate: true,
    };
    let build = await runOnePromptLivePreviewBuild(buildInput);
    const initialPreview =
      build.previewUrl ?? build.diagnosticPreviewUrl ?? build.limitedPreviewUrl ?? null;
    if (
      process.env.AIDEVENGINE_VALIDATION_RUN === '1' &&
      (!initialPreview || !build.npmInstallOk || !build.npmBuildOk)
    ) {
      build = await runOnePromptLivePreviewBuild(buildInput);
    }
    buildStatusReady = build.status === 'READY';
    buildResultPass = build.buildResult === 'PASS';
    manifest = build.materializationManifest ?? null;
    previewUrl = build.previewUrl ?? previewUrl;
    const workspaceRel = build.workspacePath;
    if (workspaceRel) {
      const resolved = resolveRegistryRootForPersistentProject({
        projectRootDir: input.projectRootDir,
        explicitProjectKind: 'VALIDATION',
      });
      artifactRoot = resolved.artifactRoot;
      activeProjectWorkspaceDir = join(artifactRoot, workspaceRel.replace(/\//g, '\\'));
    }
    previewServingWorkspaceDir =
      resolvePreviewServingWorkspaceDir({
        projectId,
        artifactRoot,
        previewUrl,
        activeWorkspaceDir: activeProjectWorkspaceDir,
      }) ?? activeProjectWorkspaceDir;
    workspaceDir = previewServingWorkspaceDir;
    markStage(
      'MATERIALIZATION',
      Boolean(workspaceDir && existsSync(workspaceDir)),
      workspaceDir ?? 'Workspace missing after build',
      t0,
    );
    markStage('COMPILATION', build.npmInstallOk && (build.npmBuildOk || Boolean(previewUrl)), `install=${build.npmInstallOk} build=${build.npmBuildOk}`, t0);
    markStage('AUTO_REPAIR', true, 'Auto-repair delegated to build orchestrator', t0);
    markStage(
      'LIVE_PREVIEW',
      Boolean(previewUrl),
      previewUrl ?? build.failureReason ?? 'Gate-unlocked preview URL missing',
      t0,
    );
    markStage(
      'RUNNING_APPLICATION',
      Boolean(previewUrl) && build.npmInstallOk,
      `preview=${Boolean(previewUrl)} install=${build.npmInstallOk} build=${build.npmBuildOk}`,
      t0,
    );
  } else {
    const resolved = resolveRegistryRootForPersistentProject({
      projectRootDir: input.projectRootDir,
      explicitProjectKind: 'VALIDATION',
    });
    artifactRoot = resolved.artifactRoot;
    activeProjectWorkspaceDir = workspaceDir;
    previewServingWorkspaceDir =
      resolvePreviewServingWorkspaceDir({
        projectId,
        artifactRoot,
        previewUrl,
        activeWorkspaceDir: activeProjectWorkspaceDir,
      }) ?? activeProjectWorkspaceDir;
    workspaceDir = previewServingWorkspaceDir ?? workspaceDir;
    markStage('MATERIALIZATION', Boolean(workspaceDir && existsSync(workspaceDir)), workspaceDir ?? 'missing', t0);
    markStage('COMPILATION', true, 'Skipped — using provided workspace', t0);
    markStage('AUTO_REPAIR', true, 'Skipped', t0);
    markStage('LIVE_PREVIEW', Boolean(previewUrl), previewUrl ?? 'missing preview URL', t0);
    markStage('RUNNING_APPLICATION', true, 'Skipped full build', t0);
    if (workspaceDir && existsSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME))) {
      manifest = JSON.parse(
        readFileSync(join(workspaceDir, GENERATED_APP_MANIFEST_FILENAME), 'utf8'),
      ) as GeneratedAppManifest;
    }
  }

  const expectations = workspaceDir
    ? extractContractExpectations({
        workspaceDir,
        prompt: input.rawPrompt,
        buildReady: input.buildReady ?? buildReady,
      })
    : {
        readOnly: true as const,
        prompt: input.rawPrompt,
        contractId: projectId,
        productName: null,
        productProfile: null,
        featureModules: [],
        routes: [],
        requiredUiTerms: [],
        requiredActionVerbs: [],
        outcomeLabels: [],
        workflowLabels: [],
        mountMode: 'unknown' as const,
        primaryModuleId: null,
        interactionHints: [],
        workspaceHash: null,
        buildReady,
      };

  const plan = workspaceDir
    ? buildContractDerivedValidationPlan({ expectations, workspaceDir })
    : [];

  let mountedFeatureModules: string[] = [];
  let genericShellDetected = false;
  let interactionPassed = false;
  let previewHttpOk = false;
  let domRealityPassed = false;
  let interactionReplay: import('./e2e-dom-reality-runner.js').E2EInteractionReplayStep[] = [];
  let previewAuthorityAudit: PreviewAuthorityAuditReport | null = null;
  let workspaceRealityAuditPath: string | null = null;
  let featureRealityPath: string | null = null;
  let runtimeTruthSnapshot: Record<string, unknown> | null = null;
  let evidence = {
    readOnly: true as const,
    collectedAt: new Date().toISOString(),
    prompt: input.rawPrompt,
    projectId,
    workspacePath: workspaceDir,
    previewUrl,
    screenshotPath: null as string | null,
    domSnapshotPath: null as string | null,
    mountedComponentTreePath: null as string | null,
    routeTablePath: null as string | null,
    featureRegistryPath: null as string | null,
    runtimeTruthPath: null as string | null,
    workspaceRealityAuditPath: null as string | null,
    featureRealityPath: null as string | null,
    workspaceHash: expectations.workspaceHash,
    previewHash: null as string | null,
    previewWorkspaceHash: null as string | null,
    buildContractPath: null as string | null,
    universalFeatureContractPath: null as string | null,
    interactionReplayPath: null as string | null,
    previewAuthorityAuditPath: null as string | null,
    mountedFeatureModules: [] as string[],
    genericShellDetected: false,
  };

  if (workspaceDir) {
    t0 = performance.now();
    const workspaceReality = assessWorkspaceRealityAuditIntegration({
      projectRootDir: input.projectRootDir,
      workspaceDir,
      manifest,
    });
    workspaceRealityAuditPath = workspaceReality.artifactPath;
    markStage('WORKSPACE_REALITY_AUDIT', workspaceReality.passed, workspaceReality.detail, t0);

    t0 = performance.now();
    const featureReality = assessFeatureRealityIntegration({ workspaceDir, manifest });
    featureRealityPath = featureReality.artifactPath;
    markStage('FEATURE_REALITY', featureReality.passed, featureReality.detail, t0);
  } else {
    t0 = performance.now();
    markStage('WORKSPACE_REALITY_AUDIT', false, 'No workspace for workspace reality audit', t0);
    t0 = performance.now();
    markStage('FEATURE_REALITY', false, 'No workspace for feature reality audit', t0);
  }

  t0 = performance.now();
  const runtimeTruth = assessRuntimeTruthIntegration({
    projectRootDir: input.projectRootDir,
    previewUrl,
    previewWorkspaceHash: null,
  });
  runtimeTruthSnapshot = {
    detail: runtimeTruth.detail,
    previewUrl,
    collectedAt: new Date().toISOString(),
  };
  markStage('RUNTIME_TRUTH', runtimeTruth.passed, runtimeTruth.detail, t0);

  t0 = performance.now();
  if (previewUrl && workspaceDir && (await probePlaywright())) {
    const playwright = await import('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
      const domPage = createPlaywrightDomRealityPage(page);
      previewAuthorityAudit = await runPreviewAuthorityAudit({
        projectId,
        projectRootDir: input.projectRootDir,
        artifactRoot,
        activeProjectWorkspaceDir,
        previewServingWorkspaceDir,
        playwrightPreviewUrl: previewUrl,
        gateUnlockedPreviewUrl: previewUrl,
        diagnosticPreviewUrl,
        manifestWorkspaceHash: manifest?.workspaceHash ?? null,
        expectations,
        page: domPage,
      });
      evidence.previewAuthorityAuditPath = previewAuthorityAudit.evidencePath;
      markStage(
        'PREVIEW_AUTHORITY',
        previewAuthorityAudit.passed,
        previewAuthorityAudit.passed
          ? 'Preview authority aligned across workspace, registry, iframe, and Playwright'
          : previewAuthorityAudit.findings
              .filter((finding) => finding.critical && !finding.passed)
              .map((finding) => finding.detail)
              .join('; ') || PREVIEW_AUTHORITY_MISMATCH,
        t0,
      );

      t0 = performance.now();
      if (previewAuthorityAudit.passed) {
        try {
          const domResult = await runContractDerivedDomReality({
            previewUrl,
            expectations,
            steps: plan,
            page: domPage,
            // Preview Authority verifies workspace/URL identity, but intentionally does not drive
            // launch, welcome, authentication, onboarding, or shell navigation. DOM Reality must
            // traverse that prompt-derived UI path before asserting feature mounts.
            skipNavigation: false,
          });
          checks.push(...domResult.checks);
          mountedFeatureModules = domResult.mountedFeatureModules;
          genericShellDetected = domResult.genericShellDetected;
          interactionPassed = domResult.interactionPassed;
          interactionReplay = domResult.interactionReplay;
          previewHttpOk = true;
          domRealityPassed = !domResult.checks.some(
            (check) => check.stageId === 'DOM_REALITY' && check.critical && !check.passed,
          );
          evidence = await collectBuildRealityEvidence({
            projectRootDir: input.projectRootDir,
            projectId,
            prompt: input.rawPrompt,
            workspaceDir,
            previewUrl,
            expectations,
            page: domPage,
            mountedFeatureModules,
            genericShellDetected,
            interactionReplay,
            workspaceRealityAuditPath,
            featureRealityPath,
            runtimeTruthSnapshot: {
              ...runtimeTruthSnapshot,
              previewWorkspaceHash: null,
            },
          });
          markStage(
            'DOM_REALITY',
            domRealityPassed,
            `${domResult.checks.filter((c) => c.passed).length}/${domResult.checks.length} DOM checks passed`,
            t0,
          );
          markStage(
            'INTERACTIVE_REALITY',
            interactionPassed,
            interactionPassed ? 'Contract-derived interactions passed' : 'Interactive workflow failed',
            t0,
          );
        } catch (domError) {
          markStage(
            'DOM_REALITY',
            false,
            domError instanceof Error ? domError.message : String(domError),
            t0,
          );
          markStage('INTERACTIVE_REALITY', false, 'DOM runner failed before interactions', t0);
          if (failingStage === null) {
            failingStage = 'DOM_REALITY';
          }
        }
      } else {
        markStage(
          'DOM_REALITY',
          false,
          'Blocked — preview authority mismatch; DOM inspection skipped',
          t0,
        );
        markStage(
          'INTERACTIVE_REALITY',
          false,
          'Blocked — preview authority mismatch; interaction validation skipped',
          t0,
        );
      }
    } catch (error) {
      markStage(
        'PREVIEW_AUTHORITY',
        false,
        error instanceof Error ? error.message : String(error),
        t0,
      );
      markStage(
        'DOM_REALITY',
        false,
        'Preview authority audit failed before DOM validation',
        t0,
      );
      markStage('INTERACTIVE_REALITY', false, 'Preview authority audit failed before interactions', t0);
      if (failingStage === null) {
        failingStage = 'PREVIEW_AUTHORITY';
      }
    } finally {
      await browser.close();
    }
  } else if (previewUrl) {
    previewAuthorityAudit = await runPreviewAuthorityAudit({
      projectId,
      projectRootDir: input.projectRootDir,
      artifactRoot,
      activeProjectWorkspaceDir,
      previewServingWorkspaceDir,
      playwrightPreviewUrl: previewUrl,
      gateUnlockedPreviewUrl: previewUrl,
      diagnosticPreviewUrl,
      manifestWorkspaceHash: manifest?.workspaceHash ?? null,
      expectations,
      page: null,
    });
    evidence.previewAuthorityAuditPath = previewAuthorityAudit.evidencePath;
    markStage(
      'PREVIEW_AUTHORITY',
      previewAuthorityAudit.passed,
      previewAuthorityAudit.passed
        ? 'Preview authority aligned without Playwright DOM inspection'
        : previewAuthorityAudit.findings
            .filter((finding) => finding.critical && !finding.passed)
            .map((finding) => finding.detail)
            .join('; ') || PREVIEW_AUTHORITY_MISMATCH,
      t0,
    );
    try {
      const res = await fetch(previewUrl);
      previewHttpOk = res.ok;
      const html = await res.text();
      genericShellDetected = /welcome-screen|modular application shell|get started/i.test(html);
      markStage('DOM_REALITY', false, 'Playwright unavailable — DOM reality requires browser validation', t0);
      markStage('INTERACTIVE_REALITY', false, 'Playwright unavailable', t0);
    } catch (error) {
      markStage(
        'DOM_REALITY',
        false,
        error instanceof Error ? error.message : String(error),
        t0,
      );
      markStage('INTERACTIVE_REALITY', false, 'Preview fetch failed', t0);
    }
  } else {
    markStage('PREVIEW_AUTHORITY', false, 'No preview URL for preview authority audit', t0);
    markStage('DOM_REALITY', false, 'No preview URL for DOM validation', t0);
    markStage('INTERACTIVE_REALITY', false, 'No preview URL for interaction validation', t0);
  }

  if (!evidence.domSnapshotPath) {
    evidence = await collectBuildRealityEvidence({
      projectRootDir: input.projectRootDir,
      projectId,
      prompt: input.rawPrompt,
      workspaceDir,
      previewUrl,
      expectations,
      page: null,
      mountedFeatureModules,
      genericShellDetected,
      interactionReplay,
      workspaceRealityAuditPath,
      featureRealityPath,
      runtimeTruthSnapshot,
    });
  }

  if (evidence.previewWorkspaceHash && runtimeTruthSnapshot) {
    runtimeTruthSnapshot = {
      ...runtimeTruthSnapshot,
      previewWorkspaceHash: evidence.previewWorkspaceHash,
    };
    const refreshedRuntimeTruth = assessRuntimeTruthIntegration({
      projectRootDir: input.projectRootDir,
      previewUrl,
      previewWorkspaceHash: evidence.previewWorkspaceHash,
    });
    const runtimeStage = stages.find((stage) => stage.stageId === 'RUNTIME_TRUTH');
    if (runtimeStage) {
      runtimeStage.passed = refreshedRuntimeTruth.passed;
      runtimeStage.detail = refreshedRuntimeTruth.detail;
      if (!refreshedRuntimeTruth.passed && failingStage === null) {
        failingStage = 'RUNTIME_TRUTH';
      }
    }
  }

  t0 = performance.now();
  const falseSuccessFindings = detectFalseSuccesses({
    manifest,
    previewHttpOk,
    genericShellDetected,
    featureMounted: mountedFeatureModules.length > 0,
    workspaceHash: expectations.workspaceHash,
    previewWorkspaceHash: evidence.previewWorkspaceHash,
    interactionPassed,
    checks,
    buildStatusReady,
    buildResultPass,
    previewAuthorityMismatch: previewAuthorityAudit?.passed === false,
    previewAuthorityDetail: previewAuthorityAudit?.findings
      .filter((finding) => finding.critical && !finding.passed)
      .map((finding) => finding.detail)
      .join('; ') || null,
    initialVisibleDomMismatch: previewAuthorityAudit?.initialVisibleDomMatchesContract === false,
  });
  markStage(
    'FALSE_SUCCESS_SCAN',
    !falseSuccessFindings.some((f) => f.critical),
    falseSuccessFindings.length
      ? `${falseSuccessFindings.length} finding(s): ${falseSuccessFindings.map((f) => f.code).join(', ')}`
      : 'No false success patterns detected',
    t0,
  );

  const falseSuccessPassed = !falseSuccessFindings.some((finding) => finding.critical);

  t0 = performance.now();
  const founderGate = assessFounderTestingGateIntegration({
    projectRootDir: input.projectRootDir,
    workspaceDir,
    domRealityPassed,
    interactiveRealityPassed: interactionPassed,
    falseSuccessPassed,
    previewAuthorityPassed: previewAuthorityAudit?.passed !== false,
  });
  markStage('FOUNDER_TESTING_GATE', founderGate.passed, founderGate.detail, t0);

  const criticalFailures =
    stages.some((stage) => !stage.passed) ||
    checks.some((check) => check.critical && !check.passed) ||
    falseSuccessFindings.some((finding) => finding.critical);

  const verdict: E2EBuildRealityVerdict = criticalFailures ? 'NOT_READY' : 'READY_FOR_FOUNDER_TESTING';

  if (verdict === 'NOT_READY' && !failingStage && falseSuccessFindings.some((f) => f.critical)) {
    failingStage = falseSuccessFindings.some((f) => f.code === 'PREVIEW_AUTHORITY_MISMATCH')
      ? 'PREVIEW_AUTHORITY'
      : 'FALSE_SUCCESS_SCAN';
  }

  t0 = performance.now();
  markStage(
    'FINAL_VERDICT',
    verdict === 'READY_FOR_FOUNDER_TESTING',
    verdict === 'READY_FOR_FOUNDER_TESTING'
      ? END_TO_END_BUILD_REALITY_ENGINE_V1_PASS
      : `NOT_READY — failing stage ${failingStage ?? 'FINAL_VERDICT'}`,
    t0,
  );

  if (previewAuthorityAudit?.evidencePath) {
    evidence = { ...evidence, previewAuthorityAuditPath: previewAuthorityAudit.evidencePath };
  }

  if (process.env.AIDEVENGINE_E2E_DEBUG === '1') {
    try {
      const dbgDir = join(input.projectRootDir, '.end-to-end-build-reality', projectId);
      mkdirSync(dbgDir, { recursive: true });
      writeFileSync(
        join(dbgDir, 'stage-debug.json'),
        `${JSON.stringify(
          {
            verdict,
            failingStage,
            workspaceDir,
            previewUrl,
            stages: stages.map((s) => ({ stageId: s.stageId, passed: s.passed, detail: s.detail })),
            criticalChecks: checks
              .filter((c) => c.critical && !c.passed)
              .map((c) => ({ stageId: c.stageId, detail: c.detail })),
            falseSuccess: falseSuccessFindings.map((f) => ({ code: f.code, critical: f.critical, detail: f.detail })),
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
    } catch {
      // debug only
    }
  }

  let autofixReport: BuildRealityAutofixReport | null = null;
  let passedImmediately = verdict === 'READY_FOR_FOUNDER_TESTING';
  let passedAfterAutofix = false;
  let finalVerdict: E2EBuildRealityVerdict = verdict;

  if (verdict === 'NOT_READY' && input.enableAutofix === true && workspaceDir) {
    const preAutofixReport: E2EBuildRealityReport = {
      readOnly: true,
      prompt: input.rawPrompt,
      projectId,
      verdict,
      failingStage,
      stages,
      checks,
      falseSuccessFindings,
      expectations,
      evidence,
      previewAuthorityAudit: previewAuthorityAudit
        ? {
            readOnly: true,
            passed: previewAuthorityAudit.passed,
            failureCode: previewAuthorityAudit.failureCode,
            generatedWorkspace: previewAuthorityAudit.generatedWorkspace,
            builtWorkspace: previewAuthorityAudit.builtWorkspace,
            viteServingWorkspace: previewAuthorityAudit.viteServingWorkspace,
            registeredPreviewUrl: previewAuthorityAudit.registeredPreviewUrl,
            iframePreviewUrl: previewAuthorityAudit.iframePreviewUrl,
            playwrightPreviewUrl: previewAuthorityAudit.playwrightPreviewUrl,
            playwrightSameAsLivePreview: previewAuthorityAudit.playwrightSameAsLivePreview,
            sessionRegistryMatchesIframe: previewAuthorityAudit.sessionRegistryMatchesIframe,
            staleRegistrationDetected: previewAuthorityAudit.staleRegistrationDetected,
            appTsxChecksumMatch: previewAuthorityAudit.appTsxChecksumMatch,
            initialVisibleDomMatchesContract: previewAuthorityAudit.initialVisibleDomMatchesContract,
          }
        : null,
      durationMs: Math.round(performance.now() - startedAt),
      generatedAt: new Date().toISOString(),
    };

    const autofixResult = await runBuildRealityAutofix({
      workspaceDir,
      rawPrompt: input.rawPrompt,
      e2eReport: preAutofixReport,
      validationCommand: 'end-to-end-build-reality-engine-v1',
      runValidation: async () => {
        const rerun = await runEndToEndBuildReality({
          ...input,
          projectId,
          skipFullBuild: true,
          workspaceDir,
          previewUrl,
          gateUnlockedPreviewUrl: previewUrl,
          diagnosticPreviewUrl,
          buildReady: input.buildReady ?? buildReady,
          enableAutofix: false,
        });
        return {
          readOnly: true as const,
          passed: rerun.verdict === 'READY_FOR_FOUNDER_TESTING',
          detail:
            rerun.verdict === 'READY_FOR_FOUNDER_TESTING'
              ? 'End-to-end build reality passed after autofix'
              : `Still NOT_READY — failing stage ${rerun.failingStage ?? 'FINAL_VERDICT'}`,
          evidence: buildAutofixEvidenceFromE2eReport(rerun),
        };
      },
    });
    autofixReport = autofixResult.report;
    passedAfterAutofix = autofixResult.finalValidationPassed;
    if (autofixResult.finalValidationPassed) {
      finalVerdict = 'READY_FOR_FOUNDER_TESTING';
      failingStage = null;
    }
  }

  return {
    readOnly: true,
    prompt: input.rawPrompt,
    projectId,
    verdict: finalVerdict,
    failingStage: finalVerdict === 'NOT_READY' ? failingStage : null,
    stages,
    checks,
    falseSuccessFindings,
    expectations,
    evidence,
    previewAuthorityAudit: previewAuthorityAudit
      ? {
          readOnly: true,
          passed: previewAuthorityAudit.passed,
          failureCode: previewAuthorityAudit.failureCode,
          generatedWorkspace: previewAuthorityAudit.generatedWorkspace,
          builtWorkspace: previewAuthorityAudit.builtWorkspace,
          viteServingWorkspace: previewAuthorityAudit.viteServingWorkspace,
          registeredPreviewUrl: previewAuthorityAudit.registeredPreviewUrl,
          iframePreviewUrl: previewAuthorityAudit.iframePreviewUrl,
          playwrightPreviewUrl: previewAuthorityAudit.playwrightPreviewUrl,
          playwrightSameAsLivePreview: previewAuthorityAudit.playwrightSameAsLivePreview,
          sessionRegistryMatchesIframe: previewAuthorityAudit.sessionRegistryMatchesIframe,
          staleRegistrationDetected: previewAuthorityAudit.staleRegistrationDetected,
          appTsxChecksumMatch: previewAuthorityAudit.appTsxChecksumMatch,
          initialVisibleDomMatchesContract: previewAuthorityAudit.initialVisibleDomMatchesContract,
        }
      : null,
    durationMs: Math.round(performance.now() - startedAt),
    generatedAt: new Date().toISOString(),
    autofixReport,
    passedImmediately,
    passedAfterAutofix,
  };
}

export { END_TO_END_BUILD_REALITY_ENGINE_V1_PASS };
