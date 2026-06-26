/**
 * Prompt-Faithful Generation V1 — module name normalization.
 */

export function normalizeModuleId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[—–]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function isValidModuleId(moduleId: string): boolean {
  return moduleId.length >= 2 && /^[a-z][a-z0-9-]*$/.test(moduleId);
}

export function dedupeModuleIds(moduleIds: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of moduleIds) {
    const normalized = normalizeModuleId(raw);
    if (!isValidModuleId(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function moduleIdsInclude(modules: string[], target: string): boolean {
  const normalized = normalizeModuleId(target);
  return modules.some(
    (moduleId) =>
      moduleId === normalized ||
      moduleId.includes(normalized) ||
      normalized.includes(moduleId),
  );
}
