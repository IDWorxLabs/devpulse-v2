/**
 * Repository Typecheck Reality Authority — read-only repository compile integrity model.
 */

import { createHash } from 'node:crypto';
import {
  MAX_TYPECHECK_FINDINGS,
  REPOSITORY_TYPECHECK_CACHE_KEY_PREFIX,
  REPOSITORY_TYPECHECK_PROOF_NOTES,
  TYPECHECK_COMMAND,
} from './repository-typecheck-reality-bounds.js';
import { recordRepositoryTypecheckAssessment } from './repository-typecheck-reality-history.js';
import { buildRepositoryTypecheckReportMarkdown } from './repository-typecheck-reality-report-builder.js';
import type {
  AssessRepositoryTypecheckRealityInput,
  RepositoryTypecheckAssessment,
  RepositoryTypecheckReadinessState,
  RepositoryTypecheckVisibilityScore,
} from './repository-typecheck-reality-types.js';

function buildCacheKey(errorCount: number, warningCount: number, findingCount: number): string {
  const digest = createHash('sha256')
    .update(`${errorCount}:${warningCount}:${findingCount}`)
    .digest('hex')
    .slice(0, 16);
  return `${REPOSITORY_TYPECHECK_CACHE_KEY_PREFIX}:${digest}`;
}

function deriveReadinessState(
  source: AssessRepositoryTypecheckRealityInput['source'],
  errorCount: number,
  warningCount: number,
): RepositoryTypecheckReadinessState {
  if (source === 'NOT_RUN') return 'TYPECHECK_NOT_RUN';
  if (errorCount > 0) return 'TYPECHECK_FAILED';
  if (warningCount > 0) return 'TYPECHECK_WARNINGS';
  return 'TYPECHECK_CLEAN';
}

function buildRecommendations(
  readinessState: RepositoryTypecheckReadinessState,
  errorCount: number,
): string[] {
  switch (readinessState) {
    case 'TYPECHECK_CLEAN':
      return ['Maintain the clean repository typecheck baseline before launch.'];
    case 'TYPECHECK_WARNINGS':
      return [
        'Review TypeScript warnings before treating the repository as launch-ready.',
        'Resolve warnings that affect founder-facing runtime paths first.',
      ];
    case 'TYPECHECK_FAILED':
      return [
        `Fix ${errorCount} TypeScript compile error(s) before launch readiness can be trusted.`,
        'Run npx tsc --noEmit and resolve every reported error with narrow type-safe fixes.',
        'Do not suppress errors or weaken tsconfig to fake readiness.',
      ];
    default:
      return [
        'Establish a repository typecheck baseline before trusting launch readiness.',
        'Run npx tsc --noEmit and supply the assessment before external launch evaluation.',
      ];
  }
}

export function assessRepositoryTypecheckReality(
  input: AssessRepositoryTypecheckRealityInput = {},
): RepositoryTypecheckAssessment {
  const source = input.source ?? (input.findings ? 'SUPPLIED' : 'NOT_RUN');
  const findings = (input.findings ?? []).slice(0, MAX_TYPECHECK_FINDINGS);
  const errorCount = input.errorCount ?? findings.filter((finding) => finding.severity === 'ERROR').length;
  const warningCount = input.warningCount ?? findings.filter((finding) => finding.severity === 'WARNING').length;
  const readinessState = deriveReadinessState(source, errorCount, warningCount);
  const typecheckClean = readinessState === 'TYPECHECK_CLEAN';
  const blocksLaunchReadiness = readinessState !== 'TYPECHECK_CLEAN';
  const recommendations = buildRecommendations(readinessState, errorCount);

  const assessment: RepositoryTypecheckAssessment = {
    readOnly: true,
    typecheckClean,
    errorCount,
    warningCount,
    checkedCommand: input.checkedCommand ?? TYPECHECK_COMMAND,
    checkedAt: input.checkedAt ?? Date.now(),
    blocksLaunchReadiness,
    readinessState,
    findings,
    recommendations,
    founderProofNotes: REPOSITORY_TYPECHECK_PROOF_NOTES,
    cacheKey: buildCacheKey(errorCount, warningCount, findings.length),
  };

  if (source !== 'NOT_RUN') {
    recordRepositoryTypecheckAssessment(assessment);
  }

  return assessment;
}

export function evaluateRepositoryTypecheckVisibility(
  assessment: RepositoryTypecheckAssessment,
): RepositoryTypecheckVisibilityScore {
  const score =
    assessment.readinessState === 'TYPECHECK_CLEAN'
      ? 100
      : assessment.readinessState === 'TYPECHECK_WARNINGS'
        ? Math.max(0, 100 - assessment.warningCount * 5)
        : assessment.readinessState === 'TYPECHECK_FAILED'
          ? Math.max(0, 100 - assessment.errorCount * 8)
          : 0;

  return {
    score,
    readinessState: assessment.readinessState,
    typecheckClean: assessment.typecheckClean,
    blocksLaunchReadiness: assessment.blocksLaunchReadiness,
    errorCount: assessment.errorCount,
    warningCount: assessment.warningCount,
    findingCount: assessment.findings.length,
    recommendations: assessment.recommendations,
  };
}

export function buildRepositoryTypecheckRealityReport(assessment: RepositoryTypecheckAssessment): string {
  return buildRepositoryTypecheckReportMarkdown(assessment);
}
