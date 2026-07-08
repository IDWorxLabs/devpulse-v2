/** Types for reservations feature module — reusable components where */
export interface ReservationsRecord {
  id: string;
  label: string;
  createdAt: string;
}

export interface ReservationsFormState {
  label: string;
}
