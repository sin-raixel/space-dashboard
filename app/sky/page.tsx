import PageShell from "../components/page-shell";
import SkyView from "../components/sky-view";

export const metadata = { title: "Sky tonight" };

export default function Page() {
  return (
    <PageShell
      current="sky"
      title="Sky tonight"
      description="Which constellations are above you, and where to find them. Pick a time, and the chart and list follow."
    >
      <SkyView />
    </PageShell>
  );
}
