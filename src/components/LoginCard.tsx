"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginCard() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <div className="mb-3 flex h-16 w-20 items-center justify-center rounded-lg bg-white p-2 shadow-sm ring-1 ring-border dark:bg-white/10">
          <Image src="/mic-logo.png" alt="Microsoft Innovations Club logo" width={72} height={52} priority />
        </div>
        <CardTitle>Microsoft Innovations Club</CardTitle>
        <CardDescription>Sign in to register for sessions and join live rooms.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" size="lg" onClick={() => signIn("google", { callbackUrl: "/" })}>
          <LogIn className="h-4 w-4" />
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
