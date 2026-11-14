import Link from "next/link";
import { LuImage, LuOrbit, LuSatellite, LuTelescope } from "react-icons/lu";
import LogoMark from "./logo-mark";

const links = [
  { id: "apod", href: "/", label: "Picture of the day", Icon: LuImage },
  { id: "asteroids", href: "/asteroids", label: "Asteroids", Icon: LuOrbit },
  { id: "iss", href: "/iss", label: "ISS tracker", Icon: LuSatellite },
  { id: "sky", href: "/sky", label: "Sky tonight", Icon: LuTelescope },
] as const;

export type NavId = (typeof links)[number]["id"];

export default function SiteNav({ current }: { current: NavId }) {
  return (
    <nav aria-label="Dashboard sections" className="mb-12 flex flex-wrap items-center justify-between gap-4">
      <Link
        href="/"
        className="group flex items-center gap-2 font-display text-sm font-bold tracking-[0.25em] text-white uppercase"
      >
        <LogoMark className="size-6 drop-shadow-[0_0_8px_rgb(217_70_239/0.6)] transition-transform duration-300 group-hover:rotate-[18deg] group-hover:scale-110 motion-reduce:transition-none" />
        spaceboard
      </Link>
      <ul className="flex flex-wrap gap-2 rounded-full border border-violet-400/20 bg-violet-950/40 p-1.5 text-sm font-medium backdrop-blur">
        {links.map(({ id, href, label, Icon }) => (
          <li key={id}>
            <Link href={href} aria-current={current === id ? "page" : undefined} className="nav-link">
              <Icon aria-hidden="true" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
