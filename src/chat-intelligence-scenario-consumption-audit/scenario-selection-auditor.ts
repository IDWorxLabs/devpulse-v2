/**
 * Phase 26.95 — Scenario selection auditor.
 */

import type { CapabilityAnswerScenarioId } from '../chat-capability-answer-quality/chat-capability-answer-quality-types.js';
import type { ChatCapabilityAnswerQualityAssessment } from '../chat-capability-answer-quality/chat-capability-answer-quality-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { ChatScenarioPipelineTrace } from './chat-intelligence-scenario-consumption-types.js';

export function auditScenarioSelection(
  traces: ChatScenarioPipelineTrace[],
  input: {
    capabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment | null;
    chatStressSimulation?: ChatStressSimulationReport | null;
  },
): ChatScenarioPipelineTrace[] {
  const selectedCapabilityIds = new Set(
    input.capabilityAnswerQuality?.report.audits.map((a) => a.scenarioId) ?? [],
  );
  const selectedStressIds = new Set(
    input.chatStressSimulation?.evaluations.map((r) => r.scenarioId) ?? [],
  );

  return traces.map((trace) => {
    if (trace.source === 'CHAT_CAPABILITY_ANSWER_QUALITY') {
      const selected = selectedCapabilityIds.has(trace.scenarioId as CapabilityAnswerScenarioId);
      return {
        ...trace,
        selected,
        failureClass: selected ? trace.failureClass : (trace.failureClass ?? 'SCENARIO_NOT_SELECTED'),
        detail: selected
          ? `${trace.detail}; selected for capability answer quality audit`
          : `${trace.detail}; not selected in capability answer quality run`,
      };
    }

    if (trace.source === 'CHAT_STRESS_SIMULATION' || trace.scenarioId.startsWith('identity-') || trace.scenarioId.startsWith('cap-')) {
      const stressId = trace.scenarioId;
      const selected = selectedStressIds.has(stressId);
      if (selected) {
        return {
          ...trace,
          selected: true,
          detail: `${trace.detail}; selected in chat stress simulation`,
        };
      }
    }

    return trace;
  });
}

export function countSelectedScenarios(traces: ChatScenarioPipelineTrace[]): number {
  return traces.filter((t) => t.selected).length;
}
