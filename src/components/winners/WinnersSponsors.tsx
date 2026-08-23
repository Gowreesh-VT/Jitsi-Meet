"use client";

import React from "react";
import Image from "next/image";

const SPONSORS = [
  {
    name: "TrainSec",
    role: "Official Sponsor",
    logo: "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEHC2fKst1ltk8sCVhvgKTpUzQyXnafuj70O5i",
    badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
    href: "https://trainsec.net/",
  },
  {
    name: "HackerRank",
    role: "Official Sponsor",
    logo: "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEv3e6MOhWmy6tpuiexQX81z0fGaEJbT52MDPl",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    href: "https://www.hackerrank.com/",
  },
  {
    name: "Google Gemini",
    role: "Official Sponsor",
    logo: "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEFoJjaslA09oihcYfavCU8QVN7Oswmu3e6j14",
    badgeBg: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    href: "https://gemini.google.com/",
  },
];

export function WinnersSponsors() {
  return (
    <section className="w-full max-w-5xl mx-auto my-12 sm:my-16 px-4 relative z-40">
      {/* Title Header - Crisp, High-Contrast Sans-Serif Typography */}
      <div className="flex items-center justify-center gap-4 mb-8 text-center">
        <span className="h-0.5 w-12 bg-linear-to-r from-transparent to-[#ffafd5]" />
        <h2 className="text-sm sm:text-base font-black font-sans uppercase tracking-[0.25em] text-white drop-shadow-md">
          Official Event Sponsors
        </h2>
        <span className="h-0.5 w-12 bg-linear-to-l from-transparent to-[#ffafd5]" />
      </div>

      {/* 3 Sponsor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
        {SPONSORS.map((sponsor) => {
          const cardContent = (
            <>
              {/* Dark crisp container for the logo image */}
              <div className="w-full h-24 sm:h-28 flex items-center justify-center rounded-xl bg-black/90 border border-white/10 p-4 transition-transform duration-300 group-hover:scale-[1.03]">
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                  width={280}
                  height={100}
                  className="max-h-full max-w-full object-contain filter contrast-125"
                />
              </div>

              {/* Sponsor Text & Badge - Crisp Sans-Serif font */}
              <div className="mt-4 text-center w-full flex flex-col items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-extrabold font-sans tracking-wider text-white uppercase">
                  {sponsor.name}
                </h3>
                <span className={`text-[10px] sm:text-xs font-bold font-sans px-3 py-1 rounded-full border uppercase tracking-widest ${sponsor.badgeBg}`}>
                  {sponsor.role}
                </span>
              </div>
            </>
          );

          if (sponsor.href) {
            return (
              <a
                key={sponsor.name}
                href={sponsor.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/90 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/35 hover:bg-zinc-900/90 shadow-xl flex flex-col items-center justify-between cursor-pointer"
              >
                {cardContent}
              </a>
            );
          }

          return (
            <div
              key={sponsor.name}
              className="group relative overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/90 p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/35 hover:bg-zinc-900/90 shadow-xl flex flex-col items-center justify-between"
            >
              {cardContent}
            </div>
          );
        })}
      </div>
    </section>
  );
}
