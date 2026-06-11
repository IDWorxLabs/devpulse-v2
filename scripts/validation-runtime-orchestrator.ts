/**
 * Phase 24.9.x — Founder authority validation suite orchestrator.
 * Runs each validator exactly once; prevents transitive execSync cascades.
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FOUNDER_AUTHORITY_VALIDATION_SUITE_PASS = 'FOUNDER_AUTHORITY_VALIDATION_SUITE_PASS';

interface ValidatorNode {
  script: string;
  passToken: string;
}

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

const FOUNDER_AUTHORITY_VALIDATORS: ValidatorNode[] = [
  { script: 'validate:first-time-user-reality', passToken: 'FIRST_TIME_USER_REALITY_PASS' },
  { script: 'validate:founder-sensemaking-engine', passToken: 'FOUNDER_SENSEMAKING_ENGINE_PASS' },
  { script: 'validate:customer-journey-simulation', passToken: 'CUSTOMER_JOURNEY_SIMULATION_PASS' },
  { script: 'validate:promise-reality-engine', passToken: 'PROMISE_REALITY_ENGINE_PASS' },
  { script: 'validate:visual-quality-authority', passToken: 'VISUAL_QUALITY_AUTHORITY_PASS' },
  { script: 'validate:launch-day-simulation-engine', passToken: 'LAUNCH_DAY_SIMULATION_ENGINE_PASS' },
  { script: 'validate:adoption-prediction-engine', passToken: 'ADOPTION_PREDICTION_ENGINE_PASS' },
  { script: 'validate:product-economics-engine', passToken: 'PRODUCT_ECONOMICS_ENGINE_PASS' },
  { script: 'validate:product-evolution-engine', passToken: 'PRODUCT_EVOLUTION_ENGINE_PASS' },
  { script: 'validate:competitive-reality-engine', passToken: 'COMPETITIVE_REALITY_ENGINE_PASS' },
  { script: 'validate:founder-decision-readiness', passToken: 'FOUNDER_DECISION_READINESS_PASS' },
  { script: 'validate:digital-founder-board', passToken: 'DIGITAL_FOUNDER_BOARD_PASS' },
  { script: 'validate:founder-testing-v5', passToken: 'FOUNDER_TESTING_MODE_V5_PASS' },
];

interface ValidatorRunResult {
  script: string;
  passToken: string;
  runtimeMs: number;
  status: 'PASS' | 'FAIL';
  detail: string;
}

const executed = new Set<string>();

export function assertValidatorNotDuplicate(script: string): void {
  if (executed.has(script)) {
    throw new Error(`Duplicate validator execution blocked: ${script} already ran in this suite session`);
  }
  executed.add(script);
}

export function runValidatorNode(node: ValidatorNode): ValidatorRunResult {
  assertValidatorNotDuplicate(node.script);
  const start = Date.now();
  let output = '';
  let status: 'PASS' | 'FAIL' = 'FAIL';
  let detail = '';

  try {
    output = execSync(`npm run ${node.script}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, VALIDATION_ORCHESTRATOR_SUITE: '1' },
    });
    status = output.includes(node.passToken) ? 'PASS' : 'FAIL';
    detail = status === 'PASS' ? node.passToken : `Missing token ${node.passToken}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    detail = message.slice(0, 240);
  }

  return {
    script: node.script,
    passToken: node.passToken,
    runtimeMs: Date.now() - start,
    status,
    detail,
  };
}

function formatRuntimeTable(rows: ValidatorRunResult[]): void {
  console.log('');
  console.log('Validator | Runtime | PASS Token | Status');
  console.log('----------|---------|------------|-------');
  for (const row of rows) {
    const runtime = `${(row.runtimeMs / 1000).toFixed(1)}s`;
    console.log(`${row.script} | ${runtime} | ${row.passToken} | ${row.status}`);
  }
}

function main(): void {
  console.log('');
  console.log('Founder Authority Validation Suite');
  console.log('==================================');
  console.log('');
  console.log('Running each validator once (no nested subprocess chains).');
  console.log('');

  const suiteStart = Date.now();
  const rows: ValidatorRunResult[] = [];

  for (const node of FOUNDER_AUTHORITY_VALIDATORS) {
    console.log(`→ ${node.script}`);
    rows.push(runValidatorNode(node));
  }

  const totalRuntimeMs = Date.now() - suiteStart;
  const failed = rows.filter((r) => r.status === 'FAIL');
  const slowest = rows.reduce((a, b) => (b.runtimeMs > a.runtimeMs ? b : a), rows[0]!);

  formatRuntimeTable(rows);

  console.log('');
  console.log(`Total runtime: ${(totalRuntimeMs / 1000).toFixed(1)}s`);
  console.log(`Slowest validator: ${slowest.script} (${(slowest.runtimeMs / 1000).toFixed(1)}s)`);
  console.log(`Duplicate executions prevented: ${executed.size} unique validators (${FOUNDER_AUTHORITY_VALIDATORS.length} expected)`);
  console.log(
    'Cache notes: sensemaking snapshot cache uses stable shell mtimes + workspace dimensions (not Date.now()). Per-validator textCache remains in-process only.',
  );
  console.log('');

  if (failed.length > 0) {
    console.log('FOUNDER_AUTHORITY_VALIDATION_SUITE_REQUIRES_FIXES');
    for (const row of failed) {
      console.log(`FAIL — ${row.script}: ${row.detail}`);
    }
    process.exit(1);
  }

  if (executed.size !== FOUNDER_AUTHORITY_VALIDATORS.length) {
    console.log('FOUNDER_AUTHORITY_VALIDATION_SUITE_REQUIRES_FIXES');
    console.log(`Expected ${FOUNDER_AUTHORITY_VALIDATORS.length} validators, executed ${executed.size}`);
    process.exit(1);
  }

  console.log(FOUNDER_AUTHORITY_VALIDATION_SUITE_PASS);
}

main();
