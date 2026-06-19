import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { dir, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jb" });

export const metadata: Metadata = {
  title: "ForgeEC — The autonomous growth OS for global commerce",
  description:
    "ForgeEC is an AI-powered E-commerce Growth Operating System: multi-channel ads, creative generation, attribution, and autonomous optimization — global-first and privacy-first.",
  openGraph: { title: "ForgeEC", description: "The autonomous growth OS for global commerce.", type: "website" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const localeCookie = jar.get("locale")?.value;
  const locale = isLocale(localeCookie) ? localeCookie : DEFAULT_LOCALE;
  const theme = jar.get("theme")?.value === "light" ? "light" : "dark";

  return (
    <html lang={locale} dir={dir(locale)} className={`${inter.variable} ${mono.variable} ${theme === "light" ? "light" : ""}`}>
      <body>{children}</body>
    </html>
  );
}
