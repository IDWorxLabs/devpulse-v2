/**
 * Founder Preference Model — V3 foundation for future Founder Digital Twin.
 * Not personalized yet; stores product-facing preference weights.
 */

export interface FounderPreferenceModel {
  modelVersion: 'founder-preference-v1';
  desiredAutonomy: number;
  productFirstPreference: number;
  honestStatusPreference: number;
  lowArchitectureLeakagePreference: number;
  highActionabilityPreference: number;
  readOnly: true;
}

export const DEFAULT_FOUNDER_PREFERENCE_MODEL: FounderPreferenceModel = {
  modelVersion: 'founder-preference-v1',
  desiredAutonomy: 85,
  productFirstPreference: 90,
  honestStatusPreference: 88,
  lowArchitectureLeakagePreference: 95,
  highActionabilityPreference: 87,
  readOnly: true,
};

export function scorePreferenceAlignment(input: {
  visionAlignment: number;
  architectureLeakagePenalty: number;
  actionability: number;
  honestStatus: number;
}): number {
  const m = DEFAULT_FOUNDER_PREFERENCE_MODEL;
  const raw =
    (input.visionAlignment * m.productFirstPreference) / 100 +
    ((100 - input.architectureLeakagePenalty) * m.lowArchitectureLeakagePreference) / 100 +
    (input.actionability * m.highActionabilityPreference) / 100 +
    (input.honestStatus * m.honestStatusPreference) / 100;
  return Math.max(0, Math.min(100, Math.round(raw / 4)));
}
