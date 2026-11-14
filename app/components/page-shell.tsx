import type { ReactNode } from "react";
import SiteNav, { type NavId } from "./site-nav";

type Props = {
  current: NavId;
  title: string;
  description?: ReactNode;
  narrow?: boolean;
  children: ReactNode;
};

export default function PageShell({ current, title, description, narrow = false, children }: Props) {
  return (
    <div className="min-h-screen">
      <main className={`mx-auto px-6 py-10 ${narrow ? "max-w-4xl" : "max-w-5xl"}`}>
        <SiteNav current={current} />
        <header className="mb-12">
          <p className="eyebrow">Space dashboard</p>
          <h1 className="page-title mt-3 text-3xl sm:text-5xl">{title}</h1>
          {description && <p className="mt-5 max-w-2xl leading-relaxed text-violet-100/80">{description}</p>}
        </header>
        {children}
      </main>
    </div>
  );
}
