"use client";

import { Calendar, Clock, ExternalLink, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CountdownTimer } from "@/components/CountdownTimer";
import { formatEventWindow, getStatus, type SerializedEvent } from "@/lib/events";

export function EventCard({
  event,
  isRegistered,
  onRegister,
}: {
  event: SerializedEvent;
  isRegistered: boolean;
  onRegister: (eventId: string) => void;
}) {
  const status = getStatus(event.startTime, event.endTime);
  const { date, time } = formatEventWindow(event.startTime, event.endTime);
  const canJoin = isRegistered && status === "Live";
  const jitsiServer = process.env.NEXT_PUBLIC_JITSI_SERVER || "https://meet.microsoftinnovations.club";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{event.domain}</Badge>
          <StatusBadge status={status} />
        </div>
        <CardTitle>{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {date}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {time}
          </p>
        </div>
        {status === "Upcoming" ? (
          <div className="rounded-md bg-muted p-3 text-sm">
            Starts in <span className="font-semibold text-foreground"><CountdownTimer target={event.startTime} compact /></span>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="gap-3">
        {status === "Upcoming" ? (
          <Button className="flex-1" disabled={isRegistered} onClick={() => onRegister(event._id)}>
            <UserPlus className="h-4 w-4" />
            {isRegistered ? "Registered" : "Register"}
          </Button>
        ) : (
          <Button className="flex-1" disabled={!canJoin} onClick={() => window.open(`${jitsiServer}/${event.roomName}`, "_blank")}>
            <ExternalLink className="h-4 w-4" />
            Join Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ status }: { status: "Upcoming" | "Live" | "Ended" }) {
  if (status === "Live") {
    return (
      <Badge variant="success" className="gap-1.5">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        Live
      </Badge>
    );
  }

  if (status === "Upcoming") return <Badge>Upcoming</Badge>;
  return <Badge variant="muted">Ended</Badge>;
}
