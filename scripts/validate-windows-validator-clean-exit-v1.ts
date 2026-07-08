/**
 * Windows Validator Clean Exit V1 — validation suite.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  WINDOWS_VALIDATOR_CLEAN_EXIT_V1_PASS_TOKEN,
} from '../src/windows-validator-clean-exit-v1/index.js';
import { finishValidator } from './lib/validator-clean-exit.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function runValidatorSubprocess(scriptName: string): { status: number | null; output: string } {
  const tsxCli = join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const scriptPath = join(ROOT, 'scripts', scriptName);
  const result = spawnSync(process.execPath, [tsxCli, scriptPath], {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      AIDEVENGINE_VALIDATOR_SUBPROCESS: '1',
    },
    windowsHide: true,
    timeout: 120_000,
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  return { status: result.status, output };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Windows Validator Clean Exit V1 — Validation');
  console.log('============================================');
  console.log('');

  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const parityValidator = readFileSync(
    join(ROOT, 'scripts/validate-command-center-fast-create-parity-v1.ts'),
    'utf8',
  );
  const fastCreateValidator = readFileSync(join(ROOT, 'scripts/validate-fast-project-create-v1.ts'), 'utf8');
  const cleanExitLib = readFileSync(join(ROOT, 'scripts/lib/validator-clean-exit.ts'), 'utf8');
  const shutdownTs = readFileSync(
    join(ROOT, 'src/windows-validator-clean-exit-v1/validator-http-server-shutdown.ts'),
    'utf8',
  );
  const exitAuthorityTs = readFileSync(
    join(ROOT, 'src/windows-validator-clean-exit-v1/validator-exit-authority.ts'),
    'utf8',
  );

  assert('01. package script', Boolean(pkg.scripts?.['validate:windows-validator-clean-exit']), 'script');
  assert('02. module index', existsSync(join(ROOT, 'src/windows-validator-clean-exit-v1/index.ts')), 'module');
  assert('03. shared validator lib', existsSync(join(ROOT, 'scripts/lib/validator-clean-exit.ts')), 'lib');
  assert('04. closeAllConnections used', shutdownTs.includes('closeAllConnections'), 'close connections');
  assert('05. idempotent server close', shutdownTs.includes('closedServers'), 'idempotent');
  assert('06. no double close on closing handle', shutdownTs.includes('closedServers.has(server)'), 'guard');
  assert('07. settle before exit', exitAuthorityTs.includes('settleValidatorEventLoop'), 'settle');
  assert('08. undici dispatcher close', exitAuthorityTs.includes('closeUndiciGlobalDispatcher'), 'undici');
  assert('09. parity uses finishValidator', parityValidator.includes('finishValidator'), 'parity exit');
  assert('10. fast-create uses finishValidator', fastCreateValidator.includes('finishValidator'), 'fast-create exit');
  assert('11. parity uses safe server helper', parityValidator.includes('startFounderRealityValidatorServer'), 'parity server');
  assert('12. fast-create uses safe server helper', fastCreateValidator.includes('startFounderRealityValidatorServer'), 'fast-create server');
  assert('13. no raw process.exit parity', !parityValidator.includes('process.exit('), 'parity raw exit');
  assert('14. no raw process.exit fast-create', !fastCreateValidator.includes('process.exit('), 'fast-create raw exit');
  assert('15. lib wraps safeProcessExit', cleanExitLib.includes('exitValidator'), 'safe exit');

  if (process.env.AIDEVENGINE_VALIDATOR_SUBPROCESS === '1') {
    assert('16. subprocess smoke skipped', true, 'already subprocess');
    assert('17. subprocess smoke skipped', true, 'already subprocess');
    assert('18. subprocess smoke skipped', true, 'already subprocess');
    assert('19. subprocess smoke skipped', true, 'already subprocess');
  } else {
    const parityRun = runValidatorSubprocess('validate-command-center-fast-create-parity-v1.ts');
    assert('16. parity subprocess exit 0', parityRun.status === 0, String(parityRun.status));
    assert(
      '17. parity no UV_HANDLE_CLOSING',
      !parityRun.output.includes('UV_HANDLE_CLOSING'),
      parityRun.output.includes('UV_HANDLE_CLOSING') ? 'assertion present' : 'clean',
    );
    assert(
      '18. parity pass token emitted',
      parityRun.output.includes('COMMAND_CENTER_FAST_CREATE_PARITY_V1_PASS'),
      'token',
    );

    const fastCreateRun = runValidatorSubprocess('validate-fast-project-create-v1.ts');
    assert('19. fast-create subprocess exit 0', fastCreateRun.status === 0, String(fastCreateRun.status));
    assert(
      '20. fast-create no UV_HANDLE_CLOSING',
      !fastCreateRun.output.includes('UV_HANDLE_CLOSING'),
      fastCreateRun.output.includes('UV_HANDLE_CLOSING') ? 'assertion present' : 'clean',
    );
    assert(
      '21. fast-create pass token emitted',
      fastCreateRun.output.includes('FAST_PROJECT_CREATE_V1_PASS'),
      'token',
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log('');
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}: ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);

  if (failed.length === 0) {
    console.log('');
    console.log(WINDOWS_VALIDATOR_CLEAN_EXIT_V1_PASS_TOKEN);
    await finishValidator(0);
  } else {
    console.error('');
    console.error(`${failed.length} check(s) failed`);
    await finishValidator(1);
  }
}

main().catch(async (err) => {
  console.error(err);
  await finishValidator(1);
});
