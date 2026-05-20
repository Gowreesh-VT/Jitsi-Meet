import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
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

  const { eventId, mobileNumber, registrationNumber, schoolCollegeName, institutionType, grade, year } = await request.json();
  if (!eventId) return NextResponse.json({ message: "eventId is required" }, { status: 400 });
  if (!isValidObjectId(eventId)) return NextResponse.json({ message: "Event not found" }, { status: 404 });
  if (institutionType !== "College" && institutionType !== "School") {
    return NextResponse.json({ message: "Please select school or college." }, { status: 400 });
  }

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

  // Validate grade for school registrations
  if (institutionType === "School" && !grade) {
    return NextResponse.json({ message: "Please provide your grade." }, { status: 400 });
  }
  if (institutionType === "School" && !["10th", "11th", "12th"].includes(grade)) {
    return NextResponse.json({ message: "Please select a valid grade." }, { status: 400 });
  }

  if (institutionType === "College" && !year) {
    return NextResponse.json({ message: "Please provide your college year." }, { status: 400 });
  }
  if (institutionType === "College" && !["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"].includes(year)) {
    return NextResponse.json({ message: "Please select a valid college year." }, { status: 400 });
  }

  await connectToDatabase();
  const event = await Event.findOne({ _id: eventId, isPublished: true });
  if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });
  const currentStatus = getStatus(event.startTime, event.endTime, event.statusOverride);
  if (currentStatus !== "Upcoming" && currentStatus !== "Live") {
    return NextResponse.json({ message: "Registration is only open before or during the event" }, { status: 400 });
  }

  try {
    const registration = await Registration.create({
      eventId,
      userId: session.user.id,
      mobileNumber: profileSubmission.mobileNumber,
      registrationNumber: profileSubmission.registrationNumber,
      schoolCollegeName: profileSubmission.schoolCollegeName,
      institutionType,
      grade,
      year,
    });
    return NextResponse.json({ registration: { eventId: String(registration.eventId) } }, { status: 201 });
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "Already registered" }, { status: 200 });
    }
    throw error;
  }
}
