/**
 * Mobile Runtime Validation at Scale V1 — Operator API.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadMobileRuntimeValidationAssessmentFromDisk,
  MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN,
  runMobileRuntimeValidationAtScaleV1,
} from '../src/mobile-runtime-validation-at-scale-v1/index.js';
import type { MobileRuntimeValidationAssessment } from '../src/mobile-runtime-validation-at-scale-v1/mobile-runtime-validation-v1-types.js';

export { MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_PASS_TOKEN };

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export interface MobileRuntimeValidationPayload {
  readOnly: true;
  informationalOnly: true;
  ownerModule: 'aidevengine_mobile_runtime_validation_at_scale_v1';
  canonicalOwner: 'Mobile Runtime Validation at Scale V1';
  passToken: string;
  mobilePassRate: number;
  categoriesMobileProven: number;
  categoriesValidated: number;
  profileCoverage: readonly string[];
  touchInteractionScore: number;
  navigationScore: number;
  performanceScore: number;
  world2MobileExecutions: number;
  mobileProofStatus: string;
  assessment: MobileRuntimeValidationAssessment | null;
}

export function buildMobileRuntimeValidationPayload(input?: {
  projectRootDir?: string;
  refresh?: boolean;
}): MobileRuntimeValidationPayload {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const cached = loadMobileRuntimeValidationAssessmentFromDisk(projectRootDir);
  const assessment = input?.refresh
    ? runMobileRuntimeValidationAtScaleV1({ projectRootDir })
    : cached;

  return {
    readOnly: true,
    informationalOnly: true,
    ownerModule: 'aidevengine_mobile_runtime_validation_at_scale_v1',
    canonicalOwner: 'Mobile Runtime Validation at Scale V1',
    passToken: assessment?.passToken ?? 'MOBILE_RUNTIME_VALIDATION_AT_SCALE_V1_INCOMPLETE',
    mobilePassRate: assessment?.mobilePassRate ?? 0,
    categoriesMobileProven: assessment?.categoriesMobileProven ?? 0,
    categoriesValidated: assessment?.categoriesValidated ?? 0,
    profileCoverage: assessment?.runtimeProfilesValidated ?? [],
    touchInteractionScore: assessment?.touchInteractionScore ?? 0,
    navigationScore: assessment?.navigationScore ?? 0,
    performanceScore: assessment?.performanceScore ?? 0,
    world2MobileExecutions: assessment?.world2MobileExecutions ?? 0,
    mobileProofStatus: assessment?.mobileProofStatus ?? 'NOT_PROVEN',
    assessment,
  };
}

export function sendMobileRuntimeValidationJson(
  res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body?: string) => void },
  refresh: boolean,
): void {
  const payload = buildMobileRuntimeValidationPayload({ refresh });
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-DevPulse-Surface': 'mobile-runtime-validation-at-scale-v1',
    'X-DevPulse-Canonical-Owner': 'Mobile Runtime Validation at Scale V1',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
}
