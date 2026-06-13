/**
 * Runtime Linkage Analyzer — verify full build-to-runtime evidence chain.
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type {
  RuntimeCommandAssessment,
  RuntimeHealthAssessment,
  RuntimeLinkageAnalysis,
  RuntimePortAssessment,
  RuntimeProcessAssessment,
} from './connected-runtime-activation-proof-types.js';
import { isHealthAcceptable } from './runtime-health-analyzer.js';
import { isPortReachable } from './runtime-port-analyzer.js';
import { isProcessObserved } from './runtime-process-analyzer.js';

export function analyzeRuntimeLinkage(input: {
  buildMaterialization: ConnectedBuildExecutionReport | null;
  workspacePath: string | null;
  command: RuntimeCommandAssessment;
  process: RuntimeProcessAssessment;
  port: RuntimePortAssessment;
  health: RuntimeHealthAssessment;
}): RuntimeLinkageAnalysis {
  const buildProven = input.buildMaterialization?.proofLevel === 'PROVEN';
  const workspaceExists =
    input.buildMaterialization?.workspaceMaterialization.workspaceExists ?? false;

  const contractToWorkspace = buildProven && workspaceExists && input.workspacePath !== null;
  const workspaceToCommand =
    contractToWorkspace && input.command.runtimeCommandFound && input.command.workingDirectory !== null;
  const commandToProcess = workspaceToCommand && isProcessObserved(input.process.processState);
  const processToPort = commandToProcess && isPortReachable(input.port);
  const portToHealth = processToPort && isHealthAcceptable(input.health.healthState);

  const links = [
    { key: 'contract→workspace', ok: contractToWorkspace },
    { key: 'workspace→command', ok: workspaceToCommand },
    { key: 'command→process', ok: commandToProcess },
    { key: 'process→port', ok: processToPort },
    { key: 'port→health', ok: portToHealth },
  ];

  const missingLinks: string[] = [];
  let firstBrokenRuntimeLink: string | null = null;
  for (const link of links) {
    if (!link.ok) {
      missingLinks.push(`Broken link: ${link.key}`);
      if (firstBrokenRuntimeLink === null) firstBrokenRuntimeLink = link.key;
    }
  }

  if (!buildProven) {
    missingLinks.unshift('Build materialization not PROVEN — runtime chain cannot start');
    if (firstBrokenRuntimeLink === null) firstBrokenRuntimeLink = 'contract→workspace';
  }

  const passed = links.filter((l) => l.ok).length;
  const traceabilityScore = Math.round((passed / links.length) * 100);
  const runtimeLinkageConnected = links.every((l) => l.ok) && buildProven;

  return {
    readOnly: true,
    runtimeLinkageConnected,
    firstBrokenRuntimeLink,
    missingLinks,
    traceabilityScore,
    contractToWorkspace,
    workspaceToCommand,
    commandToProcess,
    processToPort,
    portToHealth,
  };
}
