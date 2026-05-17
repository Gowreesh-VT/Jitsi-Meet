import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DOMAINS, EVENT_TYPES, generateRoomName, serializeEvent } from "@/lib/events";
import Event from "@/models/Event";
import Registration from "@/models/Registration";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  await connectToDatabase();
  const event = await Event.findById(id);
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });
  if (!event.isPublished && session?.user.role !== "admin") {
    return NextResponse.json({ message: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event: serializeEvent(event) });
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  if (body.domain && !DOMAINS.includes(body.domain)) return NextResponse.json({ message: "Invalid domain" }, { status: 400 });
  if (body.type && !EVENT_TYPES.includes(body.type)) return NextResponse.json({ message: "Invalid event type" }, { status: 400 });

  const update: Record<string, unknown> = {
    title: typeof body.title === "string" ? body.title.trim() : undefined,
    description: typeof body.description === "string" ? body.description.trim() : undefined,
    domain: body.domain,
    type: body.type,
    startTime: body.startTime ? new Date(body.startTime) : undefined,
    endTime: body.endTime ? new Date(body.endTime) : undefined,
    roomName: typeof body.roomName === "string" ? body.roomName.trim() : undefined,
    statusOverride: ["auto", "live", "ended"].includes(body.statusOverride) ? body.statusOverride : undefined,
    isLive: typeof body.isLive === "boolean" ? body.isLive : undefined,
    isPublished: typeof body.isPublished === "boolean" ? body.isPublished : undefined,
  };

  Object.keys(update).forEach(key => update[key] === undefined && delete update[key]);

  if (update.roomName === "" || (!update.roomName && (body.domain || body.type || body.startTime))) {
    if (body.domain && body.type && body.startTime) {
       update.roomName = generateRoomName(body.domain, body.type, body.startTime);
    }
  }

  if (update.startTime instanceof Date && update.endTime instanceof Date && update.startTime >= update.endTime) {
    return NextResponse.json({ message: "Event times are invalid" }, { status: 400 });
  }

  await connectToDatabase();
  try {
    const event = await Event.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

    return NextResponse.json({ event: serializeEvent(event) });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "An event with this meet room already exists" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  await connectToDatabase();
  const event = await Event.findByIdAndDelete(id);
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });
  await Registration.deleteMany({ eventId: id });

  return NextResponse.json({ message: "Event deleted" });
}
