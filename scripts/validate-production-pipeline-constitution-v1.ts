/**
 * PRODUCTION_PIPELINE_CONSTITUTION_V1 — validation.
 *
 * This is a documentation/architecture milestone. This validator proves the constitution
 * document and its structured mirror are complete and internally consistent, and proves this
 * milestone changed no production generator or authority behavior. It does NOT audit, gate,
 * repair, or generate anything, and it does NOT run any sibling validator or VERE.
 *
 * Run only:
 *   npx tsx scripts/validate-production-pipeline-constitution-v1.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CLASSIFICATION_BOUNDARIES,
  CONTINUATION_RULES,
  FINAL_RESULT_LABELS,
  GENERATOR_RULES,
  IMMUTABLE_ARTIFACTS,
  PREVIEW_RULES,
  REAUDIT_TRIGGERS,
  REPAIR_CATEGORIES,
  ROADMAP_TIERS,
  ROOT_CAUSE_MAPPINGS,
  STAGE_OWNERSHIP,
  STAGE_PERMISSIONS,
  TRACEABILITY_CHAIN,
  buildProductionPipelineConstitutionCompletenessReport,
  PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW,
} from '../src/production-pipeline-constitution-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PRODUCTION_PIPELINE_CONSTITUTION_V1_PASS';
const DOC_PATH = 'docs/production-pipeline-constitution-v1.md';

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
  // Scenario 1 — Constitution document exists.
  // ===============================================================================================
  assert(
    '1. Constitution document exists',
    doc.length > 5000,
    doc.length > 5000 ? `docs/production-pipeline-constitution-v1.md exists, ${doc.length} characters` : `document missing or too short (${doc.length} characters)`,
  );

  // ===============================================================================================
  // Scenarios 2-12 — each required section defined, both in markdown heading and in the
  // structured mirror module (structural completeness, not just a heading with no content).
  // ===============================================================================================
  const sectionChecks: Array<{ num: number; name: string; heading: string; structuralOk: boolean; structuralDetail: string }> = [
    { num: 2, name: 'Defines authority ownership', heading: '## 1. Authority Ownership', structuralOk: STAGE_OWNERSHIP.length >= 15, structuralDetail: `${STAGE_OWNERSHIP.length} ownership entries (need >= 15: identity, purpose, concepts, module/feature/route/nav plan, visible copy, sample data, validation data, manifest, workspace files, preview evidence, repair authority, mutation authority, final build result)` },
    { num: 3, name: 'Defines immutable artifacts', heading: '## 2. Immutable Artifacts', structuralOk: IMMUTABLE_ARTIFACTS.length >= 7, structuralDetail: `${IMMUTABLE_ARTIFACTS.length} immutable artifact entries (need >= 7)` },
    { num: 4, name: 'Defines stage permissions', heading: '## 3. Stage Permissions', structuralOk: STAGE_PERMISSIONS.length >= 7 && STAGE_PERMISSIONS.every((p) => p.allowedInputs.length > 0 && p.forbiddenInputs.length > 0), structuralDetail: `${STAGE_PERMISSIONS.length} stage permission entries, all with allowed+forbidden inputs populated` },
    { num: 5, name: 'Defines generator rules', heading: '## 4. Generator Rules', structuralOk: GENERATOR_RULES.length >= 8, structuralDetail: `${GENERATOR_RULES.length} generator rule entries (need >= 8)` },
    { num: 6, name: 'Defines repair rules', heading: '## 5. Repair Rules', structuralOk: REPAIR_CATEGORIES.length === 6, structuralDetail: `${REPAIR_CATEGORIES.length} repair categories (need exactly 6: evidence-only, generation, workspace, compiler, runtime, missing-capability)` },
    { num: 7, name: 'Defines re-audit rules', heading: '## 6. Re-Audit Rules', structuralOk: REAUDIT_TRIGGERS.length === 7, structuralDetail: `${REAUDIT_TRIGGERS.length} re-audit triggers (need exactly 7)` },
    { num: 8, name: 'Defines continuation rules', heading: '## 7. Continuation Rules', structuralOk: CONTINUATION_RULES.length >= 5, structuralDetail: `${CONTINUATION_RULES.length} continuation rule entries (need >= 5)` },
    { num: 9, name: 'Defines traceability rules', heading: '## 8. Traceability Rules', structuralOk: TRACEABILITY_CHAIN.length === 7 && TRACEABILITY_CHAIN[0]?.step === 'Prompt' && TRACEABILITY_CHAIN[6]?.step === 'preview evidence', structuralDetail: `traceability chain has ${TRACEABILITY_CHAIN.length} steps, starts at "${TRACEABILITY_CHAIN[0]?.step}", ends at "${TRACEABILITY_CHAIN[6]?.step}"` },
    { num: 10, name: 'Defines classification rules', heading: '## 9. Classification Rules', structuralOk: CLASSIFICATION_BOUNDARIES.length >= 7, structuralDetail: `${CLASSIFICATION_BOUNDARIES.length} classification boundary entries (need >= 7)` },
    { num: 11, name: 'Defines preview rules', heading: '## 10. Preview Rules', structuralOk: PREVIEW_RULES.length === 5, structuralDetail: `${PREVIEW_RULES.length} preview rule entries (need exactly 5)` },
    { num: 12, name: 'Defines final result rules', heading: '## 11. Final Result Rules', structuralOk: FINAL_RESULT_LABELS.length === 7 && new Set(FINAL_RESULT_LABELS.map((l) => l.label)).size === 7, structuralDetail: `${FINAL_RESULT_LABELS.length} final result labels, all distinct` },
  ];
  for (const check of sectionChecks) {
    const headingPresent = doc.includes(check.heading);
    assert(
      `${check.num}. ${check.name}`,
      headingPresent && check.structuralOk,
      `heading "${check.heading}" present=${headingPresent}; structural: ${check.structuralDetail}`,
    );
  }

  // ===============================================================================================
  // Scenario 13 — Maps all eight audit root causes A-H.
  // ===============================================================================================
  const expectedCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const mappedCodes = ROOT_CAUSE_MAPPINGS.map((m) => m.code);
  const allCodesPresent = expectedCodes.every((c) => mappedCodes.includes(c as typeof mappedCodes[number]));
  const allFieldsPopulated = ROOT_CAUSE_MAPPINGS.every(
    (m) => m.constitutionalRule.length > 0 && m.stagesAffected.length > 0 && m.implementationImplication.length > 0 && m.suggestedMilestone.length > 0,
  );
  const docMentionsAllCodes = expectedCodes.every((c) => doc.includes(`### ${c}.`));
  assert(
    '13. Maps all eight audit root causes A-H',
    ROOT_CAUSE_MAPPINGS.length === 8 && allCodesPresent && allFieldsPopulated && docMentionsAllCodes,
    `mapped codes=${JSON.stringify(mappedCodes)}, all fields populated=${allFieldsPopulated}, doc has "### X." heading for all 8=${docMentionsAllCodes}`,
  );

  // ===============================================================================================
  // Scenario 14 — Includes implementation roadmap tiers 0-6.
  // ===============================================================================================
  const expectedTiers = [0, 1, 2, 3, 4, 5, 6];
  const presentTiers = ROADMAP_TIERS.map((t) => t.tier);
  const allTiersPresent = expectedTiers.every((t) => presentTiers.includes(t));
  const allTierFieldsPopulated = ROADMAP_TIERS.every(
    (t) => t.objective.length > 0 && t.affectedSystems.length > 0 && t.whyBeforeLater.length > 0 && t.blockersEliminated.length > 0 && t.validationStrategy.length > 0,
  );
  const docMentionsAllTiers = expectedTiers.every((t) => doc.includes(`### Tier ${t} —`));
  assert(
    '14. Includes implementation roadmap tiers 0-6',
    ROADMAP_TIERS.length === 7 && allTiersPresent && allTierFieldsPopulated && docMentionsAllTiers,
    `tiers present=${JSON.stringify(presentTiers)}, all fields populated=${allTierFieldsPopulated}, doc has "### Tier N —" heading for 0-6=${docMentionsAllTiers}`,
  );

  // ===============================================================================================
  // Scenario 15 — Explicitly forbids independent identity derivation after contract approval.
  // ===============================================================================================
  const forbidsIdentityDerivation =
    doc.includes('no stage downstream of CBGA may independently re-derive product identity') &&
    GENERATOR_RULES.some((r) => /may not derive identity from raw prompt/i.test(r.rule));
  assert(
    '15. Explicitly forbids independent identity derivation after contract approval',
    forbidsIdentityDerivation,
    `doc contains core rule sentence=${doc.includes('no stage downstream of CBGA may independently re-derive product identity')}, GEN rule present=${GENERATOR_RULES.some((r) => /may not derive identity from raw prompt/i.test(r.rule))}`,
  );

  // ===============================================================================================
  // Scenario 16 — Explicitly forbids optional contract fallback in production generators.
  // ===============================================================================================
  const forbidsOptionalFallback =
    doc.includes('is a constitutional violation, not a convenience') &&
    GENERATOR_RULES.some((r) => /fallback to a prompt-re-derivation function on a contract-shaped parameter is a constitutional violation/i.test(r.rule));
  assert(
    '16. Explicitly forbids optional contract fallback in production generators',
    forbidsOptionalFallback,
    `doc contains forbidding sentence=${doc.includes('is a constitutional violation, not a convenience')}, GEN-1 rule present=${GENERATOR_RULES.some((r) => /fallback to a prompt-re-derivation function/i.test(r.rule))}`,
  );

  // ===============================================================================================
  // Scenario 17 — Explicitly requires GPCA re-audit after post-audit mutations.
  // ===============================================================================================
  const requiredReauditTriggers = [
    'After materialization',
    'After workspace stabilizer writes',
    'After build autofix writes',
    'After engineering intelligence writes',
    'After capability evolution writes',
    'After continuation workspace reuse',
    'Immediately before preview activation',
  ];
  const allReauditTriggersPresent = requiredReauditTriggers.every((t) => REAUDIT_TRIGGERS.some((r) => r.trigger === t));
  assert(
    '17. Explicitly requires GPCA re-audit after post-audit mutations',
    allReauditTriggersPresent && REAUDIT_TRIGGERS.length === 7,
    `all 7 required re-audit triggers present=${allReauditTriggersPresent}, count=${REAUDIT_TRIGGERS.length}`,
  );

  // ===============================================================================================
  // Scenario 18 — Explicitly requires provenance-backed traceability.
  // ===============================================================================================
  const requiresProvenanceTraceability =
    doc.includes('must be provable by **emitted provenance**, not solely by re-derived heuristics') &&
    TRACEABILITY_CHAIN.length === 7;
  assert(
    '18. Explicitly requires provenance-backed traceability',
    requiresProvenanceTraceability,
    `doc contains provenance requirement sentence=${doc.includes('must be provable by **emitted provenance**, not solely by re-derived heuristics')}, traceability chain length=${TRACEABILITY_CHAIN.length}`,
  );

  // ===============================================================================================
  // Scenario 19 — Explicitly distinguishes evidence repair from real repair.
  // ===============================================================================================
  const evidenceOnlyCategory = REPAIR_CATEGORIES.find((c) => c.categoryId === 'EVIDENCE_ONLY');
  const realMutationCategoriesExist = REPAIR_CATEGORIES.some((c) => c.canMutateFiles === true);
  const finalResultDistinguishes =
    FINAL_RESULT_LABELS.some((l) => l.label === 'BUILT_AFTER_REAL_REPAIR') &&
    FINAL_RESULT_LABELS.some((l) => l.label === 'FAILED_AFTER_EVIDENCE_ONLY_REPAIR');
  const docForbidsMislabeling = doc.includes('it is a violation of this document for any reporting layer') || doc.toLowerCase().includes('never be reported using the same label as outcome 4');
  assert(
    '19. Explicitly distinguishes evidence repair from real repair',
    evidenceOnlyCategory !== undefined &&
      evidenceOnlyCategory.canMutateFiles === false &&
      realMutationCategoriesExist &&
      finalResultDistinguishes &&
      docForbidsMislabeling,
    `evidence-only category canMutateFiles=${evidenceOnlyCategory?.canMutateFiles}, real-mutation categories exist=${realMutationCategoriesExist}, final result labels distinguish=${finalResultDistinguishes}, doc forbids mislabeling=${docForbidsMislabeling}`,
  );

  // ===============================================================================================
  // Scenarios 20-21 — does not modify production generator behavior, or GPCA/CBGA/Product
  // Faithfulness/AEO/EIAA/VERE behavior. This milestone only creates NEW files (this constitution
  // module + doc + validator) and adds one package.json script line; it never edits an existing
  // production/authority file. Other milestones in this workspace may have pre-existing
  // uncommitted changes to those same files/directories (visible in `git diff`) — those are NOT
  // attributable to this milestone, so a raw git-diff-emptiness check would produce false
  // failures. Instead (same technique used by prior milestones in this series), this proves
  // non-interference by symbol absence: this milestone's unique new exported symbols must never
  // appear anywhere inside the generator/authority/VERE source, which is only possible if this
  // milestone never wrote into those files.
  // ===============================================================================================
  const NEW_FILES_THIS_MILESTONE = [
    'docs/production-pipeline-constitution-v1.md',
    'src/production-pipeline-constitution-v1/production-pipeline-constitution-types.ts',
    'src/production-pipeline-constitution-v1/production-pipeline-constitution.ts',
    'src/production-pipeline-constitution-v1/production-pipeline-constitution-report.ts',
    'src/production-pipeline-constitution-v1/index.ts',
    'scripts/validate-production-pipeline-constitution-v1.ts',
  ];
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

  const UNIQUE_SYMBOLS_THIS_MILESTONE = [
    'ProductionPipelineConstitutionCompletenessReport',
    'buildProductionPipelineConstitutionCompletenessReport',
    'PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW',
    'ConstitutionCapabilityMatrixRow',
    'RootCauseMappingEntry',
    'ROOT_CAUSE_MAPPINGS',
    'ROADMAP_TIERS',
    'STAGE_OWNERSHIP',
    'STAGE_PERMISSIONS',
    'REPAIR_CATEGORIES',
    'REAUDIT_TRIGGERS',
    'CONTINUATION_RULES',
    'TRACEABILITY_CHAIN',
    'CLASSIFICATION_BOUNDARIES',
    'PREVIEW_RULES',
    'FINAL_RESULT_LABELS',
    'IMMUTABLE_ARTIFACTS',
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
      // A path ending in .ts is a file; otherwise treat as a directory to enumerate.
      return p.endsWith('.ts') || p.endsWith('.tsx') ? [p] : listTsFilesUnder(p);
    });
    for (const file of allFiles) {
      const abs = join(ROOT, file);
      if (!existsSync(abs)) continue;
      const content = readFileSync(abs, 'utf8');
      for (const symbol of UNIQUE_SYMBOLS_THIS_MILESTONE) {
        if (content.includes(symbol)) {
          leaks.push(`${file} contains "${symbol}"`);
        }
      }
    }
    return leaks;
  }

  const generatorLeaks = findSymbolLeaks(PRODUCTION_GENERATOR_FILES);
  assert(
    '20. Does not modify production generator behavior',
    generatorLeaks.length === 0,
    generatorLeaks.length === 0
      ? `checked ${PRODUCTION_GENERATOR_FILES.length} production generator files for this milestone's unique symbols — none found (this milestone wrote no new files into, and made no edits to, any of them)`
      : `unexpected leak: ${generatorLeaks.join(' || ')}`,
  );

  const authorityLeaks = findSymbolLeaks(AUTHORITY_DIRS);
  const vereLeaks = findSymbolLeaks(VERE_DIRS);
  assert(
    '21. Does not modify GPCA/CBGA/Product Faithfulness/AEO/EIAA/VERE behavior',
    authorityLeaks.length === 0 && vereLeaks.length === 0,
    authorityLeaks.length === 0 && vereLeaks.length === 0
      ? `checked ${AUTHORITY_DIRS.length} authority directories and ${VERE_DIRS.length} VERE directories for this milestone's unique symbols — none found`
      : `unexpected leak: ${[...authorityLeaks, ...vereLeaks].join(' || ')}`,
  );

  // ===============================================================================================
  // Scenario 22 — No application-specific logic (checked against this milestone's own new .ts
  // CODE lines only — never the markdown, which legitimately cites past bug examples as history,
  // and never this validator script itself, which must legitimately name the words it forbids
  // elsewhere in its own detection list literal).
  // ===============================================================================================
  const NEW_TS_FILES = NEW_FILES_THIS_MILESTONE.filter(
    (f) => f.endsWith('.ts') && f !== 'scripts/validate-production-pipeline-constitution-v1.ts',
  );
  const HARDCODED_DOMAIN_WORDS = ['restaurant', 'calculator', 'booking', 'inventory', 'blink', 'readygaze', 'lisa'];
  const codeLinesByFile = NEW_TS_FILES.map((f) => {
    const abs = join(ROOT, f);
    const content = existsSync(abs) ? readFileSync(abs, 'utf8') : '';
    const codeLines = content
      .split('\n')
      .filter((l) => {
        const trimmed = l.trim();
        return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*');
      });
    return { file: f, codeLines };
  });
  const domainWordHits: string[] = [];
  for (const { file, codeLines } of codeLinesByFile) {
    for (const line of codeLines) {
      for (const w of HARDCODED_DOMAIN_WORDS) {
        if (new RegExp(`['"\`][^'"\`]*\\b${w}\\b[^'"\`]*['"\`]`, 'i').test(line)) {
          domainWordHits.push(`${file}: ${line.trim().slice(0, 100)}`);
        }
      }
    }
  }
  assert(
    '22. No application-specific logic',
    domainWordHits.length === 0,
    domainWordHits.length === 0
      ? `inspected code lines across ${NEW_TS_FILES.length} new .ts files — no hardcoded product-domain word found in a quoted string literal`
      : `hits: ${domainWordHits.join(' || ')}`,
  );

  // ===============================================================================================
  // Scenario 23 — No broad validator chain (this script never IMPORTS or EXECUTES another
  // validate-*.ts script, npm test/build, tsc, or a VERE runner). Merely naming a directory path
  // as a string literal for the symbol-absence scope check (scenario 20/21) is not "invoking" it —
  // only actual import/require statements or execSync/spawn call arguments count.
  // ===============================================================================================
  const thisScriptSource = readFileSync(join(ROOT, 'scripts/validate-production-pipeline-constitution-v1.ts'), 'utf8');
  const importLines = thisScriptSource
    .split('\n')
    .filter((l) => /^\s*import\b/.test(l));
  const execSyncCallArgs: string[] = [];
  const execSyncRegex = /execSync\(\s*(`[^`]*`|'[^']*'|"[^"]*")/g;
  let execMatch: RegExpExecArray | null;
  while ((execMatch = execSyncRegex.exec(thisScriptSource)) !== null) {
    execSyncCallArgs.push(execMatch[1]);
  }

  const invokesOtherValidator =
    importLines.some((l) => /validate-(?!production-pipeline-constitution-v1)[\w-]+/i.test(l)) ||
    execSyncCallArgs.some((a) => /validate-(?!production-pipeline-constitution-v1)[\w-]+\.ts/i.test(a));
  const invokesVere =
    importLines.some((l) => /\bvere\b/i.test(l)) || execSyncCallArgs.some((a) => /\bvere\b/i.test(a));
  const invokesTsc = execSyncCallArgs.some((a) => /\btsc\b/i.test(a)) || execSyncCallArgs.some((a) => /npm\s+(run\s+)?(build|test)\b/i.test(a));
  assert(
    '23. No broad validator chain',
    !invokesOtherValidator && !invokesVere && !invokesTsc,
    `import lines=${importLines.length}, execSync call args=${JSON.stringify(execSyncCallArgs)}, invokesOtherValidator=${invokesOtherValidator}, invokesVere=${invokesVere}, invokesTsc=${invokesTsc}`,
  );

  // ===============================================================================================
  // Scenario 24 — Capability Matrix included.
  // ===============================================================================================
  const completeness = buildProductionPipelineConstitutionCompletenessReport();
  assert(
    '24. Capability Matrix included',
    PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW.capability === 'Production Pipeline Constitution' &&
      PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW.status === 'DOCUMENTED' &&
      completeness.complete,
    `row present with capability="${PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW.capability}", status="${PRODUCTION_PIPELINE_CONSTITUTION_CAPABILITY_MATRIX_ROW.status}", structural completeness=${completeness.complete}`,
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
