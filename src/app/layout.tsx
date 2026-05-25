import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { JetBrains_Mono, Press_Start_2P } from "next/font/google";
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-press-start",
});

export const metadata: Metadata = {
  title: "Microcraft By Microsoft Innovations Club",
  description: "Experience the future of tech empowerment with Microcraft by Microsoft Innovations Club.",
};

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning className={cn("dark h-full antialiased scroll-smooth scroll-pt-24", "font-sans", jetbrainsMono.variable, pressStart.variable)}>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <Providers session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
