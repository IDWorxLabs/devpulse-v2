/**
 * AIDEVENGINE_MULTI_DOMAIN_BUILD_PROOF_V1_1 — cross-scenario blocker matrix builder.
 */

import type { MultiDomainScenarioResult } from '../aidevengine-multi-domain-build-proof-v1/multi-domain-scenario-types.js';

export interface BlockerMatrixRow {
  scenarioId: string;
  productDomain: string;
  failingAuthority: string;
  prerequisiteName: string;
  cqiInitialConfidence: number | null;
  cqiEnrichedConfidence: number | null;
  canProceedToPlanning: boolean | null;
  criticalGapCount: number | null;
  uvlCoverage: number | null;
  uvlConfidence: number | null;
  aflaVerdict: string | null;
  aflaScore: number | null;
  consumedEvidenceFields: readonly string[];
  missingEvidenceFields: readonly string[];
  evidenceExistsNotConsumed: boolean;
  staleOrDefaultState: boolean;
  taskTrackerSpecific: boolean;
  exactBlocker: string;
}

function parseAuthorities(blockers: readonly string[]): Array<{ authority: string; detail: string }> {
  return blockers.map((blocker) => {
    if (blocker.startsWith('Founder prerequisite: ')) {
      return { authority: 'Founder Launch Readiness', detail: blocker.replace('Founder prerequisite: ', '') };
    }
    if (blocker.startsWith('UVL hub insufficient')) {
      return { authority: 'UVL Verification Hub', detail: blocker };
    }
    if (blocker.startsWith('AFLA verdict')) {
      return { authority: 'Autonomous Founder Launch Authority', detail: blocker };
    }
    if (blocker.startsWith('Bounded runtime')) {
      return { authority: 'Visual Runtime Verification', detail: blocker };
    }
    if (blocker.startsWith('Domain UVL')) {
      return { authority: 'UVL Behaviour Evidence', detail: blocker };
    }
    if (blocker.startsWith('CQI enriched')) {
      return { authority: 'Clarifying Question Intelligence', detail: blocker };
    }
    return { authority: 'Launch Gate', detail: blocker };
  });
}

export function buildBlockerMatrix(results: MultiDomainScenarioResult[]): BlockerMatrixRow[] {
  const rows: BlockerMatrixRow[] = [];

  for (const result of results) {
    const cqiEnriched = result.enrichedRequirements?.cqiEnriched;
    const consumption = result.handoff?.consumption.entries ?? [];
    const consumedFields = consumption.flatMap((entry) => [...entry.fieldsUsed]);
    const missingFields = consumption.flatMap((entry) => [
      ...entry.fieldsUnsupported,
      ...entry.fieldsIgnored.filter((f) => f.includes('missing') || f.includes('not')),
    ]);

    const authorities = parseAuthorities(result.launchBlockers);
    if (authorities.length === 0) {
      rows.push({
        scenarioId: result.scenario.id,
        productDomain: result.scenario.productDomain,
        failingAuthority: 'none',
        prerequisiteName: 'none',
        cqiInitialConfidence: result.enrichedRequirements?.initialConfidence ?? null,
        cqiEnrichedConfidence: result.enrichedRequirements?.enrichedConfidence ?? null,
        canProceedToPlanning: cqiEnriched?.canProceedToPlanning ?? null,
        criticalGapCount: cqiEnriched?.criticalGapCount ?? null,
        uvlCoverage: result.uvlCoverage,
        uvlConfidence: result.uvlConfidence,
        aflaVerdict: result.aflaVerdict,
        aflaScore: result.aflaScore,
        consumedEvidenceFields: consumedFields,
        missingEvidenceFields: missingFields,
        evidenceExistsNotConsumed: false,
        staleOrDefaultState: false,
        taskTrackerSpecific: false,
        exactBlocker: 'none — launch-ready',
      });
      continue;
    }

    for (const authority of authorities) {
      const requirementDiscoveryGap =
        authority.detail.includes('Requirement Discovery') ||
        authority.detail.includes('requirement discovery') ||
        authority.detail.includes('Requirement:');
      const evidenceExistsNotConsumed =
        requirementDiscoveryGap &&
        Boolean(cqiEnriched) &&
        (cqiEnriched!.requirementConfidenceScore >= 75) &&
        !cqiEnriched!.canProceedToPlanning;
      const staleOrDefaultState =
        requirementDiscoveryGap &&
        Boolean(result.enrichedRequirements) &&
        result.enrichedRequirements!.initialConfidence !== null &&
        result.enrichedRequirements!.enrichedConfidence !== null &&
        (cqiEnriched?.canProceedToPlanning === false);
      const taskTrackerSpecific =
        authority.detail.toLowerCase().includes('task') ||
        authority.detail.includes('addTask');

      rows.push({
        scenarioId: result.scenario.id,
        productDomain: result.scenario.productDomain,
        failingAuthority: authority.authority,
        prerequisiteName: authority.detail,
        cqiInitialConfidence: result.enrichedRequirements?.initialConfidence ?? null,
        cqiEnrichedConfidence: result.enrichedRequirements?.enrichedConfidence ?? null,
        canProceedToPlanning: cqiEnriched?.canProceedToPlanning ?? null,
        criticalGapCount: cqiEnriched?.criticalGapCount ?? null,
        uvlCoverage: result.uvlCoverage,
        uvlConfidence: result.uvlConfidence,
        aflaVerdict: result.aflaVerdict,
        aflaScore: result.aflaScore,
        consumedEvidenceFields: consumedFields,
        missingEvidenceFields: missingFields,
        evidenceExistsNotConsumed,
        staleOrDefaultState,
        taskTrackerSpecific,
        exactBlocker: authority.detail,
      });
    }
  }

  return rows;
}

export function formatBlockerMatrixMarkdown(rows: BlockerMatrixRow[]): string {
  const header = [
    '| Scenario | Authority | Prerequisite / blocker | CQI before→after | canProceed | criticalGaps | UVL cov/conf | AFLA | Exists not consumed | Stale state | Task-tracker specific |',
    '|----------|-----------|------------------------|------------------|------------|--------------|--------------|------|----------------------|-------------|----------------------|',
  ];
  const body = rows.map(
    (row) =>
      `| ${row.scenarioId} | ${row.failingAuthority} | ${row.exactBlocker.replace(/\|/g, '/')} | ${row.cqiInitialConfidence ?? 'n/a'}→${row.cqiEnrichedConfidence ?? 'n/a'} | ${row.canProceedToPlanning ?? 'n/a'} | ${row.criticalGapCount ?? 'n/a'} | ${row.uvlCoverage ?? 'n/a'}/${row.uvlConfidence ?? 'n/a'} | ${row.aflaVerdict ?? 'n/a'} (${row.aflaScore ?? 'n/a'}) | ${row.evidenceExistsNotConsumed ? 'YES' : 'NO'} | ${row.staleOrDefaultState ? 'YES' : 'NO'} | ${row.taskTrackerSpecific ? 'YES' : 'NO'} |`,
  );
  return [...header, ...body].join('\n');
}
