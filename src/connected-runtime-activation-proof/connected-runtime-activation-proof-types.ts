/**
 * Connected Runtime Activation Proof — runtime evidence models.
 * Read-only — no synthetic runtime claims; bounded fixture evidence only.
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';

export type RuntimeProofLevel = 'PROVEN' | 'PARTIAL' | 'NOT_PROVEN';

export type RuntimeActivationState =
  | 'NOT_STARTED'
  | 'COMMAND_FOUND'
  | 'PROCESS_STARTED'
  | 'PORT_REACHABLE'
  | 'HEALTHY';

export type RuntimeProcessState = 'NOT_STARTED' | 'STARTED' | 'EXITED' | 'UNKNOWN';

export type RuntimePortState = 'NOT_OBSERVED' | 'OBSERVED' | 'REACHABLE' | 'UNREACHABLE';

export type RuntimeHealthState = 'NOT_CHECKED' | 'FAILED' | 'HEALTHY' | 'PARTIAL';

export interface RuntimeCommandAssessment {
  readOnly: true;
  runtimeCommandFound: boolean;
  command: string | null;
  workingDirectory: string | null;
  scriptName: string | null;
  frameworkHint: string | null;
  missingCommandReason: string | null;
  confidence: number;
  executionObserved: boolean;
}

export interface RuntimeProcessAssessment {
  readOnly: true;
  processState: RuntimeProcessState;
  processId: string | null;
  commandUsed: string | null;
  workingDirectory: string | null;
  startTime: string | null;
  exitStatus: number | null;
  runtimeSessionId: string | null;
  confidence: number;
}

export interface RuntimePortAssessment {
  readOnly: true;
  portState: RuntimePortState;
  port: number | null;
  host: string | null;
  url: string | null;
  reachable: boolean;
  protocol: string | null;
  sourceProcessSessionId: string | null;
  confidence: number;
}

export interface RuntimeHealthAssessment {
  readOnly: true;
  healthState: RuntimeHealthState;
  statusCode: number | null;
  responseType: 'html' | 'json' | 'text' | null;
  responseTimeMs: number | null;
  healthEndpoint: string | null;
  confidence: number;
}

export interface RuntimeLogAssessment {
  readOnly: true;
  bootComplete: boolean;
  readySignalFound: boolean;
  fatalErrorFound: boolean;
  warningCount: number;
  errorCount: number;
  confidence: number;
  notableSignals: string[];
}

export interface RuntimeManifestAssessment {
  readOnly: true;
  manifestExists: boolean;
  contractLinked: boolean;
  workspaceLinked: boolean;
  processLinked: boolean;
  portLinked: boolean;
  traceabilityScore: number;
}

export interface RuntimeLinkageAnalysis {
  readOnly: true;
  runtimeLinkageConnected: boolean;
  firstBrokenRuntimeLink: string | null;
  missingLinks: string[];
  traceabilityScore: number;
  contractToWorkspace: boolean;
  workspaceToCommand: boolean;
  commandToProcess: boolean;
  processToPort: boolean;
  portToHealth: boolean;
}

export interface RuntimeActivationFounderQuestions {
  readOnly: true;
  canApplicationRun: boolean;
  canRuntimeBeReached: boolean;
  commandUsed: string | null;
  portOrUrlObserved: string | null;
  exactMissingRuntimeEvidence: string[];
  whatShouldBeBuiltNext: string[];
}

export interface RuntimeActivationProofReport {
  readOnly: true;
  advisoryOnly: true;
  assessmentId: string;
  generatedAt: string;
  runtimeProofLevel: RuntimeProofLevel;
  runtimeActivationState: RuntimeActivationState;
  buildMaterializationProven: boolean;
  command: RuntimeCommandAssessment;
  process: RuntimeProcessAssessment;
  port: RuntimePortAssessment;
  health: RuntimeHealthAssessment;
  logs: RuntimeLogAssessment;
  manifest: RuntimeManifestAssessment;
  linkage: RuntimeLinkageAnalysis;
  missingEvidence: string[];
  recommendedFix: string;
  recommendedNextActions: string[];
  founderQuestions: RuntimeActivationFounderQuestions;
  cacheKey: string;
}

export interface RuntimeActivationProofAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'RUNTIME_ACTIVATION_PROOF_COMPLETE' | 'RUNTIME_ACTIVATION_PROOF_FAILED';
  report: RuntimeActivationProofReport;
}

/** Injectable bounded runtime session evidence for validation fixtures. */
export interface RuntimeSessionEvidence {
  runtimeSessionId?: string;
  command?: string;
  workingDirectory?: string;
  scriptName?: string;
  frameworkHint?: string;
  executionObserved?: boolean;
  processId?: string;
  processState?: RuntimeProcessState;
  startTime?: string;
  exitStatus?: number | null;
  port?: number;
  host?: string;
  url?: string;
  reachable?: boolean;
  protocol?: string;
  healthStatusCode?: number;
  healthResponseType?: 'html' | 'json' | 'text';
  responseTimeMs?: number;
  healthEndpoint?: string;
  logLines?: string[];
}

export interface AssessConnectedRuntimeActivationProofInput {
  rootDir?: string;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  runtimeSessionEvidence?: RuntimeSessionEvidence;
  workspacePath?: string;
}

export interface RuntimeActivationProofHistoryEntry {
  timestamp: string;
  assessmentId: string;
  runtimeProofLevel: RuntimeProofLevel;
  runtimeActivationState: RuntimeActivationState;
  runtimeLinkageConnected: boolean;
}

export interface RuntimeActivationProofHistorySummary {
  totalAssessments: number;
  provenRuntimes: number;
  partialRuntimes: number;
  notProvenRuntimes: number;
}

export interface RuntimeActivationProofArtifacts {
  runtimeActivationProofAssessment: RuntimeActivationProofAssessment;
  runtimeActivationProofReportMarkdown: string;
}
