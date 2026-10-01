export type SystemRole = "superadmin" | "organizer";

export type OrgRole = "owner" | "admin" | "scanner";

export type TicketStatus = "valid" | "used" | "refunded" | "cancelled";

export type OrderStatus = "pending" | "completed" | "failed" | "refunded";

export interface QrTicketPayload {
  ticketId: string;
  orderId: string;
  eventId: string;
  tierId: string;
  organizationId: string;
  issuedAt: number;
  nonce: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  ticket?: {
    id: string;
    attendeeName: string;
    attendeeEmail: string;
    tierName: string;
    checkedInAt: string;
  };
  error?: string;
}

export * from "./actions";

