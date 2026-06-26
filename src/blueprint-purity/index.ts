/**
 * Blueprint Purity V1 — public API.
 */

export {
  BLUEPRINT_PURITY_BANNED_TERMS,
  BLUEPRINT_PURITY_SHELL_RELATIVE_PATHS,
  GENERATED_BLUEPRINT_SHELL_GLOBS,
  BLUEPRINT_PURITY_ALLOWED_DOMAIN_PATH_PREFIXES,
  findBlueprintPurityViolations,
  isBlueprintPurityAllowedDomainPath,
  isGeneratedBlueprintShellPath,
  type BlueprintPurityBannedTerm,
} from './blueprint-purity-banned-terms.js';

export {
  BLUEPRINT_PURITY_V1_PASS_TOKEN,
  type BlueprintPurityEvidence,
  type BlueprintPurityFileScanResult,
} from './blueprint-purity-types.js';

export {
  scanBlueprintSourceFiles,
  scanGeneratedWorkspaceShell,
  verifyGeneratedAppDomainBoundary,
  buildBlueprintPurityEvidence,
} from './blueprint-purity-scanner.js';

export {
  buildBlueprintPurityTraceEvents,
  blueprintPurityTraceTitles,
} from './blueprint-purity-trace-events.js';

export { applyBlueprintPurityToManifest } from './blueprint-purity-manifest.js';
