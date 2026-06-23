/**
 * Phase 26.99 — Object path probe for likely missing `.length` fields.
 */

import {
  CONFIRMED_V5_CRASH_FIELD_PATHS,
  V5_LINE_TO_FIELD_PATH,
  V5_REPORT_BUILDER_FILE_HINT,
} from './founder-simulation-crash-locator-registry.js';
import type { CrashFieldKind, UndefinedLengthStackFrame } from './founder-simulation-crash-locator-types.js';

function getPath(root: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, root);
}

function parentPath(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : path;
}

function fieldNameFromPath(path: string): string {
  const parts = path.split('.');
  return parts[parts.length - 1] ?? path;
}

function inferFieldKind(fieldName: string): CrashFieldKind {
  if (/markdown|message|summary|title|label|text|prompt|answer|name|detail|reason|verdict|state|status|path|id$/i.test(fieldName)) {
    return 'string-like';
  }
  if (/authorities|missing|blockers|findings|scenarios|events|notes|recommendations|categories|capabilities|evidence|issues|gaps|actions|claims|risks|patterns|objections|feed|stages|trace|repairs|fields|items|entries|lines|history|logs|results|tests|proofs|warnings|errors|failures|checks|reasons|details|messages|prompts|answers|scores|metrics|artifacts|snapshots|cases|types|flags|descriptions|assumptions|investments|advantages|operations|evaluations|consumers|rows|columns|targets|sources|sections|segments|parts|groups|tags|feed|queue|runs|tasks|fixes|plans|records|pending|failed|dimensions|areas|categories|steps|capabilities|questions|limitations|traces|workflows|changes|audits|confusionPoints|valueRisks|competitiveRisks|uiRecommendations|failureCategories|missingCapabilities|highestRiskAuthorities|strongestAuthorities|requiredEvidenceMissing|detectedGaps|recommendedTests|trustRisks|launchBlockers|topLaunchBlockers|adoptionBlockers|topUnprovenClaims|topContradictions|provenClaims|unprovenClaims|contradictedClaims|launchStrengths|launchWeaknesses|adoptionStrengths|adoptionWeaknesses|highestRoiOpportunities|recommendedNextInvestments|doNotBuild|strongestCompetitiveAdvantages|competitiveBlindspots|unprovenCompetitiveClaims|blockingEvidence|highestPriorityRisks|recentChanges|topActions|blockedWorkflows|topTrustRisks|trustEvents|creationJourney|realityGaps|phaseFeedEvents|failedScenarios|founderProofNotes|requiredFixesBeforeLaunch|objections|assumptionsPrevented|recommendedQuestions|highestRiskAssumptions|personas|candidates|featureEvaluations|confusionHotspots|deadEndFindings|hiddenContentIssues|recoveryIssues|partiallyProvenClaims|founderPromiseScenarios|featureEvaluations/i.test(fieldName)) {
    return 'array-like';
  }
  return 'unknown';
}

export function probeFieldPath(rawResult: unknown, path: string): {
  readOnly: true;
  path: string;
  value: unknown;
  isUndefined: boolean;
  parentExists: boolean;
  parentType: string | null;
  fieldKind: CrashFieldKind;
} {
  const parent = getPath(rawResult, parentPath(path));
  const value = getPath(rawResult, path);
  const fieldName = fieldNameFromPath(path);

  return {
    readOnly: true,
    path,
    value,
    isUndefined: value === undefined,
    parentExists: parent != null && typeof parent === 'object',
    parentType:
      parent == null ? 'null/undefined' : Array.isArray(parent) ? 'array' : typeof parent,
    fieldKind: inferFieldKind(fieldName),
  };
}

export function resolveLikelyFieldPaths(input: {
  primaryFrame: UndefinedLengthStackFrame | null;
  rawResult?: unknown;
}): string[] {
  const paths = new Set<string>();

  const line = input.primaryFrame?.lineNumber;
  const file = input.primaryFrame?.filePath ?? '';
  if (file.includes(V5_REPORT_BUILDER_FILE_HINT) && line != null && V5_LINE_TO_FIELD_PATH[line]) {
    paths.add(V5_LINE_TO_FIELD_PATH[line]!);
  }

  for (const confirmed of CONFIRMED_V5_CRASH_FIELD_PATHS) {
    const probe = probeFieldPath(input.rawResult, confirmed);
    if (probe.isUndefined || probe.value == null) {
      paths.add(confirmed);
    }
  }

  if (paths.size === 0 && file.includes(V5_REPORT_BUILDER_FILE_HINT)) {
    for (const confirmed of CONFIRMED_V5_CRASH_FIELD_PATHS) {
      paths.add(confirmed);
    }
  }

  return [...paths];
}

export function selectPrimaryCrashFieldPath(likelyPaths: readonly string[]): string | null {
  return likelyPaths[0] ?? null;
}
