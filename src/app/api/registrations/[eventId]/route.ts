import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  }

  await connectToDatabase();
  const filter = session.user.role === "admin" ? { eventId } : { eventId, userId: session.user.id };
  const registrations = await Registration.find(filter).populate("userId", "name email image").sort({ registeredAt: 1 });

  return NextResponse.json({
    registrations: registrations.map((registration) => ({
      _id: String(registration._id),
      eventId: String(registration.eventId),
      userId: String(registration.userId?._id ?? registration.userId),
      user: typeof registration.userId === "object" && "email" in registration.userId ? registration.userId : undefined,
      mobileNumber: registration.mobileNumber,
      registrationNumber: registration.registrationNumber,
      schoolCollegeName: registration.schoolCollegeName,
      registeredAt: registration.registeredAt?.toISOString(),
    })),
  });
}
