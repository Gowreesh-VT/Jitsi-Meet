import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AdminClient } from "@/components/AdminClient";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeEvent } from "@/lib/events";
import Event from "@/models/Event";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  await connectToDatabase();
  const events = await Event.find({}).sort({ startTime: 1 });
  const headerList = headers();
  const host = (await headerList).get("host");
  const protocol =  (await headerList).get("x-forwarded-proto") ?? "http";
  const baseUrl = host ? `${protocol}://${host}` : "";
  const statsResponse = await fetch(`${baseUrl}/api/stats`, { cache: "no-store" });
  const statsData = statsResponse.ok ? await statsResponse.json() : null;
  const totalRegistrations = statsData?.totalRegistrations ?? 0;
  const registrationsToday = statsData?.registrationsToday ?? 0;
  const registrationsThisWeek = statsData?.registrationsThisWeek ?? 0;
  const totalUsers = statsData?.totalUsers ?? 0;
  const totalHackathonRegistrations = statsData?.totalHackathonRegistrations ?? 0;
  const registrationCounts = statsData?.registrationCounts ?? {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AdminClient
        initialEvents={events.map(serializeEvent)}
        totalRegistrations={totalRegistrations}
        registrationsToday={registrationsToday}
        registrationsThisWeek={registrationsThisWeek}
        totalUsers={totalUsers}
        totalHackathonRegistrations={totalHackathonRegistrations}
        registrationCounts={registrationCounts}
      />
    </div>
  );
}
