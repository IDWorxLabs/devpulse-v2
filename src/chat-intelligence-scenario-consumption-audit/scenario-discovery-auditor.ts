/**
 * Phase 26.95 — Scenario discovery auditor.
 */

import { matchCapabilityAnswerScenario } from '../chat-capability-answer-quality/answer-repair-planner.js';
import { CAPABILITY_ANSWER_SCENARIOS } from '../chat-capability-answer-quality/chat-capability-answer-quality-registry.js';
import type { ChatScenarioPipelineTrace } from './chat-intelligence-scenario-consumption-types.js';

export function auditScenarioDiscovery(
  traces: ChatScenarioPipelineTrace[],
): ChatScenarioPipelineTrace[] {
  return traces.map((trace) => {
    if (trace.source !== 'CHAT_CAPABILITY_ANSWER_QUALITY') return trace;

    const scenario = CAPABILITY_ANSWER_SCENARIOS.find((s) => s.id === trace.scenarioId);
    if (!scenario) {
      return {
        ...trace,
        discovered: false,
        failureClass: trace.failureClass ?? 'SCENARIO_NOT_DISCOVERED',
        detail: `${trace.detail}; discovery failed — scenario definition missing`,
      };
    }

    const matched = matchCapabilityAnswerScenario(scenario.prompt);
    const discovered = matched === scenario.id;

    return {
      ...trace,
      discovered,
      failureClass: discovered ? trace.failureClass : (trace.failureClass ?? 'SCENARIO_NOT_DISCOVERED'),
      detail: discovered
        ? `${trace.detail}; discovered via matchCapabilityAnswerScenario`
        : `${trace.detail}; matchCapabilityAnswerScenario returned ${matched ?? 'null'}`,
    };
  });
}

export function countDiscoveredScenarios(traces: ChatScenarioPipelineTrace[]): number {
  return traces.filter((t) => t.discovered).length;
}
