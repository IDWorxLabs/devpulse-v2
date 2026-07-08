/**
 * Fast Project Create V1 — public API.
 */

export {
  FAST_PROJECT_CREATE_CONTRACT_VERSION,
  FAST_PROJECT_CREATE_TRACE,
  FAST_PROJECT_CREATE_V1_PASS_TOKEN,
  type FastProjectCreateDuplicateResult,
  type FastProjectCreateInput,
  type FastProjectCreateResult,
  type FastProjectCreateSuccessResult,
} from './fast-project-create-types.js';

export { executeFastProjectCreate } from './fast-project-create-authority.js';

export {
  FAST_PROJECT_CREATE_CONTRACT_V1_PASS_TOKEN,
  FAST_PROJECT_CREATE_REQUEST_NAME_FIELDS,
  type FastProjectCreateParsedRequest,
  type FastProjectCreateRequestNameField,
  parseFastProjectCreateRequestBody,
  resolveFastProjectCreateRequestedName,
} from './fast-project-create-contract.js';

export const FAST_PROJECT_CREATE_API_PATH = '/api/projects/fast-create';
