/**
 * Phase 24A.5 — Execution Proof Dashboard validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildExecutionProofPayload,
  EXECUTION_PROOF_DASHBOARD_PASS_TOKEN,
} from '../server/execution-proof-handler.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 2_000;

const STATIC_SCAN_FILES = [
  'server/execution-proof-handler.ts',
  'server/founder-reality-server.ts',
  'public/founder-reality/app.js',
  'public/founder-reality/styles.css',
  'package.json',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readBoundedText(relativePath: string, maxBytes = 512_000): string {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) return '';
  const buf = readFileSync(fullPath);
  return buf.subarray(0, Math.min(buf.length, maxBytes)).toString('utf8');
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function main(): void {
  console.log('');
  console.log('Execution Proof Dashboard — Validation (leaf mode)');
  console.log('==================================================');
  console.log('');

  checkpoint('start');

  const fileTexts = new Map<string, string>();
  for (const rel of STATIC_SCAN_FILES) {
    fileTexts.set(rel, readBoundedText(rel));
    checkpoint(`read ${rel}`);
  }

  const handler = fileTexts.get('server/execution-proof-handler.ts') ?? '';
  const server = fileTexts.get('server/founder-reality-server.ts') ?? '';
  const appJs = fileTexts.get('public/founder-reality/app.js') ?? '';
  const styles = fileTexts.get('public/founder-reality/styles.css') ?? '';
  const pkg = JSON.parse(fileTexts.get('package.json') ?? '{}') as { scripts?: Record<string, string> };

  assert('01. handler module', existsSync(join(ROOT, 'server/execution-proof-handler.ts')), 'handler');
  assert('02. package script', Boolean(pkg.scripts?.['validate:execution-proof-dashboard']), 'package');
  assert('03. api route registered', server.includes('/api/founder/execution-proof'), 'route');
  assert('04. dashboard UI title', appJs.includes('Execution Proof') && appJs.includes('execution-proof-dashboard'), 'title');
  assert('05. workflow truth map', appJs.includes('Workflow Truth Map') && appJs.includes('workflowTruthMap'), 'truth map');
  assert('06. current bottleneck displayed', appJs.includes('Current Bottleneck') && appJs.includes('currentBottleneck'), 'bottleneck');
  assert('07. next required capability', appJs.includes('Next Required Capability') && appJs.includes('nextRequiredCapability'), 'capability');
  assert('08. launch readiness displayed', appJs.includes('Launch Readiness') && appJs.includes('launchReadiness'), 'launch');
  assert('09. reality score labels', appJs.includes('Autonomous Builder Reality') && appJs.includes('Founder Workflow Reality'), 'scores');
  assert('10. copy report button', appJs.includes('Copy Execution Proof Report') && appJs.includes('copy-execution-proof-report'), 'copy');
  assert('11. evidence summary sections', appJs.includes('Evidence Found') && appJs.includes('Missing Evidence') && appJs.includes('Founder Blockers'), 'evidence');
  assert('12. status label styles', styles.includes('execution-proof-proven') && styles.includes('execution-proof-blocked'), 'styles');
  assert('13. no workspace snapshot in handler', !handler.includes('buildProductWorkspaceSnapshot'), 'snapshot');
  assert('14. no brain in handler', !handler.includes('assessFounderSensemaking') && !handler.includes('/api/brain/respond'), 'brain');
  assert('15. no validator execution in handler', !handler.includes('execSync') && !handler.includes('spawnSync') && !handler.includes("npm run validate"), 'validators');
  assert('16. no validator execution in UI fetch', !appJs.includes("execSync('npm run validate") && appJs.includes('/api/founder/execution-proof'), 'ui fetch');
  assert('17. uses 24A authorities', handler.includes('assessFounderWorkflowReality'), 'authorities');
  assert('18. no fake hardcoded proof scores', !appJs.includes('builderReality: 39') && !handler.includes('builderReality: 39'), 'hardcode');
  assert('19. leaf fetch only', appJs.includes('/api/founder/execution-proof'), 'fetch');
  checkpoint('static checks complete');

  const payload = buildExecutionProofPayload(ROOT);
  checkpoint('payload built');

  assert('20. payload scores bounded', payload.scores.founderWorkflowReality >= 0 && payload.scores.founderWorkflowReality <= 100, String(payload.scores.founderWorkflowReality));
  assert('21. truth map nine stages', payload.workflowTruthMap.length === 9, String(payload.workflowTruthMap.length));
  assert('22. bottleneck BUILD', payload.currentBottleneck === 'BUILD', payload.currentBottleneck);
  assert('23. launch unavailable', payload.launchReadiness.status === 'LAUNCH_READINESS_UNAVAILABLE', payload.launchReadiness.status);
  assert('24. copy report text', payload.copyReportText.includes('Execution Proof Report') && payload.copyReportText.includes('Current Bottleneck'), 'copy');
  assert('25. upstream scores present', payload.scores.builderReality > 0 && payload.scores.verificationReality > 0, 'scores');

  const elapsed = Date.now() - START;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length} | Runtime: ${elapsed}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');
  console.log(`Current bottleneck: ${payload.currentBottleneck}`);
  console.log(`Founder Workflow Reality: ${payload.scores.founderWorkflowReality}/100`);
  console.log('');

  if (failed.length || elapsed > MAX_RUNTIME_MS) {
    console.log('EXECUTION_PROOF_DASHBOARD_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(EXECUTION_PROOF_DASHBOARD_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  console.log('EXECUTION_PROOF_DASHBOARD_REQUIRES_FIXES');
  process.exit(1);
}
