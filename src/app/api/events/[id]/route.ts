import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { DOMAINS, EVENT_TYPES, serializeEvent } from "@/lib/events";
import Event from "@/models/Event";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  await connectToDatabase();
  const event = await Event.findById(id);
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  return NextResponse.json({ event: serializeEvent(event) });
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();
  if (body.domain && !DOMAINS.includes(body.domain)) return NextResponse.json({ message: "Invalid domain" }, { status: 400 });
  if (body.type && !EVENT_TYPES.includes(body.type)) return NextResponse.json({ message: "Invalid event type" }, { status: 400 });

  const update = {
    title: body.title,
    domain: body.domain,
    type: body.type,
    startTime: body.startTime ? new Date(body.startTime) : undefined,
    endTime: body.endTime ? new Date(body.endTime) : undefined,
    roomName: body.roomName,
    isPublished: typeof body.isPublished === "boolean" ? body.isPublished : undefined,
  };

  if (update.startTime && update.endTime && update.startTime >= update.endTime) {
    return NextResponse.json({ message: "Event times are invalid" }, { status: 400 });
  }

  await connectToDatabase();
  const event = await Event.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  return NextResponse.json({ event: serializeEvent(event) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "admin") {
    return NextResponse.json({ message: "Admin access required" }, { status: 403 });
  }

  await connectToDatabase();
  const event = await Event.findByIdAndDelete(id);
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  return NextResponse.json({ message: "Event deleted" });
}
