import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSkillProfile, updateSkillProfile, getAllCompetencies } from "@/lib/store";

// GET /api/skill-profile?userId=xxx — get user's competency skill profile
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId") || user.id;

  // Users can view their own profile; admins/instructors can view anyone's
  if (targetUserId !== user.id && user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let profile = getSkillProfile(targetUserId);
  if (!profile) {
    profile = updateSkillProfile(targetUserId);
  }
  const safeProfile = profile;

  const competencies = getAllCompetencies();
  const competencyMap = new Map(competencies.map((c) => [c.id, c]));

  const enrichedProfile = {
    ...safeProfile,
    competencies: safeProfile.competencies.map((pc) => ({
      ...pc,
      name: competencyMap.get(pc.competencyId)?.name || "Unknown",
      category: competencyMap.get(pc.competencyId)?.category || "General",
      description: competencyMap.get(pc.competencyId)?.description || "",
    })),
  };

  return NextResponse.json({ profile: enrichedProfile });
}

// POST /api/skill-profile — recalculate skill profile
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = updateSkillProfile(user.id);
  return NextResponse.json({ profile });
}
