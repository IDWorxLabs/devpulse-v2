/**
 * Phase 26.95 — Scenario execution auditor.
 */

import type {
  CapabilityAnswerScenarioId,
  ChatCapabilityAnswerQualityAssessment,
} from '../chat-capability-answer-quality/chat-capability-answer-quality-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { ChatScenarioPipelineTrace } from './chat-intelligence-scenario-consumption-types.js';

export function auditScenarioExecution(
  traces: ChatScenarioPipelineTrace[],
  input: {
    capabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment | null;
    chatStressSimulation?: ChatStressSimulationReport | null;
  },
): ChatScenarioPipelineTrace[] {
  const executedCapability = new Map(
    (input.capabilityAnswerQuality?.report.audits ?? []).map((a) => [a.scenarioId, a]),
  );
  const executedStress = new Map(
    (input.chatStressSimulation?.evaluations ?? []).map((r) => [r.scenarioId, r]),
  );

  return traces.map((trace) => {
    if (trace.source === 'CHAT_CAPABILITY_ANSWER_QUALITY') {
      const audit = executedCapability.get(trace.scenarioId as CapabilityAnswerScenarioId);
      const executed = Boolean(audit?.answer);
      return {
        ...trace,
        executed,
        failureClass: executed ? trace.failureClass : (trace.failureClass ?? 'SCENARIO_NOT_EXECUTED'),
        detail: executed
          ? `${trace.detail}; executed with response preview`
          : `${trace.detail}; no execution evidence`,
      };
    }

    const stressAudit = executedStress.get(trace.scenarioId);
    if (stressAudit) {
      return {
        ...trace,
        executed: true,
        detail: `${trace.detail}; executed via chat stress (band ${stressAudit.band})`,
      };
    }

    return trace;
  });
}

export function countExecutedScenarios(traces: ChatScenarioPipelineTrace[]): number {
  return traces.filter((t) => t.executed).length;
}
