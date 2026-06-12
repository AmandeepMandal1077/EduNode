import { motion } from "motion/react";
import { BookOpen, Play, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Course } from "@/types";

export function CourseAccordion({ course }: { course: Course }) {
  const totalLectures = course.modules.reduce((a, m) => a + m.lectures.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bento-card"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Course Curriculum</h2>
        <span className="text-sm text-slate-500">
          {totalLectures} lectures • {course.totalDuration}
        </span>
      </div>
      <Accordion type="multiple" className="flex flex-col gap-2">
        {course.modules.map((mod) => (
          <AccordionItem
            key={mod.id}
            value={mod.id}
            className="border border-slate-200 rounded-xl overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 hover:no-underline text-sm font-semibold text-slate-800">
              <div className="flex items-center gap-3 text-left w-full min-w-0">
                <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="break-words flex-1 min-w-0">{mod.title}</span>
                <span className="text-xs font-normal text-slate-400 ml-auto mr-3 flex-shrink-0">
                  {mod.lectures.length} lectures
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pt-0 pb-0">
              <div className="border-t border-slate-100">
                {mod.lectures.map((lec, li) => (
                  <div
                    key={lec.id}
                    className={`flex items-center gap-3 px-4 py-3 text-sm ${
                      li < mod.lectures.length - 1 ? "border-b border-slate-50" : ""
                    }`}
                  >
                    {lec.isPreview ? (
                      <Play className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className="flex-1 text-slate-700 break-words">{lec.title}</span>
                    {lec.isPreview && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-indigo-600 border-indigo-200 py-0"
                      >
                        Preview
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400 ml-auto flex-shrink-0">
                      {lec.duration}
                    </span>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
}
