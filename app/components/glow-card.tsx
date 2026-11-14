"use client";

import type { MouseEvent, ReactNode } from "react";

// A card whose spotlight follows the cursor. The position is written straight to CSS variables,
// so moving the mouse never re-renders React.
export default function GlowCard({ className = "", children }: { className?: string; children: ReactNode }) {
  function track(event: MouseEvent<HTMLDivElement>) {
    const card = event.currentTarget;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - box.left}px`);
    card.style.setProperty("--my", `${event.clientY - box.top}px`);
  }

  return (
    <div onMouseMove={track} className={`panel panel-hover ${className}`}>
      {children}
    </div>
  );
}
