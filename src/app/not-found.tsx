import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-5 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-raised text-accent">
        <Compass className="h-5 w-5" />
      </div>
      <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">404</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">This page is not in the blueprint.</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        The project may have been deleted, or the link points to a page that does not exist.
      </p>
      <Link href="/" className={buttonClass("primary", "md", "mt-5")}>
        Back to projects
      </Link>
    </div>
  );
}
