"use client";

import * as React from "react";
import { Edit, Eye, EyeOff, Trash2, UserPlus } from "lucide-react";
import { AdminEventForm } from "@/components/AdminEventForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { formatEventWindow, getStatus, type SerializedEvent } from "@/lib/events";

type Participant = {
  _id: string;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
  registeredAt?: string;
};

export function AdminClient({ initialEvents }: { initialEvents: SerializedEvent[] }) {
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

        {events.map((event) => {
          const { date, time } = formatEventWindow(event.startTime, event.endTime);
          const list = participants[event._id];

          return (
            <Card key={event._id}>
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant={event.isPublished ? "default" : "muted"}>{event.isPublished ? "Published" : "Draft"}</Badge>
                      <Badge variant="secondary">{event.domain}</Badge>
                      <Badge variant="outline">{getStatus(event.startTime, event.endTime)}</Badge>
                    </div>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>{date} · {time} · {event.roomName}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(event)}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => togglePublished(event)}>
                      {event.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {event.isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteEvent(event._id)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" size="sm" onClick={() => loadParticipants(event._id)}>
                  View participants
                </Button>
                {loadingParticipants === event._id ? <Skeleton className="mt-4 h-16" /> : null}
                {list ? (
                  <div className="mt-4 rounded-md border">
                    {list.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">No registrations yet.</p>
                    ) : (
                      list.map((participant) => (
                        <div key={participant._id} className="flex items-center justify-between border-b p-4 last:border-b-0">
                          <div>
                            <p className="font-medium">{participant.user?.name || "Registered member"}</p>
                            <p className="text-sm text-muted-foreground">{participant.user?.email}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {participant.registeredAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(participant.registeredAt)) : ""}
                          </p>
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
