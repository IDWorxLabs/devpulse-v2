/**
 * Blueprint Purity V1 — execution trace runtime evidence events.
 */

import type { ExecutionTraceEvent } from '../execution-trace/execution-trace-types.js';
import type { BlueprintPurityEvidence } from './blueprint-purity-types.js';

const TRACE_STAGES = [
  { title: 'Blueprint purity scan started', component: 'blueprint_purity', when: () => true },
  { title: 'Blueprint source files scanned', component: 'blueprint_purity', when: (e: BlueprintPurityEvidence) => e.blueprintPurityCheckedFiles.length > 0 },
  { title: 'Domain leakage check completed', component: 'blueprint_purity', when: (e: BlueprintPurityEvidence) => e.blueprintPurityViolationCount >= 0 },
  { title: 'Generated shell purity verified', component: 'blueprint_purity', when: (e: BlueprintPurityEvidence) => e.shellPurityVerified },
  { title: 'Domain language source boundary verified', component: 'blueprint_purity', when: (e: BlueprintPurityEvidence) => e.domainLanguageBoundaryVerified },
  {
    title: 'Blueprint purity passed',
    component: 'blueprint_purity',
    when: (e: BlueprintPurityEvidence) => e.blueprintPurityStatus === 'PASS',
  },
  {
    title: 'Blueprint purity failed',
    component: 'blueprint_purity',
    when: (e: BlueprintPurityEvidence) => e.blueprintPurityStatus === 'FAIL',
  },
] as const;

export function buildBlueprintPurityTraceEvents(
  evidence: BlueprintPurityEvidence,
  buildId: string,
): ExecutionTraceEvent[] {
  const ts = Date.parse(evidence.scannedAt) || Date.now();
  let step = 0;

  return TRACE_STAGES.filter((stage) => stage.when(evidence)).map((stage) => {
    step += 1;
    const failed = evidence.blueprintPurityStatus === 'FAIL';
    return {
      eventId: `${buildId}-purity-trace-${step}`,
      timestamp: ts + step,
      runtimeStage: 'Validation',
      component: stage.component,
      severity: stage.title.includes('failed') ? 'ERROR' : 'INFO',
      eventTitle: stage.title,
      technicalDetail:
        failed && stage.title.includes('failed')
          ? evidence.blueprintPurityFailureReasons.join('; ').slice(0, 240)
          : `${evidence.blueprintPurityCheckedFiles.length} files scanned — ${evidence.blueprintPurityViolationCount} violations`,
      status: stage.title.includes('failed') ? 'FAIL' : 'PASS',
      metadata: {
        milestone: true,
        category: 'runtime',
        blueprintPurity: true,
        violationCount: evidence.blueprintPurityViolationCount,
      },
      informationalOnly: true,
      section: 'Validation',
      action: stage.title,
      detail: stage.title,
      stepIndex: step,
      stepTotal: TRACE_STAGES.length,
    };
  });
}

export function blueprintPurityTraceTitles(): string[] {
  return TRACE_STAGES.map((stage) => stage.title);
}
