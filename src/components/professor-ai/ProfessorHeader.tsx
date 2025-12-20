import { Menu, X, LogOut, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Mode, Course } from "@/pages/ProfessorAI";

interface ProfessorHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedCourse: string | null;
  onCourseChange: (course: string) => void;
  selectedMode: Mode;
  onModeChange: (mode: Mode) => void;
  selectedBatch: string;
  onBatchChange: (batch: string) => void;
  courses: Course[];
}

const modeOptions: { value: Mode; label: string }[] = [
  { value: "Study", label: "Study" },
  { value: "Quiz", label: "Quiz" },
  { value: "Notes Creator", label: "Notes" },
];

export const ProfessorHeader = ({
  sidebarOpen,
  onToggleSidebar,
  selectedCourse,
  onCourseChange,
  selectedMode,
  onModeChange,
  selectedBatch,
  onBatchChange,
  courses,
}: ProfessorHeaderProps) => {
  const selectedCourseDisplay = courses.find(c => c.id === selectedCourse)?.name;

  return (
    <div className="bg-background border-b border-border/50 py-2 px-3 md:px-4">
      <div className="flex justify-between items-center">
        {/* Left side - Menu and Title */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onToggleSidebar}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary hidden md:block" />
            <span className="text-lg font-semibold text-foreground">Professor AI</span>
          </div>
        </div>

        {/* Center - Selectors */}
        <div className="flex items-center gap-2 flex-1 justify-center max-w-2xl px-4">
          {/* Course Selector */}
          <Select value={selectedCourse || ""} onValueChange={onCourseChange}>
            <SelectTrigger className="w-[180px] md:w-[220px] bg-secondary/50 border-border/50 text-sm">
              <span className="truncate">
                {selectedCourseDisplay || "Select a course"}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-[300px]">
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <span className="text-sm truncate">{course.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mode Selector */}
          <Select value={selectedMode} onValueChange={(v) => onModeChange(v as Mode)}>
            <SelectTrigger className="w-[100px] md:w-[120px] bg-secondary/50 border-border/50 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {modeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right side - Batch selector */}
        <div className="flex items-center gap-2">
          <Select value={selectedBatch} onValueChange={onBatchChange}>
            <SelectTrigger className="w-[80px] md:w-[100px] bg-secondary/50 border-border/50 text-sm">
              <span className="truncate">{selectedBatch}...</span>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="2029">2029 Batch</SelectItem>
              <SelectItem value="2028">2028 Batch</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
