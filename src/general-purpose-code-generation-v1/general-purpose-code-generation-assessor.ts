/**
 * General-Purpose Code Generation V1 — full 10-app assessor.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR,
  GENERAL_PURPOSE_CODE_GENERATION_V1_FAIL_TOKEN,
  GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN,
  MIN_GENERAL_PURPOSE_MATURITY_SCORE,
  MIN_GENERAL_PURPOSE_PROOF_DOMAINS,
} from './general-purpose-code-generation-v1-bounds.js';
import type { GeneralPurposeCodeGenerationV1Assessment } from './general-purpose-code-generation-v1-types.js';
import { GENERAL_PURPOSE_PROOF_SUITE } from './general-purpose-code-generation-v1-suite-registry.js';
import { routeGenerationStrategy } from './generation-strategy-router.js';
import { buildDomainLogicReport } from './general-purpose-app-model-builder.js';
import { runGeneralPurposeGenerationForDomain } from './general-purpose-generation-runner.js';
import { recordGeneralPurposeAssessment } from './general-purpose-code-generation-history.js';

const DEFAULT_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '../..');

export function runGeneralPurposeCodeGenerationV1(input?: {
  projectRootDir?: string;
  runNpmBuild?: boolean;
}): GeneralPurposeCodeGenerationV1Assessment {
  const projectRootDir = input?.projectRootDir ?? DEFAULT_ROOT;
  const runNpmBuild = input.runNpmBuild !== false;

  const domainResults = GENERAL_PURPOSE_PROOF_SUITE.map((suiteEntry) =>
    runGeneralPurposeGenerationForDomain({
      suiteEntry,
      projectRootDir,
      runNpmBuild,
    }),
  );

  const domainsGenerated = domainResults.filter((r) => r.generated).length;
  const domainsBuildProven = domainResults.filter((r) => r.buildSuccess).length;
  const domainsPreviewProven = domainResults.filter((r) => r.previewSuccess).length;
  const domainsWorkflowProven = domainResults.filter((r) => r.workflowValidationPassed).length;
  const domainsProductionReady = domainResults.filter((r) => r.productionReadinessPassed).length;
  const domainsOverallPassed = domainResults.filter((r) => r.overallPassed).length;

  const generalPurposeMaturityScore = Math.round(
    (domainsOverallPassed / MIN_GENERAL_PURPOSE_PROOF_DOMAINS) * 100,
  );

  const supportsComplexWorkflows = domainsWorkflowProven >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS;
  const supportsMultiRoleSystems = domainResults.every((r) => r.roleCoveragePassed);
  const supportsAdvancedBusinessLogic = domainResults.every((r) => r.domainLogicPassed);
  const supportsDomainSpecificApps = domainsOverallPassed >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS;

  const proofStatus: GeneralPurposeCodeGenerationV1Assessment['proofStatus'] =
    domainsOverallPassed >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS &&
    domainsBuildProven >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS &&
    domainsPreviewProven >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS &&
    domainsWorkflowProven >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS &&
    domainsProductionReady >= MIN_GENERAL_PURPOSE_PROOF_DOMAINS &&
    generalPurposeMaturityScore >= MIN_GENERAL_PURPOSE_MATURITY_SCORE
      ? 'PROVEN'
      : domainsOverallPassed > 0
        ? 'PARTIAL'
        : 'NOT_PROVEN';

  const passToken =
    proofStatus === 'PROVEN' ? GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN : GENERAL_PURPOSE_CODE_GENERATION_V1_FAIL_TOKEN;

  const assessment: GeneralPurposeCodeGenerationV1Assessment = {
    readOnly: true,
    advisoryOnly: true,
    canonicalOwner: 'General-Purpose Code Generation V1',
    passToken,
    version: 'V1',
    generatedAt: new Date().toISOString(),
    domainsEvaluated: domainResults.length,
    domainsGenerated,
    domainsBuildProven,
    domainsPreviewProven,
    domainsWorkflowProven,
    domainsProductionReady,
    generalPurposeMaturityScore,
    supportsComplexWorkflows,
    supportsMultiRoleSystems,
    supportsAdvancedBusinessLogic,
    supportsDomainSpecificApps,
    proofStatus,
    domainResults,
  };

  writeGeneralPurposeArtifacts(projectRootDir, assessment);
  recordGeneralPurposeAssessment(assessment, projectRootDir);
  return assessment;
}

function writeGeneralPurposeArtifacts(
  projectRootDir: string,
  assessment: GeneralPurposeCodeGenerationV1Assessment,
): void {
  const dir = join(projectRootDir, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR);
  mkdirSync(dir, { recursive: true });

  const strategyClassification = assessment.domainResults.map((result) => {
    const routed = routeGenerationStrategy({
      prompt: result.appModel.prompt,
      domain: result.domain,
      strategyHint: result.strategy,
    });
    return {
      profile: result.profile,
      domain: result.domain,
      productName: result.productName,
      strategy: result.strategy,
      definition: routed.definition,
    };
  });

  writeFileSync(join(dir, 'strategy-classification.json'), `${JSON.stringify(strategyClassification, null, 2)}\n`, 'utf8');
  writeFileSync(
    join(dir, 'app-models.json'),
    `${JSON.stringify(assessment.domainResults.map((r) => r.appModel), null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'workflow-contracts.json'),
    `${JSON.stringify(assessment.domainResults.map((r) => r.workflowContract), null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'role-contracts.json'),
    `${JSON.stringify(assessment.domainResults.map((r) => r.roleContract), null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'domain-logic-report.json'),
    `${JSON.stringify(assessment.domainResults.map((r) => buildDomainLogicReport(r.appModel)), null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    join(dir, 'validation-summary.json'),
    `${JSON.stringify(
      {
        passToken: assessment.passToken,
        proofStatus: assessment.proofStatus,
        generalPurposeMaturityScore: assessment.generalPurposeMaturityScore,
        domainsOverallPassed: assessment.domainResults.filter((r) => r.overallPassed).length,
        domainsEvaluated: assessment.domainsEvaluated,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  writeFileSync(join(dir, 'assessment.json'), `${JSON.stringify(assessment, null, 2)}\n`, 'utf8');
}

export function generalPurposeCodeGenerationProven(projectRootDir: string): boolean {
  const path = join(projectRootDir, GENERAL_PURPOSE_CODE_GENERATION_V1_ARTIFACT_DIR, 'assessment.json');
  if (!existsSync(path)) return false;
  try {
    const assessment = JSON.parse(readFileSync(path, 'utf8')) as GeneralPurposeCodeGenerationV1Assessment;
    return assessment.passToken === GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN;
  } catch {
    return false;
  }
}
