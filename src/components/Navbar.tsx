"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const element = document.querySelector(id);
      if (element) {
        const headerOffset = 80; // Navbar height + extra padding
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
        window.history.pushState(null, "", `/${id}`);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur relative">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 font-semibold">
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
          <Link href="/#schedule" onClick={(e) => handleScroll(e, "#schedule")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            Schedule
          </Link>
          <Link href="/#sponsors" onClick={(e) => handleScroll(e, "#sponsors")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            Sponsors
          </Link>
          <Link href="/#organizers" onClick={(e) => handleScroll(e, "#organizers")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            Organizers
          </Link>
          <Link href="/#faqs" onClick={(e) => handleScroll(e, "#faqs")} className={cn("hidden rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex")}>
            FAQs
          </Link>
          {session?.user.role === "admin" ? (
            <Link href="/admin" className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent sm:inline-flex">
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
          {status === "authenticated" ? (
            <Button className="hidden sm:inline-flex" variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <Button className="hidden sm:inline-flex" onClick={() => signIn("google", { callbackUrl: "/#schedule" })}>
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          )}
          <Button
            className="sm:hidden"
            size="icon"
            variant="outline"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </nav>
      </div>
      <div
        id="mobile-nav"
        className={cn(
          "sm:hidden absolute left-0 right-0 top-16 px-4 pb-3",
          "transition-all duration-200 ease-out",
          isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none"
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2 rounded-2xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur">
          {status === "authenticated" ? (
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
          ) : null}
          <Link
            href="/#schedule"
            onClick={(e) => {
              handleScroll(e, "#schedule");
              setIsMenuOpen(false);
            }}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Schedule
          </Link>
          <Link
            href="/#sponsors"
            onClick={(e) => {
              handleScroll(e, "#sponsors");
              setIsMenuOpen(false);
            }}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Sponsors
          </Link>
          <Link
            href="/#organizers"
            onClick={(e) => {
              handleScroll(e, "#organizers");
              setIsMenuOpen(false);
            }}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            Organizers
          </Link>
          <Link
            href="/#faqs"
            onClick={(e) => {
              handleScroll(e, "#faqs");
              setIsMenuOpen(false);
            }}
            className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            FAQs
          </Link>
          {session?.user.role === "admin" ? (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
          {status === "authenticated" ? (
            <Button
              variant="outline"
              onClick={() => {
                setIsMenuOpen(false);
                signOut({ callbackUrl: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <Button
              onClick={() => {
                setIsMenuOpen(false);
                signIn("google", { callbackUrl: "/#schedule" });
              }}
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
