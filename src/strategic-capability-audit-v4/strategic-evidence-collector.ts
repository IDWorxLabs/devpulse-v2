/**
 * Strategic Capability Audit V4 — evidence collector (fresh, not roadmap-assumptive).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadUvlEvidenceSnapshot } from '../capability-audit-v3/uvl-evidence-loader.js';
import { loadLargeScalePipelineIntegrationSnapshot } from '../large-scale-pipeline-integration-v1/index.js';
import { isWorld2RealInstantiationProven } from '../world2-real-instantiation-v1/index.js';
import { isMobileRuntimeValidationProven } from '../mobile-runtime-validation-at-scale-v1/index.js';
import { isSelfEvolutionExecutionProven } from '../self-evolution-execution-v1/index.js';
import { isCanonicalOwnershipV2Proven } from '../canonical-ownership-v2/index.js';
import { isMultiProjectConcurrentExecutionProven } from '../multi-project-concurrent-execution-v1/index.js';
import { isUnifiedFailureEscalationProven } from '../unified-failure-escalation-authority-v1/index.js';
import { isOperationalEvidenceFreshnessProven } from '../operational-evidence-freshness-authority-v1/index.js';
import { loadOperationalEvidenceFreshnessAssessmentFromDisk } from '../operational-evidence-freshness-authority-v1/index.js';
import { loadCanonicalOwnershipV2AssessmentFromDisk } from '../canonical-ownership-v2/index.js';
import { PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR } from '../production-readiness-gate-v1/production-readiness-gate-v1-bounds.js';
import { CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR } from '../cloud-execution-path-v1/cloud-execution-path-v1-bounds.js';
import { GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR } from '../general-purpose-code-generation-v1/general-purpose-code-generation-v1-bounds.js';
import { loadCommercializationImpactFromDisk, isCustomerOperationsPlatformProven } from '../customer-operations-platform-v1/index.js';
import {
  isProductionObservabilityPlatformProven,
  loadCommercializationImpactFromObservability,
} from '../production-observability-platform-v1/index.js';
import {
  isContinuousDeploymentPipelineProven,
  loadCommercializationImpactFromDeployment,
} from '../continuous-deployment-pipeline-v1/index.js';
import {
  isEvidenceRevalidationCycleProven,
  loadEffectiveExpiredCountForStrategicAudit,
} from '../evidence-revalidation-cycle-v1/index.js';

function readAssessment(path: string): {
  passToken?: string;
  generatedAt?: string;
  productionProofStatus?: string;
} | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as {
      passToken?: string;
      generatedAt?: string;
      productionProofStatus?: string;
    };
  } catch {
    return null;
  }
}

export interface StrategicEvidenceSnapshot {
  generatedAt: string;
  uvl: ReturnType<typeof loadUvlEvidenceSnapshot>;
  pipelineIntegration: ReturnType<typeof loadLargeScalePipelineIntegrationSnapshot>;
  world2Proven: boolean;
  mobileProven: boolean;
  selfEvolutionProven: boolean;
  canonicalOwnershipProven: boolean;
  multiProjectProven: boolean;
  failureEscalationProven: boolean;
  evidenceFreshnessProven: boolean;
  productionReadiness: { proven: boolean; passToken: string | null };
  cloudExecution: { proven: boolean; passToken: string | null };
  generalPurposeCodegen: { proven: boolean; passToken: string | null };
  customerOperationsProven: boolean;
  customerOperationsCommercializationScore: number;
  productionObservabilityProven: boolean;
  productionObservabilityCommercializationScore: number;
  continuousDeploymentProven: boolean;
  continuousDeploymentCommercializationScore: number;
  evidenceRevalidationProven: boolean;
  freshness: {
    overallScore: number;
    freshCount: number;
    expiredCount: number;
    effectiveExpiredCount: number;
  } | null;
  ownership: {
    registeredCount: number;
    orphanCount: number;
    collisionCount: number;
  } | null;
  sourceSystemsConsumed: string[];
}

export function collectStrategicEvidence(projectRootDir: string): StrategicEvidenceSnapshot {
  const sourceSystemsConsumed = new Set<string>();

  const uvl = loadUvlEvidenceSnapshot(projectRootDir);
  sourceSystemsConsumed.add('UVL Verification Execution');
  sourceSystemsConsumed.add('Real Build Execution');

  const pipelineIntegration = loadLargeScalePipelineIntegrationSnapshot(projectRootDir);
  sourceSystemsConsumed.add('Large-Scale Validation');

  const world2Proven = isWorld2RealInstantiationProven(projectRootDir);
  if (world2Proven) sourceSystemsConsumed.add('World2');

  const mobileProven = isMobileRuntimeValidationProven(projectRootDir);
  if (mobileProven) sourceSystemsConsumed.add('Mobile Runtime');

  const selfEvolutionProven = isSelfEvolutionExecutionProven(projectRootDir);
  if (selfEvolutionProven) sourceSystemsConsumed.add('Self-Evolution');

  const canonicalOwnershipProven = isCanonicalOwnershipV2Proven(projectRootDir);
  if (canonicalOwnershipProven) sourceSystemsConsumed.add('Canonical Ownership V2');

  const multiProjectProven = isMultiProjectConcurrentExecutionProven(projectRootDir);
  if (multiProjectProven) sourceSystemsConsumed.add('Concurrent Execution');

  const failureEscalationProven = isUnifiedFailureEscalationProven(projectRootDir);
  if (failureEscalationProven) sourceSystemsConsumed.add('Unified Failure Escalation');

  const evidenceFreshnessProven = isOperationalEvidenceFreshnessProven(projectRootDir);
  if (evidenceFreshnessProven) sourceSystemsConsumed.add('Operational Evidence Freshness');

  const prg = readAssessment(
    join(projectRootDir, PRODUCTION_READINESS_GATE_V1_ARTIFACT_DIR, 'assessment.json'),
  );
  sourceSystemsConsumed.add('Production Readiness');

  const cloud = readAssessment(
    join(projectRootDir, CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR, 'assessment.json'),
  );
  sourceSystemsConsumed.add('Cloud Execution');

  const codegen = readAssessment(
    join(projectRootDir, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR, 'assessment.json'),
  );
  sourceSystemsConsumed.add('Code Generation');

  sourceSystemsConsumed.add('Capability Audit V3.1');
  sourceSystemsConsumed.add('Validation Runtime Governance');
  sourceSystemsConsumed.add('Product Architect Intelligence');
  sourceSystemsConsumed.add('AFLA Trust Calibration');

  const customerOperationsProven = isCustomerOperationsPlatformProven(projectRootDir);
  if (customerOperationsProven) sourceSystemsConsumed.add('Customer Operations Platform');

  const productionObservabilityProven = isProductionObservabilityPlatformProven(projectRootDir);
  if (productionObservabilityProven) sourceSystemsConsumed.add('Production Observability Platform');

  const continuousDeploymentProven = isContinuousDeploymentPipelineProven(projectRootDir);
  if (continuousDeploymentProven) sourceSystemsConsumed.add('Continuous Deployment Pipeline');

  const copImpact = loadCommercializationImpactFromDisk(projectRootDir);
  const popImpact = loadCommercializationImpactFromObservability(projectRootDir);
  const cdImpact = loadCommercializationImpactFromDeployment(projectRootDir);
  const freshnessAssessment = loadOperationalEvidenceFreshnessAssessmentFromDisk(projectRootDir);
  const ownershipAssessment = loadCanonicalOwnershipV2AssessmentFromDisk(projectRootDir);
  const evidenceRevalidationProven = isEvidenceRevalidationCycleProven(projectRootDir);
  if (evidenceRevalidationProven) sourceSystemsConsumed.add('Evidence Revalidation Cycle');

  const effectiveExpired = loadEffectiveExpiredCountForStrategicAudit(projectRootDir);

  return {
    generatedAt: new Date().toISOString(),
    uvl,
    pipelineIntegration,
    world2Proven,
    mobileProven,
    selfEvolutionProven,
    canonicalOwnershipProven,
    multiProjectProven,
    failureEscalationProven,
    evidenceFreshnessProven,
    productionReadiness: {
      proven: prg?.passToken?.includes('PASS') ?? false,
      passToken: prg?.passToken ?? null,
    },
    cloudExecution: {
      proven: cloud?.passToken?.includes('PASS') ?? false,
      passToken: cloud?.passToken ?? null,
    },
    generalPurposeCodegen: {
      proven: codegen?.passToken?.includes('PASS') ?? false,
      passToken: codegen?.passToken ?? null,
    },
    customerOperationsProven,
    customerOperationsCommercializationScore: copImpact.projectedScore,
    productionObservabilityProven,
    productionObservabilityCommercializationScore: popImpact.projectedScore,
    continuousDeploymentProven,
    continuousDeploymentCommercializationScore: cdImpact.projectedScore,
    evidenceRevalidationProven,
    freshness: freshnessAssessment
      ? {
          overallScore: freshnessAssessment.overallFreshnessScore,
          freshCount: freshnessAssessment.registry.freshCount,
          expiredCount: freshnessAssessment.registry.expiredCount,
          effectiveExpiredCount: effectiveExpired.effectiveExpiredCount,
        }
      : null,
    ownership: ownershipAssessment
      ? {
          registeredCount: ownershipAssessment.registeredCapabilities,
          orphanCount: ownershipAssessment.orphanCapabilities.length,
          collisionCount: ownershipAssessment.ownershipCollisions.length,
        }
      : null,
    sourceSystemsConsumed: [...sourceSystemsConsumed],
  };
}
