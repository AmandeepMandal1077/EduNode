import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src?: string;
  title?: string;
  duration?: number; // seconds – used only as fallback when metadata not yet loaded
  onProgress?: (seconds: number) => void;
  initialProgress?: number;
  className?: string;
}

export function VideoPlayer({
  src,
  title,
  duration: durationProp = 1200,
  onProgress,
  initialProgress = 0,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [duration, setDuration] = useState(durationProp);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Sync duration once metadata is available ────────────────────────────────
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.duration && isFinite(v.duration)) setDuration(v.duration);
    if (initialProgress > 0) v.currentTime = initialProgress;
  };

  // ── Sync progress as video plays ────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setProgress(v.currentTime);
    onProgress?.(v.currentTime);
  }, [onProgress]);

  // ── Keep volume in sync ─────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = muted ? 0 : volume / 100;
    v.muted = muted;
  }, [volume, muted]);

  // ── Reset when src changes ───────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    setProgress(0);
    setIsPlaying(false);
    v.load();
  }, [src]);

  // ── Fullscreen listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // ── Controls ─────────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const skip = (secs: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + secs, duration));
  };

  const handleSeek = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = val;
    setProgress(val);
    onProgress?.(val);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

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

  const hasHeightClass = className?.includes("h-");
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full bg-black rounded-2xl overflow-hidden select-none",
        !hasHeightClass && "aspect-video",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* ── Real <video> element ─────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 w-full h-full object-contain cursor-pointer"
        playsInline
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      {/* Fallback overlay when no src is provided */}
      {!src && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e293b 100%)" }}
          onClick={togglePlay}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative z-10 w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Big play indicator when paused on a real video */}
      {src && !isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur flex items-center justify-center border border-white/30">
            <Play className="w-7 h-7 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Heatmap injection point */}
      <div
        id="heatmap-container"
        className="heatmap-container absolute bottom-12 left-0 right-0 h-1.5 pointer-events-none"
        aria-hidden="true"
      />

      {/* ── Controls overlay ─────────────────────────────────────────────────── */}
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
        {/* Title */}
        {title && (
          <p className="text-white/70 text-sm font-medium truncate mb-1">{title}</p>
        )}

        {/* Progress bar */}
        <input
          type="range"
          className="video-progress mb-2"
          min={0}
          max={duration}
          step={0.5}
          value={progress}
          onChange={(e) => handleSeek(Number(e.target.value))}
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${pct}%, rgba(255,255,255,0.25) ${pct}%, rgba(255,255,255,0.25) 100%)`,
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
