"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { type Session } from "next-auth";
import { ToastProvider } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children, session }: { children: React.ReactNode; session: Session | null }) {
  return (
    <SessionProvider session={session}>
      <SystemThemeProvider>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </SystemThemeProvider>
    </SessionProvider>
  );
}

function SystemThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return children;
}
