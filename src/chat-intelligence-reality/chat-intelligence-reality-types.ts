/**
 * Chat Intelligence Reality — assessment types.
 */

export type ChatIntelligenceFailureCategory =
  | 'GENERIC_ONBOARDING'
  | 'UNANSWERED_QUESTION'
  | 'FAKE_CONFIDENCE'
  | 'WEAK_PURPOSE'
  | 'DISCONNECTED_CONTEXT'
  | 'MISSING_SELF_DIAGNOSIS'
  | 'HALLUCINATED_READINESS'
  | 'PRETEND_SMART';

export type ChatIntelligenceMissingCapability =
  | 'PROMPT'
  | 'ROUTING'
  | 'CONTEXT'
  | 'BRAIN_CONNECTION'
  | 'MEMORY'
  | 'PROJECT_STATE'
  | 'VALIDATOR_COVERAGE'
  | 'RESPONSE_POLICY';

export type ChatLaunchVerdict = 'LAUNCH_BLOCKED' | 'NEEDS_IMPROVEMENT' | 'OPERATIONAL_OK';

export interface ChatIntelligenceCriteria {
  answered_question: boolean;
  avoided_generic_onboarding: boolean;
  purpose_awareness: boolean;
  honesty: boolean;
  useful_next_step: boolean;
  no_fake_claims: boolean;
  self_diagnosis_present: boolean;
  launch_readiness_signal: boolean;
}

export interface ChatIntelligenceScenarioDefinition {
  id: string;
  prompt: string;
  category: ChatIntelligenceFailureCategory;
  criticalForLaunch: boolean;
}

export interface ChatIntelligenceScenarioResult {
  id: string;
  prompt: string;
  passed: boolean;
  score: number;
  criteria: ChatIntelligenceCriteria;
  failureCategories: ChatIntelligenceFailureCategory[];
  whyFailed: string[];
  responsePreview: string;
}

export interface ChatSelfEvolutionImprovementStep {
  priority: 'HIGH' | 'MEDIUM';
  missingCapability: ChatIntelligenceMissingCapability;
  action: string;
  rationale: string;
}

export interface ChatSelfEvolutionTriggerResult {
  triggered: boolean;
  repeatedCategory: ChatIntelligenceFailureCategory | null;
  failureCountInCategory: number;
  stopRepeatingFixPath: boolean;
  missingCapabilities: ChatIntelligenceMissingCapability[];
  improvementPlan: ChatSelfEvolutionImprovementStep[];
  launchBlocked: boolean;
  advisoryOnly: true;
}

export interface ChatIntelligenceRealityAssessment {
  readOnly: true;
  chatIntelligenceScore: number;
  chatLaunchVerdict: ChatLaunchVerdict;
  blocksLaunchReadiness: boolean;
  scenariosRun: number;
  scenariosPassed: number;
  failedScenarios: ChatIntelligenceScenarioResult[];
  scenarioResults: ChatIntelligenceScenarioResult[];
  requiredFixesBeforeLaunch: string[];
  founderProofNotes: readonly string[];
  selfEvolution: ChatSelfEvolutionTriggerResult;
  operationalSelfAwarenessStandard: string;
  cacheKey: string;
}

export interface AssessChatIntelligenceRealityInput {
  deadlineMs?: number;
  responseProvider?: (prompt: string) => string;
}

export interface ChatIntelligenceVisibilityScore {
  score: number;
  chatLaunchVerdict: ChatLaunchVerdict;
  blocksLaunchReadiness: boolean;
  scenariosPassed: number;
  scenariosRun: number;
  failedScenarioCount: number;
  requiredFixesBeforeLaunch: string[];
  selfEvolutionTriggered: boolean;
}
