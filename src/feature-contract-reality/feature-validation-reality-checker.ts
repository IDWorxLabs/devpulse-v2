/**
 * Feature Contract Reality V1 — validation metadata checks.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function checkFeatureValidationReality(input: {
  workspaceDir: string;
  featureId: string;
  contractId: string;
}): {
  validated: boolean;
  validationPath: string;
  evidencePaths: string[];
  missingEvidence: string[];
  failureReasons: string[];
} {
  const validationPath = join(input.workspaceDir, 'src/features', input.featureId, `${input.featureId}.validation.ts`);
  if (!existsSync(validationPath)) {
    return {
      validated: false,
      validationPath: '',
      evidencePaths: [],
      missingEvidence: [`src/features/${input.featureId}/${input.featureId}.validation.ts`],
      failureReasons: ['validation metadata file missing'],
    };
  }

  const source = readFileSync(validationPath, 'utf8');
  const validated =
    source.includes('_VALIDATION') &&
    source.includes(`moduleId: '${input.featureId}'`) &&
    source.includes(`contractId: '${input.contractId}'`) &&
    source.includes('rules:');

  return {
    validated,
    validationPath: validationPath.replace(/\\/g, '/'),
    evidencePaths: [validationPath.replace(/\\/g, '/')],
    missingEvidence: validated ? [] : ['validation metadata incomplete'],
    failureReasons: validated ? [] : ['validation metadata missing contract/module rules'],
  };
}
