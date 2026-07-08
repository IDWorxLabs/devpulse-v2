/** Service adapter for accessibility-layer — LISA — Locked In Syndrome App */
import type { AccessibilityLayerRecord } from './accessibility-layer.types';

const DEMO_ACCESSIBILITY_LAYER_RECORDS: AccessibilityLayerRecord[] = [
  { id: 'accessibility-layer-1', label: 'Sample Accessibility Layer record', createdAt: new Date().toISOString() },
  { id: 'accessibility-layer-2', label: 'Accessibility Layer preview entry', createdAt: new Date().toISOString() },
];

export function listAccessibilityLayerRecords(): AccessibilityLayerRecord[] {
  return DEMO_ACCESSIBILITY_LAYER_RECORDS;
}
