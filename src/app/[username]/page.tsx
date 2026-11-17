import Link from "next/link";
import { notFound } from "next/navigation";
import { getPortfolioBySlug, getPortfolioCertificates, getPortfolioCompletedCourses, getCategoryById } from "@/lib/store";

export const revalidate = 0;

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const portfolio = getPortfolioBySlug(username);

  if (!portfolio) notFound();

  const certificates = getPortfolioCertificates(portfolio.userId);
  const completedCourses = getPortfolioCompletedCourses(portfolio.userId);
  const allSkills = Array.from(new Set(certificates.flatMap((c) => c.skills)));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 px-4 py-12 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 text-sm opacity-80">
            <span>🎓 TechPath Academy</span>
            <span>·</span>
            <span>Verified Portfolio</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold">{portfolio.headline || "Learner Profile"}</h1>
          {portfolio.location && (
            <p className="mt-1 text-white/80">📍 {portfolio.location}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Bio */}
        {portfolio.bio && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-slate-100">About</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{portfolio.bio}</p>
          </div>
        )}

        {/* Links */}
        {(portfolio.website || portfolio.linkedinUrl || portfolio.githubUrl) && (
          <div className="mt-4 flex flex-wrap gap-3">
            {portfolio.website && (
              <a href={portfolio.website} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                🌐 Website
              </a>
            )}
            {portfolio.linkedinUrl && (
              <a href={portfolio.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                💼 LinkedIn
              </a>
            )}
            {portfolio.githubUrl && (
              <a href={portfolio.githubUrl} target="_blank" rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                🐙 GitHub
              </a>
            )}
          </div>
        )}

        {/* Skills */}
        {allSkills.length > 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-slate-100">🏅 Verified Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certificates */}
        {certificates.length > 0 && (
          <div className="mt-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100">📜 Certificates ({certificates.length})</h2>
            <div className="mt-3 space-y-3">
              {certificates.map((cert) => {
                const course = completedCourses.find((c) => c.id === cert.courseId);
                const cat = course ? getCategoryById(course.categoryId) : null;
                return (
                  <Link
                    key={cert.id}
                    href={`/certificates/${cert.code}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{course?.title || "Course"}</p>
                        <p className="text-xs text-slate-500">{cat?.icon} {cat?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          ✓ Verified
                        </span>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed Courses */}
        {completedCourses.length > 0 && (
          <div className="mt-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100">📚 Completed Courses ({completedCourses.length})</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {completedCourses.map((course) => {
                const cat = getCategoryById(course.categoryId);
                return (
                  <div key={course.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                    <span className="text-xs text-slate-400">{cat?.icon} {cat?.name}</span>
                    <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{course.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-indigo-600">
            Powered by TechPath Academy 🎓
          </Link>
        </div>
      </div>
    </div>
  );
}
