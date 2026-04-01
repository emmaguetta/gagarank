import type { Metadata } from "next";
import { Merriweather, Playfair_Display, Oswald } from "next/font/google";
import localFont from "next/font/local";
import { NavBar } from "@/components/layout/nav-bar";
import { LazyPageBackground } from "@/components/backgrounds/lazy-page-background";
import "./globals.css";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const stillTime = localFont({
  src: "../fonts/StillTimeV2.ttf",
  variable: "--font-still-time",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gaga Rank | Rank Lady Gaga's Songs",
  description:
    "Rank all of Lady Gaga's songs by picking your favorite between two tracks. Discover your personal ranking and the community's.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${merriweather.variable} ${playfair.variable} ${oswald.variable} ${stillTime.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-merriweather bg-background text-foreground overflow-x-hidden">
        <NavBar />
        <LazyPageBackground />
        <main className="flex-1 pt-14 sm:pt-16">{children}</main>
      </body>
    </html>
  );
}
