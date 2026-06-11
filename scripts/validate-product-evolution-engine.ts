/**
 * Phase 24.9.21 — Product Evolution Engine validation (leaf mode).
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
import {
  PRODUCT_EVOLUTION_ENGINE_PASS_TOKEN,
  assessProductEvolution,
  enrichAssessmentsWithProductEvolution,
  resetProductEvolutionCounterForTests,
} from '../src/product-evolution-engine/index.js';
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
  return {
    snapshot,
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
  };
}

function main(): void {
  console.log('');
  console.log('Product Evolution Engine — Validation');
  console.log('=======================================');
  console.log('');

  resetProductEvolutionCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/product-evolution-engine/product-evolution-engine-authority.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const orchestrator = readText('scripts/validation-runtime-orchestrator.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/product-evolution-engine/product-evolution-engine-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/product-evolution-engine/product-evolution-engine-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:product-evolution-engine']), 'package');
  assert('04. evolution categories', authority.includes('adoptionGrowth') && authority.includes('executionEfficiency'), 'categories');
  assert('05. ranking buckets', authority.includes('QUICK_WIN') && authority.includes('DO_NOT_BUILD') && authority.includes('STRATEGIC_INVESTMENT'), 'buckets');
  assert('06. recommendation confidence', authority.includes('HIGH') && authority.includes('MEDIUM') && authority.includes('LOW'), 'confidence');
  assert('07. operator feed events', authority.includes('Ranking roadmap recommendations') && authority.includes('Tracing recommendation evidence'), 'feed');
  assert('08. product coherence integration', authority.includes('enrichAssessmentsWithProductEvolution') && authority.includes('productEvolutionSummary'), 'coherence');
  assert('09. action center integration', authority.includes('Prioritize onboarding improvements') && authority.includes('Address adoption blocker first'), 'actions');
  assert('10. adoption inputs', authority.includes('adoptionPrediction') && authority.includes('retentionRisks'), 'adoption');
  assert('11. economics inputs', authority.includes('productEconomics') && authority.includes('lowestRoiOpportunities'), 'economics');
  assert('12. promise inputs', authority.includes('promiseRealityEngine') && authority.includes('unprovenClaims'), 'promise');
  assert('13. V5 report section', v5Report.includes('Product Evolution'), 'v5 md');
  assert('14. V4 orchestrator wired', v4Orchestrator.includes('assessProductEvolution') && v4Orchestrator.includes('enrichAssessmentsWithProductEvolution'), 'v4');
  assert('15. sensemaking evolution fields', senseTypes.includes('productEvolutionSummary') && senseTypes.includes('evolutionQuickWins'), 'sense');
  assert('16. no nested validator cascade', !authority.includes("execSync('npm run validate:"), 'cascade');
  assert('17. suite includes evolution', orchestrator.includes('validate:product-evolution-engine'), 'suite');
  assert('18. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('19. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const shellSources = { appJs, html, css };
  const stack = buildAuthorityStack(shellSources);

  const evolution = assessProductEvolution({
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
  });

  assert('20. evolution assessment executes', evolution.productEvolutionScore >= 0 && evolution.productEvolutionScore <= 100, String(evolution.productEvolutionScore));
  assert('21. adoption growth score', evolution.portfolioSubscores.adoptionGrowth >= 0, String(evolution.portfolioSubscores.adoptionGrowth));
  assert('22. friction reduction score', evolution.portfolioSubscores.frictionReduction >= 0, String(evolution.portfolioSubscores.frictionReduction));
  assert('23. trust improvement score', evolution.portfolioSubscores.trustImprovement >= 0, String(evolution.portfolioSubscores.trustImprovement));
  assert('24. quality improvement score', evolution.portfolioSubscores.qualityImprovement >= 0, String(evolution.portfolioSubscores.qualityImprovement));
  assert('25. strategic leverage score', evolution.portfolioSubscores.strategicLeverage >= 0, String(evolution.portfolioSubscores.strategicLeverage));
  assert('26. execution efficiency score', evolution.portfolioSubscores.executionEfficiency >= 0, String(evolution.portfolioSubscores.executionEfficiency));
  assert('27. recommendation ranking visibility', evolution.recommendationRankingVisibilityPass, String(evolution.candidates.length));
  assert('28. recommendation confidence visibility', evolution.recommendationConfidenceVisibilityPass, evolution.recommendationConfidenceSummary);
  assert('29. evidence traceability', evolution.evidenceTraceabilityPass, String(evolution.candidates.filter((c) => c.evidence.length > 0).length));
  assert('30. quick win visibility', evolution.quickWinVisibilityPass, String(evolution.quickWins.length));
  assert('31. strategic investment visibility', evolution.strategicInvestmentVisibilityPass, String(evolution.strategicInvestments.length));
  assert('32. bounded candidates', evolution.candidates.length <= 8, String(evolution.candidates.length));
  guardRuntime('simulation');

  const brokenEvolution = assessProductEvolution({
    shellSources,
    firstTimeUserReality: {
      ...stack.firstTimeUserReality,
      firstTimeUserScore: 25,
      actionPathPass: false,
      productUnderstandingPass: false,
    },
    verificationTrustEvidence: {
      ...stack.verificationTrustEvidence,
      trustPass: false,
      trustScore: 30,
      blackBoxRisk: true,
    },
    founderFrictionHeatmap: {
      ...stack.founderFrictionHeatmap,
      overallFrictionScore: 85,
      summary: { ...stack.founderFrictionHeatmap.summary, frictionLevel: 'HIGH' },
    },
    customerJourneySimulation: {
      ...stack.customerJourneySimulation,
      notReadyForCustomers: true,
      customerJourneyScore: 30,
      customerReady: false,
    },
    promiseRealityEngine: {
      ...stack.promiseRealityEngine,
      majorClaimsUnsupported: true,
      promiseRealityScore: 28,
      unprovenClaims: stack.promiseRealityEngine.unprovenClaims.length
        ? stack.promiseRealityEngine.unprovenClaims
        : [{ claim: 'Unproven workflow', severity: 'HIGH', evidence: 'none', category: 'WORKFLOW', status: 'UNPROVEN' }],
    },
    visualQualityAuthority: { ...stack.visualQualityAuthority, visualQualityScore: 40 },
    launchDaySimulation: { ...stack.launchDaySimulation, majorLaunchRisks: true, launchDayScore: 35 },
    adoptionPrediction: {
      ...stack.adoptionPrediction,
      majorAdoptionRisks: true,
      adoptionPredictionScore: 32,
      adoptionBlockers: stack.adoptionPrediction.adoptionBlockers.length
        ? stack.adoptionPrediction.adoptionBlockers
        : [{ id: 'b1', type: 'ADOPTION_BLOCKER', category: 'ADOPTION_FRICTION', severity: 'HIGH', explanation: 'Blocker', recommendation: 'Fix' }],
    },
    productEconomics: {
      ...stack.productEconomics,
      majorEconomicRisks: true,
      productEconomicsScore: 35,
      lowestRoiOpportunities: ['[DO_NOT_BUILD] Expand product surface before core workflow is ready'],
    },
  });

  assert('33. detects evolution risks on failure', brokenEvolution.doNotBuild.length > 0 || brokenEvolution.majorEvolutionRisks, String(brokenEvolution.doNotBuild.length));

  const enriched = enrichAssessmentsWithProductEvolution(stack.actionBase, stack.senseBase, brokenEvolution);
  assert(
    '34. action center receives evolution actions',
    enriched.founderActionCenter.topActions.some((a) => /onboarding|adoption|friction|trust|delay/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '35. product coherence receives evolution summary',
    enriched.founderSensemaking.productEvolutionSummary != null &&
      (enriched.founderSensemaking.recommendedNextInvestments?.length ?? 0) >= 0,
    enriched.founderSensemaking.productEvolutionSummary ?? 'none',
  );

  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('36. V5 includes product evolution', Boolean(v5.productEvolution), String(v5.productEvolution.productEvolutionScore));
  assert('37. V5 markdown section', v5.reportMarkdown.includes('Product Evolution'), 'md');
  assert('38. V5 ranking visible', v5.productEvolution.candidates.every((c) => Boolean(c.rankingBucket)), 'ranking');
  assert(
    '39. V5 roadmap recommendations explainable',
    v5.productEvolution.productEvolutionSummary.length > 10 &&
      v5.productEvolution.evidenceTraceabilityPass &&
      v5.productEvolution.recommendationConfidenceVisibilityPass,
    String(v5.productEvolution.productEvolutionPass),
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
    console.log('PRODUCT_EVOLUTION_ENGINE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Product Evolution Score: ${evolution.productEvolutionScore} | Quick wins: ${evolution.quickWins.length} | Do not build: ${evolution.doNotBuild.length}`);
  console.log(`Confidence: ${evolution.recommendationConfidenceSummary}`);
  console.log('');
  console.log(PRODUCT_EVOLUTION_ENGINE_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
