import type { ReactNode } from "react";
import { SiteNavbar } from "./site-navbar";
import { SiteFooter } from "./site-footer";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-hero text-primary-foreground">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,oklch(0.82_0.16_85/0.25),transparent_45%),radial-gradient(circle_at_80%_60%,oklch(0.45_0.18_260/0.4),transparent_50%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
        {eyebrow && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-accent-gold">
            {eyebrow}
          </div>
        )}
        <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight lg:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-base opacity-85 lg:text-lg">{description}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}