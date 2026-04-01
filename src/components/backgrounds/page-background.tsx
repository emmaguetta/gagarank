"use client";

import { usePathname } from "next/navigation";
import Grainient from "@/components/backgrounds/grainient-bg";

export function PageBackground() {
  const pathname = usePathname();

  // Don't show on home page — it has its own Iridescence background
  if (pathname === "/") return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
      <Grainient
        color1="#FF69B4"
        color2="#8B5CF6"
        color3="#1a0a2e"
        timeSpeed={0.15}
        grainAmount={0.08}
        contrast={1.3}
        saturation={0.9}
      />
    </div>
  );
}
