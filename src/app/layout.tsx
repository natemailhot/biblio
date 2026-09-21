import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { CloudLayer } from "@/components/CloudLayer";
import { AccountButton } from "@/components/AccountButton";
import { MenuButton } from "@/components/MenuButton";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ascend — Daily Bible Challenge",
  description:
    "A daily game for people who want to know the Bible more deeply — one surprising answer at a time.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-parchment text-ink">
        <CloudLayer />
        <MenuButton />
        <AccountButton />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
