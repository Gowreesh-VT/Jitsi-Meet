import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Microsoft Innovations Club Meet Portal",
  description: "Manage and join Microsoft Innovations Club Jitsi Meet sessions.",
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
    <html lang="en" suppressHydrationWarning className={cn("dark h-full antialiased", "font-sans", geist.variable)}>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <Providers session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
