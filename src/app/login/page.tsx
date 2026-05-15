import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginCard } from "@/components/LoginCard";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/schedule");

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-12">
      <LoginCard />
    </div>
  );
}
