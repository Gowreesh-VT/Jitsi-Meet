export const DOMAINS = ["AI/ML", "CP", "UI/UX", "CyberSec", "MLSA", "Dev", "Hackathon"] as const;
export const EVENT_TYPES = ["session", "hackathon"] as const;

export type Domain = (typeof DOMAINS)[number];
export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = "Upcoming" | "Live" | "Ended";

const REGISTRATION_CLOSED_TITLES = ["Bug Hunt", "Algo Sprint"];

export type SerializedEvent = {
  _id: string;
  title: string;
  description: string;
  domain: Domain;
  type: EventType;
  startTime: string;
  endTime: string;
  roomName: string;
  statusOverride: "auto" | "live" | "ended";
  isLive: boolean;
  isPublished: boolean;
  createdAt?: string;
  posterUrl?: string;
};

export function getStatus(
  startTime: Date | string,
  endTime: Date | string,
  statusOverride: "auto" | "live" | "ended" = "auto",
): EventStatus {
  if (statusOverride === "live") return "Live";
  if (statusOverride === "ended") return "Ended";

  const now = new Date();
  const startsAt = new Date(startTime);
  const endsAt = new Date(endTime);

  if (now < startsAt) return "Upcoming";
  if (now >= startsAt && now <= endsAt) return "Live";
  return "Ended";
}

export function getISTParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }
  if (partMap.hour === "24") {
    partMap.hour = "00";
  }
  return partMap;
}

export function parseLocalTimeAsIST(value: string) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) {
    return new Date(value + "+05:30");
  }
  return new Date(value);
}

export function formatEventWindow(startTime: Date | string, endTime: Date | string) {
  const startsAt = new Date(startTime);
  const endsAt = new Date(endTime);

  const startParts = getISTParts(startsAt);
  const endParts = getISTParts(endsAt);

  const date = `${startParts.weekday}, ${startParts.day} ${startParts.month} ${startParts.year}`;
  const time = `${startParts.hour}:${startParts.minute} - ${endParts.hour}:${endParts.minute} IST`;

  return { date, time };
}

export function serializeEvent(event: {
  _id: unknown;
  title: string;
  description?: string;
  domain: Domain;
  type: EventType;
  startTime: Date;
  endTime: Date;
  roomName: string;
  statusOverride?: "auto" | "live" | "ended";
  isLive: boolean;
  isPublished: boolean;
  createdAt?: Date;
  posterUrl?: string | null;
}): SerializedEvent {
  return {
    _id: String(event._id),
    title: event.title,
    description: event.description ?? "",
    domain: event.domain,
    type: event.type,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    roomName: event.roomName,
    statusOverride: event.statusOverride ?? "auto",
    isLive: event.isLive,
    isPublished: event.isPublished,
    createdAt: event.createdAt?.toISOString(),
    posterUrl: event.posterUrl ?? undefined,
  };
}

export function isRegistrationClosed(eventTitle: string, startTime: Date | string, now = new Date()) {
  void startTime;
  void now;
  return REGISTRATION_CLOSED_TITLES.includes(eventTitle);
}

export function getMeetUrl(roomName: string) {
  let url = roomName.trim();
  if (url.includes("<iframe") && url.includes("src=")) {
    const match = url.match(/src=["']([^"']+)["']/);
    if (match && match[1]) {
      url = match[1];
    }
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const server = process.env.NEXT_PUBLIC_JITSI_SERVER || "https://meet.microsoftinnovations.club";
  return `${server.replace(/\/$/, "")}/${url}`;
}

export function formatRoomNameLabel(roomName: string) {
  const clean = roomName.trim();
  if (clean.includes("<iframe") || clean.startsWith("http://") || clean.startsWith("https://")) {
    return "Zoho Meeting";
  }
  return clean;
}

export function generateRoomName(domain: string, type: string, startTime: string | Date) {
  const date = new Date(startTime);
  const startParts = getISTParts(date);
  const day = startParts.day;
  const month = startParts.month.toLowerCase();
  const domainSlug = domain.toLowerCase().replace(/[^a-z0-9]/g, "");
  const typeSlug = type.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${domainSlug}-${typeSlug}-${day}${month}`;
}
