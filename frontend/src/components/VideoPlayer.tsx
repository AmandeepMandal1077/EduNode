import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  title?: string;
  duration?: number; // seconds
  onProgress?: (seconds: number) => void;
  initialProgress?: number;
  className?: string;
}

export function VideoPlayer({
  title,
  duration = 1200,
  onProgress,
  initialProgress = 0,
  className,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [showControls, setShowControls] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = Math.min(prev + 1, duration);
          onProgress?.(next);
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, duration, onProgress]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => setIsPlaying((p) => !p);
  const skip = (secs: number) => setProgress((p) => Math.max(0, Math.min(p + secs, duration)));

  // If the caller passes a height class (h-full, h-[...]) we fill the container.
  // Otherwise fall back to 16/9 aspect ratio so it works standalone too.
  const hasHeightClass = className?.includes("h-");

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-slate-900 rounded-2xl overflow-hidden select-none",
        !hasHeightClass && "aspect-video",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Simulated video canvas */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={togglePlay}
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e293b 100%)",
        }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Play indicator */}
        {!isPlaying && (
          <div className="relative z-10 w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        )}
        {title && (
          <div
            className={cn(
              "absolute bottom-20 left-0 right-0 px-6 transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0"
            )}
          >
            <p className="text-white/70 text-sm font-medium truncate">{title}</p>
          </div>
        )}
      </div>

      {/* Heatmap injection point */}
      <div
        id="heatmap-container"
        className="heatmap-container absolute bottom-12 left-0 right-0 h-1.5 pointer-events-none"
        aria-hidden="true"
      />

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
          padding: "0.75rem 1.25rem 1rem",
        }}
      >
        {/* Progress bar */}
        <input
          type="range"
          className="video-progress mb-2"
          min={0}
          max={duration}
          value={progress}
          onChange={(e) => {
            const val = Number(e.target.value);
            setProgress(val);
            onProgress?.(val);
          }}
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${(progress / duration) * 100}%, rgba(255,255,255,0.25) ${(progress / duration) * 100}%, rgba(255,255,255,0.25) 100%)`,
          }}
        />

        {/* Control row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => skip(-10)}
              className="text-white/80 hover:text-white transition-colors p-1 rounded"
              aria-label="Rewind 10 seconds"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="text-white hover:text-indigo-300 transition-colors p-1 rounded"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>
            <button
              onClick={() => skip(10)}
              className="text-white/80 hover:text-white transition-colors p-1 rounded"
              aria-label="Skip 10 seconds"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <span className="text-white/70 text-xs font-mono ml-1">
              {formatTime(progress)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMuted((m) => !m)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                className="w-16 h-1 accent-indigo-500"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setMuted(false);
                }}
                aria-label="Volume"
              />
            </div>
            <button
              onClick={toggleFullscreen}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
