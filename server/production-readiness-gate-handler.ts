/**
 * Production Readiness Gate Operator API — read-only production readiness visibility.
 */

import {
  getLastProductionReadinessGateAssessment,
  listProductionReadinessGateHistory,
  PRODUCTION_READINESS_GATE_V1_PASS_TOKEN,
  runProductionReadinessGateV1,
} from '../src/production-readiness-gate-v1/index.js';
import { runProductionReadinessGateV1 } from '../src/production-readiness-gate-v1/index.js';
import type { ProductionReadinessGateV1Assessment } from '../src/production-readiness-gate-v1/production-readiness-gate-v1-types.js';
import { listRealBuildSuiteProfiles } from '../src/real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export { PRODUCTION_READINESS_GATE_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export type ProductionReadinessGateAssessment = ProductionReadinessGateV1Assessment;

export interface ProductionReadinessPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_production_readiness_gate_v1';
  canonicalOwner: 'Production Readiness Gate V1';
  profile: string | null;
  productName: string | null;
  overallScore: number;
  verdict: string;
  passToken: string;
  launchChainComplete: boolean;
  domainScores: readonly {
    domainId: string;
    label: string;
    score: number;
    status: string;
  }[];
  productionRisks: readonly {
    level: string;
    domainId: string;
    summary: string;
    remediation: string;
  }[];
  missingRequirements: readonly string[];
  hardeningRecommendations: readonly {
    priority: string;
    title: string;
    action: string;
  }[];
  productionMatrix: {
    averageScore: number;
    categoriesEvaluated: number;
    categoriesRequired: number;
    productionReadyCount: number;
    withWarningsCount: number;
    entries: readonly {
      profile: string;
      productName: string;
      overallScore: number;
      verdict: string;
    }[];
  };
  evidence: {
    buildProven: boolean;
    previewProven: boolean;
    verificationProven: boolean;
    launchReady: boolean;
    operationalRequirementsSatisfied: boolean;
    consumedEvidenceSources: readonly string[];
  };
  history: readonly {
    runId: string;
    profile: string | null;
    productName: string | null;
    overallScore: number;
    verdict: string;
    timestamp: string;
  }[];
  assessment: ProductionReadinessGateAssessment | null;
}

function mapAssessmentToPayload(
  assessment: ProductionReadinessGateV1Assessment,
  profile: string | null,
): ProductionReadinessPayload {
  const category =
    profile != null
      ? assessment.categoryResults.find((r) => r.profile === profile) ?? assessment.categoryResults[0]
      : assessment.categoryResults[0];

  const matrix = assessment.productionMatrix;
  const productionReadyCount = matrix.filter(
    (e) => e.verdict === 'PRODUCTION_READY' || e.verdict === 'PRODUCTION_READY_WITH_WARNINGS',
  ).length;
  const withWarningsCount = matrix.filter((e) => e.verdict === 'PRODUCTION_READY_WITH_WARNINGS').length;

  const upstream = category?.upstreamEvidence;

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_production_readiness_gate_v1',
    canonicalOwner: 'Production Readiness Gate V1',
    profile: category?.profile ?? profile,
    productName: category?.productName ?? null,
    overallScore: assessment.productionReadinessScore,
    verdict: assessment.productionReadinessVerdict,
    passToken: assessment.passToken,
    launchChainComplete: Boolean(
      upstream?.buildProven &&
        upstream.previewProven &&
        upstream.verificationProven &&
        upstream.launchReady,
    ),
    domainScores: assessment.domainScores.domains.map((d) => ({
      domainId: d.domain,
      label: d.label,
      score: d.score,
      status: d.status,
    })),
    productionRisks: assessment.riskAnalysis.map((r) => ({
      level: r.riskLevel,
      domainId: r.category,
      summary: r.detail,
      remediation: r.recommendation,
    })),
    missingRequirements: category?.missingRequirements ?? [],
    hardeningRecommendations: assessment.hardeningRecommendations.map((action, index) => ({
      priority: index === 0 ? 'HIGH' : 'MEDIUM',
      title: `Hardening ${index + 1}`,
      action,
    })),
    productionMatrix: {
      averageScore: assessment.productionReadinessScore,
      categoriesEvaluated: assessment.categoriesEvaluated,
      categoriesRequired: 15,
      productionReadyCount,
      withWarningsCount,
      entries: matrix.map((e) => ({
        profile: e.profile,
        productName: e.productName,
        overallScore: e.productionReadinessScore,
        verdict: e.verdict,
      })),
    },
    evidence: {
      buildProven: upstream?.buildProven ?? false,
      previewProven: upstream?.previewProven ?? false,
      verificationProven: upstream?.verificationProven ?? false,
      launchReady: upstream?.launchReady ?? false,
      operationalRequirementsSatisfied: category?.operationalRequirementsSatisfied ?? false,
      consumedEvidenceSources: upstream?.evidenceSources ?? [],
    },
    history: listProductionReadinessGateHistory().map((entry, index) => ({
      runId: `prg-${index + 1}`,
      profile: entry.categoryResults[0]?.profile ?? null,
      productName: entry.categoryResults[0]?.productName ?? null,
      overallScore: entry.productionReadinessScore,
      verdict: entry.productionReadinessVerdict,
      timestamp: entry.generatedAt,
    })),
    assessment,
  };
}

export function assessProductionReadinessGate(input?: {
  projectRootDir?: string;
  profile?: string | null;
  productPrompt?: string | null;
  productName?: string | null;
}): ProductionReadinessGateV1Assessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  return runProductionReadinessGateV1({
    projectRootDir,
    profiles: input?.profile ? [input.profile] : undefined,
  });
}

export function getLastProductionReadinessAssessment(): ProductionReadinessGateV1Assessment | null {
  return getLastProductionReadinessGateAssessment();
}

export function listProductionReadinessHistory(): ReturnType<
  typeof mapAssessmentToPayload
>['history'] {
  return listProductionReadinessGateHistory().map((entry, index) => ({
    runId: `prg-${index + 1}`,
    profile: entry.categoryResults[0]?.profile ?? null,
    productName: entry.categoryResults[0]?.productName ?? null,
    overallScore: entry.productionReadinessScore,
    verdict: entry.productionReadinessVerdict,
    timestamp: entry.generatedAt,
  }));
}

export function buildProductionReadinessPayload(input?: {
  profile?: string | null;
  prompt?: string | null;
  refresh?: boolean;
  projectRootDir?: string;
}): ProductionReadinessPayload {
  const assessment =
    input?.refresh || !getLastProductionReadinessGateAssessment()
      ? assessProductionReadinessGate({
          projectRootDir: input?.projectRootDir,
          profile: input?.profile ?? null,
          productPrompt: input?.prompt ?? null,
        })
      : getLastProductionReadinessGateAssessment()!;

  return mapAssessmentToPayload(assessment, input?.profile ?? null);
}

export function sendProductionReadinessJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  profile: string | null,
  prompt: string | null,
): void {
  const payload = buildProductionReadinessPayload({ profile, prompt });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'production-readiness-gate',
    'X-DevPulse-Canonical-Owner': 'Production Readiness Gate V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

export function sendProductionReadinessGateV1Json(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
  projectRootDir?: string,
): void {
  const payload = buildProductionReadinessPayload({ refresh, projectRootDir });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'production-readiness-gate-v1',
    'X-DevPulse-Canonical-Owner': 'Production Readiness Gate V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}

export function listProductionReadinessProfiles(): readonly string[] {
  return listRealBuildSuiteProfiles();
}
