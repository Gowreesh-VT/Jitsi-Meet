"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import {
  ACTIONS,
  EVENTS,
  STATUS,
  type EventData,
  type Props as JoyrideProps,
  type Status,
  type Step,
  type Styles,
} from "react-joyride";

const Joyride = dynamic<JoyrideProps>(
  () => import("react-joyride").then((mod) => mod.Joyride),
  {
    ssr: false,
  },
);

export const TOUR_COMPLETED_STORAGE_KEY = "guided-tour-completed";

export type TourProps = {
  steps: Step[];
  run: boolean;
  onFinish: () => void;
  storageKey?: string;
};

export const tourStyles: Partial<Styles> = {
  tooltip: {
    border: "1px solid rgba(255, 175, 213, 0.35)",
    borderRadius: 8,
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.42)",
    padding: 20,
  },
  tooltipContainer: {
    lineHeight: 1.6,
    textAlign: "left",
  },
  tooltipTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1.2,
    margin: "0 0 10px",
  },
  tooltipContent: {
    color: "#dbeafe",
    fontSize: 14,
    padding: "8px 0 18px",
  },
  tooltipFooter: {
    alignItems: "center",
    display: "flex",
    gap: 10,
    marginTop: 4,
  },
  buttonBack: {
    borderRadius: 6,
    color: "#cbd5e1",
    marginRight: 8,
  },
  buttonPrimary: {
    background: "linear-gradient(135deg, #ffafd5 0%, #79f2a1 100%)",
    border: 0,
    borderRadius: 6,
    color: "#111827",
    fontWeight: 800,
    padding: "10px 16px",
  },
  buttonSkip: {
    borderRadius: 6,
    color: "#93c5fd",
    fontWeight: 700,
  },
  spotlight: {
    stroke: "rgba(255, 175, 213, 0.9)",
    strokeWidth: 3,
  },
};

const completedStatuses: Status[] = [STATUS.FINISHED, STATUS.SKIPPED];

export function canUseLocalStorage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const testKey = "__joyride_storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function hasCompletedTour(
  storageKey: string = TOUR_COMPLETED_STORAGE_KEY,
): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  return window.localStorage.getItem(storageKey) === "true";
}

export function saveTourCompletion(
  storageKey: string = TOUR_COMPLETED_STORAGE_KEY,
): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, "true");
}

export function Tour({
  steps,
  run,
  onFinish,
  storageKey = TOUR_COMPLETED_STORAGE_KEY,
}: TourProps) {
  const [stepIndex, setStepIndex] = useState<number>(0);

  const handleJoyrideEvent = useCallback(
    (data: EventData): void => {
      const { action, index, status, type } = data;

      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
        setStepIndex(Math.max(0, nextStepIndex));
      }

      if (completedStatuses.includes(status)) {
        saveTourCompletion(storageKey);
        setStepIndex(0);
        onFinish();
      }
    },
    [onFinish, storageKey],
  );

  return (
    <Joyride
      continuous
      onEvent={handleJoyrideEvent}
      options={{
        arrowColor: "#111827",
        backgroundColor: "#111827",
        buttons: ["back", "skip", "primary"],
        closeButtonAction: "skip",
        overlayClickAction: false,
        overlayColor: "rgba(3, 7, 18, 0.72)",
        primaryColor: "#ffafd5",
        scrollDuration: 450,
        scrollOffset: 96,
        showProgress: true,
        skipBeacon: true,
        spotlightPadding: 12,
        spotlightRadius: 8,
        targetWaitTimeout: 1500,
        textColor: "#f8fafc",
        width: 420,
        zIndex: 10000,
      }}
      run={run}
      scrollToFirstStep
      stepIndex={stepIndex}
      steps={steps}
      styles={tourStyles}
      locale={{
        back: "Back",
        close: "Close",
        last: "Done",
        next: "Next",
        nextWithProgress: "Next (Step {current} of {total})",
        open: "Open the tour",
        skip: "Skip",
      }}
    />
  );
}
