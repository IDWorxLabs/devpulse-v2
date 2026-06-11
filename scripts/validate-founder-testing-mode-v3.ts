/**
 * AiDevEngine Founder Testing Mode V3 — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_TEST_V3_MAX_GOALS,
  FOUNDER_TEST_V3_MAX_PERSONAS,
  FOUNDER_TEST_V3_MAX_PROMPTS,
  FOUNDER_TEST_V3_MAX_TOTAL_MS,
  FOUNDER_TEST_V3_REPORT_TITLE,
  FOUNDER_TESTING_MODE_V3_PASS_TOKEN,
  HUMAN_MISTAKE_PROMPTS,
  runFounderTestingModeV3,
  simulatePersonas,
} from '../src/founder-testing-mode/index.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

async function fetchV3FromServer(): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('No address'));
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/founder-test/run-v3`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveResults: [], liveSection: 'validator v3' }),
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
  console.log('AiDevEngine Founder Testing Mode V3 — Validation');
  console.log('================================================');
  console.log('');

  const engine = readText('src/founder-testing-mode/human-behavior-simulation-engine.ts');
  const v3Orch = readText('src/founder-testing-mode/founder-testing-v3-orchestrator.ts');
  const pref = readText('src/founder-testing-mode/founder-preference-model.ts');
  const appJs = readText('public/founder-reality/app.js');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. human behavior engine exists', existsSync(join(ROOT, 'src/founder-testing-mode/human-behavior-simulation-engine.ts')), 'engine');
  assert('02. V3 orchestrator exists', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v3-orchestrator.ts')), 'orch');
  assert('03. founder preference model', pref.includes('founder-preference-v1'), 'preference');
  assert('04. V3 report title', FOUNDER_TEST_V3_REPORT_TITLE === 'AIDEVENGINE_FOUNDER_TEST_REPORT_V3', FOUNDER_TEST_V3_REPORT_TITLE);

  assert('05. persona simulation', engine.includes('simulatePersonas') && engine.includes('first-time-user'), 'personas');
  assert('06. trust scoring', engine.includes('buildTrustSimulation') && engine.includes('trustScore'), 'trust');
  assert('07. confusion detection', engine.includes('detectHumanConfusion'), 'confusion');
  assert('08. goal completion testing', engine.includes('simulateGoalCompletion'), 'goals');
  assert('09. mistake testing', engine.includes('simulateMistakePrompts'), 'mistakes');
  assert('10. patience testing', engine.includes('assessHumanPatience') && engine.includes('frustrationRisk'), 'patience');
  assert('11. curiosity paths', engine.includes('simulateCuriosityPaths'), 'curiosity');
  assert('12. launch readiness scoring', engine.includes('computeLaunchReadinessSignals'), 'launch');
  assert('13. V3 verdict system', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v3-scorer.ts')), 'verdict');
  assert('14. read-only V3', v3Orch.includes('readOnly: true') && !v3Orch.includes('writeFile'), 'read-only');
  assert('15. no auto-fix V3', !v3Orch.includes('auto-fix') && !v3Orch.includes('autoFix'), 'no auto-fix');

  assert('16. max personas bound', FOUNDER_TEST_V3_MAX_PERSONAS === 5, String(FOUNDER_TEST_V3_MAX_PERSONAS));
  assert('17. max prompts bound', FOUNDER_TEST_V3_MAX_PROMPTS === 20, String(FOUNDER_TEST_V3_MAX_PROMPTS));
  assert('18. max goals bound', FOUNDER_TEST_V3_MAX_GOALS === 20, String(FOUNDER_TEST_V3_MAX_GOALS));
  assert('19. max runtime 90s', FOUNDER_TEST_V3_MAX_TOTAL_MS === 90000, String(FOUNDER_TEST_V3_MAX_TOTAL_MS));
  assert('20. mistake prompts bounded', HUMAN_MISTAKE_PROMPTS.length <= 20, String(HUMAN_MISTAKE_PROMPTS.length));

  assert('21. package script v3', Boolean(pkg.scripts?.['validate:founder-testing-mode-v3']), 'package');
  assert(
    '22. UI uses founder-test API',
    appJs.includes('/api/founder-test/run-v4') || appJs.includes('/api/founder-test/run-v3'),
    'ui',
  );

  const report = runFounderTestingModeV3({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });

  assert('23. V3 mode flag', report.mode === 'founder-testing-v3', report.mode);
  assert('24. personas count', report.personaSimulations.length === FOUNDER_TEST_V3_MAX_PERSONAS, String(report.personaSimulations.length));
  assert('25. trust score', report.trustScore >= 0 && report.trustScore <= 100, String(report.trustScore));
  assert('26. goal results', report.goalResults.length >= 5, String(report.goalResults.length));
  assert('27. mistake results', report.mistakeResults.length >= 5, String(report.mistakeResults.length));
  assert('28. launch readiness', report.launchReadiness.launchReadinessScore >= 0, String(report.launchReadiness.launchReadinessScore));
  assert('29. V3 markdown', report.reportMarkdown.includes(FOUNDER_TEST_V3_REPORT_TITLE), 'markdown');
  assert('30. embeds V2', report.v2.mode === 'founder-testing-v2', 'v2 embed');

  const v3Verdicts = [
    'NOT_READY_FOR_USERS',
    'READY_FOR_INTERNAL_TESTING',
    'READY_FOR_LIMITED_BETA',
    'READY_FOR_PUBLIC_BETA',
    'READY_FOR_LAUNCH',
  ];
  assert('31. verdict in V3 set', v3Verdicts.includes(report.verdict), report.verdict);

  const identityPrompt = report.v2.promptVisionResults.find((p) => /what is aidevengine/i.test(p.prompt));
  const memoryInsightsConfusion = report.confusionFindings.filter(
    (f) => /memory vs insights/i.test(f.topic) && (f.severity === 'HIGH' || f.severity === 'CRITICAL'),
  );
  assert(
    '32. identity-aligned trust uplift',
    report.trustScore >= 50 && (identityPrompt?.passed ?? false),
    `trust=${report.trustScore} identityPassed=${identityPrompt?.passed ?? false}`,
  );
  assert(
    '32b. memory vs insights clarity',
    memoryInsightsConfusion.length === 0,
    memoryInsightsConfusion.map((f) => f.detail).join('; ') || 'clear',
  );

  const personas = simulatePersonas(report.v2);
  assert('33. persona simulation callable', personas.length === 5, String(personas.length));

  const api = await fetchV3FromServer();
  assert('34. API v3 route 200', api.status === 200, String(api.status));
  assert(
    '35. API v3 report',
    Boolean((api.body.report as { reportMarkdown?: string } | undefined)?.reportMarkdown),
    'api',
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Sample V3 verdict: ${report.verdict}`);
  console.log(`Launch readiness: ${report.launchReadiness.launchReadinessScore}`);
  console.log(`Trust score: ${report.trustScore}`);
  console.log('');

  if (failed.length) {
    console.log('FOUNDER_TESTING_MODE_V3_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(FOUNDER_TESTING_MODE_V3_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
