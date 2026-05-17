import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) {
    return NextResponse.json({ profile: null }, { status: 200 });
  }

  await connectToDatabase();

  // Find the most recent registration to pull stored profile data
  const latest = await Registration.findOne({ userId: session.user.id })
    .sort({ registeredAt: -1 })
    .select("mobileNumber registrationNumber schoolCollegeName institutionType grade year");

  if (!latest) {
    return NextResponse.json({ profile: null }, { status: 200 });
  }

  return NextResponse.json({
    profile: {
      mobileNumber: latest.mobileNumber ?? "",
      registrationNumber: latest.registrationNumber ?? "",
      schoolCollegeName: latest.schoolCollegeName ?? "",
      institutionType: latest.institutionType ?? "College",
      grade: latest.grade ?? "",
      year: latest.year ?? "",
    },
  });
}
