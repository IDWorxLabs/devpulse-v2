/**
 * Phase 26.95 — Scenario registration auditor.
 */

import { CAPABILITY_ANSWER_SCENARIOS } from '../chat-capability-answer-quality/chat-capability-answer-quality-registry.js';
import { CHAT_INTELLIGENCE_SCENARIOS } from '../chat-intelligence-reality/chat-intelligence-scenarios.js';
import { CHAT_STRESS_SCENARIO_REGISTRY } from '../founder-test-chat-stress-simulation/chat-stress-scenario-registry.js';
import type { ChatScenarioPipelineTrace } from './chat-intelligence-scenario-consumption-types.js';

export interface RegistrationAuditResult {
  registeredIds: string[];
  traces: ChatScenarioPipelineTrace[];
}

export function auditScenarioRegistration(): RegistrationAuditResult {
  const traces: ChatScenarioPipelineTrace[] = [];
  const registeredIds: string[] = [];

  for (const scenario of CAPABILITY_ANSWER_SCENARIOS) {
    registeredIds.push(scenario.id);
    traces.push({
      readOnly: true,
      scenarioId: scenario.id,
      prompt: scenario.prompt,
      source: 'CHAT_CAPABILITY_ANSWER_QUALITY',
      registered: true,
      discovered: false,
      selected: false,
      executed: false,
      resultCaptured: false,
      scored: false,
      score: null,
      propagated: false,
      consumedByFounderTest: false,
      renderedInReport: false,
      failureClass: null,
      detail: `Registered in CAPABILITY_ANSWER_SCENARIOS (stress link: ${scenario.stressScenarioId})`,
    });
  }

  for (const scenario of CHAT_INTELLIGENCE_SCENARIOS) {
    if (registeredIds.includes(scenario.id)) continue;
    registeredIds.push(scenario.id);
    traces.push({
      readOnly: true,
      scenarioId: scenario.id,
      prompt: scenario.prompt,
      source: 'CHAT_INTELLIGENCE_REALITY',
      registered: true,
      discovered: false,
      selected: false,
      executed: false,
      resultCaptured: false,
      scored: false,
      score: null,
      propagated: false,
      consumedByFounderTest: false,
      renderedInReport: false,
      failureClass: null,
      detail: `Registered in CHAT_INTELLIGENCE_SCENARIOS (${scenario.category})`,
    });
  }

  const stressLinked = new Set(
    CAPABILITY_ANSWER_SCENARIOS.map((s) => s.stressScenarioId),
  );
  for (const stressId of stressLinked) {
    const stressScenario = CHAT_STRESS_SCENARIO_REGISTRY.find((s) => s.id === stressId);
    if (!stressScenario) {
      traces.push({
        readOnly: true,
        scenarioId: stressId,
        prompt: '(missing stress scenario)',
        source: 'CHAT_STRESS_SIMULATION',
        registered: false,
        discovered: false,
        selected: false,
        executed: false,
        resultCaptured: false,
        scored: false,
        score: null,
        propagated: false,
        consumedByFounderTest: false,
        renderedInReport: false,
        failureClass: 'SCENARIO_NOT_REGISTERED',
        detail: `Capability scenario links to missing stress id ${stressId}`,
      });
    }
  }

  return { registeredIds, traces };
}

export function countRegisteredScenarios(): number {
  return auditScenarioRegistration().registeredIds.length;
}
