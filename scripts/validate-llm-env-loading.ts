/**
 * Phase 26.1 — LLM environment loading validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const LLM_ENV_LOADING_PASS_TOKEN = 'LLM_ENV_LOADING_PASS';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const envPath = join(ROOT, '.env');
assert('.env exists at project root', existsSync(envPath), envPath);

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const hasDotenv =
  Boolean(pkg.dependencies?.dotenv) ||
  Boolean(pkg.devDependencies?.dotenv) ||
  existsSync(join(ROOT, 'node_modules', 'dotenv', 'package.json'));
assert('dotenv listed in package.json / installed', hasDotenv, hasDotenv ? 'present' : 'missing');

const serverSource = readFileSync(join(ROOT, 'server', 'founder-reality-server.ts'), 'utf8');
const loadEnvImportIndex = serverSource.indexOf("import './load-env.js'");
const brainHandlerImportIndex = serverSource.indexOf("from './brain-api-handler.js'");
assert(
  'founder-reality-server imports load-env before brain handler',
  loadEnvImportIndex >= 0 && brainHandlerImportIndex > loadEnvImportIndex,
  `load-env@${loadEnvImportIndex}, brain-handler@${brainHandlerImportIndex}`,
);

const loadEnvSource = readFileSync(join(ROOT, 'server', 'load-env.ts'), 'utf8');
assert(
  'load-env.ts calls dotenv.config',
  loadEnvSource.includes('dotenv.config'),
  'dotenv.config present',
);

dotenv.config({ path: envPath });
const keyConfigured = Boolean(process.env.LLM_API_KEY?.trim());
const provider = process.env.LLM_PROVIDER ?? '(unset)';
assert(
  'LLM_API_KEY configured after dotenv.config',
  keyConfigured,
  `LLM_API_KEY configured: ${keyConfigured ? 'yes' : 'no'}`,
);
assert('LLM_PROVIDER readable after dotenv.config', provider !== '(unset)', `LLM_PROVIDER=${provider}`);

// Simulate server bootstrap order (dotenv already loaded above)
const { getLlmProviderStatus } = await import('../src/llm-chat-brain/index.js');
const status = getLlmProviderStatus();
assert(
  'getLlmProviderStatus returns boolean connected',
  typeof status.connected === 'boolean',
  `llmConnected=${status.connected}`,
);
assert(
  'health-style llmConnected is true when key configured',
  keyConfigured ? status.connected === true : status.connected === false,
  `connected=${status.connected}, keyConfigured=${keyConfigured ? 'yes' : 'no'}`,
);

const failed = results.filter((r) => !r.passed);
console.log('\n--- LLM Environment Loading Validation ---');
for (const r of results) {
  console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
}

if (failed.length === 0) {
  console.log(`\n${LLM_ENV_LOADING_PASS_TOKEN}`);
  process.exit(0);
}

console.log(`\n${failed.length} check(s) failed.`);
process.exit(1);
