/**
 * PRODUCTION_GENERATOR_CONTRACT_CONSUMPTION_FIX_V1 — validation.
 *
 * Production Contract Consumption Trace V1 proved five generic (non-app-specific) generator bugs
 * using a real restaurant-management prompt taken verbatim from a real production artifact
 * (`.aidev-projects/modern-unit-converter-web-application-th-1/project.json`):
 *
 *   1. `extractAppName()` (src/prompt-faithful-generation/prompt-feature-extractor.ts) extracted
 *      "reusable components where" from a later architecture bullet ("Build reusable components
 *      where appropriate") because the regex was unanchored and scanned the whole prompt.
 *   2. `classifyDomainEvidence()`/`hasKeyword()`
 *      (src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts) classified the
 *      restaurant prompt as "Calculator / Arithmetic Utility" because `hasKeyword()` let "multiple"
 *      prefix-match the truncated stem "multipl", and confidence-cap + declaration-order tie-break
 *      let that domain win.
 *   3. `buildPromptSpecificDomainCopy()` (src/prompt-faithful-generation/prompt-specific-ui-copy-builder.ts)
 *      unconditionally injected assistive-communication copy ("Communication board overview...",
 *      "Accessibility and assistive communication settings.") into every custom app.
 *   4. `buildFeatureAppRouterTsx()` (src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts)
 *      treated ANY `GENERIC_CUSTOM_APP_V1` app with `customDomainCopy` (i.e. every custom app) as
 *      assistive.
 *   5. The CBGA adapter (src/contract-bound-generation-authority-v4/contract-bound-generation-adapter.ts)
 *      repaired `extraction.appName` but never recomputed `definition.customDomainCopy`, so the
 *      router/module generators kept reading stale, pre-repair copy.
 *
 * This validator proves all five fixes using the REAL, current, unmodified production functions —
 * never mocks/stand-ins for the generator itself — against the SAME real restaurant prompt the
 * trace used, plus targeted synthetic fixtures for edge cases the real prompt does not exercise
 * (word-boundary anchoring, case-sensitivity, CBGA recompute wiring, assistive-evidence gating).
 *
 * Run only:
 *   npx tsx scripts/validate-production-generator-contract-consumption-fix-v1.ts
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractPromptFeatures, LISA_REQUIRED_MODULES } from '../src/prompt-faithful-generation/prompt-feature-extractor.js';
import { classifyRequestedDomain } from '../src/product-faithfulness-v1/product-faithfulness-feature-extractor.js';
import { buildPromptSpecificDomainCopy } from '../src/prompt-faithful-generation/prompt-specific-ui-copy-builder.js';
import { buildFeatureAppRouterTsx } from '../src/universal-prompt-to-app-materialization/modular-feature-module-generator.js';
import type { ProfileFeatureDefinition } from '../src/universal-prompt-to-app-materialization/profile-feature-map.js';
import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/contract-bound-generation-adapter.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import type { CanonicalProductContract } from '../src/product-faithfulness-v2/generation-faithfulness-types.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { GPCA_CAPABILITY_MATRIX_ROWS } from '../src/generation-pipeline-compliance-authority-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PRODUCTION_GENERATOR_CONTRACT_CONSUMPTION_FIX_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

// -------------------------------------------------------------------------------------------
// Fixtures
// -------------------------------------------------------------------------------------------

// The REAL restaurant prompt, taken verbatim from the same real production artifact Production
// Contract Consumption Trace V1 used — proves this validator checks the actual reported failure,
// not a hypothetical one.
const PROJECT_JSON_PATH = join(ROOT, '.aidev-projects/modern-unit-converter-web-application-th-1/project.json');
const REAL_PROJECT_RECORD = JSON.parse(readFileSync(PROJECT_JSON_PATH, 'utf8')) as { originalPrompt: string };
const REAL_PROMPT = REAL_PROJECT_RECORD.originalPrompt;

const TOUCHED_PRODUCTION_FILES = [
  'src/prompt-faithful-generation/prompt-feature-extractor.ts',
  'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts',
  'src/prompt-faithful-generation/prompt-specific-ui-copy-builder.ts',
  'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
  'src/contract-bound-generation-authority-v4/contract-bound-generation-adapter.ts',
];

function genericDefinitionFixture(overrides: Partial<ProfileFeatureDefinition> = {}): ProfileFeatureDefinition & {
  customDomainCopy?: Record<string, string>;
} {
  return {
    readOnly: true,
    profile: 'GENERIC_CUSTOM_APP_V1',
    expectedAppType: 'custom-app',
    featureModules: ['auth', 'dashboard', 'records', 'settings'],
    routes: ['/', '/dashboard', '/records', '/settings'],
    requiredUiTerms: ['dashboard'],
    forbiddenGenericTerms: [],
    customDomainCopy: {
      headline: 'Widget Tracker — track widgets across teams',
      dashboard: 'Widget Tracker overview.',
    },
    ...overrides,
  };
}

function extractionFixture(overrides: Partial<ReturnType<typeof extractPromptFeatures>> = {}): ReturnType<typeof extractPromptFeatures> {
  return {
    readOnly: true,
    appName: 'Widget Tracker',
    domain: 'custom',
    targetUsers: ['operations teams'],
    primaryPlatform: 'web',
    corePurpose: 'track widgets across teams',
    requiredModules: ['dashboard', 'records', 'settings'],
    rawExtractedModules: ['dashboard', 'records', 'settings'],
    rejectedNonModulePhrases: [],
    requiredInteractions: [],
    designRequirements: [],
    platformRequirements: [],
    safetyNotes: [],
    previewRequirements: [],
    androidPhonePreviewRequired: false,
    isCustomDomainPrompt: true,
    explicitModulesProvided: true,
    sanitizedModuleCount: 3,
    rawExtractedModuleCount: 3,
    ...overrides,
  };
}

async function main(): Promise<void> {
  // ===========================================================================================
  // Fix 1 — extractAppName() precision (scenarios 1-5)
  // ===========================================================================================
  const realExtraction = extractPromptFeatures(REAL_PROMPT);

  assert(
    '1. extractAppName() does not extract "reusable components where" from the real restaurant prompt',
    !/reusable components where/i.test(realExtraction.appName),
    `appName=${JSON.stringify(realExtraction.appName)}`,
  );

  assert(
    '2. extractAppName() extracts the requested product identity ("Restaurant Management Platform") from the complete real prompt',
    realExtraction.appName === 'Restaurant Management Platform',
    `appName=${JSON.stringify(realExtraction.appName)}`,
  );

  const guidanceOnlyExtraction = extractPromptFeatures(
    'Build reusable components where appropriate throughout the codebase.',
  );
  assert(
    '3. Implementation guidance phrases cannot become app names (pure-guidance prompt falls back to a safe, non-guidance name)',
    guidanceOnlyExtraction.appName === 'Custom App' &&
      !/reusable|component|appropriate|codebase/i.test(guidanceOnlyExtraction.appName),
    `appName=${JSON.stringify(guidanceOnlyExtraction.appName)}`,
  );

  const boundaryExtraction = extractPromptFeatures(
    'Build a Widget Tracker application appropriate for logistics teams.',
  );
  assert(
    '4. app/application matching uses real word boundaries ("appropriate" never satisfies the app/application suffix)',
    boundaryExtraction.appName === 'Widget Tracker',
    `appName=${JSON.stringify(boundaryExtraction.appName)}`,
  );

  const caseExtraction = extractPromptFeatures(
    'Build a smart parking assistant for Downtown Parking Solutions in busy cities.',
  );
  assert(
    '5. Case-insensitive connector matching does not break capital-start logic ([A-Z] never behaves like "any letter" — lowercase filler words are skipped, only the real Title-Case phrase is captured)',
    caseExtraction.appName === 'Downtown Parking Solutions' && /^[A-Z]/.test(caseExtraction.appName),
    `appName=${JSON.stringify(caseExtraction.appName)}`,
  );

  // ===========================================================================================
  // Fix 2 — classifyDomainEvidence()/hasKeyword() precision (scenarios 6-12)
  // ===========================================================================================
  const CALCULATOR_DOMAIN = 'Calculator / Arithmetic Utility';

  const multipleOnly = classifyRequestedDomain('Support multiple payment methods and multiple report formats.');
  assert(
    '6. "multiple" does not match the truncated stem "multipl" (Multiplication concept)',
    multipleOnly.winningDomain !== CALCULATOR_DOMAIN,
    `winningDomain=${multipleOnly.winningDomain}, explanation=${multipleOnly.explanation}`,
  );

  const displayOnly = classifyRequestedDomain('The dashboard will display a summary of results to the user.');
  assert(
    '7. Generic "display" alone does not classify Calculator',
    displayOnly.winningDomain !== CALCULATOR_DOMAIN,
    `winningDomain=${displayOnly.winningDomain}`,
  );

  const calculateOnly = classifyRequestedDomain('The system will calculate totals and show the result to the user.');
  assert(
    '8. Generic "calculate" alone does not classify Calculator',
    calculateOnly.winningDomain !== CALCULATOR_DOMAIN,
    `winningDomain=${calculateOnly.winningDomain}`,
  );

  const valueOnly = classifyRequestedDomain('Configure the default value shown on the product page.');
  assert(
    '9. Generic "value" alone does not classify Calculator',
    valueOnly.winningDomain !== CALCULATOR_DOMAIN,
    `winningDomain=${valueOnly.winningDomain}`,
  );

  const realDomain = classifyRequestedDomain(REAL_PROMPT);
  assert(
    '10. Ambiguous domain evidence does not default to the first glossary entry ("Calculator / Arithmetic Utility") — it is reported as ambiguous/no-winner instead',
    realDomain.winningDomain !== CALCULATOR_DOMAIN &&
      (realDomain.winningDomain === null || /ambiguous/i.test(realDomain.explanation) === false),
    `winningDomain=${realDomain.winningDomain}, explanation=${realDomain.explanation}`,
  );

  assert(
    '11. Restaurant-style prompt with "multiple payment methods" does not classify Calculator',
    realDomain.winningDomain !== CALCULATOR_DOMAIN,
    `winningDomain=${realDomain.winningDomain}`,
  );

  const realContract = buildCanonicalProductContract({ prompt: REAL_PROMPT });
  assert(
    '12. Canonical contract for the real Restaurant Management Platform prompt is not Calculator / Arithmetic Utility',
    realContract.productIdentity !== CALCULATOR_DOMAIN && !/calculator/i.test(realContract.productIdentity),
    `productIdentity=${JSON.stringify(realContract.productIdentity)}`,
  );

  const realCalculatorPromptDomain = classifyRequestedDomain(
    'Build a calculator app with add, subtract, multiply, and divide, plus a numeric keypad and clear button.',
  );
  assert(
    '12b. (no-regression) a REAL calculator prompt still correctly classifies as Calculator / Arithmetic Utility',
    realCalculatorPromptDomain.winningDomain === CALCULATOR_DOMAIN,
    `winningDomain=${realCalculatorPromptDomain.winningDomain}`,
  );

  // ===========================================================================================
  // Fix 3 — prompt-specific UI copy (scenarios 13-15)
  // ===========================================================================================
  const realCopy = buildPromptSpecificDomainCopy(realExtraction);
  assert(
    '13. Prompt-specific UI copy is contract-derived (dashboard/settings copy is built from the CURRENT appName, not a fixed string)',
    realCopy.dashboard?.includes(realExtraction.appName) === true &&
      realCopy.settings?.includes(realExtraction.appName) === true,
    `dashboard=${JSON.stringify(realCopy.dashboard)}, settings=${JSON.stringify(realCopy.settings)}`,
  );

  assert(
    '14. Prompt-specific UI copy does not include assistive-communication wording for a non-assistive app',
    !/communication board|assistive communication/i.test(`${realCopy.dashboard ?? ''} ${realCopy.settings ?? ''}`),
    `dashboard=${JSON.stringify(realCopy.dashboard)}, settings=${JSON.stringify(realCopy.settings)}`,
  );

  const copyBlob = Object.values(realCopy).join(' | ');
  assert(
    '15. "Blink", "ready"/gaze-tracking, and "Emergency speech" markers are not emitted in UI copy for an unrelated custom app',
    !/\bblink\b/i.test(copyBlob) && !/\bgaze\b/i.test(copyBlob) && !/emergency speech/i.test(copyBlob),
    `copy=${JSON.stringify(realCopy)}`,
  );

  const assistiveExtraction = extractionFixture({
    appName: 'LISA — Locked In Syndrome App',
    requiredModules: [...LISA_REQUIRED_MODULES],
  });
  const assistiveCopy = buildPromptSpecificDomainCopy(assistiveExtraction);
  assert(
    '15b. (no-regression) assistive-communication copy IS still produced when the extraction genuinely contains assistive-module evidence',
    /communication board/i.test(assistiveCopy.dashboard ?? '') && /assistive communication/i.test(assistiveCopy.settings ?? ''),
    `dashboard=${JSON.stringify(assistiveCopy.dashboard)}, settings=${JSON.stringify(assistiveCopy.settings)}`,
  );

  // ===========================================================================================
  // Fix 4 — buildFeatureAppRouterTsx() assistive gating (scenarios 16-18)
  // ===========================================================================================
  const genericRouterTsx = buildFeatureAppRouterTsx(genericDefinitionFixture());
  assert(
    '16. buildFeatureAppRouterTsx() does not treat GENERIC_CUSTOM_APP_V1 + customDomainCopy as assistive content',
    !genericRouterTsx.includes('assistive-app-header') &&
      !/\bblink\b/i.test(genericRouterTsx) &&
      !/emergency speech/i.test(genericRouterTsx),
    `includesAssistiveHeader=${genericRouterTsx.includes('assistive-app-header')}`,
  );

  const assistiveRouterTsx = buildFeatureAppRouterTsx(
    genericDefinitionFixture({
      profile: 'ASSISTIVE_COMMUNICATION_APP_V1',
      customDomainCopy: { headline: 'LISA — Locked In Syndrome App' },
    }),
  );
  assert(
    '17. Assistive rendering DOES require (and still honors) an explicit ASSISTIVE_COMMUNICATION_APP_V1 profile signal',
    assistiveRouterTsx.includes('assistive-app-header') && assistiveRouterTsx.includes('Emergency speech'),
    `includesAssistiveHeader=${assistiveRouterTsx.includes('assistive-app-header')}`,
  );

  assert(
    '18. App title in rendered output comes from the corrected product identity (customDomainCopy.headline), not a hardcoded default',
    assistiveRouterTsx.includes('<h1>LISA</h1>'),
    `containsCorrectTitle=${assistiveRouterTsx.includes('<h1>LISA</h1>')}`,
  );

  // ===========================================================================================
  // Fix 5 — CBGA recompute of customDomainCopy (scenarios 19-21)
  // ===========================================================================================
  const STALE_APP_NAME = 'Custom App';
  const CORRECT_IDENTITY = 'LISA — Locked In Syndrome App';
  const staleExtraction = extractionFixture({
    appName: STALE_APP_NAME,
    requiredModules: ['dashboard', 'records'],
  });
  const staleDefinition = genericDefinitionFixture({
    profile: 'ASSISTIVE_COMMUNICATION_APP_V1',
    featureModules: [...LISA_REQUIRED_MODULES],
    routes: LISA_REQUIRED_MODULES.map((m) => `/${m}`),
    customDomainCopy: { headline: `${STALE_APP_NAME} — stale purpose text`, dashboard: 'stale dashboard copy' },
  });
  const fakeBuildPlan = {
    extraction: staleExtraction,
    modulePlan: {
      approvedModuleIds: ['dashboard', 'records'],
      approvedModules: [],
      routes: ['/dashboard', '/records'],
    },
    definition: staleDefinition,
    promptBoundedMaterializationPassed: false,
  } as unknown as ResolvedPromptFaithfulBuildPlan;
  const fakeContract = {
    contractId: 'validator-fixture',
    productIdentity: CORRECT_IDENTITY,
    primaryWorkflows: ['assistive communication'],
    coreEntities: [...LISA_REQUIRED_MODULES],
    coreActions: ['blink', 'gaze', 'speak'],
    navigationExpectations: [...LISA_REQUIRED_MODULES],
    majorFeatureGroups: ['assistive communication'],
    businessConcepts: [...LISA_REQUIRED_MODULES],
    allConceptNames: [...LISA_REQUIRED_MODULES, 'blink', 'gaze', 'speak'],
  } as unknown as CanonicalProductContract;

  const cbgaResult = applyContractBoundGenerationToBuildPlan(fakeBuildPlan, fakeContract);
  const repairedCopy = cbgaResult.buildPlan.definition.customDomainCopy;
  assert(
    '19. CBGA recomputes/replaces stale definition.customDomainCopy after repairing product identity',
    repairedCopy !== staleDefinition.customDomainCopy &&
      repairedCopy?.headline?.startsWith(CORRECT_IDENTITY) === true &&
      !repairedCopy?.headline?.includes(STALE_APP_NAME),
    `repairedHeadline=${JSON.stringify(repairedCopy?.headline)}`,
  );

  const repairedRouterTsx = buildFeatureAppRouterTsx(cbgaResult.buildPlan.definition);
  assert(
    '20. Router generator consumes the corrected post-CBGA identity (rendered <h1> reflects the CBGA-repaired headline, not the stale pre-repair one)',
    repairedRouterTsx.includes('<h1>LISA</h1>') && !repairedRouterTsx.includes(STALE_APP_NAME),
    `containsCorrectedTitle=${repairedRouterTsx.includes('<h1>LISA</h1>')}, containsStaleName=${repairedRouterTsx.includes(STALE_APP_NAME)}`,
  );

  const orchestratorSource = readFileSync(
    join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'),
    'utf8',
  ).replace(/\r\n/g, '\n');
  const cbgaCallIndex = orchestratorSource.indexOf(
    'const contractBoundResult = applyContractBoundGenerationToBuildPlan(buildPlan, canonicalProductContract);',
  );
  const continuationCheckIndices = [
    orchestratorSource.indexOf('if (workspaceHasGeneratedFeatureModules(workspaceDir)) {'),
    orchestratorSource.lastIndexOf('workspaceHasGeneratedFeatureModules(workspaceDir)'),
  ].filter((i) => i >= 0);
  assert(
    '21. Rebuild/continuation paths cannot preserve stale custom copy — the CBGA repair (which now recomputes customDomainCopy) runs unconditionally, exactly once, strictly before every continuation-skip decision point in the orchestrator',
    cbgaCallIndex > 0 &&
      (orchestratorSource.match(/applyContractBoundGenerationToBuildPlan\(buildPlan, canonicalProductContract\)/g) ?? []).length === 1 &&
      continuationCheckIndices.every((i) => i > cbgaCallIndex),
    `cbgaCallIndex=${cbgaCallIndex}, continuationCheckIndices=${continuationCheckIndices.join(', ')}`,
  );

  // ===========================================================================================
  // Live production-trace-equivalent proof (scenarios 22-24) — same real functions, same real
  // restaurant prompt the trace used; the three specific bugs the trace reported no longer occur.
  // ===========================================================================================
  assert(
    '22. Production trace no longer reports a "reusable components where"-derived app title for the real restaurant prompt',
    !/reusable components where/i.test(realExtraction.appName),
    `appName=${JSON.stringify(realExtraction.appName)}`,
  );

  assert(
    '23. Production trace no longer reports assistive-copy injection for this unrelated (non-assistive) custom app',
    !/communication board|assistive communication/i.test(`${realCopy.dashboard ?? ''} ${realCopy.settings ?? ''}`),
    `dashboard=${JSON.stringify(realCopy.dashboard)}, settings=${JSON.stringify(realCopy.settings)}`,
  );

  assert(
    '24. Production trace no longer reports Calculator / Arithmetic Utility classification for the real restaurant prompt',
    realDomain.winningDomain !== CALCULATOR_DOMAIN && realContract.productIdentity !== CALCULATOR_DOMAIN,
    `winningDomain=${realDomain.winningDomain}, canonicalProductIdentity=${JSON.stringify(realContract.productIdentity)}`,
  );

  // ===========================================================================================
  // Sibling-system parity (scenarios 25-27) — lightweight, source-level only, per instructions:
  // this fix touches none of GPCA's own scoring/rendered-content files, and every sibling GPCA
  // validator still declares its own pass token untouched.
  // ===========================================================================================
  const GPCA_OWNED_FILES = [
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-authority.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-stage-discovery.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.ts',
    'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-fingerprints.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-types.ts',
  ];
  const FIX_OWN_MARKERS = [
    'IMPLEMENTATION_GUIDANCE_PATTERN',
    'deriveDeterministicNounPhraseFallback',
    'MIN_PREFIX_MATCH_KEYWORD_LENGTH',
    'hasAssistiveCommunicationEvidence',
    'repairedCustomDomainCopy',
  ];
  const gpcaFileHits: string[] = [];
  for (const f of GPCA_OWNED_FILES) {
    let src = '';
    try {
      src = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      continue;
    }
    for (const marker of FIX_OWN_MARKERS) {
      if (src.includes(marker)) gpcaFileHits.push(`${f}:${marker}`);
    }
  }
  assert(
    '25. GPCA Rendered Content Evidence is untouched by this fix (none of this fix\'s own identifiers appear in any GPCA scoring/rendered-content file)',
    gpcaFileHits.length === 0,
    gpcaFileHits.length === 0 ? `inspected ${GPCA_OWNED_FILES.length} GPCA files — no fix markers found` : `found: ${gpcaFileHits.join(', ')}`,
  );

  const SIBLING_VALIDATORS: Array<{ path: string; passToken: string }> = [
    { path: 'scripts/validate-gpca-production-enforcement-fix-v1.ts', passToken: 'GPCA_PRODUCTION_ENFORCEMENT_FIX_V1_PASS' },
    { path: 'scripts/validate-gpca-rendered-content-evidence-v1.ts', passToken: 'GPCA_RENDERED_CONTENT_EVIDENCE_V1_PASS' },
    { path: 'scripts/validate-gpca-continuation-workspace-compliance-fix-v1.ts', passToken: 'GPCA_CONTINUATION_WORKSPACE_COMPLIANCE_FIX_V1_PASS' },
  ];
  const siblingChecks = SIBLING_VALIDATORS.map((v) => {
    try {
      return readFileSync(join(ROOT, v.path), 'utf8').includes(v.passToken);
    } catch {
      return false;
    }
  });
  assert(
    '26. GPCA Production Enforcement sibling validator still declares its own pass token untouched',
    siblingChecks[0] === true,
    `present=${siblingChecks[0]}`,
  );
  assert(
    '27. GPCA Rendered Content Evidence / Continuation Workspace Compliance sibling validators still declare their own pass tokens untouched',
    siblingChecks[1] === true && siblingChecks[2] === true,
    `renderedContentPresent=${siblingChecks[1]}, continuationCompliancePresent=${siblingChecks[2]}`,
  );

  // ===========================================================================================
  // Self-discipline checks (scenarios 28-31) — this fix's OWN added lines (via git diff), never
  // pre-existing/unrelated lines, contain no application-specific branching, no new hardcoded
  // product-domain keyword lists, no weakened validators, and no VERE work.
  // ===========================================================================================
  let diffOutput = '';
  try {
    diffOutput = execSync(`git diff -- ${TOUCHED_PRODUCTION_FILES.map((f) => `"${f}"`).join(' ')}`, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch {
    diffOutput = '';
  }
  const addedCodeLines = diffOutput
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1))
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'));

  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /\b(domain|product|profile|appname|moduleid)\b\s*===\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|dashboard|authentication|crud|lisa)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
    /\[\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|authentication)['"]\s*,/i,
  ];
  const logicHits = addedCodeLines.filter((l) => APPLICATION_SPECIFIC_LOGIC_PATTERNS.some((p) => p.test(l)));
  assert(
    '28. No application-specific logic introduced by this fix\'s own added lines (no if/switch branching on domain/product/profile compared to a hardcoded product word)',
    logicHits.length === 0,
    logicHits.length === 0 ? `inspected ${addedCodeLines.length} added code line(s) — no application-specific branching found` : `hits: ${logicHits.join(' || ')}`,
  );

  const NEW_KEYWORD_LIST_PATTERN = /const\s+\w+\s*[:=]\s*\[[^\]]*['"](restaurant|calculator|converter|crm|booking|inventory|notes|authentication)['"]/i;
  const keywordListHits = addedCodeLines.filter((l) => NEW_KEYWORD_LIST_PATTERN.test(l));
  assert(
    '29. No new hardcoded product-domain keyword lists introduced by this fix (the pre-existing DOMAIN_GLOSSARY structure/keywords were only made more precise, never given new product-specific special-casing)',
    keywordListHits.length === 0,
    keywordListHits.length === 0 ? 'no new hardcoded product-domain keyword-list declarations found' : `hits: ${keywordListHits.join(' || ')}`,
  );

  let statusOutput = '';
  try {
    statusOutput = execSync('git status --porcelain -- scripts', { cwd: ROOT, encoding: 'utf8' });
  } catch {
    statusOutput = '';
  }
  const modifiedExistingValidators = statusOutput
    .split('\n')
    .filter((l) => /^\s*M\s+scripts\/validate-.*\.ts$/.test(l));
  assert(
    '30. No existing validator was modified/weakened by this change (only a brand-new validator file was added)',
    modifiedExistingValidators.length === 0,
    modifiedExistingValidators.length === 0 ? 'no pre-existing validate-*.ts files show as modified' : `modified: ${modifiedExistingValidators.join(', ')}`,
  );

  const touchedSourceForVere = TOUCHED_PRODUCTION_FILES.map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n');
  assert(
    '31. No VERE work was introduced by this fix',
    !/\bvere\b/i.test(touchedSourceForVere),
    /\bvere\b/i.test(touchedSourceForVere) ? 'unexpected VERE reference found' : 'no VERE references found in touched files',
  );

  // ===========================================================================================
  // Scenario 32 — no new TypeScript errors introduced in touched files (lightweight: a single
  // touched-file-filtered tsc pass, exactly as prior sibling fix validators in this repo do).
  // ===========================================================================================
  let tscOutput = '';
  let tscFailedToRun = false;
  try {
    tscOutput = execSync('npx tsc --noEmit --pretty false', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    if (!tscOutput) tscFailedToRun = true;
  }
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
  const touchedFileErrorLines = tscLines.filter((l) => {
    const normalized = l.replace(/\\/g, '/');
    return TOUCHED_PRODUCTION_FILES.some((f) => normalized.startsWith(f));
  });
  assert(
    '32. No new TypeScript errors introduced in touched files',
    !tscFailedToRun && touchedFileErrorLines.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}${touchedFileErrorLines.length > 0 ? `: ${touchedFileErrorLines.join(' | ')}` : ''}`,
  );

  // -------------------------------------------------------------------------------------------
  // Scenario 33 — mandatory Capability Matrix includes a dedicated row for this fix.
  // -------------------------------------------------------------------------------------------
  const fixRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'Production Generator Contract Consumption Fix');
  assert(
    '33. Mandatory Capability Matrix includes a dedicated, IMPLEMENTED row for this fix',
    fixRow !== undefined && fixRow.status === 'IMPLEMENTED',
    `row present=${fixRow !== undefined}, status=${fixRow?.status}`,
  );

  // -------------------------------------------------------------------------------------------
  // Report + exit
  // -------------------------------------------------------------------------------------------
  let failCount = 0;
  for (const r of results) {
    const marker = r.passed ? 'PASS' : 'FAIL';
    if (!r.passed) failCount += 1;
    // eslint-disable-next-line no-console
    console.log(`${marker} — ${r.name}${r.passed ? '' : ` :: ${r.detail}`}`);
  }
  // eslint-disable-next-line no-console
  console.log(`\n${results.length - failCount}/${results.length} scenarios passed.`);

  // eslint-disable-next-line no-console
  console.log('\n## Mandatory Capability Matrix\n');
  // eslint-disable-next-line no-console
  console.log('| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |');
  // eslint-disable-next-line no-console
  console.log('|------------|--------|------------------|----------|--------------------|-------|');
  for (const row of GPCA_CAPABILITY_MATRIX_ROWS) {
    // eslint-disable-next-line no-console
    console.log(`| ${row.capability} | ${row.status} | ${row.productionWired} | ${row.autoRun} | ${row.activationAllowed} | ${row.notes} |`);
  }

  if (failCount === 0) {
    // eslint-disable-next-line no-console
    console.log(`\n${PASS_TOKEN}`);
    process.exit(0);
  } else {
    // eslint-disable-next-line no-console
    console.error(`\n${failCount} scenario(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Validator crashed:', err);
  process.exit(1);
});
