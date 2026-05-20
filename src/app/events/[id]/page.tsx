import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import { Calendar, Clock, ExternalLink, Timer, UserPlus } from "lucide-react";
import { RegisterDialogLauncher } from "@/components/RegisterDialogLauncher";
import { StartsSoonBanner } from "@/components/StartsSoonBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { formatEventWindow, getMeetUrl, getStatus, serializeEvent } from "@/lib/events";
import { isVitStudentEmail } from "@/lib/profile";
import Event from "@/models/Event";
import Registration from "@/models/Registration";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return {
      title: "Event | MIC",
      description: "Microsoft Innovations Club event details.",
    };
  }

  await connectToDatabase();
  const event = await Event.findById(id);
  return {
    title: event ? `${event.title} | MIC Events` : "Event | MIC",
    description: event?.description ?? "Microsoft Innovations Club event details.",
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const session = await getServerSession(authOptions);

  await connectToDatabase();

  const eventDocument = await Event.findOne({ _id: id, isPublished: true });
  if (!eventDocument) notFound();

  const event = serializeEvent(eventDocument);
  const status = getStatus(event.startTime, event.endTime, event.statusOverride);
  const { date, time } = formatEventWindow(event.startTime, event.endTime);
  const durationMinutes = Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60_000);
  const isRegistered = session?.user.id
    ? Boolean(await Registration.exists({ eventId: event._id, userId: session.user.id }))
    : false;
  const canJoin = isRegistered && status === "Live";

  return (
    <div className="schedule-retro relative min-h-screen">
      <div className="stars-container" />
      <div className="neon-grid" />
      <main className="main-shell relative z-10 py-12">
        <Link href="/schedule" className="text-sm font-bold tracking-widest text-arcade-muted hover:text-white">BACK TO EVENTS</Link>
        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="event-card">
            <div className="event-card__content">
              <div className="event-card__topline">
                <span className="tag tag-primary">{event.domain}</span>
                <Badge variant={status === "Live" ? "success" : status === "Ended" ? "muted" : "secondary"}>{status}</Badge>
                <Badge variant="outline">{event.type === "hackathon" ? "Hackathon" : "Session"}</Badge>
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-normal text-white">{event.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-arcade-muted">{event.description}</p>
              <StartsSoonBanner startTime={event.startTime} status={status} />
            </div>
          </div>

          <aside className="event-card">
            <div className="event-card__content space-y-5">
              <p className="flex items-center gap-3 text-sm text-arcade-muted"><Calendar className="h-4 w-4" />{date}</p>
              <p className="flex items-center gap-3 text-sm text-arcade-muted"><Clock className="h-4 w-4" />{time}</p>
              <p className="flex items-center gap-3 text-sm text-arcade-muted"><Timer className="h-4 w-4" />{durationMinutes} minutes</p>

              {status === "Ended" ? (
                <Button className="w-full join-now-button" disabled>
                  EVENT ENDED
                </Button>
              ) : !isRegistered ? (
                session?.user.id ? (
                  <RegisterDialogLauncher event={event} isRegistered={isRegistered} isVitStudent={isVitStudentEmail(session?.user?.email)} />
                ) : (
                  <Button asChild className="w-full arcade-btn">
                    <Link href="/login">
                      <UserPlus className="h-4 w-4" />
                      SIGN IN TO REGISTER
                    </Link>
                  </Button>
                )
              ) : status === "Upcoming" ? (
                <RegisterDialogLauncher event={event} isRegistered={isRegistered} isVitStudent={isVitStudentEmail(session?.user?.email)} />
              ) : !event.isLive ? (
                <Button className="w-full join-now-button" disabled>
                  WAITING FOR ORGANIZER...
                </Button>
              ) : (
                <Button asChild className="w-full join-now-button">
                  <a href={getMeetUrl(event.roomName)} target="_blank" rel="noreferrer">
                    JOIN MEET <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {!isRegistered && status === "Live" ? <p className="text-xs text-arcade-muted">Meet access appears after registration and only while the event is live.</p> : null}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
