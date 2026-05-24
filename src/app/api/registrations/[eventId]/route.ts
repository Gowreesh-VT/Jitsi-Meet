import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration, { type RegistrationDocument } from "@/models/Registration";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { eventId } = await params;
  if (!isValidObjectId(eventId)) return NextResponse.json({ message: "Event not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  }

  await connectToDatabase();
  const filter = session.user.role === "admin" ? { eventId } : { eventId, userId: session.user.id };
  const registrations = await Registration.find(filter).populate("userId", "name email image").sort({ registeredAt: 1 });

  const isPopulatedUser = (value: unknown): value is { _id: unknown; name?: string; email?: string; image?: string } => {
    return !!value && typeof value === "object" && "email" in value;
  };

  return NextResponse.json({
    registrations: registrations.map((registration) => {
      const reg = registration as unknown as RegistrationDocument;
      return {
        _id: String(reg._id),
        eventId: String(reg.eventId),
        userId: String(reg.userId?._id ?? reg.userId),
        user: isPopulatedUser(reg.userId) ? reg.userId : undefined,
        mobileNumber: reg.mobileNumber,
        registrationNumber: reg.registrationNumber,
        schoolCollegeName: reg.schoolCollegeName,
        institutionType: reg.institutionType,
        grade: reg.grade,
        year: reg.year,
        registeredAt: reg.registeredAt?.toISOString(),
        meetHistory: reg.meetHistory,
      };
    }),
  });
}
