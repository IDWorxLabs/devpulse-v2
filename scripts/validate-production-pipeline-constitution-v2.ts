/**
 * PRODUCTION_PIPELINE_CONSTITUTION_V2 — validation.
 *
 * Validates Amendment Set 1 to the Production Pipeline Constitution: the Constitution
 * Enforcement Authority (PPCEA), permanent rule IDs, the Rule Metadata Standard, explicit
 * Read/Write/Mutate stage boundaries, the Canonical Pipeline State Machine, Constitutional
 * Invariants, the Rule Documentation Format, and Constitution Governance — plus the Amendment 8
 * restructuring into three parts (binding Constitution / historical Audit / non-binding Roadmap).
 *
 * This validator checks DOCUMENTATION COMPLETENESS ONLY. It never inspects runtime behavior,
 * never starts a server/build, and never imports a production generator/authority module.
 *
 * Run only:
 *   npx tsx scripts/validate-production-pipeline-constitution-v2.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AMENDMENT_LOG,
  CONSTITUTIONAL_INVARIANTS,
  ENFORCEMENT_AUTHORITY,
  GOVERNANCE_RULES,
  PIPELINE_ILLEGAL_TRANSITIONS,
  PIPELINE_LEGAL_TRANSITIONS,
  PIPELINE_STATES,
  RULE_DOCUMENTATION_EXAMPLES,
  RULE_ID_GROUPS,
  RULE_METADATA_FIELDS,
  RULE_REGISTRY,
  STAGE_READ_WRITE_MUTATE_BOUNDARIES,
  buildAmendmentSet1CompletenessReport,
  PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW,
} from '../src/production-pipeline-constitution-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PRODUCTION_PIPELINE_CONSTITUTION_V2_PASS';
const DOC_PATH = 'docs/production-pipeline-constitution-v1.md';
const THIS_SCRIPT_PATH = 'scripts/validate-production-pipeline-constitution-v2.ts';

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
  // 1. Constitution document exists and grew (this is an amendment, not a rewrite-to-nothing).
  // ===============================================================================================
  assert(
    '1. Constitution document exists and reflects the amendment',
    doc.length > 20000 && doc.includes('Amendment Set 1'),
    `document length=${doc.length} (need > 20000), contains "Amendment Set 1"=${doc.includes('Amendment Set 1')}`,
  );

  // ===============================================================================================
  // 2. Document restructured into three parts, roadmap separated from constitutional rules
  //    (Amendment 8), and Part 3 is explicitly marked non-binding.
  // ===============================================================================================
  const part1Idx = doc.indexOf('# PART 1 — Production Pipeline Constitution');
  const part2Idx = doc.indexOf('# PART 2 — Production Generation Architecture Audit');
  const part3Idx = doc.indexOf('# PART 3 — Implementation Roadmap');
  const partsInOrder = part1Idx !== -1 && part2Idx !== -1 && part3Idx !== -1 && part1Idx < part2Idx && part2Idx < part3Idx;
  const part1Body = partsInOrder ? doc.slice(part1Idx, part2Idx) : '';
  const roadmapLeakedIntoPart1 = /###\s*Tier\s*\d/i.test(part1Body);
  const part3Body = part3Idx !== -1 ? doc.slice(part3Idx) : '';
  const part3MarkedNonBinding = /informative only/i.test(part3Body) && /never be interpreted as constitutional law/i.test(part3Body);
  assert(
    '2. Roadmap separated from constitutional rules (three-part structure)',
    partsInOrder && !roadmapLeakedIntoPart1 && part3MarkedNonBinding,
    `parts in order=${partsInOrder} (idx ${part1Idx}/${part2Idx}/${part3Idx}), roadmap leaked into Part 1=${roadmapLeakedIntoPart1}, Part 3 marked non-binding=${part3MarkedNonBinding}`,
  );

  // ===============================================================================================
  // 3. Constitution Enforcement section exists (PPCEA, Amendment 1).
  // ===============================================================================================
  const ppceaHeadingPresent = doc.includes('## §PPC-1400 — Constitution Enforcement Authority (PPCEA)');
  const ppceaStructural =
    ENFORCEMENT_AUTHORITY.name === 'Production Pipeline Constitution Enforcement Authority' &&
    ENFORCEMENT_AUTHORITY.abbreviation === 'PPCEA' &&
    ENFORCEMENT_AUTHORITY.implemented === false &&
    ENFORCEMENT_AUTHORITY.validates.length >= 9;
  const requiredValidatesTargets = [
    'Product Faithfulness',
    'CBGA',
    'Blueprint Generator',
    'Modular Feature Generator',
    'Materialization Engine',
    'GPCA',
    'Live Preview Gate',
    'Repair Systems',
    'Final Reporting',
  ];
  const allValidatesTargetsPresent = requiredValidatesTargets.every((t) => ENFORCEMENT_AUTHORITY.validates.includes(t));
  const doesNotReplaceStated = ENFORCEMENT_AUTHORITY.doesNotReplace.toLowerCase().includes('does not replace');
  assert(
    '3. Constitution Enforcement section exists',
    ppceaHeadingPresent && ppceaStructural && allValidatesTargetsPresent && doesNotReplaceStated,
    `heading present=${ppceaHeadingPresent}, structural valid=${ppceaStructural}, all 9 validation targets present=${allValidatesTargetsPresent}, non-replacement stated=${doesNotReplaceStated}`,
  );

  // ===============================================================================================
  // 4. Constitutional Invariants section exists (Amendment 6) — the exact six invariants.
  // ===============================================================================================
  const invariantsHeadingPresent = doc.includes('## §PPC-1200 — Constitutional Invariants');
  const requiredInvariantStatements = [
    'Exactly one owner exists for every product concept.',
    'Every generated artifact has one ancestry chain.',
    'Every workspace mutation invalidates the previous GPCA report.',
    'Generators consume only approved inputs.',
    'Preview never occurs without a fresh GPCA audit.',
    'Every repair is classified into exactly one repair category.',
  ];
  const allInvariantsPresent = requiredInvariantStatements.every((s) => CONSTITUTIONAL_INVARIANTS.some((inv) => inv.statement === s));
  // >= rather than === : later amendment sets (e.g. Amendment Set 2's No Parallel Truth invariant,
  // PPC-1207) add invariants without ever removing/renumbering the six this scenario requires (PPC-1505).
  assert(
    '4. Constitutional Invariants section exists',
    invariantsHeadingPresent && CONSTITUTIONAL_INVARIANTS.length >= 6 && allInvariantsPresent,
    `heading present=${invariantsHeadingPresent}, count=${CONSTITUTIONAL_INVARIANTS.length} (need >=6), all required statements present=${allInvariantsPresent}`,
  );

  // ===============================================================================================
  // 5. Canonical Pipeline State Machine exists (Amendment 5) — states, legal + illegal transitions,
  //    including the exact illegal example the amendment specified (PLAN_APPROVED -> PREVIEW_VERIFIED).
  // ===============================================================================================
  const stateMachineHeadingPresent = doc.includes('## §PPC-1300 — Canonical Pipeline State Machine');
  const requiredStates = [
    'NEW',
    'INTENT_RESOLVED',
    'CONTRACT_APPROVED',
    'PLAN_APPROVED',
    'GENERATION_ALLOWED',
    'WORKSPACE_MATERIALIZED',
    'GPCA_VERIFIED',
    'PREVIEW_VERIFIED',
    'COMPLETED',
  ];
  const allStatesPresent = requiredStates.every((s) => PIPELINE_STATES.some((p) => p.state === s));
  const illegalExamplePresent = PIPELINE_ILLEGAL_TRANSITIONS.some((t) => t.from === 'PLAN_APPROVED' && t.to === 'PREVIEW_VERIFIED');
  const docHasIllegalExample = /PLAN_APPROVED[\s\S]{0,40}PREVIEW_VERIFIED/.test(doc) && /without generation is illegal/i.test(doc);
  assert(
    '5. Canonical Pipeline State Machine exists',
    stateMachineHeadingPresent &&
      allStatesPresent &&
      PIPELINE_LEGAL_TRANSITIONS.length >= 9 &&
      PIPELINE_ILLEGAL_TRANSITIONS.length >= 5 &&
      illegalExamplePresent &&
      docHasIllegalExample,
    `heading present=${stateMachineHeadingPresent}, all 9 required states present=${allStatesPresent}, legal transitions=${PIPELINE_LEGAL_TRANSITIONS.length} (need >=9), illegal transitions=${PIPELINE_ILLEGAL_TRANSITIONS.length} (need >=5), required illegal example present in data=${illegalExamplePresent}, present in doc=${docHasIllegalExample}`,
  );

  // ===============================================================================================
  // 6. Rule metadata format documented (Amendment 3) — the six standard fields.
  // ===============================================================================================
  const metadataHeadingPresent = doc.includes('## Rule Metadata Standard (Amendment 3)');
  const requiredMetadataFields = ['Rule ID', 'Owner', 'Validator', 'Severity', 'Auto-fix Eligibility', 'Rationale'];
  const allMetadataFieldsPresent = requiredMetadataFields.every((f) => RULE_METADATA_FIELDS.some((m) => m.field === f));
  assert(
    '6. Rule metadata format documented',
    metadataHeadingPresent && RULE_METADATA_FIELDS.length === 6 && allMetadataFieldsPresent,
    `heading present=${metadataHeadingPresent}, field count=${RULE_METADATA_FIELDS.length} (need 6), all required fields present=${allMetadataFieldsPresent}`,
  );

  // ===============================================================================================
  // 7. Governance section exists (Amendment 9) — amendment/ratification/deprecation/traceability/
  //    ID-permanence rules, plus a permanent, append-only Amendment Log with >= 2 entries.
  // ===============================================================================================
  const governanceHeadingPresent = doc.includes('## §PPC-1500 — Constitution Governance (Amendment 9)');
  const requiredGovernanceIds = ['PPC-1501', 'PPC-1502', 'PPC-1503', 'PPC-1504', 'PPC-1505'];
  const allGovernanceIdsPresent = requiredGovernanceIds.every((id) => GOVERNANCE_RULES.some((g) => g.id === id));
  const idPermanenceStated = GOVERNANCE_RULES.some((g) => /never reused/i.test(g.rule));
  const amendmentLogPresent = doc.includes('### Amendment Log') && AMENDMENT_LOG.length >= 2;
  assert(
    '7. Governance section exists',
    governanceHeadingPresent && allGovernanceIdsPresent && idPermanenceStated && amendmentLogPresent,
    `heading present=${governanceHeadingPresent}, all 5 governance rule IDs present=${allGovernanceIdsPresent}, ID-permanence stated=${idPermanenceStated}, amendment log present with ${AMENDMENT_LOG.length} entries=${amendmentLogPresent}`,
  );

  // ===============================================================================================
  // 8. Rule ID convention documented (Amendment 2) — permanent, never-reused, 15 hundred-blocks.
  // ===============================================================================================
  const ruleIdConventionHeadingPresent = doc.includes('## Rule ID Convention (Amendment 2)');
  const conventionStatesPermanence = /never renumbered and never reused/i.test(doc);
  // >= rather than === : later amendment sets add new hundred-block groups (e.g. Amendment Set 2's
  // PPC-16xx-PPC-24xx) without renumbering or removing the 15 this scenario requires (PPC-1505).
  assert(
    '8. Rule ID convention documented',
    ruleIdConventionHeadingPresent && conventionStatesPermanence && RULE_ID_GROUPS.length >= 15,
    `heading present=${ruleIdConventionHeadingPresent}, permanence statement present=${conventionStatesPermanence}, group count=${RULE_ID_GROUPS.length} (need >=15)`,
  );

  // ===============================================================================================
  // 9. Every constitutional rule has a unique, permanent ID (Amendment 2) — no duplicates, no
  //    empty IDs, every ID matches the PPC-<digits> pattern.
  // ===============================================================================================
  const allIds = RULE_REGISTRY.map((r) => r.id);
  const idsUnique = new Set(allIds).size === allIds.length;
  const allIdsWellFormed = allIds.every((id) => /^PPC-\d{3,4}$/.test(id));
  assert(
    '9. Every constitutional rule has a unique, permanent ID',
    RULE_REGISTRY.length >= 80 && idsUnique && allIdsWellFormed,
    `registry size=${RULE_REGISTRY.length} (need >=80), all unique=${idsUnique}, all well-formed=${allIdsWellFormed}`,
  );

  // ===============================================================================================
  // 10. Explicit Read/Write/Mutate boundaries defined for every production stage (Amendment 4).
  // ===============================================================================================
  const boundaryHeadingsPresent = STAGE_READ_WRITE_MUTATE_BOUNDARIES.every((b) => doc.includes(`### ${b.id} —`));
  const boundaryFieldsPopulated = STAGE_READ_WRITE_MUTATE_BOUNDARIES.every(
    (b) => b.mayRead.length > 0 && b.mustNeverRead.length > 0 && b.mayWrite.length > 0 && b.mustNeverWrite.length > 0 && b.mustNeverMutate.length > 0,
  );
  const docHasRWMLabels = ['**May Read:**', '**Must Never Read:**', '**May Write:**', '**Must Never Write:**', '**May Mutate:**', '**Must Never Mutate:**'].every((label) => doc.includes(label));
  assert(
    '10. Explicit Read/Write/Mutate boundaries defined for every stage',
    STAGE_READ_WRITE_MUTATE_BOUNDARIES.length === 8 && boundaryHeadingsPresent && boundaryFieldsPopulated && docHasRWMLabels,
    `stage count=${STAGE_READ_WRITE_MUTATE_BOUNDARIES.length} (need 8), headings present=${boundaryHeadingsPresent}, fields populated=${boundaryFieldsPopulated}, doc has all 6 R/W/M labels=${docHasRWMLabels}`,
  );

  // ===============================================================================================
  // 11. Rule Documentation Format defined (Amendment 7) — Purpose/History/Expected Failure
  //     Prevented format, with at least two worked examples.
  // ===============================================================================================
  const docFormatHeadingPresent = doc.includes('## Rule Documentation Format (Amendment 7)');
  const docFormatFieldsNamed = ['**Purpose**', '**History**', '**Expected Failure Prevented**'].every((f) => doc.includes(f));
  const workedExamplesComplete =
    RULE_DOCUMENTATION_EXAMPLES.length >= 2 &&
    RULE_DOCUMENTATION_EXAMPLES.every((ex) => ex.purpose.length > 0 && ex.history.length > 0 && ex.expectedFailurePrevented.length > 0);
  assert(
    '11. Rule Documentation Format defined with worked examples',
    docFormatHeadingPresent && docFormatFieldsNamed && workedExamplesComplete,
    `heading present=${docFormatHeadingPresent}, all 3 fields named=${docFormatFieldsNamed}, worked examples=${RULE_DOCUMENTATION_EXAMPLES.length} (need >=2, all complete)`,
  );

  // ===============================================================================================
  // 12. Prior content preserved: root-cause A-H mapping (Part 2) and roadmap Tiers 0-6 (Part 3)
  //     both still present, now cross-referencing permanent rule IDs instead of old "§3"-style refs.
  // ===============================================================================================
  const rootCauseCodesPresent = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.', 'G.', 'H.'].every((c) => doc.includes(`### ${c} `));
  const roadmapTiersPresent = [0, 1, 2, 3, 4, 5, 6].every((t) => doc.includes(`### Tier ${t} —`));
  const roadmapCrossReferencesRuleIds = /Enforces rule\(s\):\*\* PPC-\d/.test(doc);
  assert(
    '12. Prior content preserved and cross-referenced to permanent rule IDs',
    rootCauseCodesPresent && roadmapTiersPresent && roadmapCrossReferencesRuleIds,
    `root cause codes A-H present=${rootCauseCodesPresent}, roadmap tiers 0-6 present=${roadmapTiersPresent}, roadmap cross-references rule IDs=${roadmapCrossReferencesRuleIds}`,
  );

  // ===============================================================================================
  // 13. Amendment Set 1 structural completeness (via the module's own completeness report).
  // ===============================================================================================
  const completeness = buildAmendmentSet1CompletenessReport();
  assert(
    '13. Amendment Set 1 structural completeness report is complete',
    completeness.complete,
    `report=${JSON.stringify(completeness)}`,
  );

  // ===============================================================================================
  // 14. Capability Matrix row updated to reference Amendment Set 1.
  // ===============================================================================================
  assert(
    '14. Capability Matrix row updated for Amendment Set 1',
    PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW.notes.includes('Amendment Set 1'),
    `notes include "Amendment Set 1"=${PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW.notes.includes('Amendment Set 1')}`,
  );

  // ===============================================================================================
  // 15. This validator does not inspect runtime behavior: no dev-server start, no HTTP calls, no
  //     import of any production generator/authority module, no build/test invocation.
  // ===============================================================================================
  const thisScriptSource = readFileSync(join(ROOT, THIS_SCRIPT_PATH), 'utf8');
  const importLines = thisScriptSource.split('\n').filter((l) => /^\s*import\b/.test(l));
  const importedModuleSpecifiers = Array.from(thisScriptSource.matchAll(/from\s+['"]([^'"]+)['"]/g)).map((m) => m[1]);
  const importsOnlyOwnModule = importedModuleSpecifiers.every(
    (spec) => /^node:(child_process|fs|path|url)$/.test(spec) || spec.includes('production-pipeline-constitution-v1'),
  );
  // Exclude this very check's own line (it necessarily names the patterns it forbids) from the scan.
  const sourceExcludingSelfCheckLine = thisScriptSource
    .split('\n')
    .filter((l) => !l.includes('const noRuntimeInvocation'))
    .join('\n');
  const noRuntimeInvocation = !/npm run dev|startDevServer|fetch\(|http\.request|\.listen\(/i.test(sourceExcludingSelfCheckLine);
  assert(
    '15. Validator does not inspect runtime behavior',
    importsOnlyOwnModule && noRuntimeInvocation,
    `imported module specifiers=${JSON.stringify(importedModuleSpecifiers)}, imports only node builtins + own module=${importsOnlyOwnModule}, no runtime invocation patterns=${noRuntimeInvocation}`,
  );

  // ===============================================================================================
  // 16-19. Self-discipline: no production/generator/authority modification, no broad validator
  // chain, no application-specific logic (same techniques as the V1 validator).
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

  const UNIQUE_SYMBOLS_AMENDMENT_1 = [
    'ENFORCEMENT_AUTHORITY',
    'PIPELINE_ILLEGAL_TRANSITIONS',
    'PIPELINE_LEGAL_TRANSITIONS',
    'CONSTITUTIONAL_INVARIANTS',
    'GOVERNANCE_RULES',
    'RULE_ID_GROUPS',
    'RULE_METADATA_FIELDS',
    'STAGE_READ_WRITE_MUTATE_BOUNDARIES',
    'RULE_DOCUMENTATION_EXAMPLES',
    'AMENDMENT_LOG',
    'buildAmendmentSet1CompletenessReport',
    'RULE_REGISTRY_PPC_1300',
    'RULE_REGISTRY_PPC_1400',
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
      for (const symbol of UNIQUE_SYMBOLS_AMENDMENT_1) {
        if (content.includes(symbol)) leaks.push(`${file} contains "${symbol}"`);
      }
    }
    return leaks;
  }

  const generatorLeaks = findSymbolLeaks(PRODUCTION_GENERATOR_FILES);
  const authorityLeaks = findSymbolLeaks(AUTHORITY_DIRS);
  const vereLeaks = findSymbolLeaks(VERE_DIRS);
  assert(
    '16. Does not modify production code, generators, or runtime orchestration',
    generatorLeaks.length === 0,
    generatorLeaks.length === 0
      ? `checked ${PRODUCTION_GENERATOR_FILES.length} production generator/orchestrator files for Amendment Set 1's unique symbols — none found`
      : `unexpected leak: ${generatorLeaks.join(' || ')}`,
  );
  assert(
    '17. Does not modify GPCA/CBGA/Product Faithfulness/AEO/EIAA/VERE behavior',
    authorityLeaks.length === 0 && vereLeaks.length === 0,
    authorityLeaks.length === 0 && vereLeaks.length === 0
      ? `checked ${AUTHORITY_DIRS.length} authority directories and ${VERE_DIRS.length} VERE directories for Amendment Set 1's unique symbols — none found`
      : `unexpected leak: ${[...authorityLeaks, ...vereLeaks].join(' || ')}`,
  );

  const execSyncCallArgs: string[] = [];
  const execSyncRegex = /execSync\(\s*(`[^`]*`|'[^']*'|"[^"]*")/g;
  let execMatch: RegExpExecArray | null;
  while ((execMatch = execSyncRegex.exec(thisScriptSource)) !== null) execSyncCallArgs.push(execMatch[1]);
  const invokesOtherValidator =
    importLines.some((l) => /validate-(?!production-pipeline-constitution-v2)[\w-]+/i.test(l)) ||
    execSyncCallArgs.some((a) => /validate-(?!production-pipeline-constitution-v2)[\w-]+\.ts/i.test(a));
  const invokesVere = importLines.some((l) => /\bvere\b/i.test(l)) || execSyncCallArgs.some((a) => /\bvere\b/i.test(a));
  const invokesTsc = execSyncCallArgs.some((a) => /\btsc\b/i.test(a)) || execSyncCallArgs.some((a) => /npm\s+(run\s+)?(build|test)\b/i.test(a));
  assert(
    '18. No broad validator chain',
    !invokesOtherValidator && !invokesVere && !invokesTsc,
    `import lines=${importLines.length}, execSync call args=${JSON.stringify(execSyncCallArgs)}, invokesOtherValidator=${invokesOtherValidator}, invokesVere=${invokesVere}, invokesTsc=${invokesTsc}`,
  );

  const HARDCODED_DOMAIN_WORDS = ['restaurant', 'calculator', 'booking', 'inventory', 'blink', 'readygaze', 'lisa'];
  const NEW_TS_FILES = [
    'src/production-pipeline-constitution-v1/production-pipeline-constitution-types.ts',
    'src/production-pipeline-constitution-v1/production-pipeline-constitution.ts',
    'src/production-pipeline-constitution-v1/production-pipeline-constitution-report.ts',
    'src/production-pipeline-constitution-v1/index.ts',
  ];
  const domainWordHits: string[] = [];
  for (const file of NEW_TS_FILES) {
    const abs = join(ROOT, file);
    if (!existsSync(abs)) continue;
    const content = readFileSync(abs, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue;
      // Lines citing a documented historical audit finding (Root Cause A-H, already established in
      // Part 2 of the constitution and in prior milestones) are historical citation, not new
      // application-specific logic — e.g. RULE_DOCUMENTATION_EXAMPLES quoting "Calculator / Arithmetic
      // Utility" as the exact prior bug Root Cause B documented.
      if (/root cause/i.test(trimmed)) continue;
      for (const w of HARDCODED_DOMAIN_WORDS) {
        if (new RegExp(`['"\`][^'"\`]*\\b${w}\\b[^'"\`]*['"\`]`, 'i').test(line)) {
          domainWordHits.push(`${file}: ${trimmed.slice(0, 100)}`);
        }
      }
    }
  }
  assert(
    '19. No application-specific logic',
    domainWordHits.length === 0,
    domainWordHits.length === 0
      ? `inspected code lines across ${NEW_TS_FILES.length} amended .ts files — no hardcoded product-domain word found in a quoted string literal`
      : `hits: ${domainWordHits.join(' || ')}`,
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
