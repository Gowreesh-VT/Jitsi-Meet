import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DOMAINS, EVENT_TYPES, serializeEvent } from "@/lib/events";
import { ensureSeedEvents } from "@/lib/seed";
import Event from "@/models/Event";

export async function GET(request: Request) {
  await connectToDatabase();
  await ensureSeedEvents();

  const { searchParams } = new URL(request.url);
  const includeUnpublished = searchParams.get("includeUnpublished") === "true";
  const session = await getServerSession(authOptions);
  const canSeeUnpublished = includeUnpublished && session?.user.role === "admin";

  const events = await Event.find(canSeeUnpublished ? {} : { isPublished: true }).sort({ startTime: 1 });
  return NextResponse.json({ events: events.map(serializeEvent) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  const requiredFields = ["title", "domain", "type", "startTime", "endTime", "roomName"];
  const missing = requiredFields.find((field) => !body[field]);
  if (missing) return NextResponse.json({ message: `${missing} is required` }, { status: 400 });
  if (!DOMAINS.includes(body.domain)) return NextResponse.json({ message: "Invalid domain" }, { status: 400 });
  if (!EVENT_TYPES.includes(body.type)) return NextResponse.json({ message: "Invalid event type" }, { status: 400 });

  const startTime = new Date(body.startTime);
  const endTime = new Date(body.endTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || startTime >= endTime) {
    return NextResponse.json({ message: "Event times are invalid" }, { status: 400 });
  }

  await connectToDatabase();
  const event = await Event.create({
    title: body.title,
    domain: body.domain,
    type: body.type,
    startTime,
    endTime,
    roomName: body.roomName,
    isPublished: Boolean(body.isPublished),
  });

  return NextResponse.json({ event: serializeEvent(event) }, { status: 201 });
}
