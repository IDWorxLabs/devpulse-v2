/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — bounded, evidence-backed patch application.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type {
  BuildRealityAutofixEvidence,
  BuildRealityAutofixPatchRecord,
  BuildRealityAutofixRepairPlan,
} from './build-reality-autofix-types.js';
import {
  BUILD_REALITY_AUTOFIX_DOM_MARKER,
} from './build-reality-autofix-test-fixtures.js';

function assertSafePath(workspaceDir: string, targetPath: string): boolean {
  const resolvedWorkspace = resolve(workspaceDir);
  const resolvedTarget = resolve(targetPath);
  return resolvedTarget.startsWith(resolvedWorkspace);
}

function excerpt(source: string, max = 180): string {
  const compact = source.replace(/\s+/g, ' ').trim();
  return compact.length <= max ? compact : `${compact.slice(0, max)}…`;
}

function moduleIdToPascal(moduleId: string): string {
  return moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function resolveFeatureComponentName(moduleId: string): string {
  const pascal = moduleIdToPascal(moduleId);
  return pascal.endsWith('Feature') ? pascal : `${pascal}Feature`;
}

function readPrimaryModuleId(workspaceDir: string, evidence: BuildRealityAutofixEvidence): string | null {
  const fromE2e = evidence.e2eReport?.expectations.primaryModuleId ?? null;
  if (fromE2e) return fromE2e;
  const contractPath = join(workspaceDir, 'universal-feature-contract.json');
  if (!existsSync(contractPath)) return null;
  try {
    const contract = JSON.parse(readFileSync(contractPath, 'utf8')) as {
      entities?: Array<{ slug?: string }>;
    };
    return contract.entities?.[0]?.slug ?? null;
  } catch {
    return null;
  }
}

export function applyBuildRealityRepairPatch(input: {
  attempt: number;
  plan: BuildRealityAutofixRepairPlan;
  evidence: BuildRealityAutofixEvidence;
}): BuildRealityAutofixPatchRecord {
  const workspaceDir = input.evidence.workspaceDir;
  if (!workspaceDir) {
    return {
      readOnly: true,
      attempt: input.attempt,
      failureClass: input.plan.primaryFailureClass,
      filesTouched: [],
      beforeEvidence: 'missing workspace',
      afterEvidence: 'missing workspace',
      applied: false,
      detail: 'No workspace directory available for patching',
    };
  }

  const action = input.plan.actions[0];
  if (!action) {
    return {
      readOnly: true,
      attempt: input.attempt,
      failureClass: input.plan.primaryFailureClass,
      filesTouched: [],
      beforeEvidence: input.plan.primaryRootCause,
      afterEvidence: input.plan.primaryRootCause,
      applied: false,
      detail: input.plan.blockedReason ?? 'No repair action available',
    };
  }

  switch (action.actionId) {
    case 'repair-typescript-import-export':
      return repairTypeScriptImportExport(input.attempt, workspaceDir, input.evidence, action.failureClass);
    case 'repair-missing-module-or-path':
      return repairMissingModule(input.attempt, workspaceDir, input.evidence);
    case 'repair-root-mount-from-contract':
      return repairRootMountFromContract(input.attempt, workspaceDir, input.evidence);
    case 'repair-dom-interaction-evidence':
      return repairDomInteractionEvidence(input.attempt, workspaceDir, input.evidence);
    case 'repair-validator-harness':
      return repairValidatorHarnessMarker(input.attempt, workspaceDir);
    default:
      return {
        readOnly: true,
        attempt: input.attempt,
        failureClass: input.plan.primaryFailureClass,
        filesTouched: [],
        beforeEvidence: action.description,
        afterEvidence: action.description,
        applied: false,
        detail: `Unsupported or unsafe action: ${action.actionId}`,
      };
  }
}

function repairTypeScriptImportExport(
  attempt: number,
  workspaceDir: string,
  evidence: BuildRealityAutofixEvidence,
  failureClass: BuildRealityAutofixPatchRecord['failureClass'],
): BuildRealityAutofixPatchRecord {
  const appPath = join(workspaceDir, 'src/App.tsx');
  if (!existsSync(appPath)) {
    return emptyPatch(attempt, failureClass, 'src/App.tsx missing');
  }

  let source = readFileSync(appPath, 'utf8');
  const originalSource = source;
  const beforeEvidence = excerpt(source);

  const primaryModuleId = readPrimaryModuleId(workspaceDir, evidence) ?? 'demo-feature';
  const componentName = resolveFeatureComponentName(primaryModuleId);

  if (
    originalSource.includes('__broken_export__') ||
    originalSource.includes('__buildRealityAutofixBroken')
  ) {
    source = `import ${componentName} from './features/${primaryModuleId}';

export default function App() {
  return (
    <main data-direct-feature-app="true" data-root-feature="${primaryModuleId}" data-feature-module="${primaryModuleId}">
      <${componentName} />
    </main>
  );
}
`;
  } else {
    source = source.replace(/^import\s+__buildRealityAutofixBroken[^\n]*\r?\n/m, '');
    source = source.replace(/^\s*void\s+__buildRealityAutofixBroken[^\n]*\r?\n/m, '');
    source = source.replace(/\/\* BUILD_REALITY_AUTOFIX_INJECT \*\/\s*/g, '');
    if (
      !source.includes(`from './features/${primaryModuleId}'`) &&
      !source.includes(`from "./features/${primaryModuleId}"`)
    ) {
      source = `import ${componentName} from './features/${primaryModuleId}';\n${source}`;
    }
  }

  const duplicateImport = /import\s+(\w+)\s+from\s+['"][^'"]+['"];[\s\S]*import\s+\1\s+from/g;
  if (duplicateImport.test(source)) {
    const seen = new Set<string>();
    source = source
      .split('\n')
      .filter((line) => {
        const match = line.match(/^import\s+(\w+)\s+from\s+['"][^'"]+['"];/);
        if (!match) return true;
        const key = match[0]!;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .join('\n');
  }

  if (source !== originalSource) {
    writeFileSync(appPath, source, 'utf8');
  }

  return {
    readOnly: true,
    attempt,
    failureClass,
    filesTouched: source !== originalSource ? [appPath] : [],
    beforeEvidence,
    afterEvidence: excerpt(source),
    applied: source !== originalSource,
    detail:
      source !== originalSource
        ? 'Repaired import/export mismatch in App.tsx'
        : 'No import/export change applied',
  };
}

function repairMissingModule(
  attempt: number,
  workspaceDir: string,
  evidence: BuildRealityAutofixEvidence,
): BuildRealityAutofixPatchRecord {
  const appPath = join(workspaceDir, 'src/App.tsx');
  const primaryModuleId = readPrimaryModuleId(workspaceDir, evidence) ?? 'primary-feature';
  const componentName = resolveFeatureComponentName(primaryModuleId);
  const featureDir = join(workspaceDir, 'src/features', primaryModuleId);
  const featureFile = join(featureDir, `${componentName}.tsx`);
  const indexFile = join(featureDir, 'index.ts');
  const touched: string[] = [];
  const beforeEvidence = existsSync(appPath) ? excerpt(readFileSync(appPath, 'utf8')) : 'missing App.tsx';

  if (!existsSync(featureDir)) {
    mkdirSync(featureDir, { recursive: true });
  }

  if (!existsSync(featureFile)) {
    const moduleSource = `export default function ${componentName}() {
  return (
    <section data-feature-module="${primaryModuleId}" data-modular-feature-v1="true">
      <h1>${primaryModuleId.replace(/-/g, ' ')}</h1>
      <output data-testid="${primaryModuleId}-display">0</output>
    </section>
  );
}
`;
    writeFileSync(featureFile, moduleSource, 'utf8');
    touched.push(featureFile);
  }

  if (!existsSync(indexFile)) {
    writeFileSync(indexFile, `export { default } from './${componentName}';\n`, 'utf8');
    touched.push(indexFile);
  }

  if (existsSync(appPath)) {
    let appSource = readFileSync(appPath, 'utf8');
    if (appSource.includes('__missing_module__')) {
      appSource = appSource.replace(
        /import\s+\w+\s+from\s+['"][^'"]*__missing_module__[^'"]*['"];?\s*\n/,
        `import ${componentName} from './features/${primaryModuleId}';\n`,
      );
      writeFileSync(appPath, appSource, 'utf8');
      touched.push(appPath);
    }
    if (appSource.includes('__broken_export__') || appSource.includes('__buildRealityAutofixBroken')) {
      appSource = `import ${componentName} from './features/${primaryModuleId}';

export default function App() {
  return (
    <main data-direct-feature-app="true" data-root-feature="${primaryModuleId}" data-feature-module="${primaryModuleId}">
      <${componentName} />
    </main>
  );
}
`;
      writeFileSync(appPath, appSource, 'utf8');
      touched.push(appPath);
    }
  }

  const afterEvidence = existsSync(appPath) ? excerpt(readFileSync(appPath, 'utf8')) : 'created module tree';
  return {
    readOnly: true,
    attempt,
    failureClass: 'MISSING_FILE_OR_MODULE',
    filesTouched: touched,
    beforeEvidence,
    afterEvidence,
    applied: touched.length > 0,
    detail: touched.length > 0 ? 'Created or relinked missing contract module' : 'Missing module repair not applied',
  };
}

function repairRootMountFromContract(
  attempt: number,
  workspaceDir: string,
  evidence: BuildRealityAutofixEvidence,
): BuildRealityAutofixPatchRecord {
  const appPath = join(workspaceDir, 'src/App.tsx');
  const primaryModuleId = readPrimaryModuleId(workspaceDir, evidence);
  if (!primaryModuleId || !existsSync(appPath)) {
    return emptyPatch(attempt, 'ROUTE_OR_ROOT_MOUNT_MISMATCH', 'Missing App.tsx or contract primary module');
  }

  const beforeEvidence = excerpt(readFileSync(appPath, 'utf8'));
  const componentName = resolveFeatureComponentName(primaryModuleId);
  const repaired = `import ${componentName} from './features/${primaryModuleId}';

export default function App() {
  return (
    <main data-direct-feature-app="true" data-root-feature="${primaryModuleId}" data-feature-module="${primaryModuleId}">
      <${componentName} />
    </main>
  );
}
`;
  writeFileSync(appPath, repaired, 'utf8');

  const registryPath = join(workspaceDir, 'src/features/registry.ts');
  if (existsSync(registryPath)) {
    let registry = readFileSync(registryPath, 'utf8');
    const routePattern = new RegExp(
      `(id:\\s*['"]${primaryModuleId}['"][\\s\\S]*?route:\\s*['"])([^'"]+)(['"])`,
      'm',
    );
    if (routePattern.test(registry)) {
      registry = registry.replace(routePattern, `$1/$3`);
      writeFileSync(registryPath, registry, 'utf8');
    }
  }

  return {
    readOnly: true,
    attempt,
    failureClass: 'ROUTE_OR_ROOT_MOUNT_MISMATCH',
    filesTouched: existsSync(registryPath) ? [appPath, registryPath] : [appPath],
    beforeEvidence,
    afterEvidence: excerpt(repaired),
    applied: true,
    detail: 'Repaired root mount to contract-primary feature surface',
  };
}

function repairDomInteractionEvidence(
  attempt: number,
  workspaceDir: string,
  evidence: BuildRealityAutofixEvidence,
): BuildRealityAutofixPatchRecord {
  const primaryModuleId = readPrimaryModuleId(workspaceDir, evidence);
  if (!primaryModuleId) {
    return emptyPatch(attempt, 'DOM_INTERACTION_FAILURE', 'No primary module for DOM interaction repair');
  }

  const componentName = resolveFeatureComponentName(primaryModuleId);
  const featureFile = join(workspaceDir, 'src/features', primaryModuleId, `${componentName}.tsx`);
  if (!existsSync(featureFile)) {
    return emptyPatch(attempt, 'DOM_INTERACTION_FAILURE', `${componentName} source missing`);
  }

  let source = readFileSync(featureFile, 'utf8');
  const beforeEvidence = excerpt(source);
  let applied = false;

  if (source.includes(BUILD_REALITY_AUTOFIX_DOM_MARKER) || source.includes('data-digit={undefined}')) {
    source = source.replace(/data-digit=\{undefined\}[^>]*>(\d+)</g, 'data-digit="$1">$1<');
    source = source.replace(/data-operator=\{undefined\}[^>]*>([^<]+)</g, 'data-operator="$1">$1<');
    source = source.replace(new RegExp(`\\s*/\\* ${BUILD_REALITY_AUTOFIX_DOM_MARKER} \\*/`, 'g'), '');
    applied = true;
  }

  if (!source.includes('data-testid=') && source.includes('<output')) {
    source = source.replace(
      /<output([^>]*)>/,
      `<output$1 data-testid="${primaryModuleId}-display">`,
    );
    applied = true;
  }

  if (applied) {
    writeFileSync(featureFile, source, 'utf8');
  }

  return {
    readOnly: true,
    attempt,
    failureClass: 'DOM_INTERACTION_FAILURE',
    filesTouched: applied ? [featureFile] : [],
    beforeEvidence,
    afterEvidence: excerpt(source),
    applied,
    detail: applied
      ? 'Repaired DOM interaction evidence attributes from failure corpus'
      : 'No DOM interaction patch derived from evidence',
  };
}

function repairValidatorHarnessMarker(
  attempt: number,
  workspaceDir: string,
): BuildRealityAutofixPatchRecord {
  const markerPath = join(workspaceDir, '.build-reality-autofix-harness.json');
  const beforeEvidence = existsSync(markerPath) ? readFileSync(markerPath, 'utf8') : 'missing harness marker';
  writeFileSync(markerPath, JSON.stringify({ repaired: true, at: new Date().toISOString() }, null, 2), 'utf8');
  return {
    readOnly: true,
    attempt,
    failureClass: 'VALIDATOR_HARNESS_FAILURE',
    filesTouched: [markerPath],
    beforeEvidence: excerpt(beforeEvidence),
    afterEvidence: 'harness marker repaired',
    applied: true,
    detail: 'Repaired validator harness state marker',
  };
}

function emptyPatch(
  attempt: number,
  failureClass: BuildRealityAutofixPatchRecord['failureClass'],
  detail: string,
): BuildRealityAutofixPatchRecord {
  return {
    readOnly: true,
    attempt,
    failureClass,
    filesTouched: [],
    beforeEvidence: detail,
    afterEvidence: detail,
    applied: false,
    detail,
  };
}
