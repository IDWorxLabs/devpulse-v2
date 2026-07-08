/**
 * Prompt-Bounded Materialization — descriptor phrase classification.
 */

import type { ModuleClassificationCategory } from './prompt-bounded-materialization-types.js';
import { classifyModulePhrase, normalizeModuleId } from '../prompt-faithful-generation/prompt-module-name-normalizer.js';

const DESCRIPTOR_PHRASES: Array<{ pattern: RegExp; category: ModuleClassificationCategory; label: string }> = [
  { pattern: /\bmobile-first\b/i, category: 'PLATFORM_CONSTRAINT', label: 'mobile-first' },
  { pattern: /\baccessibility-first\b/i, category: 'ACCESSIBILITY_CONSTRAINT', label: 'accessibility-first' },
  { pattern: /\bphone-sized\b/i, category: 'PLATFORM_CONSTRAINT', label: 'phone-sized' },
  { pattern: /\bmedical-assistive\b/i, category: 'DESIGN_CONSTRAINT', label: 'medical-assistive' },
  { pattern: /\bcaregiver-friendly\b/i, category: 'DESIGN_CONSTRAINT', label: 'caregiver-friendly' },
  { pattern: /\bgaze-based\b/i, category: 'UI_CONSTRAINT', label: 'gaze-based' },
  { pattern: /\bhigh-contrast\b/i, category: 'ACCESSIBILITY_CONSTRAINT', label: 'high-contrast' },
  { pattern: /\bhigh contrast\b/i, category: 'ACCESSIBILITY_CONSTRAINT', label: 'high contrast' },
  { pattern: /\breal-time\b/i, category: 'PERFORMANCE_CONSTRAINT', label: 'real-time' },
  { pattern: /\bsecure\b/i, category: 'SECURITY_CONSTRAINT', label: 'secure' },
  { pattern: /\bmodern\b/i, category: 'DESIGN_CONSTRAINT', label: 'modern' },
  { pattern: /\bsimple\b/i, category: 'DESIGN_CONSTRAINT', label: 'simple' },
  { pattern: /\benterprise-grade\b/i, category: 'DESIGN_CONSTRAINT', label: 'enterprise-grade' },
  { pattern: /\blarge touch targets\b/i, category: 'ACCESSIBILITY_CONSTRAINT', label: 'large touch targets' },
  { pattern: /\bandroid phone preview\b/i, category: 'PLATFORM_CONSTRAINT', label: 'android phone preview' },
];

export function classifyPromptPhrase(raw: string): {
  category: ModuleClassificationCategory;
  createsFeatureFolder: boolean;
  label: string;
} {
  const trimmed = raw.trim();
  for (const entry of DESCRIPTOR_PHRASES) {
    if (entry.pattern.test(trimmed)) {
      return {
        category: entry.category,
        createsFeatureFolder: false,
        label: entry.label,
      };
    }
  }

  const legacy = classifyModulePhrase(trimmed);
  if (legacy === 'module') {
    return { category: 'FEATURE_MODULE', createsFeatureFolder: true, label: normalizeModuleId(trimmed) };
  }
  if (legacy === 'interaction') {
    return { category: 'WORKFLOW', createsFeatureFolder: false, label: normalizeModuleId(trimmed) };
  }
  if (legacy === 'design-requirement') {
    return { category: 'DESIGN_CONSTRAINT', createsFeatureFolder: false, label: normalizeModuleId(trimmed) };
  }
  if (legacy === 'platform-requirement') {
    return { category: 'PLATFORM_CONSTRAINT', createsFeatureFolder: false, label: normalizeModuleId(trimmed) };
  }
  if (legacy === 'safety-note') {
    return { category: 'VALIDATION_REQUIREMENT', createsFeatureFolder: false, label: normalizeModuleId(trimmed) };
  }
  if (legacy === 'implementation-note') {
    return { category: 'METADATA_TAG', createsFeatureFolder: false, label: normalizeModuleId(trimmed) };
  }
  return { category: 'METADATA_TAG', createsFeatureFolder: false, label: normalizeModuleId(trimmed) };
}

export function extractDescriptorMetadataFromPrompt(rawPrompt: string): Array<{
  label: string;
  category: ModuleClassificationCategory;
  sourceEvidence: string;
}> {
  const results: Array<{ label: string; category: ModuleClassificationCategory; sourceEvidence: string }> = [];
  const seen = new Set<string>();

  for (const entry of DESCRIPTOR_PHRASES) {
    if (entry.pattern.test(rawPrompt)) {
      const key = `${entry.category}:${entry.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        label: entry.label,
        category: entry.category,
        sourceEvidence: `Prompt descriptor: ${entry.label}`,
      });
    }
  }

  for (const line of rawPrompt.split('\n')) {
    const classified = classifyPromptPhrase(line);
    if (!classified.createsFeatureFolder && classified.label) {
      const key = `${classified.category}:${classified.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        label: classified.label,
        category: classified.category,
        sourceEvidence: `Prompt phrase classified as ${classified.category}`,
      });
    }
  }

  return results;
}

export function shouldCreateFeatureFolder(classification: ModuleClassificationCategory): boolean {
  return classification === 'FEATURE_MODULE' || classification === 'SERVICE_MODULE';
}
