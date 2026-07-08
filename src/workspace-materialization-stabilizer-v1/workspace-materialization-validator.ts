/**
 * Workspace Materialization Stabilizer V1 — validator.
 *
 * Pure, evidence-driven checks against the generated workspace on disk. No application-specific
 * logic: every check operates on generic file/folder existence, generic import resolution, and
 * the materialization manifest (when present) or disk-discovered feature module evidence.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve as resolvePath } from 'node:path';
import type {
  WorkspaceFeatureModuleEvidence,
  WorkspaceMaterializationFinding,
  WorkspaceMaterializationFindingKind,
} from './workspace-materialization-types.js';

let findingCounter = 0;
export function resetFindingCounterForTests(): void {
  findingCounter = 0;
}

export function makeFinding(
  kind: WorkspaceMaterializationFindingKind,
  severity: 'BLOCKING' | 'REPAIRABLE',
  path: string | null,
  message: string,
): WorkspaceMaterializationFinding {
  findingCounter += 1;
  return { readOnly: true, id: `finding-${findingCounter}`, kind, severity, path, message };
}

export function fileExists(workspaceDir: string, relPath: string): boolean {
  try {
    return existsSync(join(workspaceDir, relPath)) && statSync(join(workspaceDir, relPath)).isFile();
  } catch {
    return false;
  }
}

export function dirExists(workspaceDir: string, relPath: string): boolean {
  try {
    return existsSync(join(workspaceDir, relPath)) && statSync(join(workspaceDir, relPath)).isDirectory();
  } catch {
    return false;
  }
}

export function readFileSafe(workspaceDir: string, relPath: string): string | null {
  try {
    return readFileSync(join(workspaceDir, relPath), 'utf8');
  } catch {
    return null;
  }
}

function titleCase(id: string): string {
  return id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function pascalCase(id: string): string {
  return titleCase(id).replace(/\s+/g, '');
}

/** ---- Corruption check: run first, before anything else. No repair is ever attempted. ---- */

export function checkWorkspaceCorruption(workspaceDir: string): { corrupted: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (!existsSync(workspaceDir) || !statSync(workspaceDir).isDirectory()) {
    return { corrupted: true, reasons: ['The generated workspace directory does not exist.'] };
  }

  if (!dirExists(workspaceDir, 'src')) {
    reasons.push('The workspace has no src/ directory — the workspace looks structurally invalid.');
  }

  const packageJsonRaw = readFileSafe(workspaceDir, 'package.json');
  if (packageJsonRaw !== null) {
    try {
      JSON.parse(packageJsonRaw);
    } catch {
      reasons.push('package.json exists but is not valid JSON.');
    }
  }

  const manifestRaw = readFileSafe(workspaceDir, '.generated-app-manifest.json');
  if (manifestRaw !== null) {
    try {
      JSON.parse(manifestRaw);
    } catch {
      reasons.push('.generated-app-manifest.json exists but is not valid JSON.');
    }
  }

  return { corrupted: reasons.length > 0, reasons };
}

/** ---- Manifest parsing + feature module discovery ---- */

export interface ManifestReadResult {
  found: boolean;
  parseError: string | null;
  manifest: Record<string, unknown> | null;
}

export function readManifest(workspaceDir: string): ManifestReadResult {
  const raw = readFileSafe(workspaceDir, '.generated-app-manifest.json');
  if (raw === null) return { found: false, parseError: null, manifest: null };
  try {
    return { found: true, parseError: null, manifest: JSON.parse(raw) as Record<string, unknown> };
  } catch (err) {
    return { found: true, parseError: err instanceof Error ? err.message : String(err), manifest: null };
  }
}

export function featureModulesFromManifest(
  manifest: Record<string, unknown> | null,
): WorkspaceFeatureModuleEvidence[] {
  if (!manifest) return [];
  const details = manifest.featureModuleDetails;
  if (!Array.isArray(details)) return [];
  return details
    .map((entry): WorkspaceFeatureModuleEvidence | null => {
      if (!entry || typeof entry !== 'object') return null;
      const e = entry as Record<string, unknown>;
      if (typeof e.id !== 'string' || typeof e.route !== 'string') return null;
      return {
        id: e.id,
        name: typeof e.name === 'string' ? e.name : titleCase(e.id),
        route: e.route,
        componentPath: typeof e.componentPath === 'string' ? e.componentPath : `src/features/${e.id}/${pascalCase(e.id)}Feature.tsx`,
        servicePath: typeof e.servicePath === 'string' ? e.servicePath : `src/features/${e.id}/${e.id}.service.ts`,
        typesPath: typeof e.typesPath === 'string' ? e.typesPath : `src/features/${e.id}/${e.id}.types.ts`,
        validationPath: typeof e.validationPath === 'string' ? e.validationPath : `src/features/${e.id}/${e.id}.validation.ts`,
      };
    })
    .filter((entry): entry is WorkspaceFeatureModuleEvidence => entry !== null);
}

const NON_MODULE_FEATURE_FILES = new Set(['registry.ts', 'routes.ts', 'FeatureAppRouter.tsx', 'feature-app-router.css']);

/** Fallback used only when the manifest is missing/unusable — discovers modules directly from disk. */
export function featureModulesFromDisk(workspaceDir: string): WorkspaceFeatureModuleEvidence[] {
  const featuresDir = join(workspaceDir, 'src/features');
  if (!existsSync(featuresDir) || !statSync(featuresDir).isDirectory()) return [];

  const entries: WorkspaceFeatureModuleEvidence[] = [];
  for (const name of readdirSync(featuresDir)) {
    if (NON_MODULE_FEATURE_FILES.has(name)) continue;
    const full = join(featuresDir, name);
    if (!statSync(full).isDirectory()) continue;
    const id = name;
    const componentFile = readdirSync(full).find((f) => /Feature\.tsx$/.test(f));
    entries.push({
      id,
      name: titleCase(id),
      route: `/${id}`,
      componentPath: componentFile ? `src/features/${id}/${componentFile}` : `src/features/${id}/${pascalCase(id)}Feature.tsx`,
      servicePath: `src/features/${id}/${id}.service.ts`,
      typesPath: `src/features/${id}/${id}.types.ts`,
      validationPath: `src/features/${id}/${id}.validation.ts`,
    });
  }
  return entries;
}

/** ---- Individual checks — each returns findings, never throws. ---- */

export function checkRootFiles(workspaceDir: string): WorkspaceMaterializationFinding[] {
  const findings: WorkspaceMaterializationFinding[] = [];

  if (!fileExists(workspaceDir, 'package.json')) {
    findings.push(makeFinding('MISSING_PACKAGE_JSON', 'BLOCKING', 'package.json', 'package.json is missing — AiDevEngine cannot safely fabricate project dependencies.'));
  }
  if (!fileExists(workspaceDir, 'tsconfig.json')) {
    findings.push(makeFinding('MISSING_TSCONFIG', 'REPAIRABLE', 'tsconfig.json', 'tsconfig.json is missing.'));
  }

  const packageJsonRaw = readFileSafe(workspaceDir, 'package.json');
  const usesVite = packageJsonRaw ? /"vite"/.test(packageJsonRaw) : true;
  if (usesVite && !fileExists(workspaceDir, 'vite.config.ts')) {
    findings.push(makeFinding('MISSING_VITE_CONFIG', 'REPAIRABLE', 'vite.config.ts', 'vite.config.ts is missing.'));
  }
  if (!fileExists(workspaceDir, 'index.html')) {
    findings.push(makeFinding('MISSING_INDEX_HTML', 'REPAIRABLE', 'index.html', 'index.html is missing.'));
  }
  if (!fileExists(workspaceDir, 'src/main.tsx')) {
    findings.push(makeFinding('MISSING_ROOT_ENTRY', 'REPAIRABLE', 'src/main.tsx', 'The root entry point src/main.tsx is missing.'));
  }

  return findings;
}

export function checkAppEntry(
  workspaceDir: string,
  featureModules: WorkspaceFeatureModuleEvidence[],
): WorkspaceMaterializationFinding[] {
  if (fileExists(workspaceDir, 'src/App.tsx')) return [];

  // Repairable only when we have contract/manifest evidence of at least one feature to mount.
  const canRepair = featureModules.length > 0;
  return [
    makeFinding(
      'MISSING_APP_ENTRY',
      canRepair ? 'REPAIRABLE' : 'BLOCKING',
      'src/App.tsx',
      canRepair
        ? 'The App entry point src/App.tsx is missing.'
        : 'The App entry point src/App.tsx is missing and no feature module evidence exists to safely reconstruct it.',
    ),
  ];
}

export function checkFeatureRouter(workspaceDir: string): WorkspaceMaterializationFinding[] {
  const appTsx = readFileSafe(workspaceDir, 'src/App.tsx');
  if (!appTsx || !/FeatureAppRouter/.test(appTsx)) return [];
  if (fileExists(workspaceDir, 'src/features/FeatureAppRouter.tsx')) return [];
  return [
    makeFinding(
      'MISSING_FEATURE_ROUTER',
      'REPAIRABLE',
      'src/features/FeatureAppRouter.tsx',
      'App.tsx references FeatureAppRouter, but src/features/FeatureAppRouter.tsx is missing.',
    ),
  ];
}

export function checkFeatureModuleFiles(
  workspaceDir: string,
  featureModules: WorkspaceFeatureModuleEvidence[],
): WorkspaceMaterializationFinding[] {
  const findings: WorkspaceMaterializationFinding[] = [];
  for (const mod of featureModules) {
    const files: Array<[string, string]> = [
      [mod.componentPath, 'component'],
      [mod.servicePath, 'service'],
      [mod.typesPath, 'types'],
      [mod.validationPath, 'validation'],
    ];
    for (const [path, kind] of files) {
      if (!fileExists(workspaceDir, path)) {
        findings.push(
          makeFinding('MISSING_REQUIRED_FILE', 'REPAIRABLE', path, `Feature module "${mod.id}" is missing its ${kind} file.`),
        );
      }
    }
    const barrelPath = `src/features/${mod.id}/index.ts`;
    if (!fileExists(workspaceDir, barrelPath)) {
      findings.push(
        makeFinding('MISSING_BARREL_EXPORT', 'REPAIRABLE', barrelPath, `Feature module "${mod.id}" is missing its barrel export (index.ts).`),
      );
    }
  }
  return findings;
}

export function checkRegistryAndRoutes(
  workspaceDir: string,
  featureModules: WorkspaceFeatureModuleEvidence[],
): WorkspaceMaterializationFinding[] {
  if (featureModules.length === 0) return [];
  const findings: WorkspaceMaterializationFinding[] = [];

  const registry = readFileSafe(workspaceDir, 'src/features/registry.ts');
  const routes = readFileSafe(workspaceDir, 'src/features/routes.ts');

  if (registry === null) {
    findings.push(makeFinding('MISSING_ROUTE_REGISTRATION', 'REPAIRABLE', 'src/features/registry.ts', 'The feature registry is missing.'));
  } else {
    for (const mod of featureModules) {
      if (!registry.includes(`id: '${mod.id}'`) && !registry.includes(`'${mod.id}'`)) {
        findings.push(
          makeFinding(
            'MISSING_ROUTE_REGISTRATION',
            'REPAIRABLE',
            'src/features/registry.ts',
            `Feature module "${mod.id}" exists but is not registered in the feature registry.`,
          ),
        );
      }
    }
  }

  if (routes === null) {
    findings.push(makeFinding('MISSING_ROUTE_REGISTRATION', 'REPAIRABLE', 'src/features/routes.ts', 'The generated routes file is missing.'));
  } else if (!/FEATURE_REGISTRY/.test(routes)) {
    // routes.ts is a fully-derived file (mapped from the registry). It never contains literal
    // route strings, so the only generic structural check is that it derives from the registry.
    findings.push(
      makeFinding(
        'MISSING_ROUTE_REGISTRATION',
        'REPAIRABLE',
        'src/features/routes.ts',
        'The generated routes file does not derive from the feature registry.',
      ),
    );
  }

  return findings;
}

const IMPORT_RE = /from\s+['"](\.[^'"]+)['"]/g;
const RESOLUTION_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];

function resolveImportTarget(fromFile: string, importPath: string): string | null {
  const base = resolvePath(dirname(fromFile), importPath);
  for (const ext of RESOLUTION_EXTENSIONS) {
    if (existsSync(base + ext)) return base + ext;
  }
  return null;
}

export const IMPORT_RESOLUTION_CANDIDATE_FILES = [
  'src/main.tsx',
  'src/App.tsx',
  'src/features/registry.ts',
  'src/features/routes.ts',
  'src/features/FeatureAppRouter.tsx',
];

export interface BrokenImportRecord {
  importPath: string;
}

/** Re-scans a single file for relative imports that do not resolve. Used by both the audit and the repair pass. */
export function findBrokenImportsInFile(workspaceDir: string, relFile: string): BrokenImportRecord[] {
  const absFile = join(workspaceDir, relFile);
  if (!existsSync(absFile)) return [];
  const content = readFileSync(absFile, 'utf8');
  const broken: BrokenImportRecord[] = [];
  let match: RegExpExecArray | null;
  IMPORT_RE.lastIndex = 0;
  while ((match = IMPORT_RE.exec(content)) !== null) {
    const importPath = match[1]!;
    if (!resolveImportTarget(absFile, importPath)) broken.push({ importPath });
  }
  return broken;
}

/** Generic import-resolution check — scans known generated files (never app-specific paths). */
export function checkImportsResolve(
  workspaceDir: string,
  featureModules: WorkspaceFeatureModuleEvidence[],
): WorkspaceMaterializationFinding[] {
  const findings: WorkspaceMaterializationFinding[] = [];
  const candidateRelFiles = [...IMPORT_RESOLUTION_CANDIDATE_FILES, ...featureModules.map((m) => m.componentPath)];

  for (const relFile of candidateRelFiles) {
    for (const broken of findBrokenImportsInFile(workspaceDir, relFile)) {
      findings.push(
        makeFinding(
          'BROKEN_IMPORT',
          'REPAIRABLE',
          relFile,
          `${relFile} imports "${broken.importPath}", which does not resolve to an existing file.`,
        ),
      );
    }
  }
  return findings;
}

/** Finds a same-directory file whose normalized basename fuzzily matches the broken import target. */
export function findFuzzyImportMatch(workspaceDir: string, relFile: string, importPath: string): string | null {
  const absFile = join(workspaceDir, relFile);
  const dir = dirname(absFile);
  if (!existsSync(dir)) return null;
  const targetBase = importPath.split('/').pop() ?? importPath;
  const normalize = (s: string): string =>
    s
      .replace(/\.(tsx?|jsx?)$/i, '')
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase()
      .replace(/s$/, ''); // tolerate minor pluralization typos (e.g. "Apps" vs "App")
  const targetNorm = normalize(targetBase);

  const candidates = readdirSync(dir).filter((f) => {
    try {
      return statSync(join(dir, f)).isFile();
    } catch {
      return false;
    }
  });
  const matches = candidates.filter((f) => normalize(f) === targetNorm);
  if (matches.length === 1) {
    const relImportDir = importPath.slice(0, importPath.length - targetBase.length);
    return `${relImportDir}${matches[0]!.replace(/\.(tsx?|jsx?)$/i, '')}`;
  }
  return null;
}

export function checkManifest(
  workspaceDir: string,
  manifestResult: ManifestReadResult,
  featureModules: WorkspaceFeatureModuleEvidence[],
): WorkspaceMaterializationFinding[] {
  const findings: WorkspaceMaterializationFinding[] = [];

  if (!manifestResult.found) {
    findings.push(
      makeFinding('MISSING_MANIFEST', 'REPAIRABLE', '.generated-app-manifest.json', 'The materialization manifest file is missing.'),
    );
    return findings;
  }

  if (manifestResult.manifest === null) {
    // Unparsable manifest is treated as corruption upstream, not reported again here.
    return findings;
  }

  const manifest = manifestResult.manifest;
  const declaredCount = manifest.generatedFeatureModulesCount;
  const detailsCount = Array.isArray(manifest.featureModuleDetails) ? manifest.featureModuleDetails.length : 0;
  if (typeof declaredCount === 'number' && declaredCount !== detailsCount) {
    findings.push(
      makeFinding(
        'MANIFEST_INCONSISTENCY',
        'REPAIRABLE',
        '.generated-app-manifest.json',
        `Manifest reports ${declaredCount} feature modules, but featureModuleDetails lists ${detailsCount}.`,
      ),
    );
  }

  const routesArray = Array.isArray(manifest.routes) ? (manifest.routes as unknown[]) : [];
  for (const mod of featureModules) {
    if (!routesArray.includes(mod.route)) {
      findings.push(
        makeFinding(
          'MANIFEST_INCONSISTENCY',
          'REPAIRABLE',
          '.generated-app-manifest.json',
          `Manifest routes list is missing route "${mod.route}" for feature module "${mod.id}".`,
        ),
      );
    }
  }

  const assets = Array.isArray(manifest.assets) ? (manifest.assets as unknown[]) : [];
  for (const asset of assets) {
    if (typeof asset !== 'string') continue;
    if (!fileExists(workspaceDir, asset)) {
      findings.push(makeFinding('MISSING_ASSET', 'REPAIRABLE', asset, `Generated asset "${asset}" is listed in the manifest but missing on disk.`));
    }
  }

  return findings;
}

export { titleCase, pascalCase };
