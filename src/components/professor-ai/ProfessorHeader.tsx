import { Menu, X, LogOut, MessageSquare } from "lucide-react";
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
  onLogout: () => void;
  onFeedbackClick: () => void;
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
  onLogout,
  onFeedbackClick,
}: ProfessorHeaderProps) => {
  const selectedCourseDisplay = courses.find(c => c.id === selectedCourse)?.name;

  return (
    <div className="bg-background border-b border-border/50">
      {/* Main header row */}
      <div className="flex items-center justify-between py-2 px-3 md:px-4">
        {/* Left side - Menu and Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={onToggleSidebar}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base sm:text-lg font-semibold text-primary truncate">
              AskTETR
            </span>
          </div>
        </div>

        {/* Desktop: All selectors in header */}
        <div className="hidden md:flex items-center gap-2">
          {/* Course Selector */}
          <Select value={selectedCourse || ""} onValueChange={onCourseChange}>
            <SelectTrigger className="w-[200px] bg-secondary/50 border-border/50 text-sm">
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
            <SelectTrigger className="w-[110px] bg-secondary/50 border-border/50 text-sm">
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

          {/* Batch Selector */}
          <Select value={selectedBatch} onValueChange={onBatchChange}>
            <SelectTrigger className="w-[100px] bg-secondary/50 border-border/50 text-sm">
              <span className="truncate">{selectedBatch}</span>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="2029">2029 Batch</SelectItem>
              <SelectItem value="2028">2028 Batch</SelectItem>
            </SelectContent>
          </Select>

          {/* Feedback Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onFeedbackClick}
            className="text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Feedback
          </Button>

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>

        {/* Mobile: Batch selector and action buttons */}
        <div className="flex md:hidden items-center gap-1">
          <Select value={selectedBatch} onValueChange={onBatchChange}>
            <SelectTrigger className="w-[80px] bg-secondary/50 border-border/50 text-xs h-8">
              <span className="truncate">{selectedBatch}</span>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="2029">2029</SelectItem>
              <SelectItem value="2028">2028</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Feedback Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onFeedbackClick}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          {/* Mobile Logout Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile: Secondary row with course and mode selectors */}
      <div className="flex md:hidden items-center gap-2 px-3 pb-2">
        {/* Course Selector */}
        <Select value={selectedCourse || ""} onValueChange={onCourseChange}>
          <SelectTrigger className="flex-1 min-w-0 bg-secondary/50 border-border/50 text-xs h-9">
            <span className="truncate">
              {selectedCourseDisplay || "Select course"}
            </span>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-[250px]">
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                <span className="text-sm truncate">{course.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mode Selector */}
        <Select value={selectedMode} onValueChange={(v) => onModeChange(v as Mode)}>
          <SelectTrigger className="w-[90px] flex-shrink-0 bg-secondary/50 border-border/50 text-xs h-9">
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
    </div>
  );
};
