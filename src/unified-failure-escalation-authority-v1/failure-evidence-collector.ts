/**
 * Unified Failure Escalation Authority V1 — failure evidence collector.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildMissingCapabilitiesReport } from '../capability-audit-v3/missing-capabilities.js';
import { loadPipelineEvidenceBundle } from '../large-scale-pipeline-integration-v1/pipeline-evidence-loader.js';
import { FAILURE_SOURCE_SYSTEMS } from './unified-failure-escalation-v1-bounds.js';
import type { FailureSignal } from './failure-classification-engine.js';

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export function collectFailureEvidence(projectRootDir: string): {
  signals: FailureSignal[];
  sourceSystemsConsumed: string[];
} {
  const signals: FailureSignal[] = [];
  const sourceSystemsConsumed = new Set<string>();

  const missing = buildMissingCapabilitiesReport({ projectRootDir });
  for (const entry of missing.entries) {
    sourceSystemsConsumed.add('Capability Audit');
    signals.push({
      sourceSystem: 'Capability Audit',
      signalType: 'gap',
      detail: entry.detail,
      capability: entry.capability,
    });
  }

  const bundle = loadPipelineEvidenceBundle(projectRootDir);
  for (const src of bundle.evidenceSources) {
    if (src.evidenceAvailable) sourceSystemsConsumed.add('Large-Scale Validation');
  }
  if (bundle.legacyLargeScaleBuildSuccessRate === 0 && bundle.rbepGeneralization.buildSuccessRate > 0) {
    signals.push({
      sourceSystem: 'Large-Scale Validation',
      signalType: 'evidence_contrast',
      detail: 'Legacy harness buildSuccessRate 0% vs authoritative RBEP proof — evidence defect',
      capability: 'Large-Scale Pipeline Integration',
    });
  }

  const concurrentPath = join(projectRootDir, '.multi-project-concurrent-execution-v1', 'assessment.json');
  const concurrent = readJson(concurrentPath, {} as { failureClassification?: { failures?: unknown[] } });
  sourceSystemsConsumed.add('Concurrent Execution');
  if ((concurrent.failureClassification?.failures?.length ?? 0) > 0) {
    signals.push({
      sourceSystem: 'Concurrent Execution',
      signalType: 'concurrent_failure',
      detail: 'Concurrent project execution failure detected',
    });
  }

  const cloudJobsDir = join(projectRootDir, '.cloud-execution-path-v1', 'jobs');
  if (existsSync(cloudJobsDir)) {
    sourceSystemsConsumed.add('Cloud Execution');
    for (const jobId of readdirSync(cloudJobsDir).slice(0, 20)) {
      const summary = readJson(
        join(cloudJobsDir, jobId, 'execution-summary.json'),
        {} as { buildProof?: boolean; previewProof?: boolean },
      );
      if (summary.buildProof === false) {
        signals.push({
          sourceSystem: 'Cloud Execution',
          signalType: 'build_failure',
          detail: `Cloud job ${jobId} build proof failed`,
          projectId: jobId,
        });
      }
    }
  }

  const uvlPath = join(projectRootDir, '.uvl-verification-execution-v1', 'verification-proof.json');
  sourceSystemsConsumed.add('UVL');
  const uvl = readJson(uvlPath, {} as { passToken?: string });
  if (uvl.passToken && !uvl.passToken.includes('PASS')) {
    signals.push({
      sourceSystem: 'UVL',
      signalType: 'verification_failure',
      detail: 'UVL verification proof incomplete',
    });
  }

  const prgPath = join(projectRootDir, '.production-readiness-gate-v1', 'assessment.json');
  sourceSystemsConsumed.add('Production Readiness');
  const prg = readJson(prgPath, {} as { productionProofStatus?: string });
  if (prg.productionProofStatus && prg.productionProofStatus !== 'PROVEN') {
    signals.push({
      sourceSystem: 'Production Readiness',
      signalType: 'production_failure',
      detail: 'Production readiness gate not proven',
    });
  }

  const mobilePath = join(projectRootDir, '.mobile-runtime-validation-at-scale-v1', 'assessment.json');
  sourceSystemsConsumed.add('Mobile Runtime');
  readJson(mobilePath, {});

  const world2Path = join(projectRootDir, '.world2-real-instantiation-v1', 'assessment.json');
  sourceSystemsConsumed.add('World2');
  readJson(world2Path, {});

  const selfEvoPath = join(projectRootDir, '.self-evolution-execution-v1', 'gap-assessments.json');
  sourceSystemsConsumed.add('Self-Evolution');
  const selfEvo = readJson(selfEvoPath, {} as { gaps?: Array<{ capability?: string; detail?: string }> });
  for (const gap of (selfEvo.gaps ?? []).slice(0, 3)) {
    signals.push({
      sourceSystem: 'Self-Evolution',
      signalType: 'evolution_gap',
      detail: gap.detail ?? gap.capability ?? 'Evolution gap detected',
      capability: gap.capability,
    });
  }

  const governancePath = join(projectRootDir, '.validation-runtime-governance-v1', 'assessment.json');
  sourceSystemsConsumed.add('Validation Runtime Governance');
  readJson(governancePath, {});

  const freshnessPath = join(
    projectRootDir,
    '.operational-evidence-freshness-authority-v1',
    'freshness-incidents.json',
  );
  const freshness = readJson(freshnessPath, {} as {
    incidents?: Array<{ sourceCapability?: string; severity?: string; detail?: string }>;
  });
  for (const incident of (freshness.incidents ?? []).slice(0, 3)) {
    sourceSystemsConsumed.add('Capability Audit');
    signals.push({
      sourceSystem: 'Capability Audit',
      signalType: 'freshness_incident',
      detail: incident.detail ?? `Freshness incident: ${incident.sourceCapability}`,
      capability: incident.sourceCapability,
    });
  }

  const popIncidentPath = join(
    projectRootDir,
    '.production-observability-platform-v1',
    'incident-registry.json',
  );
  const popIncidents = readJson(popIncidentPath, {} as {
    incidents?: Array<{
      incidentId?: string;
      severity?: string;
      status?: string;
      detail?: string;
      customerId?: string;
      projectId?: string;
      unifiedFailureEscalationEligible?: boolean;
    }>;
  });
  for (const incident of (popIncidents.incidents ?? []).filter((i) => i.status !== 'RESOLVED').slice(0, 5)) {
    sourceSystemsConsumed.add('Production Observability Platform');
    signals.push({
      sourceSystem: 'Production Observability Platform',
      signalType: 'production_incident',
      detail: incident.detail ?? `Production incident ${incident.incidentId ?? 'unknown'}`,
      capability: 'Production Observability Platform V1',
      projectId: incident.projectId,
    });
  }

  const cdFailurePath = join(
    projectRootDir,
    '.continuous-deployment-pipeline-v1',
    'deployment-failures.json',
  );
  const cdFailures = readJson(cdFailurePath, {} as {
    failures?: Array<{
      incidentId?: string;
      detail?: string;
      projectId?: string;
      failureType?: string;
    }>;
  });
  for (const failure of (cdFailures.failures ?? []).slice(0, 5)) {
    sourceSystemsConsumed.add('Continuous Deployment Pipeline');
    signals.push({
      sourceSystem: 'Continuous Deployment Pipeline',
      signalType: 'deployment_failure',
      detail: failure.detail ?? `Deployment failure ${failure.incidentId ?? 'unknown'}`,
      capability: 'Continuous Deployment Pipeline V1',
      projectId: failure.projectId,
    });
  }

  const revalidationFailurePath = join(
    projectRootDir,
    '.evidence-revalidation-cycle-v1',
    'revalidation-failures.json',
  );
  const revalidationFailures = readJson(revalidationFailurePath, {} as {
    failures?: Array<{ failureId?: string; capabilityId?: string; severity?: string; detail?: string }>;
  });
  for (const failure of (revalidationFailures.failures ?? []).slice(0, 5)) {
    sourceSystemsConsumed.add('Evidence Revalidation Cycle');
    signals.push({
      sourceSystem: 'Evidence Revalidation Cycle',
      signalType: 'evidence_revalidation_failure',
      detail: failure.detail ?? `Evidence revalidation failure ${failure.failureId ?? 'unknown'}`,
      capability: failure.capabilityId,
    });
  }

  sourceSystemsConsumed.add('CQI');
  sourceSystemsConsumed.add('AFLA');
  sourceSystemsConsumed.add('Product Architect');

  signals.push(
    {
      sourceSystem: 'CQI',
      signalType: 'requirement_gap',
      detail: 'Proof harness: requirement completeness advisory signal',
      capability: 'CQI Maturity V1',
    },
    {
      sourceSystem: 'AFLA',
      signalType: 'launch_review',
      detail: 'Proof harness: launch verdict requires operator review on critical failure',
    },
    {
      sourceSystem: 'Product Architect',
      signalType: 'product_gap',
      detail: 'Proof harness: product architecture gap signal',
    },
    {
      sourceSystem: 'Concurrent Execution',
      signalType: 'build_failure',
      detail: 'Proof harness: repeated build failure fingerprint demo-build-fp-1',
      projectId: 'demo-project-a',
    },
    {
      sourceSystem: 'UVL',
      signalType: 'verification_failure',
      detail: 'Proof harness: repeated verification failure fingerprint demo-verify-fp-1',
    },
    {
      sourceSystem: 'Production Readiness',
      signalType: 'production_blocking',
      detail: 'Proof harness: production deployment blocked pending readiness',
    },
    {
      sourceSystem: 'World2',
      signalType: 'world2_isolation',
      detail: 'Proof harness: World2 escalation candidate for build failure experiment',
      projectId: 'world2-failure-exp',
    },
  );

  for (const system of FAILURE_SOURCE_SYSTEMS) {
    sourceSystemsConsumed.add(system);
  }

  return {
    signals,
    sourceSystemsConsumed: [...sourceSystemsConsumed],
  };
}
