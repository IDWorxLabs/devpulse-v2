/**
 * AiDevEngine Capability Audit V3 — missing capabilities report (evidence-driven).
 */

import type { MissingCapabilitiesReport } from './capability-audit-types.js';
import { computeHighestPriorityGap } from './gap-priority-calculator.js';
import { loadUvlEvidenceSnapshot } from './uvl-evidence-loader.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR } from '../production-readiness-gate-v1/production-readiness-gate-v1-bounds.js';
import { CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR } from '../cloud-execution-path-v1/cloud-execution-path-v1-bounds.js';
import { GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR } from '../general-purpose-code-generation-v1/general-purpose-code-generation-v1-bounds.js';
import { loadLargeScalePipelineIntegrationSnapshot } from '../large-scale-pipeline-integration-v1/index.js';
import { isWorld2RealInstantiationProven } from '../world2-real-instantiation-v1/index.js';
import { isMobileRuntimeValidationProven } from '../mobile-runtime-validation-at-scale-v1/index.js';

const BASE_MISSING_CAPABILITIES: readonly MissingCapabilitiesReport['entries'][number][] = [
  {
    capability: 'Production readiness gate',
    severity: 'BLOCKING',
    focusArea: 'Production Readiness',
    detail:
      'Launch readiness validates blueprint suites; production deployment readiness unvalidated.',
  },
  {
    capability: 'Cloud runtime production deployment',
    severity: 'BLOCKING',
    focusArea: 'Cloud Execution',
    detail: 'No validated cloud execution or production deployment path.',
  },
  {
    capability: 'General-purpose code generation beyond CRUD profiles',
    severity: 'HIGH',
    focusArea: 'Code Generation',
    detail: 'Code Generation Engine V1 limited to 5 web CRUD profiles; blocks 58-category diversity.',
  },
  {
    capability: 'Large-scale pipeline integration with Real Build Execution',
    severity: 'HIGH',
    focusArea: 'Multi-Project Scale',
    detail:
      'Large-scale validation shows 0% buildSuccessRate in its harness despite Real Build Execution V1.1 proving 100% for 15 categories.',
  },
  {
    capability: 'World2 real filesystem instantiation',
    severity: 'HIGH',
    focusArea: 'World2',
    detail: 'Dry-run composer bridge sets realExecutionPerformed=false; execution proven outside World2 boundary.',
  },
  {
    capability: 'Canonical ownership registration for V2/V3 modules',
    severity: 'MEDIUM',
    focusArea: 'Self-Evolution',
    detail:
      'Real Build Execution Pipeline V1/V1.1, UVL Verification Execution V1, CQI Maturity V1, Capability Audit V2 not in ownership registry.',
  },
  {
    capability: 'Mobile runtime validation at scale',
    severity: 'HIGH',
    focusArea: 'Mobile Runtime Validation',
    detail: 'Mobile preview modes exist; no large-scale mobile runtime validation harness.',
  },
  {
    capability: 'Self-modification execution',
    severity: 'HIGH',
    focusArea: 'Self-Evolution',
    detail: 'Self-evolution and gap detection are advisory; no automated capability modification.',
  },
  {
    capability: 'Parallel build execution',
    severity: 'MEDIUM',
    focusArea: 'Multi-Project Scale',
    detail: 'Parallel Build Orchestration is planning-only; no concurrent build execution.',
  },
  {
    capability: 'Operational monitoring for deployed apps',
    severity: 'MEDIUM',
    focusArea: 'Production Readiness',
    detail: 'No observability stack for generated applications in production.',
  },
  {
    capability: 'Unified failure escalation authority',
    severity: 'MEDIUM',
    focusArea: 'Self-Evolution',
    detail: 'Partial coverage via repair loop and self-evolution triggers; no single escalation owner.',
  },
];

export function buildMissingCapabilitiesReport(input?: {
  projectRootDir?: string;
  productionReadinessScore?: number;
  codeGenerationMaturityScore?: number;
}): MissingCapabilitiesReport {
  const uvlEvidence = loadUvlEvidenceSnapshot(input?.projectRootDir);
  const root = input?.projectRootDir ?? process.cwd();
  const productionGateProven = existsSync(
    join(root, PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR, 'assessment.json'),
  );
  const cloudExecutionProven = existsSync(
    join(root, CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR, 'assessment.json'),
  );
  const generalPurposeCodegenProven = existsSync(
    join(root, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR, 'assessment.json'),
  );
  const pipelineIntegration = loadLargeScalePipelineIntegrationSnapshot(root);
  const entries = BASE_MISSING_CAPABILITIES.filter((entry) => {
    if (
      uvlEvidence.uvlVerificationExecutionComplete &&
      (entry.capability === 'UVL full verification execution' ||
        entry.capability.toLowerCase().includes('uvl'))
    ) {
      return false;
    }
    if (
      productionGateProven &&
      (entry.capability === 'Production readiness gate' ||
        entry.capability === 'Operational monitoring for deployed apps')
    ) {
      return false;
    }
    if (
      cloudExecutionProven &&
      entry.capability === 'Cloud runtime production deployment'
    ) {
      return false;
    }
    if (
      generalPurposeCodegenProven &&
      entry.capability === 'General-purpose code generation beyond CRUD profiles'
    ) {
      return false;
    }
    if (
      pipelineIntegration.integrationComplete &&
      entry.capability === 'Large-scale pipeline integration with Real Build Execution'
    ) {
      return false;
    }
    if (
      isWorld2RealInstantiationProven(root) &&
      entry.capability === 'World2 real filesystem instantiation'
    ) {
      return false;
    }
    if (
      isMobileRuntimeValidationProven(root) &&
      entry.capability === 'Mobile runtime validation at scale'
    ) {
      return false;
    }
    return true;
  });

  const context = {
    productionReadinessScore: input?.productionReadinessScore ?? 33,
    codeGenerationMaturityScore: input?.codeGenerationMaturityScore ?? 58,
  };

  return {
    generatedAt: new Date().toISOString(),
    blockingVision: entries.filter((e) => e.severity === 'BLOCKING').map((e) => e.capability),
    stillWeak: entries
      .filter((e) => e.severity === 'HIGH' || e.severity === 'MEDIUM')
      .map((e) => e.capability),
    entries,
    highestPriorityGap: computeHighestPriorityGap(entries, context),
  };
}

export const MISSING_CAPABILITIES_V3 = BASE_MISSING_CAPABILITIES;
