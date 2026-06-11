/**
 * Phase 24.9.16 — Promise Reality Engine validation.
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
import {
  PROMISE_REALITY_ENGINE_PASS_TOKEN,
  assessPromiseRealityEngine,
  enrichAssessmentsWithPromiseReality,
  resetPromiseRealityCounterForTests,
} from '../src/promise-reality-engine/index.js';
import { assessVerificationTrustEvidence } from '../src/verification-trust-evidence/index.js';
import {
  buildPromiseRealityMatrix,
  detectRealityGaps,
  evaluateProjectMemoryReality,
} from '../src/founder-testing-mode/execution-reality-engine.js';
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
  console.log('Promise Reality Engine — Validation');
  console.log('===================================');
  console.log('');

  resetPromiseRealityCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/promise-reality-engine/promise-reality-engine-authority.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const v5Scorer = readText('src/founder-testing-mode/founder-testing-v5-scorer.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/promise-reality-engine/promise-reality-engine-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/promise-reality-engine/promise-reality-engine-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:promise-reality-engine']), 'package');
  assert('04. evidence levels', authority.includes('PROVEN') && authority.includes('PARTIALLY_PROVEN') && authority.includes('UNPROVEN') && authority.includes('CONTRADICTED'), 'levels');
  assert('05. promise categories', authority.includes('PRODUCT') && authority.includes('FEATURE') && authority.includes('WORKFLOW') && authority.includes('UX'), 'categories');
  assert('06. execution gap score', authority.includes('executionGapScore'), 'gap score');
  assert('07. promise reality score', authority.includes('promiseRealityScore'), 'score');
  assert('08. operator feed events', authority.includes('Detecting unsupported claims') && authority.includes('Detecting contradictions'), 'feed');
  assert('09. product coherence integration', authority.includes('enrichAssessmentsWithPromiseReality') && authority.includes('PROMISE_CONFLICT'), 'coherence');
  assert('10. action center integration', authority.includes('Validate unproven product claim'), 'actions');
  assert('11. first-time promise scenarios', authority.includes('promise-proven') && authority.includes('promise-contradicted'), 'first-time');
  assert('12. V5 report section', v5Report.includes('Promise Reality Engine'), 'v5 md');
  assert('13. V4 orchestrator wired', v4Orchestrator.includes('assessPromiseRealityEngine') && v4Orchestrator.includes('enrichAssessmentsWithPromiseReality'), 'v4');
  assert('14. matrix reuse', engine.includes('buildPromiseRealityMatrix'), 'matrix');
  assert('15. launch recommendation integration', v5Scorer.includes('NOT_READY_FOR_PROMISE_REALITY'), 'launch');
  assert('16. sensemaking reality fields', senseTypes.includes('realityConfidence'), 'sense fields');
  assert('17. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('18. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const shellSources = { appJs, html, css };
  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const snapshot = buildProductWorkspaceSnapshot(validatorScripts);
  const firstTimeUserReality = assessFirstTimeUserReality({ shellSources });
  const founderInteractionSimulation = assessFounderInteractionSimulation({ shellSources });
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
  const promiseMatrix = buildPromiseRealityMatrix(snapshot, shellSources, []);
  const realityGaps = detectRealityGaps(promiseMatrix, snapshot, []);

  const promise = assessPromiseRealityEngine({
    workspace: snapshot,
    shellSources,
    ideaToAppResults: [],
    creationJourney: [],
    promiseMatrix,
    realityGaps,
    firstTimeUserReality,
    verificationTrustEvidence,
    customerJourneySimulation,
    founderSensemaking: senseBase,
    founderFrictionHeatmap,
    verificationResults: snapshot.verificationResults,
  });

  assert('19. promise assessment executes', promise.claimsEvaluated > 0, String(promise.claimsEvaluated));
  assert('20. proven claims list', Array.isArray(promise.provenClaims), String(promise.provenClaims.length));
  assert('21. partial claims list', Array.isArray(promise.partiallyProvenClaims), String(promise.partiallyProvenClaims.length));
  assert('22. unproven claims list', Array.isArray(promise.unprovenClaims), String(promise.unprovenClaims.length));
  assert('23. contradicted claims list', Array.isArray(promise.contradictedClaims), String(promise.contradictedClaims.length));
  assert('24. unsupported claim detection', promise.unsupportedClaimDetectionPass, String(promise.unprovenClaims.length));
  assert('25. contradiction detection', promise.contradictionDetectionPass, String(promise.contradictedClaims.length));
  assert('26. missing evidence detection', promise.missingEvidenceDetectionPass, String(promise.partiallyProvenClaims.length));
  assert('27. execution gap detection', promise.executionGapDetectionPass, String(promise.executionGapScore));
  assert('28. founder promise scenarios', promise.founderPromiseScenarios.length === 4, String(promise.founderPromiseScenarios.length));
  assert('29. bounded claims', promise.claimsEvaluated <= 20, String(promise.claimsEvaluated));
  guardRuntime('simulation');

  const enriched = enrichAssessmentsWithPromiseReality(actionBase, senseBase, promise, firstTimeUserReality);
  assert(
    '30. action center receives validation actions',
    enriched.founderActionCenter.topActions.some((a) => /validate|claim|verification|preview/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '31. product coherence receives promise conflicts',
    enriched.founderSensemaking.findings.some((f) => f.type === 'PROMISE_CONFLICT' || f.type === 'COHERENCE_GAP'),
    String(enriched.founderSensemaking.findings.length),
  );
  assert(
    '32. first-time receives promise scenarios',
    (enriched.firstTimeUserReality?.scenarios.some((s) => s.id.startsWith('promise-')) ?? false),
    String(enriched.firstTimeUserReality?.scenarios.length),
  );

  const brokenPromise = assessPromiseRealityEngine({
    workspace: {
      ...snapshot,
      autonomousBuilder: { ...snapshot.autonomousBuilder, executionConnected: false, world2FoundationComplete: false },
    },
    shellSources,
    ideaToAppResults: [],
    creationJourney: [],
    promiseMatrix,
    realityGaps,
  });
  const launchRec = deriveLaunchRecommendation('READY_FOR_LAUNCH', 85, undefined, brokenPromise);
  assert('33. launch recommendation downgrades unsupported claims', launchRec === 'NOT_READY_FOR_PROMISE_REALITY', launchRec);
  guardRuntime('integration');

  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('34. V5 includes promise reality', Boolean(v5.promiseRealityEngine), String(v5.promiseRealityEngine.promiseRealityScore));
  assert('35. V5 markdown section', v5.reportMarkdown.includes('Promise Reality Engine'), 'md');
  assert('36. V5 detection flags', v5.promiseRealityEngine.unsupportedClaimDetectionPass && v5.promiseRealityEngine.executionGapDetectionPass, 'flags');
  assert('37. first-time promise scenarios in V5', v5.firstTimeUserReality.scenarios.some((s) => s.id.startsWith('promise-')), 'scenarios');
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
    console.log('PROMISE_REALITY_ENGINE_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Promise Reality Score: ${promise.promiseRealityScore} | Execution Gap: ${promise.executionGapScore} | Claims: ${promise.claimsEvaluated}`);
  console.log('');
  console.log(PROMISE_REALITY_ENGINE_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
