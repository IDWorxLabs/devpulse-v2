/**
 * Product Stabilization Phase 3 V1 — validation suite.
 *
 * Confirms that AiDevEngine audits and, where safe, repairs the generated workspace
 * immediately after materialization and BEFORE npm install / npm build / preview begin — via
 * the workspace-materialization-stabilizer-v1 module — that the stabilizer is wired into the
 * build pipeline ahead of npm install, that its status is surfaced in the build response, the
 * Phase 1 normalizer, and the simplified builder UI (with raw evidence only in Advanced
 * Diagnostics), and that the module stays fully generic (no app-specific hardcoding).
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exitValidator } from '../src/windows-validator-clean-exit-v1/index.js';
import {
  stabilizeWorkspaceMaterialization,
  type WorkspaceMaterializationReport,
} from '../src/workspace-materialization-stabilizer-v1/index.js';
import { normalizeBuildResult, type BuildResultNormalizerInput } from '../src/build-result-normalizer-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

export const PRODUCT_STABILIZATION_PHASE_3_V1_PASS_TOKEN = 'PRODUCT_STABILIZATION_PHASE_3_V1_PASS';

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];
const tempDirs: string[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

/** Forbidden app-specific hardcoding — this stabilizer must stay generic for any generated app. */
const FORBIDDEN_APP_SPECIFIC_TERMS = ['counter', 'todo', 'calculator', 'crm', 'lisa', 'expense-tracker', 'expense tracker'];

function containsForbiddenAppSpecificTerm(source: string): string | null {
  for (const term of FORBIDDEN_APP_SPECIFIC_TERMS) {
    const re = term.includes(' ') || term.includes('-') ? new RegExp(term, 'i') : new RegExp(`\\b${term}\\b`, 'i');
    if (re.test(source)) return term;
  }
  return null;
}

function containsAuthOnlyAssumption(source: string): boolean {
  return /\bauth\b/i.test(source);
}

/** Builds a minimal, complete, internally-consistent single-feature-module workspace on disk. */
function makeCompleteWorkspace(): string {
  const dir = makeTempDir('wms-validate-complete-');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'generated-app', devDependencies: { vite: '^5.0.0' } }));
  writeFileSync(join(dir, 'tsconfig.json'), '{}');
  writeFileSync(join(dir, 'vite.config.ts'), "import { defineConfig } from 'vite';\nexport default defineConfig({});\n");
  writeFileSync(join(dir, 'index.html'), '<!DOCTYPE html><html><body><div id="root"></div></body></html>');
  mkdirSync(join(dir, 'src/features/dashboard'), { recursive: true });
  writeFileSync(join(dir, 'src/main.tsx'), "import App from './App';\nApp;\n");
  writeFileSync(
    join(dir, 'src/App.tsx'),
    "import FeatureAppRouter from './features/FeatureAppRouter';\nexport default function App(){ return FeatureAppRouter; }\n",
  );
  writeFileSync(
    join(dir, 'src/features/FeatureAppRouter.tsx'),
    "import { FEATURE_REGISTRY } from './registry';\nFEATURE_REGISTRY;\nexport default function R(){return null;}\n",
  );
  writeFileSync(
    join(dir, 'src/features/registry.ts'),
    "import DashboardFeature from './dashboard';\nexport const FEATURE_REGISTRY = [{ id: 'dashboard', name: 'Dashboard', route: '/dashboard', component: DashboardFeature, sourcePath: 'src/features/dashboard/DashboardFeature.tsx', contractId: 'feature-dashboard', promptTerms: [], status: 'generated' }] as const;\n",
  );
  writeFileSync(
    join(dir, 'src/features/routes.ts'),
    "import { FEATURE_REGISTRY } from './registry';\nexport const APP_ROUTES = FEATURE_REGISTRY.map((e) => ({ path: e.route, component: e.component }));\n",
  );
  writeFileSync(join(dir, 'src/features/dashboard/DashboardFeature.tsx'), 'export default function DashboardFeature(){ return null; }\n');
  writeFileSync(join(dir, 'src/features/dashboard/dashboard.types.ts'), 'export interface DashboardRecord { id: string; }\n');
  writeFileSync(join(dir, 'src/features/dashboard/dashboard.service.ts'), 'export function listDashboardRecords(){ return []; }\n');
  writeFileSync(join(dir, 'src/features/dashboard/dashboard.validation.ts'), 'export const DASHBOARD_VALIDATION = { rules: [] };\n');
  writeFileSync(join(dir, 'src/features/dashboard/index.ts'), "export { default } from './DashboardFeature';\n");
  writeFileSync(
    join(dir, '.generated-app-manifest.json'),
    JSON.stringify({
      generatedFeatureModulesCount: 1,
      featureModules: ['dashboard'],
      routes: ['/dashboard'],
      featureModuleDetails: [
        {
          id: 'dashboard',
          name: 'Dashboard',
          route: '/dashboard',
          componentPath: 'src/features/dashboard/DashboardFeature.tsx',
          servicePath: 'src/features/dashboard/dashboard.service.ts',
          typesPath: 'src/features/dashboard/dashboard.types.ts',
          validationPath: 'src/features/dashboard/dashboard.validation.ts',
        },
      ],
    }),
  );
  return dir;
}

function baseInput(overrides: Partial<BuildResultNormalizerInput>): BuildResultNormalizerInput {
  return {
    status: 'READY',
    npmInstallOk: true,
    npmBuildOk: true,
    devServerRunning: true,
    previewUrl: 'http://127.0.0.1:5174/',
    failureReason: null,
    ...overrides,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('Product Stabilization Phase 3 V1 — Validation');
  console.log('===============================================');
  console.log('');

  try {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
    assert(
      '00. package script registered',
      Boolean(pkg.scripts?.['validate:product-stabilization-phase-3-v1']),
      'validate:product-stabilization-phase-3-v1',
    );

    // --- Module exists with all required files --------------------------------------

    const moduleDir = join(ROOT, 'src/workspace-materialization-stabilizer-v1');
    const expectedFiles = [
      'index.ts',
      'workspace-materialization-types.ts',
      'workspace-materialization-validator.ts',
      'workspace-materialization-stabilizer.ts',
      'workspace-materialization-auditor.ts',
      'workspace-materialization-repair.ts',
      'workspace-materialization-report.ts',
    ];
    const missingFiles = expectedFiles.filter((f) => !existsSync(join(moduleDir, f)));
    assert(
      '01. workspace-materialization-stabilizer-v1 module exists with all required files',
      missingFiles.length === 0,
      missingFiles.join(', ') || 'all present',
    );
    assert(
      '02. module exports the public stabilizer function',
      typeof stabilizeWorkspaceMaterialization === 'function',
      'stabilizeWorkspaceMaterialization exported',
    );

    // --- Scenario 1: complete workspace -> WORKSPACE_COMPLETE ------------------------

    const completeDir = makeCompleteWorkspace();
    const r1 = stabilizeWorkspaceMaterialization({ workspaceDir: completeDir });
    assert(
      '03. Scenario 1 — complete workspace returns WORKSPACE_COMPLETE',
      r1.status === 'WORKSPACE_COMPLETE' && r1.evidence.findings.length === 0,
      `${r1.status}, ${r1.evidence.findings.length} findings`,
    );

    // --- Scenario 2: missing generated file -> WORKSPACE_REPAIRED -------------------

    const missingFileDir = makeCompleteWorkspace();
    rmSync(join(missingFileDir, 'src/features/dashboard/dashboard.types.ts'));
    const r2 = stabilizeWorkspaceMaterialization({ workspaceDir: missingFileDir });
    assert(
      '04. Scenario 2 — missing generated file is repaired -> WORKSPACE_REPAIRED',
      r2.status === 'WORKSPACE_REPAIRED' &&
        existsSync(join(missingFileDir, 'src/features/dashboard/dashboard.types.ts')) &&
        r2.repairActions.some((a) => a.applied),
      r2.status,
    );

    // --- Scenario 3: broken import -> repair -> pass ---------------------------------

    const brokenImportDir = makeCompleteWorkspace();
    writeFileSync(join(brokenImportDir, 'src/main.tsx'), "import App from './Apps';\n");
    const r3 = stabilizeWorkspaceMaterialization({ workspaceDir: brokenImportDir });
    const mainAfterRepair = readFileSync(join(brokenImportDir, 'src/main.tsx'), 'utf8');
    assert(
      '05. Scenario 3 — broken import is repaired -> WORKSPACE_REPAIRED, import now resolves',
      r3.status === 'WORKSPACE_REPAIRED' && mainAfterRepair.includes("'./App'"),
      `${r3.status}; main.tsx: ${mainAfterRepair.trim()}`,
    );

    // --- Scenario 4: broken route registration -> repair -> pass --------------------

    const brokenRouteDir = makeCompleteWorkspace();
    writeFileSync(join(brokenRouteDir, 'src/features/registry.ts'), 'export const FEATURE_REGISTRY = [] as const;\n');
    const r4 = stabilizeWorkspaceMaterialization({ workspaceDir: brokenRouteDir });
    const registryAfterRepair = readFileSync(join(brokenRouteDir, 'src/features/registry.ts'), 'utf8');
    assert(
      '06. Scenario 4 — broken route registration is repaired -> WORKSPACE_REPAIRED',
      r4.status === 'WORKSPACE_REPAIRED' && registryAfterRepair.includes("id: 'dashboard'"),
      r4.status,
    );

    // --- Scenario 5: missing package.json -> WORKSPACE_BLOCKED, no fake repair ------

    const missingPkgDir = makeCompleteWorkspace();
    rmSync(join(missingPkgDir, 'package.json'));
    const r5 = stabilizeWorkspaceMaterialization({ workspaceDir: missingPkgDir });
    assert(
      '07. Scenario 5 — missing package.json is WORKSPACE_BLOCKED with no fake repair',
      r5.status === 'WORKSPACE_BLOCKED' &&
        !existsSync(join(missingPkgDir, 'package.json')) &&
        r5.repairActions.every((a) => a.kind !== 'MISSING_PACKAGE_JSON'),
      r5.status,
    );

    // --- Scenario 6: missing App entry -> repair if contract permits, else blocked --

    const missingAppWithEvidenceDir = makeCompleteWorkspace();
    rmSync(join(missingAppWithEvidenceDir, 'src/App.tsx'));
    const r6a = stabilizeWorkspaceMaterialization({ workspaceDir: missingAppWithEvidenceDir });
    assert(
      '08a. Scenario 6 — missing App entry is repaired when feature module evidence exists',
      r6a.status === 'WORKSPACE_REPAIRED' && existsSync(join(missingAppWithEvidenceDir, 'src/App.tsx')),
      r6a.status,
    );

    const missingAppNoEvidenceDir = makeTempDir('wms-validate-noapp-');
    writeFileSync(join(missingAppNoEvidenceDir, 'package.json'), '{}');
    writeFileSync(join(missingAppNoEvidenceDir, 'tsconfig.json'), '{}');
    writeFileSync(join(missingAppNoEvidenceDir, 'index.html'), '<div></div>');
    mkdirSync(join(missingAppNoEvidenceDir, 'src'), { recursive: true });
    writeFileSync(join(missingAppNoEvidenceDir, 'src/main.tsx'), "import App from './App';\n");
    const r6b = stabilizeWorkspaceMaterialization({ workspaceDir: missingAppNoEvidenceDir });
    assert(
      '08b. Scenario 6 — missing App entry with no feature evidence is WORKSPACE_BLOCKED',
      r6b.status === 'WORKSPACE_BLOCKED' && !existsSync(join(missingAppNoEvidenceDir, 'src/App.tsx')),
      r6b.status,
    );

    // --- Scenario 7: manifest mismatch -> repair -> pass -----------------------------

    const manifestMismatchDir = makeCompleteWorkspace();
    writeFileSync(
      join(manifestMismatchDir, '.generated-app-manifest.json'),
      JSON.stringify({
        generatedFeatureModulesCount: 2,
        featureModules: ['dashboard'],
        routes: [],
        featureModuleDetails: [
          {
            id: 'dashboard',
            name: 'Dashboard',
            route: '/dashboard',
            componentPath: 'src/features/dashboard/DashboardFeature.tsx',
            servicePath: 'src/features/dashboard/dashboard.service.ts',
            typesPath: 'src/features/dashboard/dashboard.types.ts',
            validationPath: 'src/features/dashboard/dashboard.validation.ts',
          },
        ],
      }),
    );
    const r7 = stabilizeWorkspaceMaterialization({ workspaceDir: manifestMismatchDir });
    const manifestAfterRepair = JSON.parse(readFileSync(join(manifestMismatchDir, '.generated-app-manifest.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    assert(
      '09. Scenario 7 — manifest mismatch is repaired -> WORKSPACE_REPAIRED, counts corrected',
      r7.status === 'WORKSPACE_REPAIRED' && manifestAfterRepair.generatedFeatureModulesCount === 1,
      `${r7.status}, count=${String(manifestAfterRepair.generatedFeatureModulesCount)}`,
    );

    // --- Scenario 8: workspace corruption -> WORKSPACE_CORRUPTED, no blind regen ----

    const corruptedDir = makeCompleteWorkspace();
    writeFileSync(join(corruptedDir, 'package.json'), '{ this is not valid json');
    const r8 = stabilizeWorkspaceMaterialization({ workspaceDir: corruptedDir });
    const packageJsonUnchanged = readFileSync(join(corruptedDir, 'package.json'), 'utf8') === '{ this is not valid json';
    assert(
      '10. Scenario 8 — corrupted workspace returns WORKSPACE_CORRUPTED and is left untouched',
      r8.status === 'WORKSPACE_CORRUPTED' && r8.repairActions.length === 0 && packageJsonUnchanged,
      r8.status,
    );

    // --- Scenario 9: build pipeline integration — stabilizer always runs first ------

    const orchestratorTs = readFileSync(join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts'), 'utf8');
    const stabilizerCallIndex = orchestratorTs.indexOf('stabilizeWorkspaceMaterialization({');
    const npmInstallIndex = orchestratorTs.indexOf("execSync('npm install");
    assert(
      '11. Scenario 9 — Workspace Stabilizer always runs before npm install in the orchestrator',
      stabilizerCallIndex > -1 && npmInstallIndex > -1 && stabilizerCallIndex < npmInstallIndex,
      `stabilizer@${stabilizerCallIndex}, npmInstall@${npmInstallIndex}`,
    );
    assert(
      '11b. Orchestrator blocks npm install when the workspace is BLOCKED or CORRUPTED',
      /WORKSPACE_BLOCKED[\s\S]{0,120}WORKSPACE_CORRUPTED|WORKSPACE_CORRUPTED[\s\S]{0,120}WORKSPACE_BLOCKED/.test(
        orchestratorTs.slice(stabilizerCallIndex, npmInstallIndex),
      ),
      'gate present between stabilizer call and npm install',
    );

    // --- Scenario 10: build response includes workspaceMaterializationStatus --------

    const handlerTs = readFileSync(join(ROOT, 'server/build-from-prompt-handler.ts'), 'utf8');
    const handlerMatches = (handlerTs.match(/workspaceMaterializationStatus/g) || []).length;
    assert(
      '12. Scenario 10 — build response includes workspaceMaterializationStatus in both response paths',
      handlerMatches >= 2,
      `${handlerMatches} references found`,
    );

    // --- Normalizer integration: independent stages reported ------------------------

    const workspaceRepairedReportStub: WorkspaceMaterializationReport = {
      readOnly: true,
      contractVersion: 'WORKSPACE_MATERIALIZATION_STABILIZER_V1',
      status: 'WORKSPACE_REPAIRED',
      evidence: {
        readOnly: true,
        workspaceDir: '/tmp/fake',
        workspaceExists: true,
        corrupted: false,
        corruptionReasons: [],
        manifestFound: true,
        manifestParseError: null,
        featureModules: [],
        findings: [],
        filesChecked: 6,
      },
      repairActions: [
        {
          readOnly: true,
          findingId: 'finding-1',
          kind: 'MISSING_ROUTE_REGISTRATION',
          path: 'src/features/registry.ts',
          description: 'Repaired feature registry and routes',
          applied: true,
          detail: 'Regenerated registry.ts and routes.ts.',
        },
      ],
      summary: {
        readOnly: true,
        headline: 'AiDevEngine repaired 1 workspace issue before the build started.',
        repaired: ['Repaired feature registry and routes'],
        stillMissing: [],
        whatToDoNext: 'The workspace is ready — the build will continue automatically.',
      },
      durationMs: 12,
    };
    const normalizedWithWorkspaceRepaired = normalizeBuildResult(
      baseInput({ workspaceStabilizerReport: workspaceRepairedReportStub }),
    );
    assert(
      '13. Normalizer reports Workspace Ready / Dependencies Ready / Build Ready / Preview Ready independently',
      normalizedWithWorkspaceRepaired.stages.workspaceReady === true &&
        normalizedWithWorkspaceRepaired.stages.dependenciesReady === true &&
        normalizedWithWorkspaceRepaired.stages.buildReady === true &&
        normalizedWithWorkspaceRepaired.stages.previewReady === true &&
        normalizedWithWorkspaceRepaired.workspaceMaterialization !== null &&
        normalizedWithWorkspaceRepaired.workspaceMaterialization.status === 'WORKSPACE_REPAIRED' &&
        normalizedWithWorkspaceRepaired.result === 'BUILT_SUCCESSFULLY',
      JSON.stringify(normalizedWithWorkspaceRepaired.stages),
    );

    const workspaceIncompleteReportStub: WorkspaceMaterializationReport = {
      ...workspaceRepairedReportStub,
      status: 'WORKSPACE_INCOMPLETE',
      summary: {
        ...workspaceRepairedReportStub.summary,
        headline: 'The generated workspace still has 1 unresolved issue AiDevEngine could not safely repair.',
        repaired: [],
        stillMissing: ['A broken import could not be safely resolved.'],
      },
    };
    const normalizedWithWorkspaceIncomplete = normalizeBuildResult(
      baseInput({ workspaceStabilizerReport: workspaceIncompleteReportStub }),
    );
    assert(
      '14. Workspace INCOMPLETE (unresolved issues) downgrades to BUILT_WITH_WARNINGS, not a fake success',
      normalizedWithWorkspaceIncomplete.result === 'BUILT_WITH_WARNINGS' &&
        normalizedWithWorkspaceIncomplete.stages.workspaceReady === false,
      normalizedWithWorkspaceIncomplete.result,
    );

    // --- Scenario 11: UI shows a Workspace status panel ------------------------------

    const indexPath = join(ROOT, 'public/founder-reality/index.html');
    const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
    const builderHomeJsPath = join(ROOT, 'public/founder-reality/builder-home.js');
    const builderHomeJs = existsSync(builderHomeJsPath) ? readFileSync(builderHomeJsPath, 'utf8') : '';
    assert(
      '15. Scenario 11 — UI displays a Workspace status panel with plain-English states',
      indexHtml.includes('id="builder-workspace-section"') &&
        indexHtml.includes('id="builder-workspace-badge"') &&
        indexHtml.includes('id="builder-workspace-headline"') &&
        builderHomeJs.includes('renderWorkspaceStatus') &&
        builderHomeJs.includes('WORKSPACE_BADGE') &&
        builderHomeJs.includes('WORKSPACE_COMPLETE') &&
        builderHomeJs.includes('WORKSPACE_REPAIRED') &&
        builderHomeJs.includes('WORKSPACE_INCOMPLETE'),
      'workspace panel markup + renderer present',
    );

    // --- Scenario 12: Advanced Diagnostics — raw workspace audit hidden by default --

    const diagnosticsMarkupMatch = indexHtml.match(
      /<aside\s+class="builder-diagnostics-drawer[^>]*id="builder-diagnostics-drawer"[\s\S]*?>/,
    );
    const diagnosticsTagOpen = diagnosticsMarkupMatch ? diagnosticsMarkupMatch[0] : '';
    assert(
      '16a. Scenario 12 — diagnostics drawer (holding raw workspace audit) starts hidden by default',
      diagnosticsTagOpen.includes('hidden') && diagnosticsTagOpen.includes('aria-hidden="true"'),
      diagnosticsTagOpen || 'diagnostics drawer tag not found',
    );
    assert(
      '16b. Scenario 12 — raw workspace audit JSON only rendered inside renderDiagnostics, never in the result panel',
      /function renderDiagnostics[\s\S]*?JSON\.stringify\(workspaceReport/.test(builderHomeJs) &&
        !/function renderWorkspaceStatus[\s\S]{0,600}JSON\.stringify/.test(builderHomeJs),
      'JSON.stringify(workspaceReport, ...) only inside renderDiagnostics',
    );
    assert(
      '16c. Advanced Diagnostics exposes workspace status, files-checked, findings, and raw evidence fields',
      indexHtml.includes('id="diag-workspace-status"') &&
        indexHtml.includes('id="diag-workspace-files-checked"') &&
        indexHtml.includes('id="diag-workspace-findings-count"') &&
        indexHtml.includes('id="builder-diagnostics-workspace-raw"'),
      'diagnostics workspace fields present',
    );

    // --- Scenario 13: Generality audit ------------------------------------------------

    const moduleFiles = expectedFiles.map((f) => join(moduleDir, f));
    const normalizerFiles = [
      join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer.ts'),
      join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts'),
      join(ROOT, 'src/build-result-normalizer-v1/build-result-normalizer-types.ts'),
    ];
    let hardcodingFound: string | null = null;
    let authOnlyFound: string | null = null;
    for (const file of [...moduleFiles, ...normalizerFiles, builderHomeJsPath, indexPath]) {
      if (!existsSync(file)) continue;
      const source = readFileSync(file, 'utf8');
      const found = containsForbiddenAppSpecificTerm(source);
      if (found && !hardcodingFound) hardcodingFound = `${found} in ${file}`;
      if (containsAuthOnlyAssumption(source) && !authOnlyFound) authOnlyFound = file;
    }
    assert(
      '17. No app-specific hardcoding (calculator/counter/todo/CRM/LISA) in the stabilizer module, normalizer, or UI',
      hardcodingFound === null,
      hardcodingFound || 'clean',
    );
    assert('18. No authentication-specific assumptions baked into the stabilizer or normalizer', authOnlyFound === null, authOnlyFound || 'clean');

    const validatorTs = readFileSync(join(moduleDir, 'workspace-materialization-validator.ts'), 'utf8');
    assert(
      '19. Feature module discovery is generic — driven by manifest evidence or disk discovery, not fixed app names',
      validatorTs.includes('featureModulesFromManifest') && validatorTs.includes('featureModulesFromDisk'),
      'generic feature module discovery present',
    );

    // --- Repairs are minimal: unrelated / unrecognized files are never touched ------

    const untouchedFileDir = makeCompleteWorkspace();
    const sentinelPath = join(untouchedFileDir, 'src/features/dashboard/UNRELATED_SENTINEL.txt');
    writeFileSync(sentinelPath, 'do-not-touch');
    rmSync(join(untouchedFileDir, 'src/features/dashboard/dashboard.service.ts'));
    stabilizeWorkspaceMaterialization({ workspaceDir: untouchedFileDir });
    assert(
      '20. Repairs are minimal — unrelated files are never modified or removed',
      existsSync(sentinelPath) && readFileSync(sentinelPath, 'utf8') === 'do-not-touch',
      'sentinel file untouched',
    );
  } finally {
    for (const dir of tempDirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }

  const passed = results.filter((r) => r.passed).length;
  for (const check of results) {
    console.log(`${check.passed ? 'PASS' : 'FAIL'} — ${check.name}`);
    if (!check.passed) console.log(`       ${check.detail}`);
  }
  console.log('');
  console.log(`${passed}/${results.length} checks passed`);
  console.log('');

  if (passed === results.length) {
    console.log(PRODUCT_STABILIZATION_PHASE_3_V1_PASS_TOKEN);
    await exitValidator(0);
    return;
  }
  await exitValidator(1);
}

main().catch(async (err) => {
  console.error(err);
  await exitValidator(1);
});
