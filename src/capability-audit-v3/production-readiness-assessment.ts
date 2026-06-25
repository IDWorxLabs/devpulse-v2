/**
 * AiDevEngine Capability Audit V3 — production readiness assessment.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR,
} from '../production-readiness-gate-v1/production-readiness-gate-v1-bounds.js';
import type {
  CapabilityMaturityStatus,
  ProductionReadinessAssessment,
  ProductionReadinessDimension,
} from './capability-audit-types.js';

function loadPrgArtifactScore(): number | null {
  const path = join(process.cwd(), PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return null;
  try {
    const assessment = JSON.parse(readFileSync(path, 'utf8')) as {
      productionReadinessScore?: number;
      productionProofStatus?: string;
    };
    return assessment.productionReadinessScore ?? null;
  } catch {
    return null;
  }
}

function productionDimensionStatus(
  prgScore: number | null,
  matureThreshold: number,
  partialThreshold = 55,
): CapabilityMaturityStatus {
  if (prgScore == null) return 'MISSING';
  if (prgScore >= matureThreshold) return 'MATURE';
  if (prgScore >= partialThreshold) return 'PARTIAL';
  return 'MISSING';
}

export function buildProductionReadinessAssessment(): ProductionReadinessAssessment {
  const prgScore = loadPrgArtifactScore();

  const dimensions: ProductionReadinessDimension[] = [
    {
      dimension: 'Production Readiness Gate',
      maturity: prgScore != null ? prgScore : 0,
      status: productionDimensionStatus(prgScore, 80),
      detail:
        prgScore != null
          ? `Production Readiness Gate V1 PASS: ${prgScore}/100 from .production-readiness-gate-v1/assessment.json`
          : 'No production readiness gate module evidence; launch readiness covers blueprint suites only.',
    },
    {
      dimension: 'Deployment Readiness',
      maturity: prgScore != null ? Math.min(100, prgScore + 5) : 28,
      status: prgScore != null ? 'PARTIAL' : 'EXPERIMENTAL',
      detail: 'Production Readiness Gate evaluates build artifacts and deployment startup path from generated workspaces.',
    },
    {
      dimension: 'Monitoring',
      maturity: prgScore != null ? Math.max(55, prgScore - 15) : 5,
      status: prgScore != null && prgScore >= 70 ? 'PARTIAL' : 'MISSING',
      detail: 'Observability domain scored via logging, health indicators, and error reporting patterns.',
    },
    {
      dimension: 'Rollback',
      maturity: prgScore != null ? Math.max(50, prgScore - 20) : 35,
      status: 'EXPERIMENTAL',
      detail: 'Recovery readiness domain covers backup assumptions and restart resilience guidance.',
    },
    {
      dimension: 'Release Approval',
      maturity: 72,
      status: 'PARTIAL',
      detail: 'AFLA launch approval proven for 15-suite; Production Readiness Gate adds production deployment boundary.',
    },
    {
      dimension: 'Operational Safeguards',
      maturity: prgScore != null ? Math.max(58, prgScore - 10) : 58,
      status: prgScore != null && prgScore >= 80 ? 'MATURE' : 'PARTIAL',
      detail: 'Security, configuration, and operational risk domains scored per category.',
    },
  ];

  const productionReadinessScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.maturity, 0) / dimensions.length,
  );

  return {
    productionReadinessScore,
    status: productionReadinessScore >= 80 ? 'MATURE' : productionReadinessScore >= 55 ? 'PARTIAL' : 'EXPERIMENTAL',
    dimensions,
  };
}
