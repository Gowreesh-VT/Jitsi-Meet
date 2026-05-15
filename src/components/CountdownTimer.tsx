"use client";

import * as React from "react";

function getTimeLeft(target: string) {
  const total = Math.max(0, new Date(target).getTime() - Date.now());
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  return { total, days, hours, minutes, seconds };
}

export function CountdownTimer({ target, compact = false }: { target: string; compact?: boolean }) {
  const [timeLeft, setTimeLeft] = React.useState<ReturnType<typeof getTimeLeft> | null>(null);

  React.useEffect(() => {
    const interval = window.setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => window.clearInterval(interval);
  }, [target]);

  if (!timeLeft) return <span>Calculating...</span>;
  if (timeLeft.total <= 0) return <span>Starting now</span>;

  const units = compact
    ? [`${timeLeft.days}d`, `${timeLeft.hours}h`, `${timeLeft.minutes}m`]
    : [`${timeLeft.days} days`, `${timeLeft.hours} hours`, `${timeLeft.minutes} minutes`, `${timeLeft.seconds} seconds`];

  return <span>{units.join(" ")}</span>;
}
