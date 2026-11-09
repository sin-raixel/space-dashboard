import IssTracker from "../components/iss-tracker";
import SiteNav from "../components/site-nav";

export const metadata = { title: "ISS tracker | Space dashboard" };

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <main className="mx-auto max-w-5xl px-6 py-14">
        <SiteNav current="iss" />
        <header className="mb-10">
          <p className="text-sm font-semibold tracking-widest text-violet-300 uppercase">Space dashboard</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">ISS tracker</h1>
          <p className="mt-4 max-w-2xl">
            The International Space Station circles the Earth about every 90 minutes at roughly 27,600 km/h. This is
            where it is right now.
          </p>
        </header>

        <IssTracker />
      </main>
    </div>
  );
}
