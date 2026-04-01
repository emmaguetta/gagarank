"use client";

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

  return (
    <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl backdrop-saturate-150 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="w-full px-6 flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-bold text-white mr-auto" style={{ fontFamily: "var(--font-still-time)" }}>
          GagaRank
        </Link>
        <div className="flex gap-1">
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
      </div>
    </nav>
  );
}
