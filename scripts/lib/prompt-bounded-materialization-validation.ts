/**
 * Prompt-Bounded Materialization — shared validation suite.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { materializeGeneratedApplication } from '../../src/code-generation-engine/code-generation-engine-authority.js';
import { getDevPulseV2Owner } from '../../src/foundation/ownership-registry.js';
import {
  classifyPromptPhrase,
  extractDescriptorMetadataFromPrompt,
  getDevPulseV2PromptBoundedMaterialization,
  getPromptBoundedMaterializationPassToken,
  guardPromptBoundedMaterialization,
  isGenericFallbackModuleTerm,
  promptExplicitlyJustifiesGenericModule,
  resolvePromptBoundedModulePlan,
  resetPromptBoundedMaterializationModuleForTests,
  validatePostGenerationContamination,
} from '../../src/prompt-bounded-materialization/index.js';
import {
  listWorkspaceFeatureModuleIds,
  moduleIdsInclude,
  resolvePromptFaithfulBuildPlan,
} from '../../src/prompt-faithful-generation/index.js';
import { getProfileFeatureDefinition } from '../../src/universal-prompt-to-app-materialization/profile-feature-map.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { EXPENSE_PROMPT } from './prompt-faithfulness-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/prompt-bounded-materialization');

export const REQUIRED_FILES = [
  'prompt-bounded-materialization-types.ts',
  'prompt-bounded-materialization-registry.ts',
  'module-origin-evidence.ts',
  'descriptor-classification-engine.ts',
  'module-candidate-collector.ts',
  'prompt-bounded-module-resolver.ts',
  'pre-generation-materialization-guard.ts',
  'post-generation-contamination-validator.ts',
  'prompt-bounded-materialization-authority.ts',
  'index.ts',
];

export const LISA_ASSISTIVE_PROMPT = `Build LISA — Locked In Syndrome App.

An assistive communication app for locked-in syndrome users that converts eye movement, gaze, and blinks into speech.

Mobile-first Android phone preview required.

Required modules:
* onboarding-calibration
* eye-tracking-board
* blink-input-engine
* gaze-keyboard
* text-to-speech
* quick-phrases
* caregiver-dashboard
* communication-history
* accessibility-settings
* emergency-speech

Do not use generic project management fallback.`;

export const RECIPE_PLANNER_PROMPT =
  'Build a recipe planner app with recipes, ingredients, meal plan, and shopping list modules. No generic project management.';

export const FITNESS_TRACKER_PROMPT = `Build a fitness tracker with workouts, progress, goals, and history.

Required modules:
* workouts
* progress
* goals
* history

No tasks, projects, or sprint planning.`;

export const PROJECT_MANAGEMENT_PROMPT =
  'Build a team project timeline app with projects, tasks, team members, and timeline views.';

export interface ValidationCheck {
  section: string;
  name: string;
  passed: boolean;
  detail: string;
}

function assert(
  checks: ValidationCheck[],
  include: (section: string) => boolean,
  section: string,
  name: string,
  condition: boolean,
  detail: string,
): void {
  if (!include(section)) return;
  checks.push({ section, name, passed: condition, detail });
}

export function runPromptBoundedMaterializationValidation(sections?: string[]): {
  checks: ValidationCheck[];
  allPassed: boolean;
} {
  const checks: ValidationCheck[] = [];
  const want = sections ? new Set(sections) : null;
  const include = (section: string): boolean => !want || want.has(section) || want.has('all');

  resetPromptBoundedMaterializationModuleForTests();

  if (include('prompt-bounded-materialization') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert(checks, include, 'prompt-bounded-materialization', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const registry = getDevPulseV2PromptBoundedMaterialization();
    assert(checks, include,       'prompt-bounded-materialization',
      'pass token',
      registry.passToken === 'PROMPT_BOUNDED_MATERIALIZATION_V1_PASS',
      registry.passToken,
    );
    assert(checks, include,       'prompt-bounded-materialization',
      'ownership registry',
      getDevPulseV2Owner('prompt_bounded_materialization')?.phase === 15,
      'phase 15',
    );
  }

  if (include('module-origin-resolution') || include('all')) {
    const plan = resolvePromptBoundedModulePlan({
      rawPrompt: LISA_ASSISTIVE_PROMPT,
      materializationProfile: 'GENERIC_CUSTOM_APP_V1',
      extraction: resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT).extraction,
      profileDefinition: resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT).definition,
      productIntelligenceModel: resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT).productIntelligenceModel,
      capabilityPlanning: resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT).capabilityPlanning,
    });
    assert(checks, include,       'module-origin-resolution',
      'lisa blocks fallback modules',
      !moduleIdsInclude(plan.approvedModuleIds, 'projects') &&
        !moduleIdsInclude(plan.approvedModuleIds, 'tasks') &&
        !moduleIdsInclude(plan.approvedModuleIds, 'team'),
      plan.approvedModuleIds.join(', '),
    );
    assert(checks, include,       'module-origin-resolution',
      'lisa keeps assistive modules',
      moduleIdsInclude(plan.approvedModuleIds, 'eye-tracking-board'),
      plan.approvedModuleIds.join(', '),
    );
    assert(checks, include,       'module-origin-resolution',
      'module origins tracked',
      plan.approvedModules.every((m) => m.origin && m.sourceEvidence.length > 0),
      String(plan.approvedModules.length),
    );
  }

  if (include('descriptor-to-metadata-classification') || include('all')) {
    const mobile = classifyPromptPhrase('mobile-first');
    assert(checks, include,       'descriptor-to-metadata-classification',
      'mobile-first metadata',
      mobile.category === 'PLATFORM_CONSTRAINT' && !mobile.createsFeatureFolder,
      mobile.category,
    );
    const metadata = extractDescriptorMetadataFromPrompt('Build a mobile-first accessibility-first app.');
    assert(checks, include,       'descriptor-to-metadata-classification',
      'descriptor extraction',
      metadata.some((m) => m.category === 'PLATFORM_CONSTRAINT'),
      String(metadata.length),
    );
  }

  if (include('fallback-contamination-guard') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT);
    const guard = guardPromptBoundedMaterialization({ rawPrompt: LISA_ASSISTIVE_PROMPT, buildPlan });
    assert(checks, include, 'fallback-contamination-guard', 'pre-generation guard passes lisa', guard.allowed, String(guard.allowed));
    assert(checks, include,       'fallback-contamination-guard',
      'blocked modules recorded',
      guard.plan.blockedModules.every((b) => b.reason.length > 0),
      String(guard.plan.blockedModules.length),
    );
    const orchestrator = readFileSync(join(ROOT, 'src/code-generation-engine/code-generation-engine-authority.ts'), 'utf8');
    assert(checks, include,       'fallback-contamination-guard',
      'code-gen guard integrated',
      orchestrator.includes('guardPromptBoundedMaterialization'),
      'integrated',
    );
  }

  if (include('custom-domain-no-default-modules') || include('all')) {
    for (const [label, prompt] of [
      ['recipe', RECIPE_PLANNER_PROMPT],
      ['fitness', FITNESS_TRACKER_PROMPT],
    ] as const) {
      const plan = resolvePromptFaithfulBuildPlan(prompt).modulePlan;
      assert(checks, include,         'custom-domain-no-default-modules',
        `${label} no projects/tasks`,
        !moduleIdsInclude(plan.approvedModuleIds, 'projects') &&
          !moduleIdsInclude(plan.approvedModuleIds, 'tasks') &&
          !moduleIdsInclude(plan.approvedModuleIds, 'team'),
        plan.approvedModuleIds.join(', '),
      );
    }
  }

  if (include('profile-domain-module-exceptions') || include('all')) {
    const pmBuild = resolvePromptFaithfulBuildPlan(PROJECT_MANAGEMENT_PROMPT);
    const pmPlan = resolvePromptBoundedModulePlan({
      rawPrompt: PROJECT_MANAGEMENT_PROMPT,
      materializationProfile: 'PROJECT_MANAGEMENT_WEB_V1',
      extraction: pmBuild.extraction,
      profileDefinition: getProfileFeatureDefinition('PROJECT_MANAGEMENT_WEB_V1', PROJECT_MANAGEMENT_PROMPT),
      productIntelligenceModel: pmBuild.productIntelligenceModel,
      capabilityPlanning: pmBuild.capabilityPlanning,
    });
    assert(
      checks,
      include,
      'profile-domain-module-exceptions',
      'project management allows domain modules',
      moduleIdsInclude(pmPlan.approvedModuleIds, 'projects') &&
        moduleIdsInclude(pmPlan.approvedModuleIds, 'tasks'),
      pmPlan.approvedModuleIds.join(', '),
    );
    assert(checks, include,       'profile-domain-module-exceptions',
      'explicit task prompt allows tasks',
      promptExplicitlyJustifiesGenericModule('Build a task manager for daily todos', 'tasks'),
      'tasks',
    );
  }

  if (include('live-prompt-faithful-build-path') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT);
    const files = buildUniversalMaterializedWorkspaceFiles({
      contractId: 'pbm-test-contract',
      ideaId: 'pbm-test-idea',
      buildUnits: ['unit-1'],
      rawPrompt: LISA_ASSISTIVE_PROMPT,
      faithfulBuildPlan: buildPlan,
    });
    const bundle = files.map((f) => f.content).join('\n');
    assert(checks, include,       'live-prompt-faithful-build-path',
      'materialization uses approved modules only',
      !/\bsrc\/features\/projects\b/.test(bundle) && !/\bsrc\/features\/tasks\b/.test(bundle),
      'no pm fallback folders in bundle',
    );
    assert(checks, include,       'live-prompt-faithful-build-path',
      'assistive module generated',
      bundle.includes('eye-tracking-board'),
      'eye-tracking-board',
    );
  }

  if (include('all')) {
    const expensePlan = resolvePromptFaithfulBuildPlan(EXPENSE_PROMPT).modulePlan;
    assert(checks, include,       'prompt-bounded-materialization',
      'scenario expense tracker',
      moduleIdsInclude(expensePlan.approvedModuleIds, 'expenses') &&
        !moduleIdsInclude(expensePlan.approvedModuleIds, 'team'),
      expensePlan.approvedModuleIds.join(', '),
    );

    const tmpRoot = join(tmpdir(), `pbm-validation-${Date.now()}`);
    const workspaceId = 'pbm-workspace';
    const workspaceDir = join(tmpRoot, workspaceId);
    mkdirSync(join(workspaceDir, 'src', 'features', 'projects'), { recursive: true });
    writeFileSync(join(workspaceDir, 'src', 'features', 'projects', '.keep'), '');
    const post = validatePostGenerationContamination({
      workspaceDir,
      plan: resolvePromptFaithfulBuildPlan(LISA_ASSISTIVE_PROMPT).modulePlan,
    });
    assert(checks, include,       'prompt-bounded-materialization',
      'post-generation contamination detected',
      !post.passed && post.failureMessages.some((m) => m.includes('projects')),
      post.failureMessages[0] ?? 'none',
    );
    rmSync(tmpRoot, { recursive: true, force: true });

    assert(checks, include,       'prompt-bounded-materialization',
      'pass token emitted',
      getPromptBoundedMaterializationPassToken() === 'PROMPT_BOUNDED_MATERIALIZATION_V1_PASS',
      getPromptBoundedMaterializationPassToken(),
    );

    for (const term of ['projects', 'tasks', 'team', 'timeline']) {
      assert(checks, include,         'prompt-bounded-materialization',
        `generic term tracked: ${term}`,
        isGenericFallbackModuleTerm(term),
        term,
      );
    }
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printPromptBoundedMaterializationValidationResults(
  checks: ValidationCheck[],
  label = 'validate:prompt-bounded-materialization',
): void {
  const failed = checks.filter((c) => !c.passed);
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(`\n${label}: ${failed.length ? 'FAILED' : 'PASSED'} (${checks.length} checks, ${failed.length} failed)`);
  if (checks.every((c) => c.passed)) {
    console.log('\nPROMPT_BOUNDED_MATERIALIZATION_V1_PASS');
  }
  if (failed.length) process.exit(1);
}
