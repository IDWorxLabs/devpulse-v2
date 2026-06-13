/**
 * Founder Simulation Engine — foundation types (V1).
 * Read-only founder journey simulation — no code generation or building.
 */

export type FounderSimulationScenarioType =
  | 'SIMPLE_APP'
  | 'COMPLEX_MARKETPLACE'
  | 'MOBILE_FIRST'
  | 'SAAS_DASHBOARD'
  | 'AI_POWERED'
  | 'E_COMMERCE'
  | 'INCOMPLETE_VAGUE'
  | 'CONFLICTING_EVIDENCE'
  | 'SCREENSHOT_SUPPORTED'
  | 'VOICE_NOTE_SUPPORTED';

export type FounderSimulationStageId =
  | 'UPLOAD_SYSTEM'
  | 'VISUAL_REFERENCE_INTELLIGENCE'
  | 'VOICE_NOTES_INTELLIGENCE'
  | 'REQUIREMENT_COMPLETENESS_INTELLIGENCE'
  | 'UNIFIED_INTAKE_INTELLIGENCE'
  | 'PLANNING_GATE_AUTHORITY'
  | 'PLANNING_BRIEF_GENERATOR'
  | 'ARCHITECTURE_BRIEF_GENERATOR'
  | 'BUILD_PLAN_GENERATOR'
  | 'FOUNDER_TEST_AUTOMATION'
  | 'FINAL_FOUNDER_READINESS_VERDICT';

export type FounderSimulationStageStatus = 'PASSED' | 'FAILED' | 'SKIPPED' | 'BLOCKED' | 'LOW_CONFIDENCE';

export type FounderSimulationFinalVerdict =
  | 'NOT_READY'
  | 'NEEDS_CLARIFICATION'
  | 'READY_FOR_PLANNING'
  | 'READY_FOR_ARCHITECTURE'
  | 'READY_FOR_BUILD_PLAN'
  | 'READY_FOR_EXECUTION_GATE';

export type FounderReadinessCategory =
  | 'NOT_READY'
  | 'NEEDS_CLARIFICATION'
  | 'READY_FOR_PLANNING'
  | 'READY_FOR_BUILD_PLAN'
  | 'READY_FOR_EXECUTION_GATE';

export interface FounderSimulationStageResult {
  readOnly: true;
  stageId: FounderSimulationStageId;
  status: FounderSimulationStageStatus;
  confidence: number | null;
  readiness: string | null;
  orchestrationState: string | null;
  failureReason: string | null;
  evidence: readonly string[];
}

export interface SimulationFailureItem {
  readOnly: true;
  failureId: string;
  failingModule: string;
  likelyCause: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedFix: string;
  blocksFounderLaunch: boolean;
  evidence: readonly string[];
}

export interface SystemIntegrationProof {
  readOnly: true;
  authoritiesReached: readonly string[];
  authoritiesPassed: readonly string[];
  authoritiesFailed: readonly string[];
  missingIntegrations: readonly string[];
  weakLinks: readonly string[];
  strongestEvidence: readonly string[];
  launchBlockers: readonly string[];
}

export interface FounderSimulationResult {
  readOnly: true;
  simulationId: string;
  scenarioName: string;
  scenarioType: FounderSimulationScenarioType;
  simulatedAt: string;
  stageResults: readonly FounderSimulationStageResult[];
  failedStages: readonly FounderSimulationStageId[];
  skippedStages: readonly FounderSimulationStageId[];
  readinessScore: number;
  readinessCategory: FounderReadinessCategory;
  finalVerdict: FounderSimulationFinalVerdict;
  founderFacingExplanation: string;
  systemIntegrationProof: SystemIntegrationProof;
  failureAnalysis: readonly SimulationFailureItem[];
  nextBestAction: string;
  alignmentImpact?: import('../intake-alignment-engine/intake-alignment-types.js').SimulationAlignmentImpact | null;
}

export interface FounderSimulationScenario {
  readOnly: true;
  scenarioId: string;
  scenarioName: string;
  scenarioType: FounderSimulationScenarioType;
  typedPrompt: string;
  structuredPrompt?: {
    screens?: readonly string[];
    userRoles?: readonly string[];
    workflows?: readonly string[];
    integrations?: readonly string[];
    platformTargets?: readonly string[];
    dataEntities?: readonly string[];
    businessRules?: readonly string[];
  };
  includeVisualUpload: boolean;
  includeVoiceUpload: boolean;
  voiceTranscript?: string;
  conflictingWebPrompt?: string;
  expectedMinVerdict?: FounderSimulationFinalVerdict;
  expectedMaxVerdict?: FounderSimulationFinalVerdict;
}

export interface FounderSimulationHistoryEntry {
  simulationId: string;
  timestamp: string;
  scenarioType: FounderSimulationScenarioType;
  readinessScore: number;
  finalVerdict: FounderSimulationFinalVerdict;
  failedStageCount: number;
}

export interface FounderSimulationEngineReport {
  readOnly: true;
  generatedAt: string;
  totalRuns: number;
  scenarioResults: readonly FounderSimulationResult[];
  aggregateReadinessScore: number;
  aggregateReadinessCategory: FounderReadinessCategory;
  systemIntegrationProof: SystemIntegrationProof;
  failedStagesSummary: readonly string[];
  launchBlockers: readonly string[];
  recommendations: readonly string[];
  nextBestAction: string;
  alignmentImpacts?: readonly import('../intake-alignment-engine/intake-alignment-types.js').SimulationAlignmentImpact[];
}

export interface RunFounderSimulationInput {
  scenarios?: readonly FounderSimulationScenario[];
  rootDir?: string;
  skipHistoryRecording?: boolean;
  applyAlignmentRepair?: boolean;
  progressLogger?: (message: string) => void;
}

export interface FounderSimulationRun {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'FOUNDER_SIMULATION_ENGINE_COMPLETE' | 'FOUNDER_SIMULATION_ENGINE_FAILED';
  results: readonly FounderSimulationResult[];
  report: FounderSimulationEngineReport | null;
  failureReason: string | null;
}

export interface FounderSimulationChainContext {
  readOnly: true;
  uploadId: string | null;
  visualAnalysis: import('../visual-reference-intelligence/visual-reference-types.js').VisualReferenceAnalysis | null;
  voiceAnalysis: import('../voice-notes-intelligence/voice-notes-types.js').VoiceNotesAnalysis | null;
  completenessAnalysis: import('../requirement-completeness-intelligence/requirement-completeness-types.js').RequirementCompletenessAnalysis | null;
  unifiedIntakeAnalysis: import('../unified-intake-intelligence/unified-intake-types.js').UnifiedIntakeAnalysis | null;
  planningGateAnalysis: import('../planning-gate-authority/planning-gate-types.js').PlanningGateAnalysis | null;
  planningBrief: import('../planning-brief-generator/planning-brief-types.js').PlanningBrief | null;
  architectureBrief: import('../architecture-brief-generator/architecture-brief-types.js').ArchitectureBrief | null;
  buildPlan: import('../build-plan-generator/build-plan-types.js').BuildPlan | null;
  founderTestAnalysis: import('../founder-test-automation/founder-test-automation-types.js').FounderTestAutomationAnalysis | null;
  intakeAlignmentAnalysis: import('../intake-alignment-engine/intake-alignment-types.js').IntakeAlignmentAnalysis | null;
  alignmentRepairApplied: boolean;
  unifiedIntakeAnalysisBeforeRepair: import('../unified-intake-intelligence/unified-intake-types.js').UnifiedIntakeAnalysis | null;
}
