import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, PlayCircle, MessageSquare, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfessorMessage } from "./ProfessorMessage";
import type { Mode, Message } from "@/pages/ProfessorAI";

interface ProfessorChatProps {
  messages: Message[];
  isLoading: boolean;
  selectedLecture: string | null;
  mode: Mode;
  onSendMessage: (content: string) => void;
  onStartQuiz: () => void;
}

const modeDescriptions: Record<Mode, string> = {
  "Notes Creator": "Select a lecture to auto-generate comprehensive notes",
  "Quiz": "Test your understanding with interactive quizzes",
  "Study": "Ask questions and learn through guided discovery",
};

export const ProfessorChat = ({
  messages,
  isLoading,
  selectedLecture,
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
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !selectedLecture) return;
    
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isInputDisabled = !selectedLecture || isLoading;

  return (
    <main className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <header className="p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {mode} Mode
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedLecture || "No lecture selected"}
            </p>
          </div>
          <div className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
            {modeDescriptions[mode]}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {!selectedLecture
                  ? "Select a Lecture to Begin"
                  : mode === "Notes Creator"
                  ? "Generating Notes..."
                  : mode === "Quiz"
                  ? "Ready to Quiz?"
                  : "Ask Away!"}
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                {!selectedLecture
                  ? "Choose a lecture from the sidebar to start your learning session."
                  : mode === "Quiz"
                  ? "Click the button below to start your quiz session."
                  : mode === "Study"
                  ? "Type your question below to begin a Socratic dialogue."
                  : "Your notes are being prepared..."}
              </p>
              
              {/* Quiz Start Button */}
              {mode === "Quiz" && selectedLecture && messages.length === 0 && !isLoading && (
                <Button
                  onClick={onStartQuiz}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  Start Quiz
                </Button>
              )}
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ProfessorMessage key={index} message={message} />
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                  <span className="text-sm">Professor AI is thinking...</span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/30">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 bg-secondary/80 rounded-2xl border border-border/50 px-4 py-3 shadow-lg backdrop-blur-sm transition-all focus-within:border-primary/50">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !selectedLecture
                    ? "Select a lecture first..."
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
          
          {!selectedLecture && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              ⚠️ Please select a lecture from the sidebar to enable chat
            </p>
          )}
        </div>
      </div>
    </main>
  );
};