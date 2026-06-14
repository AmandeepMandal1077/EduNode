import { useEffect, useState, useMemo } from "react";
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

  const normalizedData = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const found = heatmap.find((h) => h.segmentIndex === i);
      return found ? found.secondsWatched : 0;
    });
  }, [heatmap]);

  const paths = useMemo(() => {
    const maxWatched = Math.max(...normalizedData, 1);
    
    let d = `M 0,${100 - (normalizedData[0] / maxWatched) * 100} `;
    
    for (let i = 0; i < normalizedData.length - 1; i++) {
      const x0 = i * 10;
      const y0 = 100 - (normalizedData[i] / maxWatched) * 100;
      const x1 = (i + 1) * 10;
      const y1 = 100 - (normalizedData[i + 1] / maxWatched) * 100;
      
      const cp1x = x0 + 5;
      const cp2x = x1 - 5;
      
      d += `C ${cp1x},${y0} ${cp2x},${y1} ${x1},${y1} `;
    }
    
    const fillPath = `${d} L 990,100 L 0,100 Z`;
    
    return { strokePath: d, fillPath };
  }, [normalizedData]);

  if (heatmap.length === 0) {
    return null; // Don't render anything if no heatmap data yet
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-full w-full pointer-events-none opacity-80 mix-blend-screen">
      <svg
        viewBox="0 0 990 100"
        preserveAspectRatio="none"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="heatmap-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d={paths.fillPath}
          fill="url(#heatmap-gradient)"
          className="transition-all duration-700 ease-in-out"
        />
        <path
          d={paths.strokePath}
          fill="none"
          stroke="#a5b4fc"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-700 ease-in-out"
        />
      </svg>
    </div>
  );
}
