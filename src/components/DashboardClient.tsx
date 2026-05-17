"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEventWindow, getMeetUrl, getStatus, type SerializedEvent } from "@/lib/events";

type EventStatusData = {
  isLive: boolean;
  statusOverride: "auto" | "live" | "ended";
  startTime: string;
  endTime: string;
  roomName: string;
  isRegistered: boolean;
  isLoggedIn: boolean;
};

export default function DashboardClient({ initialEvents }: { initialEvents: SerializedEvent[] }) {
  const [events, setEvents] = React.useState<SerializedEvent[]>(initialEvents);
  const [statuses, setStatuses] = React.useState<Record<string, EventStatusData>>({});

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
    events.forEach((e) => fetchStatus(e._id));
    const iv = window.setInterval(() => {
      events.forEach((e) => fetchStatus(e._id));
    }, 15_000);
    return () => window.clearInterval(iv);
  }, [events, fetchStatus]);

  const live = events.filter((event) => getStatus(event.startTime, event.endTime, event.statusOverride) === "Live");
  const upcoming = events.filter((event) => getStatus(event.startTime, event.endTime, event.statusOverride) === "Upcoming");
  const past = events.filter((event) => getStatus(event.startTime, event.endTime, event.statusOverride) === "Ended");

  function DashboardSection({ title, list }: { title: string; list: SerializedEvent[] }) {
    if (list.length === 0) return null;
    return (
      <section className="event-section">
        <div className="mb-6 border-l-4 border-[#79f2a1] pl-6">
          <h2 className="section-title">{title}</h2>
        </div>
        <div className="event-grid">
          {list.map((event) => {
            const status = getStatus(event.startTime, event.endTime, event.statusOverride);
            const isMeetOpen = statuses[event._id]?.isLive ?? event.isLive;
            const { date, time } = formatEventWindow(event.startTime, event.endTime);

            return (
              <article key={event._id} className="event-card">
                <div className="event-card__content">
                  <div className="event-card__topline">
                    <span className="tag tag-primary">{event.domain}</span>
                    <Badge variant={status === "Live" ? "success" : status === "Ended" ? "muted" : "secondary"}>{status}</Badge>
                  </div>
                  <h3 className="event-card__title mt-3">{event.title}</h3>
                  <p className="mt-3 text-sm text-arcade-muted">{date} · {time}</p>
                </div>
                <div className="event-card__footer mt-6">
                  {status === "Live" && isMeetOpen ? (
                    <Button asChild className="w-full join-now-button">
                      <a href={getMeetUrl(event.roomName)} target="_blank" rel="noreferrer">
                        JOIN MEET <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full">
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

  return (
    <div className="space-y-12">
      <DashboardSection title="LIVE" list={live} />
      <DashboardSection title="UPCOMING" list={upcoming} />
      <DashboardSection title="PAST" list={past} />
    </div>
  );
}
