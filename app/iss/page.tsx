import IssTracker from "../components/iss-tracker";
import PageShell from "../components/page-shell";

export const metadata = { title: "ISS tracker" };

export default function Page() {
  return (
    <PageShell
      current="iss"
      title="ISS tracker"
      description="The International Space Station circles the Earth about every 90 minutes at roughly 27,600 km/h. This is where it is right now."
    >
      <IssTracker />
    </PageShell>
  );
}
