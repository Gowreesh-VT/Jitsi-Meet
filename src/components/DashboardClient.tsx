"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEventWindow, getMeetUrl, getStatus, type SerializedEvent, type Domain } from "@/lib/events";
import { MeetEmbed } from "./MeetEmbed";

type EventStatusData = {
  isLive: boolean;
  statusOverride: "auto" | "live" | "ended";
  startTime: string;
  endTime: string;
  roomName: string;
  isRegistered: boolean;
  isLoggedIn: boolean;
};

export const domainMeta: Record<Domain, { label: string; accent: string }> = {
  "AI/ML": { label: "AI & Machine Learning", accent: "cyan" },
  CP: { label: "Competitive Programming", accent: "yellow" },
  "UI/UX": { label: "UI/UX Design", accent: "pink" },
  CyberSec: { label: "Cyber Security", accent: "purple" },
  Dev: { label: "Software Development", accent: "blue" },
  Hackathon: { label: "Hackathons", accent: "green" },
  MLSA: { label: "Microsoft Learn Student Ambassadors", accent: "blue" },
};

export const accentColors: Record<string, { border: string; text: string; tag: string; heading: string; glow: string }> = {
  cyan: { border: "#00e5ff", text: "text-[#00e5ff]", tag: "tag-cyan", heading: "#00e5ff", glow: "rgba(0,229,255,0.15)" },
  yellow: { border: "#fbbc04", text: "text-[#fbbc04]", tag: "tag-yellow", heading: "#fbbc04", glow: "rgba(251,188,4,0.15)" },
  pink: { border: "#ffafd5", text: "text-[#ffafd5]", tag: "tag-pink", heading: "#ffafd5", glow: "rgba(255,175,213,0.15)" },
  purple: { border: "#bd5eff", text: "text-[#bd5eff]", tag: "tag-purple", heading: "#bd5eff", glow: "rgba(189,94,255,0.15)" },
  blue: { border: "#38b6ff", text: "text-[#38b6ff]", tag: "tag-blue", heading: "#38b6ff", glow: "rgba(56,182,255,0.15)" },
  green: { border: "#79f2a1", text: "text-[#79f2a1]", tag: "tag-green", heading: "#79f2a1", glow: "rgba(121,242,161,0.15)" },
};

function DashboardSection({
  title,
  list,
  statuses,
  onJoin,
}: {
  title: string;
  list: SerializedEvent[];
  statuses: Record<string, EventStatusData>;
  onJoin: (event: SerializedEvent) => void;
}) {
  if (list.length === 0) return null;

  return (
    <section className="event-section">
      <div className="mb-6 border-l-4 border-[#ffafd5] pl-6">
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="event-grid">
        {list.map((event) => {
          const status = getStatus(event.startTime, event.endTime, event.statusOverride);
          const isMeetOpen = statuses[event._id]?.isLive ?? event.isLive;
          const { date, time } = formatEventWindow(event.startTime, event.endTime);
          const meta = domainMeta[event.domain];
          const colors = accentColors[meta.accent];

          return (
            <article 
              key={event._id} 
              className="event-card transition-all duration-300 hover:-translate-y-1"
              style={{
                border: `2px solid ${colors.border}`,
                boxShadow: `0 0 20px ${colors.glow}`,
                background: "rgba(18, 19, 27, 0.92)",
              }}
            >
              <div className="event-card__content">
                <div className="event-card__topline">
                  <span className={`tag ${colors.tag}`}>{event.domain}</span>
                  <Badge variant={status === "Live" ? "success" : status === "Ended" ? "muted" : "secondary"}>{status}</Badge>
                </div>
                <h3 className={`event-card__title mt-3 font-bold ${colors.text}`}>{event.title}</h3>
                <p className="mt-3 text-sm text-arcade-muted">
                  {date} · {time}
                </p>
              </div>
              <div className="event-card__footer mt-6">
                {status === "Live" && isMeetOpen ? (
                  <Button onClick={() => onJoin(event)} className="w-full gap-2 font-black tracking-widest" style={{ background: colors.border, color: meta.accent === "yellow" ? "#1a0e00" : "#000", border: "none" }}>
                    JOIN MEET <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full font-black tracking-widest hover:text-white" style={{ borderColor: colors.border, color: colors.border }}>
                    <Link href={`/events/${event._id}`}>VIEW DETAILS</Link>
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function DashboardClient({ initialEvents }: { initialEvents: SerializedEvent[] }) {
  const [statuses, setStatuses] = React.useState<Record<string, EventStatusData>>({});
  const [activeMeet, setActiveMeet] = React.useState<{ eventId: string; meetUrl: string } | null>(null);

  const handleJoin = React.useCallback((event: SerializedEvent) => {
    const meetUrl = getMeetUrl(event.roomName);
    setActiveMeet({ eventId: event._id, meetUrl });
    fetch(`/api/events/${event._id}/meet/join`, { method: "POST" }).catch(console.error);
  }, []);

  const fetchStatus = React.useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/status`);
      if (!res.ok) return;
      const data = await res.json();
      setStatuses((prev) => ({ ...prev, [eventId]: data }));
    } catch (err) {
      console.error("Failed to fetch status", err);
    }
  }, []);

  React.useEffect(() => {
    // initial fetch for all events
    initialEvents.forEach((e) => fetchStatus(e._id));
    const iv = window.setInterval(() => {
      initialEvents.forEach((e) => fetchStatus(e._id));
    }, 15_000);
    return () => window.clearInterval(iv);
  }, [fetchStatus, initialEvents]);

  return (
    <div className="space-y-12">
      <DashboardSection
        title="LIVE"
        list={initialEvents.filter((event) => getStatus(event.startTime, event.endTime, event.statusOverride) === "Live")}
        statuses={statuses}
        onJoin={handleJoin}
      />
      <DashboardSection
        title="UPCOMING"
        list={initialEvents.filter((event) => getStatus(event.startTime, event.endTime, event.statusOverride) === "Upcoming")}
        statuses={statuses}
        onJoin={handleJoin}
      />
      <DashboardSection
        title="PAST"
        list={initialEvents.filter((event) => getStatus(event.startTime, event.endTime, event.statusOverride) === "Ended")}
        statuses={statuses}
        onJoin={handleJoin}
      />

      {activeMeet ? (
        <MeetEmbed
          embedUrl={activeMeet.meetUrl}
          onLeave={async () => {
            try {
              await fetch(`/api/events/${activeMeet.eventId}/meet/leave`, { method: "POST" });
            } catch (error) {
              console.error("Failed to log leave", error);
            }
            setActiveMeet(null);
          }}
        />
      ) : null}
    </div>
  );
}
