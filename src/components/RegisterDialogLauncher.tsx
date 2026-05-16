"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { RegisterDialog } from "@/components/RegisterDialog";
import { Button } from "@/components/ui/button";
import type { SerializedEvent } from "@/lib/events";

export function RegisterDialogLauncher({
  event,
  isRegistered,
  isVitStudent,
}: {
  event: SerializedEvent;
  isRegistered: boolean;
  isVitStudent: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [registered, setRegistered] = React.useState(isRegistered);

  return (
    <>
      <Button className="w-full arcade-btn gap-2" disabled={registered} onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" />
        {registered ? "REGISTERED" : "REGISTER NOW"}
      </Button>
      <RegisterDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        eventId={event._id}
        eventTitle={event.title}
        isVitStudent={isVitStudent}
        onSuccess={() => {
          setRegistered(true);
          setOpen(false);
        }}
      />
    </>
  );
}
