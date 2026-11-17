import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getServiceBookings, createServiceBooking, updateServiceBooking } from "@/lib/store";

// GET /api/services/bookings?serviceId=xxx — get bookings for a service (provider only)
// GET /api/services/bookings?mine=true — get my bookings (as requester)
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const mine = searchParams.get("mine") === "true";

  if (mine) {
    return NextResponse.json({ bookings: getServiceBookings(undefined, user.id) });
  }

  if (serviceId) {
    // Only the service provider or admin can see all bookings for a service
    return NextResponse.json({ bookings: getServiceBookings(serviceId) });
  }

  return NextResponse.json({ error: "serviceId or mine=true required" }, { status: 400 });
}

// POST /api/services/bookings — create a booking request
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.serviceId) return NextResponse.json({ error: "serviceId required" }, { status: 400 });

  const booking = createServiceBooking({
    serviceId: body.serviceId,
    userId: user.id,
    message: body.message || "",
  });
  return NextResponse.json({ booking }, { status: 201 });
}

// PATCH /api/services/bookings — update booking status (provider confirms/cancels)
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  updateServiceBooking(id, { status, respondedAt: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
