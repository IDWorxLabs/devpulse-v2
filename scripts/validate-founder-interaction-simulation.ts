/**
 * Phase 24.9.10 — Founder Interaction Simulation Engine validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FOUNDER_INTERACTION_SIMULATION_PASS_TOKEN,
  assessFounderInteractionSimulation,
  enrichAssessmentsWithInteractionSimulation,
  resetFounderInteractionCounterForTests,
} from '../src/founder-interaction-simulation/index.js';
import { assessFounderActionCenter } from '../src/founder-action-center/index.js';
import { assessFounderSensemaking } from '../src/founder-sensemaking-engine/index.js';
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
  console.log('Founder Interaction Simulation Engine — Validation');
  console.log('================================================');
  console.log('');

  resetFounderInteractionCounterForTests();

  const appJs = readText('public/founder-reality/app.js');
  const css = readText('public/founder-reality/styles.css');
  const html = readText('public/founder-reality/index.html');
  const authority = readText('src/founder-interaction-simulation/founder-interaction-simulation-authority.ts');
  const engine = readText('src/founder-testing-mode/execution-reality-engine.ts');
  const v5Report = readText('src/founder-testing-mode/founder-testing-v5-report-builder.ts');
  const pkg = JSON.parse(readText('package.json')) as { scripts?: Record<string, string> };

  assert('01. authority module', existsSync(join(ROOT, 'src/founder-interaction-simulation/founder-interaction-simulation-authority.ts')), 'authority');
  assert('02. types module', existsSync(join(ROOT, 'src/founder-interaction-simulation/founder-interaction-simulation-types.ts')), 'types');
  assert('03. package script', Boolean(pkg.scripts?.['validate:founder-interaction-simulation']), 'package');
  assert('04. finding types', authority.includes('INTERACTION_FAILURE') && authority.includes('BLOCKED_WORKFLOW') && authority.includes('DEAD_CONTROL'), 'types');
  assert('05. overlay conflict type', authority.includes('OVERLAY_CONFLICT') && authority.includes('TRAPPED_FOCUS'), 'overlay');
  assert('06. modal close wired', appJs.includes('founder-test-close') && appJs.includes('hideFounderTestPanel'), 'close');
  assert('07. hidden css override', css.includes('.founder-test-panel[hidden]') && css.includes('display: none'), 'css');
  assert('08. v5 shows panel', appJs.includes("showFounderTestPanel('done')"), 'v5 panel');
  assert('09. focus restore', /hideFounderTestPanel[\s\S]{0,400}chat-input/.test(appJs), 'focus');
  assert('10. live interaction checks', appJs.includes('runFounderTestInteractionChecks'), 'live');
  assert('11. modal regression scenario', authority.includes('modal-close-regression'), 'regression');
  assert('12. operator feed events', authority.includes('Simulating founder interactions'), 'feed');
  assert('13. V5 report section', v5Report.includes('Founder Interaction Simulation'), 'v5 md');
  assert('14. founder evaluation', engine.includes('evaluateFounderInteractionSimulationVisibility'), 'visibility');
  assert('15. no chain-of-thought leakage', !/chain-of-thought|inner monologue/i.test(appJs), 'safety');
  assert('16. no architecture leakage', !/devpulse_v2|ownership registry/i.test(appJs), 'arch');
  guardRuntime('static');

  const shellSources = { appJs, html, css };
  const simulation = assessFounderInteractionSimulation({ shellSources });

  assert('17. interaction score bounded', simulation.interactionScore >= 0 && simulation.interactionScore <= 100, String(simulation.interactionScore));
  assert('18. scenarios bounded', simulation.testedInteractions <= 12, String(simulation.testedInteractions));
  assert('19. modal close regression pass', simulation.modalCloseRegressionPass, String(simulation.modalCloseRegressionPass));
  assert('20. copy report available', simulation.copyReportAvailablePass, String(simulation.copyReportAvailablePass));
  assert('21. finding structure', simulation.findings.every((f) => f.whatFailed && f.recommendedFix && f.regressionScenario), 'structure');
  assert('22. dead control detection wired', authority.includes('DEAD_CONTROL'), 'dead');
  assert('23. blocked workflow detection wired', authority.includes('BLOCKED_WORKFLOW'), 'blocked');
  assert('24. hidden content detection wired', authority.includes('HIDDEN_CONTENT'), 'hidden');
  assert('25. operator feed generated', (simulation.operatorFeedEvents?.length ?? 0) >= 5, String(simulation.operatorFeedEvents?.length));
  guardRuntime('simulation');

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

  const brokenSimulation = assessFounderInteractionSimulation({
    shellSources: {
      appJs: appJs.replace('hideFounderTestPanel', 'brokenHidePanel'),
      html,
      css: css.replace('.founder-test-panel[hidden]', '.broken-hidden'),
    },
  });
  assert('26. detects broken close wiring', brokenSimulation.findings.some((f) => f.type === 'INTERACTION_FAILURE'), String(brokenSimulation.findings.length));

  const enriched = enrichAssessmentsWithInteractionSimulation(actionBase, senseBase, brokenSimulation);
  assert(
    '27. action center receives fix actions',
    enriched.founderActionCenter.topActions.some((a) => /fix/i.test(a.title)),
    enriched.founderActionCenter.topActions[0]?.title ?? 'none',
  );
  assert(
    '28. product coherence receives trust risks',
    enriched.founderSensemaking.findings.some((f) => f.type === 'TRUST_RISK' || f.type === 'COHERENCE_GAP'),
    String(enriched.founderSensemaking.findings.length),
  );

  const v5 = runFounderTestingModeV5({ rootDir: ROOT, validatorScripts });
  assert('29. V5 includes interaction simulation', Boolean(v5.founderInteractionSimulation), String(v5.founderInteractionSimulation.interactionScore));
  assert('30. V5 markdown section', v5.reportMarkdown.includes('Founder Interaction Simulation'), 'md');
  assert('31. command center readable flag', v5.founderInteractionSimulation.commandCenterReadableAfterClosePass, String(v5.founderInteractionSimulation.commandCenterReadableAfterClosePass));
  assert('32. send input usable flag', v5.founderInteractionSimulation.sendInputUsableAfterClosePass, String(v5.founderInteractionSimulation.sendInputUsableAfterClosePass));
  guardRuntime('integration');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed > 0) {
    console.log('FOUNDER_INTERACTION_SIMULATION_REQUIRES_FIXES');
    process.exit(1);
  }

  console.log(`Interaction score: ${simulation.interactionScore} | Scenarios: ${simulation.testedInteractions}`);
  console.log('');
  console.log(FOUNDER_INTERACTION_SIMULATION_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
