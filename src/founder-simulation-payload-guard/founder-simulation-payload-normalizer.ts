/**
 * Phase 26.97 — Founder simulation payload normalizer.
 */

import {
  FOUNDER_SIMULATION_UNIFIED_SUMMARY_ARRAY_FIELDS,
  FOUNDER_SIMULATION_V4_ARRAY_FIELDS,
} from './founder-simulation-payload-guard-registry.js';
import {
  normalizeLaunchVerdictGovernanceAtPath,
  normalizeRawResultLaunchVerdictGovernanceSource,
} from '../launch-verdict-governance-source-normalization/index.js';
import { mergeGovernanceSourceNormalizationIntoRaw } from './founder-simulation-guarded-diagnostic-source-patch.js';
import type {
  FounderSimulationPayloadFieldRepair,
  FounderSimulationPayloadGuardMetadata,
  GuardedFounderSimulationExecutionResult,
} from './founder-simulation-payload-guard-types.js';
import { auditFounderSimulationPayloadShape, repairsFromRisks } from './founder-simulation-payload-shape-auditor.js';

function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: string | undefined | null): string {
  return typeof value === 'string' ? value : '';
}

function asObject(value: Record<string, unknown> | undefined | null): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
}

function setPath(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!;
    const next = cursor[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;
}

function getPath(root: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, root);
}

function normalizeUnifiedSummary(summary: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...summary };
  for (const field of FOUNDER_SIMULATION_UNIFIED_SUMMARY_ARRAY_FIELDS) {
    normalized[field] = asArray(normalized[field] as string[] | undefined);
  }
  if (normalized.highestImpactUpgrade == null) {
    normalized.highestImpactUpgrade = null;
  } else {
    normalized.highestImpactUpgrade = asString(normalized.highestImpactUpgrade as string | null) || null;
  }
  return normalized;
}

function normalizeV4NestedArrays(v4: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...v4 };

  for (const path of FOUNDER_SIMULATION_V4_ARRAY_FIELDS) {
    const current = getPath(normalized, path);
    if (current == null || !Array.isArray(current)) {
      setPath(normalized, path, []);
    }
  }

  const chat = asObject(normalized.chatIntelligenceReality as Record<string, unknown>);
  chat.failedScenarios = asArray(chat.failedScenarios as unknown[]);
  chat.founderProofNotes = asArray(chat.founderProofNotes as string[]);
  chat.requiredFixesBeforeLaunch = asArray(chat.requiredFixesBeforeLaunch as string[]);
  chat.scenariosRun = typeof chat.scenariosRun === 'number' ? chat.scenariosRun : 0;
  chat.scenariosPassed = typeof chat.scenariosPassed === 'number' ? chat.scenariosPassed : 0;
  normalized.chatIntelligenceReality = chat;

  const typecheck = asObject(normalized.repositoryTypecheckReality as Record<string, unknown>);
  typecheck.findings = asArray(typecheck.findings as unknown[]);
  typecheck.founderProofNotes = asArray(typecheck.founderProofNotes as string[]);
  normalized.repositoryTypecheckReality = typecheck;

  const skeptical = asObject(normalized.skepticalFounderSimulator as Record<string, unknown>);
  skeptical.objections = asArray(skeptical.objections as string[]);
  normalized.skepticalFounderSimulator = skeptical;

  normalized.realityGaps = asArray(normalized.realityGaps as unknown[]);
  normalized.issues = asArray(normalized.issues as unknown[]);
  normalized.creationJourney = asArray(normalized.creationJourney as unknown[]);
  normalized.phaseFeedEvents = asArray(normalized.phaseFeedEvents as unknown[]);

  const launchVerdictGovernance = asObject(normalized.launchVerdictGovernance as Record<string, unknown>);
  const governanceNormalized = normalizeLaunchVerdictGovernanceAtPath(
    { launchVerdictGovernance },
    'launchVerdictGovernance',
    'FOUNDER_SIMULATION_DEGRADED_PAYLOAD_GUARD',
  );
  normalized.launchVerdictGovernance = (
    governanceNormalized.root as { launchVerdictGovernance: Record<string, unknown> }
  ).launchVerdictGovernance;
  for (const path of FOUNDER_SIMULATION_V4_ARRAY_FIELDS.filter((entry) =>
    entry.startsWith('launchVerdictGovernance.'),
  )) {
    const current = getPath(normalized, path);
    if (current == null || !Array.isArray(current)) {
      setPath(normalized, path, []);
    }
  }

  const founderActionCenter = asObject(normalized.founderActionCenter as Record<string, unknown>);
  founderActionCenter.topActions = asArray(founderActionCenter.topActions as unknown[]);
  founderActionCenter.blockers = asArray(founderActionCenter.blockers as unknown[]);
  normalized.founderActionCenter = founderActionCenter;

  const founderSensemaking = asObject(normalized.founderSensemaking as Record<string, unknown>);
  founderSensemaking.findings = asArray(founderSensemaking.findings as unknown[]);
  founderSensemaking.topTrustRisks = asArray(founderSensemaking.topTrustRisks as unknown[]);
  normalized.founderSensemaking = founderSensemaking;

  return normalized;
}

function normalizeReport(report: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!report) return null;
  const normalized: Record<string, unknown> = { ...report };
  normalized.reportMarkdown = asString(normalized.reportMarkdown as string | null);
  normalized.unifiedSummary = normalizeUnifiedSummary(
    asObject(normalized.unifiedSummary as Record<string, unknown>),
  );
  if (normalized.v4 && typeof normalized.v4 === 'object') {
    normalized.v4 = normalizeV4NestedArrays(normalized.v4 as Record<string, unknown>);
  } else {
    normalized.v4 = normalizeV4NestedArrays({});
  }
  return normalized;
}

export function normalizeFounderSimulationExecutionResult(input: {
  rawResult: unknown;
  degraded?: boolean;
  completionEvent?: string | null;
  originalError?: string | null;
}): {
  guarded: GuardedFounderSimulationExecutionResult;
  repairs: FounderSimulationPayloadFieldRepair[];
} {
  const sourceNormalized = mergeGovernanceSourceNormalizationIntoRaw(input.rawResult);
  const workingRaw = sourceNormalized.workingRaw;

  const audit = auditFounderSimulationPayloadShape(workingRaw);
  const repairs = repairsFromRisks(audit.risks);

  const raw =
    workingRaw && typeof workingRaw === 'object'
      ? ({ ...(workingRaw as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const report = normalizeReport(
    raw.report && typeof raw.report === 'object'
      ? ({ ...(raw.report as Record<string, unknown>) } as Record<string, unknown>)
      : null,
  );

  const guard: FounderSimulationPayloadGuardMetadata = {
    readOnly: true,
    degraded: input.degraded ?? audit.missingSimulationResult,
    completionEvent: input.completionEvent ?? null,
    originalError: input.originalError ?? null,
    missingFields: repairs.map((repair) => repair.path),
    repairs,
  };

  const guarded: GuardedFounderSimulationExecutionResult = {
    readOnly: true,
    report,
    verificationResults:
      raw.verificationResults && typeof raw.verificationResults === 'object'
        ? (raw.verificationResults as Record<string, unknown>)
        : null,
    changeIntelligence:
      raw.changeIntelligence && typeof raw.changeIntelligence === 'object'
        ? (raw.changeIntelligence as Record<string, unknown>)
        : null,
    founderActionCenter:
      raw.founderActionCenter && typeof raw.founderActionCenter === 'object'
        ? (raw.founderActionCenter as Record<string, unknown>)
        : null,
    founderSensemaking:
      raw.founderSensemaking && typeof raw.founderSensemaking === 'object'
        ? (raw.founderSensemaking as Record<string, unknown>)
        : null,
    founderFrictionHeatmap:
      raw.founderFrictionHeatmap && typeof raw.founderFrictionHeatmap === 'object'
        ? (raw.founderFrictionHeatmap as Record<string, unknown>)
        : null,
    phaseFeedEvents: asArray(raw.phaseFeedEvents as unknown[]),
    guard,
  };

  return { guarded, repairs };
}

const ARRAY_LIKE_KEY =
  /(?:s$|List|Array|Items|Entries|Notes|Blockers|Findings|Recommendations|Objections|Events|Gaps|Risks|Patterns|Authorities|Capabilities|Questions|Areas|Categories|Steps|Issues|Actions|Scenarios|Claims|Strengths|Weaknesses|Traces|Limitations|Tests|Points|Workflows|Changes|Evaluations|Results|Audits|Repairs|Missing|Failed|Pending|Dimensions|Fixes|Plans|Records|Lines|History|Logs|Queue|Runs|Tasks|Proofs|Evidence|Warnings|Errors|Failures|Checks|Reasons|Details|Messages|Prompts|Answers|Scores|Metrics|Artifacts|Snapshots|Cases|Types|Flags|Labels|Descriptions|Components|Screens|Hooks|Handlers|Providers|Settings|Options|Plans|Constraints|Dependencies|Relations|Connections|Links|Sections|Segments|Parts|Groups|Tags|Feed|Stages|Trace|Objections|Assumptions|Investments|Advantages|Blindspots|Operations|Evaluations|Repairs|Consumers|Rows|Columns|Fields|Paths|Targets|Sources|Stops|Blockers|Gaps|Risks|Patterns|Authorities|Capabilities)/i;

export function deepDefaultPayloadArrays<T>(value: T, depth = 0): T {
  if (depth > 10 || value == null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => deepDefaultPayloadArrays(entry, depth + 1)) as T;
  }
  if (typeof value !== 'object') {
    return value;
  }
  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (entry == null && ARRAY_LIKE_KEY.test(key)) {
      out[key] = [];
      continue;
    }
    if (entry == null && /markdown|message|summary|title|name|prompt|answer|detail|reason|label|text|description|verdict|state|status|mode|path|id$/i.test(key)) {
      out[key] = '';
      continue;
    }
    if (entry == null) {
      out[key] = {};
      continue;
    }
    out[key] = deepDefaultPayloadArrays(entry, depth + 1);
  }
  return out as T;
}

const AUTHORITY_ARRAY_KEY =
  /recommendations|blockers|findings|risks|limitations|patterns|objections|notes|gaps|authorities|capabilities|questions|areas|categories|steps|issues|actions|scenarios|claims|strengths|weaknesses|traces|tests|points|workflows|changes|evaluations|results|audits|repairs|missing|failed|pending|dimensions|fixes|plans|records|lines|history|logs|queue|runs|tasks|proofs|evidence|warnings|errors|failures|checks|reasons|details|messages|prompts|answers|scores|metrics|artifacts|snapshots|cases|types|flags|labels|descriptions|assumptions|investments|advantages|blindspots|operations|confusionPoints|valueRisks|competitiveRisks|recommendedQuestions|uiRecommendations|failureCategories|missingCapabilities|highestRiskAuthorities|strongestAuthorities|requiredEvidenceMissing|detectedGaps|recommendedTests|trustRisks|launchBlockers|topLaunchBlockers|adoptionBlockers|topUnprovenClaims|topContradictions|provenClaims|unprovenClaims|contradictedClaims|launchStrengths|launchWeaknesses|adoptionStrengths|adoptionWeaknesses|highestRoiOpportunities|recommendedNextInvestments|doNotBuild|strongestCompetitiveAdvantages|competitiveBlindspots|unprovenCompetitiveClaims|blockingEvidence|highestPriorityRisks|recentChanges|topActions|blockedWorkflows|topTrustRisks|trustEvents|creationJourney|issues|realityGaps|phaseFeedEvents|failedScenarios|founderProofNotes|requiredFixesBeforeLaunch|objections|feed|events|traceEvents|stages/i;

export function defaultAuthorityArrayFields<T>(root: T): T {
  function walk(node: unknown, depth: number): void {
    if (depth > 8 || node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const entry of node) walk(entry, depth + 1);
      return;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (value == null && AUTHORITY_ARRAY_KEY.test(key)) {
        (node as Record<string, unknown>)[key] = [];
      } else {
        walk(value, depth + 1);
      }
    }
  }
  walk(root, 0);
  return root;
}

export function toHandlerResultShape(guarded: GuardedFounderSimulationExecutionResult): {
  report: { reportMarkdown?: string; unifiedSummary?: Record<string, unknown>; v4?: Record<string, unknown> } | null;
  verificationResults: Record<string, unknown> | null;
  changeIntelligence: Record<string, unknown> | null;
  founderActionCenter: Record<string, unknown> | null;
  founderSensemaking: Record<string, unknown> | null;
  founderFrictionHeatmap: Record<string, unknown> | null;
  phaseFeedEvents: unknown[];
  simulationPayloadGuard: FounderSimulationPayloadGuardMetadata;
} {
  return {
    report: guarded.report as {
      reportMarkdown?: string;
      unifiedSummary?: Record<string, unknown>;
      v4?: Record<string, unknown>;
    } | null,
    verificationResults: guarded.verificationResults,
    changeIntelligence: guarded.changeIntelligence,
    founderActionCenter: guarded.founderActionCenter,
    founderSensemaking: guarded.founderSensemaking,
    founderFrictionHeatmap: guarded.founderFrictionHeatmap,
    phaseFeedEvents: [...guarded.phaseFeedEvents],
    simulationPayloadGuard: guarded.guard,
  };
}
