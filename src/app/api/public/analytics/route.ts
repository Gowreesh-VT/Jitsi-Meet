import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { checkApiAuth } from "@/lib/api-auth";
import Registration from "@/models/Registration";
import Event from "@/models/Event"; // Import to ensure schema registration

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkApiAuth(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const [domainResults, institutionResults] = await Promise.all([
      Registration.aggregate([
        {
          $lookup: {
            from: "events",
            localField: "eventId",
            foreignField: "_id",
            as: "event",
          },
        },
        { $unwind: "$event" },
        {
          $group: {
            _id: "$event.domain",
            count: { $sum: 1 },
          },
        },
      ]),
      Registration.aggregate([
        {
          $group: {
            _id: "$institutionType",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const domainBreakdown: Record<string, number> = {
      "AI/ML": 0,
      "CP": 0,
      "UI/UX": 0,
      "CyberSec": 0,
      "Dev": 0,
      "Hackathon": 0,
      "MLSA": 0,
    };

    const institutionBreakdown: Record<string, number> = {
      "College": 0,
      "School": 0,
    };

    domainResults.forEach((item) => {
      if (item._id && item._id in domainBreakdown) {
        domainBreakdown[item._id] = item.count;
      }
    });

    institutionResults.forEach((item) => {
      if (item._id && item._id in institutionBreakdown) {
        institutionBreakdown[item._id] = item.count;
      }
    });

    return NextResponse.json({
      domainBreakdown,
      institutionBreakdown,
    });
  } catch (error: any) {
    console.error("Error generating analytics:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
