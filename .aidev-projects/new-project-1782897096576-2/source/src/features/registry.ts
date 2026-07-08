/** Feature module registry — Modular Feature Materialization V1 */
import CalculatorFeature from './calculator';

export const FEATURE_REGISTRY = [
  {
    id: 'calculator',
    name: 'Calculator',
    route: '/calculator',
    component: CalculatorFeature,
    sourcePath: 'src/features/calculator/CalculatorFeature.tsx',
    contractId: 'feature-calculator',
    promptTerms: ["calculator"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
