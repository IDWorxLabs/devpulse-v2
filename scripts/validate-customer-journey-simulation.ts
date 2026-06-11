/**
 * Phase 24.9.13 — Customer Journey Simulation Engine validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessFounderActionCenter } from '../src/founder-action-center/index.js';
import { assessFounderFrictionHeatmap } from '../src/founder-friction-heatmap/index.js';
import { assessFounderInteractionSimulation } from '../src/founder-interaction-simulation/index.js';
import { assessFounderSensemaking } from '../src/founder-sensemaking-engine/index.js';
import { assessFirstTimeUserReality } from '../src/first-time-user-reality/index.js';
import {
  CUSTOMER_JOURNEY_SIMULATION_PASS_TOKEN,
  assessCustomerJourneySimulation,
  enrichAssessmentsWithCustomerJourney,
  resetCustomerJourneyCounterForTests,
} from '../src/customer-journey-simulation/index.js';
import { assessVerificationTrustEvidence } from '../src/verification-trust-evidence/index.js';
import { evaluateProjectMemoryReality } from '../src/founder-testing-mode/execution-reality-engine.js';
import { deriveLaunchRecommendation } from '../src/founder-testing-mode/founder-testing-v5-scorer.js';
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
const MAX_RUNTIME_MS = 120_000;
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
  console.log('Customer Journey Simulation Engine — Validation');
  console.log('===============================================');
  console.log('');

  resetCustomerJourneyCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/customer-journey-simulation/customer-journey-simulation-authority.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const v5Scorer = readText('src/founder-testing-mode/founder-testing-v5-scorer.ts');
  const v5Phases = readText('src/founder-testing-mode/founder-testing-v5-phases.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/customer-journey-simulation/customer-journey-simulation-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/customer-journey-simulation/customer-journey-simulation-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:customer-journey-simulation']), 'package');
  assert('04. finding types', authority.includes('DISCOVERY_FAILURE') && authority.includes('ADOPTION_BLOCKER'), 'findings');
  assert('05. all journey finding types', authority.includes('ONBOARDING_FAILURE') && authority.includes('VALUE_REALIZATION_FAILURE') && authority.includes('CUSTOMER_TRUST_FAILURE') && authority.includes('RETENTION_RISK') && authority.includes('ADVOCACY_FAILURE'), 'journey findings');
  assert('06. customer personas bounded', authority.includes('new-customer') && authority.includes('power-user'), 'personas');
  assert('07. journey scenarios', authority.includes('journey-discovery') && authority.includes('journey-advocacy'), 'scenarios');
  assert('08. operator feed events', authority.includes('Simulating customer discovery') && authority.includes('Ranking adoption blockers'), 'feed');
  assert('09. product coherence integration', authority.includes('enrichAssessmentsWithCustomerJourney') && authority.includes('ADOPTION_RISK'), 'coherence');
  assert('10. action center integration', authority.includes('Improve onboarding flow') && authority.includes('Reduce time-to-value') && authority.includes('Clarify customer outcome'), 'actions');
  assert('11. sensemaking ADOPTION_RISK type', senseTypes.includes('ADOPTION_RISK'), 'sense type');
  assert('12. V5 report section', v5Report.includes('Customer Journey Simulation'), 'v5 md');
  assert('13. V4 orchestrator wired', v4Orchestrator.includes('assessCustomerJourneySimulation') && v4Orchestrator.includes('enrichAssessmentsWithCustomerJourney'), 'v4');
  assert('14. founder evaluation export', engine.includes('evaluateCustomerJourneySimulationVisibility'), 'visibility');
  assert('15. phase 5 integration', v5Phases.includes('customer journey simulation'), 'phase 5');
  assert('16. launch recommendation integration', v5Scorer.includes('NOT_READY_FOR_CUSTOMERS'), 'launch');
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

  const projectMemoryReality = evaluateProjectMemoryReality(snapshot);

  const customerJourney = assessCustomerJourneySimulation({
    shellSources,
    firstTimeUserReality,
    founderInteractionSimulation,
    verificationTrustEvidence,
    founderFrictionHeatmap,
    projectMemoryScore: projectMemoryReality.score,
    previewValidationReady: snapshot.livePreview.reality?.validationReady === true,
    autonomousBuilderConnected: snapshot.autonomousBuilder.executionConnected,
  });

  assert('19. customer simulation executes', customerJourney.customerJourneyScore >= 0 && customerJourney.customerJourneyScore <= 100, String(customerJourney.customerJourneyScore));
  assert('20. discovery journey evaluated', customerJourney.scenarios.some((s) => s.id === 'journey-discovery'), 'discovery');
  assert('21. onboarding journey evaluated', customerJourney.scenarios.some((s) => s.id === 'journey-onboarding'), 'onboarding');
  assert('22. value realization journey evaluated', customerJourney.scenarios.some((s) => s.id === 'journey-value'), 'value');
  assert('23. trust journey evaluated', customerJourney.scenarios.some((s) => s.id === 'journey-trust'), 'trust');
  assert('24. retention journey evaluated', customerJourney.scenarios.some((s) => s.id === 'journey-retention'), 'retention');
  assert('25. advocacy journey evaluated', customerJourney.scenarios.some((s) => s.id === 'journey-advocacy'), 'advocacy');
  assert('26. personas bounded', customerJourney.personas.length === 5, String(customerJourney.personas.length));
  assert('27. subscores present', customerJourney.subscores.discovery >= 0 && customerJourney.subscores.advocacy >= 0, 'subscores');
  assert('28. adoption blockers generated or clean pass', Array.isArray(customerJourney.adoptionBlockers), String(customerJourney.adoptionBlockers.length));
  assert('29. operator feed generated', (customerJourney.operatorFeedEvents?.length ?? 0) >= 5, String(customerJourney.operatorFeedEvents?.length));
  guardRuntime('simulation');

  const brokenJourney = assessCustomerJourneySimulation({
    shellSources: {
      appJs: appJs.replace(/welcome-product-purpose/g, 'broken-purpose'),
      html: html.replace(/first-time-founder-path/g, 'broken-path'),
      css,
    },
    firstTimeUserReality: {
      ...firstTimeUserReality,
      productUnderstandingPass: false,
      actionPathPass: false,
      firstTimeUserScore: 20,
    },
    founderInteractionSimulation: {
      ...founderInteractionSimulation,
      interactionScore: 20,
      modalCloseRegressionPass: false,
    },
    verificationTrustEvidence: {
      ...verificationTrustEvidence,
      trustPass: false,
      trustScore: 20,
      blackBoxRisk: true,
    },
    founderFrictionHeatmap: {
      ...founderFrictionHeatmap,
      overallFrictionScore: 80,
      summary: { ...founderFrictionHeatmap.summary, frictionLevel: 'HIGH' },
    },
    projectMemoryScore: 20,
    previewValidationReady: false,
    autonomousBuilderConnected: false,
  });

  assert('30. detects discovery failure', brokenJourney.findings.some((f) => f.type === 'DISCOVERY_FAILURE'), String(brokenJourney.findings.length));
  assert('31. generates adoption blockers on failure', brokenJourney.adoptionBlockers.length > 0, String(brokenJourney.adoptionBlockers.length));

  const enriched = enrichAssessmentsWithCustomerJourney(actionBase, senseBase, brokenJourney);
  assert(
    '32. action center receives customer fixes',
    enriched.founderActionCenter.topActions.some((a) => /onboarding|time-to-value|customer/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '33. product coherence receives customer risks',
    enriched.founderSensemaking.findings.some((f) =>
      ['CONFUSION', 'TRUST_RISK', 'COHERENCE_GAP', 'ADOPTION_RISK'].includes(f.type),
    ),
    String(enriched.founderSensemaking.findings.length),
  );

  const launchRec = deriveLaunchRecommendation('READY_FOR_LAUNCH', 85, brokenJourney);
  assert('34. launch recommendation downgrades customers', launchRec === 'NOT_READY_FOR_CUSTOMERS', launchRec);
  guardRuntime('integration');

  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('35. V5 includes customer journey', Boolean(v5.customerJourneySimulation), String(v5.customerJourneySimulation.customerJourneyScore));
  assert('36. V5 markdown section', v5.reportMarkdown.includes('Customer Journey Simulation'), 'md');
  assert('37. V5 launch recommendation aware', v5.reportMarkdown.includes('Launch Recommendation'), 'launch md');
  assert('38. bounded findings', v5.customerJourneySimulation.findings.length <= 12, String(v5.customerJourneySimulation.findings.length));
  guardRuntime('v5');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed > 0) {
    console.log('CUSTOMER_JOURNEY_SIMULATION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Customer journey score: ${customerJourney.customerJourneyScore} | Personas: ${customerJourney.personas.length}`);
  console.log('');
  console.log(CUSTOMER_JOURNEY_SIMULATION_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
