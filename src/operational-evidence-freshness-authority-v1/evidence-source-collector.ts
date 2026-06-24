/**
 * Operational Evidence Freshness Authority V1 — evidence source collector.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { EvidenceSourceSystem } from './operational-evidence-freshness-v1-types.js';

export interface RawEvidenceSource {
  evidenceId: string;
  sourceSystem: EvidenceSourceSystem;
  sourceCapability: string;
  artifactPath: string;
  expectedPassToken?: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  executionProofCoverage?: number;
  validationFrequencyPerMonth?: number;
  projectId?: string;
  criticalProofMonitor?: string;
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

const EVIDENCE_CATALOG: readonly Omit<RawEvidenceSource, 'artifactPath'>[] = [
  {
    evidenceId: 'capability-audit-v3-1',
    sourceSystem: 'Capability Audit V3.1',
    sourceCapability: 'Capability Audit V3.1',
    expectedPassToken: 'AIDEVENGINE_CAPABILITY_AUDIT_V3_1_PASS',
    criticality: 'HIGH',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 4,
    criticalProofMonitor: 'Verification Proof',
  },
  {
    evidenceId: 'cqi-maturity-v1',
    sourceSystem: 'CQI Maturity',
    sourceCapability: 'CQI Maturity V1',
    expectedPassToken: 'CQI_MATURITY_V1_PASS',
    criticality: 'MEDIUM',
    executionProofCoverage: 85,
    validationFrequencyPerMonth: 2,
  },
  {
    evidenceId: 'uvl-verification-execution-v1',
    sourceSystem: 'UVL Verification Execution',
    sourceCapability: 'UVL Verification Execution V1',
    expectedPassToken: 'UVL_VERIFICATION_EXECUTION_V1_PASS',
    criticality: 'CRITICAL',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 4,
    criticalProofMonitor: 'Verification Proof',
  },
  {
    evidenceId: 'real-build-execution-v1-1',
    sourceSystem: 'Real Build Execution',
    sourceCapability: 'Real Build Execution Pipeline V1.1',
    expectedPassToken: 'REAL_BUILD_EXECUTION_PIPELINE_V1_1_PASS',
    criticality: 'CRITICAL',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 4,
    criticalProofMonitor: 'Build Proof',
  },
  {
    evidenceId: 'afla-trust-calibration-v1',
    sourceSystem: 'AFLA Trust Calibration',
    sourceCapability: 'AFLA Trust Calibration V1',
    criticality: 'HIGH',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 2,
  },
  {
    evidenceId: 'product-architect-intelligence-v1',
    sourceSystem: 'Product Architect Intelligence',
    sourceCapability: 'Product Architect Intelligence V1',
    criticality: 'MEDIUM',
    executionProofCoverage: 90,
    validationFrequencyPerMonth: 2,
  },
  {
    evidenceId: 'production-readiness-gate-v1',
    sourceSystem: 'Production Readiness',
    sourceCapability: 'Production Readiness Gate V1',
    expectedPassToken: 'PRODUCTION_READINESS_GATE_V1_PASS',
    criticality: 'CRITICAL',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 2,
    criticalProofMonitor: 'Production Proof',
  },
  {
    evidenceId: 'cloud-execution-path-v1',
    sourceSystem: 'Cloud Execution',
    sourceCapability: 'Cloud Execution Path V1',
    expectedPassToken: 'CLOUD_EXECUTION_PATH_V1_PASS',
    criticality: 'HIGH',
    executionProofCoverage: 95,
    validationFrequencyPerMonth: 2,
    criticalProofMonitor: 'Cloud Proof',
  },
  {
    evidenceId: 'world2-real-instantiation-v1',
    sourceSystem: 'World2',
    sourceCapability: 'World2 Real Instantiation V1',
    expectedPassToken: 'WORLD2_REAL_INSTANTIATION_V1_PASS',
    criticality: 'HIGH',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 3,
    criticalProofMonitor: 'World2 Proof',
  },
  {
    evidenceId: 'mobile-runtime-validation-at-scale-v1',
    sourceSystem: 'Mobile Runtime Validation',
    sourceCapability: 'Mobile Runtime Validation at Scale V1',
    expectedPassToken: 'MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS',
    criticality: 'HIGH',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 2,
    criticalProofMonitor: 'Mobile Proof',
  },
  {
    evidenceId: 'large-scale-pipeline-integration-v1',
    sourceSystem: 'Large-Scale Validation',
    sourceCapability: 'Large-Scale Pipeline Integration V1',
    expectedPassToken: 'LARGE_SCALE_PIPELINE_INTEGRATION_V1_PASS',
    criticality: 'HIGH',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 2,
  },
  {
    evidenceId: 'multi-project-concurrent-execution-v1',
    sourceSystem: 'Concurrent Execution',
    sourceCapability: 'Multi-Project Concurrent Execution V1',
    expectedPassToken: 'MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS',
    criticality: 'MEDIUM',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 2,
    criticalProofMonitor: 'Concurrent Proof',
  },
  {
    evidenceId: 'self-evolution-execution-v1',
    sourceSystem: 'Self-Evolution',
    sourceCapability: 'Self-Evolution Execution V1',
    expectedPassToken: 'SELF_EVOLUTION_EXECUTION_V1_PASS',
    criticality: 'MEDIUM',
    executionProofCoverage: 90,
    validationFrequencyPerMonth: 1,
    criticalProofMonitor: 'Self-Evolution Proof',
  },
  {
    evidenceId: 'unified-failure-escalation-authority-v1',
    sourceSystem: 'Unified Failure Escalation',
    sourceCapability: 'Unified Failure Escalation Authority V1',
    expectedPassToken: 'UNIFIED_FAILURE_ESCALATION_AUTHORITY_V1_PASS',
    criticality: 'MEDIUM',
    executionProofCoverage: 95,
    validationFrequencyPerMonth: 2,
  },
  {
    evidenceId: 'canonical-ownership-v2',
    sourceSystem: 'Canonical Ownership V2',
    sourceCapability: 'Canonical Ownership V2 Registration',
    expectedPassToken: 'CANONICAL_OWNERSHIP_V2_PASS',
    criticality: 'HIGH',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 2,
  },
  {
    evidenceId: 'validation-runtime-governance-v1',
    sourceSystem: 'Validation Runtime Governance',
    sourceCapability: 'Validation Runtime Governance V1',
    expectedPassToken: 'VALIDATION_RUNTIME_GOVERNANCE_V1_PASS',
    criticality: 'HIGH',
    executionProofCoverage: 100,
    validationFrequencyPerMonth: 4,
  },
];

const ARTIFACT_DIR_BY_ID: Record<string, string> = {
  'capability-audit-v3-1': '.capability-audit-v3-1',
  'cqi-maturity-v1': '.cqi-maturity-v1',
  'uvl-verification-execution-v1': '.uvl-verification-execution-v1',
  'real-build-execution-v1-1': '.real-build-execution-pipeline-v1-1',
  'afla-trust-calibration-v1': '.afla-trust-calibration-v1',
  'product-architect-intelligence-v1': '.product-architect-intelligence-v1',
  'production-readiness-gate-v1': '.production-readiness-gate-v1',
  'cloud-execution-path-v1': '.cloud-execution-path-v1',
  'world2-real-instantiation-v1': '.world2-real-instantiation-v1',
  'mobile-runtime-validation-at-scale-v1': '.mobile-runtime-validation-at-scale-v1',
  'large-scale-pipeline-integration-v1': '.large-scale-pipeline-integration-v1',
  'multi-project-concurrent-execution-v1': '.multi-project-concurrent-execution-v1',
  'self-evolution-execution-v1': '.self-evolution-execution-v1',
  'unified-failure-escalation-authority-v1': '.unified-failure-escalation-authority-v1',
  'canonical-ownership-v2': '.canonical-ownership-v2',
  'validation-runtime-governance-v1': '.validation-runtime-governance-v1',
};

export interface CollectedEvidenceArtifact {
  raw: RawEvidenceSource;
  artifactExists: boolean;
  generatedAt: string | null;
  lastValidatedAt: string | null;
  passToken: string | null;
  version: string | null;
}

export function collectEvidenceArtifacts(projectRootDir: string): {
  artifacts: CollectedEvidenceArtifact[];
  sourceSystemsConsumed: string[];
} {
  const artifacts: CollectedEvidenceArtifact[] = [];
  const sourceSystemsConsumed = new Set<string>();

  for (const entry of EVIDENCE_CATALOG) {
    const dir = ARTIFACT_DIR_BY_ID[entry.evidenceId];
    const artifactPath = join(projectRootDir, dir, 'assessment.json');
    const data = readJson(artifactPath, {} as {
      generatedAt?: string;
      passToken?: string;
      version?: string;
    });

    sourceSystemsConsumed.add(entry.sourceSystem);
    artifacts.push({
      raw: { ...entry, artifactPath },
      artifactExists: existsSync(artifactPath),
      generatedAt: data.generatedAt ?? null,
      lastValidatedAt: data.generatedAt ?? null,
      passToken: data.passToken ?? null,
      version: data.version ?? null,
    });
  }

  const concurrentPath = join(
    projectRootDir,
    '.multi-project-concurrent-execution-v1',
    'concurrent-execution-results.json',
  );
  const concurrent = readJson(concurrentPath, {} as {
    results?: Array<{ projectId?: string; profile?: string; completedAt?: string; passToken?: string }>;
  });

  for (const result of concurrent.results ?? []) {
    if (!result.projectId) continue;
    sourceSystemsConsumed.add('Concurrent Execution');
    artifacts.push({
      raw: {
        evidenceId: `concurrent-${result.projectId}`,
        sourceSystem: 'Concurrent Execution',
        sourceCapability: 'Multi-Project Concurrent Execution V1',
        artifactPath: concurrentPath,
        expectedPassToken: 'MULTI_PROJECT_CONCURRENT_EXECUTION_V1_PASS',
        criticality: 'MEDIUM',
        executionProofCoverage: 100,
        validationFrequencyPerMonth: 2,
        projectId: result.projectId,
        criticalProofMonitor: 'Concurrent Proof',
      },
      artifactExists: true,
      generatedAt: result.completedAt ?? null,
      lastValidatedAt: result.completedAt ?? null,
      passToken: result.passToken ?? null,
      version: 'V1',
    });
  }

  return {
    artifacts,
    sourceSystemsConsumed: [...sourceSystemsConsumed],
  };
}

export function listEvidenceCatalog(): readonly Omit<RawEvidenceSource, 'artifactPath'>[] {
  return EVIDENCE_CATALOG;
}
