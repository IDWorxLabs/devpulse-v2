/** Feature module registry — Modular Feature Materialization V1 */
import CounterFeature from './counter';

export const FEATURE_REGISTRY = [
  {
    id: 'counter',
    name: 'Counter',
    route: '/',
    component: CounterFeature,
    sourcePath: 'src/features/counter/CounterFeature.tsx',
    contractId: 'feature-counter',
    promptTerms: ["counter"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
