/**
 * Contextual Fallback Suppression V1 — domain-qualified module selection + exclusion authority.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPromptFeatures } from '../src/prompt-faithful-generation/prompt-feature-extractor.js';
import {
  capabilityMatchIsDisqualified,
  dashClauseLooksLikeProseDescription,
  maskModuleExtractionExclusions,
} from '../src/prompt-faithful-generation/contextual-module-qualification.js';

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

const BAD = ['contacts', 'notes', 'products', 'stock', 'inventory'] as const;

const fixturePath = join(ROOT, 'scripts/fixtures/continuityhub-production-prompt.txt');
const continuityPrompt = existsSync(fixturePath)
  ? readFileSync(fixturePath, 'utf8')
  : 'Build ContinuityHub — a production Continuity of Operations platform.\n\nCORE CAPABILITIES\n1. Incident command board — x.\n2. Stakeholder directory — y.\n';

const continuity = extractPromptFeatures(continuityPrompt);
check('ContinuityHub appName', continuity.appName === 'ContinuityHub', continuity.appName);
check('structured core provided', continuity.structuredCoreModulesProvided === true);
check(
  'ContinuityHub has no generic fallbacks',
  BAD.every((m) => !continuity.requiredModules.includes(m)),
  continuity.requiredModules.join(','),
);
check(
  'ContinuityHub includes incident command board',
  continuity.requiredModules.includes('incident-command-board'),
  continuity.requiredModules.slice(0, 5).join(','),
);
check(
  'ContinuityHub includes stakeholder directory (not contacts)',
  continuity.requiredModules.includes('stakeholder-directory'),
);

// Adversarial micro-cases
const emergencyContacts = extractPromptFeatures(
  'Build OpsConsole. Stakeholders appear as contacts only in the sense of notified parties. CORE CAPABILITIES\n1. Incident board — open.\n2. Escalation paths — chain.',
);
check(
  'appear-as-contacts does not mint contacts',
  !emergencyContacts.requiredModules.includes('contacts'),
  emergencyContacts.requiredModules.join(','),
);

const handoffNotes = extractPromptFeatures(
  'Build ShiftApp with on-call rotations and handoff notes for coverage gaps.',
);
check(
  'handoff notes does not mint notes module',
  !handoffNotes.requiredModules.includes('notes'),
  handoffNotes.requiredModules.join(','),
);

const productModulesMeta = extractPromptFeatures(
  'Build ToolX. Primary navigation must be ToolX product modules only (alpha, beta). CORE CAPABILITIES\n1. Alpha board — x.\n2. Beta registry — y.',
);
check(
  'product modules meta does not mint products',
  !productModulesMeta.requiredModules.includes('products'),
  productModulesMeta.requiredModules.join(','),
);

const retailStockExclusion = extractPromptFeatures(
  'Build ContinuityDesk. "Inventory" means failover capacity — not retail stock. CORE CAPABILITIES\n1. Resource board — kits.\n2. Site map — sites.',
);
check(
  'not retail stock / inventory means does not mint stock or inventory',
  !retailStockExclusion.requiredModules.includes('stock') &&
    !retailStockExclusion.requiredModules.includes('inventory'),
  retailStockExclusion.requiredModules.join(','),
);

const suppliersDeps = extractPromptFeatures(
  'Build ResilMap with dependency maps covering critical systems, vendors, upstream failure impact. CORE CAPABILITIES\n1. Dependency maps — vendors.\n2. Impact board — sites.',
);
check(
  'vendors as dependencies does not mint suppliers fallback',
  !suppliersDeps.requiredModules.includes('suppliers'),
  suppliersDeps.requiredModules.join(','),
);

const bookingExclusion = extractPromptFeatures(
  'Build SiteOps. Location occupancy is continuity capacity — not a hotel booking system. CORE CAPABILITIES\n1. Site registry — sites.\n2. Occupancy board — seats.',
);
check(
  'booking exclusion does not mint appointments',
  !bookingExclusion.requiredModules.includes('appointments'),
  bookingExclusion.requiredModules.join(','),
);

// Legitimate apps must not be overblocked
const crm = extractPromptFeatures('Build a CRM app with contacts, companies, deals, and notes.');
check('genuine CRM still receives contacts', crm.requiredModules.includes('contacts'));
check('genuine CRM still receives notes', crm.requiredModules.includes('notes'));

const inv = extractPromptFeatures(
  'Build an inventory manager with products, stock records, suppliers, and reorder rules.',
);
check('genuine inventory still receives products', inv.requiredModules.includes('products'));
check('genuine inventory still receives stock', inv.requiredModules.includes('stock'));

const retail = extractPromptFeatures('Build a retail storefront with products, customers, and orders.');
check('genuine retail still receives products', retail.requiredModules.includes('products'));

check(
  'dash prose description detected',
  dashClauseLooksLikeProseDescription(
    'a production Continuity of Operations (COOP) and incident-command platform for multi-site organizations',
  ),
);
check(
  'dash comma list not prose',
  !dashClauseLooksLikeProseDescription('students, trips, gear checkouts'),
);

const masked = maskModuleExtractionExclusions(
  'No ecommerce inventory. ContinuityHub is not a CRM. Stakeholders appear as contacts only in the sense of notified parties.',
);
check('mask removes ecommerce inventory', !/\becommerce\s+inventory\b/i.test(masked));
const contactSimile = 'Stakeholders appear as contacts only in the sense of notified parties.';
const contactMatch = /\bcontacts?\b/i.exec(contactSimile);
check(
  'disqualify contacts simile',
  Boolean(contactMatch && capabilityMatchIsDisqualified(contactSimile, 'contacts', contactMatch)),
);

console.log('');
console.log(`${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
console.log('AIDEVENGINE_CONTEXTUAL_FALLBACK_SUPPRESSION_V1_PASS');
