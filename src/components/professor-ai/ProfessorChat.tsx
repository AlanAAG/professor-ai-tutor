import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, PlayCircle, MessageSquare, ArrowUp, GraduationCap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessorMessage } from "./ProfessorMessage";
import type { Mode, Message } from "@/pages/ProfessorAI";

interface ProfessorChatProps {
  messages: Message[];
  isLoading: boolean;
  streamingContent?: string;
  selectedLecture: string | null;
  selectedCourse: string | null;
  mode: Mode;
  onSendMessage: (content: string) => void;
  onStartQuiz: () => void;
}

const modeDescriptions: Record<Mode, string> = {
  "Notes Creator": "Auto-generate comprehensive lecture notes",
  "Quiz": "Test your understanding with interactive quizzes",
  "Study": "Ask questions and learn through guided discovery",
};

export const ProfessorChat = ({
  messages,
  isLoading,
  streamingContent = "",
  selectedLecture,
  selectedCourse,
  mode,
  onSendMessage,
  onStartQuiz,
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
    if (!input.trim() || isLoading || !selectedCourse) return;
    
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Disable input if no course selected
  const isInputDisabled = !selectedCourse || isLoading;
  
  // Check if we have a specific lecture selected (not "All Lectures")
  const hasSpecificLecture = selectedLecture && selectedLecture !== "__all__";
  const hasAnyLectureSelection = selectedLecture !== null;

  // Display text for lecture
  const getLectureDisplayText = () => {
    if (!selectedLecture) return "No lecture selected";
    if (selectedLecture === "__all__") return "All Lectures";
    return selectedLecture;
  };

  // Pre-chat welcome screen
  if (messages.length === 0 && !streamingContent) {
    return (
      <main className="flex-1 flex flex-col h-full bg-background">
        {/* Minimal header */}
        <div className="p-3 md:p-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            {selectedCourse && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground capitalize">{mode}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full">
              {modeDescriptions[mode]}
            </div>
          </div>
        </div>

        {/* Centered welcome content */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center px-4 py-6 md:py-8">
            <div className="text-center space-y-4 md:space-y-6 max-w-2xl animate-fade-in">
              {/* Gradient icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg mx-auto">
                {mode === "Notes Creator" ? (
                  <Sparkles className="w-7 h-7 md:w-10 md:h-10 text-primary" />
                ) : mode === "Quiz" ? (
                  <MessageSquare className="w-7 h-7 md:w-10 md:h-10 text-primary" />
                ) : (
                  <Search className="w-7 h-7 md:w-10 md:h-10 text-primary" />
                )}
              </div>
              
              {/* Welcome text */}
              <div className="space-y-2">
                <h1 className="text-2xl md:text-4xl font-semibold text-foreground">
                  {!selectedCourse
                    ? "Select a Course to Begin"
                    : !hasAnyLectureSelection
                    ? "Select a Lecture"
                    : mode === "Notes Creator" && !hasSpecificLecture
                    ? "Select a Specific Lecture"
                    : mode === "Quiz"
                    ? "Ready to Test Your Knowledge?"
                    : "What would you like to learn?"}
                </h1>
                <p className="text-muted-foreground text-base md:text-lg px-2">
                  {!selectedCourse
                    ? "Choose a course from the sidebar to start your learning session."
                    : !hasAnyLectureSelection
                    ? "Select a lecture or 'All Lectures' from the sidebar."
                    : mode === "Notes Creator" && !hasSpecificLecture
                    ? "Notes Creator requires a specific lecture, not 'All Lectures'."
                    : mode === "Quiz"
                    ? "Click the button below to start your quiz session."
                    : `Ready to help you with ${getLectureDisplayText()}`}
                </p>
              </div>
              
              {/* Quiz Start Button */}
              {mode === "Quiz" && hasAnyLectureSelection && !isLoading && (
                <Button
                  onClick={onStartQuiz}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shadow-lg hover:shadow-[var(--shadow-hover)] transition-all"
                >
                  <PlayCircle className="w-5 h-5" />
                  Start Quiz
                </Button>
              )}
            </div>
            
            {/* Input area */}
            {selectedCourse && hasAnyLectureSelection && mode !== "Notes Creator" && (
              <div className="w-full max-w-3xl mt-8 md:mt-12 px-2">
                <form onSubmit={handleSubmit}>
                  <div className="flex items-center gap-2 bg-secondary/80 rounded-2xl border border-border/50 px-4 py-3 shadow-lg backdrop-blur-sm transition-all focus-within:border-primary/50 focus-within:shadow-[var(--shadow-glow)]">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={mode === "Quiz" ? "Type your answer..." : "Ask anything..."}
                      disabled={isInputDisabled}
                      className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
                    />
                    <Button
                      type="submit"
                      disabled={isInputDisabled || !input.trim()}
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUp className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
                
                {/* Quick suggestions */}
                {mode === "Study" && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4 md:mt-6">
                    {["Explain the key concepts", "Help me understand", "Give me examples"].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="px-3 md:px-4 py-2 text-xs md:text-sm rounded-full bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all whitespace-nowrap"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
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
      {/* Compact header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm p-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium truncate max-w-[200px]">
              {getLectureDisplayText()}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium capitalize">{mode}</span>
          </div>
          
          <div className="flex-1" />
          
          <div className="text-xs text-muted-foreground">
            {modeDescriptions[mode]}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-secondary/80 rounded-2xl border border-border/50 px-4 py-3 transition-all focus-within:border-primary/50 focus-within:shadow-[var(--shadow-glow)]">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !selectedCourse
                    ? "Select a course first..."
                    : mode === "Quiz"
                    ? "Type your answer (A, B, C, or D)..."
                    : "Ask anything..."
                }
                disabled={isInputDisabled}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
              />
              <Button
                type="submit"
                disabled={isInputDisabled || !input.trim()}
                size="sm"
                className="h-8 w-8 p-0 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-30"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>
          
          {!selectedCourse && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Please select a course from the sidebar to enable chat
            </p>
          )}
        </div>
      </div>
    </main>
  );
};
