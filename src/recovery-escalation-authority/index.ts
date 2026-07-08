/**
 * Recovery Escalation Authority — public exports.
 */

export {
  RECOVERY_ESCALATION_AUTHORITY_OWNER_MODULE,
  RECOVERY_ESCALATION_AUTHORITY_V1_PASS_TOKEN,
} from './recovery-escalation-types.js';
export type { RecoveryEscalationDecision, RecoveryEscalationInput } from './recovery-escalation-types.js';
export { evaluateRecoveryEscalation } from './recovery-escalation-authority.js';
