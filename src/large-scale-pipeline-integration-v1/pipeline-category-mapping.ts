/**
 * Large-Scale Pipeline Integration V1 — category mapping across validation suites.
 */

import { LARGE_SCALE_VALIDATION_SUITE } from '../large-scale-multi-app-validation-v1/large-scale-category-suite-registry.js';
import { REAL_BUILD_EXECUTION_SUITE } from '../real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { GENERAL_PURPOSE_PROOF_SUITE } from '../general-purpose-code-generation-v1/general-purpose-code-generation-v1-suite-registry.js';
import { CLOUD_EXECUTION_PROOF_PROFILES } from '../cloud-execution-path-v1/cloud-execution-path-v1-bounds.js';
import type { PipelineEvidenceBundle } from './pipeline-evidence-loader.js';
import type {
  CategoryMappingEntry,
  CategoryProofFlag,
  GapClassification,
} from './large-scale-pipeline-integration-v1-types.js';

function profileSet(entries: readonly { profile: string }[]): Set<string> {
  return new Set(entries.map((e) => e.profile));
}

function classifyGap(
  flags: readonly CategoryProofFlag[],
): GapClassification {
  if (flags.includes('MOBILE_PROVEN') && flags.includes('CLOUD_PROVEN')) return 'CLOUD_SIMULATED_PROVEN';
  if (flags.includes('MOBILE_PROVEN') && flags.includes('PRODUCTION_PROVEN')) return 'PRODUCTION_PROVEN';
  if (flags.includes('CLOUD_PROVEN')) return 'CLOUD_SIMULATED_PROVEN';
  if (flags.includes('PRODUCTION_PROVEN')) return 'PRODUCTION_PROVEN';
  if (flags.includes('BUILD_PROVEN') && !flags.includes('VERIFICATION_PROVEN')) return 'BUILD_ONLY';
  if (flags.includes('BROAD_VALIDATED') && !flags.includes('BUILD_PROVEN')) return 'BREADTH_ONLY';
  if (
    flags.includes('BUILD_PROVEN') &&
    flags.includes('VERIFICATION_PROVEN')
  ) {
    return 'FULLY_PROVEN';
  }
  return 'UNVALIDATED';
}

export type { CategoryMappingEntry } from './large-scale-pipeline-integration-v1-types.js';

export function buildCategoryMapping(
  bundle: PipelineEvidenceBundle,
): readonly CategoryMappingEntry[] {
  const broadProfiles = profileSet(LARGE_SCALE_VALIDATION_SUITE);
  const rbepProfiles = profileSet(REAL_BUILD_EXECUTION_SUITE);
  const gpProfiles = profileSet(GENERAL_PURPOSE_PROOF_SUITE);
  const cloudProfiles = new Set<string>(CLOUD_EXECUTION_PROOF_PROFILES);

  const rbepByProfile = new Map(
    bundle.rbepBuildProof.map((e) => [e.profile ?? e.category ?? '', e]),
  );
  const uvlByProfile = new Map(bundle.uvlProof.map((e) => [e.profile ?? '', e]));
  const aflaByProfile = new Map(bundle.aflaSuite.map((e) => [e.profile ?? '', e]));
  // Production gate evaluates RBEP suite — mark profiles when production proof is proven
  const productionReadySet = new Set<string>();
  if (bundle.productionAssessment.productionProofStatus === 'PROVEN') {
    for (const entry of REAL_BUILD_EXECUTION_SUITE) {
      productionReadySet.add(entry.profile);
    }
  }

  const gpProvenSet = new Set(bundle.gpcgAssessment.domainProfiles);
  const cloudProvenSet = new Set(bundle.cloudAssessment.profiles);
  const mobileProvenSet = new Set(bundle.mobileAssessment.provenProfiles);
  const concurrentProvenSet = new Set(bundle.concurrentAssessment.provenProfiles);

  const allProfiles = new Set<string>([
    ...broadProfiles,
    ...rbepProfiles,
    ...gpProfiles,
    ...cloudProfiles,
  ]);

  const productNameByProfile = new Map<string, string>();
  for (const entry of LARGE_SCALE_VALIDATION_SUITE) {
    productNameByProfile.set(entry.profile, entry.productName);
  }
  for (const entry of REAL_BUILD_EXECUTION_SUITE) {
    productNameByProfile.set(entry.profile, entry.productName);
  }
  for (const entry of GENERAL_PURPOSE_PROOF_SUITE) {
    productNameByProfile.set(entry.profile, entry.productName);
  }

  return [...allProfiles].sort().map((profile) => {
    const rbep = rbepByProfile.get(profile);
    const uvl = uvlByProfile.get(profile);
    const afla = aflaByProfile.get(profile);

    const flags: CategoryProofFlag[] = [];
    if (broadProfiles.has(profile)) flags.push('BROAD_VALIDATED');
    if (rbep?.buildResult === 'PASS' || rbep?.proofComplete) flags.push('BUILD_PROVEN');
    if (uvl?.verificationVerdict === 'VERIFIED' || rbep?.uvlResult === 'PASS') {
      flags.push('VERIFICATION_PROVEN');
    }
    if (gpProvenSet.has(profile) && bundle.gpcgAssessment.proofStatus === 'PROVEN') {
      flags.push('GP_PROVEN');
    }
    if (cloudProvenSet.has(profile) && bundle.cloudAssessment.cloudSimulatedProofStatus === 'PROVEN') {
      flags.push('CLOUD_PROVEN');
    }
    if (mobileProvenSet.has(profile) && bundle.mobileAssessment.mobileProofStatus === 'PROVEN') {
      flags.push('MOBILE_PROVEN');
    }
    if (
      concurrentProvenSet.has(profile) &&
      bundle.concurrentAssessment.concurrentProofStatus === 'PROVEN'
    ) {
      flags.push('CONCURRENT_PROVEN');
    }
    if (productionReadySet.has(profile)) flags.push('PRODUCTION_PROVEN');

    const gapClassification = classifyGap(flags);

    return {
      readOnly: true,
      profile,
      productName: productNameByProfile.get(profile) ?? profile,
      flags,
      gapClassification,
      suites: {
        broad: broadProfiles.has(profile),
        rbep: rbepProfiles.has(profile),
        gp: gpProfiles.has(profile),
        cloud: cloudProfiles.has(profile),
      },
    };
  });
}

export function countFlaggedCategories(
  mapping: readonly CategoryMappingEntry[],
  flag: CategoryProofFlag,
): number {
  return mapping.filter((e) => e.flags.includes(flag)).length;
}
