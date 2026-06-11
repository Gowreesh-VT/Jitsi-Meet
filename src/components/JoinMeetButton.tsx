"use client";

import React, { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMeetUrl } from "@/lib/events";
import { MeetEmbed } from "./MeetEmbed";

interface JoinMeetButtonProps {
  eventId: string;
  roomName: string;
}

export const JoinMeetButton: React.FC<JoinMeetButtonProps> = ({ eventId, roomName }) => {
  const [activeMeetUrl, setActiveMeetUrl] = useState<string | null>(null);

  const handleJoin = async () => {
    const url = getMeetUrl(roomName);
    setActiveMeetUrl(url);

    try {
      await fetch(`/api/events/${eventId}/meet/join`, { method: "POST" });
    } catch (error) {
      console.error("Failed to log join:", error);
    }
  };

  const handleLeave = async () => {
    try {
      await fetch(`/api/events/${eventId}/meet/leave`, { method: "POST" });
    } catch (error) {
      console.error("Failed to log leave:", error);
    }
    setActiveMeetUrl(null);
  };

  return (
    <>
      <Button onClick={handleJoin} className="w-full join-now-button gap-2">
        JOIN MEET <ExternalLink className="h-4 w-4" />
      </Button>

      {activeMeetUrl && (
        <MeetEmbed embedUrl={activeMeetUrl} onLeave={handleLeave} />
      )}
    </>
  );
};
