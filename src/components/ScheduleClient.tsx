"use client";

import { useState, useEffect } from "react";
import { Calendar, Video, ArrowRight, ExternalLink, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEventWindow, getStatus, type SerializedEvent } from "@/lib/events";
import Link from "next/link";
import { RegisterDialog } from "./RegisterDialog";

export function ScheduleClient({
  initialEvents,
  userRegistrations,
  isVitStudent,
}: {
  initialEvents: SerializedEvent[];
  userRegistrations: string[]; // event IDs
  isVitStudent: boolean;
}) {
  const [registrations, setRegistrations] = useState<string[]>(userRegistrations);
  const [selectedEvent, setSelectedEvent] = useState<SerializedEvent | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [filter, setFilter] = useState<string>("All");
  const [tick, setTick] = useState(0);

  // Auto-refresh status every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredEvents = initialEvents.filter(event => 
    filter === "All" || event.domain === filter
  );

  const liveEvents = filteredEvents.filter((event) => getStatus(event.startTime, event.endTime) === "Live");
  const upcomingEvents = filteredEvents.filter((event) => getStatus(event.startTime, event.endTime) === "Upcoming");

  const handleRegisterSuccess = () => {
    if (selectedEvent) {
      setRegistrations((prev) => [...prev, selectedEvent._id]);
    }
  };

  return (
    <div className="space-y-16">
      {/* Filter Tabs */}
      <div className="flex justify-center mb-12">
        <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10 flex flex-wrap gap-1 justify-center">
          {["All", "AI/ML", "CP", "UI/UX", "CyberSec", "Dev", "Hackathon"].map((domain) => (
            <button
              key={domain}
              onClick={() => setFilter(domain)}
              className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${
                filter === domain 
                ? "bg-[#ffafd5] text-black shadow-[0_0_15px_rgba(255,175,213,0.4)]" 
                : "text-arcade-muted hover:text-white hover:bg-white/5"
              }`}
            >
              {domain.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-24">
        <EventSection 
          title="LIVE NOW" 
          description="Active sessions requiring immediate attention." 
          events={liveEvents} 
          isLive 
          registrations={registrations}
          onRegisterClick={(event) => {
            setSelectedEvent(event);
            setIsRegisterOpen(true);
          }}
        />

        {/* Upcoming Section */}
        <EventSection 
          title="UPCOMING" 
          description="Future transmissions scheduled for broadcast." 
          events={upcomingEvents} 
          registrations={registrations}
          onRegisterClick={(event) => {
            setSelectedEvent(event);
            setIsRegisterOpen(true);
          }}
        />

        {selectedEvent && (
          <RegisterDialog
            isOpen={isRegisterOpen}
            onClose={() => setIsRegisterOpen(false)}
            eventId={selectedEvent._id}
            eventTitle={selectedEvent.title}
            isVitStudent={isVitStudent}
            onSuccess={handleRegisterSuccess}
          />
        )}
      </div>
    </div>
  );
}

function EventSection({
  title,
  description,
  events,
  isLive,
  isEnded,
  registrations,
  onRegisterClick,
}: {
  title: string;
  description: string;
  events: SerializedEvent[];
  isLive?: boolean;
  isEnded?: boolean;
  registrations: string[];
  onRegisterClick?: (event: SerializedEvent) => void;
}) {
  if (events.length === 0) return null;

  return (
    <section className="event-section">
      <div className="mb-10 text-left border-l-4 border-[#ffafd5] pl-6">
        <h2 className="section-title mb-2">{title}</h2>
        <p className="text-arcade-muted text-sm tracking-widest opacity-80 uppercase">{description}</p>
      </div>

      <div className="event-grid">
        {events.map((event) => {
          const { date, time } = formatEventWindow(event.startTime, event.endTime);
          const isRegistered = registrations.includes(event._id);
          const canJoin = isRegistered && isLive;
          
          return (
            <div key={event._id} className={`event-card ${isLive ? 'border-[#79f2a1]/40 shadow-[0_0_20px_rgba(121,242,161,0.1)]' : ''}`}>
              <div className="event-card__content">
                <div className="event-card__topline">
                  <span className={`tag ${isLive ? 'tag-green' : isEnded ? 'tag-muted' : 'tag-primary'}`}>
                    {isLive ? 'SYSTEM LIVE' : isEnded ? 'STORED' : event.domain.toUpperCase()}
                  </span>
                  {isLive && <span className="live-badge"><span></span> LIVE</span>}
                </div>
                
                <span className="event-card__title mt-2">{event.title}</span>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-arcade-muted">
                    <Calendar className="h-3 w-3" /> {date}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-arcade-muted">
                    <Video className="h-3 w-3" /> {time}
                  </div>
                </div>

                {isRegistered && !isEnded && (
                  <div className="mt-4 text-xs font-black tracking-widest text-[#79f2a1] flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#79f2a1]" />
                    REGISTERED
                  </div>
                )}
              </div>

              <div className="event-card__footer mt-6">
                {isLive ? (
                  canJoin ? (
                    <Link href={`https://meet.jit.si/${event.roomName}`} target="_blank" className="w-full">
                      <Button className="join-now-button w-full font-black tracking-widest gap-2">
                        JOIN MEETING <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className="w-full arcade-btn-secondary opacity-80" 
                      onClick={() => onRegisterClick?.(event)}
                    >
                      REGISTER TO JOIN
                    </Button>
                  )
                ) : isEnded ? (
                  <span className="text-xs font-black opacity-30 tracking-[0.2em]">TRANSMISSION ENDED</span>
                ) : (
                  <Button 
                    className={`w-full arcade-btn h-12 font-black tracking-widest gap-2 ${isRegistered ? 'opacity-50 cursor-default' : ''}`}
                    onClick={() => !isRegistered && onRegisterClick?.(event)}
                    disabled={isRegistered}
                  >
                    {isRegistered ? "ALREADY REGISTERED" : (
                      <>
                        REGISTER NOW <UserPlus className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
