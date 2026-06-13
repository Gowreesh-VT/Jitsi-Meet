"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Award, MapPin } from "lucide-react";
import { getISTParts, type SerializedEvent } from "@/lib/events";

interface HackathonsSectionProps {
  hackathons: SerializedEvent[];
}

function formatEventWindowRaw(startTime: Date | string, endTime: Date | string) {
  const startsAt = new Date(startTime);
  const endsAt = new Date(endTime);

  const startParts = getISTParts(startsAt);
  const endParts = getISTParts(endsAt);

  const date = `${startParts.weekday}, ${startParts.day} ${startParts.month} ${startParts.year}`;
  const time = `${startParts.hour}:${startParts.minute} - ${endParts.hour}:${endParts.minute}`;

  return { date, time };
}

const getDevfolioSlug = (title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("vibeathon")) {
    return process.env.NEXT_PUBLIC_DEVFOLIO_VIBEATHON_SLUG || "vibeathon";
  }
  if (lowerTitle.includes("arcnight")) {
    return process.env.NEXT_PUBLIC_DEVFOLIO_ARCNIGHT_SLUG || "microcarft-arcnight";
  }
  return lowerTitle.replace(/\s+/g, "-");
};

export function HackathonsSection({ hackathons }: HackathonsSectionProps) {

  return (
    <div id="hackathons" className="event-section w-full mt-24">
      <div className="mb-16 flex flex-col gap-3 text-center">
        <h2 className="section-title">HACKATHONS</h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-arcade-muted sm:text-base">
          Join our 24-hour build challenges, collaborate with teams, and build innovative solutions.
        </p>
      </div>

      <div className="space-y-32 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {hackathons.map((event, index) => {
          const { date, time } = formatEventWindowRaw(event.startTime, event.endTime);
          const isEven = index % 2 === 0;
          const slug = getDevfolioSlug(event.title);

          return (
            <div
              key={event._id}
              className={`hackathon-scroll-item flex flex-col gap-10 md:items-center ${
                isEven ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Poster Container */}
              <div className="w-full md:w-1/2 flex justify-center">
                <div className="group relative overflow-hidden rounded-2xl border-2 border-[#fbbc04]/40 bg-black/40 p-2 shadow-[0_0_30px_rgba(251,188,4,0.15)] transition-all duration-500 hover:border-[#fbbc04] hover:shadow-[0_0_45px_rgba(251,188,4,0.3)] w-full max-w-[440px] aspect-[4/5]">
                  {event.posterUrl ? (
                    <Image
                      src={event.posterUrl}
                      alt={`${event.title} Poster`}
                      fill
                      className="object-cover rounded-xl transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 440px"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-arcade-muted uppercase font-black tracking-widest text-xs">
                      Poster Offline
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none rounded-xl" />
                  <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1.5 tracking-widest rounded-md shadow-lg">
                    24H Sprint
                  </span>
                </div>
              </div>

              {/* Info Container */}
              <div className="w-full md:w-1/2 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[#fbbc04] font-black uppercase tracking-[0.25em] text-xs">
                      STAGE 0{index + 1}
                    </span>
                    <span className="h-px w-8 bg-white/20" />
                    <span className="text-arcade-muted font-bold text-xs uppercase tracking-widest">
                      Hackathon Track
                    </span>
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-wide text-white drop-shadow-[0_0_12px_rgba(251,188,4,0.3)]">
                    {event.title}
                  </h3>
                </div>

                <p className="text-arcade-muted text-sm sm:text-base leading-relaxed">
                  {event.description}
                </p>

                {/* Event Details Meta Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#fbbc04] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-arcade-muted">Date</p>
                      <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">{date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[#fbbc04] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-arcade-muted">Timing</p>
                      <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">{time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-[#fbbc04] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-arcade-muted">Prizes</p>
                      <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">
                        {event.title.toLowerCase().includes("vibeathon") ? "INR 1.5 Lakhs+" : "INR 2.5 Lakhs+"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#fbbc04] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-arcade-muted">Venue</p>
                      <p className="text-xs sm:text-sm font-semibold text-white mt-0.5">Online via Devfolio</p>
                    </div>
                  </div>
                </div>

                {/* Devfolio Registration Button Container */}
                <div className="pt-4 flex flex-col gap-2">
                  {event.title.toLowerCase().includes("vibeathon") ? (
                    <>
                      <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 border-white/10 text-arcade-muted font-black tracking-widest uppercase w-full max-w-[312px] text-center bg-white/5 cursor-not-allowed">
                        <span className="text-xs">TBA (To Be Announced)</span>
                      </div>
                      <p className="text-[10px] text-arcade-muted italic max-w-xs pl-1">
                        Registration details will be announced soon. Keep an eye on our social handles.
                      </p>
                    </>
                  ) : (
                    <>
                      <Button
                        rel="noopener noreferrer"
                        className="group inline-flex items-center bg-transparent w-full justify-center gap-3 px-6 py-3 rounded-xl border-2 border-[#3770FF] text-[#3770FF] hover:bg-[#3770FF] hover:text-white font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(55,112,255,0.15)] hover:shadow-[0_0_25px_rgba(55,112,255,0.4)] w-full max-w-[312px] text-center"
                      >
                        {/* <Image
                          src="https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEkjsjQpaHF5hwn3uCcqPm4ORVQJW8SBvgpL0A"
                          alt="Devfolio Logo"
                          width={18}
                          height={18}
                          className="object-contain transition-all duration-300 group-hover:brightness-0 group-hover:invert"
                        /> */}
                        <span className="text-sm font-bold">Event Live Now</span>
                      </Button>
                      <p className="text-[10px] text-arcade-muted italic max-w-xs pl-1">
                        Registrations are closed as the event is currently Live. Happy Hacking!
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
