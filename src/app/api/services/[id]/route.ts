import { NextRequest, NextResponse } from "next/server";
import { getServiceById, getServiceReviews } from "@/lib/store";
import { getCurrentUser } from "@/lib/auth";

// GET /api/services/[id] — get a single service by ID (with reviews)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const service = getServiceById(id);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const reviews = getServiceReviews(id);
  const user = await getCurrentUser();
  const isOwner = user?.id === service.providerId;

  return NextResponse.json({
    service: {
      ...service,
      // Only show contact info to authenticated users
      contactInfo: user ? service.contactInfo : "",
    },
    reviews,
    isOwner,
  });
}
