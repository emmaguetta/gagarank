"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/compare", label: "Compare" },
  { href: "/ranking", label: "My Ranking" },
  { href: "/global", label: "Global Ranking" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close menu on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="w-full px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        <Link href="/" className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-still-time)" }}>
          GagaRank
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                  ? "text-gaga-pink bg-gaga-pink/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <div ref={menuRef} className="relative sm:hidden">
          <button
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-background/95 backdrop-blur-xl border border-white/10 shadow-2xl py-2 z-50">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block px-4 py-2.5 text-sm font-medium transition-colors",
                    pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                      ? "text-gaga-pink bg-gaga-pink/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
