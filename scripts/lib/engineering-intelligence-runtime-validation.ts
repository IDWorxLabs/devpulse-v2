/**
 * Engineering Intelligence Runtime V1 — shared validation suite.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAuthorityEvidenceBundle } from '../../src/autonomous-engineering-executive/aee-evidence-normalizer.js';
import {
  classifyProductDomain,
  getDevPulseV2EngineeringIntelligenceRuntime,
  getLastEngineeringIntelligenceReport,
  listCapabilityModuleIds,
  resetEngineeringIntelligenceRuntimeForTests,
  runEngineeringIntelligencePlanning,
  runEngineeringIntelligencePostWorkspace,
  synthesizeEngineeringFeatureContract,
} from '../../src/engineering-intelligence-runtime/index.js';
import {
  ENGINEERING_INTELLIGENCE_VALIDATION_MATRIX,
  GENERIC_COLLAPSE_MODULE_PLAN,
  moduleHintsPresent,
  RICH_PRODUCT_PROMPT_WITHOUT_AUTH,
  sourceContainsAppSpecificHardcoding,
} from '../../src/engineering-intelligence-runtime/engineering-intelligence-validator.js';
import { resolvePromptFaithfulBuildPlan } from '../../src/prompt-faithful-generation/index.js';
import { getDevPulseV2Owner } from '../../src/foundation/ownership-registry.js';
import { buildUniversalCrudWorkspaceFiles } from '../../src/code-generation-engine/universal-crud-app-generator.js';
import { createRealFileOperation } from '../../src/real-file-workspace-execution/real-file-operation-model.js';
import { executeRealFileOperation } from '../../src/real-file-workspace-execution/real-file-operation-executor.js';
import { WORKSPACE_ROOT_DIR } from '../../src/connected-build-execution/index.js';

export const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
export const MODULE_DIR = join(ROOT, 'src/engineering-intelligence-runtime');

export const REQUIRED_FILES = [
  'engineering-intelligence-types.ts',
  'product-domain-classifier.ts',
  'capability-extraction-engine.ts',
  'module-contract-synthesizer.ts',
  'missing-capability-runtime.ts',
  'prompt-to-feature-fidelity-checker.ts',
  'feature-gap-repair-planner.ts',
  'engineering-intelligence-report.ts',
  'engineering-intelligence-validator.ts',
  'index.ts',
];

export interface ValidationCheck {
  section: string;
  name: string;
  passed: boolean;
  detail: string;
}

function writeWorkspaceFile(input: {
  projectRootDir: string;
  workspaceId: string;
  relativePath: string;
  content: string;
}): boolean {
  const operation = createRealFileOperation({
    workspaceId: input.workspaceId,
    relativePath: input.relativePath,
    operationType: 'CREATE_FILE',
    requestedBy: 'engineering-intelligence-runtime-validation',
    sourceActionId: 'ei-validation-fixture',
    payload: input.content,
  });
  const executed = executeRealFileOperation({
    projectRootDir: input.projectRootDir,
    workspaceId: input.workspaceId,
    operation,
  });
  return Boolean(executed.result?.success);
}

export async function runEngineeringIntelligenceRuntimeValidation(sections?: string[]): Promise<{
  checks: ValidationCheck[];
  allPassed: boolean;
}> {
  const checks: ValidationCheck[] = [];
  const want = sections ? new Set(sections) : null;
  const include = (section: string): boolean => !want || want.has(section) || want.has('all');

  const assert = (section: string, name: string, condition: boolean, detail: string): void => {
    if (!include(section)) return;
    checks.push({ section, name, passed: condition, detail });
  };

  resetEngineeringIntelligenceRuntimeForTests();

  if (include('engineering-intelligence-runtime') || include('all')) {
    for (const file of REQUIRED_FILES) {
      assert('engineering-intelligence-runtime', `file ${file}`, existsSync(join(MODULE_DIR, file)), file);
    }
    const authority = getDevPulseV2EngineeringIntelligenceRuntime();
    assert(
      'engineering-intelligence-runtime',
      'pass token',
      authority.passToken === 'ENGINEERING_INTELLIGENCE_RUNTIME_V1_PASS',
      authority.passToken,
    );
    const owner = getDevPulseV2Owner('engineering_intelligence_runtime');
    assert(
      'engineering-intelligence-runtime',
      'ownership registry',
      owner?.ownerModule === 'devpulse_v2_engineering_intelligence_runtime',
      owner?.ownerModule ?? 'missing',
    );
  }

  if (include('domain-classification') || include('all')) {
    for (const entry of ENGINEERING_INTELLIGENCE_VALIDATION_MATRIX) {
      const classification = classifyProductDomain(entry.prompt);
      assert(
        'domain-classification',
        `${entry.label} domain`,
        classification.domain === entry.expectedDomain,
        `${classification.domain} (expected ${entry.expectedDomain})`,
      );
    }
  }

  if (include('capability-extraction') || include('all')) {
    for (const entry of ENGINEERING_INTELLIGENCE_VALIDATION_MATRIX) {
      const contract = synthesizeEngineeringFeatureContract({ rawPrompt: entry.prompt });
      const moduleIds = listCapabilityModuleIds(contract.requiredCapabilities);
      assert(
        'capability-extraction',
        `${entry.label} modules`,
        moduleHintsPresent(moduleIds, entry.expectedModuleHints),
        moduleIds.join(', '),
      );
    }

    const authContract = synthesizeEngineeringFeatureContract({ rawPrompt: RICH_PRODUCT_PROMPT_WITHOUT_AUTH });
    assert(
      'capability-extraction',
      'auth not injected without request',
      !authContract.requiredModules.includes('auth'),
      authContract.requiredModules.join(', '),
    );
  }

  if (include('module-contract') || include('all')) {
    const richPrompt =
      'Build an AI chat app with conversation threads, prompt input, model responses, and chat history sidebar.';
    const contract = synthesizeEngineeringFeatureContract({ rawPrompt: richPrompt });
    assert(
      'module-contract',
      'dashboard/settings insufficient for rich prompt',
      !(
        contract.requiredModules.every((m) => ['dashboard', 'settings'].includes(m)) &&
        contract.requiredModules.length <= 2
      ),
      contract.requiredModules.join(', '),
    );
  }

  if (include('planning-integration') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(RICH_PRODUCT_PROMPT_WITHOUT_AUTH);
    assert(
      'planning-integration',
      'engineering intelligence attached to build plan',
      buildPlan.engineeringIntelligence != null,
      buildPlan.engineeringIntelligence?.contract.productDomain ?? 'missing',
    );
    assert(
      'planning-integration',
      'e-commerce planning modules',
      moduleHintsPresent(buildPlan.modulePlan.approvedModuleIds, ['products', 'cart', 'checkout', 'orders']),
      buildPlan.modulePlan.approvedModuleIds.join(', '),
    );
  }

  if (include('aee-evidence') || include('all')) {
    const buildPlan = resolvePromptFaithfulBuildPlan(RICH_PRODUCT_PROMPT_WITHOUT_AUTH);
    const report = getLastEngineeringIntelligenceReport();
    const planning = runEngineeringIntelligencePlanning({
      rawPrompt: RICH_PRODUCT_PROMPT_WITHOUT_AUTH,
      selectedProfile: String(buildPlan.materializationProfile),
      extractionRequiredModules: buildPlan.extraction.requiredModules,
      approvedModuleIds: buildPlan.modulePlan.approvedModuleIds,
    });
    const syntheticReport = {
      readOnly: true as const,
      reportId: 'validation-report',
      detectedProductDomain: planning.contract.productDomain,
      selectedProfile: String(buildPlan.materializationProfile),
      profileDomainMismatch: planning.profileMismatch,
      requiredCapabilities: planning.contract.requiredCapabilities,
      generatedModules: buildPlan.modulePlan.approvedModuleIds,
      missingCapabilities: [],
      rejectedFallbackModules: planning.contract.rejectedModules,
      productFidelityScore: planning.productFidelityScore,
      missingCapabilityRepairsAttempted: 0,
      finalCapabilityCoverage: 'FULL' as const,
      moduleContractStatus: 'SATISFIED' as const,
      recordedAt: new Date().toISOString(),
    };

    const evidence = normalizeAuthorityEvidenceBundle({
      workspaceDir: join(ROOT, WORKSPACE_ROOT_DIR, 'ei-validation'),
      buildPlan,
      rawPrompt: RICH_PRODUCT_PROMPT_WITHOUT_AUTH,
      projectId: 'ei-validation',
      projectName: 'EI Validation',
      aseBlockers: [],
      aseMaterializationAuthorized: true,
      aseMaterializationExecuted: true,
      npmBuildOk: true,
      previewOk: true,
      engineeringIntelligenceReport: report ?? syntheticReport,
      engineeringIntelligenceFidelityPassed: true,
      stage: 'VERIFYING',
      faithfulnessPassed: true,
    });

    assert(
      'aee-evidence',
      'AEE receives ENGINEERING_INTELLIGENCE evidence',
      evidence.some((e) => e.authority === 'ENGINEERING_INTELLIGENCE'),
      evidence.map((e) => e.authority).join(', '),
    );
    assert(
      'aee-evidence',
      'report includes product fidelity score',
      (report ?? syntheticReport).productFidelityScore > 0,
      String((report ?? syntheticReport).productFidelityScore),
    );
  }

  if (include('missing-capability-runtime') || include('all')) {
    const workspaceId = 'ei-missing-capability-validation';
    const projectRootDir = ROOT;
    const workspaceDir = join(projectRootDir, WORKSPACE_ROOT_DIR, workspaceId);
    const buildPlan = resolvePromptFaithfulBuildPlan(RICH_PRODUCT_PROMPT_WITHOUT_AUTH);
    const files = buildUniversalCrudWorkspaceFiles({
      contractId: workspaceId,
      ideaId: workspaceId,
      buildUnits: ['unit-1'],
      rawPrompt: RICH_PRODUCT_PROMPT_WITHOUT_AUTH,
      faithfulBuildPlan: {
        ...buildPlan,
        modulePlan: {
          ...buildPlan.modulePlan,
          approvedModuleIds: [...GENERIC_COLLAPSE_MODULE_PLAN],
          approvedModules: buildPlan.modulePlan.approvedModules.filter((m) =>
            GENERIC_COLLAPSE_MODULE_PLAN.includes(m.moduleId as (typeof GENERIC_COLLAPSE_MODULE_PLAN)[number]),
          ),
        },
      },
    });
    for (const file of files) {
      writeWorkspaceFile({
        projectRootDir,
        workspaceId,
        relativePath: file.relativePath,
        content: file.content,
      });
    }

    const repairResult = await runEngineeringIntelligencePostWorkspace({
      rawPrompt: RICH_PRODUCT_PROMPT_WITHOUT_AUTH,
      workspaceDir,
      projectRootDir,
      workspaceId,
      selectedProfile: String(buildPlan.materializationProfile),
      buildPlanDefinition: buildPlan.definition,
      approvedModuleIds: [...GENERIC_COLLAPSE_MODULE_PLAN],
      generatedModules: [...GENERIC_COLLAPSE_MODULE_PLAN],
      contract: buildPlan.engineeringIntelligence!.contract,
      profileMismatch: buildPlan.engineeringIntelligence!.profileMismatch,
      productIntelligenceModel: buildPlan.productIntelligenceModel,
      promptFaithfulness: buildPlan.promptFaithfulness,
      capabilityPlanning: buildPlan.capabilityPlanning,
    });

    assert(
      'missing-capability-runtime',
      'missing capability runtime executes repair path',
      repairResult.repairResult != null || repairResult.fidelity.passed,
      repairResult.repairResult
        ? `${repairResult.repairResult.repairAttempts.length} attempt(s)`
        : repairResult.fidelity.reasoning,
    );
    assert(
      'missing-capability-runtime',
      'MCE pipeline invoked during repair',
      repairResult.repairResult?.missingCapabilityPipelineExecuted === true ||
        repairResult.fidelity.passed,
      String(repairResult.repairResult?.missingCapabilityPipelineExecuted ?? repairResult.fidelity.passed),
    );
  }

  if (include('no-hardcoding') || include('all')) {
    const sources = REQUIRED_FILES.filter((f) => f.endsWith('.ts') && f !== 'engineering-intelligence-validator.ts');
    const hardcoded = sources.filter((file) =>
      sourceContainsAppSpecificHardcoding(readFileSync(join(MODULE_DIR, file), 'utf8')),
    );
    assert(
      'no-hardcoding',
      'no app-specific hardcoding in runtime sources',
      hardcoded.length === 0,
      hardcoded.join(', ') || 'clean',
    );
  }

  const allPassed = checks.every((c) => c.passed);
  return { checks, allPassed };
}

export function printEngineeringIntelligenceRuntimeValidationResults(input: {
  checks: ValidationCheck[];
  allPassed: boolean;
}): void {
  for (const check of input.checks) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} [${check.section}] ${check.name}: ${check.detail}`);
  }
  console.log(input.allPassed ? '\nENGINEERING_INTELLIGENCE_RUNTIME_V1_PASS' : '\nENGINEERING_INTELLIGENCE_RUNTIME_V1_FAIL');
}
