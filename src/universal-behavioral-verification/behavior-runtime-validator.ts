/**
 * Universal Behavioral Verification Engine V1 — runtime validator and static shell rejection.
 */

const STATIC_SHELL_PATTERNS: readonly RegExp[] = [
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bplaceholder\b/i,
  /return\s+true;\s*\/\//,
  /console\.log\(\);/,
  /disabled=\{true\}[^>]*>.*(?:login|schedule|upload|notify)/i,
  /return\s+\[\];\s*\/\/\s*static/i,
  /fake\s+loading/i,
  /hardcoded\s+success/i,
  /decorative\s+runtime/i,
];

export function detectStaticBehaviorShells(source: string): readonly string[] {
  const findings: string[] = [];
  for (const pattern of STATIC_SHELL_PATTERNS) {
    if (pattern.test(source)) findings.push(`static_shell:${pattern.source}`);
  }
  return findings;
}

/**
 * Builds the source string that static-shell detection should scan.
 *
 * Static behavior shells are a concern of the BEHAVIOR-BEARING feature runtime (`src/features/*`
 * `.ts/.tsx`). Scanning the entire concatenated workspace produced false positives from three
 * legitimate sources: (1) generated diagnostic `*.json` reports whose prose mentions the word
 * "placeholder", (2) stylesheets using the `::placeholder` pseudo-element and JSX inputs using the
 * `placeholder=` attribute, and (3) intentional non-behavioral infrastructure host stubs
 * (`src/analytics|data|security/*-placeholders.ts`) that legitimately carry a "placeholder" block
 * comment. We therefore scope to feature runtime source and strip the legitimate attribute and
 * pseudo-element forms.
 */
export function buildBehaviorStaticShellScanSource(
  workspaceFiles: readonly { readonly relativePath: string; readonly content: string }[],
): string {
  return workspaceFiles
    .filter((f) => f.relativePath.startsWith('src/features/') && /\.(tsx?|jsx?)$/.test(f.relativePath))
    .map((f) => f.content.replace(/placeholder\s*=/gi, '').replace(/::placeholder/gi, ''))
    .join('\n');
}

export function detectStaticBehaviorShell(source: string): boolean {
  return detectStaticBehaviorShells(source).length > 0;
}

export function rejectPlaceholderBehavior(source: string): readonly string[] {
  const rejections: string[] = [];
  if (/placeholder button|placeholder route|placeholder workflow/i.test(source)) {
    rejections.push('placeholder_behavior');
  }
  if (/fake report|fake success dialog/i.test(source)) {
    rejections.push('fake_runtime');
  }
  return rejections;
}

export function runtimeArtifactsReachable(
  workspaceFilePaths: readonly string[],
  requiredPaths: readonly string[],
): boolean {
  const set = new Set(workspaceFilePaths);
  return requiredPaths.every((p) => [...set].some((path) => path.includes(p) || path === p));
}

export function validateRuntimeReachability(input: {
  workspaceFilePaths: readonly string[];
  crudBacked: boolean;
  runtimeBacked: boolean;
  capabilityPackBacked: boolean;
}): { reachable: boolean; missing: string[] } {
  const required: string[] = [];
  if (input.crudBacked) required.push('universal-crud-runtime');
  if (input.runtimeBacked) required.push('universal-runtime-state');
  if (input.capabilityPackBacked) required.push('universal-capability-packs/runtime');
  const missing = required.filter((r) => !input.workspaceFilePaths.some((p) => p.includes(r)));
  return { reachable: missing.length === 0, missing };
}
