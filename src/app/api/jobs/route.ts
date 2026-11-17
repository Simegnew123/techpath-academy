import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getActiveJobListings,
  getJobListingById,
  createJobListing,
  updateJobListing,
  deleteJobListing,
  getJobApplications,
  getMyJobApplications,
  createJobApplication,
  updateJobApplication,
} from "@/lib/store";

// GET /api/jobs — list active jobs, or applications for a specific job (admin), or my applications
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const myApps = searchParams.get("myApplications") === "true";
  const jobId = searchParams.get("jobId");
  const applications = searchParams.get("applications") === "true";

  // My applications
  if (myApps) {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ applications: getMyJobApplications(user.id) });
  }

  // Applications for a specific job (admin/employer only)
  if (applications && jobId) {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "instructor") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    return NextResponse.json({ applications: getJobApplications(jobId) });
  }

  // Public: list active jobs
  const jobs = getActiveJobListings();
  return NextResponse.json({ jobs, count: jobs.length });
}

// POST /api/jobs — create job listing (admin/instructor) or apply for a job (student)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Apply for a job
  if (body.action === "apply" && body.jobId) {
    const app = createJobApplication({
      jobId: body.jobId,
      userId: user.id,
      coverLetter: body.coverLetter || "",
    });
    return NextResponse.json({ application: app }, { status: 201 });
  }

  // Create job listing
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized to post jobs" }, { status: 403 });
  }

  if (!body.title || !body.company) {
    return NextResponse.json({ error: "title and company required" }, { status: 400 });
  }

  const expiresAt = body.expiresAt || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const job = createJobListing({
    title: body.title,
    company: body.company,
    location: body.location || "Remote",
    type: body.type || "full-time",
    description: body.description || "",
    requirements: body.requirements || [],
    preferredCertifications: body.preferredCertifications || [],
    salaryRange: body.salaryRange || "",
    postedBy: user.id,
    isActive: true,
    expiresAt,
  });
  return NextResponse.json({ job }, { status: 201 });
}

// PATCH /api/jobs — update job listing or application status
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Update application status
  if (body.applicationId && body.status) {
    if (user.role !== "admin" && user.role !== "instructor") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
    updateJobApplication(body.applicationId, { status: body.status, reviewedAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  }

  // Update job listing
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  updateJobListing(id, updates);
  return NextResponse.json({ success: true });
}

// DELETE /api/jobs?id=xxx — delete job listing
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && user.role !== "instructor") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteJobListing(id);
  return NextResponse.json({ success: true });
}
