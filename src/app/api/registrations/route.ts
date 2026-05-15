import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getStatus } from "@/lib/events";
import { buildProfileSubmission } from "@/lib/profile";
import Event from "@/models/Event";
import Registration from "@/models/Registration";

const mobileRegex = /^[6-9]\d{9}$/;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user.id || !session.user.email) {
    return NextResponse.json({ message: "Sign in required" }, { status: 401 });
  }

  const { eventId, mobileNumber, registrationNumber, schoolCollegeName } = await request.json();
  if (!eventId) return NextResponse.json({ message: "eventId is required" }, { status: 400 });

  const profileSubmission = buildProfileSubmission({
    email: session.user.email.toLowerCase(),
    body: { mobileNumber, registrationNumber, schoolCollegeName },
  });

  if (!mobileRegex.test(profileSubmission.mobileNumber)) {
    return NextResponse.json({ message: "Please provide a valid 10-digit Indian mobile number." }, { status: 400 });
  }

  if (!profileSubmission.registrationNumber) {
    return NextResponse.json({ message: "Please provide a registration number." }, { status: 400 });
  }

  if (!profileSubmission.isVitStudent && !profileSubmission.schoolCollegeName) {
    return NextResponse.json({ message: "Please provide your school or college name." }, { status: 400 });
  }

  await connectToDatabase();
  const event = await Event.findOne({ _id: eventId, isPublished: true });
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });
  if (getStatus(event.startTime, event.endTime) !== "Upcoming") {
    return NextResponse.json({ message: "Registration is only open before the event starts" }, { status: 400 });
  }

  try {
    const registration = await Registration.create({
      eventId,
      userId: session.user.id,
      mobileNumber: profileSubmission.mobileNumber,
      registrationNumber: profileSubmission.registrationNumber,
      schoolCollegeName: profileSubmission.schoolCollegeName,
    });
    return NextResponse.json({ registration: { eventId: String(registration.eventId) } }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "Already registered" }, { status: 200 });
    }
    throw error;
  }
}
