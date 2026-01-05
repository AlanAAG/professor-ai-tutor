import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, MessageSquare, ArrowUp, Search, Brain, FileText, Paperclip, X } from "lucide-react";
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

interface UploadedFile {
  name: string;
  content: string;
}

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
  uploadedFile?: UploadedFile | null;
  onFileUpload?: (file: UploadedFile | null) => void;
}

const quizSuggestions = [
  "Quiz me on machine learning basics",
  "I need a quiz on elasticity",
  "Test me on supply and demand",
  "Create a quiz about calculus derivatives",
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
  uploadedFile,
  onFileUpload,
}: ProfessorChatProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;

    try {
      let textContent = "";
      
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        textContent = await file.text();
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        // For PDF, we'll read it as text (basic extraction)
        // Note: Full PDF parsing would require a library
        textContent = `[PDF file: ${file.name}] - Note: PDF content extraction requires server-side processing. The file has been attached for context.`;
      } else if (file.name.endsWith(".docx")) {
        textContent = `[Word document: ${file.name}] - Note: DOCX content extraction requires server-side processing. The file has been attached for context.`;
      } else {
        textContent = await file.text();
      }

      onFileUpload({ name: file.name, content: textContent });
    } catch (error) {
      console.error("Error reading file:", error);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = () => {
    if (onFileUpload) {
      onFileUpload(null);
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
          <div className="min-h-full flex flex-col items-center justify-center px-4 py-6 md:py-8">
            <div className="text-center space-y-4 md:space-y-6 max-w-2xl animate-fade-in">
              {/* Gradient icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-lg mx-auto">
                {mode === "Notes Creator" ? (
                  <Sparkles className="w-7 h-7 md:w-10 md:h-10 text-primary" />
                ) : mode === "Quiz" ? (
                  <Brain className="w-7 h-7 md:w-10 md:h-10 text-primary" />
                ) : (
                  <Search className="w-7 h-7 md:w-10 md:h-10 text-primary" />
                )}
              </div>
              
              {/* Welcome text */}
              <div className="space-y-2">
                <h1 className="text-2xl md:text-4xl font-semibold text-chat-text">
                  {mode === "Quiz"
                    ? "What topic should I quiz you on?"
                    : !selectedCourse
                    ? "What would you like to learn?"
                    : mode === "Notes Creator" && !hasSpecificLecture
                    ? "Select a Lecture for Notes"
                    : "What would you like to learn?"}
                </h1>
                <p className="text-chat-text-secondary text-base md:text-lg px-2">
                  {mode === "Quiz"
                    ? "Type any topic and I'll generate a quiz for you"
                    : !selectedCourse
                    ? "Select a course to get started"
                    : mode === "Notes Creator" && !hasSpecificLecture
                    ? "Notes Creator requires a specific lecture selection"
                    : `Ready to help you learn about ${getLectureDisplayText()}`}
                </p>
              </div>

              {/* Lecture selector for Notes Creator mode */}
              {mode === "Notes Creator" && selectedCourse && (
                <div className="space-y-4">
                  <div className="max-w-xs mx-auto">
                    <Select
                      value={selectedLecture || ""}
                      onValueChange={onLectureChange}
                      disabled={lecturesLoading}
                    >
                      <SelectTrigger className="w-full bg-secondary/50 border-border/50">
                        {lecturesLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading lectures...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a lecture..." />
                        )}
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-[300px]">
                        {lectures.length > 0 ? (
                          lectures.map((lecture) => (
                            <SelectItem key={lecture.id} value={lecture.title}>
                              {lecture.title}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                            No lectures found for this course
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
                          Creating notes...
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
              <div className="w-full max-w-3xl mt-8 md:mt-12 px-2">
                <form onSubmit={handleSubmit}>
                  <div className="relative flex items-center gap-2">
                    {/* File upload button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 shrink-0 hover:bg-secondary rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={mode === "Quiz" ? "What topic should I quiz you on?" : "Ask anything..."}
                        disabled={isLoading}
                        className="w-full bg-secondary/60 backdrop-blur-md border border-border/50 rounded-full px-6 py-4 pr-14 text-chat-text placeholder:text-chat-text-secondary text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-30 shadow-md"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ArrowUp className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
                
                {/* Uploaded file indicator */}
                {uploadedFile && (
                  <div className="flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-secondary/50 rounded-lg border border-border/30 max-w-md mx-auto">
                    <Paperclip className="w-4 h-4 text-primary" />
                    <span className="text-sm text-chat-text truncate">{uploadedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 hover:bg-destructive/20"
                      onClick={handleRemoveFile}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
                
                {/* Quick suggestions */}
                <div className="flex flex-wrap justify-center gap-2 mt-4 md:mt-6">
                  {(mode === "Quiz" ? quizSuggestions : ["Explain the key concepts", "Help me understand", "Give me examples"]).map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-3 md:px-4 py-2 text-xs md:text-sm rounded-full bg-secondary/40 border border-border/30 text-chat-text-secondary hover:text-chat-text hover:border-primary/30 hover:bg-secondary/60 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show input placeholder when no course selected (not for Quiz mode) */}
            {!selectedCourse && mode !== "Quiz" && (
              <div className="w-full max-w-3xl mt-8 md:mt-12 px-2">
                <div className="relative">
                  <div className="w-full bg-secondary/40 border border-border/30 rounded-full px-6 py-4 pr-14 opacity-50">
                    <span className="text-chat-text-secondary text-sm">Select a course first...</span>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full bg-primary/30 flex items-center justify-center">
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
    <main className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Messages area - takes available space and scrolls */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-4 space-y-8">
          {messages.map((message, index) => (
            <ProfessorMessage key={message.id || index} message={message} messageId={message.id} />
          ))}
          
          {/* Streaming content display */}
          {streamingContent && (
            <ProfessorMessage 
              message={{ role: "assistant", content: streamingContent }} 
              isStreaming={true}
            />
          )}
          
          {isLoading && !streamingContent && (
            <div className="flex gap-4 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2 text-chat-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">
                  {mode === "Quiz" ? "Generating quiz..." : "Thinking..."}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Fixed input area at bottom - never scrolls */}
      <div className="shrink-0 border-t border-border/30 bg-background/95 backdrop-blur-xl p-4">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Uploaded file indicator */}
          {uploadedFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg border border-border/30">
              <Paperclip className="w-4 h-4 text-primary" />
              <span className="text-sm text-chat-text truncate flex-1">{uploadedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 hover:bg-destructive/20"
                onClick={handleRemoveFile}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center gap-2">
              {/* File upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 hover:bg-secondary rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === "Quiz"
                      ? "What topic should I quiz you on?"
                      : !selectedCourse
                      ? "Select a course first..."
                      : "Ask anything..."
                  }
                  disabled={isInputDisabled}
                  className="w-full bg-secondary/70 backdrop-blur-md border border-border/50 rounded-full px-5 py-3.5 pr-14 text-chat-text placeholder:text-chat-text-secondary text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
                <Button
                  type="submit"
                  disabled={isInputDisabled || !input.trim()}
                  size="sm"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 p-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-30 shadow-md"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};
