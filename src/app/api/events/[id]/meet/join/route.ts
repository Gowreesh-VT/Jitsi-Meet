
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = id; // Keep local variable as eventId to minimize changes below if needed, or just change all.
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const registration = await Registration.findOne({
      eventId,
      userId: session.user.id,
    });

    if (!registration) {
      return NextResponse.json({ error: "Not registered" }, { status: 403 });
    }

    return NextResponse.json({ registered: true });
  } catch (error) {
    console.error("Check registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = id;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const registration = await Registration.findOne({
      eventId,
      userId: session.user.id,
    });

    if (!registration) {
      return NextResponse.json({ error: "Not registered" }, { status: 403 });
    }

    // Add join record
    registration.meetHistory.push({
      joinedAt: new Date(),
    });
    await registration.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Join meet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
