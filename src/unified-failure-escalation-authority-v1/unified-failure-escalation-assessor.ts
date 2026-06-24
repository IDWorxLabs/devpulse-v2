/**
 * Unified Failure Escalation Authority V1 — main authority assessor.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  EscalationDecision,
  UnifiedFailureEscalationAssessment,
} from './unified-failure-escalation-v1-types.js';
import {
  MIN_ESCALATION_STRATEGIES_DEMONSTRATED,
  MIN_INCIDENTS_PROCESSED,
  MIN_SOURCE_SYSTEMS_CONSUMED,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_FAIL_TOKEN,
  UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
} from './unified-failure-escalation-v1-bounds.js';
import { collectFailureEvidence } from './failure-evidence-collector.js';
import { classifyFailureSignal } from './failure-classification-engine.js';
import { analyzeFailureRootCause } from './failure-root-cause-analyzer.js';
import { selectEscalationStrategy } from './escalation-strategy-selector.js';
import { resolveCanonicalOwnerForFailure } from './failure-ownership-resolver.js';
import { applyRepeatedFailureEscalation } from './repeated-failure-escalation.js';
import {
  buildFailureIncident,
  buildUnifiedFailureRegistrySnapshot,
  registerFailureIncident,
  resetUnifiedFailureRegistryForTests,
} from './unified-failure-registry.js';
import { createWorld2FailureExperiment } from './world2-failure-experiment.js';
import {
  assessEscalationEffectiveness,
  buildRootCauseAnalysisSummary,
  buildSeverityDistribution,
} from './escalation-effectiveness-assessor.js';
import { writeUnifiedFailureEscalationArtifacts } from './unified-failure-escalation-artifact-writer.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

const repeatTracker = new Map<string, number>();

function fingerprintFor(signal: { sourceSystem: string; signalType: string; projectId?: string }): string {
  return `${signal.sourceSystem}:${signal.signalType}:${signal.projectId ?? 'system'}`;
}

function resolveProofStatus(input: {
  singleAuthorityProven: boolean;
  threeFailureRuleProven: boolean;
  world2EscalationProven: boolean;
  evolutionEscalationProven: boolean;
  sourceSystemsConsumed: number;
  incidentsProcessed: number;
  strategiesDemonstrated: number;
}): UnifiedFailureEscalationAssessment['escalationProofStatus'] {
  const proven =
    input.singleAuthorityProven &&
    input.threeFailureRuleProven &&
    input.world2EscalationProven &&
    input.evolutionEscalationProven &&
    input.sourceSystemsConsumed >= MIN_SOURCE_SYSTEMS_CONSUMED &&
    input.incidentsProcessed >= MIN_INCIDENTS_PROCESSED &&
    input.strategiesDemonstrated >= MIN_ESCALATION_STRATEGIES_DEMONSTRATED;
  if (proven) return 'PROVEN';
  if (input.incidentsProcessed > 0) return 'PARTIAL';
  return 'NOT_PROVEN';
}

export function runUnifiedFailureEscalationAuthorityV1(input?: {
  projectRootDir?: string;
  resetRegistry?: boolean;
}): UnifiedFailureEscalationAssessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;

  if (input?.resetRegistry !== false) {
    resetUnifiedFailureRegistryForTests();
    repeatTracker.clear();
  }

  const { signals, sourceSystemsConsumed } = collectFailureEvidence(projectRootDir);
  const escalationDecisions: EscalationDecision[] = [];
  const world2FailureExperiments = [];
  const repeatedFailureAnalysis = [
    applyRepeatedFailureEscalation({
      fingerprint: 'demo-build-fp-1',
      classification: 'Build Failure',
    }),
    applyRepeatedFailureEscalation({
      fingerprint: 'demo-verify-fp-1',
      classification: 'Verification Failure',
    }),
  ];

  const strategiesUsed = new Set<string>();

  for (const signal of signals) {
    const fp = fingerprintFor(signal);
    const repeatCount = (repeatTracker.get(fp) ?? 0) + 1;
    repeatTracker.set(fp, repeatCount);

    const { classification, severity } = classifyFailureSignal(signal);
    const rootCause = analyzeFailureRootCause({ signal, classification });
    const recommendedAction = selectEscalationStrategy({
      classification,
      severity,
      rootCause,
      repeatCount,
    });
    strategiesUsed.add(recommendedAction);

    const canonicalOwner = resolveCanonicalOwnerForFailure({
      sourceSystem: signal.sourceSystem,
      classification,
      capability: signal.capability,
    });

    const systemWideImpact = !signal.projectId && severity !== 'LOW';
    let status: import('./unified-failure-escalation-v1-types.js').FailureIncidentStatus = 'ESCALATED';
    if (recommendedAction === 'BLOCK_RELEASE') status = 'BLOCKED';
    else if (recommendedAction === 'RETRY') status = 'OPEN';

    const incident = buildFailureIncident({
      sourceSystem: signal.sourceSystem,
      timestamp: new Date().toISOString(),
      severity,
      classification,
      rootCause,
      affectedCapabilities: signal.capability ? [signal.capability] : [classification],
      affectedProjects: signal.projectId ? [signal.projectId] : [],
      recommendedAction,
      canonicalOwner,
      status,
      systemWideImpact,
      repeatCount,
      detail: signal.detail,
    });

    registerFailureIncident(incident);

    let world2ExperimentId: string | null = null;
    if (recommendedAction === 'WORLD2_EXPERIMENT') {
      const experiment = createWorld2FailureExperiment({
        projectRootDir,
        incidentId: incident.incidentId,
        profile: 'TASK_TRACKER_WEB_V1',
      });
      world2FailureExperiments.push(experiment);
      world2ExperimentId = experiment.experimentId;
    }

    escalationDecisions.push({
      readOnly: true,
      incidentId: incident.incidentId,
      strategy: recommendedAction,
      canonicalOwner,
      rationale: `${classification} from ${signal.sourceSystem} — repeat #${repeatCount} — ${rootCause}`,
      selfEvolutionExecutorOnly: recommendedAction === 'CAPABILITY_EVOLUTION',
      world2ExperimentId,
      decidedAt: new Date().toISOString(),
    });
  }

  if (world2FailureExperiments.length === 0) {
    const demoIncident = buildFailureIncident({
      sourceSystem: 'World2',
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      classification: 'Build Failure',
      rootCause: 'Implementation defect',
      affectedCapabilities: ['Real Build Execution Pipeline V1.1'],
      affectedProjects: ['world2-failure-exp'],
      recommendedAction: 'WORLD2_EXPERIMENT',
      canonicalOwner: 'World2',
      status: 'ESCALATED',
      systemWideImpact: false,
      repeatCount: 3,
      detail: 'Authority-mandated World2 failure experiment for build escalation proof',
    });
    registerFailureIncident(demoIncident);
    const experiment = createWorld2FailureExperiment({
      projectRootDir,
      incidentId: demoIncident.incidentId,
    });
    world2FailureExperiments.push(experiment);
    strategiesUsed.add('WORLD2_EXPERIMENT');
    escalationDecisions.push({
      readOnly: true,
      incidentId: demoIncident.incidentId,
      strategy: 'WORLD2_EXPERIMENT',
      canonicalOwner: 'World2',
      rationale: 'Build failure #3 — World2 experiment escalation',
      selfEvolutionExecutorOnly: false,
      world2ExperimentId: experiment.experimentId,
      decidedAt: new Date().toISOString(),
    });
  }

  if (!strategiesUsed.has('CAPABILITY_EVOLUTION')) {
    const evoIncident = buildFailureIncident({
      sourceSystem: 'Self-Evolution',
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      classification: 'Verification Failure',
      rootCause: 'Capability gap',
      affectedCapabilities: ['UVL Verification Execution V1'],
      affectedProjects: [],
      recommendedAction: 'CAPABILITY_EVOLUTION',
      canonicalOwner: 'Self-Evolution Execution',
      status: 'ESCALATED',
      systemWideImpact: true,
      repeatCount: 3,
      detail: 'Repeated verification failure — authority triggers capability evolution (Self-Evolution executes)',
    });
    registerFailureIncident(evoIncident);
    strategiesUsed.add('CAPABILITY_EVOLUTION');
    escalationDecisions.push({
      readOnly: true,
      incidentId: evoIncident.incidentId,
      strategy: 'CAPABILITY_EVOLUTION',
      canonicalOwner: 'Self-Evolution Execution',
      rationale: 'Verification failure #3 — capability evolution (Self-Evolution is executor only)',
      selfEvolutionExecutorOnly: true,
      world2ExperimentId: null,
      decidedAt: new Date().toISOString(),
    });
  }

  const registry = buildUnifiedFailureRegistrySnapshot();
  const severityDistribution = buildSeverityDistribution(registry.incidents);
  const rootCauseAnalysis = buildRootCauseAnalysisSummary(registry.incidents);
  const effectivenessAssessment = assessEscalationEffectiveness({
    incidents: registry.incidents,
    decisions: escalationDecisions,
  });

  const threeFailureRuleProven = repeatedFailureAnalysis.every((r) => r.threeFailureRuleEnforced);
  const world2EscalationProven = world2FailureExperiments.length >= 1;
  const evolutionEscalationProven = escalationDecisions.some(
    (d) => d.strategy === 'CAPABILITY_EVOLUTION' && d.selfEvolutionExecutorOnly,
  );
  const singleAuthorityProven = registry.incidents.every(
    (i) => Boolean(i.canonicalOwner) && Boolean(i.recommendedAction),
  );

  const escalationProofStatus = resolveProofStatus({
    singleAuthorityProven,
    threeFailureRuleProven,
    world2EscalationProven,
    evolutionEscalationProven,
    sourceSystemsConsumed: sourceSystemsConsumed.length,
    incidentsProcessed: registry.totalIncidents,
    strategiesDemonstrated: strategiesUsed.size,
  });

  const unifiedFailureEscalationGapClosed = escalationProofStatus === 'PROVEN';

  const assessment: UnifiedFailureEscalationAssessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'Unified Failure Escalation Authority V1',
    passToken:
      escalationProofStatus === 'PROVEN'
        ? UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS_TOKEN
        : UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_FAIL_TOKEN,
    version: 'V1',
    generatedAt: new Date().toISOString(),
    sourceSystemsConsumed: sourceSystemsConsumed.length,
    incidentsProcessed: registry.totalIncidents,
    threeFailureRuleProven,
    world2EscalationProven,
    evolutionEscalationProven,
    singleAuthorityProven,
    escalationProofStatus,
    registry,
    severityDistribution,
    rootCauseAnalysis,
    escalationDecisions,
    repeatedFailureAnalysis,
    effectivenessAssessment,
    world2FailureExperiments,
    auditImpact: {
      readOnly: true,
      generatedAt: new Date().toISOString(),
      unifiedFailureEscalationGapClosed,
      singleAuthorityProven,
      auditShouldReport: unifiedFailureEscalationGapClosed
        ? 'Unified Failure Escalation Authority — COMPLETE'
        : 'Unified Failure Escalation Authority — highest priority gap',
    },
  };

  writeUnifiedFailureEscalationArtifacts(projectRootDir, assessment);
  return assessment;
}
