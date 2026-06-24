/**
 * Customer Operations Platform V1 — artifact persistence.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CUSTOMER_OPERATIONS_PLATFORM_V1_ARTIFACT_DIR } from './customer-operations-platform-v1-bounds.js';
import type { CustomerOperationsPlatformAssessment } from './customer-operations-platform-v1-types.js';

export function writeCustomerOperationsPlatformArtifacts(
  projectRootDir: string,
  assessment: CustomerOperationsPlatformAssessment,
): void {
  const dir = join(projectRootDir, CUSTOMER_OPERATIONS_PLATFORM_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, 'customer-registry.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, customers: assessment.customerRegistry }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'tenant-registry.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, tenants: assessment.tenantRegistry }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'project-ownership.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, projects: assessment.projectOwnership }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'usage-tracking.json'),
    `${JSON.stringify({ generatedAt: assessment.generatedAt, usage: assessment.usageTracking }, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'subscription-readiness.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, plans: assessment.subscriptionPlans },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'tenant-isolation.json'),
    `${JSON.stringify(assessment.tenantIsolation, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'support-registry.json'),
    `${JSON.stringify(
      { generatedAt: assessment.generatedAt, incidents: assessment.supportRegistry },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'commercialization-impact.json'),
    `${JSON.stringify(assessment.commercializationImpact, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}
