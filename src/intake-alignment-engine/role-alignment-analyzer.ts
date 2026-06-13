/**
 * Role Alignment Analyzer — complementary role detection (V1).
 */

import { normalizeRole, rolesAreComplementary } from './evidence-normalizer.js';
import type { AlignmentEvidenceBundle, RoleAlignmentResult } from './intake-alignment-types.js';

export function analyzeRoleAlignment(bundle: AlignmentEvidenceBundle): RoleAlignmentResult {
  const normalizedRoles = bundle.roles.map((r) => normalizeRole(r));
  const unique = [...new Set(normalizedRoles.filter((r) => r !== 'UNKNOWN'))];
  const complementary = rolesAreComplementary(normalizedRoles);

  let roleAlignmentScore = unique.length === 0 ? 30 : unique.length === 1 ? 55 : 75;
  if (complementary) roleAlignmentScore = Math.max(roleAlignmentScore, 90);

  const transportPair =
    unique.includes('TRANSPORT_OPERATOR') && unique.includes('END_USER');
  if (transportPair) roleAlignmentScore = 95;

  return {
    readOnly: true,
    normalizedRoles: unique,
    roleAlignmentScore,
    highRoleAlignment: roleAlignmentScore >= 70,
    evidence: complementary ? ['COMPLEMENTARY_ROLES'] : [`ROLES_${unique.join('_')}`],
  };
}
