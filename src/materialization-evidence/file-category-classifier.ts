/**
 * Classify generated workspace files by path and extension.
 */

import type { GeneratedFileCategory } from './materialization-evidence-types.js';

export function classifyGeneratedFile(relativePath: string): GeneratedFileCategory {
  const normalized = relativePath.replace(/\\/g, '/').toLowerCase();
  const ext = normalized.includes('.') ? normalized.slice(normalized.lastIndexOf('.')) : '';

  if (normalized.includes('/verification/') || normalized.includes('/validate')) return 'Validation';
  if (normalized.endsWith('.validation.ts')) return 'Validation';
  if (normalized.endsWith('.types.ts')) return 'Model';
  if (normalized.endsWith('.service.ts')) return 'Service';
  if (normalized.endsWith('registry.ts') && normalized.includes('/features/')) return 'Route';
  if (normalized.includes('.test.') || normalized.includes('.spec.') || normalized.includes('/__tests__/')) {
    return 'Test';
  }
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2'].includes(ext)) {
    return 'Asset';
  }
  if (ext === '.css') return 'Style';
  if (normalized.endsWith('routes.ts') || normalized.includes('/routes.')) return 'Route';
  if (normalized.includes('/pages/') || normalized.endsWith('page.tsx')) return 'Page';
  if (normalized.includes('/features/domain/') && ext === '.tsx') return 'Feature';
  if (normalized.includes('/features/') && ext === '.tsx' && normalized.includes('feature')) return 'Feature';
  if (ext === '.tsx' && (normalized.includes('/components/') || normalized.includes('/screens/'))) {
    return 'Component';
  }
  if (normalized.includes('service') && (ext === '.ts' || ext === '.tsx')) return 'Service';
  if (normalized.includes('/models/') || normalized.includes('model.')) return 'Model';
  if (normalized.includes('provider') && (ext === '.ts' || ext === '.tsx')) return 'Provider';
  if (normalized.includes('hook') && ext === '.ts') return 'Hook';
  if (normalized.includes('/theme/') || normalized.includes('theme.')) return 'Theme';
  if (
    normalized.endsWith('package.json') ||
    normalized.endsWith('tsconfig.json') ||
    normalized.includes('vite.config') ||
    normalized.endsWith('.generated-app-manifest.json') ||
    normalized.endsWith('build-manifest.json')
  ) {
    return 'Config';
  }
  if (ext === '.ts' || ext === '.tsx' || ext === '.js' || ext === '.jsx') return 'Utility';
  if (ext === '.json') return 'Config';
  return 'Utility';
}

export function countByCategory(
  files: Array<{ category: GeneratedFileCategory }>,
): Record<GeneratedFileCategory, number> {
  const counts: Record<GeneratedFileCategory, number> = {
    Component: 0,
    Page: 0,
    Feature: 0,
    Service: 0,
    Model: 0,
    Asset: 0,
    Config: 0,
    Style: 0,
    Route: 0,
    Provider: 0,
    Hook: 0,
    Utility: 0,
    Validation: 0,
    Test: 0,
    Theme: 0,
  };
  for (const file of files) {
    counts[file.category] += 1;
  }
  return counts;
}
