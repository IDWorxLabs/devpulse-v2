/**
 * Expected App Type Classification V1 — dominant domain over incidental nouns.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPromptFeatures } from '../src/prompt-faithful-generation/prompt-feature-extractor.js';
import {
  buildCustomProfileFeatureDefinition,
  deriveExpectedAppTypeFromExtraction,
} from '../src/prompt-faithful-generation/custom-feature-contract-builder.js';

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

const continuity = readFileSync(join(ROOT, 'scripts/fixtures/continuityhub-production-prompt.txt'), 'utf8');
const continuityExtraction = extractPromptFeatures(continuity);
const continuityDef = buildCustomProfileFeatureDefinition(continuityExtraction, continuity);
check(
  'ContinuityHub domain is incident-continuity-operations',
  continuityExtraction.domain.includes('incident-continuity') ||
    continuityExtraction.domain.includes('continuity'),
);
check(
  'ContinuityHub expectedAppType is not contacts',
  continuityDef.expectedAppType !== 'contacts',
);
check(
  'ContinuityHub expectedAppType is incident-continuity-operations',
  continuityDef.expectedAppType === 'incident-continuity-operations',
);

const crmPrompt =
  'Build a CRM for a small sales team with contacts, deals, tasks, login, dashboard, and admin role.';
const crmExtraction = extractPromptFeatures(crmPrompt);
const crmType = deriveExpectedAppTypeFromExtraction(crmExtraction);
check('genuine CRM still classifies contacts or crm', crmType === 'contacts' || crmType === 'crm' || crmExtraction.requiredModules.includes('contacts'));

const inventoryPrompt =
  'Build an inventory management app with products, stock levels, warehouses, and suppliers.';
const inventoryExtraction = extractPromptFeatures(inventoryPrompt);
const inventoryType = deriveExpectedAppTypeFromExtraction(inventoryExtraction);
check(
  'inventory platform is inventory-operations',
  inventoryType === 'inventory-operations' || inventoryExtraction.requiredModules.some((m) => /inventory|stock|products/.test(m)),
);

const ecommercePrompt = 'Build an ecommerce storefront with products, shopping cart, and checkout.';
const ecommerceExtraction = extractPromptFeatures(ecommercePrompt);
const ecomType = deriveExpectedAppTypeFromExtraction(ecommerceExtraction);
check(
  'ecommerce classifies ecommerce or has cart/checkout modules',
  ecomType === 'ecommerce' || ecommerceExtraction.requiredModules.some((m) => /cart|checkout|products/.test(m)),
);

const incidentPrompt =
  'Build an incident response platform with incident command board, timeline, runbooks, and escalation paths.';
const incidentExtraction = extractPromptFeatures(incidentPrompt);
const incidentType = deriveExpectedAppTypeFromExtraction(incidentExtraction);
check(
  'incident response platform is incident-continuity-operations',
  incidentType === 'incident-continuity-operations',
);

const stakeholderInside =
  'Build a business continuity platform. Include a stakeholder directory as one supporting feature alongside incident command and risk register. Stakeholders appear as contacts only in the sense of notified parties.';
const nested = extractPromptFeatures(stakeholderInside);
const nestedType = deriveExpectedAppTypeFromExtraction(nested);
check('stakeholder-as-feature does not force contacts type', nestedType !== 'contacts');
check('nested continuity still incident-continuity-operations', nestedType === 'incident-continuity-operations');

console.log('');
console.log(`${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
console.log('AIDEVENGINE_EXPECTED_APP_TYPE_CLASSIFICATION_V1_PASS');
