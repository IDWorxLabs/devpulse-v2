/**
 * AiDevEngine Founder Testing Mode V4 — validation scenarios.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CREATION_JOURNEY_STAGES,
  FOUNDER_TEST_V4_MAX_TOTAL_MS,
  FOUNDER_TEST_V4_REPORT_TITLE,
  FOUNDER_TESTING_MODE_V4_PASS_TOKEN,
  IDEA_TO_APP_PROMPTS,
  runFounderTestingModeV4,
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

async function fetchV4(): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('No address'));
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/founder-test/run-v4`, {
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
  console.log('AiDevEngine Founder Testing Mode V4 — Validation');
  console.log('================================================');
  console.log('');

  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const orch = readText('src/founder-testing-mode/founder-testing-v4-orchestrator.ts');
  const report = readText('src/founder-testing-mode/founder-testing-v4-report-builder.ts');
  const appJs = readText('public/founder-reality/app.js');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. execution reality engine', existsSync(join(ROOT, 'src/founder-testing-mode/execution-reality-engine.ts')), 'engine');
  assert('02. V4 orchestrator', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v4-orchestrator.ts')), 'orch');
  assert('03. V4 report title', FOUNDER_TEST_V4_REPORT_TITLE === 'AIDEVENGINE_FOUNDER_TEST_REPORT_V4', FOUNDER_TEST_V4_REPORT_TITLE);
  assert('04. creation journey', engine.includes('evaluateCreationJourney') && CREATION_JOURNEY_STAGES.length === 10, 'journey');
  assert('05. idea-to-app testing', engine.includes('evaluateIdeaToAppPrompts') && IDEA_TO_APP_PROMPTS.length === 5, 'idea');
  assert('06. promise matrix', engine.includes('buildPromiseRealityMatrix'), 'promise');
  assert('07. autonomous builder reality', engine.includes('evaluateAutonomousBuilderReality'), 'builder');
  assert('08. project memory reality', engine.includes('evaluateProjectMemoryReality'), 'memory');
  assert('09. preview reality', engine.includes('evaluatePreviewReality'), 'preview');
  assert('10. verification reality', engine.includes('evaluateVerificationReality'), 'verification');
  assert('11. founder outcome', engine.includes('simulateFounderOutcome'), 'founder');
  assert('12. customer outcome', engine.includes('simulateCustomerOutcome'), 'customer');
  assert('13. reality gaps', engine.includes('detectRealityGaps'), 'gaps');
  assert('14. launch readiness reality', orch.includes('computeLaunchReadinessReality'), 'launch');
  assert('15. V4 verdict', orch.includes('deriveV4Verdict'), 'verdict');
  assert('16. read-only', orch.includes('readOnly: true') && !orch.includes('writeFile'), 'read-only');
  assert('17. no auto-fix', !orch.includes('auto-fix'), 'no autofix');
  assert('18. runtime 90s', FOUNDER_TEST_V4_MAX_TOTAL_MS === 90000, String(FOUNDER_TEST_V4_MAX_TOTAL_MS));
  assert('19. package script', Boolean(pkg.scripts?.['validate:founder-testing-mode-v4']), 'pkg');
  assert(
    '20. UI run founder test',
    appJs.includes('/api/founder-test/run') || appJs.includes('/api/founder-test/run-v4'),
    'ui',
  );
  assert('21. report sections', report.includes('Promise Reality Matrix') && report.includes('Execution Readiness'), 'report');

  const v4 = runFounderTestingModeV4({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });

  assert('22. V4 mode', v4.mode === 'founder-testing-v4', v4.mode);
  assert('23. embeds V3', v4.v3.mode === 'founder-testing-v3', 'v3');
  assert('24. creation journey results', v4.creationJourney.length === 10, String(v4.creationJourney.length));
  assert('25. idea results', v4.ideaToAppResults.length >= 5, String(v4.ideaToAppResults.length));
  assert('26. promise matrix', v4.promiseMatrix.length >= 7, String(v4.promiseMatrix.length));
  assert('27. reality gaps', v4.realityGaps.length > 0, String(v4.realityGaps.length));
  assert('28. launch readiness reality', v4.launchReadinessReality.launchReadinessRealityScore >= 0, String(v4.launchReadinessReality.launchReadinessRealityScore));
  assert('29. markdown', v4.reportMarkdown.includes(FOUNDER_TEST_V4_REPORT_TITLE), 'md');

  const verdicts = [
    'FOUNDATION_ONLY',
    'PRODUCT_DIRECTION_VALID',
    'EXECUTION_GAPS_PRESENT',
    'READY_FOR_INTERNAL_PRODUCT_USE',
    'READY_FOR_LIMITED_CUSTOMERS',
    'READY_FOR_PUBLIC_BETA',
    'READY_FOR_LAUNCH',
  ];
  assert('30. verdict set', verdicts.includes(v4.verdict), v4.verdict);

  const crmIdea = v4.ideaToAppResults.find((r) => /build a crm/i.test(r.prompt));
  const memoryInsightsConfusion = v4.v3.confusionFindings.filter(
    (f) => /memory vs insights/i.test(f.topic) && (f.severity === 'HIGH' || f.severity === 'CRITICAL'),
  );
  assert(
    '31. idea-to-app identity routing',
    (crmIdea?.ideaToAppScore ?? 0) >= 70 && (crmIdea?.issues.length ?? 1) <= 1,
    `crmScore=${crmIdea?.ideaToAppScore ?? 0} issues=${crmIdea?.issues.join('; ') ?? 'missing'}`,
  );
  assert(
    '31b. project intelligence clarity',
    memoryInsightsConfusion.length === 0 && v4.v3.launchReadiness.humanSuccessRate >= 74,
    `confusion=${memoryInsightsConfusion.length} human=${v4.v3.launchReadiness.humanSuccessRate}`,
  );

  const api = await fetchV4();
  assert('32. API 200', api.status === 200, String(api.status));
  assert('33. API report', Boolean((api.body.report as { reportMarkdown?: string })?.reportMarkdown), 'api');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  for (const r of results) console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  console.log('');
  console.log(`Sample verdict: ${v4.verdict}`);
  console.log(`Execution readiness: ${v4.launchReadinessReality.executionReadiness}`);
  console.log(`Idea-to-app: ${v4.ideaToAppScore}`);
  console.log('');

  if (failed.length) {
    console.log('FOUNDER_TESTING_MODE_V4_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(FOUNDER_TESTING_MODE_V4_PASS_TOKEN);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
