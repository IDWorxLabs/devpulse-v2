/**
 * Security Hardening — unsafe capability detector.
 */

import type {
  SecurityHardeningInput,
  UnsafeCapabilityDetection,
  UnsafeCapabilityType,
} from './security-hardening-types.js';
import { getCachedUnsafeCapabilityDetection, setCachedUnsafeCapabilityDetection } from './security-hardening-cache.js';

let unsafeCapabilityDetectionCount = 0;

export function detectUnsafeCapabilities(input: SecurityHardeningInput): UnsafeCapabilityDetection {
  const cacheKey = [
    input.unsafeFileModification,
    input.unsafeDeployment,
    input.unsafeAutonomousCompletion,
    input.unsafeWorld2Execution,
    input.unsafeExternalNetwork,
  ].join('|');

  const cached = getCachedUnsafeCapabilityDetection(cacheKey);
  if (cached) return cached;

  unsafeCapabilityDetectionCount += 1;
  const unsafeCapabilities: UnsafeCapabilityType[] = [];
  const gatingWarnings: string[] = [];

  if (input.unsafeFileModification === true) unsafeCapabilities.push('file_modification');
  if (input.unsafeProjectMutation === true) unsafeCapabilities.push('project_mutation');
  if (input.unsafeWorkspaceMutation === true) unsafeCapabilities.push('workspace_mutation');
  if (input.unsafeBuildExecution === true) unsafeCapabilities.push('build_execution');
  if (input.unsafeDeployment === true) unsafeCapabilities.push('deployment');
  if (input.unsafeCloudExecution === true) unsafeCapabilities.push('cloud_execution');
  if (input.unsafeAutonomousFix === true) unsafeCapabilities.push('autonomous_fix');
  if (input.unsafeAutonomousCompletion === true) unsafeCapabilities.push('autonomous_completion');
  if (input.unsafeWorld2Execution === true) unsafeCapabilities.push('world2_execution');
  if (input.unsafeMobileCommandExecution === true) unsafeCapabilities.push('mobile_command_execution');
  if (input.unsafeBillingPackageChanges === true) unsafeCapabilities.push('billing_package_changes');
  if (input.unsafeUserAccountMutation === true) unsafeCapabilities.push('user_account_mutation');
  if (input.unsafeExternalNetwork === true) unsafeCapabilities.push('external_network_operations');

  for (const cap of unsafeCapabilities) {
    gatingWarnings.push(`gate_${cap}_before_execution`);
  }

  const unsafeCapabilityScore = Math.max(0, Math.min(100, Math.round(100 - unsafeCapabilities.length * 8)));

  const result: UnsafeCapabilityDetection = {
    unsafeCapabilities: [...new Set(unsafeCapabilities)],
    unsafeCapabilityScore,
    gatingWarnings,
  };

  setCachedUnsafeCapabilityDetection(cacheKey, result);
  return result;
}

export function getUnsafeCapabilityDetectionCount(): number {
  return unsafeCapabilityDetectionCount;
}

export function resetUnsafeCapabilityDetectorForTests(): void {
  unsafeCapabilityDetectionCount = 0;
}
