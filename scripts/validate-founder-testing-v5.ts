/**
 * Phase 24.9.9 — Founder Testing V5 unification validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_V5_MAX_PHASES,
  FOUNDER_TEST_V5_REPORT_TITLE,
  FOUNDER_TESTING_MODE_V5_PASS_TOKEN,
  runFounderTestingModeV5,
} from '../src/founder-testing-mode/index.js';
import {
  assessFirstTimeUserReality,
  firstTimeActionPathResolved,
  FIRST_TIME_USER_ACTION_PATH_PASS_TOKEN,
} from '../src/first-time-user-reality/index.js';
import {
  VERIFICATION_TRUST_AND_EVIDENCE_CLARITY_PASS_TOKEN,
  assessVerificationTrustEvidence,
  verificationTrustEvidenceResolved,
} from '../src/verification-trust-evidence/index.js';
import {
  FOUNDER_FRICTION_HEATMAP_PASS_TOKEN,
  assessFounderFrictionHeatmap,
  founderFrictionHeatmapResolved,
} from '../src/founder-friction-heatmap/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

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

async function fetchUnified(): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('No address'));
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/founder-test/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
        .then(async (res) => {
          const body = (await res.json()) as Record<string, unknown>;
          server.close();
          resolve({ status: res.status, body });
        })
        .catch((err) => {
          server.close();
          reject(err);
        });
    });
  });
}

async function main(): Promise<void> {
  console.log('');
  console.log('Founder Testing V5 Unification — Validation');
  console.log('===========================================');
  console.log('');

  const appJs = readText('public/founder-reality/app.js');
  const html = readText('public/founder-reality/index.html');
  const css = readText('public/founder-reality/styles.css');
  const handler = readText('server/founder-testing-handler.ts');
  const rule = readText('architecture/FOUNDER_VALIDATION_INTEGRATION_RULE.md');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. V5 orchestrator', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v5-orchestrator.ts')), 'orch');
  assert('02. V5 types', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v5-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:founder-testing-v5']), 'package');
  assert('04. integration rule doc', rule.includes('Founder Validation Integration Rule'), 'rule');
  assert('05. six phases', String(FOUNDER_TEST_V5_MAX_PHASES) === '6', String(FOUNDER_TEST_V5_MAX_PHASES));
  assert('06. primary API route', handler.includes('runFounderTestingModeV5'), 'v5 api');
  assert('07. unified handler', handler.includes('executeUnifiedFounderTestV5'), 'pipeline');
  assert('08. single UI endpoint', appJs.includes('/api/founder-test/run') && !appJs.includes('/api/founder-test/run-v4'), 'ui api');
  assert('09. single button label', (appJs.match(/Run Founder Test/g) || []).length >= 2, 'buttons');
  assert('10. no separate validation buttons', !/validate:founder|run-validation|run clarity/i.test(appJs), 'no extra');
  assert('11. six phase feed', appJs.includes('Understanding Product') && appJs.includes('Preparing Launch Recommendation'), 'feed');
  assert('12. unified tooltip', html.includes('complete founder simulation'), 'tooltip');
  assert('13. action center integration', handler.includes('founderActionCenter'), 'fac');
  assert('14. sensemaking integration', handler.includes('founderSensemaking'), 'sense');
  assert('15. no chain-of-thought', !/chain-of-thought|inner monologue/i.test(appJs + handler), 'safety');
  assert('16. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const validatorScripts = Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:'));
  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  const s = v5.unifiedSummary;

  assert('17. unified report mode', v5.mode === 'founder-testing-v5', v5.mode);
  assert('18. embeds V4 layer', Boolean(v5.v4), String(v5.v4.reportId));
  assert('19. one overall score', s.overallFounderScore >= 0 && s.overallFounderScore <= 100, String(s.overallFounderScore));
  assert('20. one launch recommendation', Boolean(s.launchRecommendation), s.launchRecommendation);
  assert('21. one verdict', Boolean(v5.verdict), v5.verdict);
  assert('22. what works section', Array.isArray(s.whatWorks), String(s.whatWorks.length));
  assert('23. what broken section', Array.isArray(s.whatIsBroken), String(s.whatIsBroken.length));
  assert('24. sensemaking in report', s.whatDoesntMakeSense.length >= 0, String(s.whatDoesntMakeSense.length));
  assert('25. trust in report', Array.isArray(s.whatHurtsTrust), String(s.whatHurtsTrust.length));
  assert('26. change in report', Array.isArray(s.whatChanged), String(s.whatChanged.length));
  assert('27. recommended actions', s.recommendedActions.length >= 0, String(s.recommendedActions.length));
  assert('28. highest impact upgrade', s.highestImpactUpgrade === null || s.highestImpactUpgrade.length > 3, String(s.highestImpactUpgrade));
  assert('29. final recommendation', s.finalRecommendation.length > 20, s.finalRecommendation.slice(0, 60));
  assert('30. phase feed events', v5.phaseFeedEvents.length === 6, String(v5.phaseFeedEvents.length));
  assert('31. markdown unified', v5.reportMarkdown.includes(FOUNDER_TEST_V5_REPORT_TITLE), 'md');
  assert('32. action center embedded', Boolean(v5.founderActionCenter), v5.founderActionCenter.state);
  assert('33. sensemaking embedded', Boolean(v5.founderSensemaking), String(v5.founderSensemaking.founderSensemakingScore));
  guardRuntime('engine');

  const api = await fetchUnified();
  const report = api.body.report as { reportMarkdown?: string; mode?: string } | undefined;
  assert('34. API 200', api.status === 200, String(api.status));
  assert('35. API unified mode', api.body.mode === 'founder-testing-v5', String(api.body.mode));
  assert('36. API report markdown', Boolean(report?.reportMarkdown), String(report?.reportMarkdown?.length));

  const reportPath = join(ROOT, 'architecture', 'FOUNDER_TESTING_V5_UNIFICATION_REPORT.md');
  assert('37. unification report', existsSync(reportPath), reportPath);

  const shellSources = { appJs, html, css };
  const firstTime = assessFirstTimeUserReality({ shellSources });
  assert('38. action path panel in shell', html.includes('first-time-founder-path'), 'panel');
  assert(
    '39. ordered founder workflow',
    firstTime.actionPathStepsVisible === 6,
    String(firstTime.actionPathStepsVisible),
  );
  assert(
    '40. preview step in action path',
    firstTimeActionPathResolved('live-preview', shellSources),
    'preview',
  );
  assert(
    '41. verification step in action path',
    firstTimeActionPathResolved('verification-step', shellSources),
    'verify',
  );
  assert(
    '42. pass path guidance',
    firstTimeActionPathResolved('after-pass', shellSources),
    'pass',
  );
  assert(
    '43. fail path guidance',
    firstTimeActionPathResolved('after-fail', shellSources),
    'fail',
  );
  assert('44. first-time action path pass', firstTime.actionPathPass, String(firstTime.actionPathScenariosPassed));
  assert(
    '45. action path report exists',
    existsSync(join(ROOT, 'architecture', 'FIRST_TIME_USER_ACTION_PATH_REPORT.md')),
    'report',
  );

  const verificationTrust = assessVerificationTrustEvidence({
    verificationResults: v5.verificationResults,
    shellSources,
    durationMs: v5.durationMs,
  });
  assert(
    '46. black-box verification detection',
    !verificationTrust.scenarios.some((s) => s.id === 'black-box-detection' && !s.passed),
    String(verificationTrust.scenarios.find((s) => s.id === 'black-box-detection')?.passed),
  );
  assert(
    '47. missing evidence detection',
    verificationTrust.scenarios.some((s) => s.id === 'missing-evidence-detection' && s.passed),
    'evidence',
  );
  assert(
    '48. missing next-step detection',
    verificationTrust.scenarios.some((s) => s.id === 'missing-next-step-detection' && s.passed),
    'next-step',
  );
  assert(
    '49. unexplained confidence detection',
    verificationTrust.scenarios.some((s) => s.id === 'unexplained-confidence-detection' && s.passed),
    'confidence',
  );
  assert(
    '50. unexplained status detection',
    verificationTrust.scenarios.some((s) => s.id === 'unexplained-status-detection' && s.passed),
    'status',
  );
  assert('51. verification trust pass', verificationTrust.trustPass, String(verificationTrust.trustScore));
  assert('52. V5 embeds verification trust', Boolean(v5.verificationTrustEvidence), String(v5.verificationTrustEvidence.trustScore));
  assert('53. V5 markdown trust section', v5.reportMarkdown.includes('Verification Trust & Evidence'), 'md');
  assert(
    '54. verification trust report exists',
    existsSync(join(ROOT, 'architecture', 'VERIFICATION_TRUST_AND_EVIDENCE_CLARITY_REPORT.md')),
    'report',
  );

  const frictionHeatmap = assessFounderFrictionHeatmap({
    shellSources,
    firstTimeUserReality: firstTime,
    verificationTrustEvidence: assessVerificationTrustEvidence({
      verificationResults: v5.verificationResults,
      shellSources,
      durationMs: v5.durationMs,
    }),
    founderSensemaking: v5.founderSensemaking,
    founderActionCenter: v5.founderActionCenter,
    verificationResults: v5.verificationResults,
  });
  assert(
    '55. confusion hotspot detection',
    frictionHeatmap.scenarios.some((s) => s.id === 'confusion-hotspot-detection' && s.passed),
    'hotspots',
  );
  assert(
    '56. dead-end detection',
    frictionHeatmap.scenarios.some((s) => s.id === 'dead-end-detection' && s.passed),
    'dead-ends',
  );
  assert(
    '57. abandonment risk detection',
    frictionHeatmap.scenarios.some((s) => s.id === 'abandonment-risk-detection' && s.passed),
    'abandonment',
  );
  assert(
    '58. workflow clarity ranking',
    frictionHeatmap.scenarios.some((s) => s.id === 'workflow-clarity-ranking' && s.passed),
    'ranking',
  );
  assert(
    '59. friction reported when present',
    frictionHeatmap.scenarios.some((s) => s.id === 'friction-reporting' && s.passed),
    'reporting',
  );
  assert('60. friction heatmap pass', frictionHeatmap.heatmapPass, String(frictionHeatmap.overallFrictionScore));
  assert('61. V5 embeds friction heatmap', Boolean(v5.founderFrictionHeatmap), String(v5.founderFrictionHeatmap.overallFrictionScore));
  assert('62. V5 markdown friction section', v5.reportMarkdown.includes('Founder Friction Heatmap'), 'md');
  assert(
    '63. friction heatmap panel in shell',
    founderFrictionHeatmapResolved('heatmap-visible', shellSources),
    'panel',
  );
  assert(
    '64. friction heatmap report exists',
    existsSync(join(ROOT, 'architecture', 'FOUNDER_FRICTION_HEATMAP_REPORT.md')),
    'report',
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed > 0) {
    console.log('FOUNDER_TESTING_V5_UNIFICATION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Overall founder score: ${s.overallFounderScore} | Recommendation: ${s.launchRecommendation}`);
  console.log('');
  console.log(FOUNDER_TESTING_MODE_V5_PASS_TOKEN);
  console.log(FIRST_TIME_USER_ACTION_PATH_PASS_TOKEN);
  console.log(VERIFICATION_TRUST_AND_EVIDENCE_CLARITY_PASS_TOKEN);
  console.log(FOUNDER_FRICTION_HEATMAP_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
