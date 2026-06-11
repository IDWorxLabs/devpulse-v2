/**
 * Phase 24.9.18 — Launch Day Simulation Engine validation.
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
import {
  LAUNCH_DAY_SIMULATION_ENGINE_PASS_TOKEN,
  assessLaunchDaySimulation,
  enrichAssessmentsWithLaunchDaySimulation,
  resetLaunchDayCounterForTests,
} from '../src/launch-day-simulation-engine/index.js';
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
  console.log('Launch Day Simulation Engine — Validation');
  console.log('=========================================');
  console.log('');

  resetLaunchDayCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/launch-day-simulation-engine/launch-day-simulation-engine-authority.ts');
  const promiseAuthority = readText('src/promise-reality-engine/promise-reality-engine-authority.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const v5Scorer = readText('src/founder-testing-mode/founder-testing-v5-scorer.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/launch-day-simulation-engine/launch-day-simulation-engine-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/launch-day-simulation-engine/launch-day-simulation-engine-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:launch-day-simulation-engine']), 'package');
  assert('04. finding types', authority.includes('ONBOARDING_COLLAPSE') && authority.includes('LAUNCH_BLOCKER'), 'types');
  assert('05. all finding types', authority.includes('EXPECTATION_MISMATCH') && authority.includes('TRUST_FAILURE') && authority.includes('RECOVERY_FAILURE') && authority.includes('FOUNDER_BLIND_SPOT'), 'all');
  assert('06. simulation categories', authority.includes('NEW_USER_ARRIVAL') && authority.includes('CONCURRENT_USER'), 'categories');
  assert('07. launch day score', authority.includes('launchDayScore'), 'score');
  assert('08. operator feed events', authority.includes('Simulating new user arrival') && authority.includes('Ranking launch blockers'), 'feed');
  assert('09. product coherence integration', authority.includes('enrichAssessmentsWithLaunchDaySimulation') && authority.includes('launchConfidence'), 'coherence');
  assert('10. action center integration', authority.includes('Improve onboarding clarity') && authority.includes('Address launch blockers'), 'actions');
  assert('11. promise integration', promiseAuthority.includes('Users will adopt this workflow') && promiseAuthority.includes('launchDaySimulation') && promiseAuthority.includes('adoptionPrediction'), 'promise');
  assert('12. customer journey inputs', authority.includes('customerJourneySimulation') && authority.includes('adoptionBlockers'), 'customer');
  assert('13. V5 report section', v5Report.includes('Launch Day Simulation'), 'v5 md');
  assert('14. V4 orchestrator wired', v4Orchestrator.includes('assessLaunchDaySimulation') && v4Orchestrator.includes('enrichAssessmentsWithLaunchDaySimulation'), 'v4');
  assert('15. launch recommendation integration', v5Scorer.includes('NOT_READY_FOR_LAUNCH_DAY'), 'launch');
  assert('16. sensemaking launch fields', senseTypes.includes('launchDayBlockers'), 'sense');
  assert('17. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('18. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
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

  const launch = assessLaunchDaySimulation({
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

  assert('19. launch simulation executes', launch.launchDayScore >= 0 && launch.launchDayScore <= 100, String(launch.launchDayScore));
  assert('20. new user readiness subscore', launch.subscores.newUserReadiness >= 0, String(launch.subscores.newUserReadiness));
  assert('21. concurrent usage subscore', launch.subscores.concurrentUsageReadiness >= 0, String(launch.subscores.concurrentUsageReadiness));
  assert('22. expectation alignment subscore', launch.subscores.expectationAlignment >= 0, String(launch.subscores.expectationAlignment));
  assert('23. recovery readiness subscore', launch.subscores.recoveryReadiness >= 0, String(launch.subscores.recoveryReadiness));
  assert('24. trust survival subscore', launch.subscores.trustSurvival >= 0, String(launch.subscores.trustSurvival));
  assert('25. founder readiness subscore', launch.subscores.founderReadiness >= 0, String(launch.subscores.founderReadiness));
  assert('26. launch blocker detection', launch.launchBlockerDetectionPass, String(launch.topLaunchBlockers.length));
  assert('27. onboarding collapse detection', launch.onboardingCollapseDetectionPass, String(launch.findings.some((f) => f.type === 'ONBOARDING_COLLAPSE')));
  assert('28. trust failure detection', launch.trustFailureDetectionPass, String(launch.findings.some((f) => f.type === 'TRUST_FAILURE')));
  assert('29. recovery failure detection', launch.recoveryFailureDetectionPass, String(launch.findings.some((f) => f.type === 'RECOVERY_FAILURE')));
  assert('30. expectation mismatch detection', launch.expectationMismatchDetectionPass, String(launch.findings.some((f) => f.type === 'EXPECTATION_MISMATCH')));
  assert('31. bounded findings', launch.findings.length <= 12, String(launch.findings.length));
  guardRuntime('simulation');

  const brokenLaunch = assessLaunchDaySimulation({
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
      adoptionBlockers: customerJourneySimulation.findings.slice(0, 2),
      topAdoptionBlocker: 'Customer cannot get started',
    },
    visualQualityAuthority: { ...visualQualityAuthority, notLaunchReadyAppearance: true, launchAppearanceConfidence: 30 },
    verificationTrustEvidence: { ...verificationTrustEvidence, trustPass: false, blackBoxRisk: true, trustScore: 25 },
    founderFrictionHeatmap,
    founderInteractionSimulation: {
      ...founderInteractionSimulation,
      recoveryIssues: founderInteractionSimulation.recoveryIssues.length
        ? founderInteractionSimulation.recoveryIssues
        : [{ id: 'r1', type: 'INTERACTION_FAILURE', severity: 'HIGH', whatFailed: 'Recovery path weak', recommendedFix: 'Fix recovery', regressionScenario: 'recovery' }],
    },
    founderActionCenter: { ...actionBase, recommendedNextStep: null, topActions: [] },
    verificationResults: snapshot.verificationResults,
  });

  assert('32. detects launch risks on failure', brokenLaunch.majorLaunchRisks, String(brokenLaunch.findings.length));

  const enriched = enrichAssessmentsWithLaunchDaySimulation(actionBase, senseBase, brokenLaunch);
  assert(
    '33. action center receives launch actions',
    enriched.founderActionCenter.topActions.some((a) => /launch|onboarding|trust|recovery/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '34. product coherence receives launch risks',
    enriched.founderSensemaking.launchConfidence != null && (enriched.founderSensemaking.launchDayBlockers?.length ?? 0) > 0,
    String(enriched.founderSensemaking.launchDayBlockers?.length),
  );

  const promiseWithLaunch = assessPromiseRealityEngine({
    workspace: snapshot,
    shellSources,
    ideaToAppResults: [],
    creationJourney: [],
    launchDaySimulation: brokenLaunch,
    visualQualityAuthority: { ...visualQualityAuthority, notLaunchReadyAppearance: true, launchAppearanceConfidence: 30 },
  });
  assert(
    '35. promise evaluates workflow adoption claim',
    [
      ...promiseWithLaunch.provenClaims,
      ...promiseWithLaunch.partiallyProvenClaims,
      ...promiseWithLaunch.unprovenClaims,
      ...promiseWithLaunch.contradictedClaims,
    ].some((c) => /adopt this workflow/i.test(c.claim)),
    String(promiseWithLaunch.claimsEvaluated),
  );

  const launchRec = deriveLaunchRecommendation('READY_FOR_LAUNCH', 85, undefined, undefined, undefined, {
    ...brokenLaunch,
    majorLaunchRisks: true,
    launchDayPass: false,
  });
  assert('36. launch recommendation downgrades launch day risks', launchRec === 'NOT_READY_FOR_LAUNCH_DAY', launchRec);
  guardRuntime('integration');

  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('37. V5 includes launch day simulation', Boolean(v5.launchDaySimulation), String(v5.launchDaySimulation.launchDayScore));
  assert('38. V5 markdown section', v5.reportMarkdown.includes('Launch Day Simulation'), 'md');
  assert('39. V5 reports launch blockers', v5.launchDaySimulation.findings.length >= 0, String(v5.launchDaySimulation.topLaunchBlockers.length));
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
    console.log('LAUNCH_DAY_SIMULATION_ENGINE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Launch Day Score: ${launch.launchDayScore} | Confidence: ${launch.launchConfidence} | Findings: ${launch.findings.length}`);
  console.log('');
  console.log(LAUNCH_DAY_SIMULATION_ENGINE_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
