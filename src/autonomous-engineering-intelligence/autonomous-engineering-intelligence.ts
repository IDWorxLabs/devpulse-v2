/**
 * Autonomous Engineering Intelligence V1 — canonical orchestrator.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type {
  AutonomousEngineeringInput,
  AutonomousEngineeringPlan,
  AutonomousEngineeringReport,
  AutonomousEngineeringExecutionResult,
  RepairOutcome,
} from './autonomous-engineering-types.js';
import { AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE } from './autonomous-engineering-types.js';
import { loadAutonomousEngineeringInput, validateAutonomousEngineeringInput } from './autonomous-engineering-input-loader.js';
import { normalizeEngineeringFindings } from './autonomous-engineering-finding-normalizer.js';
import { groupEngineeringFindings } from './autonomous-engineering-finding-grouper.js';
import { classifyRepairEligibilityBatch } from './autonomous-repair-eligibility-classifier.js';
import { buildAutonomousEngineeringPlan } from './autonomous-repair-plan-builder.js';
import { validateAutonomousEngineeringPlan } from './autonomous-repair-plan-validator.js';
import { executeAutonomousEngineeringPlan } from './autonomous-repair-executor.js';
import { verifyAutonomousEngineeringResult } from './autonomous-repair-post-verification.js';
import { reconcileAutonomousEngineeringResult } from './autonomous-repair-reconciliation.js';
import { generateAutonomousEngineeringReport } from './autonomous-engineering-report.js';
import { buildAutonomousEngineeringEvidence } from './autonomous-engineering-evidence.js';
import { buildAutonomousEngineeringTraceability } from './autonomous-engineering-traceability.js';
import { detectAutonomousRepairRegression } from './autonomous-repair-regression-detector.js';
import {
  fingerprintAutonomousEngineeringPlan,
  fingerprintAutonomousEngineeringResult,
} from './autonomous-repair-plan-fingerprint.js';
import { bootstrapRepairStrategyRegistry } from './autonomous-repair-strategy-registry.js';

export function analyzeEngineeringFindings(input: AutonomousEngineeringInput) {
  bootstrapRepairStrategyRegistry();
  const findings = normalizeEngineeringFindings(input);
  const groups = groupEngineeringFindings(findings);
  const eligibility = classifyRepairEligibilityBatch(findings);
  return { findings, groups, eligibility };
}

export function requireSafeAutonomousRepair(input: {
  engineeringInput: AutonomousEngineeringInput;
  plan: AutonomousEngineeringPlan;
}): void {
  const errors = validateAutonomousEngineeringInput(input.engineeringInput);
  const planErrors = validateAutonomousEngineeringPlan(input.plan);
  if (errors.length > 0 || planErrors.filter((e) => e !== 'repair_not_required').length > 0) {
    throw new Error(`autonomous_repair_unsafe:${[...errors, ...planErrors].join(',')}`);
  }
}

export function runAutonomousEngineeringCycle(input: AutonomousEngineeringInput): {
  plan: AutonomousEngineeringPlan;
  execution: AutonomousEngineeringExecutionResult;
  report: AutonomousEngineeringReport;
  evidence: ReturnType<typeof buildAutonomousEngineeringEvidence>;
  traceability: ReturnType<typeof buildAutonomousEngineeringTraceability>;
} {
  const analysis = analyzeEngineeringFindings(input);
  const plan = buildAutonomousEngineeringPlan({ engineeringInput: input, findings: analysis.findings });
  const planErrors = validateAutonomousEngineeringPlan(plan);
  const execution = executeAutonomousEngineeringPlan({
    engineeringInput: input,
    plan,
    findings: analysis.findings,
  });
  verifyAutonomousEngineeringResult({
    engineeringInput: { ...input, workspaceFiles: execution.workspaceFiles },
    plan,
    appliedMutations: execution.appliedMutations,
    readinessBefore: execution.readinessBefore,
    readinessAfter: execution.readinessAfter,
    resolvedFindingIds: execution.resolvedFindingIds,
  });
  reconcileAutonomousEngineeringResult({ engineeringInput: { ...input, workspaceFiles: execution.workspaceFiles } });
  const report = generateAutonomousEngineeringReport({
    plan,
    execution,
    findings: analysis.findings,
    validationErrors: planErrors,
  });
  const evidence = buildAutonomousEngineeringEvidence({ plan, execution });
  const traceability = buildAutonomousEngineeringTraceability({
    findings: analysis.findings,
    plan,
    execution,
  });
  return { plan, execution, report, evidence, traceability };
}

export {
  loadAutonomousEngineeringInput,
  validateAutonomousEngineeringInput,
  classifyRepairEligibilityBatch,
  buildAutonomousEngineeringPlan,
  validateAutonomousEngineeringPlan,
  executeAutonomousEngineeringPlan,
  verifyAutonomousEngineeringResult,
  reconcileAutonomousEngineeringResult,
  generateAutonomousEngineeringReport,
  detectAutonomousRepairRegression,
  fingerprintAutonomousEngineeringPlan,
  fingerprintAutonomousEngineeringResult,
};

export { AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE };

export function shouldRunAutonomousEngineering(input: AutonomousEngineeringInput): boolean {
  if (!input.readinessReport) return false;
  if (input.readinessReport.readinessVerdict === 'PRODUCTION_READY') return false;
  const analysis = analyzeEngineeringFindings(input);
  const repairable = analysis.eligibility.some((d) =>
    ['AUTONOMOUSLY_REPAIRABLE', 'AUTONOMOUSLY_REPAIRABLE_WITH_GUARDS', 'REQUIRES_EXISTING_GENERATOR_REEXECUTION'].includes(
      d.eligibility,
    ),
  );
  return repairable && analysis.findings.length > 0;
}

export function buildAutonomousEngineeringWorkspaceArtifacts(result: {
  plan: AutonomousEngineeringPlan;
  execution: AutonomousEngineeringExecutionResult;
  report: AutonomousEngineeringReport;
  evidence: ReturnType<typeof buildAutonomousEngineeringEvidence>;
  traceability: ReturnType<typeof buildAutonomousEngineeringTraceability>;
}): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: 'src/autonomous-engineering-intelligence/autonomous-engineering-findings.json',
      content: `${JSON.stringify(result.report.plan.sourceFindingIds, null, 2)}\n`,
    },
    {
      relativePath: 'src/autonomous-engineering-intelligence/autonomous-engineering-plan.json',
      content: `${JSON.stringify(result.plan, null, 2)}\n`,
    },
    {
      relativePath: 'src/autonomous-engineering-intelligence/autonomous-engineering-execution.json',
      content: `${JSON.stringify(result.execution, null, 2)}\n`,
    },
    {
      relativePath: 'src/autonomous-engineering-intelligence/autonomous-engineering-evidence.json',
      content: `${JSON.stringify(result.evidence, null, 2)}\n`,
    },
    {
      relativePath: 'src/autonomous-engineering-intelligence/autonomous-engineering-report.json',
      content: `${JSON.stringify(result.report, null, 2)}\n`,
    },
    {
      relativePath: 'src/autonomous-engineering-intelligence/autonomous-engineering-traceability.json',
      content: `${JSON.stringify(result.traceability, null, 2)}\n`,
    },
    {
      relativePath: 'src/autonomous-engineering-intelligence/autonomous-engineering-marker.ts',
      content: `/** ${AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE} — marker only, not repair evidence */
export const AUTONOMOUS_ENGINEERING_MARKER = '${AUTONOMOUS_ENGINEERING_INTELLIGENCE_SOURCE}' as const;
export const AUTONOMOUS_ENGINEERING_PLAN_ID = '${result.plan.planId}';
export const AUTONOMOUS_ENGINEERING_OUTCOME = '${result.execution.outcome}' as const;
export const AUTONOMOUS_ENGINEERING_PLAN_FINGERPRINT = '${result.plan.fingerprint}';
export const AUTONOMOUS_ENGINEERING_RESOLVED_COUNT = ${result.execution.resolvedFindingIds.length};
export const AUTONOMOUS_ENGINEERING_UNRESOLVED_COUNT = ${result.execution.unresolvedFindingIds.length};
`,
    },
  ];
}
