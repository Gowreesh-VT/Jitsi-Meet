"use client";

import React, { useEffect, useRef } from "react";

interface JitsiMeetProps {
  roomName: string;
  userName: string;
  userEmail: string;
  onLeave: () => void;
}

interface JitsiApi {
  addEventListeners: (listeners: Record<string, () => void>) => void;
  dispose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: unknown) => JitsiApi;
  }
}

const JitsiMeet: React.FC<JitsiMeetProps> = ({
  roomName,
  userName,
  userEmail,
  onLeave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiApi | null>(null);

  useEffect(() => {
    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.microsoftinnovations.club";
    const loadScript = () => {
      return new Promise((resolve) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = `https://${domain}/external_api.js`;
        script.async = true;
        script.onload = () => resolve(true);
        document.head.appendChild(script);
      });
    };

    const initMeet = async () => {
      await loadScript();
      if (!containerRef.current) return;

      const options = {
        roomName: roomName,
        width: "100%",
        height: "100%",
        parentNode: containerRef.current,
        userInfo: {
          email: userEmail,
          displayName: userName,
        },
        interfaceConfigOverwrite: {
          // Add any interface customizations here
          SHOW_JITSI_WATERMARK: false,
          GENERATE_ROOMNAMES_ON_WELCOME_PAGE: false,
        },
        configOverwrite: {
          startWithAudioMuted: true,
          disableDeepLinking: true,
        },
      };

      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addEventListeners({
        readyToClose: () => {
          onLeave();
        },
        videoConferenceLeft: () => {
          onLeave();
        },
      });
    };

    initMeet();

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [roomName, userName, userEmail, onLeave]);

  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <div ref={containerRef} className="h-full w-full" />
      <button
        onClick={onLeave}
        className="absolute top-4 right-4 z-[101] rounded-full bg-red-600 p-2 text-white shadow-lg hover:bg-red-700 transition-colors"
        title="Leave Meeting"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
};

export default JitsiMeet;
