/**
 * Phase 24.9.23 — Founder Decision Readiness validation (leaf mode).
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
import {
  FOUNDER_DECISION_READINESS_PASS_TOKEN,
  assessFounderDecisionReadiness,
  enrichAssessmentsWithFounderDecisionReadiness,
  resetFounderDecisionReadinessCounterForTests,
} from '../src/founder-decision-readiness/index.js';
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

const VALID_OUTCOMES = [
  'READY_TO_LAUNCH',
  'LAUNCH_WITH_WARNINGS',
  'NOT_READY_FOR_LAUNCH',
  'FIX_CRITICAL_ISSUES_FIRST',
  'IMPROVE_ADOPTION_FIRST',
  'VALIDATE_ASSUMPTIONS_FIRST',
  'IMPROVE_COMPETITIVE_POSITION_FIRST',
  'FOCUS_ON_EVOLUTION_FIRST',
] as const;

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
    validatorScripts,
  };
}

function main(): void {
  console.log('');
  console.log('Founder Decision Readiness — Validation');
  console.log('========================================');
  console.log('');

  resetFounderDecisionReadinessCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/founder-decision-readiness/founder-decision-readiness-authority.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const orchestrator = readText('scripts/validation-runtime-orchestrator.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/founder-decision-readiness/founder-decision-readiness-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/founder-decision-readiness/founder-decision-readiness-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:founder-decision-readiness']), 'package');
  assert('04. decision categories', authority.includes('launchReadiness') && authority.includes('founderReadiness'), 'categories');
  assert('05. decision outcomes', authority.includes('READY_TO_LAUNCH') && authority.includes('IMPROVE_ADOPTION_FIRST') && authority.includes('VALIDATE_ASSUMPTIONS_FIRST'), 'outcomes');
  assert('06. decision confidence', authority.includes('HIGH') && authority.includes('MEDIUM') && authority.includes('LOW'), 'confidence');
  assert('07. operator feed events', authority.includes('Synthesizing founder decision') && authority.includes('Tracing decision evidence'), 'feed');
  assert('08. product coherence integration', authority.includes('enrichAssessmentsWithFounderDecisionReadiness') && authority.includes('founderDecisionReadinessSummary'), 'coherence');
  assert('09. action center integration', authority.includes('Prepare launch checklist') && authority.includes('Address adoption blockers'), 'actions');
  assert('10. evolution inputs', authority.includes('productEvolution') && authority.includes('quickWins'), 'evolution');
  assert('11. competitive inputs', authority.includes('competitiveReality') && authority.includes('COMMODITY_RISK'), 'competitive');
  assert('12. promise inputs', authority.includes('promiseRealityEngine') && authority.includes('unprovenClaims'), 'promise');
  assert('13. V5 report section', v5Report.includes('Founder Decision Readiness'), 'v5 md');
  assert('14. V4 orchestrator wired', v4Orchestrator.includes('assessFounderDecisionReadiness') && v4Orchestrator.includes('enrichAssessmentsWithFounderDecisionReadiness'), 'v4');
  assert('15. sensemaking decision fields', senseTypes.includes('founderDecision') && senseTypes.includes('whyThisRecommendation'), 'sense');
  assert('16. no nested validator cascade', !authority.includes("execSync('npm run validate:"), 'cascade');
  assert('17. suite includes decision readiness', orchestrator.includes('validate:founder-decision-readiness'), 'suite');
  assert('18. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('19. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const shellSources = { appJs, html, css };
  const stack = buildAuthorityStack(shellSources);

  const decision = assessFounderDecisionReadiness({
    shellSources,
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
  });

  assert('20. decision assessment executes', decision.decisionReadinessScore >= 0 && decision.decisionReadinessScore <= 100, String(decision.decisionReadinessScore));
  assert('21. exactly one primary recommendation', VALID_OUTCOMES.includes(decision.primaryRecommendation as typeof VALID_OUTCOMES[number]), decision.primaryRecommendation);
  assert('22. launch readiness score', decision.portfolioSubscores.launchReadiness >= 0, String(decision.portfolioSubscores.launchReadiness));
  assert('23. adoption readiness score', decision.portfolioSubscores.adoptionReadiness >= 0, String(decision.portfolioSubscores.adoptionReadiness));
  assert('24. trust readiness score', decision.portfolioSubscores.trustReadiness >= 0, String(decision.portfolioSubscores.trustReadiness));
  assert('25. product readiness score', decision.portfolioSubscores.productReadiness >= 0, String(decision.portfolioSubscores.productReadiness));
  assert('26. strategic readiness score', decision.portfolioSubscores.strategicReadiness >= 0, String(decision.portfolioSubscores.strategicReadiness));
  assert('27. founder readiness score', decision.portfolioSubscores.founderReadiness >= 0, String(decision.portfolioSubscores.founderReadiness));
  assert('28. decision visibility', decision.decisionVisibilityPass, decision.primaryRecommendation);
  assert('29. confidence visibility', decision.confidenceVisibilityPass, decision.decisionConfidence);
  assert('30. justification visibility', decision.justificationVisibilityPass, decision.whyThisRecommendation.slice(0, 40));
  assert('31. blocker visibility', decision.blockerVisibilityPass, String(decision.blockingEvidence.length));
  assert('32. next action visibility', decision.nextActionVisibilityPass, String(decision.recommendedNextActions.length));
  assert('33. supporting evidence traceable', decision.supportingEvidence.length > 0 && decision.supportingEvidence.some((e) => /readiness|launch|adoption|trust|competitive|evolution/i.test(e)), String(decision.supportingEvidence.length));
  guardRuntime('simulation');

  const brokenDecision = assessFounderDecisionReadiness({
    shellSources,
    firstTimeUserReality: { ...stack.firstTimeUserReality, firstTimeUserScore: 25, actionPathPass: false },
    verificationTrustEvidence: { ...stack.verificationTrustEvidence, trustPass: false, trustScore: 30, blackBoxRisk: true },
    founderFrictionHeatmap: {
      ...stack.founderFrictionHeatmap,
      overallFrictionScore: 85,
      summary: { ...stack.founderFrictionHeatmap.summary, frictionLevel: 'HIGH' },
    },
    customerJourneySimulation: { ...stack.customerJourneySimulation, customerJourneyScore: 30, notReadyForCustomers: true, customerReady: false },
    promiseRealityEngine: {
      ...stack.promiseRealityEngine,
      majorClaimsUnsupported: true,
      promiseRealityScore: 28,
      unprovenClaims: stack.promiseRealityEngine.unprovenClaims.length
        ? stack.promiseRealityEngine.unprovenClaims
        : [{ id: 'unproven-workflow', claim: 'Unproven workflow', severity: 'HIGH', evidence: 'none', category: 'WORKFLOW', status: 'UNPROVEN', confidence: 20 }],
      contradictedClaims: [{ id: 'contradicted-workflow', claim: 'Contradicted claim', severity: 'HIGH', evidence: 'none', category: 'WORKFLOW', status: 'CONTRADICTED', confidence: 15 }],
    },
    visualQualityAuthority: { ...stack.visualQualityAuthority, visualQualityScore: 40 },
    launchDaySimulation: { ...stack.launchDaySimulation, majorLaunchRisks: true, launchDayScore: 35 },
    adoptionPrediction: {
      ...stack.adoptionPrediction,
      majorAdoptionRisks: true,
      adoptionPredictionScore: 32,
      adoptionBlockers: [
        { id: 'b1', type: 'ADOPTION_BLOCKER', category: 'ADOPTION_FRICTION', severity: 'HIGH', explanation: 'Blocker 1', recommendation: 'Fix' },
        { id: 'b2', type: 'ADOPTION_BLOCKER', category: 'ADOPTION_FRICTION', severity: 'HIGH', explanation: 'Blocker 2', recommendation: 'Fix' },
      ],
    },
    productEconomics: { ...stack.productEconomics, majorEconomicRisks: true, productEconomicsScore: 35 },
    productEvolution: { ...stack.productEvolution, majorEvolutionRisks: true, productEvolutionScore: 35, doNotBuild: ['a', 'b'] },
    competitiveReality: {
      ...stack.competitiveReality,
      majorCompetitiveRisks: true,
      competitivePosition: 'COMMODITY_RISK',
      competitiveRealityScore: 40,
    },
  });

  assert(
    '34. detects decision risks on failure',
    brokenDecision.majorDecisionRisks ||
      brokenDecision.primaryRecommendation !== 'READY_TO_LAUNCH' ||
      brokenDecision.blockingEvidence.length >= 2,
    brokenDecision.primaryRecommendation,
  );

  const enriched = enrichAssessmentsWithFounderDecisionReadiness(stack.actionBase, stack.senseBase, brokenDecision);
  assert(
    '35. action center receives decision actions',
    enriched.founderActionCenter.topActions.some((a) => /launch|adoption|validate|critical|blocker|prove|roadmap/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '36. product coherence receives decision summary',
    enriched.founderSensemaking.founderDecisionReadinessSummary != null &&
      enriched.founderSensemaking.founderDecision != null &&
      enriched.founderSensemaking.whyThisRecommendation != null,
    enriched.founderSensemaking.founderDecisionReadinessSummary ?? 'none',
  );

  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('37. V5 includes founder decision readiness', Boolean(v5.founderDecisionReadiness), String(v5.founderDecisionReadiness.decisionReadinessScore));
  assert('38. V5 markdown section', v5.reportMarkdown.includes('Founder Decision Readiness'), 'md');
  assert('39. V5 single recommendation visible', VALID_OUTCOMES.includes(v5.founderDecisionReadiness.primaryRecommendation as typeof VALID_OUTCOMES[number]), v5.founderDecisionReadiness.primaryRecommendation);
  assert(
    '40. V5 decision conclusions explainable',
    v5.founderDecisionReadiness.decisionReadinessSummary.length > 10 &&
      v5.founderDecisionReadiness.decisionVisibilityPass &&
      v5.founderDecisionReadiness.confidenceVisibilityPass &&
      v5.founderDecisionReadiness.justificationVisibilityPass &&
      v5.founderDecisionReadiness.supportingEvidence.length > 0 &&
      v5.founderDecisionReadiness.recommendedNextActions.length >= 3,
    String(v5.founderDecisionReadiness.founderDecisionReadinessPass),
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
    console.log('FOUNDER_DECISION_READINESS_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Decision Readiness Score: ${decision.decisionReadinessScore} | Recommendation: ${decision.primaryRecommendation} | Confidence: ${decision.decisionConfidence}`);
  console.log(`Supporting evidence: ${decision.supportingEvidence.length} | Blocking evidence: ${decision.blockingEvidence.length} | Next actions: ${decision.recommendedNextActions.length}`);
  console.log('');
  console.log(FOUNDER_DECISION_READINESS_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
