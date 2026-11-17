import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getPortfolio,
  upsertPortfolio,
  getPortfolioBySlug,
  getPortfolioCertificates,
  getPortfolioCompletedCourses,
} from "@/lib/store";

// GET /api/portfolios?slug=xxx — public profile by slug, or own portfolio
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (slug) {
    // Public view
    const portfolio = getPortfolioBySlug(slug);
    if (!portfolio) return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });

    const certificates = getPortfolioCertificates(portfolio.userId);
    const completedCourses = getPortfolioCompletedCourses(portfolio.userId);

    return NextResponse.json({
      portfolio,
      certificates,
      completedCourses,
    });
  }

  // Own portfolio
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const portfolio = getPortfolio(user.id);
  return NextResponse.json({ portfolio, user: { name: user.name, email: user.email } });
}

// POST /api/portfolios — create or update own portfolio
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const slug = (body.slug || user.name).toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const portfolio = upsertPortfolio(user.id, {
    slug,
    bio: body.bio || "",
    headline: body.headline || "",
    location: body.location || "",
    website: body.website || "",
    linkedinUrl: body.linkedinUrl || "",
    githubUrl: body.githubUrl || "",
    isPublic: body.isPublic ?? false,
  });

  return NextResponse.json({ portfolio });
}
