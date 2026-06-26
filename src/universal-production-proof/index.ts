/**
 * Universal Production Proof V1 — orchestrator.
 */

import { buildUniversalProductionProofReport } from './universal-production-proof-report.js';
import { writeUniversalProductionProofArtifacts, universalProductionProofPaths } from './universal-production-proof-artifacts.js';
import { runUniversalProductionProofProfile } from './universal-production-proof-profile-runner.js';
import type {
  UniversalProductionProofEvidence,
  UniversalProductionProofProfileScenario,
} from './universal-production-proof-types.js';
import { SUPPORTED_UNIVERSAL_PRODUCTION_PROFILES } from './universal-production-proof-types.js';

export async function runUniversalProductionProof(input: {
  projectRootDir: string;
  runId?: string;
  profiles?: UniversalProductionProofProfileScenario[];
}): Promise<UniversalProductionProofEvidence> {
  const runId = input.runId ?? `universal-proof-${Date.now()}`;
  const profiles = input.profiles ?? SUPPORTED_UNIVERSAL_PRODUCTION_PROFILES;
  const profileResults = [];

  for (const scenario of profiles) {
    const result = await runUniversalProductionProofProfile({
      projectRootDir: input.projectRootDir,
      scenario,
      runId,
    });
    profileResults.push(result);
  }

  const paths = universalProductionProofPaths(input.projectRootDir);
  const report = buildUniversalProductionProofReport({
    runId,
    profileResults,
    artifactPath: paths.artifact.replace(/\\/g, '/'),
    reportPath: paths.report.replace(/\\/g, '/'),
  });

  return writeUniversalProductionProofArtifacts({
    projectRootDir: input.projectRootDir,
    report,
  });
}

export {
  UNIVERSAL_PRODUCTION_PROOF_V1_PASS_TOKEN,
  SUPPORTED_UNIVERSAL_PRODUCTION_PROFILES,
  UNIVERSAL_PRODUCTION_PROOF_DIR,
  UNIVERSAL_PRODUCTION_PROOF_FILENAME,
  UNIVERSAL_PRODUCTION_PROOF_REPORT_MD,
  type UniversalProductionOverallVerdict,
  type UniversalProductionProofEvidence,
  type UniversalProductionProofMatrixRow,
  type UniversalProductionProofProfileResult,
  type UniversalProductionProofReport,
} from './universal-production-proof-types.js';

export { runUniversalProductionProofProfile } from './universal-production-proof-profile-runner.js';
export { formatUniversalProductionProofMatrix } from './universal-production-proof-matrix.js';
export { buildUniversalProductionProofChatSummary, ALLOWED_UNIVERSAL_PRODUCTION_WARNINGS } from './universal-production-proof-verdict.js';
export { buildUniversalProductionProofMarkdown } from './universal-production-proof-report.js';
export { writeUniversalProductionProofArtifacts, applyUniversalProductionProofToManifest, universalProductionProofPaths } from './universal-production-proof-artifacts.js';
export {
  buildUniversalProductionProofTraceEvents,
  universalProductionProofTraceTitles,
} from './universal-production-proof-trace-events.js';
