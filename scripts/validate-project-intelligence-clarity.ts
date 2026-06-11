/**
 * Phase 24.9.2 — Project Intelligence Clarity validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { processBrainRequest } from '../src/command-center-brain/index.js';
import {
  assessProjectIntelligenceClarity,
  detectConfusionRisks,
  runFounderTestingModeV3,
  runFounderTestingModeV4,
} from '../src/founder-testing-mode/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PROJECT_INTELLIGENCE_CLARITY_PASS';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readText(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

async function main(): Promise<void> {
  console.log('');
  console.log('Project Intelligence Clarity — Validation');
  console.log('========================================');
  console.log('');

  const appJs = readText('public/founder-reality/app.js');
  const html = readText('public/founder-reality/index.html');
  const styles = readText('public/founder-reality/styles.css');
  const clarityModule = readText('src/founder-testing-mode/project-intelligence-clarity.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. clarity module exists', existsSync(join(ROOT, 'src/founder-testing-mode/project-intelligence-clarity.ts')), 'module');
  assert('02. memory renderer updated', appJs.includes('renderIntelligenceHeader') && appJs.includes("project's memory"), 'memory');
  assert('03. insights renderer updated', appJs.includes("project's intelligence") && appJs.includes('Launch Readiness'), 'insights');
  assert('04. relationship flow', appJs.includes('Insights come from Memory') && appJs.includes('AiDevEngine Analysis'), 'relationship');
  assert('05. sidebar memory help', html.includes('Project knowledge, requirements, and history'), 'sidebar memory');
  assert('06. sidebar insights help', html.includes('Project health, risks, recommendations, and progress'), 'sidebar insights');
  assert('07. hero card styles', styles.includes('intelligence-hero-grid'), 'styles');
  assert('08. package script', Boolean(pkg.scripts?.['validate:project-intelligence-clarity']), 'package');
  assert('09. clarity checks exported', clarityModule.includes('assessProjectIntelligenceClarity'), 'export');

  const assessment = assessProjectIntelligenceClarity({ appJs, html });
  for (const check of assessment.checks) {
    assert(`10.${check.id}`, check.passed, check.detail);
  }
  assert('11. confusion severity LOW or NONE', assessment.confusionSeverity === 'NONE' || assessment.confusionSeverity === 'LOW', assessment.confusionSeverity);
  assert('12. clarity assessment passed', assessment.passed, assessment.issues.join('; ') || 'ok');

  const confusion = detectConfusionRisks({ appJs, html, css: styles });
  const memoryInsightsRisk = confusion.risks.find((r) => r.screens.includes('Project Memory vs Project Insights'));
  assert(
    '13. no HIGH memory vs insights confusion',
    !memoryInsightsRisk || memoryInsightsRisk.severity !== 'HIGH',
    memoryInsightsRisk ? `${memoryInsightsRisk.severity}: ${memoryInsightsRisk.risk}` : 'none',
  );

  const memoryBrain = processBrainRequest({ message: 'What is Project Memory?' });
  const insightsBrain = processBrainRequest({ message: 'What is Project Insights?' });
  const diffBrain = processBrainRequest({ message: 'What is the difference between Project Memory and Project Insights?' });
  assert('14. brain explains memory', /knows|requirements|memory/i.test(memoryBrain.brainResponse ?? ''), (memoryBrain.brainResponse ?? '').slice(0, 80));
  assert('15. brain explains insights', /thinks|health|recommendations|intelligence/i.test(insightsBrain.brainResponse ?? ''), (insightsBrain.brainResponse ?? '').slice(0, 80));
  assert('16. brain explains difference', /knows|thinks|Insights come from Memory/i.test(diffBrain.brainResponse ?? ''), (diffBrain.brainResponse ?? '').slice(0, 80));

  const reportPath = join(ROOT, 'architecture', 'PROJECT_INTELLIGENCE_CLARITY_REPORT.md');
  assert('17. clarity report exists', existsSync(reportPath), reportPath);

  const v3 = runFounderTestingModeV3({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });
  const v4 = runFounderTestingModeV4({
    rootDir: ROOT,
    validatorScripts: Object.keys(pkg.scripts ?? {}).filter((k) => k.startsWith('validate:')),
  });

  const highConfusionV3 = v3.confusionFindings.filter((f) => f.severity === 'HIGH' || f.severity === 'CRITICAL');
  assert('18. V3 no HIGH confusion on memory vs insights', !highConfusionV3.some((f) => /memory vs insights/i.test(f.topic)), String(highConfusionV3.length));
  assert('19. V3 human readiness uplift', v3.launchReadiness.humanSuccessRate >= 74, String(v3.launchReadiness.humanSuccessRate));
  assert('20. V4 idea-to-app maintained', v4.ideaToAppScore >= 70, String(v4.ideaToAppScore));

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Clarity confusion severity: ${assessment.confusionSeverity}`);
  console.log(`V3 trust: ${v3.trustScore} | Launch readiness: ${v3.launchReadiness.launchReadinessScore}`);
  console.log(`V4 launch readiness reality: ${v4.launchReadinessReality.launchReadinessRealityScore}`);
  console.log('');

  if (failed.length) {
    console.log('PROJECT_INTELLIGENCE_CLARITY_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(PASS_TOKEN);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
