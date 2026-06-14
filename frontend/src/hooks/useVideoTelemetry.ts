import { useEffect, useRef } from "react";
import { syncPlaybackPosition, fetchLastWatchPosition } from "@/api/progressApi";

interface TelemetryOptions {
  courseId?: string;
  lectureId?: string;
  duration?: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * @desc Custom hook to handle video telemetry syncing for heatmap tracking and resume positions.
 * @input {TelemetryOptions} options - Contains courseId, lectureId, duration, and videoRef.
 * @output {void} Side effect only: syncs playback state with backend APIs.
 */
export function useVideoTelemetry({
  courseId,
  lectureId,
  duration,
  videoRef,
}: TelemetryOptions) {
  const previousPosition = useRef(0);
  const lastSegmentSynced = useRef(-1);

  useEffect(() => {
    if (!courseId || !lectureId || !videoRef.current) return;

    let isMounted = true;

    // Fetch last watch position and resume
    fetchLastWatchPosition(lectureId, courseId).then((pos) => {
      if (isMounted && pos > 0 && videoRef.current) {
        videoRef.current.currentTime = pos;
        previousPosition.current = pos;
      }
    });

    return () => {
      isMounted = false;
    };
  }, [courseId, lectureId, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !courseId || !lectureId || !duration || duration <= 0) return;

    const segmentLength = duration / 100;

    const handleSync = async () => {
      const currentPosition = video.currentTime;
      // Use navigator.sendBeacon if possible for unmounts, but since it's an authenticated API,
      // it's safer to use our apiClient (which handles tokens) and don't block.
      try {
        await syncPlaybackPosition({
          courseId,
          lectureId,
          currentPosition,
          previousPosition: previousPosition.current,
          lectureDuration: duration,
        });
      } catch (err) {
        console.error("Telemetry sync failed", err);
      } finally {
        previousPosition.current = currentPosition;
      }
    };

    const handleTimeUpdate = () => {
      const currentSegment = Math.floor(video.currentTime / segmentLength);
      
      // Trigger sync if we crossed into a new segment length
      if (currentSegment > lastSegmentSynced.current && video.currentTime > previousPosition.current) {
        handleSync();
        lastSegmentSynced.current = currentSegment;
      }
    };

    const handleSeeked = () => {
      handleSync();
      lastSegmentSynced.current = Math.floor(video.currentTime / segmentLength);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      // Sync one last time on unmount or lecture change
      handleSync();
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [courseId, lectureId, duration, videoRef]);
}
