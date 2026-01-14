import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  return (
    <div className="bg-background border-b border-border/50 py-2 px-2 md:px-4">
      {/* Mobile/Tablet layout - single row with all controls */}
      <div className="flex lg:hidden items-center gap-1.5">
        {/* Hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 shrink-0"
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        {/* Logo */}
        <span className="text-sm font-bold text-primary shrink-0">AskTETR</span>

        {/* Scrollable selectors */}
        <div className="flex items-center gap-1 flex-1 overflow-x-auto min-w-0 ml-1">
          {/* Course selector */}
          <Button
            variant="outline"
            className="min-w-[80px] max-w-[120px] bg-secondary/50 border-border/50 text-xs h-7 justify-start px-2"
            onClick={onOpenCourseSelection}
          >
            <span className="truncate">
              {selectedCourseDisplay ? selectedCourseDisplay.split(' ').slice(0, 2).join(' ') + '...' : "Course"}
            </span>
          </Button>

          {/* Mode selector */}
          <Select value={selectedMode} onValueChange={v => onModeChange(v as Mode)}>
            <SelectTrigger className="w-[60px] shrink-0 bg-secondary/50 border-border/50 text-xs h-7 px-2">
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

          {/* Term selector */}
          <Select value={selectedTerm} onValueChange={onTermChange}>
            <SelectTrigger className="w-[55px] shrink-0 bg-secondary/50 border-border/50 text-xs h-7 px-2">
              <span className="truncate">T{selectedTerm.replace('term', '')}</span>
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
            <SelectTrigger className="w-[55px] shrink-0 bg-secondary/50 border-border/50 text-xs h-7 px-2">
              <span className="truncate">{selectedBatch.slice(-2)}</span>
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