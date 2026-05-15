import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ensureSeedEvents } from "@/lib/seed";
import { serializeEvent } from "@/lib/events";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import { ScheduleClient } from "@/components/ScheduleClient";
import { isVitStudentEmail } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  
  await connectToDatabase();
  await ensureSeedEvents();

  const events = await Event.find({ isPublished: true }).sort({ startTime: 1 });
  const scheduledEvents = events.map(serializeEvent);

  let userRegistrations: string[] = [];
  if (session?.user.id) {
    const regs = await Registration.find({ userId: session.user.id });
    userRegistrations = regs.map(r => String(r.eventId));
  }

  const isVitStudent = isVitStudentEmail(session?.user.email);

  return (
    <div className="schedule-retro relative min-h-screen">
      {/* Animated Background Layers */}
      <div className="stars-container" />
      <div className="neon-grid" />
      <div className="synth-sun" />
      <div className="scanline-overlay" />

      <main className="main-shell relative z-10">
        <section className="hero mb-16 pt-12">
          <h1 className="text-4xl font-black tracking-widest text-[#ffafd5] mb-4">PORTAL<br />SCHEDULE</h1>
          <div className="hero-rule mb-6" />
          <p className="max-w-2xl mx-auto text-arcade-muted text-lg">
            Monitor all active and upcoming technical sessions across the MIC ecosystem.
          </p>
        </section>

        {scheduledEvents.length === 0 ? (
          <div className="event-card max-w-2xl mx-auto text-center py-12">
            <h3 className="event-card__title mb-4">NO DATA DETECTED</h3>
            <p className="text-arcade-muted">The event stream is currently offline. Check back later.</p>
          </div>
        ) : (
          <ScheduleClient 
            initialEvents={scheduledEvents} 
            userRegistrations={userRegistrations}
            isVitStudent={isVitStudent}
          />
        )}
      </main>
    </div>
  );
}


