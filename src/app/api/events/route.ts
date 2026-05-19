import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { generateRoomName, serializeEvent } from "@/lib/events";
import Event from "@/models/Event";

export async function GET(request: Request) {
  await connectToDatabase();

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
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const roomName = typeof body.roomName === "string" ? body.roomName.trim() : "";

  const requiredFields = [
    ["title", title],
    ["description", description],
    ["domain", body.domain],
    ["type", body.type],
    ["startTime", body.startTime],
    ["endTime", body.endTime],
    ["roomName", roomName],
  ] as const;
  const missing = requiredFields.filter(f => f[0] !== "roomName").find((field) => !field[1]);
  if (missing) return NextResponse.json({ message: `${missing[0]} is required` }, { status: 400 });

  const startTime = new Date(body.startTime);
  const endTime = new Date(body.endTime);
  
  const finalRoomName = roomName || generateRoomName(body.domain, body.type, startTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || startTime >= endTime) {
    return NextResponse.json({ message: "Event times are invalid" }, { status: 400 });
  }

  await connectToDatabase();
  try {
    const event = await Event.create({
      title,
      description,
      domain: body.domain,
      type: body.type,
      startTime,
      endTime,
      roomName: finalRoomName,
      statusOverride: body.statusOverride === "live" || body.statusOverride === "ended" ? body.statusOverride : "auto",
      isPublished: Boolean(body.isPublished),
    });

    return NextResponse.json({ event: serializeEvent(event) }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "An event with this meet room already exists" }, { status: 409 });
    }
    throw error;
  }
}
