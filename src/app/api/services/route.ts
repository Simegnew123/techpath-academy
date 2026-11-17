import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getActiveServices,
  getServiceById,
  getServicesByProvider,
  createService,
  updateService,
  deleteService,
  getServiceCategories,
} from "@/lib/store";

// GET /api/services — list active services (public), or my services, or by category/search
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;
  const mine = searchParams.get("mine") === "true";
  const categories = searchParams.get("categories") === "true";

  if (categories) {
    return NextResponse.json({ categories: getServiceCategories() });
  }

  if (mine) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ services: getServicesByProvider(user.id) });
  }

  const services = getActiveServices(category, search);
  return NextResponse.json({ services, count: services.length });
}

// POST /api/services — create a new service listing (any logged-in user)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.title || !body.category) {
    return NextResponse.json({ error: "title and category required" }, { status: 400 });
  }

  const service = createService({
    providerId: user.id,
    providerName: user.name,
    title: body.title,
    description: body.description || "",
    category: body.category,
    tags: body.tags || [],
    price: body.price || 0,
    priceUnit: body.priceUnit || "negotiable",
    location: body.location || "Online",
    contactMethod: body.contactMethod || "email",
    contactInfo: body.contactInfo || "",
    isActive: true,
    featured: false,
  });
  return NextResponse.json({ service }, { status: 201 });
}

// PATCH /api/services — update a service listing
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const service = getServiceById(id);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  // Only the provider or admin can update
  if (service.providerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  updateService(id, updates);
  return NextResponse.json({ success: true });
}

// DELETE /api/services?id=xxx — delete a service listing
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const service = getServiceById(id);
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  if (service.providerId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  deleteService(id);
  return NextResponse.json({ success: true });
}
