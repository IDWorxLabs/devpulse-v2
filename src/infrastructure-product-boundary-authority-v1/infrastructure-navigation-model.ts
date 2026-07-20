/**
 * Infrastructure vs Product Boundary Authority V1 — Contract-Bound Root Navigation Authority V1.
 *
 * Every navigation item a generated application ever renders belongs to exactly one of two
 * constitutionally distinct categories:
 *
 *   CONTRACT NAVIGATION — owned exclusively by CBGA. Every label must appear in CBGA's approved
 *   navigation plan (`CbgaGenerationReport.navigationPlan`), which itself traces back to the
 *   canonical product contract. Examples: "Customers", "Bookings", "Invoices", "Calendar".
 *
 *   INFRASTRUCTURE NAVIGATION — owned exclusively by the Blueprint Infrastructure Layer. It exists
 *   only to host/route to the product (a root shell container, an application frame, a navigation
 *   host, a root landing/entry surface) and carries no business identity of its own. It must never
 *   be interpreted as product navigation, never be compared against CBGA's navigation plan, and
 *   never require CBGA approval.
 *
 * This module defines the *generic* infrastructure-navigation taxonomy — structural responsibility
 * kinds, never a specific label ("Home" is not special-cased anywhere in this file or in any code
 * that consumes it; only the structural *kind* a navigation item plays matters).
 */

/** Phase: generic infrastructure-navigation taxonomy. Every kind below hosts/routes the product; none is a business concept. */
export type InfrastructureNavigationKind =
  | 'ROOT_SURFACE'
  | 'ROOT_LAYOUT'
  | 'ROOT_CONTAINER'
  | 'APPLICATION_FRAME'
  | 'ENTRY_SURFACE';

export const INFRASTRUCTURE_NAVIGATION_KINDS: readonly InfrastructureNavigationKind[] = [
  'ROOT_SURFACE',
  'ROOT_LAYOUT',
  'ROOT_CONTAINER',
  'APPLICATION_FRAME',
  'ENTRY_SURFACE',
];

export function isInfrastructureNavigationKind(value: string): value is InfrastructureNavigationKind {
  return (INFRASTRUCTURE_NAVIGATION_KINDS as readonly string[]).includes(value);
}

/**
 * One infrastructure-owned navigation entry point. Structurally identical in shape to a
 * contract-owned navigation item (`id`/`label`) but carries an explicit `kind` tag naming *why* it
 * exists structurally — never a business reason. A generator may render this item's `label` to give
 * the user a way back to the root/entry surface, but that label is never product copy and must never
 * be compared against, or required to appear in, CBGA's navigation plan.
 */
export interface InfrastructureNavigationItem {
  readonly kind: InfrastructureNavigationKind;
  readonly id: string;
  readonly label: string;
}
