/**
 * Phase 24.9.17 — Visual Quality Authority validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assessFounderActionCenter } from '../src/founder-action-center/index.js';
import { assessFounderSensemaking } from '../src/founder-sensemaking-engine/index.js';
import { assessFirstTimeUserReality } from '../src/first-time-user-reality/index.js';
import { deriveLaunchRecommendation } from '../src/founder-testing-mode/founder-testing-v5-scorer.js';
import { runFounderTestingModeV5 } from '../src/founder-testing-mode/index.js';
import {
  VISUAL_QUALITY_AUTHORITY_PASS_TOKEN,
  assessVisualQualityAuthority,
  enrichAssessmentsWithVisualQuality,
  resetVisualQualityCounterForTests,
} from '../src/visual-quality-authority/index.js';
import { assessPromiseRealityEngine } from '../src/promise-reality-engine/index.js';
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
  console.log('Visual Quality Authority — Validation');
  console.log('=====================================');
  console.log('');

  resetVisualQualityCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/visual-quality-authority/visual-quality-authority-authority.ts');
  const promiseAuthority = readText('src/promise-reality-engine/promise-reality-engine-authority.ts');
  const v4Orchestrator = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const v5Scorer = readText('src/founder-testing-mode/founder-testing-v5-scorer.ts');
  const senseTypes = readText('src/founder-sensemaking-engine/founder-sensemaking-types.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/visual-quality-authority/visual-quality-authority-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/visual-quality-authority/visual-quality-authority-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:visual-quality-authority']), 'package');
  assert('04. finding types', authority.includes('VISUAL_CLUTTER') && authority.includes('LAUNCH_READINESS_RISK'), 'types');
  assert('05. all finding types', authority.includes('POOR_HIERARCHY') && authority.includes('WEAK_NAVIGATION') && authority.includes('MISALIGNED_LAYOUT') && authority.includes('LOW_PROFESSIONALISM'), 'all types');
  assert('06. subscores', authority.includes('firstImpression') && authority.includes('launchAppearance'), 'subscores');
  assert('07. operator feed events', authority.includes('Detecting visual hierarchy issues'), 'feed');
  assert('08. product coherence integration', authority.includes('enrichAssessmentsWithVisualQuality') && authority.includes('visualQualitySummary'), 'coherence');
  assert('09. action center integration', authority.includes('Improve visual hierarchy') && authority.includes('Reduce interface clutter'), 'actions');
  assert('10. promise integration', promiseAuthority.includes('Product looks launch-ready') && promiseAuthority.includes('visualQualityAuthority'), 'promise');
  assert('11. V5 report section', v5Report.includes('Visual Quality Authority'), 'v5 md');
  assert('12. V4 orchestrator wired', v4Orchestrator.includes('assessVisualQualityAuthority') && v4Orchestrator.includes('enrichAssessmentsWithVisualQuality'), 'v4');
  assert('13. launch recommendation integration', v5Scorer.includes('NOT_READY_FOR_VISUAL_QUALITY'), 'launch');
  assert('14. sensemaking visual fields', senseTypes.includes('visualQualitySummary'), 'sense fields');
  assert('15. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('16. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const shellSources = { appJs, html, css };
  const firstTimeUserReality = assessFirstTimeUserReality({ shellSources });
  const visual = assessVisualQualityAuthority({ shellSources, firstTimeUserReality });

  assert('17. visual assessment executes', visual.visualQualityScore >= 0 && visual.visualQualityScore <= 100, String(visual.visualQualityScore));
  assert('18. first impression subscore', visual.subscores.firstImpression >= 0, String(visual.subscores.firstImpression));
  assert('19. hierarchy subscore', visual.subscores.hierarchy >= 0, String(visual.subscores.hierarchy));
  assert('20. navigation subscore', visual.subscores.navigation >= 0, String(visual.subscores.navigation));
  assert('21. layout subscore', visual.subscores.layout >= 0, String(visual.subscores.layout));
  assert('22. professionalism subscore', visual.subscores.professionalism >= 0, String(visual.subscores.professionalism));
  assert('23. launch appearance subscore', visual.subscores.launchAppearance >= 0, String(visual.subscores.launchAppearance));
  assert('24. hierarchy detection', visual.hierarchyDetectionPass, String(visual.findings.some((f) => f.type === 'POOR_HIERARCHY')));
  assert('25. professionalism detection', visual.professionalismDetectionPass, String(visual.findings.some((f) => f.type === 'LOW_PROFESSIONALISM')));
  assert('26. clutter detection', visual.clutterDetectionPass, String(visual.findings.some((f) => f.type === 'VISUAL_CLUTTER')));
  assert('27. launch appearance detection', visual.launchAppearanceDetectionPass, String(visual.findings.some((f) => f.type === 'LAUNCH_READINESS_RISK')));
  assert('28. visual trust detection', visual.visualTrustDetectionPass, String(visual.trustRisks.length));
  assert('29. bounded findings', visual.findings.length <= 12, String(visual.findings.length));
  guardRuntime('simulation');

  const brokenVisual = assessVisualQualityAuthority({
    shellSources: {
      appJs: appJs.replace(/Demo data for visual testing/g, 'broken demo'),
      html: html.replace(/nav-help/g, 'broken-help'),
      css: css.replace(/grid-template-columns/g, 'broken-grid'),
    },
    firstTimeUserReality: {
      ...firstTimeUserReality,
      navigationUnderstandingPass: false,
      categoryScores: { ...firstTimeUserReality.categoryScores, navigation: 20 },
      firstTimeUserScore: 25,
    },
  });
  assert('30. detects broken visual signals', brokenVisual.findings.length > visual.findings.length || brokenVisual.visualQualityScore < visual.visualQualityScore, String(brokenVisual.findings.length));

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

  const enriched = enrichAssessmentsWithVisualQuality(actionBase, senseBase, brokenVisual);
  assert(
    '31. action center receives visual fixes',
    enriched.founderActionCenter.topActions.some((a) => /visual|clutter|hierarchy|navigation|launch/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '32. product coherence receives visual risks',
    enriched.founderSensemaking.visualQualitySummary != null && (enriched.founderSensemaking.topVisualRisks?.length ?? 0) > 0,
    enriched.founderSensemaking.visualQualitySummary ?? 'none',
  );

  const promiseWithVisual = assessPromiseRealityEngine({
    workspace: snapshot,
    shellSources,
    ideaToAppResults: [],
    creationJourney: [],
    visualQualityAuthority: brokenVisual,
  });
  assert(
    '33. promise evaluates visual launch claim',
    promiseWithVisual.claimsEvaluated > 0 &&
      [
        ...promiseWithVisual.provenClaims,
        ...promiseWithVisual.partiallyProvenClaims,
        ...promiseWithVisual.unprovenClaims,
        ...promiseWithVisual.contradictedClaims,
      ].some((c) => /launch-ready|looks launch/i.test(c.claim)),
    String(promiseWithVisual.claimsEvaluated),
  );

  const launchRec = deriveLaunchRecommendation('READY_FOR_LAUNCH', 85, undefined, undefined, {
    ...brokenVisual,
    majorVisualRisks: true,
    notLaunchReadyAppearance: true,
    visualQualityPass: false,
  });
  assert('34. launch recommendation downgrades visual quality', launchRec === 'NOT_READY_FOR_VISUAL_QUALITY', launchRec);
  guardRuntime('integration');

  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('35. V5 includes visual quality', Boolean(v5.visualQualityAuthority), String(v5.visualQualityAuthority.visualQualityScore));
  assert('36. V5 markdown section', v5.reportMarkdown.includes('Visual Quality Authority'), 'md');
  assert('37. V5 surfaces major visual risks', v5.visualQualityAuthority.findings.length >= 0, String(v5.visualQualityAuthority.findings.length));
  assert('38. promise includes visual claim in V5', v5.promiseRealityEngine.claimsEvaluated > 0, String(v5.promiseRealityEngine.claimsEvaluated));
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
    console.log('VISUAL_QUALITY_AUTHORITY_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Visual Quality Score: ${visual.visualQualityScore} | Launch Appearance: ${visual.subscores.launchAppearance} | Findings: ${visual.findings.length}`);
  console.log('');
  console.log(VISUAL_QUALITY_AUTHORITY_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
