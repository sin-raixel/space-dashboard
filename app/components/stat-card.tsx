import type { ReactNode } from "react";
import GlowCard from "./glow-card";

// Render inside a <dl>: each card is one dt/dd pair.
export default function StatCard({
  label,
  value,
  unit,
  note,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  icon: ReactNode;
}) {
  return (
    <GlowCard className="accent-line flex flex-col p-5 pb-6">
      <dt className="flex items-start justify-between gap-3">
        <span className="eyebrow !text-[0.65rem] !tracking-[0.2em]">{label}</span>
        <span className="icon-chip" aria-hidden="true">
          {icon}
        </span>
      </dt>
      <dd className="mt-4 min-w-0">
        <span className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="stat-value text-2xl sm:text-[1.7rem]">{value}</span>
          {unit && <span className="text-sm font-semibold text-violet-300">{unit}</span>}
        </span>
        {note && <span className="mt-1 block truncate text-sm text-violet-200/70">{note}</span>}
      </dd>
    </GlowCard>
  );
}
