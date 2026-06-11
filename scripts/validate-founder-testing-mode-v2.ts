/**
 * AiDevEngine Founder Testing Mode V2 — validation scenarios.
 * VALIDATION_MODE: FAST_FEATURE_CHECK
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  assessArchitectureLeakage,
  evaluatePromptVision,
  FOUNDER_TEST_V2_REPORT_TITLE,
  FOUNDER_TESTING_MODE_V2_PASS_TOKEN,
  PRODUCT_VISION_BASELINE,
  runFounderTestingModeV2,
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

async function fetchV2FromServer(): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const server = createFounderRealityServer();
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('No address'));
        return;
      }
      fetch(`http://127.0.0.1:${addr.port}/api/founder-test/run-v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveResults: [], liveSection: 'validator v2' }),
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
  console.log('AiDevEngine Founder Testing Mode V2 — Validation');
  console.log('================================================');
  console.log('');

  const proxy = readText('src/founder-testing-mode/founder-proxy-evaluator.ts');
  const leakage = readText('src/founder-testing-mode/founder-proxy-architecture-leakage.ts');
  const v2Orch = readText('src/founder-testing-mode/founder-testing-v2-orchestrator.ts');
  const v2Report = readText('src/founder-testing-mode/founder-testing-v2-report-builder.ts');
  const appJs = readText('public/founder-reality/app.js');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. vision baseline exists', PRODUCT_VISION_BASELINE.includes('autonomous software development'), 'baseline');
  assert('02. V2 report title', FOUNDER_TEST_V2_REPORT_TITLE === 'AIDEVENGINE_FOUNDER_TEST_REPORT_V2', FOUNDER_TEST_V2_REPORT_TITLE);
  assert('03. founder proxy module', existsSync(join(ROOT, 'src/founder-testing-mode/founder-proxy-evaluator.ts')), 'proxy');
  assert('04. architecture leakage module', existsSync(join(ROOT, 'src/founder-testing-mode/founder-proxy-architecture-leakage.ts')), 'leakage');
  assert('05. V2 orchestrator', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-v2-orchestrator.ts')), 'orchestrator');

  assert('06. vision alignment checks', proxy.includes('scoreVisionAlignment') && proxy.includes('evaluateScreenPurpose'), 'vision');
  assert('07. architecture leakage detection', leakage.includes('assessArchitectureLeakage') && leakage.includes('CRITICAL'), 'leak detect');
  assert('08. founder approval prediction', proxy.includes('predictFounderApproval'), 'approval');
  assert('09. customer readiness', proxy.includes('integratePerceptionSignals') && proxy.includes('customerReadiness'), 'customer');
  assert('10. confusion risk detection', proxy.includes('detectConfusionRisks') && proxy.includes('understandabilityScore'), 'confusion');
  assert('11. prompt vision testing', existsSync(join(ROOT, 'src/founder-testing-mode/founder-testing-prompt-vision-checker.ts')), 'prompt vision');
  assert('12. product usefulness scoring', proxy.includes('scoreUsefulness'), 'usefulness');
  assert('13. screen purpose testing', proxy.includes('SCREEN_PURPOSE_EXPECTATIONS'), 'screen purpose');
  assert('14. V2 report format', v2Report.includes(FOUNDER_TEST_V2_REPORT_TITLE) && v2Report.includes('Founder Approval Prediction'), 'report');
  assert('15. V2 verdict system', v2Orch.includes('deriveV2Verdict'), 'verdict');
  assert('16. read-only V2', v2Orch.includes('readOnly: true') && !v2Orch.includes('writeFile'), 'read-only');
  assert('17. no auto-fix V2', !v2Orch.includes('auto-fix') && !v2Orch.includes('autoFix'), 'no auto-fix');
  assert('18. package script v2', Boolean(pkg.scripts?.['validate:founder-testing-mode-v2']), 'package');
  assert(
    '19. UI uses founder-test API',
    appJs.includes('/api/founder-test/run-v4') ||
      appJs.includes('/api/founder-test/run-v3') ||
      appJs.includes('/api/founder-test/run-v2'),
    'ui',
  );

  const archSample = assessArchitectureLeakage(
    'DevPulse V2 is in Phase 11.6 with Unified Decision Layer and Foundation Building.',
  );
  assert('20. critical leakage sample', archSample.level === 'CRITICAL', archSample.level);

  const brain = processBrainRequest({ message: 'What is AiDevEngine?' });
  const promptEval = evaluatePromptVision('What is AiDevEngine?', brain.brainResponse ?? '');
  assert('21. identity prompt vision eval', typeof promptEval.visionAlignment === 'number', String(promptEval.visionAlignment));
  assert(
    '22. identity prompt product-aligned',
    promptEval.passed &&
      promptEval.visionAlignment >= 85 &&
      promptEval.architectureLeakage !== 'CRITICAL' &&
      promptEval.architectureLeakage !== 'HIGH',
    `leakage=${promptEval.architectureLeakage} vision=${promptEval.visionAlignment} passed=${promptEval.passed}`,
  );

  const report = runFounderTestingModeV2({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });

  assert('23. V2 mode flag', report.mode === 'founder-testing-v2', report.mode);
  assert('24. readiness reality dimensions', report.readinessReality.technicalReadiness >= 0, 'dimensions');
  assert('25. founder approval', report.founderApproval.likelihood >= 0, String(report.founderApproval.likelihood));
  assert('26. confusion risks array', Array.isArray(report.confusionRisks), 'confusion');
  assert('27. screen purpose results', report.screenPurposeResults.length >= 9, String(report.screenPurposeResults.length));
  assert('28. prompt vision results', report.promptVisionResults.length >= 10, String(report.promptVisionResults.length));
  assert('29. architecture summary', Boolean(report.architectureLeakageSummary), report.architectureLeakageSummary);
  assert('30. V2 verdict present', Boolean(report.verdict), report.verdict);
  assert('31. V2 markdown title', report.reportMarkdown.includes(FOUNDER_TEST_V2_REPORT_TITLE), 'markdown');
  assert('32. embeds V1 reference', report.v1 != null && report.v1.mode === 'founder-testing-v1', 'v1 embed');

  const v2Verdicts = [
    'TECHNICALLY_READY_PRODUCT_NOT_READY',
    'PRODUCT_USABLE_NEEDS_POLISH',
    'VISION_MISALIGNED',
    'FOUNDER_APPROVAL_RECOMMENDED',
    'LAUNCH_CANDIDATE',
  ];
  assert('33. verdict in V2 set', v2Verdicts.includes(report.verdict), report.verdict);

  const api = await fetchV2FromServer();
  assert('34. API v2 route 200', api.status === 200, String(api.status));
  assert(
    '35. API v2 report',
    Boolean((api.body.report as { reportMarkdown?: string } | undefined)?.reportMarkdown),
    'api report',
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Sample V2 verdict: ${report.verdict}`);
  console.log(`Vision alignment: ${report.readinessReality.visionAlignment}`);
  console.log(`Architecture leakage: ${report.architectureLeakageSummary}`);
  console.log('');

  if (failed.length) {
    console.log('FOUNDER_TESTING_MODE_V2_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(FOUNDER_TESTING_MODE_V2_PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
