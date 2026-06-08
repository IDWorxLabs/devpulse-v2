/**
 * Risk band engine — maps complexity score to risk bands.
 * Banding only. No remediation.
 */

import type { ComplexityRiskBand } from './types.js';
import { RISK_BAND_THRESHOLDS } from './types.js';

export function computeRiskBand(score: number): ComplexityRiskBand {
  const clamped = Math.min(100, Math.max(0, score));
  if (clamped <= RISK_BAND_THRESHOLDS.LOW.max) return 'LOW';
  if (clamped <= RISK_BAND_THRESHOLDS.MEDIUM.max) return 'MEDIUM';
  if (clamped <= RISK_BAND_THRESHOLDS.HIGH.max) return 'HIGH';
  return 'CRITICAL';
}

export function riskBandKey(band: ComplexityRiskBand, score: number): string {
  return `${band}|${score}`;
}

export function isLowRiskBand(band: ComplexityRiskBand): boolean {
  return band === 'LOW';
}

export function isMediumRiskBand(band: ComplexityRiskBand): boolean {
  return band === 'MEDIUM';
}

export function isHighRiskBand(band: ComplexityRiskBand): boolean {
  return band === 'HIGH';
}

export function isCriticalRiskBand(band: ComplexityRiskBand): boolean {
  return band === 'CRITICAL';
}

export function scoreForRiskBand(band: ComplexityRiskBand): number {
  return RISK_BAND_THRESHOLDS[band].min;
}
