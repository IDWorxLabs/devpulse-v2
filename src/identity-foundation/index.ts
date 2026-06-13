export {
  IDENTITY_FOUNDATION_VERSION,
  type IdentityProfile,
  type IdentityFoundationSnapshot,
  type LegacyProductIdentity,
} from './identity-foundation-types.js';
export { CANONICAL_IDENTITY_PROFILE, IDENTITY_FOUNDATION_PASS_TOKEN } from './identity-foundation-registry.js';
export {
  getIdentityProfile,
  loadIdentityFoundation,
  serializeIdentityForLlm,
} from './identity-foundation-authority.js';
export {
  AIDEVENGINE_IDENTITY_CORRECTION_PASS_TOKEN,
  CURRENT_PRODUCT_NAME,
  LEGACY_PRODUCT_NAME,
  FOUNDER_IDENTITY,
  COMPANY_IDENTITY,
  CANONICAL_LEGACY_PRODUCT_IDENTITY,
  getLegacyProductIdentity,
  serializeLegacyNamingRulesForLlm,
  isLegacyProductQuestion,
  isCurrentProductQuestion,
  usesDevPulseAsCurrentIdentity,
} from './legacy-product-identity.js';
