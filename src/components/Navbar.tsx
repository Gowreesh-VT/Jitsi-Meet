"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [studentCount, setStudentCount] = useState<number | null>(null);

  const getHref = (hash: string) => `/#${hash.replace(/^#/, "")}`;

  const closeMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && typeof data.totalUsers === "number") {
          setStudentCount(data.totalUsers);
        }
      } catch {
        // Ignore transient network errors.
      }
    };

    loadStats();
    const interval = window.setInterval(loadStats, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const displayStudentCount = (count: number | null) => {
    if (count === null) return "...";
    if (count < 100) return `${count}+`;
    const rounded = Math.floor(count / 100) * 100;
    return `${rounded}+`;
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="w-full border-b border-white/10 bg-[#ffafd5]/10 px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 sm:text-[13px]">
        {displayStudentCount(studentCount)} students joined across 16 different institutions. Lock your spot now.
      </div>
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 font-semibold" onClick={closeMenu}>
          <span className="flex h-10 w-12 items-center justify-center rounded-md bg-white/80 p-1.5 shadow-sm ring-1 ring-border dark:bg-white/10">
            <Image src="/mic-logo.png" alt="Microsoft Innovations Club logo" width={44} height={32} priority />
          </span>
          <span className="hidden min-[791px]:inline">Microsoft Innovations Club</span>
          <span className="inline min-[791px]:hidden">MIC</span>
        </Link>
        <nav className="flex items-center gap-2">
          {status === "authenticated" ? (
            <Link id="dashboard-section" href="/dashboard" className="hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex">
              Dashboard
            </Link>
          ) : null}
          <Link href={getHref("#schedule")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            Schedule
          </Link>
          <Link href={getHref("#organizers")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            Organizers
          </Link>
          <Link href={getHref("#certificates")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            Certificates
          </Link>
          <Link href={getHref("#faqs")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            FAQs
          </Link>
          {session?.user.role === "admin" ? (
            <Link href="/admin" className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
          
          <div id="signin-trigger" className="flex items-center gap-2">
            <div className="hidden sm:block">
              {status === "authenticated" ? (
                <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              ) : (
                <Button onClick={() => signIn("google", { callbackUrl: "/#schedule" })}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in
                </Button>
              )}
            </div>

            <button
              className="sm:hidden p-2 text-foreground focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </div>

      {isMobileMenuOpen && (
        <div className="sm:hidden absolute top-16 left-0 right-0 border-b border-white/10 bg-[#0a0a0f] p-4 shadow-xl flex flex-col gap-2">
          {status === "authenticated" && (
            <Link href="/dashboard" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-white/10 border-b border-white/5" onClick={closeMenu}>
              Dashboard
            </Link>
          )}
          <Link href={getHref("#schedule")} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-white/10 border-b border-white/5" onClick={closeMenu}>
            Schedule
          </Link>
          <Link href={getHref("#organizers")} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-white/10 border-b border-white/5" onClick={closeMenu}>
            Organizers
          </Link>
          <Link href={getHref("#certificates")} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-white/10 border-b border-white/5" onClick={closeMenu}>
            Certificates
          </Link>
          <Link href={getHref("#faqs")} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-white/10 border-b border-white/5" onClick={closeMenu}>
            FAQs
          </Link>
          {session?.user.role === "admin" && (
            <Link href="/admin" className="rounded-md px-3 py-3 text-sm font-medium hover:bg-white/10 border-b border-white/5 flex items-center gap-2" onClick={closeMenu}>
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
          
          <div className="mt-2 pt-2">
            {status === "authenticated" ? (
              <Button variant="outline" onClick={() => { closeMenu(); signOut({ callbackUrl: "/" }); }} className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            ) : (
              <Button onClick={() => { closeMenu(); signIn("google", { callbackUrl: "/#schedule" }); }} className="w-full justify-start">
                <LogIn className="h-4 w-4 mr-2" />
                Sign in
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
