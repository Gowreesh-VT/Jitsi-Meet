"use client";

import * as React from "react";
import type { EventStatus } from "@/lib/events";

export function StartsSoonBanner({ startTime, status }: { startTime: string; status: EventStatus }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    function refresh() {
      const startsInMs = new Date(startTime).getTime() - Date.now();
      setVisible(status === "Upcoming" && startsInMs > 0 && startsInMs <= 15 * 60_000);
    }

    refresh();
    const interval = window.setInterval(refresh, 30_000);
    return () => window.clearInterval(interval);
  }, [startTime, status]);

  if (!visible) return null;

  return (
    <div className="mt-8 rounded-md border border-[#fbbc04]/40 bg-[#fbbc04]/10 p-4 text-sm font-bold text-[#fbbc04]">
      This event starts in less than 15 minutes. Keep your registration ready.
    </div>
  );
}
