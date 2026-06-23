/**
 * Phase 26.95 — Scenario result capture auditor.
 */

import type {
  CapabilityAnswerScenarioId,
  ChatCapabilityAnswerQualityAssessment,
} from '../chat-capability-answer-quality/chat-capability-answer-quality-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { ChatScenarioPipelineTrace } from './chat-intelligence-scenario-consumption-types.js';

export function auditScenarioResultCapture(
  traces: ChatScenarioPipelineTrace[],
  input: {
    capabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment | null;
    chatStressSimulation?: ChatStressSimulationReport | null;
  },
): ChatScenarioPipelineTrace[] {
  const capabilityAudits = new Map(
    (input.capabilityAnswerQuality?.report.audits ?? []).map((a) => [a.scenarioId, a]),
  );
  const stressResults = new Map(
    (input.chatStressSimulation?.evaluations ?? []).map((r) => [r.scenarioId, r]),
  );

  return traces.map((trace) => {
    if (trace.source === 'CHAT_CAPABILITY_ANSWER_QUALITY') {
      const audit = capabilityAudits.get(trace.scenarioId as CapabilityAnswerScenarioId);
      const resultCaptured = Boolean(
        audit && audit.scores.overallCapabilityAnswerScore >= 0 && audit.answer.length > 0,
      );
      return {
        ...trace,
        resultCaptured,
        failureClass: resultCaptured ? trace.failureClass : (trace.failureClass ?? 'RESULT_NOT_CAPTURED'),
        detail: resultCaptured
          ? `${trace.detail}; result captured (score ${audit!.scores.overallCapabilityAnswerScore})`
          : `${trace.detail}; result not captured`,
      };
    }

    const stress = stressResults.get(trace.scenarioId);
    if (stress) {
      return {
        ...trace,
        resultCaptured: true,
        detail: `${trace.detail}; stress result captured (score ${stress.score})`,
      };
    }

    return trace;
  });
}

export function countResultCapturedScenarios(traces: ChatScenarioPipelineTrace[]): number {
  return traces.filter((t) => t.resultCaptured).length;
}
