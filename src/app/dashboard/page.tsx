import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeEvent } from "@/lib/events";
import Registration from "@/models/Registration";
import ClientOnlyDashboard from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Events | MIC Meet Portal",
  description: "Registered Microsoft Innovations Club events and live meeting links.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/login");

  await connectToDatabase();

  const registrations = await Registration.find({ userId: session.user.id }).populate("eventId").sort({ registeredAt: -1 });
  const events = registrations
    .map((registration) => registration.eventId)
    .filter(Boolean)
    .map((event) => serializeEvent(event as never));

  return (
    <div className="schedule-retro relative min-h-screen">
      <div className="stars-container" />
      <div className="neon-grid" />
      <main className="main-shell relative z-10 py-12">
        <section className="hero mb-12">
          <h1 className="text-4xl font-black tracking-widest text-[#ffafd5]">MY EVENTS</h1>
          <p>Manage and View all the events that you have registered for.</p>
          <div className="hero-rule mt-6" />
        </section>
        {events.length === 0 ? (
          <div className="event-card mx-auto max-w-2xl py-12 text-center">
            <h2 className="event-card__title mb-4">NO REGISTRATIONS</h2>
            <p className="mb-6 text-arcade-muted">Register for an upcoming session to see it here.</p>
            <Button asChild className="arcade-btn"><Link href="/#schedule">BROWSE EVENTS</Link></Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Client component polls every 15s and updates live status */}
            <ClientOnlyDashboard initialEvents={events} />
          </div>
        )}
      </main>
    </div>
  );
}

// Render the client dashboard UI inside a small client component

// Server-side helper removed — rendering handled by client component `DashboardClient`.
