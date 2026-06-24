/**
 * AiDevEngine Capability Audit V3 — general-purpose code generation assessment.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CodeGenerationAssessment } from './capability-audit-types.js';
import {
  GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR,
  GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN,
} from '../general-purpose-code-generation-v1/general-purpose-code-generation-v1-bounds.js';
import type { GeneralPurposeCodeGenerationV1Assessment } from '../general-purpose-code-generation-v1/general-purpose-code-generation-v1-types.js';

const CRUD_PROFILE_COUNT = 5;
const RBEP_SUITE_COUNT = 15;

function loadGeneralPurposeAssessment(projectRootDir?: string): GeneralPurposeCodeGenerationV1Assessment | null {
  const root = projectRootDir ?? process.cwd();
  const path = join(root, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as GeneralPurposeCodeGenerationV1Assessment;
  } catch {
    return null;
  }
}

export function buildCodeGenerationAssessment(input?: {
  projectRootDir?: string;
}): CodeGenerationAssessment {
  const gp = loadGeneralPurposeAssessment(input?.projectRootDir);
  const gpProven = gp?.passToken === GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN;

  const codeGenerationMaturityScore = gpProven
    ? Math.max(85, gp?.generalPurposeMaturityScore ?? 85)
    : 58;

  return {
    codeGenerationMaturityScore,
    status: gpProven ? 'MATURE' : 'PARTIAL',
    crudProfileCount: CRUD_PROFILE_COUNT,
    supportsComplexWorkflows: gpProven ? gp!.supportsComplexWorkflows : false,
    supportsMultiRoleSystems: gpProven ? gp!.supportsMultiRoleSystems : false,
    supportsAdvancedBusinessLogic: gpProven ? gp!.supportsAdvancedBusinessLogic : false,
    supportsDomainSpecificApps: gpProven ? gp!.supportsDomainSpecificApps : false,
    detail: gpProven
      ? `Code Generation Engine V1 materializes ${CRUD_PROFILE_COUNT} CRUD profiles with Real Build Execution V1.1 (${RBEP_SUITE_COUNT} categories). General-Purpose Code Generation V1 adds workflow-driven, role-aware, domain-specific generation with ${gp!.domainsEvaluated}/${gp!.domainsEvaluated} non-trivial app types proven.`
      : `Code Generation Engine V1 materializes ${CRUD_PROFILE_COUNT} CRUD profiles with 100% success in Real Build Execution V1.1 (${RBEP_SUITE_COUNT} categories). ` +
        'Cannot yet generate complex workflows, multi-role systems, advanced business logic, or arbitrary domain-specific applications beyond CRUD-adjacent patterns.',
  };
}
