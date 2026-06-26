/**
 * Autonomous Debugging Engine — root cause analysis.
 */

import type { NormalizedFailure, RootCauseResult } from './autonomous-debugging-types.js';

let rootCauseCounter = 0;

export function resetRootCauseAnalyzerForTests(): void {
  rootCauseCounter = 0;
}

export function analyzeRootCause(failure: NormalizedFailure): RootCauseResult {
  rootCauseCounter += 1;

  const causeMap: Record<string, { summary: string; artifact: string; subsystem: RootCauseResult['responsibleSubsystem'] }> = {
    INTERACTION_FAILURE: {
      summary: 'Handler not bound to button',
      artifact: failure.affectedScope[0] ? `src/features/${failure.affectedScope[0]}` : 'src/features/unknown',
      subsystem: 'Generated UI',
    },
    DATA_FAILURE: {
      summary: 'Missing persistence mutation',
      artifact: 'src/features/expense-create/expense-create.service.ts',
      subsystem: 'Generated Data Layer',
    },
    DEVICE_FAILURE: {
      summary: 'Layout overflow or clipped control',
      artifact: 'src/features/expense-create/ExpenseCreateFeature.tsx',
      subsystem: 'Generated Styling',
    },
    ACCESSIBILITY_FAILURE: {
      summary: 'Input lacks accessible label',
      artifact: failure.affectedScope[0] ? `src/features/${failure.affectedScope[0]}` : 'src/features/settings',
      subsystem: 'Generated Accessibility',
    },
    BEHAVIOR_FAILURE: {
      summary: 'State update missing after action',
      artifact: 'src/features/core/state-owner.ts',
      subsystem: 'Generated State',
    },
    PROMPT_FAITHFULNESS_FAILURE: {
      summary: 'Prompt requirement omitted or drift detected',
      artifact: 'feature-contract.json',
      subsystem: 'Prompt Faithfulness',
    },
  };

  const mapped = causeMap[failure.category] ?? {
    summary: failure.evidence || 'Root cause under investigation',
    artifact: 'unknown',
    subsystem: 'Validation Runtime' as const,
  };

  return {
    readOnly: true,
    rootCauseId: `rc-${rootCauseCounter}`,
    failureId: failure.id,
    causeSummary: mapped.summary,
    confidence: failure.category === 'UNKNOWN_FAILURE' ? 'LOW' : 'HIGH',
    responsibleArtifact: mapped.artifact,
    responsibleSubsystem: mapped.subsystem,
    evidenceLinks: [failure.evidence, ...failure.repairHints],
    alternativeCauses: failure.category === 'INTERACTION_FAILURE' ? ['State update missing'] : [],
    risk: failure.severity === 'BLOCKING' ? 'HIGH' : 'MEDIUM',
  };
}
