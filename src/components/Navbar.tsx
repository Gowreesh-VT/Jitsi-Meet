"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getHref = (hash: string) => (pathname === "/" ? hash : `/${hash}`);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 font-semibold" onClick={closeMenu}>
          <span className="flex h-10 w-12 items-center justify-center rounded-md bg-white/80 p-1.5 shadow-sm ring-1 ring-border dark:bg-white/10">
            <Image src="/mic-logo.png" alt="Microsoft Innovations Club logo" width={44} height={32} priority />
          </span>
          <span className="hidden sm:inline">Microsoft Innovations Club</span>
          <span className="sm:hidden">MIC</span>
        </Link>
        <nav className="flex items-center gap-2">
          {status === "authenticated" ? (
            <Link href="/dashboard" className="hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex">
              Dashboard
            </Link>
          ) : null}
          <Link href={getHref("#schedule")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            Schedule
          </Link>
          <Link href={getHref("#sponsors")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            Sponsors
          </Link>
          <Link href={getHref("#organizers")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            Organizers
          </Link>
          {session?.user.role === "admin" ? (
            <Link href="/admin" className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
          
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
          <Link href={getHref("#sponsors")} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-white/10 border-b border-white/5" onClick={closeMenu}>
            Sponsors
          </Link>
          <Link href={getHref("#organizers")} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-white/10 border-b border-white/5" onClick={closeMenu}>
            Organizers
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
