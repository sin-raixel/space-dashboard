"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { DayCount, ScatterPoint } from "../lib/asteroid-filters";
import GlowCard from "./glow-card";

const VIOLET = "#a78bfa";
const RED = "#fb7185"; // rose, so hazards still stand out against the purple
const GRID = "#2e1065";
const AXIS = "#a78bfa";
const tooltipBox = { background: "#0d0626", border: "1px solid #7c3aed", borderRadius: 8, color: "#ede9fe" };

// ResponsiveContainer needs a size to draw into before the browser measures one.
const initial = { width: 600, height: 300 };

export default function AsteroidCharts({ days, points }: { days: DayCount[]; points: ScatterPoint[] }) {
  const others = points.filter((p) => !p.hazardous);
  const hazardous = points.filter((p) => p.hazardous);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <GlowCard className="hud-corners p-5">
       <figure>
        <figcaption className="mb-4">
          <span className="eyebrow !text-[0.65rem]">Per day</span>
          <span className="mt-1 block font-display text-sm font-semibold tracking-wide text-white">Close approaches per day</span>
        </figcaption>
        <div role="img" aria-label="Stacked bar chart of how many asteroids pass Earth each day" className="h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={initial}>
            <BarChart data={days} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="date" stroke={AXIS} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis stroke={AXIS} allowDecimals={false} />
              <Tooltip contentStyle={tooltipBox} cursor={{ fill: "#7c3aed33" }} />
              <Legend />
              <Bar dataKey="other" name="Other" stackId="a" fill={VIOLET} />
              <Bar dataKey="hazardous" name="Potentially hazardous" stackId="a" fill={RED} />
            </BarChart>
          </ResponsiveContainer>
        </div>
       </figure>
      </GlowCard>

      <GlowCard className="hud-corners p-5">
       <figure>
        <figcaption className="mb-4">
          <span className="eyebrow !text-[0.65rem]">Both axes log scale</span>
          <span className="mt-1 block font-display text-sm font-semibold tracking-wide text-white">Size against miss distance</span>
        </figcaption>
        <div role="img" aria-label="Scatter chart of asteroid size against miss distance, both on log scales" className="h-72">
          <ResponsiveContainer width="100%" height="100%" initialDimension={initial}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 36, left: 0 }}>
              <CartesianGrid stroke={GRID} />
              <XAxis
                type="number"
                dataKey="sizeM"
                name="Size"
                unit=" m"
                scale="log"
                domain={["auto", "auto"]}
                stroke={AXIS}
                tickFormatter={(value: number) => String(Math.round(value))}
                label={{ value: "Size (m, log scale)", position: "insideBottom", offset: -6, fill: AXIS }}
              />
              <YAxis
                type="number"
                dataKey="lunar"
                width={78}
                name="Miss distance"
                unit=" LD"
                scale="log"
                domain={["auto", "auto"]}
                stroke={AXIS}
                tickFormatter={(value: number) => String(Number(value.toPrecision(2)))}
                label={{ value: "Moon distances", angle: -90, position: "insideLeft", fill: AXIS }}
              />
              <ZAxis range={[70, 70]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  const point = active && payload?.length ? (payload[0].payload as ScatterPoint) : undefined;
                  if (!point) return null;
                  return (
                    <div style={tooltipBox} className="px-3 py-2 text-sm">
                      <p className="font-semibold">{point.name}</p>
                      <p>{Math.round(point.sizeM)} m wide</p>
                      <p>{point.lunar.toFixed(1)} Moon distances away</p>
                      {point.hazardous && <p style={{ color: RED }}>Potentially hazardous</p>}
                    </div>
                  );
                }}
              />
              <Legend />
              <Scatter name="Other" data={others} fill={VIOLET} />
              <Scatter name="Potentially hazardous" data={hazardous} fill={RED} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
       </figure>
      </GlowCard>
    </div>
  );
}