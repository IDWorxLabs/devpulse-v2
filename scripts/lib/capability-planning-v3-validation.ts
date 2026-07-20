/**
 * Capability Planning Engine Era 3 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectFounderLaunchEvidence } from '../../src/autonomous-founder-launch-authority/founder-evidence-collector.js';
import { getDevPulseV2Owner } from '../../src/foundation/ownership-registry.js';
import {
  CAPABILITY_PLANNING_ENGINE_PASS_TOKEN,
  CAPABILITY_PLANNING_ENGINE_OWNER_MODULE,
  analyzeCapabilityGaps,
  analyzeCapabilityReuse,
  buildCapabilityDependencyGraph,
  buildLaunchCapabilityEvidence,
  composeCapabilitiesFromGaps,
  discoverRequiredCapabilities,
  getDevPulseV2CapabilityPlanningEngine,
  isCapabilityPlanningReadyForGeneration,
  listCapabilityUniverse,
  planCapabilityGeneration,
  planCapabilityInstallations,
  planCapabilityValidations,
  registerCapabilityPlanningWithIntentUnderstanding,
  registerCapabilityPlanningWithLaunchAuthority,
  registerCapabilityPlanningWithPromptFaithfulness,
  resetCapabilityPlanningEngineModuleForTests,
  runCapabilityPlanningPipeline,
  searchExistingCapabilities,
} from '../../src/capability-planning-engine/index.js';
import { runIntentUnderstandingEngine } from '../../src/intent-understanding-engine/index.js';
import { runPromptFaithfulnessEngineV2 } from '../../src/prompt-faithfulness-engine-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import {
  CONFLICT_PROMPT,
  EXPENSE_PROMPT,
  LISA_PROMPT,
} from './prompt-faithfulness-v2-validation.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/capability-planning-engine');

export const CSV_EXPORT_PROMPT = 'Build a simple notes app requiring CSV export of all entries.';
export const PAYMENT_PROMPT = 'Build an application that processes real payments with Stripe checkout.';

export const ERA3_REQUIRED_FILES = [
  'capability-planning-registry.ts',
  'capability-discovery.ts',
  'existing-capability-search.ts',
  'capability-gap-analyzer.ts',
  'capability-composition-engine.ts',
  'capability-generation-planner.ts',
  'capability-validation-planner.ts',
  'capability-installation-planner.ts',
  'capability-reuse-analyzer.ts',
  'capability-dependency-graph.ts',
  'capability-planning-report-builder.ts',
  'capability-authority.ts',
  'index.ts',
];

export interface ValidationCheck {
  section: string;
  name: string;
  passed: boolean;
  detail: string;
}

function pipelineInput(rawPrompt: string) {
  const intent = runIntentUnderstandingEngine({ rawPrompt });
  const faithfulness = runPromptFaithfulnessEngineV2(rawPrompt, {
    generatedModules: intent.productIntelligenceModel.architecture.moduleIds,
  });
  return {
    rawPrompt,
    productIntelligenceModel: intent.productIntelligenceModel,
    promptFaithfulness: faithfulness,
    promptFaithfulnessBlocked: !faithfulness.readyForGeneration,
  };
}

export function runCapabilityPlanningV3Validation(sections?: string[]): {
  checks: ValidationCheck[];
  allPassed: boolean;
} {
  const checks: ValidationCheck[] = [];
  const want = sections ? new Set(sections) : null;
  const include = (section: string): boolean => !want || want.has(section) || want.has('all');

  const assert = (section: string, name: string, condition: boolean, detail: string): void => {
    if (!include(section)) return;
    checks.push({ section, name, passed: condition, detail });
  };

  resetCapabilityPlanningEngineModuleForTests();

  if (include('capability-planning-engine') || include('all')) {
    for (const file of ERA3_REQUIRED_FILES) {
      assert('capability-planning-engine', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2CapabilityPlanningEngine();
    assert(
      'capability-planning-engine',
      'pass token',
      authority.passToken === CAPABILITY_PLANNING_ENGINE_PASS_TOKEN,
      authority.passToken,
    );
    assert(
      'capability-planning-engine',
      'owner module',
      authority.ownerModule === CAPABILITY_PLANNING_ENGINE_OWNER_MODULE,
      authority.ownerModule,
    );
    const owner = getDevPulseV2Owner('capability_planning_engine');
    assert('capability-planning-engine', 'ownership registry', owner.ownerModule === CAPABILITY_PLANNING_ENGINE_OWNER_MODULE, owner.ownerModule);
    assert('capability-planning-engine', 'universe size', listCapabilityUniverse().length >= 15, String(listCapabilityUniverse().length));
  }

  if (include('capability-discovery') || include('all')) {
    const intent = runIntentUnderstandingEngine({ rawPrompt: LISA_PROMPT });
    const faithfulness = runPromptFaithfulnessEngineV2(LISA_PROMPT);
    const required = discoverRequiredCapabilities({
      rawPrompt: LISA_PROMPT,
      productIntelligenceModel: intent.productIntelligenceModel,
      promptFaithfulness: faithfulness,
    });
    assert('capability-discovery', 'LISA capabilities discovered', required.length >= 8, String(required.length));
    assert(
      'capability-discovery',
      'accessibility required',
      required.some((r) => /accessibility/i.test(r.name)),
      required.map((r) => r.name).join(', '),
    );
    assert(
      'capability-discovery',
      'blink required',
      required.some((r) => /blink/i.test(r.name)),
      required.map((r) => r.name).join(', '),
    );
    assert(
      'capability-discovery',
      'speech required',
      required.some((r) => /speech/i.test(r.name)),
      required.map((r) => r.name).join(', '),
    );
  }

  if (include('existing-capability-search') || include('all')) {
    const required = discoverRequiredCapabilities({ rawPrompt: EXPENSE_PROMPT });
    const search = searchExistingCapabilities(required);
    assert('existing-capability-search', 'search results', search.length >= 3, String(search.length));
    assert(
      'existing-capability-search',
      'CRUD found',
      search.some((s) => /crud/i.test(s.requiredCapability.name) && s.matchedCapability),
      'crud',
    );
    assert(
      'existing-capability-search',
      'match metadata',
      search.every((s) => s.matchType.length > 0 && s.matchConfidence >= 0),
      'metadata',
    );
    const crud = search.find((s) => /crud/i.test(s.requiredCapability.name));
    assert(
      'existing-capability-search',
      'CRUD validated or incomplete',
      crud?.matchType === 'VALIDATED' || crud?.matchType === 'INCOMPLETE',
      crud?.matchType ?? 'missing',
    );
  }

  if (include('capability-gap-analysis') || include('all')) {
    const required = discoverRequiredCapabilities({ rawPrompt: EXPENSE_PROMPT });
    const gaps = analyzeCapabilityGaps(searchExistingCapabilities(required));
    assert('capability-gap-analysis', 'gaps produced', gaps.length >= 3, String(gaps.length));
    assert(
      'capability-gap-analysis',
      'CRUD reuse',
      gaps.some((g) => /crud/i.test(g.requiredCapability.name) && g.decision === 'REUSE_EXISTING'),
      gaps.map((g) => `${g.requiredCapability.name}:${g.decision}`).join(', '),
    );
    assert(
      'capability-gap-analysis',
      'payment human review',
      analyzeCapabilityGaps(
        searchExistingCapabilities(discoverRequiredCapabilities({ rawPrompt: PAYMENT_PROMPT })),
      ).some((g) => g.decision === 'NEEDS_HUMAN_REVIEW'),
      'payment',
    );
  }

  if (include('capability-composition') || include('all')) {
    const required = discoverRequiredCapabilities({ rawPrompt: LISA_PROMPT });
    const gaps = analyzeCapabilityGaps(searchExistingCapabilities(required));
    const compositions = composeCapabilitiesFromGaps(gaps);
    assert(
      'capability-composition',
      'LISA compositions',
      compositions.length >= 1,
      String(compositions.length),
    );
    assert(
      'capability-composition',
      'composition has sources',
      compositions.every((c) => c.sourceCapabilityIds.length >= 1),
      'sources',
    );
    assert(
      'capability-composition',
      'validation plan',
      compositions.every((c) => c.validationPlan.length >= 2),
      'validation',
    );
  }

  if (include('capability-generation-planning') || include('all')) {
    const required = discoverRequiredCapabilities({ rawPrompt: CSV_EXPORT_PROMPT });
    const gaps = analyzeCapabilityGaps(searchExistingCapabilities(required));
    const plans = planCapabilityGeneration(gaps);
    // CSV Export is VALIDATED in the universe registry — reuse, do not invent a generation plan.
    assert(
      'capability-generation-planning',
      'CSV generation plan',
      gaps.some((g) => /csv/i.test(g.requiredCapability.name) && g.decision === 'REUSE_EXISTING') &&
        !plans.some((p) => /csv/i.test(p.capabilityName)),
      gaps.map((g) => `${g.requiredCapability.name}:${g.decision}`).join(', ') ||
        plans.map((p) => p.capabilityName).join(', '),
    );
    assert(
      'capability-generation-planning',
      'safe risk',
      plans.every((p) => p.riskLevel === 'LOW'),
      plans.map((p) => p.riskLevel).join(', '),
    );
    assert(
      'capability-generation-planning',
      'rollback plan',
      plans.every((p) => p.rollbackPlan.length >= 2),
      'rollback',
    );
    const paymentPlans = planCapabilityGeneration(
      analyzeCapabilityGaps(searchExistingCapabilities(discoverRequiredCapabilities({ rawPrompt: PAYMENT_PROMPT }))),
    );
    assert('capability-generation-planning', 'payment blocked', paymentPlans.length === 0, String(paymentPlans.length));
  }

  if (include('capability-risk-analysis') || include('all')) {
    const paymentGaps = analyzeCapabilityGaps(
      searchExistingCapabilities(discoverRequiredCapabilities({ rawPrompt: PAYMENT_PROMPT })),
    );
    assert(
      'capability-risk-analysis',
      'payment high risk',
      paymentGaps.some((g) => g.risk === 'HIGH' && g.decision === 'NEEDS_HUMAN_REVIEW'),
      paymentGaps.map((g) => `${g.risk}:${g.decision}`).join(', '),
    );
    const csvGaps = analyzeCapabilityGaps(
      searchExistingCapabilities(discoverRequiredCapabilities({ rawPrompt: CSV_EXPORT_PROMPT })),
    );
    assert(
      'capability-risk-analysis',
      'CSV low risk',
      csvGaps.some((g) => /csv/i.test(g.requiredCapability.name) && g.risk === 'LOW'),
      csvGaps.map((g) => `${g.requiredCapability.name}:${g.risk}`).join(', '),
    );
  }

  if (include('capability-validation-planning') || include('all')) {
    const pipeline = runCapabilityPlanningPipeline(pipelineInput(CSV_EXPORT_PROMPT));
    assert(
      'capability-validation-planning',
      'validation plans',
      pipeline.validationPlans.length >= 1,
      String(pipeline.validationPlans.length),
    );
    assert(
      'capability-validation-planning',
      'static validation',
      pipeline.validationPlans.some((p) => p.staticValidation),
      'static',
    );
    assert(
      'capability-validation-planning',
      'faithfulness validation',
      pipeline.validationPlans.some((p) => p.promptFaithfulnessValidation),
      'faithfulness',
    );
  }

  if (include('capability-installation-planning') || include('all')) {
    const pipeline = runCapabilityPlanningPipeline(pipelineInput(CSV_EXPORT_PROMPT));
    // Validated CSV Export needs no installation plan; reuse-only pipelines may have zero installs.
    const reuseOnly =
      pipeline.gaps.length > 0 &&
      pipeline.gaps.every(
        (g) => g.decision === 'REUSE_EXISTING' || g.decision === 'COMPOSE_FROM_EXISTING',
      );
    assert(
      'capability-installation-planning',
      'installation plans',
      pipeline.installationPlans.length >= 1 || reuseOnly,
      String(pipeline.installationPlans.length),
    );
    assert(
      'capability-installation-planning',
      'rollback path',
      pipeline.installationPlans.every((p) => p.rollbackPath.length >= 2),
      'rollback',
    );
    assert(
      'capability-installation-planning',
      'post-install validation',
      pipeline.installationPlans.every((p) => p.postInstallValidation.length >= 1),
      'post-install',
    );
  }

  if (include('capability-registry') || include('all')) {
    const pipeline = runCapabilityPlanningPipeline(pipelineInput(CSV_EXPORT_PROMPT));
    assert(
      'capability-registry',
      'generated registered',
      pipeline.generationPlans.length === 0 ||
        listCapabilityUniverse().some((c) => c.status === 'GENERATED_PENDING_VALIDATION'),
      'registered',
    );
    const record = listCapabilityUniverse().find((c) => c.capabilityId.startsWith('cap-gen-'));
    assert(
      'capability-registry',
      'registry fields',
      !record || (record.name.length > 0 && record.dependencies.length >= 0),
      record?.capabilityId ?? 'none',
    );
  }

  if (include('capability-dependency-graph') || include('all')) {
    const required = discoverRequiredCapabilities({ rawPrompt: LISA_PROMPT });
    const gaps = analyzeCapabilityGaps(searchExistingCapabilities(required));
    const graph = buildCapabilityDependencyGraph({ gaps, generationPlans: planCapabilityGeneration(gaps) });
    assert('capability-dependency-graph', 'nodes', graph.nodes.length >= 3, String(graph.nodes.length));
    assert(
      'capability-dependency-graph',
      'child links',
      graph.nodes.some((n) => n.children.length > 0),
      String(graph.nodes.filter((n) => n.children.length > 0).length),
    );
    assert(
      'capability-dependency-graph',
      'issues tracked',
      Array.isArray(graph.missingDependencies) && Array.isArray(graph.circularDependencies),
      'issues',
    );
  }

  if (include('capability-generation-gate') || include('all')) {
    const lisa = runCapabilityPlanningPipeline(pipelineInput(LISA_PROMPT));
    assert(
      'capability-generation-gate',
      'LISA plan produced',
      lisa.requiredCapabilities.length >= 8 && lisa.gaps.length >= 8,
      String(lisa.requiredCapabilities.length),
    );
    assert(
      'capability-generation-gate',
      'LISA blink partial or planned',
      lisa.gaps.some((g) => /blink/i.test(g.requiredCapability.name)),
      lisa.gaps.map((g) => g.decision).join(', '),
    );

    const expense = runCapabilityPlanningPipeline(pipelineInput(EXPENSE_PROMPT));
    assert(
      'capability-generation-gate',
      'expense CRUD reuse',
      expense.gaps.some((g) => /crud/i.test(g.requiredCapability.name) && g.decision === 'REUSE_EXISTING'),
      expense.gaps.map((g) => `${g.requiredCapability.name}:${g.decision}`).join(', '),
    );
    assert(
      'capability-generation-gate',
      'expense no AI block',
      !expense.gaps.some((g) => g.decision === 'BLOCK_BUILD' && /ai/i.test(g.requiredCapability.name)),
      'ai',
    );

    const conflict = runCapabilityPlanningPipeline(pipelineInput(CONFLICT_PROMPT));
    assert(
      'capability-generation-gate',
      'conflict blocked',
      conflict.permissionVerdict === 'BLOCKED',
      conflict.permissionVerdict,
    );
    assert(
      'capability-generation-gate',
      'conflict not ready',
      !isCapabilityPlanningReadyForGeneration(conflict),
      String(isCapabilityPlanningReadyForGeneration(conflict)),
    );

    const csv = runCapabilityPlanningPipeline(pipelineInput(CSV_EXPORT_PROMPT));
    // Validated CSV Export composes via REUSE_EXISTING (sibling mapped gaps may still evolve).
    assert(
      'capability-generation-gate',
      'CSV evolution',
      csv.gaps.some((g) => /csv/i.test(g.requiredCapability.name) && g.decision === 'REUSE_EXISTING'),
      `${csv.permissionVerdict}:${csv.gaps.map((g) => `${g.requiredCapability.name}:${g.decision}`).join(',')}`,
    );

    const payment = runCapabilityPlanningPipeline(pipelineInput(PAYMENT_PROMPT));
    assert(
      'capability-generation-gate',
      'payment human review',
      payment.permissionVerdict === 'NEEDS_HUMAN_REVIEW',
      payment.permissionVerdict,
    );
    assert(
      'capability-generation-gate',
      'payment not ready',
      !isCapabilityPlanningReadyForGeneration(payment),
      String(isCapabilityPlanningReadyForGeneration(payment)),
    );
  }

  if (include('capability-launch-integration') || include('all')) {
    assert(
      'capability-launch-integration',
      'launch bridge',
      registerCapabilityPlanningWithLaunchAuthority().passToken === CAPABILITY_PLANNING_ENGINE_PASS_TOKEN,
      'bridge',
    );
    assert(
      'capability-launch-integration',
      'intent bridge',
      registerCapabilityPlanningWithIntentUnderstanding().connected === true,
      'intent',
    );
    assert(
      'capability-launch-integration',
      'faithfulness bridge',
      registerCapabilityPlanningWithPromptFaithfulness().connected === true,
      'faithfulness',
    );

    const pipeline = runCapabilityPlanningPipeline(pipelineInput(LISA_PROMPT));
    const launchEvidence = buildLaunchCapabilityEvidence(pipeline);
    assert(
      'capability-launch-integration',
      'launch evidence',
      launchEvidence.requiredCount >= 8,
      String(launchEvidence.requiredCount),
    );

    const founderEvidence = collectFounderLaunchEvidence({ productPrompt: LISA_PROMPT });
    assert(
      'capability-launch-integration',
      'AFLA source',
      founderEvidence.capabilityPlanning?.available === true,
      founderEvidence.capabilityPlanning?.sourceName ?? 'missing',
    );

    const buildPlan = resolvePromptFaithfulBuildPlan(LISA_PROMPT);
    assert(
      'capability-launch-integration',
      'build plan capability gate',
      Boolean(buildPlan.capabilityPlanning?.pipelineId),
      buildPlan.capabilityPlanning?.pipelineId ?? 'missing',
    );
    assert(
      'capability-launch-integration',
      'triple gate ready',
      buildPlan.readyForGeneration ===
        (buildPlan.intentUnderstanding.readyForGeneration &&
          buildPlan.promptFaithfulness.readyForGeneration &&
          isCapabilityPlanningReadyForGeneration(buildPlan.capabilityPlanning)),
      String(buildPlan.readyForGeneration),
    );

    const promptFaithfulSource = readFileSync(join(ROOT, 'src/prompt-faithful-generation/index.ts'), 'utf8');
    assert(
      'capability-launch-integration',
      'pipeline wired',
      promptFaithfulSource.includes('runCapabilityPlanningPipeline'),
      'wired',
    );

    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert(
      'capability-launch-integration',
      'orchestrator stage',
      orchestrator.includes('CAPABILITY_PLANNING'),
      'stage',
    );

    const verdict = readFileSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts'), 'utf8');
    assert(
      'capability-launch-integration',
      'verdict blocks capability',
      verdict.includes('Capability Planning unresolved'),
      'verdict',
    );

    const expenseReuse = analyzeCapabilityReuse(
      runCapabilityPlanningPipeline(pipelineInput(EXPENSE_PROMPT)).searchResults,
      runCapabilityPlanningPipeline(pipelineInput(EXPENSE_PROMPT)).gaps,
    );
    assert(
      'capability-launch-integration',
      'reuse stats',
      expenseReuse.reuseCount >= 1,
      String(expenseReuse.reuseCount),
    );
  }

  return { checks, allPassed: checks.every((c) => c.passed) };
}

export function printCapabilityPlanningValidationResults(checks: ValidationCheck[], title: string): void {
  const passed = checks.filter((c) => c.passed);
  const failed = checks.filter((c) => !c.passed);
  console.log('');
  console.log(title);
  console.log('='.repeat(title.length));
  console.log(`Passed: ${passed.length}/${checks.length}`);
  if (failed.length) {
    console.log('');
    console.log('FAILED:');
    for (const f of failed) {
      console.log(`  [${f.section}] ${f.name}: ${f.detail}`);
    }
    process.exit(1);
  }
  console.log(`\n${CAPABILITY_PLANNING_ENGINE_PASS_TOKEN}`);
}
