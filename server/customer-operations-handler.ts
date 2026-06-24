/**
 * Customer Operations Platform V1 — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadCustomerOperationsPlatformAssessmentFromDisk,
  runCustomerOperationsPlatformV1,
  CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN,
} from '../src/customer-operations-platform-v1/index.js';
import type { CustomerOperationsPlatformAssessment } from '../src/customer-operations-platform-v1/customer-operations-platform-v1-types.js';

export { CUSTOMER_OPERATIONS_PLATFORM_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface CustomerOperationsPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_customer_operations_platform_v1';
  canonicalOwner: 'Customer Operations Platform V1';
  passToken: string;
  customers: number;
  tenants: number;
  projects: number;
  activationRate: number;
  isolationStatus: string;
  planDistribution: string;
  platformProofStatus: string;
  commercializationScore: number;
  assessment: CustomerOperationsPlatformAssessment | null;
}

export function buildCustomerOperationsPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): CustomerOperationsPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const assessment = input?.refresh
    ? runCustomerOperationsPlatformV1({ projectRootDir })
    : loadCustomerOperationsPlatformAssessmentFromDisk(projectRootDir) ??
      runCustomerOperationsPlatformV1({ projectRootDir });

  const planCounts = assessment.customerRegistry.reduce<Record<string, number>>((acc, c) => {
    acc[c.planType] = (acc[c.planType] ?? 0) + 1;
    return acc;
  }, {});

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_customer_operations_platform_v1',
    canonicalOwner: 'Customer Operations Platform V1',
    passToken: assessment.passToken,
    customers: assessment.customersRegistered,
    tenants: assessment.tenantsActive,
    projects: assessment.projectsRegistered,
    activationRate: assessment.onboardingMetrics.activationRate,
    isolationStatus: assessment.tenantIsolationProven ? 'PROVEN — 0 violations' : 'VIOLATIONS DETECTED',
    planDistribution: Object.entries(planCounts)
      .map(([plan, count]) => `${plan} ${count}`)
      .join(' · '),
    platformProofStatus: assessment.platformProofStatus,
    commercializationScore: assessment.commercializationImpact.projectedCommercializationScore,
    assessment,
  };
}

export function sendCustomerOperationsJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildCustomerOperationsPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'customer-operations-platform-v1',
    'X-DevPulse-Canonical-Owner': 'Customer Operations Platform V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
