import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/AdminClient";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { serializeEvent } from "@/lib/events";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.id) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  await connectToDatabase();
  const events = await Event.find({}).sort({ startTime: 1 });
  const totalRegistrations = await Registration.countDocuments();
  const totalUsers = await User.countDocuments();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <AdminClient
        initialEvents={events.map(serializeEvent)}
        totalRegistrations={totalRegistrations}
        totalUsers={totalUsers}
      />
    </div>
  );
}
