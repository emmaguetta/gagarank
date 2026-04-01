"use client";

import dynamic from "next/dynamic";

const PageBackground = dynamic(
  () =>
    import("@/components/backgrounds/page-background").then(
      (m) => m.PageBackground
    ),
  { ssr: false }
);

export function LazyPageBackground() {
  return <PageBackground />;
}
