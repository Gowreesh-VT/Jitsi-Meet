"use client";

import { useCallback, useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { tourSteps } from "@/constants/tourSteps";
import { Button } from "@/components/ui/button";
import { Tour, hasCompletedTour } from "@/components/Tour";

export function HomeTour() {
  const [runTour, setRunTour] = useState<boolean>(false);
  const [hasSeenTour, setHasSeenTour] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const completedTour = hasCompletedTour();

      setHasSeenTour(completedTour);
      setRunTour(!completedTour);
      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleFinish = useCallback((): void => {
    setRunTour(false);
    setHasSeenTour(true);
  }, []);

  const handleRestart = useCallback((): void => {
    setRunTour(false);
    window.setTimeout(() => {
      setRunTour(true);
    }, 0);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <Tour steps={tourSteps} run={runTour} onFinish={handleFinish} />

      {hasSeenTour && !runTour ? (
        <Button
          className="fixed bottom-5 right-5 z-30 border border-[#ffafd5]/35 bg-[#111827]/95 text-white shadow-[0_16px_48px_rgba(0,0,0,0.35)] hover:bg-[#1f2937]"
          onClick={handleRestart}
          type="button"
        >
          <HelpCircle className="h-4 w-4" />
          Take a Tour
        </Button>
      ) : null}
    </>
  );
}
