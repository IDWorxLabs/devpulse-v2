/**
 * Single-fixture real-path convergence build (progress tooling).
 *
 * Usage:
 *   npx tsx scripts/run-e2e-convergence-build.ts contact-task-manager
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONVERGENCE_BUILD_FIXTURES,
  runConvergenceMatrix,
} from '../src/end-to-end-autonomous-production-convergence/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const fixtureId = process.argv[2] ?? 'contact-task-manager';

if (!CONVERGENCE_BUILD_FIXTURES.some((fixture) => fixture.fixtureId === fixtureId)) {
  console.error(`Unknown fixture: ${fixtureId}`);
  console.error(`Known: ${CONVERGENCE_BUILD_FIXTURES.map((fixture) => fixture.fixtureId).join(', ')}`);
  process.exit(1);
}

const result = await runConvergenceMatrix({
  rootDir: ROOT,
  fixtureIds: [fixtureId],
  maxAttemptsPerFixture: 1,
});

for (const run of result.results) {
  console.log(
    JSON.stringify(
      {
        fixtureId: run.fixture.fixtureId,
        succeeded: run.succeeded,
        status: run.build.status,
        identity: run.attempt.approvedIdentity,
        failureReason: run.build.failureReason?.slice(0, 1000) ?? null,
        gpcaGate: run.build.gpcaComplianceReport?.finalGateOutcome ?? null,
        blockedReasons: (run.build.gpcaComplianceReport?.blockedReasons ?? []).slice(0, 15),
        previewUrl: run.build.previewUrl,
        livePreviewAvailable: run.build.livePreviewAvailable,
        npmBuildOk: run.build.npmBuildOk,
        moduleIds: run.build.approvedModulePlan?.moduleIds ?? null,
        nav: run.build.approvedNavigationPlan?.productEntries ?? null,
        buildOutcome: run.productionPath.buildOutcome,
        b8: run.attempt.b8Result,
        b9: run.attempt.b9Result,
        b10: run.attempt.b10Result,
        b11: run.attempt.b11Result,
        disposition: run.attempt.finalDisposition,
        rootCauseClass: run.attempt.rootCauseClass,
        firstBrokenBoundary: run.attempt.firstBrokenBoundary,
      },
      null,
      2,
    ),
  );
}

console.log(`ledger=${result.ledgerPath}`);
process.exit(result.successfulFixtureIds.length > 0 ? 0 : 2);
