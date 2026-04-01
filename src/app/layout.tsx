import type { Metadata } from "next";
import { Merriweather, Playfair_Display, Six_Caps, Oswald } from "next/font/google";
import localFont from "next/font/local";
import { NavBar } from "@/components/layout/nav-bar";
import { PageBackground } from "@/components/backgrounds/page-background";
import "./globals.css";

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sixCaps = Six_Caps({
  variable: "--font-six-caps",
  subsets: ["latin"],
  weight: ["400"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const stillTime = localFont({
  src: "../fonts/StillTimeV2.ttf",
  variable: "--font-still-time",
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
      className={`${merriweather.variable} ${playfair.variable} ${sixCaps.variable} ${oswald.variable} ${stillTime.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-merriweather bg-background text-foreground">
        <NavBar />
        <PageBackground />
        <main className="flex-1 pt-16">{children}</main>
      </body>
    </html>
  );
}
