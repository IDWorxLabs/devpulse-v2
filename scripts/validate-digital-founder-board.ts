/**
 * Phase 24.9.24 — Digital Founder Board validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessFounderActionCenter } from '../src/founder-action-center/index.js';
import { assessFounderFrictionHeatmap } from '../src/founder-friction-heatmap/index.js';
import { assessFounderInteractionSimulation } from '../src/founder-interaction-simulation/index.js';
import { assessFounderSensemaking } from '../src/founder-sensemaking-engine/index.js';
import { assessFirstTimeUserReality } from '../src/first-time-user-reality/index.js';
import { assessCustomerJourneySimulation } from '../src/customer-journey-simulation/index.js';
import { assessVisualQualityAuthority } from '../src/visual-quality-authority/index.js';
import { assessLaunchDaySimulation } from '../src/launch-day-simulation-engine/index.js';
import { assessAdoptionPrediction } from '../src/adoption-prediction-engine/index.js';
import { assessProductEconomics } from '../src/product-economics-engine/index.js';
import { assessProductEvolution } from '../src/product-evolution-engine/index.js';
import { assessCompetitiveReality } from '../src/competitive-reality-engine/index.js';
import { assessFounderDecisionReadiness } from '../src/founder-decision-readiness/index.js';
import {
  DIGITAL_FOUNDER_BOARD_PASS_TOKEN,
  assembleDigitalFounderBoard,
  enrichSensemakingWithDigitalFounderBoard,
} from '../src/digital-founder-board/index.js';
import { assessPromiseRealityEngine } from '../src/promise-reality-engine/index.js';
import { assessVerificationTrustEvidence } from '../src/verification-trust-evidence/index.js';
import { evaluateProjectMemoryReality } from '../src/founder-testing-mode/execution-reality-engine.js';
import { runFounderTestingModeV5 } from '../src/founder-testing-mode/index.js';
import { buildProductWorkspaceSnapshot } from '../server/product-workspace-snapshot.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const BOARD_STATUSES = ['HEALTHY', 'HEALTHY_WITH_WARNINGS', 'ACTION_REQUIRED', 'CRITICAL_INTERVENTION_REQUIRED'] as const;

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 180_000;
const textCache = new Map<string, string>();

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  const cached = textCache.get(relativePath);
  if (cached) return cached;
  const content = readFileSync(join(ROOT, relativePath), 'utf8');
  textCache.set(relativePath, content);
  return content;
}

function guardRuntime(group: string): void {
  if (Date.now() - START > MAX_RUNTIME_MS) {
    throw new Error(`Timeout in ${group} after ${Date.now() - START}ms`);
  }
}

function buildAuthorityStack(shellSources: { appJs: string; html: string; css: string }) {
  const firstTimeUserReality = assessFirstTimeUserReality({ shellSources });
  const founderInteractionSimulation = assessFounderInteractionSimulation({ shellSources });
  const validatorScripts = Object.keys(
    (JSON.parse(readText('package.json')) as { scripts?: Record<string, string> }).scripts ?? {},
  ).filter((k) => k.startsWith('validate:'));
  const snapshot = buildProductWorkspaceSnapshot(validatorScripts);
  const actionBase = assessFounderActionCenter({
    projectMemory: snapshot.projectMemory,
    livePreview: snapshot.livePreview,
    runningApplication: snapshot.runningApplication,
    verificationResults: snapshot.verificationResults,
    changeIntelligence: snapshot.changeIntelligence,
    verification: snapshot.verification,
  });
  const senseBase = assessFounderSensemaking({
    projectMemory: snapshot.projectMemory,
    livePreview: snapshot.livePreview,
    runningApplication: snapshot.runningApplication,
    verificationResults: snapshot.verificationResults,
    changeIntelligence: snapshot.changeIntelligence,
    founderActionCenter: actionBase,
    verification: snapshot.verification,
    autonomousBuilder: snapshot.autonomousBuilder,
    portfolioInsights: snapshot.portfolioInsights,
    shellSources: { appJs: shellSources.appJs, html: shellSources.html },
  });
  const verificationTrustEvidence = assessVerificationTrustEvidence({
    verificationResults: snapshot.verificationResults,
    shellSources,
    durationMs: 1000,
  });
  const founderFrictionHeatmap = assessFounderFrictionHeatmap({
    shellSources,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderSensemaking: senseBase,
    founderActionCenter: actionBase,
    verificationResults: snapshot.verificationResults,
  });
  const customerJourneySimulation = assessCustomerJourneySimulation({
    shellSources,
    firstTimeUserReality,
    founderInteractionSimulation,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    projectMemoryScore: evaluateProjectMemoryReality(snapshot).score,
    previewValidationReady: snapshot.livePreview.reality?.validationReady === true,
    autonomousBuilderConnected: snapshot.autonomousBuilder.executionConnected,
  });
  const visualQualityAuthority = assessVisualQualityAuthority({ shellSources, firstTimeUserReality });
  const launchDaySimulation = assessLaunchDaySimulation({
    shellSources,
    firstTimeUserReality,
    customerJourneySimulation,
    visualQualityAuthority,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    founderInteractionSimulation,
    founderActionCenter: actionBase,
    verificationResults: snapshot.verificationResults,
  });
  const adoptionPrediction = assessAdoptionPrediction({
    shellSources,
    firstTimeUserReality,
    customerJourneySimulation,
    launchDaySimulation,
    visualQualityAuthority,
    founderFrictionHeatmap,
  });
  const promiseRealityEngine = assessPromiseRealityEngine({
    workspace: snapshot,
    shellSources,
    ideaToAppResults: [],
    creationJourney: [],
    firstTimeUserReality,
    customerJourneySimulation,
    launchDaySimulation,
    adoptionPrediction,
  });
  const productEconomics = assessProductEconomics({
    shellSources,
    firstTimeUserReality,
    customerJourneySimulation,
    launchDaySimulation,
    adoptionPrediction,
    founderFrictionHeatmap,
    promiseRealityEngine,
    validatorScriptCount: validatorScripts.length,
  });
  const productEvolution = assessProductEvolution({
    shellSources,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    customerJourneySimulation,
    promiseRealityEngine,
    visualQualityAuthority,
    launchDaySimulation,
    adoptionPrediction,
    productEconomics,
  });
  const competitiveReality = assessCompetitiveReality({
    shellSources,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    customerJourneySimulation,
    promiseRealityEngine,
    visualQualityAuthority,
    launchDaySimulation,
    adoptionPrediction,
    productEconomics,
    productEvolution,
    validatorScriptCount: validatorScripts.length,
  });
  const founderDecisionReadiness = assessFounderDecisionReadiness({
    shellSources,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    customerJourneySimulation,
    promiseRealityEngine,
    visualQualityAuthority,
    launchDaySimulation,
    adoptionPrediction,
    productEconomics,
    productEvolution,
    competitiveReality,
  });
  return {
    actionBase,
    senseBase,
    firstTimeUserReality,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    customerJourneySimulation,
    promiseRealityEngine,
    visualQualityAuthority,
    launchDaySimulation,
    adoptionPrediction,
    productEconomics,
    productEvolution,
    competitiveReality,
    founderDecisionReadiness,
    validatorScripts,
  };
}

function main(): void {
  console.log('');
  console.log('Digital Founder Board — Validation');
  console.log('====================================');
  console.log('');

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/digital-founder-board/digital-founder-board-authority.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const orchestrator = readText('scripts/validation-runtime-orchestrator.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/digital-founder-board/digital-founder-board-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/digital-founder-board/digital-founder-board-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:digital-founder-board']), 'package');
  assert('04. board panels', authority.includes('executiveSummary') && authority.includes('roadmapIntelligence') && authority.includes('trustValidation'), 'panels');
  assert('05. board status classifications', authority.includes('HEALTHY') && authority.includes('CRITICAL_INTERVENTION_REQUIRED'), 'status');
  assert('06. no new scoring models', !authority.includes('assessAdoptionPrediction') && !authority.includes('assessCompetitiveReality'), 'aggregate only');
  assert('07. operator feed events', authority.includes('Digital Founder Board') && authority.includes('Aggregating product health'), 'feed');
  assert('08. product coherence integration', authority.includes('enrichSensemakingWithDigitalFounderBoard') && authority.includes('digitalFounderBoardSummary'), 'coherence');
  assert('09. consumes decision readiness', authority.includes('founderDecisionReadiness') && authority.includes('primaryRecommendation'), 'decision');
  assert('10. consumes evolution opportunities', authority.includes('productEvolution') && authority.includes('quickWins'), 'evolution');
  assert('11. consumes economics ROI', authority.includes('productEconomics') && authority.includes('highestRoiOpportunities'), 'economics');
  assert('12. consumes competitive position', authority.includes('competitiveReality') && authority.includes('competitivePosition'), 'competitive');
  assert('13. V5 report section', v5Report.includes('Digital Founder Board'), 'v5 md');
  assert('14. V4 orchestrator wired', v4Orchestrator.includes('assembleDigitalFounderBoard') && v4Orchestrator.includes('enrichSensemakingWithDigitalFounderBoard'), 'v4');
  assert('15. sensemaking board fields', senseTypes.includes('digitalFounderBoardSummary') && senseTypes.includes('boardStatus'), 'sense');
  assert('16. no nested validator cascade', !authority.includes("execSync('npm run validate:"), 'cascade');
  assert('17. suite includes board', orchestrator.includes('validate:digital-founder-board'), 'suite');
  assert('18. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('19. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const shellSources = { appJs, html, css };
  const stack = buildAuthorityStack(shellSources);

  const board = assembleDigitalFounderBoard({
    firstTimeUserReality: stack.firstTimeUserReality,
    verificationTrustEvidence: stack.verificationTrustEvidence,
    founderFrictionHeatmap: stack.founderFrictionHeatmap,
    customerJourneySimulation: stack.customerJourneySimulation,
    promiseRealityEngine: stack.promiseRealityEngine,
    visualQualityAuthority: stack.visualQualityAuthority,
    launchDaySimulation: stack.launchDaySimulation,
    adoptionPrediction: stack.adoptionPrediction,
    productEconomics: stack.productEconomics,
    productEvolution: stack.productEvolution,
    competitiveReality: stack.competitiveReality,
    founderDecisionReadiness: stack.founderDecisionReadiness,
    founderActionCenter: stack.actionBase,
  });

  assert('20. board assembles', board.digitalFounderBoardSummary.length > 10, board.digitalFounderBoardSummary.slice(0, 40));
  assert('21. founder decision visible', board.executiveSummaryVisibilityPass && Boolean(board.executiveSummary.founderDecision), board.executiveSummary.founderDecision);
  assert('22. decision confidence visible', board.decisionVisibilityPass, board.executiveSummary.decisionConfidence);
  assert('23. executive summary visible', board.executiveSummaryVisibilityPass, board.executiveSummary.whyThisRecommendation.slice(0, 30));
  assert('24. risk board visible', board.riskBoardVisibilityPass, String(board.riskBoard.highestPriorityRisks.length));
  assert('25. opportunity board visible', board.opportunityBoardVisibilityPass, String(board.opportunityBoard.quickWins.length));
  assert('26. competitive panel visible', board.competitivePanelVisibilityPass, String(board.competitivePosition.strongestAdvantages.length));
  assert('27. trust panel visible', board.trustPanelVisibilityPass, String(board.trustValidation.verificationTrustScore));
  assert('28. roadmap panel visible', board.roadmapPanelVisibilityPass, String(board.roadmapIntelligence.buildNext.length));
  assert('29. board status visible', board.boardStatusVisibilityPass && BOARD_STATUSES.includes(board.boardStatus as typeof BOARD_STATUSES[number]), board.boardStatus);
  assert('30. recommended actions visible', board.recommendedActionsVisibilityPass, String(board.recommendedActions.length));
  assert('31. product health panel', board.productHealth.launchReadiness >= 0 && board.productHealth.founderReadiness >= 0, 'health');
  assert('32. founder experience panel', board.founderExperience.firstTimeUserScore >= 0, String(board.founderExperience.adoptionPredictionScore));
  guardRuntime('simulation');

  const brokenBoard = assembleDigitalFounderBoard({
    ...{
      firstTimeUserReality: stack.firstTimeUserReality,
      verificationTrustEvidence: stack.verificationTrustEvidence,
      founderFrictionHeatmap: stack.founderFrictionHeatmap,
      customerJourneySimulation: stack.customerJourneySimulation,
      promiseRealityEngine: stack.promiseRealityEngine,
      visualQualityAuthority: stack.visualQualityAuthority,
      launchDaySimulation: stack.launchDaySimulation,
      adoptionPrediction: stack.adoptionPrediction,
      productEconomics: stack.productEconomics,
      productEvolution: stack.productEvolution,
      competitiveReality: stack.competitiveReality,
      founderActionCenter: stack.actionBase,
    },
    founderDecisionReadiness: {
      ...stack.founderDecisionReadiness,
      primaryRecommendation: 'FIX_CRITICAL_ISSUES_FIRST',
      majorDecisionRisks: true,
      decisionReadinessScore: 30,
      blockingEvidence: ['Critical blocker 1', 'Critical blocker 2'],
      recommendedNextActions: ['Fix critical blockers.', 'Do not launch.', 'Prioritize Action Center.'],
    },
  });

  assert(
    '33. critical board status on failure',
    brokenBoard.boardStatus === 'CRITICAL_INTERVENTION_REQUIRED' || brokenBoard.majorBoardRisks,
    brokenBoard.boardStatus,
  );

  const enriched = enrichSensemakingWithDigitalFounderBoard(stack.senseBase, board);
  assert(
    '34. sensemaking receives board summary',
    enriched.founderSensemaking.digitalFounderBoardSummary != null &&
      enriched.founderSensemaking.boardStatus != null,
    enriched.founderSensemaking.digitalFounderBoardSummary ?? 'none',
  );

  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('35. V5 includes digital founder board', Boolean(v5.digitalFounderBoard), v5.digitalFounderBoard.boardStatus);
  assert('36. V5 markdown section', v5.reportMarkdown.includes('Digital Founder Board'), 'md');
  assert('37. V5 decision visible on board', Boolean(v5.digitalFounderBoard.executiveSummary.founderDecision), v5.digitalFounderBoard.executiveSummary.founderDecision);
  assert(
    '38. V5 board does not hide critical evidence',
    v5.digitalFounderBoard.riskBoard.highestPriorityRisks.length > 0 &&
      v5.digitalFounderBoard.riskBoard.blockingEvidence.length > 0 &&
      v5.digitalFounderBoard.trustPanelVisibilityPass,
    String(v5.digitalFounderBoard.riskBoard.highestPriorityRisks.length),
  );
  assert(
    '39. V5 board panels complete',
    v5.digitalFounderBoard.digitalFounderBoardPass &&
      v5.digitalFounderBoard.opportunityBoardVisibilityPass &&
      v5.digitalFounderBoard.roadmapPanelVisibilityPass,
    String(v5.digitalFounderBoard.digitalFounderBoardPass),
  );
  assert(
    '40. V5 board executive clarity',
    v5.digitalFounderBoard.executiveSummaryVisibilityPass &&
      v5.digitalFounderBoard.recommendedActions.length >= 3,
    v5.digitalFounderBoard.digitalFounderBoardSummary,
  );
  guardRuntime('v5');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const runtimeMs = Date.now() - START;

  console.log('');
  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed} | Runtime: ${runtimeMs}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed > 0) {
    console.log('DIGITAL_FOUNDER_BOARD_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Board Status: ${board.boardStatus} | Decision: ${board.executiveSummary.founderDecision} | Risks: ${board.riskBoard.highestPriorityRisks.length} | Opportunities: ${board.opportunityBoard.quickWins.length}`);
  console.log('');
  console.log(DIGITAL_FOUNDER_BOARD_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
