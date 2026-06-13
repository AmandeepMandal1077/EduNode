import { useEffect, useState } from "react";
import { fetchLectureHeatmap } from "@/api/progressApi";

interface HeatmapData {
  segmentIndex: number;
  secondsWatched: number;
}

export function LectureHeatmap({ lectureId }: { lectureId: string }) {
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([]);

  useEffect(() => {
    if (!lectureId) return;
    fetchLectureHeatmap(lectureId).then((data) => {

      const mappedData = data.map((d: any) => ({
        segmentIndex: d.segmentIndex ?? d.segmentIdx ?? 0,
        secondsWatched: d.secondsWatched ?? d.watchSeconds ?? 0,
      }));
      setHeatmap(mappedData);
    });
  }, [lectureId]);

  const normalizedData = Array.from({ length: 100 }, (_, i) => {
    const found = heatmap.find((h) => h.segmentIndex === i);
    return found ? found.secondsWatched : 0;
  });

  const maxWatched = Math.max(...normalizedData, 1);

  return (
    <div className="flex items-end h-full w-full gap-[1px] pt-4 pointer-events-auto">
      {normalizedData.map((seconds, i) => {
        const heightPercent = (seconds / maxWatched) * 100;
        
        let color = "bg-slate-500/30";
        if (seconds > 0) {
            const ratio = seconds / maxWatched;
            if (ratio < 0.3) color = "bg-indigo-300";
            else if (ratio < 0.6) color = "bg-indigo-400";
            else if (ratio < 0.8) color = "bg-indigo-500";
            else color = "bg-indigo-600";
        }

        return (
          <div
            key={i}
            className={`group relative flex-1 ${color} rounded-t-sm transition-all duration-300 hover:opacity-100 hover:bg-rose-400 cursor-pointer`}
            style={{ height: `${Math.max(heightPercent, 10)}%` }}
          >

            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-50 transition-opacity">
               Segment {i} • {Math.floor(seconds)}s
               <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
