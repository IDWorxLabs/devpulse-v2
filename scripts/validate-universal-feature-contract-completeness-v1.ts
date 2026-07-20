/**
 * Universal Feature Contract Completeness V1 — diverse-domain production-materialization stress.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/index.js';
import {
  loadTraceabilityInputFromWorkspace,
  runContractToModuleTraceabilityEvaluation,
} from '../src/contract-to-module-traceability/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import type { UniversalFeatureContract } from '../src/universal-feature-contract-intelligence/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'AIDEVENGINE_UNIVERSAL_FEATURE_CONTRACT_COMPLETENESS_V1_PASS';

interface Fixture {
  id: string;
  product: string;
  modules: string[];
  incidental: string;
}

const FIXTURES: Fixture[] = [
  { id: 'urban-infrastructure', product: 'municipal infrastructure platform', modules: ['Infrastructure Registry', 'Inspection Management', 'Maintenance Planning', 'Emergency Incident Management'], incidental: 'voice notes and emergency services coordination' },
  { id: 'scientific-expedition', product: 'scientific expedition platform', modules: ['Expedition Planning', 'Field Operations', 'Specimen Management', 'Safety Coordination'], incidental: 'field notes and logistics pipeline visibility' },
  { id: 'hospital', product: 'hospital operations platform', modules: ['Patient Administration', 'Clinical Scheduling', 'Pharmacy Operations', 'Emergency Coordination'], incidental: 'clinical notes and support services' },
  { id: 'airport', product: 'airport operations platform', modules: ['Flight Operations', 'Gate Management', 'Baggage Coordination', 'Safety Incidents'], incidental: 'service notes and arrival pipeline status' },
  { id: 'manufacturing', product: 'manufacturing ERP', modules: ['Production Planning', 'Inventory Control', 'Supplier Coordination', 'Quality Management'], incidental: 'supplier notes and purchase orders' },
  { id: 'university', product: 'university administration platform', modules: ['Student Administration', 'Course Planning', 'Research Management', 'Campus Operations'], incidental: 'student services and research notes' },
  { id: 'hotel', product: 'hotel management platform', modules: ['Guest Management', 'Room Operations', 'Reservation Management', 'Facility Maintenance'], incidental: 'guest notes and booking pipeline reporting' },
  { id: 'marine-port', product: 'marine port authority platform', modules: ['Vessel Operations', 'Berth Planning', 'Cargo Management', 'Customs Coordination'], incidental: 'shipping notes and supplier services' },
  { id: 'wildlife', product: 'wildlife conservation platform', modules: ['Habitat Monitoring', 'Species Management', 'Field Research', 'Incident Response'], incidental: 'observation notes and response services' },
  { id: 'construction', product: 'construction company operations platform', modules: ['Project Planning', 'Site Operations', 'Contractor Management', 'Document Control'], incidental: 'contractor notes and supplier orders' },
];

function moduleId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function promptFor(fixture: Fixture): string {
  return `Build a production-ready ${fixture.product}.

CORE MODULES

${fixture.modules.join('\n\n')}

Each capability includes ${fixture.incidental}.

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
    promptHash: `feature-completeness-${fixture.id}`,
    buildId: `feature-completeness-${fixture.id}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `feature-completeness-${fixture.id}`,
    ideaId: fixture.id,
    buildUnits: ['feature-contract-completeness'],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
  });
  const featureContractFile = workspaceFiles.find((file) => file.relativePath === 'feature-contract.json');
  const featureContract = JSON.parse(featureContractFile?.content ?? '{}') as UniversalFeatureContract;
  const expectedIds = fixture.modules.map(moduleId);
  const traceInput = loadTraceabilityInputFromWorkspace({
    contract,
    envelope,
    workspaceFiles,
    proposedModuleIds: [...envelope.approvedModulePlan.moduleIds],
  });
  const traceReport = runContractToModuleTraceabilityEvaluation(traceInput);

  assert(
    `${fixture.id}: explicit capabilities retained canonically`,
    fixture.modules.every((capability) => contract.allConceptNames.includes(capability)),
    contract.allConceptNames.join(', '),
  );
  assert(
    `${fixture.id}: approved module plan preserves explicit capabilities`,
    expectedIds.every((id) => envelope.approvedModulePlan.moduleIds.includes(id)),
    envelope.approvedModulePlan.moduleIds.join(', '),
  );
  assert(
    `${fixture.id}: feature contract completeness is 100%`,
    featureContract.completeness?.score === 100 && featureContract.completeness.discardedCount === 0,
    JSON.stringify(featureContract.completeness),
  );
  assert(
    `${fixture.id}: production modules materialized`,
    expectedIds.every((id) =>
      workspaceFiles.some((file) => file.relativePath.startsWith(`src/features/${id}/`)),
    ),
    expectedIds.join(', '),
  );
  assert(
    `${fixture.id}: no false CONTRACT_TO_FEATURE_CONTRACT boundary`,
    !traceReport.graph.findings.some((finding) => finding.firstBrokenBoundary === 'CONTRACT_TO_FEATURE_CONTRACT'),
    traceReport.graph.findings.map((finding) => finding.diagnosticCode).join(', '),
  );
}

const packageScripts = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts as Record<string, string>;
assert(
  'validator script registered',
  packageScripts['validate:universal-feature-contract-completeness-v1'] ===
    'tsx scripts/validate-universal-feature-contract-completeness-v1.ts',
  String(packageScripts['validate:universal-feature-contract-completeness-v1']),
);

console.log(`\n${checks - failures.length}/${checks} checks passed`);
if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(PASS_TOKEN);
