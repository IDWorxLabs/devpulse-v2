/**
 * Recovery Root Cause Engine — classify engineering failures before recovery.
 */

import type {
  RootCauseAnalysis,
  RootCauseAnalysisInput,
  RootCauseCategory,
} from './recovery-root-cause-types.js';

let analysisCounter = 0;

export function resetRootCauseAnalyzerForTests(): void {
  analysisCounter = 0;
}

export function analyzeEngineeringRootCause(input: RootCauseAnalysisInput): RootCauseAnalysis {
  const text = `${input.failureStage} ${input.failureReason} ${(input.blockers ?? []).join(' ')}`.toLowerCase();
  const category = classifyRootCause(text, input.failureStage);
  const confidence = category === 'UNKNOWN' ? 0.45 : 0.82;

  analysisCounter += 1;
  return {
    readOnly: true,
    analysisId: `root-cause-${analysisCounter}-${Date.now()}`,
    category,
    failureStage: input.failureStage,
    failureReason: input.failureReason,
    confidence,
    evidenceRefs: input.evidenceRefs ?? [],
    summary: `Root cause classified as ${category} for stage ${input.failureStage}.`,
    classifiedAt: Date.now(),
  };
}

function classifyRootCause(text: string, stage: string): RootCauseCategory {
  if (/payment|unsafe|human review|architecture conflict/i.test(text)) return 'ARCHITECTURE';
  if (stage === 'PREVIEW' || /preview gate|live preview locked/i.test(text)) return 'PREVIEW';
  if (stage.includes('VALIDATION') || /validation|validator|proof level|faithfulness/i.test(text)) {
    return 'VALIDATION';
  }
  if (/npm (install|run build)|build failed|compile/i.test(text)) return 'BUILD';
  if (/dependency|package-lock|node_modules|peer dep/i.test(text)) return 'DEPENDENCY';
  if (/workspace|corrupt|isolation|path/i.test(text)) return 'WORKSPACE';
  if (/materializ|generation|artifact|file generation/i.test(text) || stage === 'MATERIALIZATION') {
    return 'MATERIALIZATION';
  }
  if (/runtime|dev server|process|timeout/i.test(text)) return 'RUNTIME';
  if (/preview|localhost|gate locked/i.test(text)) return 'PREVIEW';
  if (/memory|disk|resource|quota|cpu/i.test(text)) return 'RESOURCE';
  if (/platform|android|ios|device profile/i.test(text)) return 'PLATFORM';
  if (/api|external|network|fetch failed/i.test(text)) return 'EXTERNAL_API';
  if (/interaction|handler|debug|capability evolution/i.test(text)) return 'VALIDATION';
  return 'UNKNOWN';
}
