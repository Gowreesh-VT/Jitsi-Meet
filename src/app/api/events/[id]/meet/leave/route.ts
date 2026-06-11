import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

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

    // Find the last history entry that doesn't have a leftAt
    const lastEntry = registration.meetHistory
      .filter((entry: { joinedAt?: Date | null; leftAt?: Date | null }) => !entry.leftAt)
      .pop();

    if (lastEntry) {
      lastEntry.leftAt = new Date();
    } else if (registration.meetHistory.length > 0) {
      // If all have leftAt, just update the very last one anyway or leave it?
      // Better to just ensure we have one.
      registration.meetHistory[registration.meetHistory.length - 1].leftAt = new Date();
    }

    await registration.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leave meet error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
