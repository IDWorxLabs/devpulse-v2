/**
 * Infrastructure Module Classification V1 — product featureModules never include system shells.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildInitialGeneratedAppManifest,
} from '../src/universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  INFRASTRUCTURE_SHELL_MODULE_IDS,
  isInfrastructureShellModuleId,
  partitionProductAndInfrastructureModules,
} from '../src/contract-to-module-traceability/contract-to-module-infrastructure-registry.js';
import { buildDefinitionFromModulePlan } from '../src/prompt-bounded-materialization/prompt-bounded-module-resolver.js';
import { extractPromptFeatures } from '../src/prompt-faithful-generation/prompt-feature-extractor.js';
import { buildCustomProfileFeatureDefinition } from '../src/prompt-faithful-generation/custom-feature-contract-builder.js';
import { evaluateProductFaithfulness } from '../src/product-faithfulness-v1/index.js';
import { deriveProductFaithfulnessInput } from '../src/build-result-normalizer-v1/build-result-normalizer-adapter.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    passed += 1;
    console.log(`PASS — ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL — ${name}${detail ? ` :: ${detail}` : ''}`);
  }
}

const mixed = [
  'incident-command-board',
  'persistence',
  'risk-register',
  'runtime-bootstrap',
  'transport-adapter',
  'preview-scaffolding',
  'data-retention-policies',
  'storage-capacity-planning',
  'auth',
  'navigation-router',
];
const partitioned = partitionProductAndInfrastructureModules(mixed);
check('persistence provider excluded from product features', !partitioned.productFeatureModules.includes('persistence'));
check('runtime shell excluded', !partitioned.productFeatureModules.includes('runtime-bootstrap'));
check('transport adapter excluded', !partitioned.productFeatureModules.includes('transport-adapter'));
check('preview scaffolding excluded', !partitioned.productFeatureModules.includes('preview-scaffolding'));
check(
  'valid user-facing retention feature retained',
  partitioned.productFeatureModules.includes('data-retention-policies'),
);
check(
  'valid storage-capacity-planning retained',
  partitioned.productFeatureModules.includes('storage-capacity-planning'),
);
check(
  'infrastructure remains recorded elsewhere',
  partitioned.infrastructureModules.includes('persistence') &&
    partitioned.infrastructureModules.includes('runtime-bootstrap') &&
    partitioned.infrastructureModules.includes('transport-adapter') &&
    partitioned.infrastructureModules.includes('preview-scaffolding'),
);
check('exact-id classification only (no substring false positive)', !isInfrastructureShellModuleId('local-persistence-policy'));
check('registry includes CBGA shells', INFRASTRUCTURE_SHELL_MODULE_IDS.includes('persistence'));

const manifest = buildInitialGeneratedAppManifest({
  projectId: 'test-project',
  projectName: 'Test',
  buildRunId: 'run-1',
  prompt: 'test',
  selectedProfile: 'GENERIC_CUSTOM_APP_V1',
  expectedAppType: 'custom-application',
  promptSummary: 'test',
  confidence: 'HIGH',
  featureModules: mixed,
  routes: mixed.map((m) => `/${m}`),
});
check('manifest.featureModules excludes persistence', !manifest.featureModules.includes('persistence'));
check(
  'manifest.infrastructureModules records persistence',
  (manifest.infrastructureModules ?? []).includes('persistence'),
);
check(
  'manifest retains domain storage module',
  manifest.featureModules.includes('storage-capacity-planning'),
);

const continuity = readFileSync(join(ROOT, 'scripts/fixtures/continuityhub-production-prompt.txt'), 'utf8');
const extraction = extractPromptFeatures(continuity);
const definition = buildCustomProfileFeatureDefinition(extraction, continuity);
const planLike = {
  approvedModuleIds: [...definition.featureModules, 'persistence', 'runtime-bootstrap'],
  routes: [...definition.featureModules, 'persistence', 'runtime-bootstrap'].map((m) =>
    m === 'auth' ? '/' : `/${m}`,
  ),
} as never;
const rebuilt = buildDefinitionFromModulePlan(definition, {
  readOnly: true,
  planId: 'test',
  rawPromptHash: 'x',
  approvedModules: [],
  approvedModuleIds: planLike.approvedModuleIds,
  routes: planLike.routes,
  blockedModules: [],
  metadataConstraints: [],
  contaminationDetected: false,
  contaminationReasons: [],
  passedPreGenerationGuard: true,
} as never);
check('ContinuityHub definition excludes persistence shell', !rebuilt.featureModules.includes('persistence'));
check(
  'ContinuityHub 14-module core retained',
  rebuilt.featureModules.includes('incident-command-board') &&
    rebuilt.featureModules.includes('risk-register') &&
    rebuilt.featureModules.includes('stakeholder-directory'),
);

const fakeBuild = {
  prompt: continuity,
  materializationManifest: {
    promptSummary: continuity.slice(0, 200),
    expectedAppType: 'incident-continuity-operations',
    featureModules: rebuilt.featureModules,
    infrastructureModules: ['persistence'],
    featureModuleDetails: rebuilt.featureModules.slice(0, 4).map((name) => ({
      name: name.replace(/-/g, ' '),
      componentPath: `src/features/${name}/X.tsx`,
      promptTerms: [],
    })),
    routes: rebuilt.routes,
    selectedProfile: 'GENERIC_CUSTOM_APP_V1',
  },
  approvedProductionBuildEnvelope: {
    approvedModulePlan: { moduleIds: rebuilt.featureModules },
    approvedNavigationPlan: { productEntries: [] },
  },
} as never;
const pf = evaluateProductFaithfulness(deriveProductFaithfulnessInput(fakeBuild, null));
check('product-faithfulness remains PRODUCT_FAITHFUL', pf.verdict === 'PRODUCT_FAITHFUL');
check('product-faithfulness score is 100', Number(pf.summary?.score ?? pf.score) === 100);

console.log('');
console.log(`${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
console.log('AIDEVENGINE_INFRASTRUCTURE_MODULE_CLASSIFICATION_V1_PASS');
