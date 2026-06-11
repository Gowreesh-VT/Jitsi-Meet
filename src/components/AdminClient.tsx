"use client";

import * as React from "react";
import { Edit, Eye, EyeOff, Radio, Square, Trash2, UserPlus } from "lucide-react";
import { AdminEventForm } from "@/components/AdminEventForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatEventWindow, getStatus, formatRoomNameLabel, type SerializedEvent } from "@/lib/events";

type Participant = {
  _id: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
  registeredAt?: string;
  meetHistory?: Array<{ joinedAt: string; leftAt?: string }>;
};

export function AdminClient({
  initialEvents,
  totalRegistrations,
  registrationsToday,
  registrationsThisWeek,
  totalUsers,
  totalHackathonRegistrations,
  registrationCounts,
}: {
  initialEvents: SerializedEvent[];
  totalRegistrations: number;
  registrationsToday: number;
  registrationsThisWeek: number;
  totalUsers: number;
  totalHackathonRegistrations: number;
  registrationCounts: Record<string, number>;
}) {
  const [events, setEvents] = React.useState(initialEvents);
  const [editing, setEditing] = React.useState<SerializedEvent | null>(null);
  const [participants, setParticipants] = React.useState<Record<string, Participant[]>>({});
  const [loadingParticipants, setLoadingParticipants] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const { toast } = useToast();

  async function refresh() {
    const response = await fetch("/api/events?includeUnpublished=true", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load events");
    setEvents(data.events);
  }

  async function saveEvent(payload: Record<string, unknown>) {
    try {
      const url = editing ? `/api/events/${editing._id}` : "/api/events";
      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save event");
      setEditing(null);
      await refresh();
      toast({ title: editing ? "Event updated" : "Event created", description: data.event.title });
    } catch (error) {
      toast({ title: "Could not save event", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  }

  async function togglePublished(event: SerializedEvent) {
    await savePatch(event._id, { isPublished: !event.isPublished }, event.isPublished ? "Event unpublished" : "Event published");
  }

  async function setManualStatus(event: SerializedEvent, statusOverride: SerializedEvent["statusOverride"]) {
    const title = statusOverride === "auto" ? "Event status returned to auto" : `Event marked ${statusOverride}`;
    await savePatch(event._id, { statusOverride }, title);
  }

  async function savePatch(id: string, payload: Record<string, unknown>, title: string) {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Update failed");
      setEvents((current) => current.map((event) => (event._id === id ? data.event : event)));
      toast({ title });
    } catch (error) {
      toast({ title: "Update failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  }

  async function deleteEvent(id: string) {
    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Delete failed");
      setEvents((current) => current.filter((event) => event._id !== id));
      toast({ title: "Event deleted" });
    } catch (error) {
      toast({ title: "Delete failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  }

  async function loadParticipants(eventId: string) {
    setLoadingParticipants(eventId);
    try {
      const response = await fetch(`/api/registrations/${eventId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load participants");
      setParticipants((current) => ({ ...current, [eventId]: data.registrations }));
    } catch (error) {
      toast({ title: "Could not load participants", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setLoadingParticipants(null);
    }
  }

  async function promote(event: React.FormEvent) {
    event.preventDefault();
    try {
      const response = await fetch("/api/admin/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Promotion failed");
      setEmail("");
      toast({ title: "Admin promoted", description: data.user.email });
    } catch (error) {
      toast({ title: "Promotion failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit event" : "Create event"}</CardTitle>
            <CardDescription>Publish sessions and hackathons to the member schedule.</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminEventForm key={editing?._id ?? "new-event"} event={editing} onSubmit={saveEvent} onCancel={editing ? () => setEditing(null) : undefined} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage admins</CardTitle>
            <CardDescription>Promote an existing Google-authenticated user by email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={promote} className="flex gap-2">
              <Input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit">
                <UserPlus className="h-4 w-4" />
                Promote
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Admin Panel</h1>
          <p className="mt-2 text-muted-foreground">Manage published and draft events, participants, and admin access.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Overall registrations</CardDescription>
              <CardTitle className="text-3xl">{totalRegistrations}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Total users</CardDescription>
              <CardTitle className="text-3xl">{totalUsers}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>Registrations today</CardDescription>
              <CardTitle className="text-3xl">{registrationsToday}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Registrations this week</CardDescription>
              <CardTitle className="text-3xl">{registrationsThisWeek}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardDescription>Total hackathon registrations</CardDescription>
              <CardTitle className="text-3xl">{totalHackathonRegistrations}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {events.map((event) => {
          const { date, time } = formatEventWindow(event.startTime, event.endTime);
          const list = participants[event._id];
          const eventRegistrations = registrationCounts[event._id] ?? 0;

          return (
            <Card key={event._id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant={event.isPublished ? "default" : "muted"}>{event.isPublished ? "Published" : "Draft"}</Badge>
                      <Badge variant="secondary">{event.domain}</Badge>
                      <Badge variant="outline">{getStatus(event.startTime, event.endTime, event.statusOverride)}</Badge>
                      <Badge variant="outline">{eventRegistrations} registrations</Badge>
                      {event.statusOverride !== "auto" ? <Badge variant="secondary">Manual</Badge> : null}
                    </div>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>{date} · {time} · {formatRoomNameLabel(event.roomName)}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditing(event);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => togglePublished(event)}>
                      {event.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {event.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant={event.isLive ? "default" : "outline"} size="sm" onClick={() => savePatch(event._id, { isLive: !event.isLive }, event.isLive ? "Meet closed" : "Meet opened")}>
                      <Radio className={`h-4 w-4 ${event.isLive ? "animate-pulse" : ""}`} />
                      {event.isLive ? "Live ON" : "Open Meet"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setManualStatus(event, event.statusOverride === "ended" ? "auto" : "ended")}>
                      <Square className="h-4 w-4" />
                      {event.statusOverride === "ended" ? "Auto" : "Mark Ended"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteEvent(event._id)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button variant="secondary" size="sm" onClick={() => loadParticipants(event._id)}>
                    View participants
                  </Button>
                  {list && (
                    <div className="flex items-center gap-2 text-sm font-bold text-green-500">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      {list.filter(p => p.meetHistory?.some(h => !h.leftAt)).length} IN MEET
                    </div>
                  )}
                </div>
                {loadingParticipants === event._id ? <Skeleton className="mt-4 h-16" /> : null}
                {list ? (
                  <div className="mt-4 rounded-md border">
                    <div className="bg-muted/50 p-2 px-4 border-b flex justify-between text-xs font-bold text-muted-foreground">
                      <span>{list.length} {list.length === 1 ? 'REGISTRATION' : 'REGISTRATIONS'}</span>
                      <span>{list.filter(p => p.meetHistory && p.meetHistory.length > 0).length} ATTENDED</span>
                    </div>
                    {list.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">No registrations yet.</p>
                    ) : (
                      list.map((participant) => (
                        <div key={participant._id} className="flex items-center justify-between border-b p-4 last:border-b-0">
                          <div>
                            <p className="font-medium">{participant.user?.name || "Registered member"}</p>
                            <p className="text-sm text-muted-foreground">{participant.user?.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {participant.registeredAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(participant.registeredAt)) : ""}
                            </p>
                            {participant.meetHistory && participant.meetHistory.length > 0 ? (
                              <span className="inline-flex mt-1 items-center rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">
                                ATTENDED
                              </span>
                            ) : (
                              <span className="inline-flex mt-1 items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                                ABSENT
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
