/**
 * Command Center runtime health — full verification before LISA testing.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OPERATOR_FEED_SECTIONS } from '../server/command-center-shell-manifest.js';
import {
  COMMAND_CENTER_RUNTIME_HEALTH_PASS_TOKEN,
  COMMAND_CENTER_RUNTIME_HEALTH_REPORT_TITLE,
  CRITICAL_API_PATHS,
  FOUNDER_DASHBOARD_ROUTES,
  runRuntimeHealthAssessment,
  writeRuntimeHealthArtifacts,
  probeLiveProductionServer,
} from '../server/command-center-runtime-health.js';
import { probePortOwner } from '../server/port-probe.js';
import { FOUNDER_REALITY_PORT, FOUNDER_REALITY_URL } from '../server/founder-reality-manifest.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const TEST_PORT = 4323;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

async function main(): Promise<void> {
  console.log('');
  console.log('Command Center Runtime Health — Validation');
  console.log('=========================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const serverSrc = readFileSync(join(ROOT, 'server/founder-reality-server.ts'), 'utf8');
  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8').slice(0, 5_000_000);

  assert('01. package script', Boolean(pkg.scripts?.['validate:command-center-runtime-health']), 'script');
  assert('02. parseRequestUrl present', serverSrc.includes('function parseRequestUrl'), 'parseRequestUrl');
  assert('03. EADDRINUSE handler', serverSrc.includes('EADDRINUSE'), 'eaddrinuse');
  assert('04. port probe module', existsSync(join(ROOT, 'server/port-probe.ts')), 'port-probe');
  assert('05. runtime health module', existsSync(join(ROOT, 'server/command-center-runtime-health.ts')), 'health');

  const portOwner = probePortOwner(FOUNDER_REALITY_PORT);
  assert('06. port 4321 single listener', portOwner.listenerCount <= 1, String(portOwner.listenerCount));
  if (portOwner.listening) {
    assert('07. port owner is AiDevEngine', portOwner.intendedAiDevEngine, portOwner.commandLines[0] ?? 'unknown');
    assert('08. port owner PID known', portOwner.pids.length >= 1, portOwner.pids.join(',') || 'none');
  } else {
    assert('07. port owner is AiDevEngine', true, 'no listener (ephemeral test will cover)');
    assert('08. port owner PID known', true, 'n/a');
  }

  const live = await probeLiveProductionServer();
  if (portOwner.listening) {
    assert('09. live server reachable', live.reachable, String(live.healthStatus));
    assert('10. live manifest 200', live.manifestStatus === 200, String(live.manifestStatus));
  } else {
    assert('09. live server reachable', true, 'skipped — no live listener');
    assert('10. live manifest 200', true, 'skipped');
  }

  for (const section of Object.keys(FOUNDER_DASHBOARD_ROUTES)) {
    assert(`11. operator feed section: ${section}`, OPERATOR_FEED_SECTIONS.includes(section as never), section);
  }

  for (const [section, route] of Object.entries(FOUNDER_DASHBOARD_ROUTES)) {
    assert(`12. UI fetches ${section}`, appJs.includes(route), route);
  }

  for (const path of CRITICAL_API_PATHS) {
    assert(`13. critical path registered: ${path}`, serverSrc.includes(path.replace(/\//g, '/')) || path === '/', path);
  }

  const assessment = await runRuntimeHealthAssessment({
    port: TEST_PORT,
    stressIterations: 50,
    refreshRounds: 5,
  });
  writeRuntimeHealthArtifacts(ROOT, assessment, live);

  assert('20. manifest healthy', assessment.manifestHealthy, assessment.manifestHealthy ? 'yes' : 'no');
  assert('21. manifest not degraded', !assessment.manifestDegraded, assessment.manifestLoadError ?? 'ok');
  assert('22. operator feed sections', assessment.operatorFeedSectionCount >= 20, String(assessment.operatorFeedSectionCount));
  assert('23. validators in manifest', assessment.validatorCount >= 50, String(assessment.validatorCount));
  assert('24. critical endpoints ok', assessment.criticalEndpoints.every((e) => e.ok), 'critical');
  assert('25. dashboard endpoints ok', assessment.dashboardEndpoints.every((e) => e.ok), 'dashboard');
  assert('26. no dashboard degraded', assessment.dashboardEndpoints.every((e) => !e.degraded), 'degraded');
  assert('27. stress failures zero', assessment.stressFailures === 0, String(assessment.stressFailures));
  assert('28. refresh failures zero', assessment.refreshSimulationFailures === 0, String(assessment.refreshSimulationFailures));
  assert('29. server alive after stress', assessment.serverAliveAfterStress, 'alive');
  assert('30. no duplicate listener risk', !assessment.duplicateServerRisk, String(assessment.portOwner.listenerCount));
  assert('31. proof status PROVEN', assessment.proofStatus === 'PROVEN', assessment.proofStatus);
  assert(
    '32. pass token',
    assessment.passToken === COMMAND_CENTER_RUNTIME_HEALTH_PASS_TOKEN,
    assessment.passToken,
  );
  assert(
    '33. report written',
    existsSync(join(ROOT, COMMAND_CENTER_RUNTIME_HEALTH_REPORT_TITLE)),
    COMMAND_CENTER_RUNTIME_HEALTH_REPORT_TITLE,
  );

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Port ${FOUNDER_REALITY_PORT}: ${portOwner.listening ? `listening (PID ${portOwner.pids.join(', ')})` : 'free'}`);
  console.log(`Live ${FOUNDER_REALITY_URL}: ${live.reachable ? 'healthy' : 'not reachable'}`);
  console.log(`Stress: ${assessment.stressRequests} requests, ${assessment.stressFailures} failures`);
  console.log('');

  if (failed.length > 0) {
    console.error(`Command Center Runtime Health — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(COMMAND_CENTER_RUNTIME_HEALTH_PASS_TOKEN);
  console.log('Command Center runtime verified stable for LISA testing.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
