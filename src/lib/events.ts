export const DOMAINS = ["AI/ML", "CP", "UI/UX", "CyberSec", "Dev", "Hackathon"] as const;
export const EVENT_TYPES = ["session", "hackathon"] as const;

export type Domain = (typeof DOMAINS)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = "Upcoming" | "Live" | "Ended";

export type SerializedEvent = {
  _id: string;
  title: string;
  domain: Domain;
  type: EventType;
  startTime: string;
  endTime: string;
  roomName: string;
  isPublished: boolean;
  createdAt?: string;
};

export function getStatus(startTime: Date | string, endTime: Date | string): EventStatus {
  const now = new Date();
  const startsAt = new Date(startTime);
  const endsAt = new Date(endTime);

  if (now < startsAt) return "Upcoming";
  if (now >= startsAt && now <= endsAt) return "Live";
  return "Ended";
}

export function formatEventWindow(startTime: Date | string, endTime: Date | string) {
  const startsAt = new Date(startTime);
  const endsAt = new Date(endTime);

  // Hardcoded weekday and month names for consistent server/client rendering
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Manual date formatting to avoid Intl.DateTimeFormat inconsistencies
  const weekday = weekdays[startsAt.getDay()];
  const day = startsAt.getDate();
  const month = months[startsAt.getMonth()];
  const year = startsAt.getFullYear();
  const date = `${weekday}, ${day} ${month} ${year}`;

  // Format time with manual padding for minutes
  const startHour = startsAt.getHours();
  const startMinute = String(startsAt.getMinutes()).padStart(2, "0");
  const endHour = endsAt.getHours();
  const endMinute = String(endsAt.getMinutes()).padStart(2, "0");
  const time = `${startHour}:${startMinute} - ${endHour}:${endMinute} IST`;

  return { date, time };
}

export function serializeEvent(event: {
  _id: unknown;
  title: string;
  domain: Domain;
  type: EventType;
  startTime: Date;
  endTime: Date;
  roomName: string;
  isPublished: boolean;
  createdAt?: Date;
}): SerializedEvent {
  return {
    _id: String(event._id),
    title: event.title,
    domain: event.domain,
    type: event.type,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    roomName: event.roomName,
    isPublished: event.isPublished,
    createdAt: event.createdAt?.toISOString(),
  };
}
