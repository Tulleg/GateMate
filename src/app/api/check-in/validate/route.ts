import { NextResponse } from "next/server";
import { verifyTicketJwt } from "@/lib/qr";

export async function POST(req: Request) {
  try {
    const { token, eventId } = await req.json();

    if (!token || !eventId) {
      return NextResponse.json({ success: false, message: "Missing token or eventId" }, { status: 400 });
    }

    const payload = await verifyTicketJwt(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: "Invalid or forged QR token signature" }, { status: 401 });
    }

    if (payload.eventId !== eventId) {
      return NextResponse.json({ success: false, message: "Ticket is for a different event" }, { status: 400 });
    }

    // TODO: Verify ticket status in database & create check_in record transactionally

    return NextResponse.json({
      success: true,
      message: "Ticket Verified Successfully",
      ticket: {
        id: payload.ticketId,
        attendeeName: "Sample Attendee",
        attendeeEmail: "attendee@example.com",
        tierName: "General Admission",
        checkedInAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
