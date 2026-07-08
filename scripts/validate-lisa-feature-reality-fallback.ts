/**
 * LISA Feature Reality workspace fallback — regression validation.
 * Proves LISA no longer aborts with "Feature Reality evidence unavailable"
 * when generated workspace modules exist, and does not fall back to ExpenseTracker.
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { materializeGeneratedApplication } from '../src/code-generation-engine/code-generation-engine-authority.js';
import { assessRequirementsToPlanExecutionContract } from '../src/requirements-to-plan-execution-contract/index.js';
import {
  collectWorkspaceFeatureRealityFallback,
  resetWorkspaceFeatureRealityFallbackForTests,
  workspaceHasGeneratedFeatureModules,
} from '../src/feature-contract-reality/index.js';
import {
  resetFeatureRealityAssessmentForTests,
} from '../src/feature-reality-validation/index.js';
import {
  collectLaunchEvidence,
  resetLaunchEvidenceCollectorForTests,
  validateLaunchEvidence,
} from '../src/launch-readiness-authority-v2/index.js';
import { LISA_REQUIRED_MODULES } from '../src/prompt-faithful-generation/prompt-feature-extractor.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { LISA_ASSISTIVE_PROMPT } from './lib/prompt-bounded-materialization-validation.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  resetWorkspaceFeatureRealityFallbackForTests();
  resetFeatureRealityAssessmentForTests();
  resetLaunchEvidenceCollectorForTests();

  const testRoot = join(tmpdir(), `lisa-feature-reality-fallback-${Date.now()}`);
  mkdirSync(testRoot, { recursive: true });

  try {
    const buildPlan = resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT);
    assert(
      'LISA prompt resolves ASSISTIVE_COMMUNICATION profile',
      buildPlan.definition.expectedAppType === 'assistive-communication',
      `expectedAppType=${buildPlan.definition.expectedAppType}`,
    );
    assert(
      'LISA does not select ExpenseTracker profile',
      String(buildPlan.selectedProfile) !== 'EXPENSE_TRACKER_WEB_V1',
      `selectedProfile=${String(buildPlan.selectedProfile)}`,
    );
    assert(
      'LISA required modules extracted',
      LISA_REQUIRED_MODULES.every((id) => buildPlan.modulePlan.approvedModuleIds.includes(id)),
      `approved=${buildPlan.modulePlan.approvedModuleIds.join(', ')}`,
    );

    const assessment = assessRequirementsToPlanExecutionContract({ rawPrompt: LISA_ASSISTIVE_PROMPT });
    const contract = assessment.report.buildReadyContract;
    if (!contract) throw new Error('Planning failed for LISA prompt');

    const projectId = `lisa-fallback-${Date.now()}`;
    const workspaceDir = join(testRoot, '.generated-builder-workspaces', projectId);
    mkdirSync(workspaceDir, { recursive: true });

    const engineResult = materializeGeneratedApplication({
      projectRootDir: testRoot,
      workspaceId: projectId,
      contract: { ...contract, contractId: projectId },
      rawPrompt: LISA_ASSISTIVE_PROMPT,
      faithfulBuildPlan: buildPlan,
      profileOverride: buildPlan.selectedProfile,
    });

    assert(
      'LISA workspace materialized',
      engineResult.generated === true && existsSync(workspaceDir),
      engineResult.skippedReason ?? 'materialized',
    );

    assert(
      'Workspace has generated feature modules',
      workspaceHasGeneratedFeatureModules(workspaceDir),
      workspaceDir,
    );

    const fallback = collectWorkspaceFeatureRealityFallback({
      workspaceDir,
      requiredModuleIds: LISA_REQUIRED_MODULES,
      contractId: buildPlan.promptFaithfulness.contract.id,
      registerAssessment: true,
      isLisaContext: true,
    });

    assert(
      'Feature Reality fallback is not UNAVAILABLE',
      fallback.status !== 'UNAVAILABLE',
      `status=${fallback.status}`,
    );
    assert(
      'Feature Reality fallback is DEGRADED_WITH_WORKSPACE_EVIDENCE or PASS',
      fallback.status === 'DEGRADED_WITH_WORKSPACE_EVIDENCE' || fallback.status === 'PASS',
      `status=${fallback.status} score=${fallback.score}`,
    );
    assert(
      'All LISA required modules proven in workspace',
      fallback.missingModuleIds.length === 0,
      `missing=${fallback.missingModuleIds.join(', ') || 'none'}`,
    );
    assert(
      'Feature registry and routes present',
      fallback.registryPresent && fallback.routesPresent,
      `registry=${fallback.registryPresent} routes=${fallback.routesPresent}`,
    );
    assert(
      'App renders generated features',
      fallback.appRendersFeatures,
      String(fallback.appRendersFeatures),
    );
    assert(
      'LISA interaction signals detected in workspace',
      fallback.interactionSignalsFound.length >= 6,
      `found=${fallback.interactionSignalsFound.join(', ')}`,
    );

    const launchEvidence = collectLaunchEvidence({
      rawPrompt: LISA_ASSISTIVE_PROMPT,
      projectRootDir: testRoot,
      workspaceDir,
      productIntelligenceModel: buildPlan.productIntelligenceModel,
      promptFaithfulness: buildPlan.promptFaithfulness,
      capabilityPlanning: buildPlan.capabilityPlanning,
    });

    const featureRealitySource = launchEvidence.sources.find((s) => s.sourceId === 'FEATURE_REALITY');
    assert(
      'Launch FEATURE_REALITY is not UNAVAILABLE',
      featureRealitySource?.status !== 'UNAVAILABLE',
      `status=${featureRealitySource?.status ?? 'missing'}`,
    );
    assert(
      'Launch FEATURE_REALITY uses workspace degradation when modules exist',
      featureRealitySource?.status === 'DEGRADED_WITH_WORKSPACE_EVIDENCE' ||
        featureRealitySource?.status === 'PASS',
      `status=${featureRealitySource?.status ?? 'missing'}`,
    );
    assert(
      'Launch FEATURE_REALITY does not block with unavailable message',
      !featureRealitySource?.blockers.some((b) => /evidence unavailable/i.test(b)),
      featureRealitySource?.blockers.join('; ') ?? 'no blockers',
    );

    const validation = validateLaunchEvidence(launchEvidence);
    assert(
      'Launch evidence validation passes without Feature Reality unavailable blocker',
      validation.valid ||
        !validation.primaryBlockReason?.includes('Feature Reality evidence unavailable'),
      validation.primaryBlockReason ?? 'valid',
    );
    assert(
      'Launch evidence does not reference ExpenseTracker fallback',
      !launchEvidence.sources.some((s) =>
        [...s.blockers, ...s.warnings].some((text) => /expense tracker/i.test(text)),
      ),
      'no expense tracker references in launch evidence',
    );
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }

  const failed = results.filter((r) => !r.passed);
  console.log('\nLISA Feature Reality Workspace Fallback Validation\n');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    console.log(`  ${check.detail}\n`);
  }
  if (failed.length > 0) {
    console.error(`${failed.length}/${results.length} checks failed`);
    process.exit(1);
  }
  console.log(`All ${results.length} checks passed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
