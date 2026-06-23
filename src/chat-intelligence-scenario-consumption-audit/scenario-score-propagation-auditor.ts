/**
 * Phase 26.95 — Scenario score propagation auditor.
 */

import { CHAT_CAPABILITY_ANSWER_QUALITY_PASS } from '../chat-capability-answer-quality/chat-capability-answer-quality-registry.js';
import type {
  CapabilityAnswerScenarioId,
  ChatCapabilityAnswerQualityAssessment,
} from '../chat-capability-answer-quality/chat-capability-answer-quality-types.js';
import type { ChatIntelligenceRealityAssessment } from '../chat-intelligence-reality/chat-intelligence-reality-types.js';
import type { ChatStressSimulationReport } from '../founder-test-chat-stress-simulation/chat-stress-simulation-types.js';
import type { ChatScenarioPipelineTrace } from './chat-intelligence-scenario-consumption-types.js';

export function auditScenarioScoring(
  traces: ChatScenarioPipelineTrace[],
  input: {
    capabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment | null;
    chatStressSimulation?: ChatStressSimulationReport | null;
  },
): ChatScenarioPipelineTrace[] {
  const capabilityAudits = new Map(
    (input.capabilityAnswerQuality?.report.audits ?? []).map((a) => [a.scenarioId, a]),
  );
  const stressEvaluations = new Map(
    (input.chatStressSimulation?.evaluations ?? []).map((r) => [r.scenarioId, r]),
  );

  return traces.map((trace) => {
    if (trace.source === 'CHAT_CAPABILITY_ANSWER_QUALITY') {
      const audit = capabilityAudits.get(trace.scenarioId as CapabilityAnswerScenarioId);
      const scored = Boolean(audit);
      const score = audit?.scores.overallCapabilityAnswerScore ?? null;
      return {
        ...trace,
        scored,
        score,
        failureClass: scored ? trace.failureClass : (trace.failureClass ?? 'RESULT_NOT_SCORED'),
        detail: scored
          ? `${trace.detail}; scored ${score}/100 (passed=${audit!.passed})`
          : `${trace.detail}; not scored`,
      };
    }

    const stress = stressEvaluations.get(trace.scenarioId);
    if (stress) {
      return {
        ...trace,
        scored: true,
        score: stress.score,
        detail: `${trace.detail}; stress score ${stress.score}/100`,
      };
    }

    return trace;
  });
}

export function auditScenarioScorePropagation(
  traces: ChatScenarioPipelineTrace[],
  derived: ChatIntelligenceRealityAssessment,
  input: {
    capabilityAnswerQuality?: ChatCapabilityAnswerQualityAssessment | null;
    chatStressSimulation?: ChatStressSimulationReport | null;
  },
): ChatScenarioPipelineTrace[] {
  const capabilityPass =
    input.capabilityAnswerQuality?.report.passToken === CHAT_CAPABILITY_ANSWER_QUALITY_PASS;
  const capabilityScore = input.capabilityAnswerQuality?.report.averageScore ?? null;
  const stressScore = input.chatStressSimulation?.overallScore ?? null;
  const derivedScore = derived.chatIntelligenceScore;
  const derivedRun = derived.scenariosRun;

  const propagated =
    derivedRun > 0 &&
    derivedScore > 0 &&
    (derivedScore === capabilityScore ||
      derivedScore === stressScore ||
      derived.operationalSelfAwarenessStandard.includes('capability-answer-quality') ||
      derived.operationalSelfAwarenessStandard.includes('chat-stress'));

  const scoreDropped =
    (capabilityPass && capabilityScore !== null && capabilityScore >= 85 && derivedScore === 0) ||
    (stressScore !== null && stressScore >= 85 && derivedScore === 0);

  return traces.map((trace) => {
    if (!trace.scored) return trace;

    const tracePropagated = propagated && derivedRun > 0;
    let failureClass = trace.failureClass;
    if (!tracePropagated && trace.scored) {
      failureClass = failureClass ?? 'RESULT_NOT_PROPAGATED';
    }
    if (scoreDropped) {
      failureClass = 'CHAT_SCORE_DROPPED';
    }

    return {
      ...trace,
      propagated: tracePropagated,
      consumedByFounderTest: tracePropagated,
      renderedInReport: tracePropagated,
      failureClass,
      detail: tracePropagated
        ? `${trace.detail}; propagated to Founder Test (${derivedScore}/100, ${derived.scenariosPassed}/${derivedRun})`
        : `${trace.detail}; not propagated (derived ${derivedScore}/100, ${derivedRun} run)`,
    };
  });
}

export function countScoredScenarios(traces: ChatScenarioPipelineTrace[]): number {
  return traces.filter((t) => t.scored).length;
}

export function countPropagatedScenarios(traces: ChatScenarioPipelineTrace[]): number {
  return traces.filter((t) => t.propagated).length;
}
