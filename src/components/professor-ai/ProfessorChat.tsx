import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, PlayCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ProfessorMessage } from "./ProfessorMessage";
import type { Mode, Message } from "@/pages/ProfessorAI";

interface ProfessorChatProps {
  messages: Message[];
  isLoading: boolean;
  selectedLecture: string;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <main className="flex-1 flex flex-col h-full bg-professor-bg">
      {/* Header */}
      <header className="p-4 border-b border-professor-border bg-professor-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-professor-fg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-professor-accent" />
              {mode} Mode
            </h2>
            <p className="text-sm text-professor-muted">
              {selectedLecture || "No lecture selected"}
            </p>
          </div>
          <div className="text-xs text-professor-muted bg-professor-input px-3 py-1.5 rounded-full">
            {modeDescriptions[mode]}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-professor-accent/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-professor-accent" />
            </div>
            <h3 className="text-xl font-semibold text-professor-fg mb-2">
              {!selectedLecture
                ? "Select a Lecture to Begin"
                : mode === "Notes Creator"
                ? "Generating Notes..."
                : mode === "Quiz"
                ? "Ready to Quiz?"
                : "Ask Away!"}
            </h3>
            <p className="text-professor-muted max-w-md mb-6">
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
                className="bg-professor-accent text-professor-bg hover:bg-professor-accent/90 gap-2"
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
              <div className="flex items-center gap-3 text-professor-muted">
                <div className="w-8 h-8 rounded-lg bg-professor-accent/20 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-professor-accent" />
                </div>
                <span className="text-sm">Professor AI is thinking...</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-professor-border bg-professor-sidebar/30">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !selectedLecture
                  ? "Select a lecture first..."
                  : mode === "Quiz"
                  ? "Type your answer (A, B, C, or D)..."
                  : "Type your question..."
              }
              disabled={isInputDisabled}
              className="min-h-[52px] max-h-32 resize-none bg-professor-input border-professor-border text-professor-fg placeholder:text-professor-muted focus:ring-professor-accent pr-12"
              rows={1}
            />
          </div>
          <Button
            type="submit"
            disabled={isInputDisabled || !input.trim()}
            className="h-[52px] w-[52px] bg-professor-accent text-professor-bg hover:bg-professor-accent/90 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
        
        {!selectedLecture && (
          <p className="text-xs text-professor-muted mt-2 text-center">
            ⚠️ Please select a lecture from the sidebar to enable chat
          </p>
        )}
      </div>
    </main>
  );
};
