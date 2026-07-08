/** Feature module registry — Modular Feature Materialization V1 */
import NotesFeature from './notes';

export const FEATURE_REGISTRY = [
  {
    id: 'notes',
    name: 'Notes',
    route: '/',
    component: NotesFeature,
    sourcePath: 'src/features/notes/NotesFeature.tsx',
    contractId: 'feature-notes',
    promptTerms: ["notes"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
