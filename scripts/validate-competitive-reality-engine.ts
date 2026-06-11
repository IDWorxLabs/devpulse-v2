/**
 * Phase 24.9.22 — Competitive Reality Engine validation (leaf mode).
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
import {
  COMPETITIVE_REALITY_ENGINE_PASS_TOKEN,
  assessCompetitiveReality,
  enrichAssessmentsWithCompetitiveReality,
  resetCompetitiveRealityCounterForTests,
} from '../src/competitive-reality-engine/index.js';
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
    productEvolution,
    validatorScripts,
  };
}

function main(): void {
  console.log('');
  console.log('Competitive Reality Engine — Validation');
  console.log('========================================');
  console.log('');

  resetCompetitiveRealityCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/competitive-reality-engine/competitive-reality-engine-authority.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const orchestrator = readText('scripts/validation-runtime-orchestrator.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/competitive-reality-engine/competitive-reality-engine-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/competitive-reality-engine/competitive-reality-engine-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:competitive-reality-engine']), 'package');
  assert('04. competitive categories', authority.includes('differentiationStrength') && authority.includes('blindSpotRisk'), 'categories');
  assert('05. finding types', authority.includes('WEAK_DIFFERENTIATION') && authority.includes('HIGH_REPLACEMENT_RISK') && authority.includes('UNPROVEN_ADVANTAGE'), 'findings');
  assert('06. position classifications', authority.includes('STRONG_DIFFERENTIATION') && authority.includes('COMMODITY_RISK'), 'classification');
  assert('07. claim statuses', authority.includes('PARTIALLY_PROVEN') && authority.includes('UNPROVEN') && authority.includes('CONTRADICTED'), 'claims');
  assert('08. operator feed events', authority.includes('Evaluating differentiation strength') && authority.includes('Classifying competitive position'), 'feed');
  assert('09. product coherence integration', authority.includes('enrichAssessmentsWithCompetitiveReality') && authority.includes('competitiveRealitySummary'), 'coherence');
  assert('10. action center integration', authority.includes('Strengthen unique authority systems') && authority.includes('Reduce replacement risk'), 'actions');
  assert('11. evolution inputs', authority.includes('productEvolution') && authority.includes('quickWins'), 'evolution');
  assert('12. economics inputs', authority.includes('productEconomics') && authority.includes('strategicValue'), 'economics');
  assert('13. promise inputs', authority.includes('promiseRealityEngine') && authority.includes('majorClaimsUnsupported'), 'promise');
  assert('14. V5 report section', v5Report.includes('Competitive Reality'), 'v5 md');
  assert('15. V4 orchestrator wired', v4Orchestrator.includes('assessCompetitiveReality') && v4Orchestrator.includes('enrichAssessmentsWithCompetitiveReality'), 'v4');
  assert('16. sensemaking competitive fields', senseTypes.includes('competitivePosition') && senseTypes.includes('topCompetitiveAdvantages'), 'sense');
  assert('17. no nested validator cascade', !authority.includes("execSync('npm run validate:"), 'cascade');
  assert('18. suite includes competitive', orchestrator.includes('validate:competitive-reality-engine'), 'suite');
  assert('19. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('20. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const shellSources = { appJs, html, css };
  const stack = buildAuthorityStack(shellSources);

  const competitive = assessCompetitiveReality({
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
    validatorScriptCount: stack.validatorScripts.length,
  });

  assert('21. competitive assessment executes', competitive.competitiveRealityScore >= 0 && competitive.competitiveRealityScore <= 100, String(competitive.competitiveRealityScore));
  assert('22. differentiation strength score', competitive.portfolioSubscores.differentiationStrength >= 0, String(competitive.portfolioSubscores.differentiationStrength));
  assert('23. replacement risk score', competitive.portfolioSubscores.replacementRisk >= 0, String(competitive.portfolioSubscores.replacementRisk));
  assert('24. founder advantage score', competitive.portfolioSubscores.founderAdvantage >= 0, String(competitive.portfolioSubscores.founderAdvantage));
  assert('25. product advantage score', competitive.portfolioSubscores.productAdvantage >= 0, String(competitive.portfolioSubscores.productAdvantage));
  assert('26. strategic defensibility score', competitive.portfolioSubscores.strategicDefensibility >= 0, String(competitive.portfolioSubscores.strategicDefensibility));
  assert('27. blind spot score', competitive.portfolioSubscores.blindSpotRisk >= 0, String(competitive.portfolioSubscores.blindSpotRisk));
  assert('28. competitive advantage visibility', competitive.competitiveAdvantageVisibilityPass, String(competitive.strongestCompetitiveAdvantages.length));
  assert('29. replacement risk visibility', competitive.replacementRiskVisibilityPass, String(competitive.highReplacementRisks.length));
  assert('30. defensibility visibility', competitive.defensibilityVisibilityPass, String(competitive.strategicDefensibility.length));
  assert('31. blind spot visibility', competitive.blindSpotVisibilityPass, String(competitive.competitiveBlindSpots.length));
  assert('32. classification visibility', competitive.competitiveClassificationVisibilityPass, competitive.competitivePosition);
  assert('33. bounded findings', competitive.findings.length <= 12, String(competitive.findings.length));
  guardRuntime('simulation');

  const brokenCompetitive = assessCompetitiveReality({
    shellSources,
    firstTimeUserReality: {
      ...stack.firstTimeUserReality,
      firstTimeUserScore: 25,
      actionPathPass: false,
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
      competitiveRisks: stack.adoptionPrediction.competitiveRisks.length
        ? stack.adoptionPrediction.competitiveRisks
        : ['Generic builder overlap risk'],
    },
    productEconomics: {
      ...stack.productEconomics,
      majorEconomicRisks: true,
      productEconomicsScore: 35,
    },
    productEvolution: {
      ...stack.productEvolution,
      majorEvolutionRisks: true,
      productEvolutionScore: 35,
      doNotBuild: ['[LOW] Expand product surface before core workflow is ready'],
    },
    validatorScriptCount: 3,
  });

  assert(
    '34. detects competitive risks on failure',
    brokenCompetitive.majorCompetitiveRisks ||
      brokenCompetitive.competitivePosition === 'COMMODITY_RISK' ||
      brokenCompetitive.findings.some((f) => f.severity === 'HIGH' || f.severity === 'CRITICAL'),
    brokenCompetitive.competitivePosition,
  );

  const enriched = enrichAssessmentsWithCompetitiveReality(stack.actionBase, stack.senseBase, brokenCompetitive);
  assert(
    '35. action center receives competitive actions',
    enriched.founderActionCenter.topActions.some((a) => /authority|differentiation|replacement|validate|defensib/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '36. product coherence receives competitive summary',
    enriched.founderSensemaking.competitiveRealitySummary != null &&
      enriched.founderSensemaking.competitivePosition != null,
    enriched.founderSensemaking.competitiveRealitySummary ?? 'none',
  );

  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('37. V5 includes competitive reality', Boolean(v5.competitiveReality), String(v5.competitiveReality.competitiveRealityScore));
  assert('38. V5 markdown section', v5.reportMarkdown.includes('Competitive Reality'), 'md');
  assert('39. V5 classification visible', Boolean(v5.competitiveReality.competitivePosition), v5.competitiveReality.competitivePosition);
  assert(
    '40. V5 competitive conclusions explainable',
    v5.competitiveReality.competitiveRealitySummary.length > 10 &&
      v5.competitiveReality.competitiveAdvantageVisibilityPass &&
      v5.competitiveReality.competitiveClassificationVisibilityPass,
    String(v5.competitiveReality.competitiveRealityPass),
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
    console.log('COMPETITIVE_REALITY_ENGINE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Competitive Reality Score: ${competitive.competitiveRealityScore} | Position: ${competitive.competitivePosition}`);
  console.log(`Strongest advantages: ${competitive.strongestCompetitiveAdvantages.length} | Blind spots: ${competitive.competitiveBlindSpots.length}`);
  console.log('');
  console.log(COMPETITIVE_REALITY_ENGINE_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
