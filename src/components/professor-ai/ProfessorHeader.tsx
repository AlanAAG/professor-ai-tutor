import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Mode } from "./types";
import type { Course } from "@/data/courses";

interface ProfessorHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedCourse: string | null;
  onCourseChange: (course: string) => void;
  selectedMode: Mode;
  onModeChange: (mode: Mode) => void;
  selectedBatch: string;
  onBatchChange: (batch: string) => void;
  selectedTerm: string;
  onTermChange: (term: string) => void;
  courses: Course[];
  onLogout?: () => void;
  onFeedback?: () => void;
  onOpenCourseSelection?: () => void;
}

const modeOptions: {
  value: Mode;
  label: string;
}[] = [{
  value: "Study",
  label: "Study"
}, {
  value: "Quiz",
  label: "Quiz"
}, {
  value: "Notes Creator",
  label: "Notes"
}, {
  value: "Pre-Read",
  label: "Pre-Read"
}];

const TERM_OPTIONS_BY_BATCH: Record<string, { value: string; label: string }[]> = {
  "2029": [
    { value: "term1", label: "Term 1" },
    { value: "term2", label: "Term 2" },
  ],
  "2028": [
    { value: "term3", label: "Term 3" },
    { value: "term4", label: "Term 4" },
  ],
};

export const ProfessorHeader = ({
  sidebarOpen,
  onToggleSidebar,
  selectedCourse,
  onCourseChange,
  selectedMode,
  onModeChange,
  selectedBatch,
  onBatchChange,
  selectedTerm,
  onTermChange,
  courses,
  onLogout,
  onFeedback,
  onOpenCourseSelection,
}: ProfessorHeaderProps) => {
  const selectedCourseDisplay = courses.find(c => c.id === selectedCourse)?.name;
  const termOptions = TERM_OPTIONS_BY_BATCH[selectedBatch] || [];
  const selectedTermLabel = termOptions.find(t => t.value === selectedTerm)?.label || selectedTerm;

  // Get a short, readable course name for mobile - show START of title
  const getMobileCourseLabel = () => {
    if (!selectedCourseDisplay) return "Select Course";
    // Remove "How to" prefix if present, then show first ~18 chars
    const cleanedName = selectedCourseDisplay.replace(/^How to /i, '');
    if (cleanedName.length <= 18) {
      return cleanedName;
    }
    // Truncate at word boundary if possible
    const truncated = cleanedName.substring(0, 18);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 10) {
      return truncated.substring(0, lastSpace) + '...';
    }
    return truncated + '...';
  };

  return (
    <div className="bg-background border-b border-border/50 py-2 px-2 md:px-4">
      {/* Mobile/Tablet layout - two rows for better readability */}
      <div className="flex lg:hidden flex-col gap-2">
        {/* Top row: Menu, Logo, Course */}
        <div className="flex items-center gap-2">
          {/* Hamburger menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-9 w-9 shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Logo */}
          <span className="text-base font-bold text-primary shrink-0">AskTETR</span>

          {/* Course selector - takes remaining space */}
          <Button
            variant="outline"
            className="flex-1 min-w-0 bg-secondary/50 border-border/50 text-sm h-9 justify-start px-3"
            onClick={onOpenCourseSelection}
          >
            <span className="truncate">
              {getMobileCourseLabel()}
            </span>
          </Button>
        </div>
        
        {/* Bottom row: Mode, Term, Batch - evenly spaced */}
        <div className="flex items-center gap-2 px-1">
          {/* Mode selector */}
          <Select value={selectedMode} onValueChange={v => onModeChange(v as Mode)}>
            <SelectTrigger className="flex-1 bg-secondary/50 border-border/50 text-sm h-9">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {modeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Term selector */}
          <Select value={selectedTerm} onValueChange={onTermChange}>
            <SelectTrigger className="flex-1 bg-secondary/50 border-border/50 text-sm h-9">
              <span className="truncate">{selectedTermLabel}</span>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {termOptions.map(term => (
                <SelectItem key={term.value} value={term.value}>
                  {term.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Batch selector */}
          <Select value={selectedBatch} onValueChange={onBatchChange}>
            <SelectTrigger className="flex-1 bg-secondary/50 border-border/50 text-sm h-9">
              <span className="truncate">{selectedBatch}</span>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="2029">2029</SelectItem>
              <SelectItem value="2028">2028</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop layout - centered selectors */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Logo */}
        <span className="text-lg font-bold text-primary shrink-0">AskTETR</span>

        {/* Desktop selectors - centered */}
        <div className="flex items-center gap-2 flex-1 justify-center max-w-3xl px-4">
          <Button
            variant="outline"
            className="w-[220px] bg-secondary/50 border-border/50 text-sm h-9 justify-start"
            onClick={onOpenCourseSelection}
          >
            <span className="truncate">
              {selectedCourseDisplay || "Select a course"}
            </span>
          </Button>

          <Select value={selectedMode} onValueChange={v => onModeChange(v as Mode)}>
            <SelectTrigger className="w-[100px] bg-secondary/50 border-border/50 text-sm h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {modeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTerm} onValueChange={onTermChange}>
            <SelectTrigger className="w-[90px] bg-secondary/50 border-border/50 text-sm h-9">
              <span className="truncate">{selectedTermLabel}</span>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {termOptions.map(term => (
                <SelectItem key={term.value} value={term.value}>
                  {term.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedBatch} onValueChange={onBatchChange}>
            <SelectTrigger className="w-[90px] bg-secondary/50 border-border/50 text-sm h-9">
              <span className="truncate">{selectedBatch}</span>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="2029">2029</SelectItem>
              <SelectItem value="2028">2028</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop right side placeholder for balance */}
        <div className="w-[100px]" />
      </div>
    </div>
  );
};