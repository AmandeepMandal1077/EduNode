import { useRef, useEffect, useState, useCallback } from "react";
import {
  MediaPlayer,
  MediaProvider,
  MediaPlayerInstance,
  useMediaRemote,
  useMediaState,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { cn } from "@/lib/utils";
import { useVideoTelemetry } from "@/hooks/useVideoTelemetry";
import { LectureHeatmap } from "./LectureHeatmap";

interface VideoPlayerProps {
  src?: string;
  title?: string;
  duration?: number;
  courseId?: string;
  lectureId?: string;
  onProgress?: (seconds: number) => void;
  initialProgress?: number;
  className?: string;
}

/**
 * Internal component that uses Vidstack hooks.
 * Must be rendered as a child of <MediaPlayer> so hooks have access to player context.
 * This component renders the <MediaPlayer> itself and handles all logic via side effects.
 */
function PlayerHooks({
  src,
  initialProgress,
  onProgress,
  onVideoRef,
  onHeatmapTarget,
  onSeekingChange,
}: {
  src?: string;
  initialProgress: number;
  onProgress?: (seconds: number) => void;
  onVideoRef: (el: HTMLVideoElement | null) => void;
  onHeatmapTarget: (el: HTMLElement | null) => void;
  onSeekingChange: (seeking: boolean) => void;
}) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const remote = useMediaRemote(playerRef);
  const currentTime = useMediaState("currentTime", playerRef);

  const onProgressRef = useRef(onProgress);

  // Keep the ref in sync with the latest onProgress callback
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // Report progress via currentTime changes
  useEffect(() => {
    if (currentTime !== undefined) {
      onProgressRef.current?.(currentTime);
    }
  }, [currentTime]);

  // Seek to initial progress once metadata is loaded
  const handleLoadedMetadata = useCallback(() => {
    if (initialProgress > 0) {
      remote.seek(initialProgress);
    }
  }, [initialProgress, remote]);

  // Capture the native <video> element for telemetry
  const handleProviderSetup = useCallback(
    (provider: any) => {
      const videoEl =
        provider?.el?.() ??
        (provider instanceof HTMLVideoElement ? provider : null);
      if (videoEl instanceof HTMLVideoElement) {
        onVideoRef(videoEl);
      }
    },
    [onVideoRef],
  );

  // Find the time slider element and attach seeking listeners
  useEffect(() => {
    const el = playerRef.current?.el;
    if (!el) return;

    const findSlider = () => {
      const slider = el.querySelector(
        '[data-media-tooltip="time"], [part~="time-slider"], .vds-time-slider, [class*="time-slider"]',
      );
      onHeatmapTarget(slider as HTMLElement | null);
    };

    // Wait a tick for the layout to render
    const id = setTimeout(findSlider, 100);
    const observer = new MutationObserver(findSlider);
    observer.observe(el, { childList: true, subtree: true });

    const handleSeekStart = () => onSeekingChange(true);
    const handleSeekEnd = () => onSeekingChange(false);

    el.addEventListener("pointerdown", handleSeekStart);
    el.addEventListener("pointerup", handleSeekEnd);
    el.addEventListener("pointerleave", handleSeekEnd);
    el.addEventListener("touchstart", handleSeekStart, { passive: true });
    el.addEventListener("touchend", handleSeekEnd);

    return () => {
      clearTimeout(id);
      observer.disconnect();
      el.removeEventListener("pointerdown", handleSeekStart);
      el.removeEventListener("pointerup", handleSeekEnd);
      el.removeEventListener("pointerleave", handleSeekEnd);
      el.removeEventListener("touchstart", handleSeekStart);
      el.removeEventListener("touchend", handleSeekEnd);
    };
  }, [onHeatmapTarget, onSeekingChange]);

  return (
    <MediaPlayer
      ref={playerRef}
      src={src ?? undefined}
      crossOrigin="anonymous"
      onLoadedMetadata={handleLoadedMetadata}
      onProviderSetup={handleProviderSetup}
      className="w-full h-full"
    >
      <MediaProvider />
      <DefaultVideoLayout
        icons={defaultLayoutIcons}
        playbackRates={[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]}
        noScrubGesture={false}
      />
    </MediaPlayer>
  );
}

export function VideoPlayer({
  src,
  title: _title,
  duration: durationProp = 1200,
  courseId,
  lectureId,
  onProgress,
  initialProgress = 0,
  className,
}: VideoPlayerProps) {
  const telemetryVideoRef = useRef<HTMLVideoElement | null>(null);
  const [heatmapTarget, setHeatmapTarget] = useState<HTMLElement | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  useVideoTelemetry({
    courseId,
    lectureId,
    duration: durationProp,
    videoRef: telemetryVideoRef,
  });

  const handleVideoRef = useCallback((el: HTMLVideoElement | null) => {
    telemetryVideoRef.current = el;
  }, []);

  const hasHeightClass = className?.includes("h-");

  return (
    <div
      className={cn(
        "relative w-full bg-black rounded-2xl overflow-hidden",
        !hasHeightClass && "aspect-video",
        className,
      )}
    >
      <PlayerHooks
        src={src}
        initialProgress={initialProgress}
        onProgress={onProgress}
        onVideoRef={handleVideoRef}
        onHeatmapTarget={setHeatmapTarget}
        onSeekingChange={setIsSeeking}
      />

      {lectureId && heatmapTarget && isSeeking && (
        <HeatmapOverlay target={heatmapTarget} lectureId={lectureId} />
      )}
    </div>
  );
}

function HeatmapOverlay({
  target,
  lectureId,
}: {
  target: HTMLElement;
  lectureId: string;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const parentEl = containerRef.current?.parentElement;
      if (!parentEl || !target) return;

      const parentRect = parentEl.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      setStyle({
        position: "absolute",
        left: targetRect.left - parentRect.left,
        width: targetRect.width,
        bottom: parentRect.height - (targetRect.top - parentRect.top),
        height: 24,
        pointerEvents: "none",
        zIndex: 10,
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(target);

    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={containerRef} style={style}>
      <LectureHeatmap lectureId={lectureId} />
    </div>
  );
}
