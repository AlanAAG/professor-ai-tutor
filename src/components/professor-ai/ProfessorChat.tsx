import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, ArrowUp, Search, Brain, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessorMessage } from "./ProfessorMessage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Mode, Message, Lecture } from "@/pages/ProfessorAI";

interface ProfessorChatProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent?: string;
  selectedLecture: string | null;
  selectedCourse: string | null;
  mode: Mode;
  onSendMessage: (content: string) => void;
  onStartQuiz: () => void;
  onCreateNotes: () => void;
  lectures: Lecture[];
  onLectureChange: (lecture: string) => void;
  lecturesLoading: boolean;
}

const modeDescriptions: Record<Mode, string> = {
  "Notes Creator": "Auto-generate comprehensive lecture notes",
  "Quiz": "Test your understanding with interactive quizzes",
  "Study": "Ask questions and learn through guided discovery",
};

const quizSuggestions = [
  "Quiz me on ML basics",
  "Quiz on elasticity",
  "Supply and demand",
  "Calculus derivatives",
];

const studySuggestions = [
  "Explain key concepts",
  "Help me understand",
  "Give me examples",
];

export const ProfessorChat = ({
  messages,
  isLoading,
  streamingContent = "",
  selectedLecture,
  selectedCourse,
  mode,
  onSendMessage,
  onStartQuiz,
  onCreateNotes,
  lectures,
  onLectureChange,
  lecturesLoading,
}: ProfessorChatProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // For Quiz mode, don't require course selection
    if (mode !== "Quiz" && !selectedCourse) return;
    
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Study and Quiz modes only need course selection
  // Notes Creator mode requires both course and specific lecture
  const needsLecture = mode === "Notes Creator";
  const hasSpecificLecture = selectedLecture && selectedLecture !== "__all__";
  
  // Quiz mode doesn't require course selection
  // Can chat if: quiz mode OR (course selected AND (not Notes Creator OR has specific lecture))
  const canChat = mode === "Quiz" || (selectedCourse && (!needsLecture || hasSpecificLecture));
  const isInputDisabled = !canChat || isLoading;

  // Display text for lecture
  const getLectureDisplayText = () => {
    if (!selectedLecture) return "All Lectures";
    if (selectedLecture === "__all__") return "All Lectures";
    return selectedLecture;
  };

  // Pre-chat welcome screen
  if (messages.length === 0 && !streamingContent) {
    return (
      <main className="flex-1 flex flex-col h-full bg-background">
        {/* Centered welcome content */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center px-4 py-4 sm:py-6 md:py-8">
            <div className="text-center space-y-3 sm:space-y-4 md:space-y-6 max-w-2xl w-full animate-fade-in">
              {/* Gradient icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg mx-auto">
                {mode === "Notes Creator" ? (
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 text-primary" />
                ) : mode === "Quiz" ? (
                  <Brain className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 text-primary" />
                ) : (
                  <Search className="w-6 h-6 sm:w-7 sm:h-7 md:w-10 md:h-10 text-primary" />
                )}
              </div>
              
              {/* Welcome text */}
              <div className="space-y-1.5 sm:space-y-2">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-semibold text-foreground px-2">
                  {mode === "Quiz"
                    ? "What topic should I quiz you on?"
                    : !selectedCourse
                    ? "What would you like to learn?"
                    : mode === "Notes Creator" && !hasSpecificLecture
                    ? "Select a Lecture for Notes"
                    : "What would you like to learn?"}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
                  {mode === "Quiz"
                    ? "Type any topic and I'll generate a quiz"
                    : !selectedCourse
                    ? "Select a course to get started"
                    : mode === "Notes Creator" && !hasSpecificLecture
                    ? "Notes Creator requires a specific lecture"
                    : `Ready to help you learn`}
                </p>
              </div>

              {/* Lecture selector for Notes Creator mode */}
              {mode === "Notes Creator" && selectedCourse && (
                <div className="space-y-3 sm:space-y-4 px-2">
                  <div className="max-w-xs mx-auto">
                    <Select
                      value={selectedLecture || ""}
                      onValueChange={onLectureChange}
                      disabled={lecturesLoading}
                    >
                      <SelectTrigger className="w-full bg-secondary/50 border-border/50 h-10 sm:h-11">
                        {lecturesLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a lecture..." />
                        )}
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-[250px]">
                        {lectures.length > 0 ? (
                          lectures.map((lecture) => (
                            <SelectItem key={lecture.id} value={lecture.title}>
                              <span className="text-sm">{lecture.title}</span>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                            No lectures found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Create Notes button */}
                  {hasSpecificLecture && (
                    <Button
                      onClick={onCreateNotes}
                      disabled={isLoading}
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg hover:shadow-[var(--shadow-hover)] transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="hidden sm:inline">Creating notes...</span>
                          <span className="sm:hidden">Creating...</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5" />
                          Create Notes
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Input area for Quiz mode and Study mode */}
            {(mode === "Quiz" || canChat) && mode !== "Notes Creator" && (
              <div className="w-full max-w-3xl mt-6 sm:mt-8 md:mt-12 px-3 sm:px-4">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center gap-2 bg-secondary/80 rounded-xl sm:rounded-2xl border border-border/50 px-3 sm:px-4 py-2.5 sm:py-3 shadow-lg backdrop-blur-sm transition-all focus-within:border-primary/50 focus-within:shadow-[var(--shadow-glow)]">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={mode === "Quiz" ? "What topic to quiz on?" : "Ask anything..."}
                      disabled={isLoading}
                      className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30 flex-shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUp className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
                
                {/* Quick suggestions - responsive grid */}
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 md:mt-6">
                  {(mode === "Quiz" ? quizSuggestions : studySuggestions).map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-95"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show input placeholder when no course selected (not for Quiz mode) */}
            {!selectedCourse && mode !== "Quiz" && (
              <div className="w-full max-w-3xl mt-6 sm:mt-8 md:mt-12 px-3 sm:px-4">
                <div className="flex items-center gap-2 bg-secondary/80 rounded-xl sm:rounded-2xl border border-border/50 px-3 sm:px-4 py-2.5 sm:py-3 opacity-50">
                  <span className="flex-1 text-muted-foreground text-sm">Select a course first...</span>
                  <div className="h-8 w-8 p-0 rounded-lg bg-primary/30 flex items-center justify-center flex-shrink-0">
                    <ArrowUp className="w-4 h-4 text-primary-foreground/50" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Chat mode with messages
  return (
    <main className="flex-1 flex flex-col h-full bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {messages.map((message, index) => (
            <ProfessorMessage key={index} message={message} />
          ))}
          
          {/* Streaming content display */}
          {streamingContent && (
            <ProfessorMessage 
              message={{ role: "assistant", content: streamingContent }} 
              isStreaming={true}
            />
          )}
          
          {isLoading && !streamingContent && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {mode === "Quiz" ? "Generating quiz..." : "Thinking..."}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-secondary/80 rounded-xl sm:rounded-2xl border border-border/50 px-3 sm:px-4 py-2.5 sm:py-3 transition-all focus-within:border-primary/50 focus-within:shadow-[var(--shadow-glow)]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "Quiz"
                    ? "What topic to quiz on?"
                    : !selectedCourse
                    ? "Select a course first..."
                    : "Ask anything..."
                }
                disabled={isInputDisabled}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
              />
              <Button
                type="submit"
                disabled={isInputDisabled || !input.trim()}
                size="sm"
                className="h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};
