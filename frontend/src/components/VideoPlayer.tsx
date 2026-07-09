import { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";
import "video.js/dist/video-js.css";
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

export function VideoPlayer({
  src,
  title,
  duration: durationProp = 1200,
  courseId,
  lectureId,
  onProgress,
  initialProgress = 0,
  className,
}: VideoPlayerProps) {
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const onProgressRef = useRef(onProgress);
  const telemetryVideoRef = useRef<HTMLVideoElement | null>(null);
  const [heatmapTarget, setHeatmapTarget] = useState<HTMLElement | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useVideoTelemetry({
    courseId,
    lectureId,
    duration: durationProp,
    videoRef: telemetryVideoRef,
  });

  useEffect(() => {
    if (!videoContainerRef.current) return;

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered");
    videoContainerRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      responsive: true,
      fluid: false,
      fill: true,
      preload: "metadata",
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
      controlBar: {
        pictureInPictureToggle: false,
      },
      sources: src ? [{ src }] : [],
    });

    const underlyingVideo = player.tech({ IWillNotUseThisInPlugins: true })?.el() as HTMLVideoElement | undefined;
    if (underlyingVideo) telemetryVideoRef.current = underlyingVideo;

    player.on("loadedmetadata", () => {
      if (initialProgress > 0) player.currentTime(initialProgress);

      const tech = player.tech({ IWillNotUseThisInPlugins: true })?.el() as HTMLVideoElement | undefined;
      if (tech) telemetryVideoRef.current = tech;
    });

    player.on("timeupdate", () => {
      const t = player.currentTime();
      if (t !== undefined) onProgressRef.current?.(t);
    });

    player.ready(() => {
      const progressControl = (player as any).controlBar?.getChild("progressControl")?.el();
      if (progressControl) {
        setHeatmapTarget(progressControl as HTMLElement);

        progressControl.addEventListener("mouseenter", () => setIsSeeking(true));
        progressControl.addEventListener("mouseleave", () => setIsSeeking(false));
        progressControl.addEventListener("touchstart", () => setIsSeeking(true));
        progressControl.addEventListener("touchend", () => setIsSeeking(false));
      }
    });

    playerRef.current = player;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
        telemetryVideoRef.current = null;
        setHeatmapTarget(null);
        setIsSeeking(false);
      }
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;

    if (src) {
      player.src({ src });
    } else {
      player.reset();
    }
  }, [src]);

  const hasHeightClass = className?.includes("h-");

  return (
    <div
      data-vjs-player
      ref={videoContainerRef}
      className={cn(
        "relative w-full bg-black rounded-2xl overflow-hidden",
        !hasHeightClass && "aspect-video",
        className,
      )}
    >
      {lectureId && heatmapTarget && isSeeking && (
        <HeatmapOverlay target={heatmapTarget} lectureId={lectureId} />
      )}
    </div>
  );
}

function HeatmapOverlay({ target, lectureId }: { target: HTMLElement; lectureId: string }) {
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
