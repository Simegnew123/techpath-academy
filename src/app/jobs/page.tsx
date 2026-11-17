import Link from "next/link";

type JobDisplay = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  salaryRange: string;
  postedAt: string;
};

export default async function JobsPage() {
  let jobs: JobDisplay[] = [];

  try {
    const { getActiveJobListings } = await import("@/lib/store");
    const raw = getActiveJobListings();
    jobs = raw.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      type: j.type,
      description: j.description,
      requirements: j.requirements,
      salaryRange: j.salaryRange,
      postedAt: j.postedAt,
    }));
  } catch {
    // empty state
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="mb-4 inline-block text-sm text-indigo-600 hover:underline">← Home</Link>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">💼 Job Board</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Employment opportunities for TechPath Academy graduates
      </p>

      {jobs.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="text-6xl">📋</div>
          <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-100">No open positions</h3>
          <p className="mt-1 text-sm text-slate-500">
            Check back soon — employers post new opportunities regularly.
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Continue Learning
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-slate-200 p-6 shadow-sm dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{job.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {job.company} · {job.location} · <span className="capitalize">{job.type}</span>
                  </p>
                </div>
                {job.salaryRange && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    {job.salaryRange}
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{job.description}</p>
              {job.requirements?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase text-slate-400">Requirements</p>
                  <ul className="mt-1 list-inside list-disc text-sm text-slate-600 dark:text-slate-300">
                    {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              <p className="mt-3 text-xs text-slate-400">Posted: {new Date(job.postedAt).toLocaleDateString()}</p>
              <button className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
