/**
 * Generated Runtime Crash Diagnosis — core models (Phase 26.81).
 */

import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import type {
  ResolvedStartupCommand,
  RuntimeEntrypointCandidate,
  RuntimeStartupProbeResult,
} from '../runtime-startup-proof-repair/runtime-startup-proof-repair-types.js';

export type RuntimeCrashClass =
  | 'SYNTAX_ERROR'
  | 'MISSING_IMPORT'
  | 'MODULE_FORMAT_MISMATCH'
  | 'ENTRYPOINT_NOT_FOUND'
  | 'BAD_SERVER_EXPORT'
  | 'BAD_VITE_CONFIG'
  | 'PORT_BIND_FAILURE'
  | 'GENERATED_CODE_RUNTIME_ERROR'
  | 'PROCESS_EXITED_EARLY'
  | 'UNKNOWN_RUNTIME_CRASH'
  | 'NONE';

export interface ExtractedCrashSignal {
  readOnly: true;
  source: 'STDOUT' | 'STDERR' | 'FATAL_ERROR' | 'PROBE_META';
  line: string;
  patternId: string;
}

export interface StartupLogCrashExtraction {
  readOnly: true;
  logLines: readonly string[];
  fatalErrors: readonly string[];
  extractedSignals: readonly ExtractedCrashSignal[];
  rawErrorExcerpt: string;
  exitCode: number | null;
  processId: string | null;
}

export interface RuntimeEntrypointCrashMapping {
  readOnly: true;
  attemptedCommand: string | null;
  cwd: string;
  entryFile: string | null;
  workspaceRoot: string;
  workspaceId: string;
  processCrashed: boolean;
  processStarted: boolean;
  portBound: boolean;
  healthResponded: boolean;
  candidateEntryFiles: readonly string[];
}

export interface RuntimeCrashClassification {
  readOnly: true;
  crashClass: RuntimeCrashClass;
  crashClassReason: string;
  failingFile: string | null;
  failingLine: number | null;
  failingSymbol: string | null;
  evidenceConfidence: number;
}

export interface RuntimeCrashRepairPlan {
  readOnly: true;
  repairRecommendation: string;
  expectedEffect: string;
  shouldAutoRepair: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  targetedFile: string | null;
}

export interface GeneratedRuntimeCrashDiagnosisReport {
  readOnly: true;
  advisoryOnly: true;
  diagnosisId: string;
  generatedAt: string;
  coreQuestion: string;
  workspaceRoot: string;
  workspaceId: string;
  extraction: StartupLogCrashExtraction;
  entrypointMapping: RuntimeEntrypointCrashMapping;
  classification: RuntimeCrashClassification;
  repairPlan: RuntimeCrashRepairPlan;
  crashDetected: boolean;
  connectedBuildProofLevel: string | null;
  recommendedFix: string;
  cacheKey: string;
}

export interface GeneratedRuntimeCrashDiagnosisAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'RUNTIME_CRASH_DIAGNOSIS_COMPLETE';
  report: GeneratedRuntimeCrashDiagnosisReport;
  cacheKey: string;
}

export interface AssessGeneratedRuntimeCrashDiagnosisInput {
  rootDir?: string;
  workspacePath?: string | null;
  workspaceId?: string | null;
  buildMaterializationReport?: ConnectedBuildExecutionReport | null;
  probe?: RuntimeStartupProbeResult | null;
  entrypoint?: RuntimeEntrypointCandidate | null;
  resolvedCommand?: ResolvedStartupCommand | null;
  skipHistoryRecording?: boolean;
}

export interface GeneratedRuntimeCrashDiagnosisHistoryEntry {
  readOnly: true;
  diagnosisId: string;
  generatedAt: string;
  crashClass: RuntimeCrashClass;
  crashDetected: boolean;
  workspaceId: string;
  cacheKey: string;
}
