/**
 * Prompt Faithfulness Engine V2 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2Owner } from '../../src/foundation/ownership-registry.js';
import {
  DEFAULT_FAITHFULNESS_THRESHOLD,
  PROMPT_FAITHFULNESS_ENGINE_V2_PASS_TOKEN,
  PROMPT_FAITHFULNESS_ENGINE_V2_OWNER_MODULE,
  analyzeChangeImpact,
  analyzePromptCompleteness,
  assertArtifactHasLineage,
  assertContractImmutable,
  buildLaunchFaithfulnessEvidence,
  buildPromptEvidenceContract,
  buildPromptKnowledgeGraph,
  buildRequirementRegistry,
  buildTraceabilityLinks,
  calculatePromptFaithfulnessScore,
  detectPromptAmbiguities,
  detectPromptConflicts,
  detectPromptDrift,
  detectUnsupportedAssumptions,
  extractPromptEvidence,
  getActivePromptEvidenceContract,
  getDevPulseV2PromptFaithfulnessEngineV2,
  mapRequirementsToCapabilities,
  parsePrompt,
  registerPromptFaithfulnessWithLaunchAuthority,
  resetPromptFaithfulnessEngineV2ModuleForTests,
  runContinuousFaithfulnessMonitoring,
  runPromptFaithfulnessEngineV2,
} from '../../src/prompt-faithfulness-engine-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { collectFounderLaunchEvidence } from '../../src/autonomous-founder-launch-authority/founder-evidence-collector.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/prompt-faithfulness-engine-v2');

export const LISA_PROMPT = `Build LISA — Locked In Syndrome App.

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

Required interactions: blink simulation control, gaze selection simulation, phrase selection, message composition, speak button, emergency speech button.

Accessibility-first design with high contrast, large touch targets, gaze-friendly UI.

Do not use generic project management fallback.`;

export const EXPENSE_PROMPT =
  'Build ExpenseTracker with income, expenses, balance, categories, reports, charts, CSV export, and finance tracking.';

export const CONFLICT_PROMPT =
  'Build an offline-only expense tracker with real-time cloud synchronization and dashboard tabs.';

export const REQUIRED_FILES = [
  'prompt-faithfulness-registry.ts',
  'prompt-faithfulness-v2-types.ts',
  'prompt-parser.ts',
  'prompt-evidence-extractor.ts',
  'prompt-evidence-contract.ts',
  'prompt-requirement-registry.ts',
  'prompt-knowledge-graph.ts',
  'prompt-capability-mapper.ts',
  'prompt-traceability-engine.ts',
  'prompt-conflict-detector.ts',
  'prompt-ambiguity-detector.ts',
  'prompt-assumption-detector.ts',
  'prompt-completeness-analyzer.ts',
  'prompt-faithfulness-scorer.ts',
  'prompt-drift-detector.ts',
  'prompt-regression-monitor.ts',
  'prompt-change-impact.ts',
  'prompt-contract-report-builder.ts',
  'prompt-faithfulness-authority.ts',
  'prompt-faithfulness-history.ts',
  'index.ts',
];

export interface ValidationCheck {
  section: string;
  name: string;
  passed: boolean;
  detail: string;
}

export function runPromptFaithfulnessV2Validation(sections?: string[]): {
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

  resetPromptFaithfulnessEngineV2ModuleForTests();

  if (include('parser') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('parser', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const parsed = parsePrompt(LISA_PROMPT);
    assert('parser', 'sections parsed', parsed.sections.length >= 1, String(parsed.sections.length));
    assert('parser', 'sentences parsed', parsed.sentences.length >= 3, String(parsed.sentences.length));
    assert('parser', 'prompt hash', parsed.promptHash.length === 16, parsed.promptHash);
  }

  if (include('evidence') || include('all')) {
    const parsed = parsePrompt(LISA_PROMPT);
    const evidence = extractPromptEvidence(parsed);
    assert('evidence', 'evidence extracted', evidence.length >= 10, String(evidence.length));
    assert('evidence', 'has accessibility', evidence.some((e) => e.category === 'ACCESSIBILITY'), 'a11y');
    assert('evidence', 'has functional', evidence.some((e) => e.category === 'FUNCTIONAL'), 'functional');
    assert('evidence', 'evidence has source', evidence.every((e) => e.sourceLocation.length > 0), 'sources');
  }

  if (include('contract') || include('all')) {
    const parsed = parsePrompt(LISA_PROMPT);
    const evidence = extractPromptEvidence(parsed);
    const contract = buildPromptEvidenceContract(parsed, evidence);
    assert('contract', 'immutable', assertContractImmutable(contract), 'immutable');
    assert('contract', 'mandatory reqs', contract.mandatoryRequirements.length >= 5, String(contract.mandatoryRequirements.length));
    assert('contract', 'interaction reqs', contract.interactionRequirements.length >= 1, String(contract.interactionRequirements.length));
  }

  if (include('registry') || include('all')) {
    const parsed = parsePrompt(LISA_PROMPT);
    const contract = buildPromptEvidenceContract(parsed, extractPromptEvidence(parsed));
    const registry = buildRequirementRegistry(contract);
    assert('registry', 'REQ ids', registry.every((r) => /^REQ-\d{3}$/.test(r.requirementId)), 'ids');
    assert('registry', 'registry size', registry.length >= 5, String(registry.length));
    assert('registry', 'acceptance criteria', registry.every((r) => r.acceptanceCriteria.length >= 1), 'criteria');
  }

  if (include('graph') || include('all')) {
    const parsed = parsePrompt(LISA_PROMPT);
    const contract = buildPromptEvidenceContract(parsed, extractPromptEvidence(parsed));
    const registry = buildRequirementRegistry(contract);
    const graph = buildPromptKnowledgeGraph(registry, LISA_PROMPT);
    assert('graph', 'root node', graph.nodes.some((n) => n.nodeId === graph.rootNodeId), graph.rootNodeId);
    assert('graph', 'feature nodes', graph.nodes.filter((n) => n.nodeType === 'FEATURE').length >= 5, 'features');
  }

  if (include('capability') || include('all')) {
    const parsed = parsePrompt(LISA_PROMPT);
    const registry = buildRequirementRegistry(buildPromptEvidenceContract(parsed, extractPromptEvidence(parsed)));
    const mappings = mapRequirementsToCapabilities(registry);
    assert('capability', 'mappings created', mappings.length >= 1, String(mappings.length));
    assert('capability', 'capability chains', mappings.every((m) => m.capabilityChain.length >= 1), 'chains');
  }

  if (include('traceability') || include('all')) {
    const parsed = parsePrompt(LISA_PROMPT);
    const contract = buildPromptEvidenceContract(parsed, extractPromptEvidence(parsed));
    const registry = buildRequirementRegistry(contract);
    const graph = buildPromptKnowledgeGraph(registry, LISA_PROMPT);
    const links = buildTraceabilityLinks(registry, graph, ['eye-tracking-board', 'blink-input-engine']);
    assert('traceability', 'links created', links.length >= 3, String(links.length));
    assert('traceability', 'app lineage', assertArtifactHasLineage(links, 'src/App.tsx'), 'App.tsx');
  }

  if (include('conflict') || include('all')) {
    const conflictParsed = parsePrompt(CONFLICT_PROMPT);
    const conflictContract = buildPromptEvidenceContract(conflictParsed, extractPromptEvidence(conflictParsed));
    const conflicts = detectPromptConflicts(conflictContract);
    assert('conflict', 'conflict detected', conflicts.length >= 1, conflicts[0]?.summary ?? 'none');
  }

  if (include('ambiguity') || include('all')) {
    const ambigParsed = parsePrompt('Build a secure login app with modern UI.');
    const ambiguities = detectPromptAmbiguities(buildPromptEvidenceContract(ambigParsed, extractPromptEvidence(ambigParsed)));
    assert('ambiguity', 'ambiguity detected', ambiguities.length >= 1, ambiguities[0]?.clarificationQuestion ?? 'none');
  }

  if (include('assumption') || include('all')) {
    const expenseParsed = parsePrompt(EXPENSE_PROMPT);
    const contract = buildPromptEvidenceContract(expenseParsed, extractPromptEvidence(expenseParsed));
    const rejected = detectUnsupportedAssumptions(contract, ['AI Financial Assistant']);
    assert('assumption', 'unsupported rejected', rejected.length >= 1 && rejected[0].rejected, rejected[0]?.reason ?? 'none');
    const supported = detectUnsupportedAssumptions(contract, ['expenses', 'reports']);
    assert('assumption', 'supported allowed', supported.length === 0, String(supported.length));
  }

  if (include('completeness') || include('all')) {
    const lisaComplete = analyzePromptCompleteness(
      buildPromptEvidenceContract(parsePrompt(LISA_PROMPT), extractPromptEvidence(parsePrompt(LISA_PROMPT))),
    );
    assert('completeness', 'LISA safe', lisaComplete.safeToGenerate, String(lisaComplete.completenessScore));
  }

  if (include('drift') || include('all')) {
    const result = runPromptFaithfulnessEngineV2(LISA_PROMPT);
    const drift = detectPromptDrift({
      contract: result.contract,
      requirements: result.requirements,
      currentModules: ['projects', 'tasks'],
      currentFaithfulnessScore: result.faithfulnessScore,
    });
    assert('drift', 'drift detected', drift.detected, drift.driftTypes.join(', '));
  }

  if (include('score') || include('all')) {
    const result = runPromptFaithfulnessEngineV2(LISA_PROMPT);
    assert('score', 'score threshold', result.faithfulnessScore.overallScore >= DEFAULT_FAITHFULNESS_THRESHOLD, String(result.faithfulnessScore.overallScore));
    assert('score', 'metrics present', result.faithfulnessScore.metrics.promptCoverage > 0, 'metrics');
  }

  if (include('authority') || include('all')) {
    const authority = getDevPulseV2PromptFaithfulnessEngineV2();
    assert('authority', 'pass token', authority.passToken === PROMPT_FAITHFULNESS_ENGINE_V2_PASS_TOKEN, authority.passToken);
    assert('authority', 'owner', authority.ownerModule === PROMPT_FAITHFULNESS_ENGINE_V2_OWNER_MODULE, authority.ownerModule);
    const owner = getDevPulseV2Owner('prompt_faithfulness_engine_v2');
    assert('authority', 'registry', owner.ownerModule === PROMPT_FAITHFULNESS_ENGINE_V2_OWNER_MODULE, owner.ownerModule);

    const lisa = runPromptFaithfulnessEngineV2(LISA_PROMPT);
    assert('authority', 'LISA ready', lisa.readyForGeneration, lisa.blockedReason ?? 'ready');
    assert('authority', 'contract active', getActivePromptEvidenceContract()?.id === lisa.contract.id, 'active');

    const expense = runPromptFaithfulnessEngineV2(EXPENSE_PROMPT);
    assert('authority', 'expense ready', expense.readyForGeneration, expense.blockedReason ?? 'ready');

    const conflict = runPromptFaithfulnessEngineV2(CONFLICT_PROMPT);
    assert('authority', 'conflict blocks', !conflict.readyForGeneration, conflict.blockedReason ?? 'blocked');

    const monitor = runContinuousFaithfulnessMonitoring({
      trigger: 'AUTONOMOUS_REPAIR',
      contract: lisa.contract,
      requirements: lisa.requirements,
      currentModules: lisa.contract.requirements.map(() => 'eye-tracking-board'),
      previousScore: lisa.faithfulnessScore,
      traceabilityLinkCount: lisa.traceabilityLinks.length,
    });
    assert('authority', 'monitoring', Boolean(monitor.monitoringId), monitor.changeAccepted ? 'accepted' : 'rejected');

    const impact = analyzeChangeImpact({
      changedArtifactPath: 'src/App.tsx',
      traceabilityLinks: lisa.traceabilityLinks,
      requirements: lisa.requirements,
    });
    assert('authority', 'change impact', impact.estimatedRisk !== undefined, impact.estimatedRisk);
  }

  if (include('launch') || include('all')) {
    const result = runPromptFaithfulnessEngineV2(LISA_PROMPT);
    const launchEvidence = buildLaunchFaithfulnessEvidence(result, [
      'onboarding-calibration', 'eye-tracking-board', 'blink-input-engine',
    ]);
    assert('launch', 'launch evidence', launchEvidence.overallFaithfulnessScore > DEFAULT_FAITHFULNESS_THRESHOLD, String(launchEvidence.overallFaithfulnessScore));
    assert('launch', 'bridge', registerPromptFaithfulnessWithLaunchAuthority().usesContract === true, 'bridge');

    const founderEvidence = collectFounderLaunchEvidence({ productPrompt: LISA_PROMPT });
    assert('launch', 'AFLA source', founderEvidence.promptFaithfulness?.available === true, founderEvidence.promptFaithfulness?.sourceName ?? 'missing');
    assert('launch', 'AFLA score', (founderEvidence.promptFaithfulness?.score ?? 0) > 0, String(founderEvidence.promptFaithfulness?.score));

    const plan = resolvePromptFaithfulBuildPlan(LISA_PROMPT);
    assert('launch', 'build plan faithfulness', Boolean(plan.promptFaithfulness?.contract.id), plan.promptFaithfulness?.contract.id ?? 'missing');

    const orchestrator = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    assert('launch', 'orchestrator wired', orchestrator.includes('readyForGeneration'), 'gate');

    const verdict = readFileSync(join(ROOT, 'src/autonomous-founder-launch-authority/founder-verdict-engine.ts'), 'utf8');
    assert('launch', 'verdict blocks drift', verdict.includes('Prompt Faithfulness compromised'), 'verdict');
  }

  return { checks, allPassed: checks.every((c) => c.passed) };
}

export function printValidationResults(checks: ValidationCheck[], title: string): void {
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
  console.log('');
  console.log(PROMPT_FAITHFULNESS_ENGINE_V2_PASS_TOKEN);
}
