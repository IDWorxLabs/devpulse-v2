/**
 * Autonomous Engineering Intelligence V1 — structured input loading from B8–B11.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { ProductionReadinessReport } from '../universal-production-readiness/universal-production-readiness-types.js';
import type { UniversalCapabilityCompositionPlan } from '../universal-capability-composition-engine/universal-capability-composition-types.js';
import type { UniversalBehaviorVerificationReport } from '../universal-behavioral-verification/universal-behavior-types.js';
import type { CapabilityCoverageSnapshot } from '../universal-capability-coverage/universal-capability-coverage-types.js';
import { fingerprintWorkspaceFiles } from '../universal-production-readiness/production-readiness-input-loader.js';
import type { AutonomousEngineeringInput } from './autonomous-engineering-types.js';

function readJson<T>(files: readonly GeneratedWorkspaceFile[], suffix: string): T | null {
  const f = files.find((x) => x.relativePath.endsWith(suffix));
  if (!f) return null;
  try { return JSON.parse(f.content) as T; } catch { return null; }
}

export function loadAutonomousEngineeringInput(input: {
  envelope: ApprovedProductionBuildEnvelope;
  workspaceFiles: readonly GeneratedWorkspaceFile[];
  moduleIds: readonly string[];
  contractId: string;
}): AutonomousEngineeringInput {
  return {
    envelope: input.envelope,
    workspaceFiles: [...input.workspaceFiles],
    compositionPlan: readJson<UniversalCapabilityCompositionPlan>(input.workspaceFiles, 'capability-composition-plan.json'),
    behaviorReport: readJson<UniversalBehaviorVerificationReport>(input.workspaceFiles, 'behavior-verification-report.json'),
    coverageSnapshot: readJson<CapabilityCoverageSnapshot>(input.workspaceFiles, 'capability-coverage-snapshot.json'),
    readinessReport: readJson<ProductionReadinessReport>(input.workspaceFiles, 'production-readiness-evaluation.json'),
    moduleIds: input.moduleIds,
    contractId: input.contractId,
  };
}

export function validateAutonomousEngineeringInput(input: AutonomousEngineeringInput | null | undefined): string[] {
  const errors: string[] = [];
  if (!input) return ['autonomous_engineering_input_invalid'];
  if (!input.envelope) errors.push('autonomous_engineering_input_invalid');
  if (!input.readinessReport) errors.push('autonomous_finding_stale');
  if (!input.compositionPlan) errors.push('autonomous_engineering_input_invalid');
  return errors;
}

export function workspaceFingerprint(files: readonly GeneratedWorkspaceFile[]): string {
  return fingerprintWorkspaceFiles(files);
}
