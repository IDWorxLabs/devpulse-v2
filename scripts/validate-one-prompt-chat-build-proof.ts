/**
 * Validates Command Center chat build path via POST /api/brain/respond.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, type Server } from 'node:http';
import {
  resetGeneratedDevServerManagerForTests,
  resetOnePromptLivePreviewForTests,
  settleEventLoop,
} from '../src/one-prompt-live-preview/index.js';
import { resetPreviewSessionManagerForTests } from '../src/live-preview-runtime/index.js';
import { resetRequirementsToPlanContractModuleForTests } from '../src/requirements-to-plan-execution-contract/index.js';
import { resetConnectedBuildExecutionModuleForTests } from '../src/connected-build-execution/index.js';
import { resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { createFounderRealityServer } from '../server/founder-reality-server.js';
import {
  formatChatBuildProofResults,
  runOnePromptChatBuildProofChecks,
} from './lib/one-prompt-chat-build-proof-core.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

async function resetModules(): Promise<void> {
  resetOnePromptLivePreviewForTests();
  await resetGeneratedDevServerManagerForTests();
  resetPreviewSessionManagerForTests();
  resetRequirementsToPlanContractModuleForTests();
  resetConnectedBuildExecutionModuleForTests();
  resetDevPulseV2AiDevEngineAuthorityForTests();
}

async function startTestServer(): Promise<{ server: Server; baseUrl: string }> {
  const server = createFounderRealityServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind test server');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

await resetModules();
const { server, baseUrl } = await startTestServer();

let proof: Awaited<ReturnType<typeof runOnePromptChatBuildProofChecks>>;
try {
  proof = await runOnePromptChatBuildProofChecks({ rootDir: ROOT, baseUrl });
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  await resetModules();
  await settleEventLoop();
}

console.log(`\nOne-Prompt Chat Build Proof — ${proof.passed ? 'PASS' : 'FAIL'}`);
console.log(`Pass token: ${proof.passToken}`);
console.log(formatChatBuildProofResults(proof.results));

process.exitCode = proof.passed ? 0 : 1;
