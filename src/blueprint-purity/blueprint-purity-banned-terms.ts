/**
 * Blueprint Purity V1 — banned domain terms for universal shell sources.
 */

export const BLUEPRINT_PURITY_BANNED_TERMS = [
  'task',
  'tasks',
  'project',
  'projects',
  'expense',
  'expenses',
  'income',
  'customer',
  'customers',
  'lead',
  'leads',
  'pipeline',
  'deal',
  'deals',
  'inventory',
  'stock',
  'supplier',
  'suppliers',
  'booking',
  'bookings',
  'habit',
  'habits',
  'streak',
  'qr',
  'scanner',
  'generator',
  'product',
  'products',
] as const;

export type BlueprintPurityBannedTerm = (typeof BLUEPRINT_PURITY_BANNED_TERMS)[number];

/** Source paths scanned for domain leakage (universal blueprint infrastructure). */
export const BLUEPRINT_PURITY_SHELL_RELATIVE_PATHS = [
  'src/universal-app-blueprint/universal-app-blueprint-generator.ts',
  'src/universal-app-blueprint/universal-app-blueprint-authority.ts',
  'src/universal-app-blueprint/universal-app-blueprint-inspector.ts',
  'src/universal-app-blueprint/universal-app-blueprint-registry.ts',
  'src/universal-app-blueprint/universal-app-blueprint-types.ts',
  'src/universal-app-blueprint/universal-app-blueprint-planning-rule.ts',
] as const;

/** Generated workspace paths that must remain domain-neutral. */
export const GENERATED_BLUEPRINT_SHELL_GLOBS = [
  'src/blueprint',
  'src/App.tsx',
  'src/App.css',
] as const;

/** Paths where domain language is expected and allowed. */
export const BLUEPRINT_PURITY_ALLOWED_DOMAIN_PATH_PREFIXES = [
  'src/features/',
  'src/universal-prompt-to-app-materialization/profile-feature-map.ts',
  'src/universal-prompt-to-app-materialization/profile-feature-ui-generator.ts',
  'src/universal-prompt-to-app-materialization/prompt-app-metadata.ts',
  'src/universal-feature-contract-intelligence/',
  'scripts/validate-',
  'scripts/direct-build-proof',
  '.production-validation-evidence.json',
  'universal-feature-contract.json',
  'feature-contract.json',
  '.generated-app-manifest.json',
  'src/data/demo-data.ts',
  'src/blueprint/app-metadata.ts',
] as const;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findBlueprintPurityViolations(source: string): BlueprintPurityBannedTerm[] {
  const sanitized = source
    .split('\n')
    .filter((line) => !/^\s*import\s/.test(line) && !/^\s*export\s.*from\s/.test(line))
    .join('\n');
  const hits: BlueprintPurityBannedTerm[] = [];
  for (const term of BLUEPRINT_PURITY_BANNED_TERMS) {
    const pattern = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
    if (pattern.test(sanitized)) {
      hits.push(term);
    }
  }
  return hits;
}

export function isBlueprintPurityAllowedDomainPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  return BLUEPRINT_PURITY_ALLOWED_DOMAIN_PATH_PREFIXES.some((prefix) => normalized.includes(prefix));
}

export function isGeneratedBlueprintShellPath(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized === 'src/App.tsx' || normalized === 'src/App.css') return true;
  return normalized.startsWith('src/blueprint/');
}
