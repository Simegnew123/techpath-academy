import Link from "next/link";

type CapstoneDisplay = {
  id: string;
  title: string;
  description: string;
  repositoryUrl: string;
  demoUrl: string;
  userName: string;
};

export default async function HallOfFamePage() {
  let projects: CapstoneDisplay[] = [];

  try {
    const { getCapstoneProjects, getAllUsers } = await import("@/lib/store");
    const raw = getCapstoneProjects();
    const users = getAllUsers();
    projects = raw.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      repositoryUrl: p.repositoryUrl,
      demoUrl: p.demoUrl,
      userName: users.find((u) => u.id === p.userId)?.name || "Anonymous",
    }));
  } catch {
    // If store not available, show empty state
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← Home</Link>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">🏆 Hall of Fame</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Outstanding capstone projects built by TechPath Academy graduates
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-6xl">🎓</div>
          <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-100">No projects yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Complete a course and submit your capstone project to be featured here!
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 p-6 shadow-sm dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{p.title}</h3>
              <p className="mt-1 text-sm text-slate-500">by {p.userName}</p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{p.description}</p>
              <div className="mt-4 flex gap-3">
                {p.repositoryUrl && (
                  <a
                    href={p.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    📦 Repository
                  </a>
                )}
                {p.demoUrl && (
                  <a
                    href={p.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    🚀 Live Demo
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
