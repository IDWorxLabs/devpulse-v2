/**
 * Validation Runtime Governance V1 — evidence reuse integration.
 *
 * Wires the general-purpose Validation Evidence Reuse Engine (VERE) into validation runtime
 * governance so that any validator participating in a governed run (a tier plan, a stabilization
 * gate, a milestone regression gate, etc.) can opt into evidence reuse without writing its own
 * caching logic. This file contains no validator-specific or application-specific knowledge — it
 * only adapts VERE's generic policy/engine shape to the vocabulary already used by governance
 * (validator name, relevant files/directories, a session-level report).
 */

import {
  defineValidationEvidencePolicy,
  runWithEvidenceReuse,
  buildValidationEvidenceCacheReport,
  renderValidationEvidenceCacheReportText,
} from '../validation-evidence-reuse/index.js';
import type {
  ValidationEvidenceCacheReport,
  ValidationEvidenceExecutionOutcome,
  ValidationEvidenceSessionEntry,
} from '../validation-evidence-reuse/index.js';

export interface GovernedValidatorEvidencePolicy {
  validatorName: string;
  validatorVersion: string;
  validatorSourceFile?: string;
  relevantFiles?: string[];
  relevantDirectories?: string[];
  dependencyInputs?: string[];
  environmentInputs?: string[];
  ttlMs?: number;
  reuseSafe?: boolean;
  mustRunFreshReason?: string;
  rootDir?: string;
}

/**
 * Runs one governed validator's work through VERE. This is the "reusable wrapper" future
 * validators can opt into with a single call — no bespoke fingerprinting or caching per
 * validator is required.
 */
export function runGovernedValidatorWithEvidenceReuse(
  policy: GovernedValidatorEvidencePolicy,
  input: unknown,
  execute: () => ValidationEvidenceExecutionOutcome,
): ValidationEvidenceSessionEntry {
  const enginePolicy = defineValidationEvidencePolicy({
    validatorName: policy.validatorName,
    validatorVersion: policy.validatorVersion,
    reuseSafe: policy.reuseSafe ?? true,
    validatorSourceFile: policy.validatorSourceFile,
    relevantFiles: policy.relevantFiles ?? [],
    relevantDirectories: policy.relevantDirectories ?? [],
    dependencyInputs: policy.dependencyInputs,
    environmentInputs: policy.environmentInputs ?? [],
    ttlMs: policy.ttlMs,
    mustRunFreshReason: policy.mustRunFreshReason,
  });
  const outcome = runWithEvidenceReuse(enginePolicy, input, execute, { rootDir: policy.rootDir ?? process.cwd() });
  return { validatorName: policy.validatorName, outcome };
}

export function buildGovernedEvidenceReport(entries: ValidationEvidenceSessionEntry[]): ValidationEvidenceCacheReport {
  return buildValidationEvidenceCacheReport(entries);
}

export function renderGovernedEvidenceReport(report: ValidationEvidenceCacheReport): string {
  return renderValidationEvidenceCacheReportText(report);
}
