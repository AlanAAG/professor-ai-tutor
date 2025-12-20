import { BookOpen, Brain, GraduationCap, FileText, Key, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Mode } from "@/pages/ProfessorAI";

interface ProfessorSidebarProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  selectedLecture: string;
  setSelectedLecture: (lecture: string) => void;
  lectures: string[];
  lecturesLoading: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
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
  selectedLecture,
  setSelectedLecture,
  lectures,
  lecturesLoading,
  apiKey,
  setApiKey,
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

      {/* API Key Input */}
      <div className="p-4 border-b border-professor-border">
        <Label className="text-xs text-professor-muted uppercase tracking-wider mb-2 block">
          API Key
        </Label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-professor-muted" />
          <Input
            type="password"
            placeholder="Enter API key..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="pl-10 bg-professor-input border-professor-border text-professor-fg placeholder:text-professor-muted focus:ring-professor-accent"
          />
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-4 border-b border-professor-border">
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

      {/* Lecture Selector */}
      <div className="p-4 flex-1">
        <Label className="text-xs text-professor-muted uppercase tracking-wider mb-3 block">
          Select Lecture
        </Label>
        <Select
          value={selectedLecture}
          onValueChange={setSelectedLecture}
          disabled={lecturesLoading || !apiKey}
        >
          <SelectTrigger className="w-full bg-professor-input border-professor-border text-professor-fg">
            {lecturesLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select a Lecture..." />
            )}
          </SelectTrigger>
          <SelectContent className="bg-professor-sidebar border-professor-border">
            {lectures.map((lecture) => (
              <SelectItem
                key={lecture}
                value={lecture}
                className="text-professor-fg hover:bg-professor-input focus:bg-professor-input"
              >
                {lecture}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {!apiKey && (
          <p className="text-xs text-professor-muted mt-2">
            Enter your API key to load lectures
          </p>
        )}
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
