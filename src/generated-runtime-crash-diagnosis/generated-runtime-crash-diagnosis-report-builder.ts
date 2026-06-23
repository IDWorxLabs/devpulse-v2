/**
 * Generated Runtime Crash Diagnosis — report builder (Phase 26.81).
 */

import {
  GENERATED_RUNTIME_CRASH_DIAGNOSIS_CORE_QUESTION,
  GENERATED_RUNTIME_CRASH_DIAGNOSIS_PHASE,
  GENERATED_RUNTIME_CRASH_DIAGNOSIS_REPORT_TITLE,
  GENERATED_RUNTIME_CRASH_REPAIR_PLAN_REPORT_TITLE,
  ORCHESTRATION_FLOW,
  SAFETY_GUARANTEES,
} from './generated-runtime-crash-diagnosis-registry.js';
import type { GeneratedRuntimeCrashDiagnosisReport } from './generated-runtime-crash-diagnosis-types.js';

export function buildGeneratedRuntimeCrashDiagnosisReportMarkdown(
  report: GeneratedRuntimeCrashDiagnosisReport,
): string {
  const { extraction, entrypointMapping, classification, repairPlan } = report;
  return [
    `# ${GENERATED_RUNTIME_CRASH_DIAGNOSIS_REPORT_TITLE}`,
    '',
    `**Diagnosis:** ${report.diagnosisId}`,
    `**Generated:** ${report.generatedAt}`,
    `**Crash class:** ${classification.crashClass}`,
    `**Crash detected:** ${report.crashDetected}`,
    '',
    '## Core question',
    '',
    GENERATED_RUNTIME_CRASH_DIAGNOSIS_CORE_QUESTION,
    '',
    '## Phase',
    '',
    GENERATED_RUNTIME_CRASH_DIAGNOSIS_PHASE,
    '',
    '## Process',
    '',
    `- attemptedCommand: **${entrypointMapping.attemptedCommand ?? 'none'}**`,
    `- cwd: **${entrypointMapping.cwd}**`,
    `- entryFile: **${entrypointMapping.entryFile ?? 'none'}**`,
    `- processId: **${extraction.processId ?? 'none'}**`,
    `- exitCode: ${extraction.exitCode ?? 'n/a'}`,
    '',
    '## Classification',
    '',
    `- crashClass: **${classification.crashClass}**`,
    `- failingFile: **${classification.failingFile ?? 'unknown'}**`,
    `- failingLine: ${classification.failingLine ?? 'n/a'}`,
    `- failingSymbol: ${classification.failingSymbol ?? 'n/a'}`,
    `- evidenceConfidence: **${classification.evidenceConfidence}**`,
    `- reason: ${classification.crashClassReason}`,
    '',
    '## Raw error excerpt',
    '',
    '```',
    extraction.rawErrorExcerpt || 'none',
    '```',
    '',
    report.recommendedFix,
    '',
  ].join('\n');
}

export function buildGeneratedRuntimeCrashRepairPlanMarkdown(
  report: GeneratedRuntimeCrashDiagnosisReport,
): string {
  const plan = report.repairPlan;
  return [
    `# ${GENERATED_RUNTIME_CRASH_REPAIR_PLAN_REPORT_TITLE}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- crashClass: **${report.classification.crashClass}**`,
    `- targetedFile: **${plan.targetedFile ?? 'none'}**`,
    `- shouldAutoRepair: **${plan.shouldAutoRepair}**`,
    `- riskLevel: **${plan.riskLevel}**`,
    '',
    '### Recommendation',
    '',
    plan.repairRecommendation,
    '',
    '### Expected effect',
    '',
    plan.expectedEffect,
    '',
    '## Safety guarantees',
    '',
    ...SAFETY_GUARANTEES.map((g) => `- ${g}`),
    '',
    '## Orchestration',
    '',
    ...ORCHESTRATION_FLOW.map((s, i) => `${i + 1}. ${s}`),
    '',
  ].join('\n');
}
