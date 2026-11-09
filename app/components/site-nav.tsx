import Link from "next/link";

const links = [
  { id: "apod", href: "/", label: "Picture of the day" },
  { id: "asteroids", href: "/asteroids", label: "Asteroids" },
  { id: "iss", href: "/iss", label: "ISS tracker" },
] as const;

export default function SiteNav({ current }: { current: (typeof links)[number]["id"] }) {
  return (
    <nav aria-label="Dashboard sections" className="mb-10 border-b border-slate-800 pb-4">
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
        {links.map((link) => (
          <li key={link.id}>
            <Link
              href={link.href}
              aria-current={current === link.id ? "page" : undefined}
              className={current === link.id ? "text-violet-300" : "hover:text-white"}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
