/**
 * General-Purpose Code Generation V1 — markdown report builder.
 */

import type { GeneralPurposeCodeGenerationV1Assessment } from './general-purpose-code-generation-v1-types.js';
import { GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN } from './general-purpose-code-generation-v1-bounds.js';

export function buildGeneralPurposeCodeGenerationV1ReportMarkdown(
  assessment: GeneralPurposeCodeGenerationV1Assessment,
): string {
  const matrixRows = assessment.domainResults
    .map(
      (r) =>
        `| ${r.productName} | ${r.strategy} | ${r.generated ? 'Yes' : 'No'} | ${r.buildSuccess ? 'Yes' : 'No'} | ${r.previewSuccess ? 'Yes' : 'No'} | ${r.workflowValidationPassed ? 'Yes' : 'No'} | ${r.roleCoveragePassed ? 'Yes' : 'No'} | ${r.domainLogicPassed ? 'Yes' : 'No'} | ${r.paiReviewPassed ? 'Yes' : 'No'} | ${r.aflaReviewPassed ? 'Yes' : 'No'} | ${r.productionReadinessPassed ? 'Yes' : 'No'} | ${r.overallPassed ? 'PASS' : 'FAIL'} |`,
    )
    .join('\n');

  return `# General-Purpose Code Generation V1 Report

**Generated:** ${assessment.generatedAt}
**Canonical Owner:** ${assessment.canonicalOwner}

**Pass token:** \`${assessment.passToken}\`

---

## Executive Summary

General-Purpose Code Generation V1 extends AiDevEngine beyond CRUD templates into workflow-driven, role-aware, domain-specific application generation.

| Metric | Value |
|--------|-------|
| Proof Status | **${assessment.proofStatus}** |
| General-Purpose Maturity Score | ${assessment.generalPurposeMaturityScore}/100 |
| Domains Evaluated | ${assessment.domainsEvaluated} |
| Generated | ${assessment.domainsGenerated}/${assessment.domainsEvaluated} |
| Build Proven | ${assessment.domainsBuildProven}/${assessment.domainsEvaluated} |
| Preview Proven | ${assessment.domainsPreviewProven}/${assessment.domainsEvaluated} |
| Workflow Proven | ${assessment.domainsWorkflowProven}/${assessment.domainsEvaluated} |
| Production Ready | ${assessment.domainsProductionReady}/${assessment.domainsEvaluated} |

---

## Capability Answers

| Question | Answer |
|----------|--------|
| Can it generate CRUD business apps? | Yes (existing engine preserved) |
| Can it generate broader workflow-driven apps? | ${assessment.supportsComplexWorkflows ? 'Yes' : 'No'} |
| Can it generate role-aware apps? | ${assessment.supportsMultiRoleSystems ? 'Yes' : 'No'} |
| Can it generate domain-specific behavior? | ${assessment.supportsDomainSpecificApps ? 'Yes' : 'No'} |
| Can those apps build, preview, verify, and pass production readiness? | ${assessment.proofStatus === 'PROVEN' ? 'Proven' : 'Not yet proven'} |

---

## 10-App Proof Matrix

| Application | Strategy | Generated | Build | Preview | Workflow | Roles | Domain Logic | PAI | AFLA | PRG | Result |
|-------------|----------|-----------|-------|---------|----------|-------|--------------|-----|------|-----|--------|
${matrixRows}

---

## Generation Strategies

Supported strategies: CRUD_APP, WORKFLOW_APP, MARKETPLACE_APP, DASHBOARD_APP, PORTAL_APP, BOOKING_APP, CONTENT_APP, COMMUNITY_APP, AI_ASSISTED_APP, CUSTOM_APP.

The GenerationStrategyRouter classifies user ideas and routes to the correct generation strategy while preserving Universal App Blueprint, Universal CRUD Generator, Feature Contract Intelligence, UVL, AFLA, PAI, RBEP, and Production Readiness systems.

---

*General-Purpose Code Generation V1 — extension layer only. Does not replace Code Generation Engine V1.*
`;
}

export { GENERAL_PURPOSE_CODE_GENERATION_V1_PASS_TOKEN };
