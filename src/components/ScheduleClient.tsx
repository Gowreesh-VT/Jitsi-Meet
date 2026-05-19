"use client";

import * as React from "react";
import { Calendar, ExternalLink, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RegisterDialog, type SavedProfile } from "@/components/RegisterDialog";
import { SymbolIcon } from "@/components/event-cards";
import { DOMAINS, formatEventWindow, getMeetUrl, getStatus, type Domain, type SerializedEvent } from "@/lib/events";
import { useSession, signIn } from "next-auth/react";
import { toast } from "sonner";

type Accent = "blue" | "green" | "red" | "yellow";

const accentColors = {
  blue: { heading: "#4285f4", border: "#4285f4", tag: "tag-blue", glow: "rgba(66,133,244,0.18)", text: "text-blue" },
  green: { heading: "#34a853", border: "#34a853", tag: "tag-green", glow: "rgba(52,168,83,0.18)", text: "text-green" },
  red: { heading: "#ea4335", border: "#ea4335", tag: "tag-red", glow: "rgba(234,67,53,0.18)", text: "text-red" },
  yellow: { heading: "#fbbc04", border: "#fbbc04", tag: "tag-yellow", glow: "rgba(251,188,4,0.18)", text: "text-yellow" },
} satisfies Record<Accent, { heading: string; border: string; tag: string; glow: string; text: string }>;

const domainMeta: Record<Domain, { label: string; accent: Accent; icon: string; metaIcon: string }> = {
  "AI/ML": { label: "AI/ML", accent: "green", icon: "smart_toy", metaIcon: "settings_input_component" },
  CP: { label: "Competitive Programming", accent: "yellow", icon: "terminal", metaIcon: "psychology" },
  "UI/UX": { label: "UI/UX", accent: "blue", icon: "brush", metaIcon: "architecture" },
  CyberSec: { label: "Cybersecurity", accent: "red", icon: "shield", metaIcon: "terminal" },
  Dev: { label: "Development", accent: "blue", icon: "code", metaIcon: "database" },
  Hackathon: { label: "Hackathons", accent: "yellow", icon: "military_tech", metaIcon: "emoji_events" },
};

interface EventStatusData {
  isLive: boolean;
  statusOverride: "auto" | "live" | "ended";
  startTime: string;
  endTime: string;
  roomName: string;
  isRegistered: boolean;
  isLoggedIn: boolean;
}

export function ScheduleClient({
  initialEvents,
  userRegistrations,
  isVitStudent,
}: {
  initialEvents: SerializedEvent[];
  userRegistrations: string[];
  isVitStudent: boolean;
}) {
  const [registrations, setRegistrations] = React.useState<string[]>(userRegistrations);
  const [selectedEvent, setSelectedEvent] = React.useState<SerializedEvent | null>(null);
  const [showRegister, setShowRegister] = React.useState(false);
  const [filter, setFilter] = React.useState<string>("All");
  const [eventStatuses, setEventStatuses] = React.useState<Record<string, EventStatusData>>({});
  const [savedProfile, setSavedProfile] = React.useState<SavedProfile | null>(null);
  const { data: session } = useSession();

  React.useEffect(() => {
    if (session?.user) {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => setSavedProfile(data.profile ?? null))
        .catch(() => setSavedProfile(null));
    }
  }, [session?.user]);

  const fetchStatus = React.useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/status`);
      if (res.ok) {
        const data = await res.json();
        setEventStatuses(prev => ({ ...prev, [eventId]: data }));
      }
    } catch (error) {
      console.error("Status check failed", error);
    }
  }, []);

  React.useEffect(() => {
    const checkAll = () => {
      initialEvents.forEach(event => {
        const currentStatus = getStatus(event.startTime, event.endTime, event.statusOverride);
        if (currentStatus !== "Ended") {
          fetchStatus(event._id);
        }
      });
    };

    checkAll();
    const interval = window.setInterval(checkAll, 15_000);
    return () => window.clearInterval(interval);
  }, [initialEvents, fetchStatus]);

  async function handleJoin(event: SerializedEvent) {
    if (!session) {
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    const statusData = eventStatuses[event._id];
    const isRegistered = statusData?.isRegistered ?? userRegistrations.includes(event._id);
    const isLive = statusData?.isLive ?? event.isLive;
    const statusOverride = statusData?.statusOverride ?? event.statusOverride;
    const currentStatus = getStatus(event.startTime, event.endTime, statusOverride);

    if (!isRegistered) {
      toast.error("Please register first");
      return;
    }

    if (currentStatus === "Upcoming") {
      toast.error(`Event hasn't started. Starts at ${new Date(event.startTime).toLocaleTimeString()}`);
      return;
    }

    if (currentStatus === "Ended") {
      toast.error("Session has ended");
      return;
    }

    if (currentStatus === "Live" && !isLive) {
      toast.info("Waiting for organizer to start");
      return;
    }

    // If we get here, it's joinable
    const meetUrl = getMeetUrl(event.roomName);
    window.open(meetUrl, '_blank');

    try {
      fetch(`/api/events/${event._id}/meet/join`, { method: "POST" }).catch(console.error);
    } catch (error) {
      console.error("Failed to log join", error);
    }
  }

  const filteredEvents = initialEvents.filter((event) => filter === "All" || event.domain === filter);
  const liveEvents = filteredEvents.filter((event) => getStatus(event.startTime, event.endTime, event.statusOverride) === "Live");
  const upcomingEvents = filteredEvents.filter((event) => getStatus(event.startTime, event.endTime, event.statusOverride) === "Upcoming");
  const pastEvents = filteredEvents.filter((event) => getStatus(event.startTime, event.endTime, event.statusOverride) === "Ended");

  function onRegisterSuccess(eventId: string) {
    setRegistrations((current) => Array.from(new Set([...current, eventId])));
    // Ensure local status cache reflects the new registration immediately
    setEventStatuses((prev) => ({
      ...prev,
      [eventId]: {
        ...(prev[eventId] ?? {}),
        isRegistered: true,
        isLoggedIn: true,
      } as EventStatusData,
    }));
    setShowRegister(false);
  }

  return (
    <div className="space-y-16">
      <div className="mb-12 flex justify-center">
        <div className="flex flex-wrap justify-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
          {["All", ...DOMAINS].map((domain) => (
            <button
              key={domain}
              onClick={() => setFilter(domain)}
              className={`rounded-lg px-4 py-2 text-xs font-black tracking-widest transition-all ${
                filter === domain
                  ? "bg-[#ffafd5] text-black shadow-[0_0_15px_rgba(255,175,213,0.4)]"
                  : "text-arcade-muted hover:bg-white/5 hover:text-white"
              }`}
            >
              {domain.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-24">
        <LiveEventSection 
          events={liveEvents} 
          registrations={registrations} 
          onCardClick={setSelectedEvent}
          onJoin={handleJoin}
          eventStatuses={eventStatuses}
        />
        <UpcomingEventsSection events={upcomingEvents} onCardClick={setSelectedEvent} />
        <PastEventsSection events={pastEvents} onCardClick={setSelectedEvent} />
      </div>

      {selectedEvent ? (
        <EventPosterModal
          event={selectedEvent}
          isRegistered={registrations.includes(selectedEvent._id)}
          isVitStudent={isVitStudent}
          savedProfile={savedProfile}
          eventStatuses={eventStatuses}
          showRegister={showRegister}
          onRegisterClick={() => setShowRegister(true)}
          onRegisterClose={() => setShowRegister(false)}
          onRegisterSuccess={() => onRegisterSuccess(selectedEvent._id)}
          onJoin={handleJoin}
          isLoggedIn={!!session}
          onClose={() => {
            setSelectedEvent(null);
            setShowRegister(false);
          }}
        />
      ) : null}
    </div>
  );
}

function LiveEventSection({
  events,
  registrations,
  onCardClick,
  onJoin,
  eventStatuses,
}: {
  events: SerializedEvent[];
  registrations: string[];
  onCardClick: (event: SerializedEvent) => void;
  onJoin: (event: SerializedEvent) => void;
  eventStatuses: Record<string, EventStatusData>;
}) {
  if (events.length === 0) return null;

  return (
    <section className="event-section">
      <div className="mb-10 border-l-4 border-[#79f2a1] pl-6 text-left">
        <h2 className="section-title mb-2" style={{ color: "#79f2a1" }}>LIVE NOW</h2>
        <p className="text-sm uppercase tracking-widest text-arcade-muted opacity-80">Active sessions requiring immediate attention.</p>
      </div>
      <div className="event-grid">
        {events.map((event) => (
          <LiveEventCard
            key={event._id}
            event={event}
            statusData={eventStatuses[event._id]}
            onJoin={() => onJoin(event)}
            onCardClick={() => onCardClick(event)}
            initialIsRegistered={registrations.includes(event._id)}
          />
        ))}
      </div>
    </section>
  );
}

function LiveEventCard({
  event,
  statusData,
  onJoin,
  onCardClick,
  initialIsRegistered,
}: {
  event: SerializedEvent;
  statusData?: EventStatusData;
  onJoin: () => void;
  onCardClick: () => void;
  initialIsRegistered: boolean;
}) {
  const { date, time } = formatEventWindow(event.startTime, event.endTime);
  const isRegistered = statusData?.isRegistered ?? initialIsRegistered;
  const isLive = statusData?.isLive ?? event.isLive;
  const statusOverride = statusData?.statusOverride ?? event.statusOverride;
  const currentStatus = getStatus(event.startTime, event.endTime, statusOverride);
  const isLoggedIn = statusData ? statusData.isLoggedIn : true;
  const hasStatusData = !!statusData;

  let btnText = hasStatusData ? "JOIN MEET" : "...";
  let isDisabled = !hasStatusData;
  let isPulsing = false;
  let showRegisterOnClick = false;

  if (hasStatusData) {
    if (currentStatus === "Ended") {
      btnText = "EVENT ENDED";
      isDisabled = true;
    } else if (!isLoggedIn) {
      btnText = "LOGIN TO JOIN";
    } else if (!isRegistered) {
      btnText = "REGISTER NOW";
      showRegisterOnClick = true;
    } else if (currentStatus === "Upcoming") {
      btnText = "REGISTERED";
      isDisabled = true;
    } else if (currentStatus === "Live" && !isLive) {
      btnText = "WAITING FOR ORGANIZER...";
      isDisabled = true;
    } else if (currentStatus === "Live" && isLive) {
      btnText = "JOIN MEET";
      isPulsing = true;
    }
  }

  return (
    <div className="event-card border-[#79f2a1]/40 shadow-[0_0_20px_rgba(121,242,161,0.1)]">
      <button type="button" className="event-card__content block w-full text-left" onClick={onCardClick}>
        <div className="event-card__topline">
          <span className="tag tag-green">SYSTEM LIVE</span>
          <span className="live-badge"><span /> LIVE</span>
        </div>
        <span className="event-card__title mt-2">{event.title}</span>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-arcade-muted"><Calendar className="h-3 w-3" /> {date}</div>
          <div className="flex items-center gap-2 text-xs font-bold text-arcade-muted"><Video className="h-3 w-3" /> {time}</div>
        </div>
        {isRegistered ? (
          <div className="mt-4 flex items-center gap-2 text-xs font-black tracking-widest text-[#79f2a1]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#79f2a1]" />
            REGISTERED
          </div>
        ) : null}
      </button>
      <div className="event-card__footer mt-6">
        <Button
          onClick={showRegisterOnClick ? onCardClick : onJoin}
          disabled={isDisabled}
          className={`w-full gap-2 font-black tracking-widest transition-all ${
            isPulsing ? "animate-pulse shadow-[0_0_15px_#79f2a1]" : ""
          } ${
            btnText === "REGISTER NOW" ? "border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black" : 
            btnText === "JOIN MEET" ? "bg-[#79f2a1] text-black hover:bg-[#79f2a1]/90" : ""
          }`}
        >
          {btnText === "REGISTERED" ? (
             <div className="flex items-center gap-2">
               <span className="text-[10px]">REGISTERED</span>
             </div>
          ) : btnText === "STARTS IN COUNTDOWN" ? (
             <div className="flex items-center gap-2">
               <span className="text-[10px]">UPCOMING</span>
             </div>
          ) : btnText}
          {(btnText === "JOIN MEET" || btnText === "LOGIN TO JOIN") && <ExternalLink className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function UpcomingEventsSection({ events, onCardClick }: { events: SerializedEvent[]; onCardClick: (event: SerializedEvent) => void }) {
  if (events.length === 0) return null;

  return (
    <section className="event-section">
      <div className="mb-12 border-l-4 border-[#ffafd5] pl-6 text-left">
        <h2 className="section-title mb-2" style={{ color: "#ffafd5" }}>UPCOMING</h2>
        <p className="text-sm uppercase tracking-widest text-arcade-muted opacity-80">Future transmissions scheduled for broadcast - Microsoft Innovations Club</p>
      </div>
      <div className="space-y-16">
        {DOMAINS.map((domain) => {
          const domainEvents = events.filter((event) => event.domain === domain);
          if (domainEvents.length === 0) return null;
          return <CategoryBlock key={domain} domain={domain} events={domainEvents} onCardClick={onCardClick} />;
        })}
      </div>
    </section>
  );
}

function PastEventsSection({ events, onCardClick }: { events: SerializedEvent[]; onCardClick: (event: SerializedEvent) => void }) {
  if (events.length === 0) return null;

  return (
    <section className="event-section">
      <div className="mb-12 border-l-4 border-white/30 pl-6 text-left">
        <h2 className="section-title mb-2 text-white/70">COMPLETED</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {events.map((event) => (
          <RetroEventCard key={event._id} event={event} onCardClick={onCardClick} isEnded />
        ))}
      </div>
    </section>
  );
}

function CategoryBlock({
  domain,
  events,
  onCardClick,
}: {
  domain: Domain;
  events: SerializedEvent[];
  onCardClick: (event: SerializedEvent) => void;
}) {
  const meta = domainMeta[domain];
  const colors = accentColors[meta.accent];

  return (
    <div>
      <div className="mb-6 border-l-4 pl-4" style={{ borderColor: colors.heading }}>
        <h3 className="text-xl font-black uppercase tracking-[0.2em]" style={{ color: colors.heading }}>{meta.label}</h3>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {events.map((event) => (
          event.type === "hackathon" ? (
            <HackathonEventCard key={event._id} event={event} onCardClick={onCardClick} />
          ) : (
            <RetroEventCard key={event._id} event={event} onCardClick={onCardClick} />
          )
        ))}
      </div>
    </div>
  );
}

function RetroEventCard({
  event,
  onCardClick,
  isEnded,
}: {
  event: SerializedEvent;
  onCardClick: (event: SerializedEvent) => void;
  isEnded?: boolean;
}) {
  const meta = domainMeta[event.domain];
  const colors = accentColors[meta.accent];
  const { date, time } = formatEventWindow(event.startTime, event.endTime);

  return (
    <button
      type="button"
      onClick={() => onCardClick(event)}
      className="retro-event-card w-full text-left"
      style={{
        background: "rgba(18, 19, 27, 0.92)",
        border: `2px solid ${colors.border}`,
        padding: "22px",
        minHeight: "220px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        position: "relative",
        color: "var(--arcade-foreground)",
        opacity: isEnded ? 0.45 : 1,
        filter: isEnded ? "grayscale(1) brightness(0.8)" : "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 0 28px ${colors.glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span className={`tag ${colors.tag}`} style={{ fontSize: "0.68rem", fontWeight: 800, padding: "4px 8px", border: "1px solid currentColor", textTransform: "uppercase" }}>
          {event.type === "hackathon" ? "Hackathon" : "Workshop"}
        </span>
        <SymbolIcon name={meta.icon} className={isEnded ? "text-arcade-muted" : colors.text} style={{ width: "1.2em", height: "1.2em" }} />
      </div>
      {isEnded ? <CompletedStamp /> : null}
      <div style={{ flex: 1 }}>
        <p className={colors.text} style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.2, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.03em" }}>{event.title}</p>
        <p style={{ color: "var(--arcade-muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{event.description}</p>
      </div>
      <div className="mt-4 rounded-md bg-white/5 p-3 text-xs font-bold text-arcade-muted">
        <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {date}</div>
        <div className="mt-2 flex items-center gap-2"><Video className="h-3 w-3" /> {time}</div>
        {!isEnded ? <div className="mt-3 text-white">Starts in <CountdownTimer target={event.startTime} compact /></div> : null}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "18px", paddingTop: "12px", color: "var(--arcade-muted)", fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        <span>{meta.label}</span>
        <SymbolIcon name={meta.metaIcon} className={colors.text} style={{ width: "1.2em", height: "1.2em" }} />
      </div>
    </button>
  );
}

function HackathonEventCard({ event, onCardClick }: { event: SerializedEvent; onCardClick: (event: SerializedEvent) => void }) {
  const { date, time } = formatEventWindow(event.startTime, event.endTime);

  return (
    <button
      type="button"
      onClick={() => onCardClick(event)}
      className="w-full text-left"
      style={{
        background: "rgba(18, 19, 27, 0.92)",
        border: "2px solid #fbbc04",
        padding: "22px",
        minHeight: "250px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        position: "relative",
        overflow: "hidden",
        color: "var(--arcade-foreground)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 0 36px rgba(251,188,4,0.28)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span style={{ position: "absolute", top: "20px", right: "-42px", background: "#ea4335", color: "white", fontSize: "0.62rem", fontWeight: 800, padding: "5px 52px", transform: "rotate(35deg)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Special Event</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ background: "#fbbc04", color: "#1a0e00", fontSize: "0.68rem", fontWeight: 800, padding: "4px 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Hackathon</span>
          <SymbolIcon name="military_tech" className="text-yellow" style={{ width: "1.3em", height: "1.3em" }} />
        </div>
        <p style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "1.3rem", lineHeight: 1.15, color: "#fbbc04", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px" }}>{event.title}</p>
        <p style={{ color: "var(--arcade-muted)", fontSize: "0.88rem", lineHeight: 1.55 }}>{event.description}</p>
      </div>
      <div className="mt-4 rounded-md bg-white/5 p-3 text-xs font-bold text-arcade-muted">
        <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {date}</div>
        <div className="mt-2 flex items-center gap-2"><Video className="h-3 w-3" /> {time}</div>
      </div>
    </button>
  );
}

function EventPosterModal({
  event,
  isRegistered,
  isVitStudent,
  savedProfile,
  eventStatuses,
  showRegister,
  onRegisterClick,
  onRegisterClose,
  onRegisterSuccess,
  onJoin,
  isLoggedIn,
  onClose,
}: {
  event: SerializedEvent;
  isRegistered: boolean;
  isVitStudent: boolean;
  savedProfile: SavedProfile | null;
  eventStatuses: Record<string, EventStatusData>;
  showRegister: boolean;
  onRegisterClick: () => void;
  onRegisterClose: () => void;
  onRegisterSuccess: () => void;
  onJoin: (event: SerializedEvent) => void;
  isLoggedIn: boolean;
  onClose: () => void;
}) {
  const colors = accentColors[domainMeta[event.domain].accent];
  const status = getStatus(event.startTime, event.endTime, event.statusOverride);
  const { date, time } = formatEventWindow(event.startTime, event.endTime);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <>
      {!showRegister ? (
        <div className="dialog-overlay" onClick={handleBackdropClick} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-panel" style={{ width: "min(520px, calc(100vw - 32px))", maxHeight: "min(82vh, 640px)", overflowY: "auto", borderColor: colors.border, position: "relative", boxShadow: `0 24px 80px rgba(0,0,0,0.55), 0 0 60px ${colors.glow}` }}>
            <button onClick={onClose} className="modal-close" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "var(--arcade-muted)", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }} aria-label="Close modal">
              <X size={18} />
            </button>
            <div style={{ width: "100%", aspectRatio: "16/7", background: `linear-gradient(135deg, rgba(18,19,27,0.9) 0%, ${colors.glow.replace("0.18", "0.35")} 100%)`, border: `1px solid ${colors.border}30`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${colors.border}18 1px, transparent 1px), linear-gradient(90deg, ${colors.border}18 1px, transparent 1px)`, backgroundSize: "32px 32px" }} />
              <SymbolIcon name={domainMeta[event.domain].icon} className={colors.text} style={{ width: "4rem", height: "4rem", opacity: 0.85, position: "relative", zIndex: 1 }} />
              <span style={{ position: "relative", zIndex: 1, background: colors.border, color: domainMeta[event.domain].accent === "yellow" ? "#1a0e00" : "white", fontSize: "0.68rem", fontWeight: 800, padding: "5px 14px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {event.type === "hackathon" ? "Hackathon" : "Workshop"}
              </span>
            </div>
            <div className="dialog-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span className={`tag ${colors.tag}`} style={{ fontSize: "0.7rem", fontWeight: 800, padding: "4px 10px", border: "1px solid currentColor", textTransform: "uppercase" }}>{domainMeta[event.domain].label}</span>
                <span style={{ color: "var(--arcade-muted)", fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em" }}>{status}</span>
              </div>
              <h2 className={`dialog-title ${colors.text}`} style={{ fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.04em" }}>{event.title}</h2>
              <p className="dialog-description" style={{ fontSize: "1rem", lineHeight: 1.65 }}>{event.description}</p>
              <div style={{ marginTop: "12px", fontSize: "0.95rem", lineHeight: 1.6, color: "var(--arcade-muted)" }}>
                <p style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar className="h-4 w-4" /> {date}</p>
                <p style={{ display: "flex", alignItems: "center", gap: "8px" }}><Video className="h-4 w-4" /> {time}</p>
              </div>
            </div>
            <div className="modal-actions" style={{ justifyContent: "stretch", flexDirection: "column" }}>
              {(() => {
                const statusData = eventStatuses[event._id];
                const isRegisteredLocal = statusData?.isRegistered ?? isRegistered;
                const isLive = statusData?.isLive ?? event.isLive;
                const statusOverride = statusData?.statusOverride ?? event.statusOverride;
                const currentStatus = getStatus(event.startTime, event.endTime, statusOverride);
                const isUserLoggedIn = statusData ? statusData.isLoggedIn : isLoggedIn;

                let btnText = "JOIN MEETING";
                let isDisabled = false;
                let isPulsing = false;
                let btnColor = colors.border;
                let textColor = domainMeta[event.domain].accent === "yellow" ? "#1a0e00" : "white";

                if (currentStatus === "Ended") {
                  btnText = "EVENT ENDED";
                  isDisabled = true;
                  btnColor = "#ea4335";
                } else if (!isUserLoggedIn) {
                  btnText = "LOGIN TO JOIN";
                } else if (!isRegisteredLocal) {
                  btnText = "REGISTER NOW";
                  btnColor = "#fbbc04";
                  textColor = "#1a0e00";
                } else if (currentStatus === "Upcoming") {
                  btnText = `REGISTERED`;
                  isDisabled = true;
                } else if (currentStatus === "Live" && !isLive) {
                  btnText = "WAITING FOR ORGANIZER...";
                  isDisabled = true;
                  btnColor = "#666";
                } else if (currentStatus === "Live" && isLive) {
                  btnText = "JOIN MEET";
                  isPulsing = true;
                  btnColor = "#79f2a1";
                  textColor = "#000";
                }

                return (
                  <Button 
                    className={`h-12 w-full gap-2 font-black tracking-widest ${isPulsing ? "animate-pulse shadow-[0_0_20px_#79f2a1]" : ""}`}
                    disabled={isDisabled} 
                    style={{ background: btnColor, color: textColor, border: "none", fontSize: "0.9rem" }} 
                    onClick={btnText === "REGISTER NOW" ? onRegisterClick : () => onJoin(event)}
                  >
                    {btnText === "REGISTERED" && currentStatus === "Upcoming" ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] opacity-70">REGISTERED - STARTS IN</span>
                        <CountdownTimer target={event.startTime} compact />
                      </div>
                    ) : btnText === "STARTS IN COUNTDOWN" ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] opacity-70">TRANSMISSION PENDING</span>
                        <CountdownTimer target={event.startTime} compact />
                      </div>
                    ) : (
                      <>
                        {btnText === "JOIN MEET" || btnText === "JOIN MEETING" || btnText === "LOGIN TO JOIN" ? <ExternalLink className="h-4 w-4" /> : null}
                        {btnText}
                      </>
                    )}
                  </Button>
                );
              })()}
              <Button variant="outline" className="h-10 w-full font-black tracking-widest" style={{ borderColor: "rgba(255,255,255,0.12)", color: "var(--arcade-muted)", background: "transparent" }} onClick={onClose}>CLOSE</Button>
            </div>
          </div>
        </div>
      ) : null}
      <RegisterDialog
        isOpen={showRegister}
        onClose={onRegisterClose}
        eventId={event._id}
        eventTitle={event.title}
        isVitStudent={isVitStudent}
        savedProfile={savedProfile}
        onSuccess={onRegisterSuccess}
      />
    </>
  );
}

function CompletedStamp() {
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-15deg)", border: "4px solid #ea4335", color: "#ea4335", padding: "4px 12px", fontWeight: 900, fontSize: "1.5rem", zIndex: 10, opacity: 0.8, pointerEvents: "none", textTransform: "uppercase", letterSpacing: "0.1em" }}>
      COMPLETED
    </div>
  );
}
