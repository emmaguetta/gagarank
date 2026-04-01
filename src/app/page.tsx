"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Music, ArrowRight, Trophy } from "lucide-react";

const Iridescence = dynamic(
  () => import("@/components/backgrounds/iridescence-bg"),
  { ssr: false }
);

const ElectricBorder = dynamic(
  () => import("@/components/layout/electric-border"),
  { ssr: false }
);

export default function HomePage() {
  const [phase, setPhase] = useState<"splash" | "transition" | "done">("splash");

  useEffect(() => {
    if (sessionStorage.getItem("splash-done")) {
      setPhase("done");
      return;
    }

    document.body.style.overflow = "hidden";

    const t1 = setTimeout(() => setPhase("transition"), 1500);
    const t2 = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("splash-done", "1");
      document.body.style.overflow = "";
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = "";
    };
  }, []);

  const isSplash = phase === "splash";
  const showContent = phase !== "splash";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Iridescence animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-50 mix-blend-screen">
        <Iridescence
          color={[1.0, 0.3, 0.85]}
          speed={0.8}
          amplitude={0.1}
          mouseReact={false}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-6 sm:pt-8 pb-20">
        {/* Hero */}
        <div className="text-center max-w-3xl">
          {/* Single GagaRank title — animates from viewport center to normal position */}
          <div
            className="transition-all duration-[1400ms] ease-in-out"
            style={{
              transform: isSplash
                ? "translateY(calc(50vh - 13rem)) scale(1.4)"
                : "translateY(0) scale(1)",
            }}
          >
            <h1
              className="text-6xl sm:text-8xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-still-time)" }}
            >
              <span className="text-white">GagaRank</span>
            </h1>
          </div>

          {/* Rest of content — fades in + slides up after splash */}
          <div
            className="transition-all duration-[1200ms] ease-in-out"
            style={{
              opacity: showContent ? 1 : 0,
              transform: showContent ? "translateY(0)" : "translateY(30px)",
            }}
          >
            <p className="mt-14 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Pick your favorite between two Lady Gaga tracks.
            </p>
            <p className="mt-3 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Watch your personal ranking come to life.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/compare"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gaga-pink px-8 py-3.5 text-white font-semibold text-lg transition-all duration-200 hover:scale-[1.03] glow-pink hover:glow-pink-strong cursor-pointer"
              >
                <Music className="h-5 w-5" />
                Start Ranking
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/global"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gaga-purple/40 px-8 py-3.5 text-gaga-purple font-semibold transition-all duration-200 hover:bg-gaga-purple/10 hover:border-gaga-purple/60 cursor-pointer"
              >
                <Trophy className="h-5 w-5" />
                View Rankings
              </Link>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div
          className="mt-20 w-full max-w-4xl transition-all duration-[1200ms] ease-in-out delay-200"
          style={{
            opacity: showContent ? 1 : 0,
            transform: showContent ? "translateY(0)" : "translateY(40px)",
          }}
        >
          <h2 className="text-2xl sm:text-3xl font-normal text-center mb-10 uppercase tracking-wide" style={{ fontFamily: "var(--font-oswald)" }}>
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                step: "1",
                title: "Compare",
                desc: "Two Lady Gaga songs appear side by side",
              },
              {
                step: "2",
                title: "Choose",
                desc: "Click on the one you prefer",
              },
              {
                step: "3",
                title: "Discover",
                desc: "Your personal ranking builds up over time",
              },
            ].map((item) => (
              <ElectricBorder key={item.step} color="#FF69B4" speed={1.2} chaos={0.08} borderRadius={16} className="h-full">
                <div className="glass-card rounded-2xl p-7 text-center transition-all duration-200 cursor-default group h-full">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gaga-pink/10 text-gaga-pink text-2xl font-bold transition-colors duration-200 group-hover:bg-gaga-pink/20">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </ElectricBorder>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
