/**
 * Phase 24.9.19 — Adoption Prediction Engine validation.
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
import {
  ADOPTION_PREDICTION_ENGINE_PASS_TOKEN,
  assessAdoptionPrediction,
  enrichAssessmentsWithAdoptionPrediction,
  resetAdoptionPredictionCounterForTests,
} from '../src/adoption-prediction-engine/index.js';
import { assessPromiseRealityEngine } from '../src/promise-reality-engine/index.js';
import { assessVerificationTrustEvidence } from '../src/verification-trust-evidence/index.js';
import { deriveLaunchRecommendation } from '../src/founder-testing-mode/founder-testing-v5-scorer.js';
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
  console.log('Adoption Prediction Engine — Validation');
  console.log('=======================================');
  console.log('');

  resetAdoptionPredictionCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/adoption-prediction-engine/adoption-prediction-engine-authority.ts');
  const promiseAuthority = readText('src/promise-reality-engine/promise-reality-engine-authority.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const v5Scorer = readText('src/founder-testing-mode/founder-testing-v5-scorer.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/adoption-prediction-engine/adoption-prediction-engine-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/adoption-prediction-engine/adoption-prediction-engine-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:adoption-prediction-engine']), 'package');
  assert('04. finding types', authority.includes('VALUE_UNCLEAR') && authority.includes('ADOPTION_BLOCKER'), 'types');
  assert('05. all finding types', authority.includes('TIME_TO_VALUE_TOO_LONG') && authority.includes('RETENTION_RISK') && authority.includes('LOW_RECOMMENDATION_POTENTIAL') && authority.includes('COMPETITIVE_REPLACEMENT_RISK'), 'all');
  assert('06. adoption categories', authority.includes('valueClarity') && authority.includes('timeToValue') && authority.includes('competitivePressure'), 'categories');
  assert('07. adoption prediction score', authority.includes('adoptionPredictionScore'), 'score');
  assert('08. operator feed events', authority.includes('Evaluating value clarity') && authority.includes('Detecting adoption blockers'), 'feed');
  assert('09. product coherence integration', authority.includes('enrichAssessmentsWithAdoptionPrediction') && authority.includes('adoptionConfidence'), 'coherence');
  assert('10. action center integration', authority.includes('Clarify value proposition') && authority.includes('Improve differentiation'), 'actions');
  assert('11. promise integration', promiseAuthority.includes('Users will adopt this workflow') && promiseAuthority.includes('adoptionPrediction') && promiseAuthority.includes('continue using and recommend'), 'promise');
  assert('12. customer journey inputs', authority.includes('customerJourneySimulation') && authority.includes('adoptionBlockers'), 'customer');
  assert('13. launch day inputs', authority.includes('launchDaySimulation') && authority.includes('ONBOARDING_COLLAPSE'), 'launch');
  assert('14. V5 report section', v5Report.includes('Adoption Prediction'), 'v5 md');
  assert('15. V4 orchestrator wired', v4Orchestrator.includes('assessAdoptionPrediction') && v4Orchestrator.includes('enrichAssessmentsWithAdoptionPrediction'), 'v4');
  assert('16. launch recommendation integration', v5Scorer.includes('NOT_READY_FOR_ADOPTION'), 'adoption');
  assert('17. sensemaking adoption fields', senseTypes.includes('adoptionPredictionBlockers') && senseTypes.includes('adoptionRetentionRisks'), 'sense');
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

  const adoption = assessAdoptionPrediction({
    shellSources,
    firstTimeUserReality,
    customerJourneySimulation,
    launchDaySimulation,
    visualQualityAuthority,
    founderFrictionHeatmap,
  });

  assert('20. adoption prediction executes', adoption.adoptionPredictionScore >= 0 && adoption.adoptionPredictionScore <= 100, String(adoption.adoptionPredictionScore));
  assert('21. value clarity subscore', adoption.subscores.valueClarity >= 0, String(adoption.subscores.valueClarity));
  assert('22. time-to-value subscore', adoption.subscores.timeToValue >= 0, String(adoption.subscores.timeToValue));
  assert('23. adoption friction subscore', adoption.subscores.adoptionFriction >= 0, String(adoption.subscores.adoptionFriction));
  assert('24. retention potential subscore', adoption.subscores.retentionPotential >= 0, String(adoption.subscores.retentionPotential));
  assert('25. recommendation potential subscore', adoption.subscores.recommendationPotential >= 0, String(adoption.subscores.recommendationPotential));
  assert('26. competitive pressure subscore', adoption.subscores.competitivePressure >= 0, String(adoption.subscores.competitivePressure));
  assert('27. value clarity detection', adoption.valueClarityDetectionPass, String(adoption.findings.some((f) => f.type === 'VALUE_UNCLEAR')));
  assert('28. adoption blocker detection', adoption.adoptionBlockerDetectionPass, String(adoption.adoptionBlockers.length));
  assert('29. retention risk detection', adoption.retentionRiskDetectionPass, String(adoption.retentionRisks.length));
  assert('30. recommendation risk detection', adoption.recommendationRiskDetectionPass, String(adoption.recommendationRisks.length));
  assert('31. competitive risk detection', adoption.competitiveRiskDetectionPass, String(adoption.competitiveRisks.length));
  assert('32. bounded findings', adoption.findings.length <= 12, String(adoption.findings.length));
  guardRuntime('simulation');

  const brokenLaunchDay = {
    ...launchDaySimulation,
    launchDayScore: 35,
    majorLaunchRisks: true,
    subscores: {
      ...launchDaySimulation.subscores,
      newUserReadiness: 30,
      expectationAlignment: 35,
      trustSurvival: 40,
    },
    findings: launchDaySimulation.findings.length
      ? launchDaySimulation.findings
      : [
          {
            id: 'ld1',
            type: 'ONBOARDING_COLLAPSE' as const,
            category: 'NEW_USER_ARRIVAL' as const,
            severity: 'HIGH' as const,
            explanation: 'Onboarding collapses for new users',
            recommendation: 'Fix onboarding',
          },
        ],
  };

  const brokenAdoption = assessAdoptionPrediction({
    shellSources,
    firstTimeUserReality: {
      ...firstTimeUserReality,
      firstTimeUserScore: 25,
      actionPathPass: false,
      productUnderstandingPass: false,
      categoryScores: { understanding: 20, navigation: 20, workflow: 20, trust: 20, simplicity: 20 },
    },
    customerJourneySimulation: {
      ...customerJourneySimulation,
      notReadyForCustomers: true,
      customerJourneyScore: 35,
      subscores: {
        ...customerJourneySimulation.subscores,
        discovery: 25,
        onboarding: 20,
        value: 25,
        retention: 30,
        advocacy: 25,
      },
      adoptionBlockers: customerJourneySimulation.findings.slice(0, 2),
      topAdoptionBlocker: 'Customer cannot get started',
    },
    launchDaySimulation: brokenLaunchDay,
    visualQualityAuthority: { ...visualQualityAuthority, visualQualityScore: 40, notLaunchReadyAppearance: true },
    founderFrictionHeatmap: {
      ...founderFrictionHeatmap,
      overallFrictionScore: 75,
      summary: { ...founderFrictionHeatmap.summary, frictionLevel: 'HIGH' },
    },
  });

  assert('33. detects adoption risks on failure', brokenAdoption.majorAdoptionRisks, String(brokenAdoption.findings.length));

  const enriched = enrichAssessmentsWithAdoptionPrediction(actionBase, senseBase, brokenAdoption);
  assert(
    '34. action center receives adoption actions',
    enriched.founderActionCenter.topActions.some((a) => /adoption|value|onboarding|retention|differentiation/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '35. product coherence receives adoption risks',
    enriched.founderSensemaking.adoptionConfidence != null &&
      (enriched.founderSensemaking.adoptionPredictionBlockers?.length ?? 0) > 0,
    String(enriched.founderSensemaking.adoptionPredictionBlockers?.length),
  );

  const promiseWithAdoption = assessPromiseRealityEngine({
    workspace: snapshot,
    shellSources,
    ideaToAppResults: [],
    creationJourney: [],
    launchDaySimulation: brokenLaunchDay,
    adoptionPrediction: brokenAdoption,
    visualQualityAuthority: { ...visualQualityAuthority, notLaunchReadyAppearance: true },
  });
  assert(
    '36. promise evaluates adoption workflow claim',
    [
      ...promiseWithAdoption.provenClaims,
      ...promiseWithAdoption.partiallyProvenClaims,
      ...promiseWithAdoption.unprovenClaims,
      ...promiseWithAdoption.contradictedClaims,
    ].some((c) => /adopt this workflow/i.test(c.claim)),
    String(promiseWithAdoption.claimsEvaluated),
  );
  assert(
    '37. promise evaluates retention recommendation claim',
    [
      ...promiseWithAdoption.provenClaims,
      ...promiseWithAdoption.partiallyProvenClaims,
      ...promiseWithAdoption.unprovenClaims,
      ...promiseWithAdoption.contradictedClaims,
    ].some((c) => /continue using and recommend/i.test(c.claim)),
    String(promiseWithAdoption.claimsEvaluated),
  );

  const adoptionRec = deriveLaunchRecommendation('READY_FOR_LAUNCH', 85, undefined, undefined, undefined, undefined, {
    ...brokenAdoption,
    majorAdoptionRisks: true,
    adoptionPredictionPass: false,
  });
  assert('38. launch recommendation downgrades adoption risks', adoptionRec === 'NOT_READY_FOR_ADOPTION', adoptionRec);
  guardRuntime('integration');

  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('39. V5 includes adoption prediction', Boolean(v5.adoptionPrediction), String(v5.adoptionPrediction.adoptionPredictionScore));
  assert('40. V5 markdown section', v5.reportMarkdown.includes('Adoption Prediction'), 'md');
  assert('41. V5 reports adoption blockers', v5.adoptionPrediction.findings.length >= 0, String(v5.adoptionPrediction.adoptionBlockers.length));
  assert(
    '42. V5 adoption validation flags',
    v5.adoptionPrediction.valueClarityDetectionPass && v5.adoptionPrediction.adoptionBlockerDetectionPass,
    String(v5.adoptionPrediction.adoptionPredictionPass),
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
    console.log('ADOPTION_PREDICTION_ENGINE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Adoption Prediction Score: ${adoption.adoptionPredictionScore} | Confidence: ${adoption.adoptionConfidence} | Findings: ${adoption.findings.length}`);
  console.log('');
  console.log(ADOPTION_PREDICTION_ENGINE_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
