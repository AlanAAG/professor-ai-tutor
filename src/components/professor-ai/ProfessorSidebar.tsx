import { BookOpen, Brain, GraduationCap, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Mode } from "@/pages/ProfessorAI";

type Persona = {
  display_name?: string;
  professor_name: string;
  style_prompt: string;
};

interface ProfessorSidebarProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  selectedClass: string | null;
  setSelectedClass: (classId: string) => void;
  selectedBatch: string;
  setSelectedBatch: (batchId: string) => void;
  batchPersonas: Record<string, Persona>;
  availableClasses: string[];
}

const modeConfig = [
  {
    value: "Notes Creator" as Mode,
    label: "Notes Creator",
    icon: FileText,
    emoji: "📝",
    description: "Auto-generate lecture summaries",
  },
  {
    value: "Quiz" as Mode,
    label: "Quiz",
    icon: Brain,
    emoji: "🧠",
    description: "Test your knowledge",
  },
  {
    value: "Study" as Mode,
    label: "Study",
    icon: GraduationCap,
    emoji: "🎓",
    description: "Socratic learning mode",
  },
];

export const ProfessorSidebar = ({
  mode,
  setMode,
  selectedClass,
  setSelectedClass,
  selectedBatch,
  setSelectedBatch,
  batchPersonas,
  availableClasses,
}: ProfessorSidebarProps) => {
  return (
    <aside className="w-72 min-w-72 h-full bg-professor-sidebar border-r border-professor-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-professor-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-professor-accent/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-professor-accent" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-professor-fg">Professor AI</h1>
            <p className="text-xs text-professor-muted">Your Academic Assistant</p>
          </div>
        </div>
      </div>

      {/* Batch Selector */}
      <div className="p-4 border-b border-professor-border">
        <Label className="text-xs text-professor-muted uppercase tracking-wider mb-2 block">
          Batch
        </Label>
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-full bg-professor-input border-professor-border text-professor-fg">
            <SelectValue placeholder="Select Batch..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="2029">2029 Batch</SelectItem>
            <SelectItem value="2028">2028 Batch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Selector */}
      <div className="p-4 border-b border-professor-border">
        <Label className="text-xs text-professor-muted uppercase tracking-wider mb-2 block">
          Select Course
        </Label>
        <Select value={selectedClass || ""} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-full bg-professor-input border-professor-border text-professor-fg">
            <SelectValue placeholder="Select a Course..." />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-[300px]">
            {availableClasses.map((classId) => {
              const persona = batchPersonas[classId];
              return (
                <SelectItem key={classId} value={classId}>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">
                      {persona.display_name || classId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {persona.professor_name}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Mode Selector */}
      <div className="p-4 flex-1 overflow-y-auto">
        <Label className="text-xs text-professor-muted uppercase tracking-wider mb-3 block">
          Learning Mode
        </Label>
        <RadioGroup
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
          className="space-y-2"
        >
          {modeConfig.map((item) => (
            <label
              key={item.value}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                mode === item.value
                  ? "bg-professor-accent/15 border border-professor-accent/50"
                  : "bg-professor-input border border-transparent hover:bg-professor-input/80"
              }`}
            >
              <RadioGroupItem
                value={item.value}
                id={item.value}
                className="border-professor-border text-professor-accent"
              />
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg">{item.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-professor-fg">{item.label}</p>
                  <p className="text-xs text-professor-muted">{item.description}</p>
                </div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-professor-border">
        <p className="text-xs text-professor-muted text-center">
          Powered by RAG Technology
        </p>
      </div>
    </aside>
  );
};