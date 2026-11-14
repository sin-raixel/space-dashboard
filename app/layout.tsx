import type { Metadata } from "next";
import { Exo_2, Orbitron } from "next/font/google";
import "./globals.css";

// Orbitron is the sci-fi display face for headings and labels; Exo 2 keeps body text readable.
const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const exo = Exo_2({
  variable: "--font-exo",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Starboard", template: "%s | Starboard" },
  description: "Astronomy picture of the day, near-Earth asteroids, a live ISS tracker, and the constellations above you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${orbitron.variable} ${exo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
