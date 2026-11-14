"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
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
const FUCHSIA = "#e879f9";
const ROSE = "#fb7185"; // hazards stay rose so they stand out against the purple
const GRID = "#3b1d78";
const TICK = { fill: "#b9a8f0", fontSize: 12 };

// ResponsiveContainer needs a size to draw into before the browser measures one.
const initial = { width: 480, height: 288 };

const shortDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const formatDay = (iso: string) => shortDay.format(new Date(`${iso}T00:00:00Z`));

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const formatSize = (metres: number) => (metres >= 1000 ? `${metres / 1000} km` : `${whole.format(metres)} m`);
const formatLunar = (lunar: number) => `${lunar} LD`;

/* ---------- Pieces ---------- */

function Legend({ items }: { items: { label: string; color: string; count: number }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-950/50 px-3 py-1 text-xs text-violet-100"
        >
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ background: item.color, boxShadow: `0 0 10px 1px ${item.color}` }}
          />
          {item.label}
          <span className="font-display font-semibold text-white">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}

function TooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-violet-400/50 bg-[#0d0626]/95 px-3.5 py-2.5 text-sm text-violet-50 shadow-[0_8px_30px_-6px_rgb(139_92_246/0.7)] backdrop-blur">
      {children}
    </div>
  );
}

// A bar with only its top corners rounded. The "other" segment stays square when a hazardous
// segment sits on top of it, so the stack reads as one bar.
function TopRounded({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  round,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  round: boolean;
}) {
  if (height <= 0 || width <= 0) return null;
  const r = round ? Math.min(7, width / 2, height) : 0;
  const d = `M${x},${y + height} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} Z`;
  return <path d={d} fill={fill} />;
}

// Round numbers on a log axis: one tick per power of ten, and the axis runs to the next power
// either side, so no point is ever drawn on (or cut off by) the edge of the plot.
function decades(values: number[]) {
  const low = Math.floor(Math.log10(Math.min(...values)));
  let high = Math.ceil(Math.log10(Math.max(...values)));
  if (high === low) high += 1;
  const ticks = Array.from({ length: high - low + 1 }, (_, i) => Number((10 ** (low + i)).toPrecision(1)));
  return { ticks, domain: [ticks[0], ticks[ticks.length - 1]] as [number, number] };
}

function Dot({ cx, cy, color, size }: { cx?: number; cy?: number; color: string; size: number }) {
  if (cx === undefined || cy === undefined) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={size * 2.2} fill={color} opacity={0.16} />
      <circle cx={cx} cy={cy} r={size} fill={color} stroke="#fff" strokeOpacity={0.55} strokeWidth={1} />
    </g>
  );
}

/* ---------- Charts ---------- */

export default function AsteroidCharts({ days, points }: { days: DayCount[]; points: ScatterPoint[] }) {
  const others = points.filter((p) => !p.hazardous);
  const hazardous = points.filter((p) => p.hazardous);

  const totalOther = days.reduce((sum, d) => sum + d.other, 0);
  const totalHazardous = days.reduce((sum, d) => sum + d.hazardous, 0);
  const busiest = days.reduce<DayCount | undefined>(
    (best, d) => (!best || d.other + d.hazardous > best.other + best.hazardous ? d : best),
    undefined,
  );

  const sizeAxis = points.length ? decades(points.map((p) => p.sizeM)) : undefined;
  const lunarAxis = points.length ? decades(points.map((p) => p.lunar)) : undefined;
  const moonVisible = lunarAxis !== undefined && lunarAxis.domain[0] <= 1 && lunarAxis.domain[1] >= 1;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <GlowCard className="hud-corners p-5">
        <figure>
          <figcaption>
            <span className="eyebrow !text-[0.65rem]">
              {busiest ? `Busiest day: ${formatDay(busiest.date)}` : "Per day"}
            </span>
            <span className="mt-1 block font-display text-sm font-semibold tracking-wide text-white">
              Close approaches per day
            </span>
            <Legend
              items={[
                { label: "Other", color: VIOLET, count: totalOther },
                { label: "Potentially hazardous", color: ROSE, count: totalHazardous },
              ]}
            />
          </figcaption>

          <div role="img" aria-label="Stacked bar chart of how many asteroids pass Earth each day" className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%" initialDimension={initial}>
              <BarChart data={days} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="bar-violet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c4b5fd" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                  <linearGradient id="bar-rose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fda4af" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDay} tick={TICK} tickLine={false} axisLine={{ stroke: GRID }} tickMargin={8} />
                <YAxis tick={TICK} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "#a78bfa", fillOpacity: 0.1 }}
                  content={({ active, payload }) => {
                    const day = active && payload?.length ? (payload[0].payload as DayCount) : undefined;
                    if (!day) return null;
                    return (
                      <TooltipBox>
                        <p className="font-display text-xs tracking-wide text-violet-200">{formatDay(day.date)}</p>
                        <p className="mt-1 text-lg font-bold text-white">{day.other + day.hazardous} objects</p>
                        <p className="text-violet-200/80">{day.other} other</p>
                        {day.hazardous > 0 && <p className="text-rose-300">{day.hazardous} potentially hazardous</p>}
                      </TooltipBox>
                    );
                  }}
                />
                <Bar
                  dataKey="other"
                  stackId="a"
                  maxBarSize={38}
                  fill="url(#bar-violet)"
                  shape={(props: { x?: number; y?: number; width?: number; height?: number; payload?: DayCount }) => (
                    <TopRounded {...props} fill="url(#bar-violet)" round={props.payload?.hazardous === 0} />
                  )}
                />
                <Bar
                  dataKey="hazardous"
                  stackId="a"
                  maxBarSize={38}
                  fill="url(#bar-rose)"
                  shape={(props: { x?: number; y?: number; width?: number; height?: number }) => (
                    <TopRounded {...props} fill="url(#bar-rose)" round />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
      </GlowCard>

      <GlowCard className="hud-corners p-5">
        <figure>
          <figcaption>
            <span className="eyebrow !text-[0.65rem]">Bigger ↗ &middot; Farther ↑</span>
            <span className="mt-1 block font-display text-sm font-semibold tracking-wide text-white">
              Size against miss distance
            </span>
            <Legend
              items={[
                { label: "Other", color: VIOLET, count: others.length },
                { label: "Potentially hazardous", color: ROSE, count: hazardous.length },
              ]}
            />
          </figcaption>

          <div
            role="img"
            aria-label="Scatter chart of asteroid size against miss distance, both on log scales"
            className="mt-4 h-72"
          >
            {sizeAxis && lunarAxis && (
              <ResponsiveContainer width="100%" height="100%" initialDimension={initial}>
                <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={GRID} strokeDasharray="3 5" />
                  <XAxis
                    type="number"
                    dataKey="sizeM"
                    name="Size"
                    scale="log"
                    domain={sizeAxis.domain}
                    ticks={sizeAxis.ticks}
                    tickFormatter={formatSize}
                    tick={TICK}
                    tickLine={false}
                    axisLine={{ stroke: GRID }}
                    tickMargin={8}
                  />
                  <YAxis
                    type="number"
                    dataKey="lunar"
                    name="Miss distance"
                    scale="log"
                    domain={lunarAxis.domain}
                    ticks={lunarAxis.ticks}
                    tickFormatter={formatLunar}
                    tick={TICK}
                    tickLine={false}
                    axisLine={false}
                    width={62}
                  />
                  <ZAxis range={[70, 70]} />
                  {moonVisible && (
                    <ReferenceLine
                      y={1}
                      stroke={FUCHSIA}
                      strokeDasharray="4 4"
                      strokeOpacity={0.6}
                      label={{ value: "Moon's distance", position: "insideTopRight", fill: FUCHSIA, fontSize: 11 }}
                    />
                  )}
                  <Tooltip
                    cursor={{ stroke: VIOLET, strokeOpacity: 0.4, strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      const point = active && payload?.length ? (payload[0].payload as ScatterPoint) : undefined;
                      if (!point) return null;
                      return (
                        <TooltipBox>
                          <p className="font-display text-xs tracking-wide text-white">{point.name}</p>
                          <p className="mt-1 text-violet-200/80">{whole.format(point.sizeM)} m wide</p>
                          <p className="text-violet-200/80">{point.lunar.toFixed(1)} Moon distances away</p>
                          {point.hazardous && <p className="text-rose-300">Potentially hazardous</p>}
                        </TooltipBox>
                      );
                    }}
                  />
                  <Scatter
                    data={others}
                    shape={(props: { cx?: number; cy?: number }) => <Dot {...props} color={VIOLET} size={4.5} />}
                  />
                  <Scatter
                    data={hazardous}
                    shape={(props: { cx?: number; cy?: number }) => <Dot {...props} color={ROSE} size={5.5} />}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </figure>
      </GlowCard>
    </div>
  );
}
