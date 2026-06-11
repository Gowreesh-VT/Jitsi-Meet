"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface MeetEmbedProps {
  embedUrl: string;
  onLeave: () => void;
}

export const MeetEmbed: React.FC<MeetEmbedProps> = ({ embedUrl, onLeave }) => {
  // Prevent scrolling on the body while the meeting is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("meet-state-change", { detail: { active: true } }));

    return () => {
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("meet-state-change", { detail: { active: false } }));
    };
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex flex-col w-screen h-screen">
      <iframe
        src={embedUrl}
        className="w-full h-full border-none flex-1"
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        allowFullScreen={true}
      />
      <button
        onClick={onLeave}
        className="absolute top-4 right-4 z-[101] rounded-full bg-red-600 p-2 text-white shadow-lg hover:bg-red-700 transition-colors focus:outline-none"
        title="Leave Meeting"
      >
        <X size={24} />
      </button>
    </div>,
    document.body
  );
};
