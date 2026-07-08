/**
 * Autonomous Recovery Authority — registry.
 */

import {
  AUTONOMOUS_RECOVERY_AUTHORITY_OWNER_MODULE,
  AUTONOMOUS_RECOVERY_ENGINE_V1_PASS_TOKEN,
} from './autonomous-recovery-types.js';

export function getDevPulseV2AutonomousRecoveryAuthority(): {
  ownerModule: string;
  passToken: string;
  phase: number;
  enforcementAuthority: true;
} {
  return {
    ownerModule: AUTONOMOUS_RECOVERY_AUTHORITY_OWNER_MODULE,
    passToken: AUTONOMOUS_RECOVERY_ENGINE_V1_PASS_TOKEN,
    phase: 16,
    enforcementAuthority: true,
  };
}
