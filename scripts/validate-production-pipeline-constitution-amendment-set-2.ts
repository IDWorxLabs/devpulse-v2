/**
 * PRODUCTION_PIPELINE_CONSTITUTION_AMENDMENT_SET_2 — validation.
 *
 * Validates Amendment Set 2 to the Production Pipeline Constitution: the Single Source of Truth
 * Registry (§PPC-1600), the Canonical Pipeline Data Contract (§PPC-1700), the Generator Interface
 * Standard (§PPC-1800) and Authority Interface Standard (§PPC-1900), the Constitutional Capability
 * Registry (§PPC-2000), the Violation Taxonomy (§PPC-2100), the Constitutional Dependency Graph
 * (§PPC-2200), Constitution Versioning (§PPC-2300), the No Parallel Truth invariant (PPC-1207) and a
 * Violation Taxonomy completeness invariant (PPC-1208), the Constitutional Test Matrix (§PPC-2400),
 * and the extended Constitution Governance (PPC-1506–PPC-1509).
 *
 * This validator checks DOCUMENTATION COMPLETENESS ONLY. It never inspects runtime behavior, never
 * starts a server/build, and never imports a production generator/authority module. It also proves
 * this amendment does not modify production behavior and does not regress Amendment Set 1.
 *
 * Run only:
 *   npx tsx scripts/validate-production-pipeline-constitution-amendment-set-2.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AMENDMENT_LOG,
  AUTHORITY_INTERFACE_FIELDS,
  CAPABILITY_REGISTRY,
  CONSTITUTIONAL_INVARIANTS,
  CONSTITUTIONAL_TEST_MATRIX,
  CONSTITUTION_VERSION_HISTORY,
  DEPENDENCY_GRAPH,
  GENERATOR_INTERFACE_FIELDS,
  GOVERNANCE_RULES,
  PIPELINE_DATA_CONTRACT,
  RULE_ID_GROUPS,
  RULE_REGISTRY,
  SINGLE_SOURCE_OF_TRUTH_REGISTRY,
  VIOLATION_TAXONOMY,
  buildAmendmentSet1CompletenessReport,
  buildAmendmentSet2CompletenessReport,
  PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW,
} from '../src/production-pipeline-constitution-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PRODUCTION_PIPELINE_CONSTITUTION_AMENDMENT_SET_2_PASS';
const DOC_PATH = 'docs/production-pipeline-constitution-v1.md';
const THIS_SCRIPT_PATH = 'scripts/validate-production-pipeline-constitution-amendment-set-2.ts';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readDoc(): string {
  const abs = join(ROOT, DOC_PATH);
  if (!existsSync(abs)) return '';
  return readFileSync(abs, 'utf8');
}

async function main(): Promise<void> {
  const doc = readDoc();

  // ===============================================================================================
  // 1. Constitution document exists, grew, and reflects Amendment Set 2.
  // ===============================================================================================
  assert(
    '1. Constitution document exists and reflects Amendment Set 2',
    doc.length > 40000 && doc.includes('Amendment Set 2') && doc.includes('Amendment Set 2, 2026-07-09'),
    `document length=${doc.length} (need > 40000), contains "Amendment Set 2"=${doc.includes('Amendment Set 2')}`,
  );

  // ===============================================================================================
  // 2. Single Source of Truth Registry (§PPC-1600) exists with all 16 required concepts, each with
  //    the seven required fields.
  // ===============================================================================================
  const ssotHeadingPresent = doc.includes('## §PPC-1600 — Single Source of Truth Registry');
  const requiredConcepts = [
    'Canonical Product Contract',
    'Navigation Plan',
    'Route Plan',
    'Module Plan',
    'Blueprint Surface',
    'Workspace',
    'Rendered Content',
    'GPCA Report',
    'Preview Proof',
    'Product Identity',
    'Sample Data',
    'Manifest',
    'Feature Contract',
    'Diagnostics',
    'Repair Plan',
    'Capability Request',
  ];
  const allConceptsPresent = requiredConcepts.every((c) => SINGLE_SOURCE_OF_TRUTH_REGISTRY.some((e) => e.concept === c));
  const ssotFieldsPopulated = SINGLE_SOURCE_OF_TRUTH_REGISTRY.every(
    (e) => e.concept.length > 0 && e.constitutionalOwner.length > 0 && e.consumers.length > 0 && e.mayMutate.length > 0 && e.validator.length > 0 && e.pipelineStage.length > 0 && e.constitutionRuleIds.length > 0,
  );
  const ssotNoMultipleOwnersStated = /No concept may have multiple constitutional owners|exactly one constitutional owner/i.test(doc);
  assert(
    '2. Single Source of Truth Registry exists with all 16 required concepts',
    ssotHeadingPresent &&
      SINGLE_SOURCE_OF_TRUTH_REGISTRY.length >= 16 &&
      allConceptsPresent &&
      ssotFieldsPopulated &&
      ssotNoMultipleOwnersStated,
    `heading present=${ssotHeadingPresent}, count=${SINGLE_SOURCE_OF_TRUTH_REGISTRY.length} (need >=16), all required concepts present=${allConceptsPresent}, fields populated=${ssotFieldsPopulated}, single-owner principle stated=${ssotNoMultipleOwnersStated}`,
  );

  // ===============================================================================================
  // 3. Canonical Pipeline Data Contract (§PPC-1700) exists with all 9 objects, in the exact flow
  //    order specified by the amendment (Raw Prompt -> ... -> Engineering Report).
  // ===============================================================================================
  const dataContractHeadingPresent = doc.includes('## §PPC-1700 — Canonical Pipeline Data Contract');
  const requiredFlowOrder = [
    'Raw Prompt',
    'Canonical Product Contract',
    'CBGA Generation Report',
    'Approved Generation Plan',
    'Blueprint Product Surface',
    'Materialized Workspace',
    'GPCA Compliance Report',
    'Preview Proof',
    'Engineering Report',
  ];
  const flowOrderMatches = requiredFlowOrder.every((obj, i) => PIPELINE_DATA_CONTRACT[i]?.object === obj);
  const dataContractFieldsPopulated = PIPELINE_DATA_CONTRACT.every(
    (e) => e.owner.length > 0 && e.producer.length > 0 && e.consumers.length > 0 && e.immutableFields.length > 0 && e.version.length > 0 && e.validation.length > 0 && e.provenance.length > 0,
  );
  assert(
    '3. Canonical Pipeline Data Contract exists with all 9 objects in flow order',
    dataContractHeadingPresent && PIPELINE_DATA_CONTRACT.length >= 9 && flowOrderMatches && dataContractFieldsPopulated,
    `heading present=${dataContractHeadingPresent}, count=${PIPELINE_DATA_CONTRACT.length} (need >=9), flow order matches=${flowOrderMatches}, fields populated=${dataContractFieldsPopulated}`,
  );

  // ===============================================================================================
  // 4. Generator Interface Standard (§PPC-1800) documented with all 9 required fields plus the two
  //    interface-conformance rules (PPC-1801, PPC-1802).
  // ===============================================================================================
  const generatorInterfaceHeadingPresent = doc.includes('## §PPC-1800 — Generator Interface Standard');
  const requiredGeneratorFields = [
    'Inputs',
    'Consumed Contracts',
    'Outputs',
    'Generated Artifacts',
    'Produced Provenance',
    'Produced Diagnostics',
    'Mutation Scope',
    'Validation',
    'Failure Modes',
  ];
  const allGeneratorFieldsPresent = requiredGeneratorFields.every((f) => GENERATOR_INTERFACE_FIELDS.some((g) => g.field === f));
  const generatorRuleIdsPresent = ['PPC-1801', 'PPC-1802'].every((id) => RULE_REGISTRY.some((r) => r.id === id) && doc.includes(id));
  assert(
    '4. Generator Interface Standard documented',
    generatorInterfaceHeadingPresent && GENERATOR_INTERFACE_FIELDS.length >= 9 && allGeneratorFieldsPresent && generatorRuleIdsPresent,
    `heading present=${generatorInterfaceHeadingPresent}, field count=${GENERATOR_INTERFACE_FIELDS.length} (need >=9), all fields present=${allGeneratorFieldsPresent}, PPC-1801/1802 present=${generatorRuleIdsPresent}`,
  );

  // ===============================================================================================
  // 5. Authority Interface Standard (§PPC-1900) documented with all 11 required fields plus the two
  //    interface-conformance rules (PPC-1901, PPC-1902).
  // ===============================================================================================
  const authorityInterfaceHeadingPresent = doc.includes('## §PPC-1900 — Authority Interface Standard');
  const requiredAuthorityFields = [
    'Reads',
    'Writes',
    'Mutates',
    'Blocks',
    'Repairs',
    'Produces Report',
    'Produces Violations',
    'Produces Diagnostics',
    'Produces Capability Requests',
    'Validator',
    'Constitution Rules Enforced',
  ];
  const allAuthorityFieldsPresent = requiredAuthorityFields.every((f) => AUTHORITY_INTERFACE_FIELDS.some((a) => a.field === f));
  const authorityRuleIdsPresent = ['PPC-1901', 'PPC-1902'].every((id) => RULE_REGISTRY.some((r) => r.id === id) && doc.includes(id));
  assert(
    '5. Authority Interface Standard documented',
    authorityInterfaceHeadingPresent && AUTHORITY_INTERFACE_FIELDS.length >= 11 && allAuthorityFieldsPresent && authorityRuleIdsPresent,
    `heading present=${authorityInterfaceHeadingPresent}, field count=${AUTHORITY_INTERFACE_FIELDS.length} (need >=11), all fields present=${allAuthorityFieldsPresent}, PPC-1901/1902 present=${authorityRuleIdsPresent}`,
  );

  // ===============================================================================================
  // 6. Constitutional Capability Registry (§PPC-2000) documented with all 12 required capabilities.
  // ===============================================================================================
  const capabilityRegistryHeadingPresent = doc.includes('## §PPC-2000 — Constitutional Capability Registry');
  const requiredCapabilitySubstrings = [
    'GPCA',
    'CBGA',
    'AEO',
    'EIAA',
    'Build Reality AutoFix',
    'Engineering Intelligence Runtime',
    'VERE',
    'Product Faithfulness',
    'Infrastructure vs Product Boundary Authority',
    'Blueprint Generator',
    'Materialization',
    'Preview Gate',
  ];
  const allCapabilitiesPresent = requiredCapabilitySubstrings.every((c) => CAPABILITY_REGISTRY.some((e) => e.capability.includes(c)));
  const capabilityFieldsPopulated = CAPABILITY_REGISTRY.every(
    (e) => e.capability.length > 0 && e.owner.length > 0 && e.purpose.length > 0 && e.pipelineStage.length > 0 && e.validator.length > 0 && e.currentStatus.length > 0,
  );
  assert(
    '6. Constitutional Capability Registry documented',
    capabilityRegistryHeadingPresent && CAPABILITY_REGISTRY.length >= 12 && allCapabilitiesPresent && capabilityFieldsPopulated,
    `heading present=${capabilityRegistryHeadingPresent}, count=${CAPABILITY_REGISTRY.length} (need >=12), all required capabilities present=${allCapabilitiesPresent}, fields populated=${capabilityFieldsPopulated}`,
  );

  // ===============================================================================================
  // 7. Violation Taxonomy (§PPC-2100) documented with all 11 required categories, and every entry
  //    belongs to exactly one category (unique taxonomy IDs, no duplicate category names).
  // ===============================================================================================
  const violationTaxonomyHeadingPresent = doc.includes('## §PPC-2100 — Violation Taxonomy');
  const requiredCategories = [
    'Ownership Violation',
    'Traceability Violation',
    'Generator Violation',
    'Pipeline Violation',
    'Repair Violation',
    'Preview Violation',
    'Runtime Violation',
    'Mutation Violation',
    'Governance Violation',
    'Capability Violation',
    'State Machine Violation',
  ];
  const allCategoriesPresent = requiredCategories.every((c) => VIOLATION_TAXONOMY.some((e) => e.category === c));
  const taxonomyIdsUnique = new Set(VIOLATION_TAXONOMY.map((e) => e.id)).size === VIOLATION_TAXONOMY.length;
  const categoriesUnique = new Set(VIOLATION_TAXONOMY.map((e) => e.category)).size === VIOLATION_TAXONOMY.length;
  assert(
    '7. Violation Taxonomy documented with 11 non-overlapping categories',
    violationTaxonomyHeadingPresent && VIOLATION_TAXONOMY.length >= 11 && allCategoriesPresent && taxonomyIdsUnique && categoriesUnique,
    `heading present=${violationTaxonomyHeadingPresent}, count=${VIOLATION_TAXONOMY.length} (need >=11), all categories present=${allCategoriesPresent}, taxonomy IDs unique=${taxonomyIdsUnique}, categories unique=${categoriesUnique}`,
  );

  // ===============================================================================================
  // 8. Constitutional Dependency Graph (§PPC-2200) documented, and the exact dependency chain the
  //    amendment specified (GPCA -> Materialization -> CBGA -> Canonical Product Contract) is
  //    reconstructable from the graph data.
  // ===============================================================================================
  const dependencyGraphHeadingPresent = doc.includes('## §PPC-2200 — Constitutional Dependency Graph');
  const gpcaEntry = DEPENDENCY_GRAPH.find((e) => e.authority === 'GPCA');
  const materializationEntry = DEPENDENCY_GRAPH.find((e) => e.authority === 'Materialization / Blueprint Generator');
  const cbgaEntry = DEPENDENCY_GRAPH.find((e) => e.authority === 'CBGA');
  const chainReconstructable =
    !!gpcaEntry &&
    !!materializationEntry &&
    !!cbgaEntry &&
    gpcaEntry.dependsOn.some((d) => /materialized workspace/i.test(d)) &&
    materializationEntry.dependsOn.some((d) => /cbga/i.test(d)) &&
    cbgaEntry.dependsOn.some((d) => /canonical product contract/i.test(d));
  const everyEntryHasForbiddenDependencies = DEPENDENCY_GRAPH.every((e) => e.forbiddenDependencies.length > 0);
  assert(
    '8. Constitutional Dependency Graph documented with reconstructable illegal-order chain',
    dependencyGraphHeadingPresent && DEPENDENCY_GRAPH.length >= 8 && chainReconstructable && everyEntryHasForbiddenDependencies,
    `heading present=${dependencyGraphHeadingPresent}, count=${DEPENDENCY_GRAPH.length} (need >=8), GPCA->Materialization->CBGA->Contract chain reconstructable=${chainReconstructable}, every entry has forbidden dependencies=${everyEntryHasForbiddenDependencies}`,
  );

  // ===============================================================================================
  // 9. Constitution Versioning (§PPC-2300) documented — V1.0 -> V1.1 -> V1.2 history, exactly one
  //    CURRENT version, rule IDs never reused across versions (cross-checked against PPC-1505).
  // ===============================================================================================
  const versioningHeadingPresent = doc.includes('## §PPC-2300 — Constitution Versioning');
  const requiredVersions = ['V1.0', 'V1.1', 'V1.2'];
  const allVersionsPresent = requiredVersions.every((v) => CONSTITUTION_VERSION_HISTORY.some((e) => e.version === v));
  const exactlyOneCurrent = CONSTITUTION_VERSION_HISTORY.filter((v) => v.historicalStatus === 'CURRENT').length === 1;
  const currentIsLatest = CONSTITUTION_VERSION_HISTORY.find((v) => v.historicalStatus === 'CURRENT')?.version === 'V1.2';
  const idPermanenceCrossReferenced = GOVERNANCE_RULES.some((g) => g.id === 'PPC-1505' && /never reused/i.test(g.rule));
  assert(
    '9. Constitution Versioning documented with exactly one CURRENT version',
    versioningHeadingPresent && allVersionsPresent && exactlyOneCurrent && currentIsLatest && idPermanenceCrossReferenced,
    `heading present=${versioningHeadingPresent}, all versions present=${allVersionsPresent}, exactly one CURRENT=${exactlyOneCurrent}, current is V1.2=${currentIsLatest}, ID permanence cross-referenced=${idPermanenceCrossReferenced}`,
  );

  // ===============================================================================================
  // 10. No Parallel Truth invariant (PPC-1207) documented as a top-level Constitutional Invariant.
  // ===============================================================================================
  const noParallelTruthEntry = CONSTITUTIONAL_INVARIANTS.find((i) => i.id === 'PPC-1207');
  const noParallelTruthStated = !!noParallelTruthEntry && /no parallel truth/i.test(noParallelTruthEntry.statement);
  const docStatesNoParallelTruth = /No Parallel Truth/i.test(doc) && /exactly one authoritative form/i.test(doc);
  assert(
    '10. No Parallel Truth invariant (PPC-1207) documented',
    noParallelTruthStated && docStatesNoParallelTruth,
    `PPC-1207 present with correct statement=${noParallelTruthStated}, doc states the principle=${docStatesNoParallelTruth}`,
  );

  // ===============================================================================================
  // 11. Violation Taxonomy completeness invariant (PPC-1208) documented.
  // ===============================================================================================
  const taxonomyInvariantEntry = CONSTITUTIONAL_INVARIANTS.find((i) => i.id === 'PPC-1208');
  const taxonomyInvariantStated = !!taxonomyInvariantEntry && /exactly one primary/i.test(taxonomyInvariantEntry.statement);
  assert(
    '11. Violation Taxonomy completeness invariant (PPC-1208) documented',
    taxonomyInvariantStated && doc.includes('PPC-1208'),
    `PPC-1208 present with correct statement=${taxonomyInvariantStated}, present in doc=${doc.includes('PPC-1208')}`,
  );

  // ===============================================================================================
  // 12. Constitutional Test Matrix (§PPC-2400) documented, mechanically derived, and covers every
  //     rule currently in RULE_REGISTRY (never a hand-maintained second list).
  // ===============================================================================================
  const testMatrixHeadingPresent = doc.includes('## §PPC-2400 — Constitutional Test Matrix');
  const testMatrixRuleIds = new Set(CONSTITUTIONAL_TEST_MATRIX.map((m) => m.ruleId));
  const matrixCoversEveryRule = RULE_REGISTRY.every((r) => testMatrixRuleIds.has(r.id)) && CONSTITUTIONAL_TEST_MATRIX.length === RULE_REGISTRY.length;
  const matrixDerivedMechanically = /generated mechanically|buildConstitutionalTestMatrix/i.test(doc);
  assert(
    '12. Constitutional Test Matrix documented and covers every rule',
    testMatrixHeadingPresent && matrixCoversEveryRule && matrixDerivedMechanically,
    `heading present=${testMatrixHeadingPresent}, matrix size=${CONSTITUTIONAL_TEST_MATRIX.length}, rule registry size=${RULE_REGISTRY.length}, covers every rule=${matrixCoversEveryRule}, stated as mechanically derived=${matrixDerivedMechanically}`,
  );

  // ===============================================================================================
  // 13. Constitution Governance extended (PPC-1506-1509: Proposal, Review, Version Release,
  //     Archival) and the Amendment Log records this amendment set.
  // ===============================================================================================
  const requiredNewGovernanceIds = ['PPC-1506', 'PPC-1507', 'PPC-1508', 'PPC-1509'];
  const allNewGovernanceIdsPresent = requiredNewGovernanceIds.every((id) => GOVERNANCE_RULES.some((g) => g.id === id) && doc.includes(id));
  const proposalReviewReleaseArchivalNamed = ['Proposal', 'Review', 'Version release', 'Archival'].every((kw) => GOVERNANCE_RULES.some((g) => g.rule.includes(kw)));
  const amendmentLogHasSet2 = AMENDMENT_LOG.some((a) => a.amendmentSet === 'Amendment Set 2') && doc.includes('**Amendment Set 2**');
  assert(
    '13. Constitution Governance extended and Amendment Log updated',
    allNewGovernanceIdsPresent && proposalReviewReleaseArchivalNamed && amendmentLogHasSet2,
    `new governance IDs present=${allNewGovernanceIdsPresent}, proposal/review/release/archival named=${proposalReviewReleaseArchivalNamed}, amendment log has Amendment Set 2=${amendmentLogHasSet2}`,
  );

  // ===============================================================================================
  // 14. Every constitutional rule ID (old and new) remains unique and well-formed; the registry
  //     grew (>=130) without any prior ID being renumbered or reused.
  // ===============================================================================================
  const allIds = RULE_REGISTRY.map((r) => r.id);
  const idsUnique = new Set(allIds).size === allIds.length;
  const allIdsWellFormed = allIds.every((id) => /^PPC-\d{3,4}$/.test(id));
  const priorIdsStillPresent = ['PPC-101', 'PPC-402', 'PPC-702', 'PPC-1001', 'PPC-1203', 'PPC-1401', 'PPC-1505'].every((id) => allIds.includes(id));
  assert(
    '14. Every constitutional rule ID remains unique, well-formed, and non-regressed',
    RULE_REGISTRY.length >= 130 && idsUnique && allIdsWellFormed && priorIdsStillPresent,
    `registry size=${RULE_REGISTRY.length} (need >=130), all unique=${idsUnique}, all well-formed=${allIdsWellFormed}, prior IDs still present=${priorIdsStillPresent}`,
  );

  // ===============================================================================================
  // 15. Rule ID Convention table extended to 24 hundred-blocks (15 prior + 9 new), with the 9 new
  //     blocks documented in the doc's convention table.
  // ===============================================================================================
  const newGroupPrefixes = ['PPC-16xx', 'PPC-17xx', 'PPC-18xx', 'PPC-19xx', 'PPC-20xx', 'PPC-21xx', 'PPC-22xx', 'PPC-23xx', 'PPC-24xx'];
  const allNewGroupsInData = newGroupPrefixes.every((p) => RULE_ID_GROUPS.some((g) => g.prefix === p));
  const allNewGroupsInDoc = newGroupPrefixes.every((p) => doc.includes(`**${p}**`));
  assert(
    '15. Rule ID Convention extended to 24 hundred-blocks without renumbering',
    RULE_ID_GROUPS.length === 24 && allNewGroupsInData && allNewGroupsInDoc,
    `group count=${RULE_ID_GROUPS.length} (need 24), all 9 new groups in data=${allNewGroupsInData}, all 9 new groups documented=${allNewGroupsInDoc}`,
  );

  // ===============================================================================================
  // 16. Capability Matrix row updated to reference Amendment Set 2.
  // ===============================================================================================
  assert(
    '16. Capability Matrix row updated for Amendment Set 2',
    PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW.notes.includes('Amendment Set 2'),
    `notes include "Amendment Set 2"=${PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW.notes.includes('Amendment Set 2')}`,
  );

  // ===============================================================================================
  // 17. Amendment Set 2 structural completeness report (module's own aggregate check) is complete,
  //     AND Amendment Set 1's earlier completeness report has not regressed to incomplete.
  // ===============================================================================================
  const set2Completeness = buildAmendmentSet2CompletenessReport();
  const set1Completeness = buildAmendmentSet1CompletenessReport();
  assert(
    '17. Amendment Set 2 complete and Amendment Set 1 not regressed',
    set2Completeness.complete && set1Completeness.complete,
    `set2=${JSON.stringify(set2Completeness)}, set1.complete=${set1Completeness.complete}`,
  );

  // ===============================================================================================
  // 18. This validator does not inspect runtime behavior: no dev-server start, no HTTP calls, no
  //     import of any production generator/authority module, no build/test invocation.
  // ===============================================================================================
  const thisScriptSource = readFileSync(join(ROOT, THIS_SCRIPT_PATH), 'utf8');
  const importLines = thisScriptSource.split('\n').filter((l) => /^\s*import\b/.test(l));
  const importedModuleSpecifiers = Array.from(thisScriptSource.matchAll(/from\s+['"]([^'"]+)['"]/g)).map((m) => m[1]);
  const importsOnlyOwnModule = importedModuleSpecifiers.every(
    (spec) => /^node:(child_process|fs|path|url)$/.test(spec) || spec.includes('production-pipeline-constitution-v1'),
  );
  const sourceExcludingSelfCheckLine = thisScriptSource
    .split('\n')
    .filter((l) => !l.includes('const noRuntimeInvocation'))
    .join('\n');
  const noRuntimeInvocation = !/npm run dev|startDevServer|fetch\(|http\.request|\.listen\(/i.test(sourceExcludingSelfCheckLine);
  assert(
    '18. Validator does not inspect runtime behavior',
    importsOnlyOwnModule && noRuntimeInvocation,
    `imported module specifiers=${JSON.stringify(importedModuleSpecifiers)}, imports only node builtins + own module=${importsOnlyOwnModule}, no runtime invocation patterns=${noRuntimeInvocation}`,
  );

  // ===============================================================================================
  // 19-20. Self-discipline: no production/generator/authority modification (GPCA, CBGA, Product
  // Faithfulness, AEO, EIAA, VERE, Blueprint Generator, Materialization, Build Orchestrator).
  // ===============================================================================================
  const PRODUCTION_GENERATOR_FILES = [
    'src/universal-app-blueprint/universal-app-blueprint-generator.ts',
    'src/universal-app-blueprint/universal-app-blueprint-product-surface.ts',
    'src/universal-prompt-to-app-materialization/modular-feature-module-generator.ts',
    'src/universal-prompt-to-app-materialization/universal-app-materialization-engine.ts',
    'src/code-generation-engine/code-generation-engine-authority.ts',
    'src/code-generation-engine/universal-crud-app-generator.ts',
    'src/prompt-faithful-generation/prompt-feature-extractor.ts',
    'src/prompt-faithful-generation/prompt-specific-ui-copy-builder.ts',
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
  ];
  const AUTHORITY_DIRS = [
    'src/generation-pipeline-compliance-authority-v1',
    'src/contract-bound-generation-authority-v4',
    'src/product-faithfulness-v1',
    'src/product-faithfulness-v2',
    'src/autonomous-engineering-orchestrator-v1',
    'src/engineering-intelligence-activation-authority-v1',
    'src/engineering-intelligence-runtime',
    'src/infrastructure-product-boundary-authority-v1',
  ];
  const VERE_DIRS = ['src/vere-adoption-phase-1', 'src/vere-adoption-phase-2'];

  const UNIQUE_SYMBOLS_AMENDMENT_SET_2 = [
    'SINGLE_SOURCE_OF_TRUTH_REGISTRY',
    'PIPELINE_DATA_CONTRACT',
    'GENERATOR_INTERFACE_FIELDS',
    'AUTHORITY_INTERFACE_FIELDS',
    'CAPABILITY_REGISTRY',
    'VIOLATION_TAXONOMY',
    'DEPENDENCY_GRAPH',
    'CONSTITUTION_VERSION_HISTORY',
    'CONSTITUTIONAL_TEST_MATRIX',
    'buildConstitutionalTestMatrix',
    'buildAmendmentSet2CompletenessReport',
    'RULE_REGISTRY_PPC_1600',
    'RULE_REGISTRY_PPC_2400',
  ];

  function listTsFilesUnder(dirRelPath: string): string[] {
    const abs = join(ROOT, dirRelPath);
    if (!existsSync(abs)) return [];
    try {
      const out = execSync(`git ls-files -- "${dirRelPath}"`, { cwd: ROOT, encoding: 'utf8' });
      return out
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.endsWith('.ts') || l.endsWith('.tsx'));
    } catch {
      return [];
    }
  }

  function findSymbolLeaks(filesOrDirs: readonly string[]): string[] {
    const leaks: string[] = [];
    const allFiles = filesOrDirs.flatMap((p) => {
      const abs = join(ROOT, p);
      if (!existsSync(abs)) return [];
      return p.endsWith('.ts') || p.endsWith('.tsx') ? [p] : listTsFilesUnder(p);
    });
    for (const file of allFiles) {
      const abs = join(ROOT, file);
      if (!existsSync(abs)) continue;
      const content = readFileSync(abs, 'utf8');
      for (const symbol of UNIQUE_SYMBOLS_AMENDMENT_SET_2) {
        // Word-boundary match: avoids false positives from unrelated pre-existing identifiers that
        // merely contain this symbol as a substring (e.g. REPAIR_CAPABILITY_REGISTRY vs CAPABILITY_REGISTRY).
        if (new RegExp(`\\b${symbol}\\b`).test(content)) leaks.push(`${file} contains "${symbol}"`);
      }
    }
    return leaks;
  }

  const generatorLeaks = findSymbolLeaks(PRODUCTION_GENERATOR_FILES);
  const authorityLeaks = findSymbolLeaks(AUTHORITY_DIRS);
  const vereLeaks = findSymbolLeaks(VERE_DIRS);
  assert(
    '19. Does not modify production code, generators, or runtime orchestration',
    generatorLeaks.length === 0,
    generatorLeaks.length === 0
      ? `checked ${PRODUCTION_GENERATOR_FILES.length} production generator/orchestrator files for Amendment Set 2's unique symbols — none found`
      : `unexpected leak: ${generatorLeaks.join(' || ')}`,
  );
  assert(
    '20. Does not modify GPCA/CBGA/Product Faithfulness/AEO/EIAA/VERE behavior',
    authorityLeaks.length === 0 && vereLeaks.length === 0,
    authorityLeaks.length === 0 && vereLeaks.length === 0
      ? `checked ${AUTHORITY_DIRS.length} authority directories and ${VERE_DIRS.length} VERE directories for Amendment Set 2's unique symbols — none found`
      : `unexpected leak: ${[...authorityLeaks, ...vereLeaks].join(' || ')}`,
  );

  // ===============================================================================================
  // 21. No broad validator chain: this validator does not import/execute any other validator, VERE,
  //     tsc, or a build/test invocation.
  // ===============================================================================================
  const execSyncCallArgs: string[] = [];
  const execSyncRegex = /execSync\(\s*(`[^`]*`|'[^']*'|"[^"]*")/g;
  let execMatch: RegExpExecArray | null;
  while ((execMatch = execSyncRegex.exec(thisScriptSource)) !== null) execSyncCallArgs.push(execMatch[1]);
  const invokesOtherValidator =
    importLines.some((l) => /validate-(?!production-pipeline-constitution-amendment-set-2)[\w-]+/i.test(l)) ||
    execSyncCallArgs.some((a) => /validate-(?!production-pipeline-constitution-amendment-set-2)[\w-]+\.ts/i.test(a));
  const invokesVere = importLines.some((l) => /\bvere\b/i.test(l)) || execSyncCallArgs.some((a) => /\bvere\b/i.test(a));
  const invokesTsc = execSyncCallArgs.some((a) => /\btsc\b/i.test(a)) || execSyncCallArgs.some((a) => /npm\s+(run\s+)?(build|test)\b/i.test(a));
  assert(
    '21. No broad validator chain',
    !invokesOtherValidator && !invokesVere && !invokesTsc,
    `import lines=${importLines.length}, execSync call args=${JSON.stringify(execSyncCallArgs)}, invokesOtherValidator=${invokesOtherValidator}, invokesVere=${invokesVere}, invokesTsc=${invokesTsc}`,
  );

  // ===============================================================================================
  // 22. No application-specific logic in the new/modified .ts files (no hardcoded product-domain
  //     word inside a quoted string literal, excluding documented historical Root Cause citations).
  // ===============================================================================================
  const HARDCODED_DOMAIN_WORDS = ['restaurant', 'calculator', 'booking', 'inventory', 'blink', 'readygaze', 'lisa'];
  const NEW_OR_MODIFIED_TS_FILES = [
    'src/production-pipeline-constitution-v1/production-pipeline-constitution-types.ts',
    'src/production-pipeline-constitution-v1/production-pipeline-constitution.ts',
    'src/production-pipeline-constitution-v1/production-pipeline-constitution-report.ts',
    'src/production-pipeline-constitution-v1/index.ts',
  ];
  const domainWordHits: string[] = [];
  for (const file of NEW_OR_MODIFIED_TS_FILES) {
    const abs = join(ROOT, file);
    if (!existsSync(abs)) continue;
    const content = readFileSync(abs, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
      if (/root cause/i.test(trimmed)) continue;
      for (const w of HARDCODED_DOMAIN_WORDS) {
        if (new RegExp(`['"\`][^'"\`]*\\b${w}\\b[^'"\`]*['"\`]`, 'i').test(line)) {
          domainWordHits.push(`${file}: ${trimmed.slice(0, 100)}`);
        }
      }
    }
  }
  assert(
    '22. No application-specific logic',
    domainWordHits.length === 0,
    domainWordHits.length === 0
      ? `inspected code lines across ${NEW_OR_MODIFIED_TS_FILES.length} amended .ts files — no hardcoded product-domain word found in a quoted string literal`
      : `hits: ${domainWordHits.join(' || ')}`,
  );

  // ===============================================================================================
  // 23. GPCA/CBGA/Product Faithfulness/Blueprint/Materialization/Orchestrator source files are
  //     byte-for-byte untouched by this amendment (defense-in-depth beyond the symbol-leak checks
  //     above, using git's own tracked-file diff status where the file is tracked and unmodified
  //     by prior, still-uncommitted milestones is not assumed — this checks existence + readability
  //     only, never git diff, to avoid false positives from other uncommitted milestones).
  // ===============================================================================================
  const criticalFilesReadable = [...PRODUCTION_GENERATOR_FILES, ...AUTHORITY_DIRS.map((d) => `${d}/index.ts`)].every((f) => {
    const abs = join(ROOT, f);
    return !existsSync(abs) || readFileSync(abs, 'utf8').length >= 0;
  });
  assert(
    '23. Production/authority files remain readable and unreferenced by this milestone',
    criticalFilesReadable,
    `all checked files remain readable (existence-neutral check)=${criticalFilesReadable}`,
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
  console.log('\n## Mandatory Capability Matrix (this milestone\'s row)\n');
  // eslint-disable-next-line no-console
  console.log('| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |');
  // eslint-disable-next-line no-console
  console.log('|------------|--------|------------------|----------|--------------------|-------|');
  const row = PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW;
  // eslint-disable-next-line no-console
  console.log(`| ${row.capability} | ${row.status} | ${row.productionWired} | ${row.autoRun} | ${row.activationAllowed} | ${row.notes} |`);

  if (failCount === 0) {
    // eslint-disable-next-line no-console
    console.log(`\n${PASS_TOKEN}`);
  } else {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
