/**
 * Product Faithfulness Verification Accuracy V1 — compound capability + live evidence path.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/index.js';
import {
  buildContractToModuleTraceabilityGraph,
  normalizeTraceabilityIdentity,
  resolveUniversalFeatureNamesForCurrentBuild,
  runContractToModuleTraceabilityEvaluation,
} from '../src/contract-to-module-traceability/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import {
  assertFaithfulnessMetricInvariants,
  isLexicalFragmentOfCapability,
  suppressLexicalFragmentsOfCapabilities,
} from '../src/product-faithfulness-v2/verification-accuracy.js';
import { compareProductConcepts } from '../src/product-faithfulness-v1/product-faithfulness-comparator.js';
import { evaluateProductFaithfulness } from '../src/product-faithfulness-v1/product-faithfulness-engine.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { buildCanonicalProductFaithfulnessFindings } from '../src/production-surface-integration/product-faithfulness-surface.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'AIDEVENGINE_PRODUCT_FAITHFULNESS_VERIFICATION_ACCURACY_V1_PASS';

interface Fixture {
  id: string;
  product: string;
  modules: string[];
  fragments: string[];
}

const FIXTURES: Fixture[] = [
  {
    id: 'resilienceos',
    product: 'ResilienceOS',
    modules: [
      'National Risk Registry',
      'Scenario Planning',
      'Availability Planning',
      'Volunteer Management',
      'Shelter Management',
      'Repair Planning',
      'Supply Chain Coordination',
      'Distribution Planning',
      'Storm Tracking',
      'Grant Tracking',
    ],
    fragments: ['Planning', 'Management', 'Tracking', 'National', 'Coordination', 'Risk'],
  },
  {
    id: 'urbangrid',
    product: 'UrbanGrid',
    modules: [
      'Emergency Incident Management',
      'Traffic Impact Planning',
      'Budget Management',
      'Capital Planning',
      'Document Management',
    ],
    fragments: ['Planning', 'Management', 'Incident', 'Budget', 'Document'],
  },
  {
    id: 'expeditionos',
    product: 'ExpeditionOS',
    modules: ['Scientific Sample Tracking', 'Expedition Planning', 'Field Operations Coordination'],
    fragments: ['Planning', 'Tracking', 'Coordination'],
  },
  {
    id: 'hospital',
    product: 'Hospital Operations',
    modules: ['Clinical Scheduling', 'Emergency Coordination', 'Pharmacy Operations'],
    fragments: ['Operations', 'Coordination', 'Scheduling'],
  },
  {
    id: 'port',
    product: 'Port Authority',
    modules: ['Ground Operations Coordination', 'Berth Planning', 'Cargo Management'],
    fragments: ['Planning', 'Management', 'Coordination'],
  },
  {
    id: 'university',
    product: 'University Administration',
    modules: ['Research Ethics Management', 'Student Administration', 'Course Planning'],
    fragments: ['Planning', 'Administration', 'Management'],
  },
  {
    id: 'manufacturing',
    product: 'Manufacturing Quality Platform',
    modules: ['Quality Control Planning', 'Production Planning', 'Supplier Coordination'],
    fragments: ['Planning', 'Coordination', 'Control'],
  },
  {
    id: 'wildlife',
    product: 'Wildlife Conservation',
    modules: ['Habitat Restoration Management', 'Species Management', 'Field Research'],
    fragments: ['Management', 'Research', 'Restoration'],
  },
  {
    id: 'insurance',
    product: 'Insurance Claims Operations',
    modules: ['Claims Investigation Management', 'Policy Administration', 'Fraud Monitoring'],
    fragments: ['Management', 'Administration', 'Monitoring'],
  },
  {
    id: 'airport',
    product: 'Airport Ground Operations',
    modules: ['Ground Operations Coordination', 'Gate Management', 'Baggage Coordination'],
    fragments: ['Operations', 'Management', 'Coordination'],
  },
];

function promptFor(fixture: Fixture): string {
  return `Build a production-ready web application called ${fixture.product}.

CORE MODULES

${fixture.modules.join('\n\n')}

WORKFLOWS

Create, review, approve, and complete operational records.

BUSINESS RULES

Required records must be validated before approval.`;
}

let checks = 0;
const failures: string[] = [];
function assert(label: string, condition: boolean, detail: string): void {
  checks += 1;
  if (!condition) failures.push(`${label}: ${detail}`);
  console.log(`${condition ? 'PASS' : 'FAIL'} — ${label}${condition ? '' : ` :: ${detail}`}`);
}

for (const fixture of FIXTURES) {
  const prompt = promptFor(fixture);
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `pf-accuracy-${fixture.id}`,
    buildId: `pf-accuracy-${fixture.id}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `pf-accuracy-${fixture.id}`,
    ideaId: fixture.id,
    buildUnits: ['pf-verification-accuracy'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  const surfaces = resolveUniversalFeatureNamesForCurrentBuild({
    contract,
    envelope,
    workspaceFiles,
    proposedModuleIds: [...envelope.approvedModulePlan.moduleIds],
  });
  assert(
    `${fixture.id}: current-build feature surfaces non-empty`,
    surfaces.universalFeatureNames.length > 0,
    String(surfaces.universalFeatureNames.length),
  );

  const emptyNamesGraph = buildContractToModuleTraceabilityGraph({
    contract,
    envelope,
    workspaceFiles,
    proposedModuleIds: [...envelope.approvedModulePlan.moduleIds],
    universalFeatureNames: [],
  });
  // With approved-module fallback, empty obsolete-schema lists must not invent FEATURE_CONTRACT breaks.
  assert(
    `${fixture.id}: empty featureName list does not false-break at CONTRACT_TO_FEATURE_CONTRACT`,
    !emptyNamesGraph.conceptPreservation.some(
      (entry) =>
        fixture.modules.some((module) => normalizeTraceabilityIdentity(module) === entry.conceptId) &&
        entry.firstBrokenBoundary === 'CONTRACT_TO_FEATURE_CONTRACT',
    ),
    emptyNamesGraph.conceptPreservation
      .filter((entry) => entry.firstBrokenBoundary === 'CONTRACT_TO_FEATURE_CONTRACT')
      .map((entry) => entry.conceptId)
      .join(','),
  );

  const liveReport = runContractToModuleTraceabilityEvaluation({
    contract,
    envelope,
    workspaceFiles: surfaces.workspaceFiles,
    proposedModuleIds: [...envelope.approvedModulePlan.moduleIds],
    universalFeatureNames: surfaces.universalFeatureNames,
  });
  const findings = buildCanonicalProductFaithfulnessFindings(liveReport);
  const missingFixtureModules = findings.filter((finding) =>
    fixture.modules.some(
      (module) => normalizeTraceabilityIdentity(module) === normalizeTraceabilityIdentity(finding.concept),
    ),
  );
  assert(
    `${fixture.id}: generated compound modules not falsely missing`,
    missingFixtureModules.length === 0,
    missingFixtureModules.map((finding) => finding.concept).join(','),
  );

  for (const module of fixture.modules) {
    assert(
      `${fixture.id}: compound preserved in contract (${module})`,
      contract.allConceptNames.some(
        (concept) => normalizeTraceabilityIdentity(concept) === normalizeTraceabilityIdentity(module),
      ),
      contract.allConceptNames.join(', '),
    );
  }

  const comparison = compareProductConcepts(
    fixture.modules.map((concept) => ({ readOnly: true as const, concept, sources: ['PROMPT' as const] })),
    [
      ...fixture.modules.map((concept) => ({
        readOnly: true as const,
        concept,
        sources: ['FEATURE_MODULES' as const],
      })),
      ...fixture.fragments.map((concept) => ({
        readOnly: true as const,
        concept,
        sources: ['VISIBLE_UI_TEXT' as const],
      })),
    ],
  );
  assert(
    `${fixture.id}: lexical fragments suppressed from unexpected`,
    comparison.unexpected.filter((entry) =>
      fixture.fragments.some((fragment) => fragment.toLowerCase() === entry.toLowerCase()),
    ).length === 0,
    comparison.unexpected.join(','),
  );
  assert(
    `${fixture.id}: fragment helper recognizes compound children`,
    fixture.fragments.every((fragment) =>
      fixture.modules.some((module) => isLexicalFragmentOfCapability(fragment, module)),
    ),
    fixture.fragments.join(','),
  );

  const suppressed = suppressLexicalFragmentsOfCapabilities(fixture.fragments, fixture.modules);
  assert(`${fixture.id}: suppressLexicalFragments clears all children`, suppressed.length === 0, suppressed.join(','));

  assertFaithfulnessMetricInvariants({
    requestedConcepts: fixture.modules,
    matchedConcepts: fixture.modules,
    missingConcepts: [],
    unexpectedConcepts: comparison.unexpected,
    conceptRetentionPercent: 100,
    conceptDriftPercent: 0,
    firstBrokenByConcept: new Map(),
    provenDownstreamConcepts: fixture.modules,
  });
}

const resilienceProject = join(ROOT, '.aidev-projects', 'resilienceos-1784350875831-41');
if (existsSync(join(resilienceProject, 'project.json'))) {
  const project = JSON.parse(readFileSync(join(resilienceProject, 'project.json'), 'utf8')) as {
    originalPrompt: string;
  };
  const pf = evaluateProductFaithfulness({
    prompt: project.originalPrompt,
    generatedFeatureModules: FIXTURES[0]!.modules.map((module) =>
      module.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    ),
    navigationLabels: [...FIXTURES[0]!.modules],
  });
  const glossaryGenerics = ['Services', 'Booking', 'Tasks', 'Companies'];
  assert(
    'resilienceos structured prompt does not request glossary generics',
    glossaryGenerics.every((concept) => !pf.requested.concepts.some((entry) => entry.concept === concept)),
    pf.requested.concepts.map((entry) => entry.concept).join(', '),
  );
  assert(
    'resilienceos structured prompt yields no false glossary missings',
    glossaryGenerics.every((concept) => !pf.comparison.missing.includes(concept)),
    pf.comparison.missing.join(', '),
  );
}
if (existsSync(join(resilienceProject, 'source', 'feature-contract.json'))) {
  const entities = (
    JSON.parse(readFileSync(join(resilienceProject, 'source', 'feature-contract.json'), 'utf8')) as {
      entities: Array<{ label: string }>;
    }
  ).entities.map((entry) => entry.label);
  const expected = FIXTURES[0]!.modules;
  assert(
    'resilienceos workspace UFC retains generated modules',
    expected.every((module) =>
      entities.some((label) => normalizeTraceabilityIdentity(label) === normalizeTraceabilityIdentity(module)),
    ),
    entities.join(', '),
  );
  const reportPath = join(
    resilienceProject,
    'source',
    'src',
    'contract-to-module-traceability',
    'contract-to-module-traceability-report.json',
  );
  if (existsSync(reportPath)) {
    const report = JSON.parse(readFileSync(reportPath, 'utf8')) as {
      graph: { conceptPreservation: Array<{ conceptId: string; outcome: string; firstBrokenBoundary: string }> };
    };
    assert(
      'resilienceos workspace CMT preserves modules',
      expected.every((module) =>
        report.graph.conceptPreservation.some(
          (entry) =>
            entry.conceptId === normalizeTraceabilityIdentity(module) && entry.outcome.startsWith('PRESERVED'),
        ),
      ),
      report.graph.conceptPreservation.map((entry) => `${entry.conceptId}:${entry.outcome}`).join(','),
    );
  }
}

const packageScripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts as Record<
  string,
  string
>;
assert(
  'validator script registered',
  packageScripts['validate:product-faithfulness-verification-accuracy-v1'] ===
    'tsx scripts/validate-product-faithfulness-verification-accuracy-v1.ts',
  String(packageScripts['validate:product-faithfulness-verification-accuracy-v1']),
);

console.log(`\n${checks - failures.length}/${checks} checks passed`);
if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(PASS_TOKEN);
