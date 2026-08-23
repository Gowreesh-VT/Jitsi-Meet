"use client";

import * as React from "react";
import {
  Play,
  Pause,
  ExternalLink,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  UserCheck,
  GraduationCap,
  CheckCircle2,
  Video,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_EXTERNAL_VIDEO_URL =
  "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKE2bXSLwgYcRAmMyfEpLrHOuvq6PXtIDkh8CKT";
const DEFAULT_INTERNAL_VIDEO_URL =
  "https://h8z6stjynz.ufs.sh/f/nEev6VX4XfKEltVDvmUmuIWeFadG1QP8jwZAfYKCcb4pk30y";

interface CertificateInstructionVideoProps {
  externalVideoUrl?: string;
  internalVideoUrl?: string;
  registrationUrl?: string;
  className?: string;
}

interface CustomVideoPlayerProps {
  src: string;
  activeTab: "external" | "internal";
}

function CustomVideoPlayer({ src, activeTab }: CustomVideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds < 0) return "00:00";
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl group select-none"
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-contain bg-black cursor-pointer"
      />

      {/* Top Badges Overlay */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full max-w-[70%] sm:max-w-none">
          <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                activeTab === "external" ? "bg-[#ffafd5]" : "bg-[#38b6ff]"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 ${
                activeTab === "external" ? "bg-[#ffafd5]" : "bg-[#38b6ff]"
              }`}
            />
          </span>
          <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider sm:tracking-widest text-white uppercase flex items-center gap-1 truncate">
            <Video className="h-3 w-3 text-white/80 shrink-0" />
            <span className="truncate">{activeTab === "external" ? "EXTERNAL PARTICIPANT GUIDE" : "INTERNAL PARTICIPANT GUIDE"}</span>
          </span>
        </div>

        <div className="bg-black/80 backdrop-blur-md border border-white/15 px-2 py-1 sm:px-3 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-mono text-white/80 shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Center Big Play/Pause Button overlay when paused */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-[2px] cursor-pointer transition-opacity"
          onClick={togglePlay}
        >
          <div className="relative flex items-center justify-center group-hover:scale-110 transition-transform">
            <div
              className={`absolute h-20 w-20 rounded-full animate-ping ${
                activeTab === "external" ? "bg-[#ffafd5]/20" : "bg-[#38b6ff]/20"
              }`}
            />
            <div
              className={`relative h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center ${
                activeTab === "external"
                  ? "bg-[#ffafd5] text-black shadow-[0_0_30px_rgba(255,175,213,0.6)]"
                  : "bg-[#38b6ff] text-black shadow-[0_0_30px_rgba(56,182,255,0.6)]"
              }`}
            >
              <Play className="h-8 w-8 md:h-10 md:w-10 fill-black translate-x-0.5" />
            </div>
          </div>
          <p className="mt-4 text-xs font-mono font-bold text-white uppercase tracking-widest drop-shadow-md">
            Click to Play Video
          </p>
        </div>
      )}

      {/* Custom Dynamic Control Bar at Bottom */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-3 md:p-4 z-20 flex flex-col gap-2 opacity-95 group-hover:opacity-100 transition-opacity">
        {/* Interactive Dynamic Progress Bar */}
        <div
          className="w-full h-3 flex items-center cursor-pointer group/timeline py-1"
          onClick={handleSeek}
        >
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden relative group-hover/timeline:h-2 transition-all">
            <div
              className={`h-full rounded-full relative transition-all duration-75 ${
                activeTab === "external"
                  ? "bg-gradient-to-r from-[#ffafd5] to-[#f94db4]"
                  : "bg-gradient-to-r from-[#38b6ff] to-[#0070f3]"
              }`}
              style={{ width: `${progressPercent}%` }}
            >
              <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md ${
                  activeTab === "external" ? "shadow-[#ffafd5]" : "shadow-[#38b6ff]"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-xs font-mono">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 hover:text-[#ffafd5] transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white" />}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1 hover:text-[#ffafd5] transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <span className="text-[11px] font-mono text-white/80">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] border border-white/20 px-1.5 py-0.5 rounded text-white/70 font-bold">
              HD
            </span>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 hover:text-[#ffafd5] transition-colors cursor-pointer"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertificateInstructionVideo({
  externalVideoUrl = DEFAULT_EXTERNAL_VIDEO_URL,
  internalVideoUrl = DEFAULT_INTERNAL_VIDEO_URL,
  registrationUrl = "https://eventhubcc.vit.ac.in/EventHub/",
  className = "",
}: CertificateInstructionVideoProps) {
  const [activeTab, setActiveTab] = React.useState<"external" | "internal">("external");
  const [showNotice, setShowNotice] = React.useState<string | null>(null);

  const handlePlayClick = (type: "external" | "internal") => {
    const text = type === "external" 
      ? "External Participant instruction video will be uploaded soon!" 
      : "Internal (VIT) Participant instruction video will be uploaded soon!";
    setShowNotice(text);
    setTimeout(() => setShowNotice(null), 4000);
  };

  const isYouTube = (url?: string) => {
    if (!url) return false;
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    if (url.includes("youtube.com/embed/")) return url;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    return url;
  };

  const externalSteps = [
    "Open the VIT Event Hub website (click the button above or visit eventhubcc.vit.ac.in).",
    "Select the event you want to participate in and click Yes / Register.",
    "Fill in your details: Name, Email ID, WhatsApp Number, College Name, and Password.",
    "Click Sign Up.",
    "Open the verification email sent to your inbox.",
    "Click the verification link (or use the verification button) to activate your account.",
    "Return to the website and log in using your registered email and password.",
    "Search for your event and open it.",
    "Click Register for the event.",
    "A confirmation message will appear indicating that your registration was successful.",
  ];

  const internalSteps = [
    "Open the VIT Event Hub website (click the button above or visit eventhubcc.vit.ac.in).",
    "Sign in using your VTOP credentials.",
    "Browse and select the event you want to participate in.",
    "Click Register.",
    "Review your student details (if prompted) and confirm your registration.",
    "A confirmation message will appear once your registration is successful.",
  ];

  const currentVideoUrl = activeTab === "external" ? externalVideoUrl : internalVideoUrl;
  const isYt = isYouTube(currentVideoUrl);
  const currentEmbedUrl = isYt ? getEmbedUrl(currentVideoUrl) : null;

  return (
    <div className={`w-full max-w-4xl mx-auto mt-12 space-y-6 ${className}`}>
      {/* Container Box */}
      <div className="relative overflow-hidden rounded-3xl border border-[#ffafd5]/25 bg-black/60 p-6 md:p-8 backdrop-blur-md shadow-[0_0_40px_rgba(255,175,213,0.1)]">
        {/* Glow accents in background */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#ffafd5]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#38b6ff]/10 blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-[#ffafd5] text-[11px] sm:text-xs font-mono font-bold tracking-widest uppercase mb-1">
              <Sparkles className="h-4 w-4 shrink-0" />
              Certificate Portal & Video Guides
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-wide uppercase leading-snug">
              Registration & Certificate Instruction Videos
            </h3>
            <p className="text-xs md:text-sm text-arcade-muted mt-1 leading-relaxed max-w-2xl">
              Select your category below to watch the video guide and follow step-by-step registration instructions for your official certificate.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Button
              asChild
              className="arcade-btn w-full md:w-auto px-5 py-3 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-[1.03] transition-transform shadow-[0_0_20px_rgba(249,77,180,0.35)] cursor-pointer"
            >
              <a href={registrationUrl} target="_blank" rel="noopener noreferrer">
                VIT EVENT HUB PORTAL <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
            </Button>
          </div>
        </div>

        {/* Video Selector Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 mb-6 bg-black/50 p-1.5 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("external")}
            className={`flex-1 py-2.5 px-3 sm:py-3 sm:px-4 rounded-xl font-black text-[11px] sm:text-xs md:text-sm tracking-tight sm:tracking-wider uppercase transition-all flex items-center justify-center text-center gap-2 cursor-pointer ${
              activeTab === "external"
                ? "bg-gradient-to-r from-[#ffafd5]/25 to-[#ffafd5]/10 text-[#ffafd5] border border-[#ffafd5]/50 shadow-[0_0_20px_rgba(255,175,213,0.2)]"
                : "text-arcade-muted hover:text-white border border-transparent hover:bg-white/5"
            }`}
          >
            <UserCheck className={`h-4 w-4 shrink-0 ${activeTab === "external" ? "text-[#ffafd5]" : ""}`} />
            <span>External Participant Video</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("internal")}
            className={`flex-1 py-2.5 px-3 sm:py-3 sm:px-4 rounded-xl font-black text-[11px] sm:text-xs md:text-sm tracking-tight sm:tracking-wider uppercase transition-all flex items-center justify-center text-center gap-2 cursor-pointer ${
              activeTab === "internal"
                ? "bg-gradient-to-r from-[#38b6ff]/25 to-[#38b6ff]/10 text-[#38b6ff] border border-[#38b6ff]/50 shadow-[0_0_20px_rgba(56,182,255,0.2)]"
                : "text-arcade-muted hover:text-white border border-transparent hover:bg-white/5"
            }`}
          >
            <GraduationCap className={`h-4 w-4 shrink-0 ${activeTab === "internal" ? "text-[#38b6ff]" : ""}`} />
            <span>Internal Participant Video</span>
          </button>
        </div>

        {/* Video Player Container */}
        {currentVideoUrl ? (
          isYt && currentEmbedUrl ? (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
              <iframe
                key={currentEmbedUrl}
                src={currentEmbedUrl}
                title={activeTab === "external" ? "External Participant Guide Video" : "Internal Participant Guide Video"}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <CustomVideoPlayer key={currentVideoUrl} src={currentVideoUrl} activeTab={activeTab} />
          )
        ) : (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl">
            <div
              className="relative w-full h-full group cursor-pointer"
              onClick={() => handlePlayClick(activeTab)}
            >
              {/* Subtle Grid pattern inside video preview */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffafd5_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/70" />

              {/* Top Badges overlay */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full">
                  <span className="relative flex h-2.5 w-2.5">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        activeTab === "external" ? "bg-[#ffafd5]" : "bg-[#38b6ff]"
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        activeTab === "external" ? "bg-[#ffafd5]" : "bg-[#38b6ff]"
                      }`}
                    ></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-white uppercase flex items-center gap-1.5">
                    <Video className="h-3 w-3 text-white/80" />
                    {activeTab === "external" ? "EXTERNAL PARTICIPANT GUIDE" : "INTERNAL PARTICIPANT GUIDE"}
                  </span>
                </div>
              </div>

              {/* Center Play Button Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`absolute h-20 w-20 rounded-full animate-ping group-hover:scale-125 transition-all ${
                      activeTab === "external" ? "bg-[#ffafd5]/20" : "bg-[#38b6ff]/20"
                    }`}
                  />
                  <div
                    className={`relative h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                      activeTab === "external"
                        ? "bg-[#ffafd5] text-black shadow-[0_0_30px_rgba(255,175,213,0.6)]"
                        : "bg-[#38b6ff] text-black shadow-[0_0_30px_rgba(56,182,255,0.6)]"
                    }`}
                  >
                    <Play className="h-8 w-8 md:h-10 md:w-10 fill-black translate-x-0.5" />
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-sm md:text-base font-bold text-white tracking-wider uppercase drop-shadow-md">
                    {activeTab === "external"
                      ? "External Participant Registration Tutorial"
                      : "Internal (VTOP) Student Registration Tutorial"}
                  </p>
                  <p
                    className={`text-[11px] font-mono tracking-widest uppercase ${
                      activeTab === "external" ? "text-[#ffafd5]" : "text-[#38b6ff]"
                    }`}
                  >
                    [ {activeTab === "external" ? "External Video Upload Pending" : "Internal Video Upload Pending"} ]
                  </p>
                </div>
              </div>

              {/* Alert Toast Notice when clicked */}
              {showNotice && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-black/90 border border-white/20 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs animate-in fade-in zoom-in-95 duration-200">
                  <Info className="h-4 w-4 text-[#ffafd5] shrink-0" />
                  <span>{showNotice}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detailed Registration Instructions */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#79f2a1]" />
              Step-By-Step Registration Instructions ({activeTab === "external" ? "External Participant" : "Internal Student"})
            </h4>
          </div>

          {/* External Instructions */}
          {activeTab === "external" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <span className="text-xs font-bold font-mono uppercase text-[#ffafd5] tracking-wider">
                    External Participant Steps
                  </span>
                  <a
                    href={registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-arcade-muted hover:text-white underline flex items-center gap-1"
                  >
                    Open Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <ol className="space-y-3">
                  {externalSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-white/90 leading-relaxed">
                      <span className="h-5 w-5 rounded-full bg-[#ffafd5]/20 text-[#ffafd5] flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Internal Instructions */}
          {activeTab === "internal" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <span className="text-xs font-bold font-mono uppercase text-[#38b6ff] tracking-wider">
                    Internal (VIT Student) Steps
                  </span>
                  <a
                    href={registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-arcade-muted hover:text-white underline flex items-center gap-1"
                  >
                    Open Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <ol className="space-y-3">
                  {internalSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-white/90 leading-relaxed">
                      <span className="h-5 w-5 rounded-full bg-[#38b6ff]/20 text-[#38b6ff] flex items-center justify-center font-bold font-mono text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
