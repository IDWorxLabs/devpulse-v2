/**
 * Universal Capability Coverage Intelligence V1 — production pipeline integration.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { UniversalBehaviorVerificationReport } from '../universal-behavioral-verification/universal-behavior-types.js';
import type {
  CapabilityCoverageMaterializationInput,
  CapabilityCoverageReport,
} from './universal-capability-coverage-types.js';
import { UNIVERSAL_CAPABILITY_COVERAGE_SOURCE } from './universal-capability-coverage-types.js';
import {
  buildCoverageSnapshot,
  extractCapabilitiesFromProductionTruth,
} from './capability-coverage-engine.js';
import { buildCapabilityCoverageReport } from './capability-coverage-report.js';

export interface CapabilityCoverageWorkspaceResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly report: CapabilityCoverageReport;
}

function readBehaviorReportFromWorkspace(
  workspaceFiles: readonly GeneratedWorkspaceFile[],
): UniversalBehaviorVerificationReport | null {
  const file = workspaceFiles.find((f) => f.relativePath.endsWith('behavior-verification-report.json'));
  if (!file) return null;
  try {
    return JSON.parse(file.content) as UniversalBehaviorVerificationReport;
  } catch {
    return null;
  }
}

export function buildCapabilityCoverageMaterializationInputFromEnvelope(input: {
  envelope: ApprovedProductionBuildEnvelope;
  appTitle: string;
  moduleIds: readonly string[];
  contractId: string;
  crudBacked: boolean;
  actionBacked: boolean;
  workflowBacked: boolean;
  relationshipBacked: boolean;
  runtimeBacked: boolean;
  ruleBacked: boolean;
  capabilityPackBacked: boolean;
  behavioralVerificationBacked: boolean;
}): CapabilityCoverageMaterializationInput {
  return { ...input };
}

export function materializeCapabilityCoverageForWorkspace(
  workspaceFiles: readonly GeneratedWorkspaceFile[],
  envelope: ApprovedProductionBuildEnvelope,
  input: CapabilityCoverageMaterializationInput,
): CapabilityCoverageWorkspaceResult {
  const behaviorReport = readBehaviorReportFromWorkspace(workspaceFiles);
  const capabilities = extractCapabilitiesFromProductionTruth({
    envelope,
    materializationInput: input,
    workspaceFiles,
    behaviorReport,
  });
  const snapshot = buildCoverageSnapshot({
    snapshotId: `${input.contractId}-coverage-snapshot`,
    capabilities,
  });
  const report = buildCapabilityCoverageReport({
    reportId: `${input.contractId}-coverage-report`,
    snapshot,
  });

  const files: GeneratedWorkspaceFile[] = [
    {
      relativePath: 'src/universal-capability-coverage/capability-coverage-snapshot.json',
      content: `${JSON.stringify(snapshot, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-capability-coverage/capability-coverage-report.json',
      content: `${JSON.stringify(report, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-capability-coverage/capability-scorecard.json',
      content: `${JSON.stringify(snapshot.scorecard, null, 2)}\n`,
    },
    {
      relativePath: 'src/universal-capability-coverage/runtime-marker.ts',
      content: `/** ${UNIVERSAL_CAPABILITY_COVERAGE_SOURCE} */
export const UNIVERSAL_CAPABILITY_COVERAGE_MARKER = '${UNIVERSAL_CAPABILITY_COVERAGE_SOURCE}' as const;
export const CAPABILITY_MATURITY_INDEX = ${snapshot.scorecard.capabilityMaturityIndex};
export const BEHAVIORAL_COVERAGE_PERCENT = ${snapshot.scorecard.behavioralCoveragePercent};
export const ENGINEERING_COVERAGE_PERCENT = ${snapshot.scorecard.engineeringCoveragePercent};
`,
    },
  ];

  return { files, report };
}

export function augmentWorkspaceFilesWithCapabilityCoverage(
  workspaceFiles: GeneratedWorkspaceFile[],
  envelope: ApprovedProductionBuildEnvelope,
  input: CapabilityCoverageMaterializationInput,
): { files: GeneratedWorkspaceFile[]; report: CapabilityCoverageReport } {
  const result = materializeCapabilityCoverageForWorkspace(workspaceFiles, envelope, input);
  return { files: [...workspaceFiles, ...result.files], report: result.report };
}

export function shouldMaterializeCapabilityCoverage(
  envelope?: ApprovedProductionBuildEnvelope | null,
  options?: { crudBacked?: boolean; behavioralVerificationBacked?: boolean },
): boolean {
  if (!envelope) return false;
  return options?.crudBacked === true && options?.behavioralVerificationBacked === true;
}

export function buildCapabilityCoverageSharedRuntimeFiles(): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: 'src/universal-capability-coverage/index.ts',
      content: `export const UNIVERSAL_CAPABILITY_COVERAGE_ENGINE = 'UNIVERSAL_CAPABILITY_COVERAGE_INTELLIGENCE_V1' as const;\n`,
    },
  ];
}
