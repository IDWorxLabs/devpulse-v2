/**
 * Continuous Deployment Pipeline V1 — deployment candidates from Customer Operations + Cloud Execution.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEMO_CUSTOMER_SUITE } from '../customer-operations-platform-v1/customer-platform-registry.js';
import { CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR } from '../cloud-execution-path-v1/cloud-execution-path-v1-bounds.js';
import type {
  DeploymentCandidate,
  DeploymentFailureIncident,
  DeploymentLifecycleEntry,
  DeploymentLifecycleStage,
  ProductionDeploymentHistoryEntry,
  PromotionDecisionRecord,
  StagingDeploymentAssessment,
} from './continuous-deployment-pipeline-v1-types.js';

const LIFECYCLE_ORDER: readonly DeploymentLifecycleStage[] = [
  'SOURCE_CHANGE',
  'BUILD_COMPLETE',
  'VERIFICATION_COMPLETE',
  'PRODUCTION_READY',
  'DEPLOYMENT_CANDIDATE',
  'STAGING_DEPLOYED',
  'PRODUCTION_DEPLOYED',
  'OBSERVABILITY_VALIDATED',
  'COMPLETED',
];

const CANDIDATE_OVERRIDES: Record<
  string,
  {
    finalStage: DeploymentLifecycleStage;
    status: DeploymentCandidate['status'];
    stagingOnly?: boolean;
    health: ProductionDeploymentHistoryEntry['deploymentHealth'];
  }
> = {
  'proj-acme-task-tracker': { finalStage: 'COMPLETED', status: 'COMPLETED', health: 'HEALTHY' },
  'proj-acme-crm': { finalStage: 'COMPLETED', status: 'COMPLETED', health: 'HEALTHY' },
  'proj-nova-marketplace': { finalStage: 'OBSERVABILITY_VALIDATED', status: 'VALIDATED', health: 'DEGRADED' },
  'proj-nova-pm': { finalStage: 'STAGING_DEPLOYED', status: 'STAGING', stagingOnly: true, health: 'HEALTHY' },
  'proj-starter-booking': { finalStage: 'ROLLED_BACK', status: 'ROLLED_BACK', health: 'FAILED' },
};

function loadCloudJobSummaries(projectRootDir: string): Map<string, { jobId: string; buildProof: boolean }> {
  const map = new Map<string, { jobId: string; buildProof: boolean }>();
  const jobsDir = join(projectRootDir, CLOUD_EXECUTION_PATH_V1_ARTIFACT_DIR, 'jobs');
  if (!existsSync(jobsDir)) return map;

  for (const jobId of readdirSync(jobsDir).slice(0, 20)) {
    const summaryPath = join(jobsDir, jobId, 'execution-summary.json');
    if (!existsSync(summaryPath)) continue;
    try {
      const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as {
        profile?: string;
        buildProof?: boolean;
      };
      if (summary.profile) {
        map.set(summary.profile, { jobId, buildProof: summary.buildProof !== false });
      }
    } catch {
      /* skip malformed */
    }
  }
  return map;
}

function stagesUpTo(target: DeploymentLifecycleStage): DeploymentLifecycleStage[] {
  if (target === 'ROLLED_BACK') {
    return [...LIFECYCLE_ORDER.slice(0, 7), 'ROLLED_BACK'];
  }
  const idx = LIFECYCLE_ORDER.indexOf(target);
  if (idx < 0) return [...LIFECYCLE_ORDER];
  return LIFECYCLE_ORDER.slice(0, idx + 1);
}

export function buildDeploymentCandidates(
  projectRootDir: string,
  now = new Date(),
): DeploymentCandidate[] {
  const iso = now.toISOString();
  const cloudJobs = loadCloudJobSummaries(projectRootDir);
  const candidates: DeploymentCandidate[] = [];

  for (const customer of DEMO_CUSTOMER_SUITE) {
    for (const project of customer.projects) {
      const cloud = cloudJobs.get(project.profile);
      const cloudJobId = cloud?.jobId ?? `cloud-sim-${project.profile.toLowerCase()}`;
      const buildProof = cloud?.buildProof ?? true;

      candidates.push({
        readOnly: true,
        candidateId: `cand-${project.projectId}`,
        projectId: project.projectId,
        tenantId: customer.tenantId,
        customerId: customer.customerId,
        deploymentOwner: customer.ownerUserId,
        buildId: `build-${project.projectId}-v1.1.0`,
        cloudJobId,
        version: '1.1.0',
        profile: project.profile,
        verificationPassed: buildProof,
        productArchitectPassed: buildProof,
        aflaPassed: buildProof,
        productionReady: buildProof,
        ownershipValid: true,
        createdAt: iso,
        status: CANDIDATE_OVERRIDES[project.projectId]?.status ?? 'COMPLETED',
      });
    }
  }

  return candidates;
}

export function buildDeploymentLifecycle(
  candidates: readonly DeploymentCandidate[],
  now = new Date(),
): DeploymentLifecycleEntry[] {
  const iso = now.toISOString();
  return candidates.map((c) => {
    const override = CANDIDATE_OVERRIDES[c.projectId];
    const finalStage = override?.finalStage ?? 'COMPLETED';
    const completed = stagesUpTo(finalStage);
    const stagingIdx = completed.indexOf('STAGING_DEPLOYED');
    const productionIdx = completed.indexOf('PRODUCTION_DEPLOYED');

    return {
      readOnly: true,
      candidateId: c.candidateId,
      projectId: c.projectId,
      tenantId: c.tenantId,
      customerId: c.customerId,
      currentStage: finalStage,
      stagesCompleted: completed,
      stagingReachedBeforeProduction:
        override?.stagingOnly === true ||
        (stagingIdx >= 0 && (productionIdx < 0 || stagingIdx < productionIdx)),
      observabilityValidated:
        completed.includes('OBSERVABILITY_VALIDATED') || completed.includes('COMPLETED'),
      updatedAt: iso,
    };
  });
}

export function buildPromotionDecisions(
  candidates: readonly DeploymentCandidate[],
  lifecycle: readonly DeploymentLifecycleEntry[],
  now = new Date(),
): PromotionDecisionRecord[] {
  const iso = now.toISOString();
  const decisions: PromotionDecisionRecord[] = [];

  for (const entry of lifecycle) {
    const candidate = candidates.find((c) => c.candidateId === entry.candidateId);
    if (!candidate) continue;

    const allProof =
      candidate.verificationPassed &&
      candidate.productArchitectPassed &&
      candidate.aflaPassed &&
      candidate.productionReady &&
      candidate.ownershipValid;

    if (entry.stagesCompleted.includes('STAGING_DEPLOYED')) {
      decisions.push({
        readOnly: true,
        decisionId: `promo-${entry.candidateId}-staging`,
        candidateId: entry.candidateId,
        projectId: entry.projectId,
        tenantId: entry.tenantId,
        customerId: entry.customerId,
        fromStage: 'DEPLOYMENT_CANDIDATE',
        toStage: 'STAGING_DEPLOYED',
        decision: allProof ? 'APPROVED' : 'BLOCKED',
        rationale: allProof
          ? 'Build, UVL, Product Architect, AFLA, Production Readiness, and ownership proofs satisfied.'
          : 'Promotion blocked — missing required proof gate.',
        buildProof: true,
        verificationProof: candidate.verificationPassed,
        productArchitectProof: candidate.productArchitectPassed,
        aflaProof: candidate.aflaPassed,
        productionReadinessProof: candidate.productionReady,
        ownershipProof: candidate.ownershipValid,
        decidedAt: iso,
      });
    }

    if (entry.stagesCompleted.includes('PRODUCTION_DEPLOYED')) {
      decisions.push({
        readOnly: true,
        decisionId: `promo-${entry.candidateId}-production`,
        candidateId: entry.candidateId,
        projectId: entry.projectId,
        tenantId: entry.tenantId,
        customerId: entry.customerId,
        fromStage: 'STAGING_DEPLOYED',
        toStage: 'PRODUCTION_DEPLOYED',
        decision: allProof ? 'APPROVED' : 'BLOCKED',
        rationale: allProof
          ? 'Staging validation passed; production promotion approved with observability watch.'
          : 'Production promotion blocked pending staging validation.',
        buildProof: true,
        verificationProof: candidate.verificationPassed,
        productArchitectProof: candidate.productArchitectPassed,
        aflaProof: candidate.aflaPassed,
        productionReadinessProof: candidate.productionReady,
        ownershipProof: candidate.ownershipValid,
        decidedAt: iso,
      });
    }
  }

  return decisions;
}

export function buildStagingAssessments(
  lifecycle: readonly DeploymentLifecycleEntry[],
  now = new Date(),
): StagingDeploymentAssessment[] {
  const iso = now.toISOString();
  return lifecycle
    .filter((e) => e.stagesCompleted.includes('STAGING_DEPLOYED'))
    .map((e) => {
      const override = CANDIDATE_OVERRIDES[e.projectId];
      const failed = override?.finalStage === 'ROLLED_BACK';
      return {
        readOnly: true,
        candidateId: e.candidateId,
        projectId: e.projectId,
        tenantId: e.tenantId,
        customerId: e.customerId,
        stagingDeploymentId: `staging-${e.projectId}`,
        validationStatus: failed ? ('FAILED' as const) : ('PASSED' as const),
        promotionRecommendation: override?.stagingOnly
          ? ('HOLD' as const)
          : failed
            ? ('ROLLBACK' as const)
            : ('PROMOTE_TO_PRODUCTION' as const),
        assessedAt: iso,
      };
    });
}

export function buildDeploymentHistory(
  candidates: readonly DeploymentCandidate[],
  lifecycle: readonly DeploymentLifecycleEntry[],
  now = new Date(),
): ProductionDeploymentHistoryEntry[] {
  const iso = now.toISOString();
  const history: ProductionDeploymentHistoryEntry[] = [];

  for (const entry of lifecycle) {
    const candidate = candidates.find((c) => c.candidateId === entry.candidateId);
    if (!candidate) continue;
    const override = CANDIDATE_OVERRIDES[entry.projectId];
    const health = override?.health ?? 'HEALTHY';

    if (entry.stagesCompleted.includes('STAGING_DEPLOYED')) {
      history.push({
        readOnly: true,
        deploymentId: `deploy-staging-${entry.projectId}`,
        candidateId: entry.candidateId,
        projectId: entry.projectId,
        tenantId: entry.tenantId,
        customerId: entry.customerId,
        deploymentOwner: candidate.deploymentOwner,
        version: candidate.version,
        environment: 'STAGING',
        promotedAt: iso,
        deploymentHealth: health === 'FAILED' ? 'DEGRADED' : health,
        rollbackAvailable: true,
      });
    }

    if (entry.stagesCompleted.includes('PRODUCTION_DEPLOYED')) {
      history.push({
        readOnly: true,
        deploymentId: `deploy-prod-${entry.projectId}`,
        candidateId: entry.candidateId,
        projectId: entry.projectId,
        tenantId: entry.tenantId,
        customerId: entry.customerId,
        deploymentOwner: candidate.deploymentOwner,
        version: candidate.version,
        environment: 'PRODUCTION',
        promotedAt: iso,
        deploymentHealth: health,
        rollbackAvailable: true,
      });
    }
  }

  return history;
}

export function detectDeploymentFailures(
  lifecycle: readonly DeploymentLifecycleEntry[],
  now = new Date(),
): DeploymentFailureIncident[] {
  const iso = now.toISOString();
  const failures: DeploymentFailureIncident[] = [];

  for (const entry of lifecycle) {
    if (entry.currentStage === 'ROLLED_BACK') {
      failures.push({
        readOnly: true,
        incidentId: `dfail-${entry.candidateId}`,
        candidateId: entry.candidateId,
        projectId: entry.projectId,
        tenantId: entry.tenantId,
        customerId: entry.customerId,
        failureType: 'production_regression',
        detail: 'Post-deployment observability detected regression; rollback recommended.',
        unifiedFailureEscalationEligible: true,
        detectedAt: iso,
      });
    }
    if (entry.currentStage === 'OBSERVABILITY_VALIDATED' && CANDIDATE_OVERRIDES[entry.projectId]?.health === 'DEGRADED') {
      failures.push({
        readOnly: true,
        incidentId: `dfail-obs-${entry.candidateId}`,
        candidateId: entry.candidateId,
        projectId: entry.projectId,
        tenantId: entry.tenantId,
        customerId: entry.customerId,
        failureType: 'observability_failure',
        detail: 'Production deployment live but observability validation flagged degraded health.',
        unifiedFailureEscalationEligible: true,
        detectedAt: iso,
      });
    }
  }

  return failures;
}
