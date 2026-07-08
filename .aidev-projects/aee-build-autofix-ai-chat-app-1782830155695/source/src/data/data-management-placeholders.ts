/** Data management placeholders. */
export const EXPORT_FORMATS = ['csv', 'pdf', 'json'] as const;

export function exportUserData(_format: (typeof EXPORT_FORMATS)[number]): void {
  /* placeholder */
}

export function deleteAccountPlaceholder(): void {
  /* placeholder */
}

export function backupRecoveryPlaceholder(): void {
  /* placeholder */
}
