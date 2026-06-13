/**
 * Runtime Manifest Analyzer — verify runtime evidence links to build materialization.
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type {
  RuntimeCommandAssessment,
  RuntimeManifestAssessment,
  RuntimePortAssessment,
  RuntimeProcessAssessment,
} from './connected-runtime-activation-proof-types.js';

export function analyzeRuntimeManifest(input: {
  buildMaterialization: ConnectedBuildExecutionReport | null;
  workspacePath: string | null;
  command: RuntimeCommandAssessment;
  process: RuntimeProcessAssessment;
  port: RuntimePortAssessment;
}): RuntimeManifestAssessment {
  const contractId = input.buildMaterialization?.buildMaterialization.contractId ?? null;
  const workspaceFromBuild =
    input.buildMaterialization?.workspaceMaterialization.workspacePath ?? null;

  const contractLinked = contractId !== null && contractId !== 'none';
  const workspaceLinked =
    input.workspacePath !== null &&
    (workspaceFromBuild === null ||
      input.workspacePath.replace(/\\/g, '/') === workspaceFromBuild.replace(/\\/g, '/'));
  const processLinked =
    input.process.processState === 'STARTED' &&
    (input.process.runtimeSessionId !== null || input.process.processId !== null);
  const portLinked = input.port.port !== null && input.port.sourceProcessSessionId !== null
    ? input.process.runtimeSessionId === input.port.sourceProcessSessionId
    : input.port.port !== null;

  const manifestExists =
    contractLinked && input.command.runtimeCommandFound && (workspaceLinked || input.workspacePath !== null);

  const checks = [contractLinked, workspaceLinked, processLinked, portLinked];
  const passed = checks.filter(Boolean).length;
  const traceabilityScore = Math.round((passed / 4) * 100);

  return {
    readOnly: true,
    manifestExists,
    contractLinked,
    workspaceLinked,
    processLinked,
    portLinked,
    traceabilityScore,
  };
}
