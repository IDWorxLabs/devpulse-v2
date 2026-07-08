/**
 * PRODUCT_FAITHFULNESS_EVIDENCE_TRACE_V1 — report assembly and rendering.
 *
 * Pure aggregation over whatever the trace/audit/probe functions produced. No new detection logic
 * lives here — this module only assembles and formats.
 */

import {
  PIPELINE_STAGE_ORDER,
  type DomainCollisionProbeResult,
  type EarliestEntryPoint,
  type EvidenceTraceEntry,
  type FallbackPathFinding,
  type GlobalStateFinding,
  type HardcodedConceptListFinding,
  type ProductFaithfulnessTraceReport,
  type ProjectContextReuseProbeResult,
  type RecommendedFixDescription,
  type RecoveryPathFinding,
  type StaleEvidenceTraceDetection,
} from './product-faithfulness-trace-types.js';

export function buildProductFaithfulnessTraceReport(input: {
  evidenceTraceLog: EvidenceTraceEntry[];
  staleEvidenceDetections: StaleEvidenceTraceDetection[];
  globalStateFindings: GlobalStateFinding[];
  fallbackPathFindings: FallbackPathFinding[];
  recoveryPathFindings: RecoveryPathFinding[];
  hardcodedConceptListFindings: HardcodedConceptListFinding[];
  domainCollisionProbes: DomainCollisionProbeResult[];
  projectContextReuseProbe: ProjectContextReuseProbeResult;
  earliestEntryPoint: EarliestEntryPoint;
  contributingFindings: EarliestEntryPoint[];
  recommendedFixes: RecommendedFixDescription[];
}): ProductFaithfulnessTraceReport {
  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    tracedPipeline: [...PIPELINE_STAGE_ORDER],
    evidenceTraceLog: input.evidenceTraceLog,
    staleEvidenceDetections: input.staleEvidenceDetections,
    globalStateFindings: input.globalStateFindings,
    fallbackPathFindings: input.fallbackPathFindings,
    recoveryPathFindings: input.recoveryPathFindings,
    hardcodedConceptListFindings: input.hardcodedConceptListFindings,
    domainCollisionProbes: input.domainCollisionProbes,
    projectContextReuseProbe: input.projectContextReuseProbe,
    earliestEntryPoint: input.earliestEntryPoint,
    contributingFindings: input.contributingFindings,
    recommendedFixes: input.recommendedFixes,
  };
}

function section(title: string): string {
  return `\n${'='.repeat(80)}\n${title}\n${'='.repeat(80)}`;
}

export function renderProductFaithfulnessTraceReportMarkdown(report: ProductFaithfulnessTraceReport): string {
  const lines: string[] = [];
  lines.push('# Product Faithfulness Evidence Trace V1 — Report');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Traced pipeline: ${report.tracedPipeline.join(' -> ')}`);

  lines.push(section('DOMAIN-COLLISION PROBES (live, real-code repro)'));
  for (const probe of report.domainCollisionProbes) {
    lines.push(`\n[${probe.collided ? 'COLLISION' : 'clean'}] ${probe.probeName}`);
    lines.push(`  prompt: "${probe.prompt}"`);
    lines.push(`  producedDomainLabel: ${probe.producedDomainLabel ?? '(none)'}`);
    lines.push(`  producedConceptNames: ${probe.producedConceptNames.join(', ') || '(none)'}`);
    if (probe.collisionExplanation) lines.push(`  explanation: ${probe.collisionExplanation}`);
  }

  lines.push(section('PROJECT-CONTEXT REUSE PROBE (live, real-code repro)'));
  const p = report.projectContextReuseProbe;
  lines.push(`  first build projectId:            ${p.firstBuildProjectId}`);
  lines.push(`  second build requested projectId: ${p.secondBuildRequestedProjectId}`);
  lines.push(`  second build resolved projectId:  ${p.secondBuildResolvedProjectId}`);
  lines.push(`  second build created new project: ${p.secondBuildCreatedNewProject}`);
  lines.push(`  blockActiveProjectFallback set:   ${p.blockActiveProjectFallbackWasSet}`);
  lines.push(`  REUSED PREVIOUS PROJECT/SESSION:  ${p.reused}`);
  lines.push(`  ${p.explanation}`);

  lines.push(section('STALE EVIDENCE DETECTIONS'));
  if (report.staleEvidenceDetections.length === 0) {
    lines.push('  (none recorded in this run)');
  }
  for (const d of report.staleEvidenceDetections) {
    lines.push(`\n  STALE_EVIDENCE_DETECTED — entry #${d.entrySequence} (${d.stage})`);
    lines.push(`    which object:     ${d.whichObject}`);
    lines.push(`    which source:     ${d.whichSource}`);
    lines.push(`    producing module: ${d.producingModule}`);
    lines.push(`    mismatched:       ${d.mismatchedFields.join(', ')}`);
    lines.push(`    why accepted:     ${d.whyAccepted}`);
    lines.push(`    why not rejected: ${d.whyNotRejected}`);
  }

  lines.push(section('GLOBAL / SHARED STATE FOUND'));
  for (const g of report.globalStateFindings) {
    lines.push(`\n  [${g.kind}] ${g.file}:${g.line}  (${g.symbol})`);
    lines.push(`    ${g.snippet}`);
    lines.push(`    survives across builds: ${g.survivesAcrossBuilds} — ${g.note}`);
  }

  lines.push(section('FALLBACK PATHS FOUND'));
  for (const f of report.fallbackPathFindings) {
    lines.push(`\n  ${f.file}:${f.line}  in ${f.function}()`);
    lines.push(`    ${f.snippet}`);
    lines.push(`    falls back to: ${f.fallsBackTo}`);
  }

  lines.push(section('RECOVERY PATHS FOUND'));
  for (const r of report.recoveryPathFindings) {
    lines.push(`\n  ${r.file}:${r.line}  in ${r.function}()`);
    lines.push(`    ${r.snippet}`);
    lines.push(`    source collection: ${r.sourceCollectionExplanation}`);
  }

  lines.push(section('HARDCODED CONCEPT GLOSSARY (parsed from real source)'));
  for (const h of report.hardcodedConceptListFindings) {
    lines.push(`\n  ${h.file}:${h.line}  domain="${h.domainLabel}"`);
    lines.push(`    triggerKeywords: ${h.triggerKeywords.join(', ')}`);
    lines.push(`    concepts: ${h.concepts.map((c) => c.concept).join(', ')}`);
    if (h.riskyGenericKeywords.length > 0) {
      lines.push(`    RISKY GENERIC KEYWORDS: ${h.riskyGenericKeywords.join(', ')}`);
    }
  }

  lines.push(section('EARLIEST ENTRY POINT'));
  lines.push(`  ${report.earliestEntryPoint.file}:${report.earliestEntryPoint.line}  ${report.earliestEntryPoint.function}()`);
  lines.push(`  stage: ${report.earliestEntryPoint.stage}`);
  lines.push(`  ${report.earliestEntryPoint.description}`);

  lines.push(section('CONTRIBUTING FINDINGS (compound the earliest entry point)'));
  for (const c of report.contributingFindings) {
    lines.push(`\n  ${c.file}:${c.line}  ${c.function}()`);
    lines.push(`  stage: ${c.stage}`);
    lines.push(`  ${c.description}`);
  }

  lines.push(section('RECOMMENDED MINIMAL FIX (description only — NOT applied)'));
  for (const r of report.recommendedFixes) {
    lines.push(`\n  ${r.targetFile} :: ${r.targetFunction}`);
    lines.push(`  ${r.description}`);
  }

  return lines.join('\n');
}
