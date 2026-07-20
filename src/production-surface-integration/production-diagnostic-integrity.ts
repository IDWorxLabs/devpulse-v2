/**
 * Production Timeline and Diagnostic Integrity Repair V1 — structured diagnostic projection.
 * Preserves GPCA offender lists and canonical root causes; never collapses to generic wording.
 */

import type { OnePromptLivePreviewBuildResult } from '../one-prompt-live-preview/one-prompt-live-preview-types.js';
import type { BuildOutcome } from '../build-context-integrity/build-context-types.js';
import { resolveProductionSurfaceBuildOutcomeFromResult } from './status-surface.js';

export interface ProductionRootCauseFindingInput {
  readonly concept: string;
  readonly firstBrokenBoundary: string;
  readonly outcome: string;
  readonly repairEligibility: string;
  readonly regenerationStage: string | null;
  readonly requiredAction: string;
}

export interface ProductionDiagnosticOffender {
  readonly readOnly: true;
  readonly kind: 'NAVIGATION' | 'MODULE' | 'ROUTE' | 'TITLE' | 'OTHER';
  readonly value: string;
}

export interface ProductionDiagnosticReport {
  readonly readOnly: true;
  readonly buildId: string;
  readonly buildOutcome: BuildOutcome;
  readonly failureCode: string | null;
  readonly rootCause: string | null;
  readonly firstBrokenAuthority: string | null;
  readonly firstBrokenBoundary: string | null;
  readonly offendingGenerator: string | null;
  readonly offendingApprovedInputs: readonly string[];
  readonly offendingGeneratedInputs: readonly string[];
  readonly offenders: readonly ProductionDiagnosticOffender[];
  readonly blockedReasons: readonly string[];
  readonly summaryLines: readonly string[];
}

export interface ProductionRootCauseReport {
  readonly readOnly: true;
  readonly buildId: string;
  readonly findings: readonly ProductionRootCauseFindingInput[];
  readonly onePerConcept: boolean;
  readonly noDownstreamRecoveryClaims: boolean;
}

const NAV_OFFENDER_RE = /navigation item "([^"]+)" was not approved by CBGA/gi;
const MODULE_OFFENDER_RE = /module "([^"]+)" was not approved by CBGA/gi;
const ROUTE_OFFENDER_RE = /route "([^"]+)" was not approved by CBGA/gi;

function extractOffenders(reasons: readonly string[]): ProductionDiagnosticOffender[] {
  const offenders: ProductionDiagnosticOffender[] = [];
  const seen = new Set<string>();
  for (const reason of reasons) {
    for (const match of reason.matchAll(NAV_OFFENDER_RE)) {
      const value = match[1]!;
      const key = `NAVIGATION:${value}`;
      if (!seen.has(key)) {
        seen.add(key);
        offenders.push({ readOnly: true, kind: 'NAVIGATION', value });
      }
    }
    for (const match of reason.matchAll(MODULE_OFFENDER_RE)) {
      const value = match[1]!;
      const key = `MODULE:${value}`;
      if (!seen.has(key)) {
        seen.add(key);
        offenders.push({ readOnly: true, kind: 'MODULE', value });
      }
    }
    for (const match of reason.matchAll(ROUTE_OFFENDER_RE)) {
      const value = match[1]!;
      const key = `ROUTE:${value}`;
      if (!seen.has(key)) {
        seen.add(key);
        offenders.push({ readOnly: true, kind: 'ROUTE', value });
      }
    }
  }
  return offenders;
}

function mapGateToBoundary(gate: string | null | undefined): string | null {
  if (!gate) return null;
  if (gate.includes('GENERATOR_INPUT_BYPASS')) return 'Generator Input Bypass';
  if (gate.includes('CONTRACT_TRACEABILITY')) return 'Contract Traceability';
  if (gate.includes('BLUEPRINT')) return 'Blueprint Bypass';
  if (gate.includes('TEMPLATE')) return 'Template Generator';
  if (gate.includes('LEGACY')) return 'Legacy Generator';
  if (gate.includes('PLACEHOLDER')) return 'Placeholder Application';
  if (gate.includes('RENDERED')) return 'Rendered Content Drift';
  return gate;
}

function inferOffendingGenerator(offenders: readonly ProductionDiagnosticOffender[]): string | null {
  if (offenders.some((item) => item.kind === 'NAVIGATION')) return 'Navigation Generator';
  if (offenders.some((item) => item.kind === 'MODULE')) return 'Module Generator';
  if (offenders.some((item) => item.kind === 'ROUTE')) return 'Route Generator';
  if (offenders.some((item) => item.kind === 'TITLE')) return 'Identity / Title Generator';
  return null;
}

export function projectProductionDiagnosticReport(
  build: OnePromptLivePreviewBuildResult,
): ProductionDiagnosticReport {
  const buildOutcome = resolveProductionSurfaceBuildOutcomeFromResult(build);
  const gpca = build.gpcaComplianceReport;
  const blockedReasons = gpca?.blockedReasons ?? [];
  const failureFromBuild = build.failureReason ?? null;
  const failureCode =
    failureFromBuild?.startsWith('GENERATION_PIPELINE_NON_COMPLIANT')
      ? 'GENERATION_PIPELINE_NON_COMPLIANT'
      : gpca && gpca.finalGateOutcome !== 'COMPLIANCE_ALLOWED'
        ? 'GENERATION_PIPELINE_NON_COMPLIANT'
        : failureFromBuild
          ? 'BUILD_FAILED'
          : null;

  const offenders = extractOffenders([
    ...blockedReasons,
    ...(failureFromBuild ? [failureFromBuild] : []),
  ]);
  const firstBrokenBoundary = mapGateToBoundary(gpca?.finalGateOutcome ?? null);
  const offendingGenerator = inferOffendingGenerator(offenders);
  const offendingGeneratedInputs = offenders.map((item) => item.value);
  const approvedNav =
    build.approvedNavigationPlan?.productEntries ??
    build.approvedProductionBuildEnvelope?.approvedNavigationPlan.productEntries ??
    [];

  const summaryLines: string[] = [];
  if (failureCode) summaryLines.push(failureCode);
  if (firstBrokenBoundary) summaryLines.push(firstBrokenBoundary);
  if (offendingGenerator) summaryLines.push(offendingGenerator);
  if (offenders.some((item) => item.kind === 'NAVIGATION')) {
    summaryLines.push('Navigation Items');
    for (const offender of offenders.filter((item) => item.kind === 'NAVIGATION')) {
      summaryLines.push(offender.value);
    }
  } else {
    for (const offender of offenders) {
      summaryLines.push(`${offender.kind}: ${offender.value}`);
    }
  }
  if (summaryLines.length === 0 && failureFromBuild) {
    summaryLines.push(failureFromBuild);
  }

  return {
    readOnly: true,
    buildId: build.buildId,
    buildOutcome,
    failureCode,
    rootCause: firstBrokenBoundary ?? failureFromBuild,
    firstBrokenAuthority: gpca ? 'Generation Pipeline Compliance Authority V1' : null,
    firstBrokenBoundary,
    offendingGenerator,
    offendingApprovedInputs: approvedNav,
    offendingGeneratedInputs,
    offenders,
    blockedReasons: blockedReasons.length
      ? blockedReasons
      : failureFromBuild
        ? [failureFromBuild]
        : [],
    summaryLines,
  };
}

export function projectProductionRootCauseReport(
  buildId: string,
  findings: readonly ProductionRootCauseFindingInput[],
): ProductionRootCauseReport {
  const concepts = findings.map((finding) => finding.concept.toLowerCase());
  const onePerConcept = concepts.length === new Set(concepts).size;
  const joined = findings.map((finding) => `${finding.concept} ${finding.requiredAction} ${finding.outcome}`).join(' ');
  const noDownstreamRecoveryClaims = !/recovered into (architecture|navigation|manifest|preview|runtime|feature contract)/i.test(
    joined,
  );
  return {
    readOnly: true,
    buildId,
    findings,
    onePerConcept,
    noDownstreamRecoveryClaims,
  };
}

export function emitTimelineDiagnosticWorkspaceArtifacts(input: {
  readonly timeline: unknown;
  readonly diagnostics: unknown;
  readonly rootCause: unknown;
  readonly statusProjection: unknown;
}): readonly { relativePath: string; content: string }[] {
  return [
    {
      relativePath: 'src/production-surface-integration/production-timeline-report.json',
      content: `${JSON.stringify(input.timeline, null, 2)}\n`,
    },
    {
      relativePath: 'src/production-surface-integration/production-diagnostic-report.json',
      content: `${JSON.stringify(input.diagnostics, null, 2)}\n`,
    },
    {
      relativePath: 'src/production-surface-integration/production-root-cause-report.json',
      content: `${JSON.stringify(input.rootCause, null, 2)}\n`,
    },
    {
      relativePath: 'src/production-surface-integration/timeline-traceability.json',
      content: `${JSON.stringify(
        {
          readOnly: true,
          source: 'projectCanonicalProductionTimeline',
          timeline: input.timeline,
        },
        null,
        2,
      )}\n`,
    },
    {
      relativePath: 'src/production-surface-integration/status-projection.json',
      content: `${JSON.stringify(input.statusProjection, null, 2)}\n`,
    },
  ];
}
