/**
 * Universal Production Proof V1 — evidence types.
 */

import type { GeneratedAppProfile } from '../code-generation-engine/code-generation-engine-types.js';
import type { MaterializationProfile } from '../universal-prompt-to-app-materialization/profile-feature-map.js';

export const UNIVERSAL_PRODUCTION_PROOF_V1_PASS_TOKEN = 'UNIVERSAL_PRODUCTION_PROOF_V1_PASS';

export const UNIVERSAL_PRODUCTION_PROOF_DIR = '.universal-production-proof';
export const UNIVERSAL_PRODUCTION_PROOF_FILENAME = 'universal-production-proof.json';
export const UNIVERSAL_PRODUCTION_PROOF_REPORT_MD = 'universal-production-proof-report.md';
export const UNIVERSAL_PRODUCTION_PROOF_PROFILE_RESULTS_DIR = 'profile-results';

export type UniversalProductionProofStageStatus = 'PASS' | 'FAIL' | 'WARN' | 'SKIP';

export type UniversalProductionOverallVerdict =
  | 'UNIVERSAL_PRODUCTION_READY'
  | 'UNIVERSAL_PRODUCTION_READY_WITH_WARNINGS'
  | 'NOT_UNIVERSALLY_PRODUCTION_READY';

export type UniversalProductionProofProfileVerdict = 'PASS' | 'WARN' | 'FAIL';

export interface UniversalProductionProofProfileScenario {
  readOnly: true;
  id: string;
  profile: GeneratedAppProfile | MaterializationProfile;
  prompt: string;
}

export const SUPPORTED_UNIVERSAL_PRODUCTION_PROFILES: UniversalProductionProofProfileScenario[] = [
  {
    readOnly: true,
    id: 'expense-tracker',
    profile: 'EXPENSE_TRACKER_WEB_V1',
    prompt:
      'Build ExpenseTracker with expenses, income, categories, reports, charts, and CSV export.',
  },
  {
    readOnly: true,
    id: 'finance-tracker',
    profile: 'FINANCE_TRACKER_WEB_V1',
    prompt:
      'Build FinPulse finance tracker with transactions, accounts, budgets, categories, reports, charts, and CSV export.',
  },
  {
    readOnly: true,
    id: 'crm',
    profile: 'CRM_WEB_V1',
    prompt: 'Build a CRM for customers, leads, pipeline, deals, contacts, and follow-ups.',
  },
  {
    readOnly: true,
    id: 'task-tracker',
    profile: 'TASK_TRACKER_WEB_V1',
    prompt:
      'Build a task tracker web app with tasks, projects, labels, calendar, reports, and settings.',
  },
  {
    readOnly: true,
    id: 'project-management',
    profile: 'PROJECT_MANAGEMENT_WEB_V1',
    prompt: 'Build a project management app with projects, tasks, team, timeline, and reports.',
  },
  {
    readOnly: true,
    id: 'qr-app',
    profile: 'QR_APP',
    prompt: 'Build a QR app with generator, scanner, code history, analytics, and settings.',
  },
  {
    readOnly: true,
    id: 'inventory',
    profile: 'INVENTORY_WEB_V1',
    prompt: 'Build inventory management with products, stock, suppliers, reorder, and reports.',
  },
  {
    readOnly: true,
    id: 'booking',
    profile: 'BOOKING_WEB_V1',
    prompt: 'Build a booking app with appointments, calendar, customers, availability, and reports.',
  },
  {
    readOnly: true,
    id: 'habit-tracker',
    profile: 'HABIT_TRACKER_WEB_V1',
    prompt: 'Build a habit tracker with habits, streaks, routines, goals, and analytics.',
  },
  {
    readOnly: true,
    id: 'generic-custom',
    profile: 'GENERIC_CUSTOM_APP_V1',
    prompt: 'Build a custom notes and records workspace app with dashboard and settings.',
  },
];

export interface UniversalProductionProofChainStage {
  readOnly: true;
  id: string;
  label: string;
  status: UniversalProductionProofStageStatus;
  detail: string;
}

export interface UniversalProductionProofProfileLinks {
  readOnly: true;
  workspacePath: string | null;
  persistentProjectPath: string | null;
  manifestPath: string | null;
  buildHistoryRecordPath: string | null;
  productionValidationArtifactPath: string | null;
  qualityScoreArtifactPath: string | null;
  featureContractRealityArtifactPath: string | null;
  workspaceRealityAuditArtifactPath: string | null;
  executionTraceEvidencePath: string | null;
  chatEvidenceSummaryPath: string | null;
}

export interface UniversalProductionProofMatrixRow {
  readOnly: true;
  profile: string;
  classify: UniversalProductionProofStageStatus;
  generate: UniversalProductionProofStageStatus;
  modular: UniversalProductionProofStageStatus;
  build: UniversalProductionProofStageStatus;
  preview: UniversalProductionProofStageStatus;
  blueprint: UniversalProductionProofStageStatus;
  prodVal: UniversalProductionProofStageStatus;
  history: UniversalProductionProofStageStatus;
  persist: UniversalProductionProofStageStatus;
  score: string;
  featureReality: UniversalProductionProofStageStatus;
  workspaceAudit: UniversalProductionProofStageStatus;
  exportReady: UniversalProductionProofStageStatus;
  chat: UniversalProductionProofStageStatus;
  trace: UniversalProductionProofStageStatus;
  verdict: UniversalProductionProofProfileVerdict;
}

export interface UniversalProductionProofProfileResult {
  readOnly: true;
  profile: string;
  scenarioId: string;
  prompt: string;
  projectId: string;
  buildRunId: string;
  profileVerdict: UniversalProductionProofProfileVerdict;
  qualityScore: number;
  launchReadinessScore: number;
  chainStages: UniversalProductionProofChainStage[];
  matrixRow: UniversalProductionProofMatrixRow;
  links: UniversalProductionProofProfileLinks;
  failureReasons: string[];
  warnings: string[];
  recordedAt: string;
}

export interface UniversalProductionProofReport {
  readOnly: true;
  runId: string;
  overallVerdict: UniversalProductionOverallVerdict;
  profileCount: number;
  passedProfiles: number;
  warnedProfiles: number;
  failedProfiles: number;
  matrix: UniversalProductionProofMatrixRow[];
  profileResults: UniversalProductionProofProfileResult[];
  allowedWarnings: string[];
  failureReasons: string[];
  artifactPath: string;
  reportPath: string;
  chatSummary: string;
  recordedAt: string;
}

export interface UniversalProductionProofEvidence {
  readOnly: true;
  universalProductionProofRunId: string;
  universalProductionProofStatus: UniversalProductionOverallVerdict;
  universalProductionProofArtifactPath: string;
  universalProductionProofReportPath: string;
  universalProductionProofRecordedAt: string;
  report: UniversalProductionProofReport;
}
