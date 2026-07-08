/**
 * Autonomous Runtime Authority V1 — dev entry (Run button).
 */

import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import type { ChildProcess } from 'node:child_process';
import {
  bootstrapAutonomousRuntimeAuthority,
  finalizeAutonomousRuntimeAuthority,
  isRuntimeAuthorityBypassed,
  launchAuthoritativeServerChild,
  forwardShutdownSignalsToChild,
  terminateAuthoritativeServerChild,
  waitForAuthoritativeServerChildExit,
} from '../src/autonomous-runtime-authority-v1/index.js';

const ROOT_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..');

async function main(): Promise<void> {
  console.log('');
  console.log('Autonomous Runtime Authority — starting dev server…');
  console.log('');

  const { port, plan } = await bootstrapAutonomousRuntimeAuthority({
    repositoryRoot: ROOT_DIR,
    currentPid: process.pid,
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error('');
    console.error('[founder-reality-dev-entry] Runtime Authority bootstrap failed.');
    console.error(`  ${message}`);
    console.error('');
    process.exit(1);
  });

  if (!isRuntimeAuthorityBypassed() && plan.recoveryActions.length > 0) {
    console.log('');
    console.log('Autonomous Runtime Authority V1');
    console.log('===============================');
    for (const action of plan.recoveryActions) {
      console.log(`  • ${action}`);
    }
    console.log(`  → Launching authoritative server on port ${port}`);
    console.log('');
  }

  process.stderr.write(`[founder-reality-dev-entry] spawning authoritative server on port ${port}…\n`);

  let child: ChildProcess;
  try {
    child = await launchAuthoritativeServerChild({
      repositoryRoot: ROOT_DIR,
      port,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('');
    console.error('[founder-reality-dev-entry] Failed to launch authoritative server.');
    console.error(`  ${message}`);
    console.error('');
    process.exit(1);
  }

  forwardShutdownSignalsToChild(child);

  let state;
  try {
    state = await finalizeAutonomousRuntimeAuthority({
      repositoryRoot: ROOT_DIR,
      port,
      authoritativePid: child.pid ?? process.pid,
      startedAt: new Date().toISOString(),
    });
  } catch (err) {
    await terminateAuthoritativeServerChild(child);
    const message = err instanceof Error ? err.message : String(err);
    console.error('');
    console.error('[founder-reality-dev-entry] Runtime verification failed.');
    console.error(`  ${message}`);
    console.error('');
    process.exit(1);
  }

  if (!state.ready) {
    await terminateAuthoritativeServerChild(child);
    console.error('');
    console.error('[founder-reality-dev-entry] Runtime Authority could not verify a healthy server.');
    console.error('  See errors above, then retry npm run dev.');
    console.error('');
    process.exit(1);
  }

  console.log('');
  console.log('Runtime Authority READY');
  console.log(`URL: http://127.0.0.1:${port}`);
  console.log('');

  const exitCode = await waitForAuthoritativeServerChildExit(child);
  process.exit(exitCode);
}

main().catch(async (err) => {
  console.error('');
  console.error('[founder-reality-dev-entry] failed:', err instanceof Error ? err.message : err);
  console.error('');
  process.exit(1);
});
