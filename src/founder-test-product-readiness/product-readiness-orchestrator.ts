/**
 * Phase 26.5 — Full product readiness simulation orchestrator.
 * Phase 26.46 — Bounded chat stress, fixture cache, honest partial results.
 */

import { assessFounderTestIntegration } from '../founder-test-integration/index.js';
import type { FounderTestAssessment, FounderTestAuthorityResult } from '../founder-test-integration/founder-test-integration-types.js';
import {
  recoverFounderTestChatStressSimulationFromSettlement,
  runFounderTestChatStressSimulation,
} from '../founder-test-chat-stress-simulation/index.js';
import { runChatStressNonBlockingForFounderTest } from '../founder-test-chat-stress-simulation/chat-stress-non-blocking-founder-test.js';
import {
  recordIntakeCompletionBoundaryOperation,
  recordProductReadinessSimulationCompleteEmitted,
  hasProductReadinessSimulationCompletePropagated,
} from '../founder-test-chat-stress-simulation/chat-stress-completion-propagation.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import { CURRENT_PRODUCT_NAME, usesDevPulseAsCurrentIdentity } from '../identity-foundation/legacy-product-identity.js';
import {
  loadProductMemoryFoundationsCached,
  loadProductReadinessShellCached,
} from './product-readiness-fixture-cache.js';
import {
  createSimulationBudgetTracker,
  SIMULATION_BUDGET_MS,
  type SimulationRuntimeHealth,
} from './product-readiness-simulation-budget.js';
import {
  PRODUCT_READINESS_PROPAGATION_COMPLETE,
  PRODUCT_READINESS_PROPAGATION_FAILURE,
  PRODUCT_READINESS_PROPAGATION_STEP,
  propagateProductReadinessAfterCompletionBoundary,
  waitForProductReadinessCompletionBoundary,
} from './product-readiness-propagation.js';
import {
  emitProductReadinessPathMismatchIfNeeded,
  emitRealFounderPathDiagnostic,
  isProductReadinessCompletionCheckSatisfied,
  markRealFounderCompletionTailCompleted,
  markRealFounderCompletionTailInvoked,
  observeRealFounderCompletionCheck,
  REAL_FOUNDER_PRODUCT_READINESS_PATH_SELECTED,
  REAL_FOUNDER_STAGE2_EXIT_CONFIRMED,
  recordProductReadinessCompletionMechanism,
  selectProductReadinessRuntimePath,
} from './product-readiness-real-founder-path.js';
import { retrieveDevPulseIntelligenceSnapshot } from '../world-class-chat-brain/devpulse-intelligence-adapter.js';
import {
  resetProductReadinessCompletionCheckEmissionForTests,
  CHAT_STRESS_SETTLEMENT_DRAIN_GRACE_MS,
  emitProductReadinessCompletionDiagnostic,
  PRODUCT_READINESS_COMPLETED,
  PRODUCT_READINESS_FORCED_COMPLETION,
  reconcileProductReadinessCompletionCheck,
  shouldForceCompleteProductReadiness,
} from './product-readiness-completion-boundary.js';
import {
  emitProductReadinessCompleteOnce,
} from '../product-readiness-completion-boundary-repair/product-readiness-completion-boundary-repair-authority.js';
import { getChatStressCompletionSnapshot } from '../founder-test-chat-stress-simulation/chat-stress-completion-tracker.js';
import { emitChatStressSimulationCompleteBoundaryIfNeeded } from '../founder-test-chat-stress-simulation/chat-stress-settlement-boundary.js';
import { isProductReadinessRule1Satisfied } from '../product-readiness-completion-boundary-repair/chat-stress-settlement-auditor.js';
import { recordProductReadinessAssessment } from './product-readiness-history.js';
import {
  attachWeights,
  buildWeightedReadinessScore,
  CHAT_INTELLIGENCE_LAUNCH_GATE,
  simulationVerdictFromScore,
  verdictFromScore,
} from './product-readiness-score-builder.js';
import type {
  ProductReadinessAssessment,
  ProductReadinessAutomaticBlocker,
  ProductReadinessReport,
  ProductReadinessSelfEvolution,
  ProductReadinessSimulationResult,
  RunProductReadinessSimulationInput,
} from './product-readiness-types.js';

let runCounter = 0;

export function resetProductReadinessSimulationForTests(): void {
  runCounter = 0;
  resetProductReadinessCompletionCheckEmissionForTests();
}

function nextRunId(): string {
  runCounter += 1;
  return `product-readiness-${runCounter}-${Date.now()}`;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function authorityScore(results: FounderTestAuthorityResult[], id: string, fallback = 50): number {
  return results.find((r) => r.authorityId === id)?.normalizedScore ?? fallback;
}

function categoryChatScore(report: ChatStressSimulationReport | null, category: string): number | null {
  if (!report) return null;
  const entries = report.evaluations.filter((e) => e.category === category);
  if (!entries.length) return null;
  return Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length);
}

function loadShell(rootDir: string): { html: string; appJs: string } {
  return loadProductReadinessShellCached(rootDir);
}

function sim(
  id: ProductReadinessSimulationResult['id'],
  label: string,
  score: number,
  topFailures: string[],
  recommendedFixes: string[],
  evidenceNotes: string[] = [],
): Omit<ProductReadinessSimulationResult, 'weightPercent' | 'weightedContribution'> {
  return {
    readOnly: true,
    id,
    label,
    score: clamp(score),
    verdict: simulationVerdictFromScore(clamp(score)),
    topFailures,
    recommendedFixes,
    evidenceNotes,
  };
}

function buildSimulations(input: {
  rootDir: string;
  founderTest: FounderTestAssessment;
  chatStress: ChatStressSimulationReport | null;
  snapshot: ReturnType<typeof retrieveDevPulseIntelligenceSnapshot>;
}): Omit<ProductReadinessSimulationResult, 'weightPercent' | 'weightedContribution'>[] {
  const { founderTest, chatStress, snapshot, rootDir } = input;
  const results = founderTest.run.authorityResults;
  const shell = loadShell(rootDir);
  const memory = loadProductMemoryFoundationsCached('what are we building');

  const chatOverall = chatStress?.overallScore ?? 65;
  const identityChat = categoryChatScore(chatStress, 'IDENTITY') ?? chatOverall;
  const skepticalChat = categoryChatScore(chatStress, 'SKEPTICAL_USER') ?? chatOverall;
  const softwareChat = categoryChatScore(chatStress, 'SOFTWARE_CREATION') ?? chatOverall;
  const frustratedChat = categoryChatScore(chatStress, 'EDGE_CASE') ?? chatOverall;
  const productChat = categoryChatScore(chatStress, 'PRODUCT_UNDERSTANDING') ?? chatOverall;
  const verificationChat = categoryChatScore(chatStress, 'VERIFICATION_LAUNCH') ?? chatOverall;

  const workflowScore = authorityScore(results, 'FOUNDER_REALITY', 55);
  const executionScore = Math.round(
    (authorityScore(results, 'EXECUTION_PROOF_EVOLUTION', 45) +
      (founderTest.executionProofSummary?.overallFounderProofPercent ?? 40)) /
      2,
  );
  const verificationAuthority = authorityScore(results, 'VERIFICATION_REALITY', 50);
  const previewScore = authorityScore(results, 'LIVE_PREVIEW_REALITY', 45);
  const uiScore = authorityScore(results, 'UI_REALITY', 60);

  const executionProven =
    founderTest.executionProofSummary?.founderExecutionState === 'FOUNDER_EXECUTION_PROVEN' ||
    founderTest.executionProofSummary?.founderExecutionState === 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS' ||
    /CONNECTED|PROVEN|PASS/i.test(snapshot.executionConnected.status);

  const navTargets = [
    { label: 'Chat / Command Center', pattern: /data-view="command-center"/i },
    { label: 'Projects', pattern: /data-view="projects"/i },
    { label: 'Verification', pattern: /data-view="verification"/i },
    { label: 'Founder Test', pattern: /run-founder-test|Run Founder Test/i },
    { label: 'Live Preview', pattern: /live-preview|Live Preview/i },
    { label: 'Notifications', pattern: /data-view="notifications"/i },
  ];
  const navFound = navTargets.filter((t) => t.pattern.test(shell.html) || t.pattern.test(shell.appJs));
  const navScore = clamp(Math.round((navFound.length / navTargets.length) * 100));

  const onboardingSignals = [
    /Ask AiDevEngine/i.test(shell.html),
    /nav-help/i.test(shell.html),
    /Command Center/i.test(shell.html),
    memory.diagnostics.productLoaded,
  ];
  const firstTimeScore = clamp(
    Math.round((onboardingSignals.filter(Boolean).length / onboardingSignals.length) * 70 + uiScore * 0.3),
  );

  const journeySteps = [
    { step: 'Product idea / chat entry', ok: /chat-input|Command Center/i.test(shell.html) },
    { step: 'Requirements / planning signals', ok: /project|requirement|plan/i.test(shell.appJs) },
    { step: 'Build attempt path', ok: /autonomous-builder|build/i.test(shell.html) },
    { step: 'Preview surface', ok: /preview|live-preview/i.test(shell.html) },
    { step: 'Verification surface', ok: /verification/i.test(shell.html) },
    { step: 'Launch readiness / Founder Test', ok: /founder-test|launch readiness/i.test(shell.html + shell.appJs) },
  ];
  const journeyOk = journeySteps.filter((s) => s.ok).length;
  const journeyScore = clamp(Math.round((journeyOk / journeySteps.length) * 100));

  const identityBundle = memory.diagnostics;
  const identityScore = clamp(
    Math.round(
      (identityChat +
        (identityBundle.identityLoaded ? 20 : 0) +
        (identityBundle.founderLoaded ? 15 : 0) +
        (identityBundle.productLoaded ? 15 : 0)) /
        1.5,
    ),
  );

  const memoryScore = clamp(
    Math.round(
      (productChat +
        (memory.diagnostics.historyLoaded ? 15 : 0) +
        (memory.productText.includes(CURRENT_PRODUCT_NAME) ? 20 : 0)) /
        1.2,
    ),
  );

  const claims: Array<{ claim: string; proven: boolean; note: string }> = [
    {
      claim: 'AiDevEngine can help create software',
      proven: chatOverall >= 70 && journeyScore >= 55,
      note: 'journey + chat quality',
    },
    {
      claim: 'AiDevEngine understands project history',
      proven: memoryScore >= 70 && memory.diagnostics.historyLoaded,
      note: 'project memory foundation',
    },
    {
      claim: 'AiDevEngine provides launch readiness guidance',
      proven: verificationChat >= 65 && /founder-test/i.test(shell.html + shell.appJs),
      note: 'verification + founder test surfaces',
    },
    {
      claim: 'Execution proof is connected',
      proven: executionProven,
      note: snapshot.executionConnected.detail,
    },
    {
      claim: 'AiDevEngine identity is consistent',
      proven: identityScore >= 80 && !usesDevPulseAsCurrentIdentity(memory.productText),
      note: 'identity foundation',
    },
  ];
  const claimViolations = claims.filter((c) => !c.proven);
  const claimScore = clamp(Math.round(((claims.length - claimViolations.length) / claims.length) * 100));

  const launchDayScore = clamp(
    Math.round(firstTimeScore * 0.25 + chatOverall * 0.25 + verificationAuthority * 0.2 + journeyScore * 0.15 + frustratedChat * 0.15),
  );

  return [
    sim(
      'FIRST_TIME_USER',
      'First-Time User Simulation',
      firstTimeScore,
      firstTimeScore < 80 ? ['Onboarding clarity still uneven for brand-new users'] : [],
      ['Add clearer first-prompt guidance and product explanation above chat input'],
      [`Nav help present: ${/nav-help/.test(shell.html)}`, `UI reality score: ${uiScore}`],
    ),
    sim(
      'PRODUCT_CREATION_JOURNEY',
      'Product Creation Journey Simulation',
      journeyScore,
      journeySteps.filter((s) => !s.ok).map((s) => `Missing or weak: ${s.step}`),
      ['Connect journey steps with explicit in-product transitions and status'],
      journeySteps.map((s) => `${s.step}: ${s.ok ? 'present' : 'gap'}`),
    ),
    sim(
      'CHAT_INTELLIGENCE',
      'Chat Intelligence Simulation',
      chatOverall,
      chatStress?.failedAnswers.slice(0, 3).map((e) => e.prompt) ?? ['Chat stress not run'],
      chatStress?.recommendedNextChatImprovements.slice(0, 3) ?? ['Run chat stress simulation'],
      chatStress ? [`${chatStress.passedCount}/${chatStress.totalScenarios} passed`] : ['No chat stress data'],
    ),
    sim(
      'SKEPTICAL_FOUNDER',
      'Skeptical Founder Simulation',
      skepticalChat,
      skepticalChat < 80 ? ['Trust and differentiation answers need stronger evidence'] : [],
      ['Answer skepticism with proof-backed differentiation, not generic AI claims'],
    ),
    sim(
      'INVESTOR',
      'Investor Simulation',
      clamp(Math.round((identityScore + productChat + (100 - claimViolations.length * 15)) / 2.5)),
      claimViolations.length ? ['Strategic positioning not fully evidenced'] : [],
      ['Prepare concise value prop, moat, and risk disclosure from product memory'],
    ),
    sim(
      'NON_TECHNICAL_USER',
      'Non-Technical User Simulation',
      clamp(Math.round((firstTimeScore + chatOverall) / 2)),
      firstTimeScore < 75 ? ['Non-coders may still hit jargon or dead ends'] : [],
      ['Use plain-language planning prompts and reassure users who cannot code'],
    ),
    sim(
      'POWER_USER',
      'Power User Simulation',
      softwareChat,
      softwareChat < 80 ? ['Complex product requests may lack scalable planning depth'] : [],
      ['Improve advanced requirement extraction for CRM/SaaS/marketplace prompts'],
    ),
    sim(
      'FRUSTRATED_USER',
      'Frustrated User Simulation',
      frustratedChat,
      frustratedChat < 75 ? ['Recovery responses may not de-escalate frustration well enough'] : [],
      ['Add explicit recovery, escalation, and next-step guidance on failure prompts'],
    ),
    sim(
      'EXECUTION_REALITY',
      'Execution Reality Simulation',
      executionProven ? Math.max(executionScore, 75) : Math.min(executionScore, 58),
      executionProven ? [] : ['Execution proof not fully proven — workspace/build/runtime/preview chain incomplete'],
      ['Prove connected execution with Founder Execution Proof before launch claims'],
      [snapshot.executionConnected.detail, `Preview score: ${previewScore}`],
    ),
    sim(
      'VERIFICATION',
      'Verification Simulation',
      clamp(Math.round((verificationAuthority + verificationChat) / 2)),
      verificationAuthority < 70 ? ['Users may not understand pass/fail/next steps clearly'] : [],
      ['Surface UVL results in founder language with explicit next actions'],
      [snapshot.verificationReality.detail],
    ),
    sim(
      'PROJECT_MEMORY',
      'Project Memory Simulation',
      memoryScore,
      memoryScore < 75 ? ['Project history and state answers still bounded'] : [],
      ['Expand dynamic project memory beyond registry summaries'],
      [`History loaded: ${memory.diagnostics.historyLoaded}`],
    ),
    sim(
      'IDENTITY',
      'Identity Simulation',
      identityScore,
      identityScore < 85 ? ['Identity consistency still maturing across prompts'] : [],
      ['Keep AiDevEngine / Asgard Dynamics / Lungelo Richard Zungu answers consistent'],
    ),
    sim(
      'UI_NAVIGATION',
      'UI Navigation Simulation',
      navScore,
      navTargets.filter((t) => !navFound.includes(t)).map((t) => `Hard to find: ${t.label}`),
      ['Reduce navigation friction to Chat, Projects, Verification, Founder Test, Preview'],
      navFound.map((t) => t.label),
    ),
    sim(
      'CLAIM_VS_REALITY',
      'Claim vs Reality Simulation',
      claimScore,
      claimViolations.map((c) => `Unsupported: ${c.claim}`),
      claimViolations.map((c) => `Prove or soften claim: ${c.claim} (${c.note})`),
      claims.map((c) => `${c.claim}: ${c.proven ? 'PRESENT' : 'MISSING'}`),
    ),
    sim(
      'LAUNCH_DAY',
      'Launch Day Simulation',
      launchDayScore,
      launchDayScore < 70 ? ['If 100 users arrived today, onboarding/chat/trust gaps would cause drop-off'] : [],
      ['Run launch-day drills on onboarding, chat, verification, and recovery paths'],
      [`Composite from first-time, chat, verification, journey, frustration scores`],
    ),
  ];
}

function buildAutomaticBlockers(input: {
  chatScore: number;
  executionProven: boolean;
  launchDayScore: number;
  claimScore: number;
  founderReviewerConfidence: number | null;
  simulationDegradedPartial: boolean;
  simulationRuntimeHealth: SimulationRuntimeHealth;
}): ProductReadinessAutomaticBlocker[] {
  const blockers: ProductReadinessAutomaticBlocker[] = [];
  if (input.simulationDegradedPartial) {
    blockers.push({
      readOnly: true,
      id: 'simulation-partial-result',
      explanation: `Product readiness simulation returned a partial/degraded result (${input.simulationRuntimeHealth}).`,
      recommendedAction:
        'Re-run full product readiness and chat stress simulation outside Founder Test budget before trusting launch readiness.',
    });
  }
  if (input.chatScore < CHAT_INTELLIGENCE_LAUNCH_GATE) {
    blockers.push({
      readOnly: true,
      id: 'chat-score-gate',
      explanation: `Chat intelligence score ${input.chatScore}/100 is below launch gate ${CHAT_INTELLIGENCE_LAUNCH_GATE}.`,
      recommendedAction: 'Fix chat stress failures before launch — users will hit weak answers immediately.',
    });
  }
  if (!input.executionProven) {
    blockers.push({
      readOnly: true,
      id: 'execution-not-proven',
      explanation: 'Execution reality is not proven — build/runtime/preview evidence is incomplete.',
      recommendedAction: 'Connect and prove Founder Execution Proof before promising software creation outcomes.',
    });
  }
  if (input.launchDayScore < 65) {
    blockers.push({
      readOnly: true,
      id: 'launch-day-critical',
      explanation: `Launch day simulation score ${input.launchDayScore}/100 indicates critical operational risks.`,
      recommendedAction: 'Address onboarding collapse, trust, and recovery risks before inviting users.',
    });
  }
  if (input.claimScore < 70) {
    blockers.push({
      readOnly: true,
      id: 'claim-vs-reality',
      explanation: 'Public-facing claims exceed available evidence (claim vs reality violations).',
      recommendedAction: 'Soften or prove major product claims before launch marketing.',
    });
  }
  if (input.founderReviewerConfidence !== null && input.founderReviewerConfidence < 65) {
    blockers.push({
      readOnly: true,
      id: 'founder-reviewer-confidence',
      explanation: `Founder reviewer confidence ${input.founderReviewerConfidence}/100 is too low for launch.`,
      recommendedAction: 'Resolve founder acceptance and reviewer confidence gaps first.',
    });
  }
  return blockers;
}

interface CompleteProductReadinessContext {
  rootDir: string;
  founderTest: FounderTestAssessment;
  chatStress: ChatStressSimulationReport | null;
  budget: ReturnType<typeof createSimulationBudgetTracker>;
  simulationBudgetNotes: string[];
  founderReviewerConfidence: number | null;
  onSimulationTrace?: RunProductReadinessSimulationInput['onSimulationTrace'];
  forced?: boolean;
}

function completeProductReadinessAssessment(
  input: CompleteProductReadinessContext,
): ProductReadinessAssessment {
  const { rootDir, founderTest, chatStress, budget, simulationBudgetNotes, onSimulationTrace } = input;
  const budgetSnap = budget.snapshot();
  if (budgetSnap.health === 'SIMULATION_SLOW') {
    onSimulationTrace?.({
      operationId: 'product-readiness-simulation-slow',
      operationLabel: budgetSnap.reason ?? 'Product readiness simulation slow',
      phase: 'SLOW',
    });
  }
  if (budgetSnap.health === 'SIMULATION_STALLED' || budgetSnap.health === 'SIMULATION_BUDGET_EXCEEDED') {
    onSimulationTrace?.({
      operationId: 'product-readiness-simulation-stalled',
      operationLabel:
        budgetSnap.health === 'SIMULATION_BUDGET_EXCEEDED'
          ? (budgetSnap.reason ?? 'Product readiness simulation budget exceeded — continuing with degraded evidence')
          : (budgetSnap.reason ?? 'Product readiness simulation stalled'),
      phase: budgetSnap.health === 'SIMULATION_BUDGET_EXCEEDED' ? 'BUDGET_EXCEEDED' : 'STALLED',
    });
  }

  const snapshot = retrieveDevPulseIntelligenceSnapshot(rootDir);
  onSimulationTrace?.({
    operationId: 'building-product-readiness-scoring',
    operationLabel: 'Building product readiness simulation scores',
    phase: 'RUNNING',
  });
  const executionProven =
    founderTest.executionProofSummary?.founderExecutionState === 'FOUNDER_EXECUTION_PROVEN' ||
    founderTest.executionProofSummary?.founderExecutionState === 'FOUNDER_EXECUTION_PROVEN_WITH_WARNINGS' ||
    /CONNECTED|PROVEN|PASS/i.test(snapshot.executionConnected.status);

  const rawSimulations = buildSimulations({ rootDir, founderTest, chatStress, snapshot });
  const simulations = attachWeights(rawSimulations);
  const readinessScore = buildWeightedReadinessScore(simulations);
  let verdict = verdictFromScore(readinessScore);

  onSimulationTrace?.({
    operationId: 'building-product-readiness-scoring',
    operationLabel: 'Building product readiness simulation scores',
    phase: 'PASSED',
  });

  const launchDaySim = simulations.find((s) => s.id === 'LAUNCH_DAY');
  const claimSim = simulations.find((s) => s.id === 'CLAIM_VS_REALITY');
  const simulationDegradedPartial =
    chatStress?.degradedPartialResult === true ||
    chatStress?.runtimeHealth === 'DEGRADED_INCOMPLETE' ||
    budgetSnap.budgetExceeded;
  const simulationRuntimeHealth =
    chatStress?.runtimeHealth && chatStress.runtimeHealth !== 'HEALTHY'
      ? chatStress.runtimeHealth
      : budgetSnap.health;
  if (simulationDegradedPartial) {
    simulationBudgetNotes.push(
      `Product readiness completed with ${simulationRuntimeHealth} — partial scoring from executed work only.`,
    );
  }

  const automaticBlockers = buildAutomaticBlockers({
    chatScore: chatStress?.overallScore ?? 0,
    executionProven,
    launchDayScore: launchDaySim?.score ?? 0,
    claimScore: claimSim?.score ?? 0,
    founderReviewerConfidence: input.founderReviewerConfidence ?? null,
    simulationDegradedPartial,
    simulationRuntimeHealth,
  });

  const launchBlocked = automaticBlockers.length > 0 || verdict === 'LAUNCH_BLOCKED';
  if (launchBlocked && verdict === 'LAUNCH_READY') verdict = 'LAUNCH_READY_WITH_WARNINGS';
  if (launchBlocked && (verdict === 'LAUNCH_READY_WITH_WARNINGS' || verdict === 'NOT_YET_LAUNCH_READY')) {
    verdict = 'LAUNCH_BLOCKED';
  }

  const report: ProductReadinessReport = {
    readOnly: true,
    advisoryOnly: true,
    runId: nextRunId(),
    generatedAt: new Date().toISOString(),
    coreQuestion: 'Would real users succeed with AiDevEngine today?',
    readinessScore,
    verdict,
    launchBlocked,
    automaticBlockers,
    simulations,
    selfEvolution: buildSelfEvolution(simulations, automaticBlockers),
    chatStressSimulation: chatStress,
    founderTestScore: founderTest.score.overall,
    simulationRuntimeHealth,
    simulationBudgetElapsedMs: budgetSnap.elapsedMs,
    simulationDegradedPartial,
    simulationBudgetNotes,
  };

  recordIntakeCompletionBoundaryOperation('product-readiness-simulation-complete');
  onSimulationTrace?.({
    operationId: 'product-readiness-simulation-complete',
    operationLabel: simulationDegradedPartial
      ? `Product readiness simulation complete (${simulationRuntimeHealth})`
      : 'Product readiness simulation complete',
    phase: 'PASSED',
  });
  recordProductReadinessSimulationCompleteEmitted();
  onSimulationTrace?.({
    operationId: 'product-readiness-simulation-complete-emitted',
    operationLabel: 'Product readiness simulation complete emitted',
    phase: 'PASSED',
  });
  emitProductReadinessCompletionDiagnostic(
    { onSimulationTrace },
    input.forced ? PRODUCT_READINESS_FORCED_COMPLETION : PRODUCT_READINESS_COMPLETED,
    input.forced
      ? `forced completion after settlement (score=${readinessScore})`
      : `product readiness simulation complete (score=${readinessScore})`,
    'PASSED',
  );
  emitProductReadinessCompleteOnce({ onSimulationTrace });

  const assessment: ProductReadinessAssessment = {
    readOnly: true,
    advisoryOnly: true,
    report,
  };

  recordProductReadinessAssessment(assessment);
  return assessment;
}

/** Shared completion tail — must run once completionBoundary=true is observed. */
export async function invokeProductReadinessCompletionTail(
  input: RunProductReadinessSimulationInput & {
    founderTest: FounderTestAssessment;
    chatStress: ChatStressSimulationReport | null;
    budget: ReturnType<typeof createSimulationBudgetTracker>;
    simulationBudgetNotes: string[];
    chatStressForced?: boolean;
  },
): Promise<ProductReadinessAssessment> {
  observeRealFounderCompletionCheck(input);
  markRealFounderCompletionTailInvoked(input);

  input.onSimulationTrace?.({
    operationId: PRODUCT_READINESS_PROPAGATION_STEP,
    operationLabel: `${PRODUCT_READINESS_PROPAGATION_STEP}: invoking completion tail`,
    phase: 'PASSED',
  });

  let chatStress = input.chatStress;
  let forced = input.chatStressForced ?? false;
  if (
    !chatStress &&
    (isProductReadinessCompletionCheckSatisfied() || shouldForceCompleteProductReadiness())
  ) {
    const recovered = await recoverFounderTestChatStressSimulationFromSettlement({
      rootDir: input.rootDir ?? process.cwd(),
      maxScenarios: input.chatStressMaxScenarios,
      founderTestContext: input.founderTestContext !== false,
      budgetMs: input.budget.remainingMs(),
      onTrace: input.onSimulationTrace,
    });
    chatStress = recovered?.report ?? null;
    if (chatStress) {
      forced = true;
    }
  }

  input.onSimulationTrace?.({
    operationId: PRODUCT_READINESS_PROPAGATION_COMPLETE,
    operationLabel: `${PRODUCT_READINESS_PROPAGATION_COMPLETE}: ready for ${PRODUCT_READINESS_COMPLETED}`,
    phase: 'PASSED',
  });

  const assessment = completeProductReadinessAssessment({
    rootDir: input.rootDir ?? process.cwd(),
    founderTest: input.founderTest,
    chatStress,
    budget: input.budget,
    simulationBudgetNotes: input.simulationBudgetNotes,
    founderReviewerConfidence: input.founderReviewerConfidence ?? null,
    onSimulationTrace: input.onSimulationTrace,
    forced,
  });

  markRealFounderCompletionTailCompleted(
    input,
    `product-readiness-simulation-complete score=${assessment.report.readinessScore}`,
  );
  if (input.productReadinessRuntimePath === 'real-founder') {
    emitRealFounderPathDiagnostic(
      input,
      REAL_FOUNDER_STAGE2_EXIT_CONFIRMED,
      'product-readiness-simulation-complete propagated',
    );
  }
  return assessment;
}

/** Force product readiness completion when chat stress settlement is satisfied but pipeline stalled. */
export function forceCompleteProductReadiness(
  input: RunProductReadinessSimulationInput & {
    founderTest: FounderTestAssessment;
    chatStress: ChatStressSimulationReport | null;
    budget: ReturnType<typeof createSimulationBudgetTracker>;
    simulationBudgetNotes: string[];
  },
): ProductReadinessAssessment {
  emitProductReadinessPathMismatchIfNeeded(input, 'direct-complete');
  recordProductReadinessCompletionMechanism('direct-complete');
  reconcileProductReadinessCompletionCheck(input);
  emitProductReadinessCompletionDiagnostic(
    input,
    PRODUCT_READINESS_FORCED_COMPLETION,
    'forcing product readiness completion after chat stress settlement',
    'PASSED',
  );
  return completeProductReadinessAssessment({
    rootDir: input.rootDir ?? process.cwd(),
    founderTest: input.founderTest,
    chatStress: input.chatStress,
    budget: input.budget,
    simulationBudgetNotes: input.simulationBudgetNotes,
    founderReviewerConfidence: input.founderReviewerConfidence ?? null,
    onSimulationTrace: input.onSimulationTrace,
    forced: true,
  });
}

async function recoverChatStressReportFromSettlement(input: {
  rootDir: string;
  maxScenarios?: number;
  founderTestContext: boolean;
  budgetMs: number;
  onSimulationTrace?: RunProductReadinessSimulationInput['onSimulationTrace'];
}): Promise<ChatStressSimulationReport | null> {
  if (!isProductReadinessCompletionCheckSatisfied() && !shouldForceCompleteProductReadiness()) {
    return null;
  }
  const recovered = await recoverFounderTestChatStressSimulationFromSettlement({
    rootDir: input.rootDir,
    maxScenarios: input.maxScenarios,
    founderTestContext: input.founderTestContext,
    budgetMs: input.budgetMs,
    onTrace: input.onSimulationTrace,
  });
  return recovered?.report ?? null;
}

async function runChatStressWithCompletionBoundary(input: {
  rootDir: string;
  maxScenarios?: number;
  founderTestContext: boolean;
  budgetMs: number;
  providerOverride?: RunProductReadinessSimulationInput['chatStressProviderOverride'];
  onSimulationTrace?: RunProductReadinessSimulationInput['onSimulationTrace'];
  productReadinessRuntimePath?: RunProductReadinessSimulationInput['productReadinessRuntimePath'];
}): Promise<{ report: ChatStressSimulationReport | null; forced: boolean }> {
  const chatTask = runFounderTestChatStressSimulation({
    rootDir: input.rootDir,
    maxScenarios: input.maxScenarios,
    concurrency: 4,
    founderTestContext: input.founderTestContext,
    budgetMs: input.budgetMs,
    providerOverride: input.providerOverride,
    onTrace: input.onSimulationTrace,
  })
    .then((assessment) => ({ kind: 'chat' as const, assessment }))
    .catch(() => ({ kind: 'chat' as const, assessment: null }));

  const settlementTask = waitForProductReadinessCompletionBoundary({
    onSimulationTrace: input.onSimulationTrace,
  })
    .then(() => ({ kind: 'settlement' as const }))
    .catch(() => ({ kind: 'settlement' as const }));

  const raced = await Promise.race([chatTask, settlementTask]);

  const completionEligible =
    isProductReadinessCompletionCheckSatisfied() || shouldForceCompleteProductReadiness();

  if (completionEligible) {
    observeRealFounderCompletionCheck({
      onSimulationTrace: input.onSimulationTrace,
      productReadinessRuntimePath: input.productReadinessRuntimePath,
    });

    if (raced.kind === 'chat' && raced.assessment !== null) {
      input.onSimulationTrace?.({
        operationId: PRODUCT_READINESS_PROPAGATION_COMPLETE,
        operationLabel: `${PRODUCT_READINESS_PROPAGATION_COMPLETE}: chat-stress-batch-returned`,
        phase: 'PASSED',
      });
      return { report: raced.assessment.report, forced: false };
    }

    const recovered = await recoverChatStressReportFromSettlement(input);
    input.onSimulationTrace?.({
      operationId: PRODUCT_READINESS_PROPAGATION_COMPLETE,
      operationLabel: recovered
        ? `${PRODUCT_READINESS_PROPAGATION_COMPLETE}: settlement-recovery`
        : `${PRODUCT_READINESS_PROPAGATION_COMPLETE}: boundary-satisfied-no-chat-report`,
      phase: 'PASSED',
    });
    return { report: recovered, forced: true };
  }

  if (raced.kind === 'chat' && raced.assessment !== null) {
    input.onSimulationTrace?.({
      operationId: PRODUCT_READINESS_PROPAGATION_COMPLETE,
      operationLabel: `${PRODUCT_READINESS_PROPAGATION_COMPLETE}: chat-stress-batch-returned`,
      phase: 'PASSED',
    });
    return { report: raced.assessment.report, forced: false };
  }

  const snap = getChatStressCompletionSnapshot();
  if (
    isProductReadinessRule1Satisfied({
      startedCount: snap.startedCount,
      settledCount: snap.settledCount,
      pendingCount: snap.pendingCount,
    })
  ) {
    const recovered = await recoverChatStressReportFromSettlement(input);
    input.onSimulationTrace?.({
      operationId: PRODUCT_READINESS_PROPAGATION_COMPLETE,
      operationLabel: recovered
        ? `${PRODUCT_READINESS_PROPAGATION_COMPLETE}: rule1-settlement-recovery`
        : `${PRODUCT_READINESS_PROPAGATION_COMPLETE}: rule1-settled-no-chat-report`,
      phase: 'PASSED',
    });
    return { report: recovered, forced: true };
  }

  if (!shouldForceCompleteProductReadiness()) {
    const fallback = await Promise.race([
      chatTask,
      new Promise<{ kind: 'timeout'; assessment: null }>((resolve) =>
        setTimeout(() => resolve({ kind: 'timeout', assessment: null }), CHAT_STRESS_SETTLEMENT_DRAIN_GRACE_MS),
      ),
    ]);
    if (fallback.kind === 'chat' && fallback.assessment !== null) {
      return { report: fallback.assessment.report, forced: false };
    }
    return { report: null, forced: false };
  }

  const recovered = await recoverChatStressReportFromSettlement(input);
  if (recovered) {
    input.onSimulationTrace?.({
      operationId: PRODUCT_READINESS_PROPAGATION_COMPLETE,
      operationLabel: `${PRODUCT_READINESS_PROPAGATION_COMPLETE}: settlement-recovery-fallback`,
      phase: 'PASSED',
    });
    return { report: recovered, forced: true };
  }

  const propagated = await propagateProductReadinessAfterCompletionBoundary({
    rootDir: input.rootDir,
    maxScenarios: input.maxScenarios,
    founderTestContext: input.founderTestContext,
    budgetMs: input.budgetMs,
    onSimulationTrace: input.onSimulationTrace,
    skipBoundaryWait: true,
  });

  if (propagated.chatStressReport) {
    return { report: propagated.chatStressReport, forced: propagated.forced };
  }

  input.onSimulationTrace?.({
    operationId: PRODUCT_READINESS_PROPAGATION_FAILURE,
    operationLabel:
      propagated.failureReason ??
      `${PRODUCT_READINESS_PROPAGATION_FAILURE}: settlement recovery failed`,
    phase: 'FAILED',
  });
  return { report: null, forced: propagated.forced };
}

function buildSelfEvolution(
  simulations: ProductReadinessSimulationResult[],
  blockers: ProductReadinessAutomaticBlocker[],
): ProductReadinessSelfEvolution {
  const weak = [...simulations].sort((a, b) => a.score - b.score);
  return {
    readOnly: true,
    topProductRisks: weak.slice(0, 4).map((s) => `${s.label}: ${s.score}/100 — ${s.topFailures[0] ?? 'needs polish'}`),
    topMissingCapabilities: [
      ...new Set(simulations.flatMap((s) => s.topFailures).filter(Boolean)),
    ].slice(0, 6),
    topUserFrustrations: simulations
      .filter((s) => s.id === 'FRUSTRATED_USER' || s.id === 'FIRST_TIME_USER' || s.id === 'LAUNCH_DAY')
      .flatMap((s) => s.topFailures)
      .slice(0, 5),
    topLaunchBlockers: blockers.map((b) => b.explanation).slice(0, 6),
    whatShouldWeBuildNext: simulations
      .flatMap((s) => s.recommendedFixes)
      .filter(Boolean)
      .slice(0, 8),
  };
}

export async function runFullProductReadinessSimulation(
  input: RunProductReadinessSimulationInput = {},
): Promise<ProductReadinessAssessment> {
  const rootDir = input.rootDir ?? process.cwd();
  const budgetMs = input.simulationBudgetMs ?? SIMULATION_BUDGET_MS;
  const budget = createSimulationBudgetTracker({ budgetMs, startedAtMs: Date.now() });
  const simulationBudgetNotes: string[] = [];
  const founderTestContext = input.founderTestContext !== false;
  const runtimePath =
    input.productReadinessRuntimePath ?? (founderTestContext ? 'isolated-validation' : undefined);

  if (runtimePath) {
    selectProductReadinessRuntimePath(runtimePath);
    if (runtimePath === 'real-founder') {
      emitRealFounderPathDiagnostic(
        input,
        REAL_FOUNDER_PRODUCT_READINESS_PATH_SELECTED,
        'buildFounderTestLaunchReadinessArtifactsAsync',
      );
    }
  }

  input.onSimulationTrace?.({
    operationId: 'product-readiness-simulation-started',
    operationLabel: 'Product readiness simulation started',
    phase: 'RUNNING',
  });

  const founderTest =
    input.founderTestAssessment ??
    assessFounderTestIntegration({ rootDir });

  let chatStress = input.chatStressSimulation ?? null;
  let chatStressForced = false;
  const useNonBlockingChatStress = runtimePath === 'real-founder';
  if (!input.skipChatStressSimulation && !chatStress) {
    if (budget.isBudgetExceeded()) {
      simulationBudgetNotes.push('Chat stress skipped — product readiness budget already exceeded.');
    } else {
      input.onSimulationTrace?.({
        operationId: 'product-readiness-chat-stress-started',
        operationLabel: 'Running bounded chat stress inside product readiness',
        phase: 'RUNNING',
      });
      if (useNonBlockingChatStress) {
        const chat = await runChatStressNonBlockingForFounderTest({
          rootDir,
          maxScenarios: input.chatStressMaxScenarios,
          founderTestContext,
          budgetMs: budget.remainingMs(),
          providerOverride: input.chatStressProviderOverride,
          onTrace: input.onSimulationTrace,
        });
        chatStress = chat.report;
        chatStressForced = chat.degradedIncomplete;
        simulationBudgetNotes.push(...chat.report.budgetNotes);
      } else {
        const chat = await runChatStressWithCompletionBoundary({
          rootDir,
          maxScenarios: input.chatStressMaxScenarios,
          founderTestContext,
          budgetMs: budget.remainingMs(),
          providerOverride: input.chatStressProviderOverride,
          onSimulationTrace: input.onSimulationTrace,
          productReadinessRuntimePath: runtimePath,
        });
        chatStress = chat.report;
        chatStressForced = chat.forced;
        if (chatStress) {
          simulationBudgetNotes.push(...chatStress.budgetNotes);
        }
        emitChatStressSimulationCompleteBoundaryIfNeeded((event) => {
          input.onSimulationTrace?.({
            operationId: event.operationId,
            operationLabel: event.operationLabel,
            phase: event.phase,
          });
        });
      }
      const chatSnap = getChatStressCompletionSnapshot();
      const chatSettled = isProductReadinessRule1Satisfied({
        startedCount: chatSnap.startedCount,
        settledCount: chatSnap.settledCount,
        pendingCount: chatSnap.pendingCount,
      });
      input.onSimulationTrace?.({
        operationId: 'product-readiness-chat-stress-complete',
        operationLabel:
          chatStress?.runtimeHealth === 'DEGRADED_INCOMPLETE'
            ? `Chat stress DEGRADED_INCOMPLETE (${chatSnap.settledCount}/${chatSnap.startedCount} settled, pending=${chatSnap.pendingCount})`
            : chatStress?.degradedPartialResult
              ? `Chat stress partial (${chatStress.scenariosExecuted}/${chatStress.scenariosRequested} executed)`
              : chatSettled
                ? `Chat stress complete (${chatSnap.settledCount}/${chatSnap.startedCount} settled)`
                : 'Chat stress complete',
        phase: 'PASSED',
        errorMessage:
          chatStress?.runtimeHealth === 'DEGRADED_INCOMPLETE' ||
          chatStress?.degradedPartialResult ||
          budget.isBudgetExceeded()
            ? chatStress?.budgetNotes.join(' ') ??
              budget.snapshot().reason ??
              'SIMULATION_BUDGET_EXCEEDED'
            : undefined,
      });
    }
  }

  reconcileProductReadinessCompletionCheck(input);

  if (useNonBlockingChatStress) {
    recordProductReadinessCompletionMechanism('non-blocking-chat-stress');
    const assessment = completeProductReadinessAssessment({
      rootDir,
      founderTest,
      chatStress,
      budget,
      simulationBudgetNotes,
      founderReviewerConfidence: input.founderReviewerConfidence ?? null,
      onSimulationTrace: input.onSimulationTrace,
      forced: chatStressForced,
    });
    if (runtimePath === 'real-founder') {
      emitRealFounderPathDiagnostic(
        input,
        REAL_FOUNDER_STAGE2_EXIT_CONFIRMED,
        'non-blocking chat stress — product-readiness-simulation-complete propagated',
      );
    }
    return assessment;
  }

  const shouldInvokeCompletionTail =
    (isProductReadinessCompletionCheckSatisfied() || shouldForceCompleteProductReadiness()) &&
    !hasProductReadinessSimulationCompletePropagated();

  if (shouldInvokeCompletionTail) {
    return invokeProductReadinessCompletionTail({
      ...input,
      rootDir,
      founderTest,
      chatStress,
      budget,
      simulationBudgetNotes,
      chatStressForced,
      productReadinessRuntimePath: runtimePath,
    });
  }

  emitProductReadinessPathMismatchIfNeeded(input, 'direct-complete');
  recordProductReadinessCompletionMechanism('direct-complete');
  return completeProductReadinessAssessment({
    rootDir,
    founderTest,
    chatStress,
    budget,
    simulationBudgetNotes,
    founderReviewerConfidence: input.founderReviewerConfidence ?? null,
    onSimulationTrace: input.onSimulationTrace,
    forced: chatStressForced,
  });
}

export function formatProductReadinessSummary(report: ProductReadinessReport): string {
  return (
    `Product Readiness Simulation: ${report.readinessScore}/100 — ${report.verdict.replace(/_/g, ' ')}. ` +
    `Launch blocked: ${report.launchBlocked ? 'YES' : 'NO'}.`
  );
}
