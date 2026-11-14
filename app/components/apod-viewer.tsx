"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

const MIN_WIDTH = 260;
const MIN_HEIGHT = 220;
const MAX_HEIGHT = 1400;
const ASIDE_MIN = 300; // the info card never gets squeezed below this
const GAP = 24;
const KEY_STEP = 24;

type Size = { width: number; height: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// The picture sits in a frame you can drag larger or smaller from its bottom-right corner
// (mouse, touch or arrow keys; double-click resets). The info card sits beside it, and drops below
// the picture on narrow screens.
export default function ApodViewer({ media, aside }: { media: ReactNode; aside: ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  // Track the frame's real height so the info card can match it and scroll if its text is longer.
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setFrameHeight(Math.round(element.getBoundingClientRect().height)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The widest the frame may be: the whole row on narrow screens, otherwise leave room for the info card.
  function maxWidth() {
    const available = row.current?.clientWidth ?? 0;
    const sideBySide = available >= MIN_WIDTH + GAP + ASIDE_MIN;
    return sideBySide ? available - GAP - ASIDE_MIN : available;
  }

  function resizeTo(width: number, height: number) {
    setSize({
      width: clamp(width, Math.min(MIN_WIDTH, maxWidth()), maxWidth()),
      height: clamp(height, MIN_HEIGHT, MAX_HEIGHT),
    });
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    event.preventDefault(); // no text selection while dragging
    drag.current = { x: event.clientX, y: event.clientY, width: box.width, height: box.height };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const start = drag.current;
    if (!start) return;
    resizeTo(start.width + event.clientX - start.x, start.height + event.clientY - start.y);
  }

  function onPointerUp() {
    drag.current = null;
    setDragging(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    const step = event.shiftKey ? KEY_STEP * 4 : KEY_STEP;
    const moves: Record<string, [number, number]> = {
      ArrowRight: [step, 0],
      ArrowLeft: [-step, 0],
      ArrowDown: [0, step],
      ArrowUp: [0, -step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    resizeTo(box.width + move[0], box.height + move[1]);
  }

  // Until the first resize the frame uses a responsive default; afterwards it uses the exact pixels.
  const frameStyle: CSSProperties | undefined = size ? { width: size.width, height: size.height } : undefined;
  const rowStyle = (frameHeight ? { "--frame-h": `${frameHeight}px` } : undefined) as CSSProperties | undefined;

  return (
    <div ref={row} style={rowStyle} className="flex flex-wrap items-start gap-6">
      <div
        ref={frame}
        style={frameStyle}
        className={`hud-corners panel relative max-w-full shrink-0 p-2 ${
          size ? "" : "aspect-[4/3] w-full lg:w-[62%]"
        } ${dragging ? "select-none" : ""}`}
      >
        <div className="relative size-full overflow-hidden rounded-xl">{media}</div>

        <button
          type="button"
          aria-label="Resize the picture. Drag, or use the arrow keys. Double-click to reset."
          title="Drag to resize · double-click to reset"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onDoubleClick={() => setSize(null)}
          className={`group/grip absolute right-1 bottom-1 z-[1200] grid size-9 touch-none place-items-center rounded-lg border bg-violet-950/70 text-violet-200 backdrop-blur transition-all hover:scale-110 hover:border-violet-300/70 hover:bg-violet-700/60 hover:text-white hover:shadow-[0_0_18px_-2px_rgb(139_92_246/0.9)] ${
            dragging ? "scale-110 border-fuchsia-300/80 bg-violet-700/60 text-white" : "border-violet-400/30"
          } cursor-nwse-resize`}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            <path d="M14 6 6 14M14 10l-4 4M14 2 2 14" />
          </svg>
        </button>
      </div>

      <div className="min-w-[18.75rem] flex-1 lg:max-h-[var(--frame-h)] lg:overflow-y-auto">{aside}</div>
    </div>
  );
}
