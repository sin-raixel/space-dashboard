"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import { splitAtAntimeridian } from "../lib/iss-geo";
import type { IssPosition, TrailPoint } from "../lib/iss-types";

function Follow({ position, enabled }: { position: IssPosition | null; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (enabled && position) {
      map.setView([position.latitude, position.longitude], map.getZoom(), { animate: false });
    }
  }, [enabled, position, map]);
  return null;
}

export default function IssMap({
  position,
  trail,
  follow,
}: {
  position: IssPosition | null;
  trail: TrailPoint[];
  follow: boolean;
}) {
  return (
    <MapContainer
      center={position ? [position.latitude, position.longitude] : [0, 0]}
      zoom={2}
      minZoom={2}
      worldCopyJump
      scrollWheelZoom={false}
      className="h-[28rem] w-full rounded-2xl border border-violet-400/30 shadow-[0_0_50px_-12px_rgb(139_92_246/0.6)]"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
        className="iss-tiles"
      />
      {splitAtAntimeridian(trail).map((segment, index) => (
        <Polyline key={index} positions={segment} pathOptions={{ color: "#c084fc", weight: 2, opacity: 0.9 }} />
      ))}
      {position && (
        <CircleMarker
          center={[position.latitude, position.longitude]}
          radius={18}
          pathOptions={{ stroke: false, fillColor: "#a855f7", fillOpacity: 0.22 }}
        />
      )}
      {position && (
        <CircleMarker
          center={[position.latitude, position.longitude]}
          radius={9}
          pathOptions={{ color: "#ddd6fe", weight: 3, fillColor: "#7c3aed", fillOpacity: 0.95 }}
        />
      )}
      <Follow position={position} enabled={follow} />
    </MapContainer>
  );
}
