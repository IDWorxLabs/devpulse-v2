/**
 * Windows Validator Clean Exit V1 — types and pass token.
 */

export const WINDOWS_VALIDATOR_CLEAN_EXIT_V1_PASS_TOKEN =
  'WINDOWS_VALIDATOR_CLEAN_EXIT_V1_PASS';

export const WINDOWS_VALIDATOR_CLEAN_EXIT_CONTRACT_VERSION =
  'WINDOWS_VALIDATOR_CLEAN_EXIT_V1';

export interface ValidatorHttpServerHandle {
  server: import('node:http').Server;
  baseUrl: string;
  close: () => Promise<void>;
}

export interface ValidatorCleanExitOptions {
  servers?: import('node:http').Server[];
  closeUndici?: boolean;
}
