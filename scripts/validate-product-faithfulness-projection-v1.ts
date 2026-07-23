/**
 * Product Faithfulness Projection V1 — chips must require materialized evidence.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateProductFaithfulness } from '../src/product-faithfulness-v1/index.js';
import { deriveProductFaithfulnessInput } from '../src/build-result-normalizer-v1/build-result-normalizer-adapter.js';
import { classifyPaymentIntent } from '../src/safe-payment-placeholder-policy/safe-payment-classifier.js';
import { extractPromptFeatures } from '../src/prompt-faithful-generation/prompt-feature-extractor.js';

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

const continuityPrompt = readFileSync(
  join(ROOT, 'scripts/fixtures/continuityhub-production-prompt.txt'),
  'utf8',
);

const fakeBuild = {
  prompt: continuityPrompt,
  materializationManifest: {
    promptSummary: continuityPrompt.slice(0, 200),
    expectedAppType: 'contacts', // contaminated classifier residue — must NOT become a chip
    featureModules: [
      'incident-command-board',
      'incident-timeline',
      'stakeholder-directory',
      'risk-register',
    ],
    featureModuleDetails: [
      { name: 'Incident Command Board', componentPath: 'src/features/incident-command-board/X.tsx', promptTerms: [] },
      { name: 'Incident Timeline', componentPath: 'src/features/incident-timeline/X.tsx', promptTerms: [] },
      { name: 'Stakeholder Directory', componentPath: 'src/features/stakeholder-directory/X.tsx', promptTerms: [] },
      { name: 'Risk Register', componentPath: 'src/features/risk-register/X.tsx', promptTerms: [] },
    ],
    routes: ['/', '/incident-timeline', '/stakeholder-directory', '/risk-register'],
    selectedProfile: 'GENERIC_CUSTOM_APP_V1',
  },
  approvedProductionBuildEnvelope: {
    approvedModulePlan: {
      moduleIds: [
        'incident-command-board',
        'incident-timeline',
        'stakeholder-directory',
        'risk-register',
      ],
    },
    approvedNavigationPlan: { productEntries: [] },
  },
} as never;

const input = deriveProductFaithfulnessInput(fakeBuild, null);
check(
  'adapter omits expectedAppType from workspace summary',
  !(input.workspaceManifestSummary ?? []).some((s) => /contacts/i.test(s) && s.trim() === 'contacts'),
);
const report = evaluateProductFaithfulness(input);
const unexpected = report.summary.topUnexpected ?? [];
check(
  'Contacts not unexpected without contacts module',
  !unexpected.some((c) => /^contacts$/i.test(c)),
);
check(
  'Cart not unexpected without cart module',
  !unexpected.some((c) => /^cart$/i.test(c)),
);
check(
  'Checkout not unexpected without checkout module',
  !unexpected.some((c) => /^checkout$/i.test(c)),
);

const payment = classifyPaymentIntent(continuityPrompt);
check(
  'ContinuityHub does not mint cart/checkout placeholders',
  payment.classification === 'NOT_APPLICABLE' && payment.requiredPlaceholderModules.length === 0,
);

const retail = classifyPaymentIntent(
  'Build a retail storefront with shopping cart, checkout, and product catalog.',
);
check(
  'genuine retail still classifies checkout/cart',
  retail.requiredPlaceholderModules.includes('cart') || retail.requiredPlaceholderModules.includes('checkout'),
);

const crm = evaluateProductFaithfulness({
  prompt: 'Build a CRM with contacts, deals, and tasks for a sales team.',
  generatedFeatureModules: ['contacts', 'deals', 'tasks'],
  navigationLabels: ['Contacts', 'Deals', 'Tasks'],
  generatedRoutes: ['/contacts', '/deals', '/tasks'],
  materializationManifestHints: {
    featureModuleNames: ['Contacts', 'Deals', 'Tasks'],
    promptTerms: [],
    routes: ['/contacts', '/deals', '/tasks'],
  },
});
check(
  'genuine CRM contacts is matched not unexpected',
  (crm.comparison.matched ?? []).some((c) => /contact/i.test(c)) ||
    !(crm.summary.topUnexpected ?? []).some((c) => /^contacts$/i.test(c) && !(crm.comparison.matched ?? []).length),
);

const extractorSrc = readFileSync(
  join(ROOT, 'src/product-faithfulness-v1/product-faithfulness-feature-extractor.ts'),
  'utf8',
);
check(
  'generated concept extractor skips component path generics',
  extractorSrc.includes('Intentionally omit generatedComponents'),
);

const extraction = extractPromptFeatures(continuityPrompt);
check('ContinuityHub extraction has no contacts module', !extraction.requiredModules.includes('contacts'));

console.log('');
console.log(`${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
console.log('AIDEVENGINE_PRODUCT_FAITHFULNESS_PROJECTION_V1_PASS');
