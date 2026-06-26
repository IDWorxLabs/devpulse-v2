/**
 * Feature Contract Reality V1 — load planned features from profile + contract.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneratedAppManifest } from '../universal-prompt-to-app-materialization/generated-app-manifest.js';
import {
  getProfileFeatureDefinition,
  type MaterializationProfile,
} from '../universal-prompt-to-app-materialization/profile-feature-map.js';
import { materializableFeatureModules } from '../universal-prompt-to-app-materialization/modular-feature-module-generator.js';

export interface PlannedFeatureContractItem {
  readOnly: true;
  featureId: string;
  featureName: string;
  contractId: string;
  route: string;
  promptTerms: string[];
  inUniversalContract: boolean;
}

export function loadPlannedFeatureContractItems(input: {
  workspaceDir: string;
  manifest: GeneratedAppManifest;
}): PlannedFeatureContractItem[] {
  const profile = String(input.manifest.selectedProfile) as MaterializationProfile;
  const definition = getProfileFeatureDefinition(profile, input.manifest.prompt);
  const moduleIds = materializableFeatureModules(definition);
  const contractIds = loadContractFeatureIds(input.workspaceDir);

  return moduleIds.map((featureId) => {
    const manifestEntry = input.manifest.featureModuleDetails.find((entry) => entry.id === featureId);
    const contractId = manifestEntry?.contractId ?? `feature-${featureId}`;
    return {
      readOnly: true,
      featureId,
      featureName: manifestEntry?.name ?? featureId,
      contractId,
      route: manifestEntry?.route ?? `/${featureId}`,
      promptTerms: manifestEntry?.promptTerms ?? [],
      inUniversalContract: contractIds.has(contractId) || contractIds.has(featureId),
    };
  });
}

function loadContractFeatureIds(workspaceDir: string): Set<string> {
  const contractPath = join(workspaceDir, 'universal-feature-contract.json');
  if (!existsSync(contractPath)) return new Set();
  try {
    const contract = JSON.parse(readFileSync(contractPath, 'utf8')) as {
      entities?: Array<{ id: string; slug?: string }>;
      actions?: Array<{ id: string; entityId?: string }>;
    };
    const ids = new Set<string>();
    for (const entity of contract.entities ?? []) {
      ids.add(entity.id);
      if (entity.slug) ids.add(entity.slug);
      ids.add(`feature-${entity.id}`);
      if (entity.slug) ids.add(`feature-${entity.slug}`);
    }
    for (const action of contract.actions ?? []) {
      ids.add(action.id);
      if (action.entityId) ids.add(`feature-${action.entityId}`);
    }
    return ids;
  } catch {
    return new Set();
  }
}
