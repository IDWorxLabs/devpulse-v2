export const AUTH_MODES = ['guest', 'email', 'google', 'apple', 'microsoft'] as const;
export type AuthMode = (typeof AUTH_MODES)[number];
export const DEFAULT_AUTH_MODE: AuthMode = 'guest';
