/**
 * Phase 25.20B — Clarifying Question Live Gate validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBuildRequest } from '../src/aidev-engine/aidev-engine-authority.js';
import {
  resetDevPulseV2ProjectVaultAuthorityForTests,
  getDevPulseV2ProjectVaultAuthority,
} from '../src/project-vault/project-vault-authority.js';
import { PLANNING_STACK_VALIDATION_REQUEST } from '../src/planning-stack-validation/types.js';
import {
  resetDevPulseV2RequirementExtractorAuthorityForTests,
  getDevPulseV2RequirementExtractorAuthority,
} from '../src/requirement-extractor/requirement-extractor-authority.js';
import {
  CLARIFYING_LIVE_GATE_COMPLETE_FOOD_DELIVERY_ANSWERS,
  CLARIFYING_LIVE_GATE_FOOD_DELIVERY_PROMPT,
  CLARIFYING_LIVE_GATE_SCENARIOS,
  CLARIFYING_QUESTION_LIVE_GATE_PASS_TOKEN,
  evaluateClarifyingLiveGate,
  evaluateWorld2PlanningGate,
  extractRequirementsWithClarifyingGate,
  generateExecutionPlanWithClarifyingGate,
  listClarifyingAnswers,
  resetClarifyingLiveGateMemoryForTests,
  resetClarifyingLiveGateMetricsForTests,
  resolveRequirementGateWithAnswers,
  validateLiveGateAssumptionPrevention,
  validateLiveGateBlocksPlanning,
  validateLiveGateCategoryCount,
  validateLiveGateDeterministicOutput,
  validateLiveGateNoDuplicateQuestions,
  validateLiveGateQuestionsGenerated,
  validateLiveGateReadOnly,
  validateLiveGateUnblocksAfterAnswers,
} from '../src/clarifying-question-intelligence/index.js';
import type { LiveGateCategoryId } from '../src/clarifying-question-intelligence/index.js';
import type { PlannerInput } from '../src/world2-execution-planner/types.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 60_000;

const REQUIRED_FILES = [
  'src/clarifying-question-intelligence/clarifying-question-live-gate-types.ts',
  'src/clarifying-question-intelligence/clarifying-question-live-gate-categories.ts',
  'src/clarifying-question-intelligence/clarifying-question-live-gate-memory.ts',
  'src/clarifying-question-intelligence/clarifying-question-live-gate.ts',
  'src/clarifying-question-intelligence/clarifying-question-live-gate-validator.ts',
  'src/clarifying-question-intelligence/clarifying-question-live-gate-scenarios.ts',
  'src/clarifying-question-intelligence/clarifying-question-aidev-bridge.ts',
  'src/clarifying-question-intelligence/clarifying-question-world2-bridge.ts',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function main(): void {
  console.log('');
  console.log('Clarifying Question Live Gate — Validation (leaf mode)');
  console.log('====================================================');
  console.log('');

  resetClarifyingLiveGateMemoryForTests();
  resetClarifyingLiveGateMetricsForTests();
  resetDevPulseV2ProjectVaultAuthorityForTests();
  resetDevPulseV2RequirementExtractorAuthorityForTests();

  for (const rel of REQUIRED_FILES) {
    assert(`file ${rel}`, existsSync(join(ROOT, rel)), rel);
  }
  checkpoint('required files');

  assert('01. live gate category count', validateLiveGateCategoryCount().passed, validateLiveGateCategoryCount().detail);

  const blocked = evaluateClarifyingLiveGate({ userPrompt: CLARIFYING_LIVE_GATE_FOOD_DELIVERY_PROMPT });
  const blockedAgain = evaluateClarifyingLiveGate({ userPrompt: CLARIFYING_LIVE_GATE_FOOD_DELIVERY_PROMPT });
  assert('02. planning blocked when critical info missing', blocked.planningBlocked, String(blocked.planningBlocked));
  assert('03. questions generated', validateLiveGateQuestionsGenerated(blocked).passed, String(blocked.recommendedQuestions.length));
  assert('04. assumption prevention events', validateLiveGateAssumptionPrevention(blocked).passed, String(blocked.assumptionsPreventedEvents.length));
  assert('05. blocks planning gate decision', validateLiveGateBlocksPlanning(blocked).passed, blocked.gateDecision);
  assert('06. deterministic output', validateLiveGateDeterministicOutput(blocked, blockedAgain).passed, blocked.cacheKey);
  assert('07. read only gate', validateLiveGateReadOnly(blocked).passed, String(blocked.readOnly));
  assert('08. no duplicate questions', validateLiveGateNoDuplicateQuestions(blocked).passed, String(blocked.recommendedQuestions.length));
  assert(
    '09. contextual food delivery roles question',
    blocked.recommendedQuestions.some((item) => /customers|drivers|restaurants/i.test(item.question)),
    blocked.recommendedQuestions.map((item) => item.question).join(' | '),
  );

  const vault = getDevPulseV2ProjectVaultAuthority();
  const project = vault.createProject('Food Delivery Clarification', 'Live gate validation project');
  const request = createBuildRequest(CLARIFYING_LIVE_GATE_FOOD_DELIVERY_PROMPT);
  const answers = Object.entries(CLARIFYING_LIVE_GATE_COMPLETE_FOOD_DELIVERY_ANSWERS).map(([categoryId, answer]) => ({
    categoryId: categoryId as LiveGateCategoryId,
    answer,
  }));
  const resolved = resolveRequirementGateWithAnswers({
    request,
    projectId: project.projectId,
    answers,
  });
  assert('10. answers stored', listClarifyingAnswers({ projectId: project.projectId }).length > 0, String(listClarifyingAnswers({ projectId: project.projectId }).length));
  assert('11. planning resumes after clarification', validateLiveGateUnblocksAfterAnswers(blocked, resolved.gate).passed, String(resolved.blocked));
  assert('12. extraction proceeds after clarification', !resolved.blocked && (resolved.extraction?.requirements.length ?? 0) > 0, String(resolved.extraction?.requirements.length ?? 0));
  assert('13. no silent assumption generation', !resolved.extraction?.requirements.some((item) => /assume|default/i.test(item.value)), 'requirements');

  const extractor = getDevPulseV2RequirementExtractorAuthority();
  const gatedExtraction = extractor.extractFromAiDevRequest(createBuildRequest(CLARIFYING_LIVE_GATE_FOOD_DELIVERY_PROMPT));
  assert('14. requirement extractor blocks vague prompt', gatedExtraction.errors.includes('CLARIFICATION_REQUIRED'), gatedExtraction.errors.join(','));

  const clarifiedExtraction = extractor.extractFromAiDevRequest(request, { projectId: project.projectId });
  assert('15. requirement extractor proceeds when clarified', clarifiedExtraction.errors.length === 0, clarifiedExtraction.errors.join(','));

  const planningStackRequest = createBuildRequest(PLANNING_STACK_VALIDATION_REQUEST);
  const planningStackGate = extractRequirementsWithClarifyingGate({
    request: planningStackRequest,
    projectId: project.projectId,
  });
  assert('16. planning stack request passes live gate', !planningStackGate.blocked, String(planningStackGate.blocked));

  for (const scenario of CLARIFYING_LIVE_GATE_SCENARIOS.slice(0, 7)) {
    const scenarioResult = evaluateClarifyingLiveGate({ userPrompt: scenario.prompt });
    assert(
      `17.${scenario.id} blocked=${scenario.expectedBlocked}`,
      scenarioResult.planningBlocked === scenario.expectedBlocked,
      `${scenarioResult.planningBlocked}`,
    );
  }

  const authoritySource = readFileSync(
    join(ROOT, 'src/clarifying-question-intelligence/clarifying-question-live-gate.ts'),
    'utf8',
  );
  const requirementBridge = readFileSync(
    join(ROOT, 'src/clarifying-question-intelligence/clarifying-question-aidev-bridge.ts'),
    'utf8',
  );
  const world2Bridge = readFileSync(
    join(ROOT, 'src/clarifying-question-intelligence/clarifying-question-world2-bridge.ts'),
    'utf8',
  );
  const world2Planner = readFileSync(
    join(ROOT, 'src/world2-execution-planner/world2-execution-planner.ts'),
    'utf8',
  );
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };

  assert('18. no random generation', !authoritySource.includes('Math.random'), 'deterministic');
  assert('19. no nested npm validate', !authoritySource.includes('npm run validate'), 'no cascade');
  assert('20. aidev bridge wired', requirementBridge.includes('CLARIFICATION_REQUIRED'), 'bridge');
  assert('21. world2 bridge wired', world2Bridge.includes('generateExecutionPlanWithClarifyingGate'), 'bridge');
  assert('22. world2 planner uses gate', world2Planner.includes('generateExecutionPlanWithClarifyingGate'), 'planner');
  assert('23. npm script', Boolean(pkg.scripts?.['validate:clarifying-question-live-gate']), 'package script');

  const world2Input: PlannerInput = {
    projectGoal: CLARIFYING_LIVE_GATE_FOOD_DELIVERY_PROMPT,
    projectVision: 'Deliver food reliably',
    projectType: 'FOOD_DELIVERY',
    workspaceId: 'world2-workspace-live-gate',
    projectId: 'world2-unclarified-food-delivery',
    constraints: [],
    requirements: [],
  };
  const world2Blocked = evaluateWorld2PlanningGate(world2Input);
  assert('24. world2 blocks vague planning', world2Blocked.planningBlocked, String(world2Blocked.planningBlocked));

  checkpoint('complete');

  const failed = results.filter((item) => !item.passed);
  console.log(`Scenarios: ${results.length}`);
  console.log(`Passed: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    for (const item of failed) {
      console.log(`  ✗ ${item.name}: ${item.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(CLARIFYING_QUESTION_LIVE_GATE_PASS_TOKEN);
  console.log('');
  console.log('npm run validate:clarifying-question-live-gate');
}

main();
