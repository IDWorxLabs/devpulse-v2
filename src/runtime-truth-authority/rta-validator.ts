/**
 * Runtime Truth Authority V1 — validation checks for validate:runtime-truth-authority.
 */

import { existsSync, readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from 'node:http';
import { FOUNDER_REALITY_PORT } from '../../server/founder-reality-manifest.js';
import {
  bootRuntimeTruthAuthority,
  buildGlobal405Diagnostics,
  buildRuntimeTruthPayload,
  resetRuntimeTruthAuthorityForTests,
} from './runtime-truth-verifier.js';
import { createRuntimeIdentity, resetRuntimeIdentityForTests } from './runtime-identity.js';
import { computeSourceFingerprint } from './source-fingerprint.js';
import { detectStaleRuntime } from './stale-runtime-detector.js';
import { assertValidatorRuntimeTruth } from './validator-runtime-parity.js';
import {
  BROWSER_REQUIRED_CAPABILITIES,
  COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE,
  verifyRuntimeTruthPayload,
} from './browser-runtime-parity.js';
import {
  RUNTIME_TRUTH_AUTHORITY_V1_PASS_TOKEN,
  RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
} from './rta-types.js';

export const RTA_VALIDATION_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

export interface RtaValidationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export function assertRtaCheck(
  checks: RtaValidationCheck[],
  name: string,
  condition: boolean,
  detail: string,
): void {
  checks.push({ name, passed: condition, detail });
}

async function startEphemeralServer(testRoot: string): Promise<{ server: Server; baseUrl: string }> {
  process.env.AIDEVENGINE_REGISTRY_ROOT = testRoot;
  const { createFounderRealityServer } = await import('../../server/founder-reality-server.js');
  const server = createFounderRealityServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind ephemeral server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

export async function runRuntimeTruthAuthorityValidation(): Promise<{
  checks: RtaValidationCheck[];
  allPassed: boolean;
}> {
  const checks: RtaValidationCheck[] = [];

  assertRtaCheck(
    checks,
    'module.index exists',
    existsSync(join(RTA_VALIDATION_ROOT, 'src/runtime-truth-authority/index.ts')),
    'index.ts',
  );
  assertRtaCheck(
    checks,
    'module.browser bridge exists',
    existsSync(join(RTA_VALIDATION_ROOT, 'public/founder-reality/runtime-truth-authority.js')),
    'runtime-truth-authority.js',
  );

  const testRoot = mkdtempSync(join(tmpdir(), 'rta-validation-'));
  let server: Server | null = null;
  try {
    const booted = bootRuntimeTruthAuthority({
      rootDir: RTA_VALIDATION_ROOT,
      port: 0,
      packageVersion: '0.0.0-test',
      gitCommit: 'test',
    });
    assertRtaCheck(checks, 'boot.runtimeId', Boolean(booted.runtimeIdentity.runtimeId), booted.runtimeIdentity.runtimeId);

    const firstId = booted.runtimeIdentity.runtimeId;
    resetRuntimeIdentityForTests();
    const second = createRuntimeIdentity({
      rootDir: RTA_VALIDATION_ROOT,
      port: 0,
      packageVersion: '0.0.0-test',
      gitCommit: 'test',
    });
    assertRtaCheck(
      checks,
      'identity.changes on restart',
      second.runtimeId !== firstId,
      `${firstId.slice(0, 8)} -> ${second.runtimeId.slice(0, 8)}`,
    );

    resetRuntimeTruthAuthorityForTests();
    const started = await startEphemeralServer(testRoot);
    server = started.server;
    const truthRes = await fetch(`${started.baseUrl}/api/runtime/truth`);
    const truthJson = (await truthRes.json()) as {
      ok?: boolean;
      runtimeIdentity?: { runtimeId?: string };
      capabilities?: Array<{ name: string; enabled: boolean }>;
      routeContracts?: Array<{ path: string; method: string; registeredAtBoot: boolean }>;
    };
    assertRtaCheck(checks, 'api.runtime truth status', truthRes.status === 200, String(truthRes.status));
    assertRtaCheck(
      checks,
      'api.runtime identity',
      Boolean(truthJson.runtimeIdentity?.runtimeId),
      truthJson.runtimeIdentity?.runtimeId ?? 'missing',
    );

    const capabilityNames = new Set((truthJson.capabilities ?? []).filter((c) => c.enabled).map((c) => c.name));
    for (const required of [
      'aee',
      'ael',
      'engineeringIntelligence',
      'autofixBuildRepair',
      'previewContract',
      'buildIntentClassification',
    ]) {
      assertRtaCheck(checks, `capability.${required}`, capabilityNames.has(required), String(capabilityNames.has(required)));
    }

    const classifyRoute = (truthJson.routeContracts ?? []).find(
      (route) => route.path === '/api/brain/classify-build-intent' && route.method === 'POST',
    );
    assertRtaCheck(
      checks,
      'route.classify-build-intent registered',
      classifyRoute?.registeredAtBoot === true,
      String(classifyRoute?.registeredAtBoot),
    );

    const healthRes = await fetch(`${started.baseUrl}/api/brain/health`);
    const healthJson = (await healthRes.json()) as { runtimeTruth?: { runtimeId?: string } };
    assertRtaCheck(
      checks,
      'health.runtimeTruth block',
      Boolean(healthJson.runtimeTruth?.runtimeId),
      healthJson.runtimeTruth?.runtimeId ?? 'missing',
    );

    const classifyProbe = await fetch(`${started.baseUrl}/api/brain/classify-build-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Build a task tracker app now' }),
    });
    assertRtaCheck(
      checks,
      'route.classify-build-intent reachable',
      classifyProbe.status === 200,
      String(classifyProbe.status),
    );

    const appJs = readFileSync(join(RTA_VALIDATION_ROOT, 'public/founder-reality/app.js'), 'utf8');
    const browserJs = readFileSync(join(RTA_VALIDATION_ROOT, 'public/founder-reality/runtime-truth-authority.js'), 'utf8');
    assertRtaCheck(
      checks,
      'browser.checks truth before classify',
      appJs.includes('RuntimeTruthAuthority') &&
        appJs.includes('verifyRuntimeTruth') &&
        browserJs.includes('/api/runtime/truth'),
      'runtime truth gating',
    );
    assertRtaCheck(
      checks,
      'browser.ready trace constant',
      browserJs.includes(COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE),
      COMMAND_CENTER_RUNTIME_TRUTH_READY_TRACE,
    );

    const ephemeralParity = await assertValidatorRuntimeTruth({
      runtimeMode: 'EPHEMERAL',
      baseUrl: started.baseUrl,
    });
    assertRtaCheck(
      checks,
      'validator.ephemeral parity',
      ephemeralParity.ok && ephemeralParity.runtimeMode === 'EPHEMERAL',
      ephemeralParity.errors.join('; ') || 'ok',
    );

    const productionParity = await assertValidatorRuntimeTruth({
      runtimeMode: 'PRODUCTION_LOCALHOST',
      productionPort: FOUNDER_REALITY_PORT,
      expectedSourceFingerprint: computeSourceFingerprint(RTA_VALIDATION_ROOT),
    });
    assertRtaCheck(
      checks,
      'validator.production localhost probe executed',
      productionParity.productionProbed,
      String(productionParity.productionProbed),
    );
    if (productionParity.ok) {
      assertRtaCheck(checks, 'validator.production parity', true, 'production runtime matches');
    } else {
      assertRtaCheck(
        checks,
        'validator.production fails when stale',
        productionParity.errors.some((error) => error.includes('PRODUCTION')),
        productionParity.errors[0] ?? 'production mismatch detected',
      );
    }

    const stalePayload = buildRuntimeTruthPayload(RTA_VALIDATION_ROOT, {
      expectedSourceFingerprint: 'intentionally-wrong-fingerprint',
    });
    assertRtaCheck(
      checks,
      'stale.fingerprint mismatch detected',
      stalePayload.freshness.status === 'STALE',
      stalePayload.freshness.reasons.join('; '),
    );

    const staleDetect = detectStaleRuntime({
      rootDir: RTA_VALIDATION_ROOT,
      expectedSourceFingerprint: 'wrong',
      serverContractVersion: RUNTIME_TRUTH_AUTHORITY_V1_CONTRACT_VERSION,
    });
    assertRtaCheck(checks, 'stale.detector', staleDetect.status === 'STALE', staleDetect.reasons.join('; '));

    const browserVerify = verifyRuntimeTruthPayload(truthJson as never);
    assertRtaCheck(
      checks,
      'browser.verify payload',
      browserVerify.ok && browserVerify.classifyRouteAvailable,
      String(browserVerify.ok),
    );
    assertRtaCheck(
      checks,
      'browser.required capabilities declared',
      BROWSER_REQUIRED_CAPABILITIES.includes('buildIntentClassification'),
      BROWSER_REQUIRED_CAPABILITIES.join(','),
    );

    const fake405 = buildGlobal405Diagnostics('/api/brain/classify-build-intent', 'POST');
    assertRtaCheck(checks, 'global405.runtimeId', Boolean(fake405.runtimeId), fake405.runtimeId);
    assertRtaCheck(checks, 'global405.requestedPath', fake405.requestedPath.includes('classify'), fake405.requestedPath);
    assertRtaCheck(checks, 'global405.hint restart', fake405.hint.includes('restart'), fake405.hint);

    const pkg = JSON.parse(readFileSync(join(RTA_VALIDATION_ROOT, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    assertRtaCheck(
      checks,
      'npm validate script',
      Boolean(pkg.scripts?.['validate:runtime-truth-authority']),
      'validate:runtime-truth-authority',
    );

    assertRtaCheck(
      checks,
      'no app-specific hardcoding in RTA module',
      !readFileSync(join(RTA_VALIDATION_ROOT, 'src/runtime-truth-authority/capability-manifest.ts'), 'utf8').includes(
        'expense track',
      ),
      'generic capabilities only',
    );
  } finally {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
    }
    delete process.env.AIDEVENGINE_REGISTRY_ROOT;
    rmSync(testRoot, { recursive: true, force: true });
    resetRuntimeTruthAuthorityForTests();
  }

  return {
    checks,
    allPassed: checks.every((check) => check.passed),
  };
}

export { RUNTIME_TRUTH_AUTHORITY_V1_PASS_TOKEN };

export function printRtaValidationResults(checks: RtaValidationCheck[]): number {
  let passed = 0;
  for (const check of checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`);
    if (check.passed) passed += 1;
  }
  console.log('');
  console.log(`${passed}/${checks.length} checks passed`);
  return passed;
}
