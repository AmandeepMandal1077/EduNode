import { motion } from "motion/react";
import { BookOpen, Play, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Course } from "@/types";

export function CourseAccordion({ course }: { course: Course }) {
  const modules = course.modules || [];
  const totalLectures = modules.reduce((a, m) => a + (m.lectures || []).length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-background border-2 border-border rounded-base p-6 shadow-shadow"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-heading font-black text-foreground">Course Curriculum</h2>
        <span className="text-xs font-heading font-bold bg-secondary-background border-2 border-border px-2.5 py-1 rounded-base text-foreground">
          {totalLectures} lectures • {course.totalDuration}
        </span>
      </div>
      {modules.length === 0 ? (
        <p className="text-sm font-base text-foreground/60 py-4 text-center">No curriculum uploaded yet.</p>
      ) : (
        <Accordion type="multiple" defaultValue={modules.map((m) => m.id)} className="flex flex-col gap-3">
          {modules.map((mod) => (
            <AccordionItem
              key={mod.id}
              value={mod.id}
            >
              <AccordionTrigger className="px-4 py-3 text-sm font-heading font-bold text-foreground">
                <div className="flex items-center gap-3 text-left w-full min-w-0">
                  <BookOpen className="w-4 h-4 text-foreground flex-shrink-0" />
                  <span className="break-words flex-1 min-w-0">{mod.title}</span>
                  <span className="text-xs font-base text-foreground/70 ml-auto mr-3 flex-shrink-0">
                    {(mod.lectures || []).length} lectures
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-0 pb-0">
                <div className="border-t-2 border-border">
                  {(mod.lectures || []).map((lec, li) => (
                    <div
                      key={lec.id}
                      className={`flex items-center gap-3 px-4 py-3 text-sm ${
                        li < (mod.lectures || []).length - 1 ? "border-b border-border/20" : ""
                      }`}
                    >
                      {lec.isPreview ? (
                        <Play className="w-4 h-4 text-foreground flex-shrink-0 fill-current" />
                      ) : (
                        <Lock className="w-4 h-4 text-foreground/40 flex-shrink-0" />
                      )}
                      <span className="flex-1 text-foreground font-base break-words">{lec.title}</span>
                      {lec.isPreview && (
                        <Badge
                          variant="default"
                          className="text-[10px] py-0 font-heading font-black"
                        >
                          Preview
                        </Badge>
                      )}
                      <span className="text-xs font-mono font-bold text-foreground/70 ml-auto flex-shrink-0">
                        {lec.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </motion.div>
  );
}
