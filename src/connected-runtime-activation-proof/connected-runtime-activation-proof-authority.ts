/**
 * Connected Runtime Activation Proof — runtime activation proof authority.
 * Read-only — assesses runtime evidence; does not execute commands.
 */

import { createHash } from 'node:crypto';
import { assessConnectedBuildExecution } from '../connected-build-execution/index.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import { WORKSPACE_ROOT_DIR } from '../connected-build-execution/connected-build-execution-registry.js';
import {
  CONNECTED_RUNTIME_ACTIVATION_PROOF_CACHE_KEY_PREFIX,
  CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS_TOKEN,
} from './connected-runtime-activation-proof-registry.js';
import { recordRuntimeActivationProofAssessment } from './connected-runtime-activation-proof-history.js';
import { buildRuntimeActivationProofReportMarkdown } from './connected-runtime-activation-proof-report-builder.js';
import type {
  AssessConnectedRuntimeActivationProofInput,
  RuntimeActivationProofAssessment,
  RuntimeActivationProofArtifacts,
  RuntimeActivationProofReport,
  RuntimeActivationFounderQuestions,
  RuntimeActivationState,
  RuntimeProofLevel,
} from './connected-runtime-activation-proof-types.js';
import { analyzeRuntimeHealth, isHealthAcceptable } from './runtime-health-analyzer.js';
import { analyzeRuntimeLinkage } from './runtime-linkage-analyzer.js';
import { analyzeRuntimeLogs } from './runtime-log-analyzer.js';
import { analyzeRuntimeManifest } from './runtime-manifest-analyzer.js';
import { analyzeRuntimePort, isPortReachable } from './runtime-port-analyzer.js';
import { analyzeRuntimeProcess, isProcessObserved } from './runtime-process-analyzer.js';
import { resolveRuntimeCommand } from './runtime-command-resolver.js';

let assessmentCounter = 0;

export function resetRuntimeActivationProofCounterForTests(): void {
  assessmentCounter = 0;
}

function nextAssessmentId(): string {
  assessmentCounter += 1;
  return `connected-runtime-activation-proof-${assessmentCounter}`;
}

function stableCacheKey(assessmentId: string, proofLevel: RuntimeProofLevel): string {
  const digest = createHash('sha256')
    .update([CONNECTED_RUNTIME_ACTIVATION_PROOF_PASS_TOKEN, assessmentId, proofLevel].join('|'))
    .digest('hex')
    .slice(0, 16);
  return `${CONNECTED_RUNTIME_ACTIVATION_PROOF_CACHE_KEY_PREFIX}:${digest}`;
}

function resolveBuildMaterialization(
  input: AssessConnectedRuntimeActivationProofInput,
  rootDir: string,
): ConnectedBuildExecutionReport | null {
  if (input.buildMaterializationReport !== undefined) {
    return input.buildMaterializationReport;
  }
  return assessConnectedBuildExecution({ rootDir }).report;
}

function resolveWorkspacePath(
  buildMaterialization: ConnectedBuildExecutionReport | null,
  override?: string,
): string | null {
  if (override) return override.replace(/\\/g, '/');
  if (!buildMaterialization) return null;
  const fromReport = buildMaterialization.workspaceMaterialization.workspacePath;
  if (fromReport) return fromReport.replace(/\\/g, '/');
  const contractId = buildMaterialization.buildMaterialization.contractId;
  if (contractId && contractId !== 'none') {
    return `${WORKSPACE_ROOT_DIR}/${contractId}`.replace(/\\/g, '/');
  }
  const target = buildMaterialization.buildMaterialization.workspaceTargets[0];
  return target ?? null;
}

function deriveActivationState(input: {
  commandFound: boolean;
  processStarted: boolean;
  portReachable: boolean;
  healthOk: boolean;
}): RuntimeActivationState {
  if (input.healthOk && input.portReachable) return 'HEALTHY';
  if (input.portReachable) return 'PORT_REACHABLE';
  if (input.processStarted) return 'PROCESS_STARTED';
  if (input.commandFound) return 'COMMAND_FOUND';
  return 'NOT_STARTED';
}

function deriveProofLevel(input: {
  buildProven: boolean;
  commandFound: boolean;
  processStarted: boolean;
  portReachable: boolean;
  healthOk: boolean;
  linkageConnected: boolean;
  fatalLogs: boolean;
}): RuntimeProofLevel {
  if (input.fatalLogs && !input.processStarted) return 'NOT_PROVEN';
  if (
    input.buildProven &&
    input.commandFound &&
    input.processStarted &&
    input.portReachable &&
    input.healthOk &&
    input.linkageConnected
  ) {
    return 'PROVEN';
  }
  if (input.commandFound || input.processStarted || input.portReachable) {
    return 'PARTIAL';
  }
  return 'NOT_PROVEN';
}

function buildEmptyReport(assessmentId: string, reason: string): RuntimeActivationProofReport {
  const emptyCommand = {
    readOnly: true as const,
    runtimeCommandFound: false,
    command: null,
    workingDirectory: null,
    scriptName: null,
    frameworkHint: null,
    missingCommandReason: reason,
    confidence: 0,
    executionObserved: false,
  };
  const emptyProcess = {
    readOnly: true as const,
    processState: 'NOT_STARTED' as const,
    processId: null,
    commandUsed: null,
    workingDirectory: null,
    startTime: null,
    exitStatus: null,
    runtimeSessionId: null,
    confidence: 0,
  };
  const emptyPort = {
    readOnly: true as const,
    portState: 'NOT_OBSERVED' as const,
    port: null,
    host: null,
    url: null,
    reachable: false,
    protocol: null,
    sourceProcessSessionId: null,
    confidence: 0,
  };
  const emptyHealth = {
    readOnly: true as const,
    healthState: 'NOT_CHECKED' as const,
    statusCode: null,
    responseType: null,
    responseTimeMs: null,
    healthEndpoint: null,
    confidence: 0,
  };
  const emptyLogs = {
    readOnly: true as const,
    bootComplete: false,
    readySignalFound: false,
    fatalErrorFound: false,
    warningCount: 0,
    errorCount: 0,
    confidence: 0,
    notableSignals: [] as string[],
  };
  const emptyManifest = {
    readOnly: true as const,
    manifestExists: false,
    contractLinked: false,
    workspaceLinked: false,
    processLinked: false,
    portLinked: false,
    traceabilityScore: 0,
  };
  const emptyLinkage = {
    readOnly: true as const,
    runtimeLinkageConnected: false,
    firstBrokenRuntimeLink: 'contract→workspace',
    missingLinks: [reason],
    traceabilityScore: 0,
    contractToWorkspace: false,
    workspaceToCommand: false,
    commandToProcess: false,
    processToPort: false,
    portToHealth: false,
  };

  return {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    runtimeProofLevel: 'NOT_PROVEN',
    runtimeActivationState: 'NOT_STARTED',
    buildMaterializationProven: false,
    command: emptyCommand,
    process: emptyProcess,
    port: emptyPort,
    health: emptyHealth,
    logs: emptyLogs,
    manifest: emptyManifest,
    linkage: emptyLinkage,
    missingEvidence: [reason],
    recommendedFix: 'Prove build materialization before runtime activation assessment.',
    recommendedNextActions: ['Materialize build-ready contract into workspace with package.json scripts.'],
    founderQuestions: {
      readOnly: true,
      canApplicationRun: false,
      canRuntimeBeReached: false,
      commandUsed: null,
      portOrUrlObserved: null,
      exactMissingRuntimeEvidence: [reason],
      whatShouldBeBuiltNext: ['Complete BUILD materialization proof first.'],
    },
    cacheKey: stableCacheKey(assessmentId, 'NOT_PROVEN'),
  };
}

export function assessConnectedRuntimeActivationProof(
  input: AssessConnectedRuntimeActivationProofInput = {},
): RuntimeActivationProofAssessment {
  const rootDir = input.rootDir ?? process.cwd();
  const assessmentId = nextAssessmentId();
  const buildMaterialization = resolveBuildMaterialization(input, rootDir);
  const buildProven = buildMaterialization?.proofLevel === 'PROVEN';

  if (!buildMaterialization || !buildProven) {
    const reason = !buildMaterialization
      ? 'No build materialization report available'
      : `Build materialization proof level: ${buildMaterialization.proofLevel} (PROVEN required for runtime proof)`;
    const report = buildEmptyReport(assessmentId, reason);
    const assessment: RuntimeActivationProofAssessment = {
      readOnly: true,
      advisoryOnly: true,
      orchestrationState: 'RUNTIME_ACTIVATION_PROOF_COMPLETE',
      report,
    };
    recordRuntimeActivationProofAssessment(assessment);
    return assessment;
  }

  const workspacePath = resolveWorkspacePath(buildMaterialization, input.workspacePath);
  const sessionEvidence = input.runtimeSessionEvidence;

  const command = resolveRuntimeCommand({ rootDir, workspacePath, sessionEvidence });
  const process = analyzeRuntimeProcess({ command, sessionEvidence });
  const port = analyzeRuntimePort({ process, sessionEvidence });
  const health = analyzeRuntimeHealth({ port, sessionEvidence });
  const logs = analyzeRuntimeLogs({ sessionEvidence });
  const manifest = analyzeRuntimeManifest({
    buildMaterialization,
    workspacePath,
    command,
    process,
    port,
  });
  const linkage = analyzeRuntimeLinkage({
    buildMaterialization,
    workspacePath,
    command,
    process,
    port,
    health,
  });

  const processStarted = isProcessObserved(process.processState);
  const portReachable = isPortReachable(port);
  const healthOk = isHealthAcceptable(health.healthState);

  const runtimeActivationState = deriveActivationState({
    commandFound: command.runtimeCommandFound,
    processStarted,
    portReachable,
    healthOk,
  });

  const runtimeProofLevel = deriveProofLevel({
    buildProven,
    commandFound: command.runtimeCommandFound,
    processStarted,
    portReachable,
    healthOk,
    linkageConnected: linkage.runtimeLinkageConnected,
    fatalLogs: logs.fatalErrorFound,
  });

  const missingEvidence: string[] = [
    ...linkage.missingLinks,
    ...(command.missingCommandReason ? [command.missingCommandReason] : []),
    ...(!processStarted ? ['Runtime process not observed'] : []),
    ...(!portReachable ? ['Runtime port not reachable'] : []),
    ...(health.healthState === 'NOT_CHECKED' ? ['Runtime health not checked'] : []),
    ...(health.healthState === 'FAILED' ? ['Runtime health check failed'] : []),
    ...(logs.fatalErrorFound ? ['Fatal error in runtime logs'] : []),
  ];

  let recommendedFix =
    'Start generated application from materialized workspace and capture process, port, and health evidence.';
  if (runtimeProofLevel === 'PROVEN') {
    recommendedFix = 'Runtime activation proven — proceed to PREVIEW execution proof.';
  } else if (!command.runtimeCommandFound) {
    recommendedFix = 'Add runtime scripts (npm run dev/start) to materialized workspace package.json.';
  } else if (!processStarted) {
    recommendedFix = 'Runtime command exists but process was not observed — start app and record session evidence.';
  } else if (!portReachable) {
    recommendedFix = 'Process started but port not reachable — verify host/port binding and firewall.';
  } else if (!healthOk) {
    recommendedFix = 'Port reachable but health response missing — verify HTTP response or health endpoint.';
  } else if (!linkage.runtimeLinkageConnected && linkage.firstBrokenRuntimeLink) {
    recommendedFix = `Fix broken runtime link ${linkage.firstBrokenRuntimeLink} before claiming RUNTIME proven.`;
  }

  const founderQuestions: RuntimeActivationFounderQuestions = {
    readOnly: true,
    canApplicationRun: processStarted && command.runtimeCommandFound,
    canRuntimeBeReached: portReachable,
    commandUsed: command.command,
    portOrUrlObserved: port.url,
    exactMissingRuntimeEvidence: [...new Set(missingEvidence)].slice(0, 10),
    whatShouldBeBuiltNext:
      runtimeProofLevel === 'PROVEN'
        ? ['Connect runtime session to live preview activation proof.']
        : [recommendedFix],
  };

  const report: RuntimeActivationProofReport = {
    readOnly: true,
    advisoryOnly: true,
    assessmentId,
    generatedAt: new Date().toISOString(),
    runtimeProofLevel,
    runtimeActivationState,
    buildMaterializationProven: buildProven,
    command,
    process,
    port,
    health,
    logs,
    manifest,
    linkage,
    missingEvidence: [...new Set(missingEvidence)].slice(0, 12),
    recommendedFix,
    recommendedNextActions: founderQuestions.whatShouldBeBuiltNext,
    founderQuestions,
    cacheKey: stableCacheKey(assessmentId, runtimeProofLevel),
  };

  const assessment: RuntimeActivationProofAssessment = {
    readOnly: true,
    advisoryOnly: true,
    orchestrationState: 'RUNTIME_ACTIVATION_PROOF_COMPLETE',
    report,
  };

  recordRuntimeActivationProofAssessment(assessment);
  return assessment;
}

export function buildRuntimeActivationProofArtifacts(
  input: AssessConnectedRuntimeActivationProofInput = {},
): RuntimeActivationProofArtifacts {
  const runtimeActivationProofAssessment = assessConnectedRuntimeActivationProof(input);
  return {
    runtimeActivationProofAssessment,
    runtimeActivationProofReportMarkdown: buildRuntimeActivationProofReportMarkdown(
      runtimeActivationProofAssessment.report,
    ),
  };
}

export function resetConnectedRuntimeActivationProofModuleForTests(): void {
  resetRuntimeActivationProofCounterForTests();
}
