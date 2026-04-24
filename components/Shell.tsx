import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { SideNav } from "./SideNav";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex flex-1">
        <SideNav />
        <main className="flex-1 p-4 md:px-8 md:py-5 max-w-[1500px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
      <div>
        <h1 className="ph-h1">{title}</h1>
        {subtitle && (
          <p className="text-sm text-ph-muted mt-1 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
