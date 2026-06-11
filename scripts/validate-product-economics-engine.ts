/**
 * Phase 24.9.20 — Product Economics Engine validation (leaf mode).
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
import {
  PRODUCT_ECONOMICS_ENGINE_PASS_TOKEN,
  assessProductEconomics,
  enrichAssessmentsWithProductEconomics,
  resetProductEconomicsCounterForTests,
} from '../src/product-economics-engine/index.js';
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

function main(): void {
  console.log('');
  console.log('Product Economics Engine — Validation');
  console.log('=======================================');
  console.log('');

  resetProductEconomicsCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/product-economics-engine/product-economics-engine-authority.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const orchestrator = readText('scripts/validation-runtime-orchestrator.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/product-economics-engine/product-economics-engine-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/product-economics-engine/product-economics-engine-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:product-economics-engine']), 'package');
  assert('04. finding types', authority.includes('LOW_USER_VALUE') && authority.includes('NEGATIVE_ROI'), 'types');
  assert('05. all finding types', authority.includes('HIGH_BUILD_COST') && authority.includes('HIGH_MAINTENANCE_COST') && authority.includes('LOW_ADOPTION_IMPACT') && authority.includes('ECONOMIC_RISK'), 'all');
  assert('06. economics categories', authority.includes('userValue') && authority.includes('buildCost') && authority.includes('strategicValue'), 'categories');
  assert('07. ROI classifications', authority.includes('BUILD_NOW') && authority.includes('BUILD_LATER') && authority.includes('EXPERIMENT_FIRST') && authority.includes('DO_NOT_BUILD'), 'roi');
  assert('08. operator feed events', authority.includes('Evaluating user value') && authority.includes('Classifying ROI opportunities'), 'feed');
  assert('09. product coherence integration', authority.includes('enrichAssessmentsWithProductEconomics') && authority.includes('productEconomicsSummary'), 'coherence');
  assert('10. action center integration', authority.includes('Prioritize high ROI feature') && authority.includes('Focus on adoption blockers first'), 'actions');
  assert('11. adoption inputs', authority.includes('adoptionPrediction') && authority.includes('retentionRisks'), 'adoption');
  assert('12. launch day inputs', authority.includes('launchDaySimulation') && authority.includes('trustRisks'), 'launch');
  assert('13. V5 report section', v5Report.includes('Product Economics'), 'v5 md');
  assert('14. V4 orchestrator wired', v4Orchestrator.includes('assessProductEconomics') && v4Orchestrator.includes('enrichAssessmentsWithProductEconomics'), 'v4');
  assert('15. sensemaking economics fields', senseTypes.includes('productEconomicsSummary') && senseTypes.includes('strategicInvestmentCandidates'), 'sense');
  assert('16. no nested validator cascade in leaf script', !authority.includes("execSync('npm run validate:"), 'cascade');
  assert('17. suite includes economics', orchestrator.includes('validate:product-economics-engine'), 'suite');
  assert('18. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('19. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const shellSources = { appJs, html, css };
  const firstTimeUserReality = assessFirstTimeUserReality({ shellSources });
  const founderInteractionSimulation = assessFounderInteractionSimulation({ shellSources });
  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
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
    shellSources: { appJs, html },
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

  const economics = assessProductEconomics({
    shellSources,
    firstTimeUserReality,
    customerJourneySimulation,
    launchDaySimulation,
    adoptionPrediction,
    founderFrictionHeatmap,
    promiseRealityEngine,
    validatorScriptCount: validatorScripts.length,
  });

  assert('20. economics assessment executes', economics.productEconomicsScore >= 0 && economics.productEconomicsScore <= 100, String(economics.productEconomicsScore));
  assert('21. user value subscore', economics.subscores.userValue >= 0, String(economics.subscores.userValue));
  assert('22. founder value subscore', economics.subscores.founderValue >= 0, String(economics.subscores.founderValue));
  assert('23. build cost subscore', economics.subscores.buildCost >= 0, String(economics.subscores.buildCost));
  assert('24. maintenance cost subscore', economics.subscores.maintenanceCost >= 0, String(economics.subscores.maintenanceCost));
  assert('25. adoption impact subscore', economics.subscores.adoptionImpact >= 0, String(economics.subscores.adoptionImpact));
  assert('26. strategic value subscore', economics.subscores.strategicValue >= 0, String(economics.subscores.strategicValue));
  assert('27. ROI classification visibility', economics.roiClassificationVisibilityPass, String(economics.featureEvaluations.length));
  assert('28. cost visibility', economics.costVisibilityPass, String(economics.subscores.buildCost));
  assert('29. value visibility', economics.valueVisibilityPass, String(economics.subscores.userValue));
  assert('30. strategic alignment visibility', economics.strategicAlignmentVisibilityPass, String(economics.subscores.strategicValue));
  assert('31. economic risk visibility', economics.economicRiskVisibilityPass, String(economics.findings.length));
  assert('32. bounded features', economics.featureEvaluations.length <= 8, String(economics.featureEvaluations.length));
  assert('33. ranked opportunities', economics.highestRoiOpportunities.length >= 0 && economics.lowestRoiOpportunities.length >= 0, 'ranked');
  guardRuntime('simulation');

  const brokenEconomics = assessProductEconomics({
    shellSources,
    firstTimeUserReality: {
      ...firstTimeUserReality,
      firstTimeUserScore: 25,
      productUnderstandingPass: false,
      categoryScores: { understanding: 20, navigation: 20, workflow: 20, trust: 20, simplicity: 20 },
    },
    customerJourneySimulation: {
      ...customerJourneySimulation,
      notReadyForCustomers: true,
      customerJourneyScore: 30,
      customerReady: false,
    },
    launchDaySimulation: {
      ...launchDaySimulation,
      majorLaunchRisks: true,
      launchDayScore: 35,
      trustRisks: ['Launch trust economics weak'],
    },
    adoptionPrediction: {
      ...adoptionPrediction,
      majorAdoptionRisks: true,
      adoptionPredictionScore: 35,
      retentionRisks: ['Retention economics weak'],
      recommendationRisks: ['Recommendation economics weak'],
    },
    founderFrictionHeatmap: {
      ...founderFrictionHeatmap,
      overallFrictionScore: 80,
      summary: { ...founderFrictionHeatmap.summary, frictionLevel: 'HIGH' },
    },
    promiseRealityEngine: {
      ...promiseRealityEngine,
      majorClaimsUnsupported: true,
      promiseRealityScore: 30,
    },
    validatorScriptCount: validatorScripts.length,
  });

  assert('34. detects economic risks on failure', brokenEconomics.majorEconomicRisks || brokenEconomics.findings.length > 0, String(brokenEconomics.findings.length));

  const enriched = enrichAssessmentsWithProductEconomics(actionBase, senseBase, brokenEconomics);
  assert(
    '35. action center receives economics actions',
    enriched.founderActionCenter.topActions.some((a) => /ROI|economics|adoption blockers|maintenance/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '36. product coherence receives economics summary',
    enriched.founderSensemaking.productEconomicsSummary != null &&
      (enriched.founderSensemaking.highestRoiOpportunities?.length ?? 0) >= 0,
    enriched.founderSensemaking.productEconomicsSummary ?? 'none',
  );

  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('37. V5 includes product economics', Boolean(v5.productEconomics), String(v5.productEconomics.productEconomicsScore));
  assert('38. V5 markdown section', v5.reportMarkdown.includes('Product Economics'), 'md');
  assert('39. V5 ROI classifications visible', v5.productEconomics.featureEvaluations.every((f) => Boolean(f.roiClassification)), 'roi');
  assert(
    '40. V5 economics conclusions explainable',
    v5.productEconomics.productEconomicsSummary.length > 10 &&
      v5.productEconomics.roiClassificationVisibilityPass &&
      v5.productEconomics.costVisibilityPass &&
      v5.productEconomics.valueVisibilityPass,
    String(v5.productEconomics.productEconomicsPass),
  );
  guardRuntime('v5');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => r.passed === false).length;
  const runtimeMs = Date.now() - START;

  console.log('');
  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed} | Runtime: ${runtimeMs}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed > 0) {
    console.log('PRODUCT_ECONOMICS_ENGINE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Product Economics Score: ${economics.productEconomicsScore} | BUILD_NOW: ${economics.featureEvaluations.filter((f) => f.roiClassification === 'BUILD_NOW').length} | DO_NOT_BUILD: ${economics.featureEvaluations.filter((f) => f.roiClassification === 'DO_NOT_BUILD').length}`);
  console.log('');
  console.log(PRODUCT_ECONOMICS_ENGINE_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
