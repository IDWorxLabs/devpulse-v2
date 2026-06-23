/**
 * Phase 26.95 — Chat Intelligence Scenario Consumption types (V1).
 */

import type { ChatCapabilityAnswerQualityAssessment } from '../chat-capability-answer-quality/chat-capability-answer-quality-types.js';
import type { ChatIntelligenceRealityAssessment } from '../chat-intelligence-reality/chat-intelligence-reality-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';

export type ChatScenarioPipelineStage =
  | 'REGISTRATION'
  | 'DISCOVERY'
  | 'SELECTION'
  | 'EXECUTION'
  | 'RESULT_CAPTURE'
  | 'SCORING'
  | 'PROPAGATION'
  | 'FOUNDER_TEST_CONSUMPTION'
  | 'REPORT_RENDER';

export type ChatScenarioPipelineFailureClass =
  | 'SCENARIO_NOT_REGISTERED'
  | 'SCENARIO_NOT_DISCOVERED'
  | 'SCENARIO_NOT_SELECTED'
  | 'SCENARIO_NOT_EXECUTED'
  | 'RESULT_NOT_CAPTURED'
  | 'RESULT_NOT_SCORED'
  | 'RESULT_NOT_PROPAGATED'
  | 'CHAT_SCORE_DROPPED'
  | 'FOUNDER_TEST_CONSUMPTION_FAILURE'
  | 'REPORT_RENDER_FAILURE'
  | 'UNKNOWN_CHAT_PIPELINE_FAILURE';

export type ChatScenarioSourceId =
  | 'CHAT_INTELLIGENCE_REALITY'
  | 'CHAT_CAPABILITY_ANSWER_QUALITY'
  | 'CHAT_STRESS_SIMULATION';

export interface ChatScenarioPipelineTrace {
  readOnly: true;
  scenarioId: string;
  prompt: string;
  source: ChatScenarioSourceId;
  registered: boolean;
  discovered: boolean;
  selected: boolean;
  executed: boolean;
  resultCaptured: boolean;
  scored: boolean;
  score: number | null;
  propagated: boolean;
  consumedByFounderTest: boolean;
  renderedInReport: boolean;
  failureClass: ChatScenarioPipelineFailureClass | null;
  detail: string;
}

export interface ChatIntelligenceScenarioConsumptionReport {
  readOnly: true;
  auditId: string;
  generatedAt: string;
  coreQuestion: string;
  traces: ChatScenarioPipelineTrace[];
  registeredScenarioCount: number;
  discoveredScenarioCount: number;
  executedScenarioCount: number;
  scoredScenarioCount: number;
  propagatedScenarioCount: number;
  founderTestConsumed: boolean;
  chatIntelligenceScore: number;
  scenariosRun: number;
  scenariosPassed: number;
  capabilityAnswerQualityPass: boolean;
  capabilityAnswerQualityScore: number | null;
  chatStressAvailable: boolean;
  chatStressScore: number | null;
  contradictionDetected: boolean;
  contradictionDetail: string | null;
  passToken: string | null;
}

export interface ChatIntelligenceScenarioConsumptionAssessment {
  readOnly: true;
  advisoryOnly: true;
  orchestrationState: 'CHAT_INTELLIGENCE_SCENARIO_CONSUMPTION_COMPLETE';
  report: ChatIntelligenceScenarioConsumptionReport;
  derivedChatIntelligence: ChatIntelligenceRealityAssessment;
  cacheKey: string;
}

export interface AssessChatIntelligenceScenarioConsumptionInput {
  rootDir?: string;
  chatStressSimulation?: ChatStressSimulationReport | null;
  chatCapabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment | null;
  chatIntelligenceReality?: ChatIntelligenceRealityAssessment | null;
  skipHistoryRecording?: boolean;
}

export interface DeriveChatIntelligenceFromSourcesInput {
  rootDir?: string;
  chatStressSimulation?: ChatStressSimulationReport | null;
  chatCapabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment | null;
  chatIntelligenceReality?: ChatIntelligenceRealityAssessment | null;
}
