import { NextResponse } from "next/server";
import type { PipelineStage } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Registration from "@/models/Registration";

export async function GET(request: Request) {
  const hardcodedKey = "I_AM_IRON_MAN_THANOS_CANNOT_STOP_ME";
  const apiKey = request.headers.get("x-api-key");
  const envKey = process.env.PUBLIC_EXPORT_KEY;
  const isAuthorized = Boolean(
    apiKey && ((envKey && apiKey === envKey) || (hardcodedKey && apiKey === hardcodedKey))
  );
  if (!isAuthorized) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "events",
        localField: "eventId",
        foreignField: "_id",
        as: "event",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        eventId: 1,
        userId: 1,

        userName: "$user.name",
        userEmail: "$user.email",
        userCreatedAt: "$user.createdAt",

        eventName: "$event.title",
        eventDomain: "$event.domain",
        eventType: "$event.type",
        eventStartTime: "$event.startTime",
        eventEndTime: "$event.endTime",
        eventRoomName: "$event.roomName",

        mobileNumber: 1,
        mobileCountry: 1,
        registrationNumber: 1,
        schoolCollegeName: 1,
        institutionType: 1,
        grade: 1,
        year: 1,
        registeredAt: 1,
      },
    },
    { $sort: { registeredAt: -1 } },
  ];

  const data = await Registration.aggregate(pipeline);
  return NextResponse.json({ data });
}