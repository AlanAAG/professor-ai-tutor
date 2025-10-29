import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatMessage } from "./ChatMessage";
import { Loader2, Send, BookOpen, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

type Source = {
  content: string;
  metadata?: {
    class_name?: string;
    section?: string;
    title?: string;
    source_url?: string;
  };
  similarity?: number;
};

type Message = { 
  role: "user" | "assistant"; 
  content: string; 
  sources?: Source[];
};

const SUBJECTS = [
  "AIML101 How do machines see, hear or speak",
  "PRTC301 How to use statistics to build a better business",
  "PRTC201 How to get comfortable with excel",
  "FIFI101 How to understand basic financial terminology",
  "LA101 How to decode global trends and navigate economic transformations",
  "MAST102 How to read market for better decision making",
  "SAMA101 How to identify gaps in the market",
  "SAMA401 How to execute digital marketing on Meta",
  "SAMA502 How to execute CRO and increase AOV",
  "MAST401 How to validate, shape, and launch a startup",
  "COMM101 How to own a stage",
  "DRP101 How to build a dropshipping business",
  "MAST601 How to network effortlessly",
];

const PERSONAS = {
  "Study": "Reinforce knowledge by explaining concepts from the course materials with clear examples and interactive Q&A",
  "Quiz Maker": "Generate quiz questions and practice problems based strictly on the course content to test understanding",
  "Professor": "Teach concepts like a professor would, providing thorough academic explanations with depth and context from the lectures",
  "Summary Creator": "Create comprehensive summaries of specific topics found in the database, condensing key information efficiently",
};

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedPersona, setSelectedPersona] = useState<string>("Study");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear chat when class changes
  useEffect(() => {
    if (selectedClass && messages.length > 0) {
      setMessages([]);
      toast({
        title: "Chat cleared",
        description: `Switched to ${selectedClass}`,
      });
    }
  }, [selectedClass]);

  const streamChat = async (userMessage: string) => {
    const CHAT_URL = "https://professor-agent-platform.onrender.com/api/chat";
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_API_KEY,
      },
      body: JSON.stringify({
        messages: [...messages, { role: "user", content: userMessage }],
        selectedClass,
        persona: PERSONAS[selectedPersona as keyof typeof PERSONAS],
      }),
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429 || resp.status === 402) {
        const error = await resp.json();
        throw new Error(error.error);
      }
      throw new Error("Failed to start stream");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let assistantContent = "";
    let sources: Source[] = [];

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          
          // Check for sources in the first chunk
          if (parsed.sources) {
            sources = parsed.sources || [];
          }
          
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent, sources } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent, sources }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!selectedClass) {
      toast({
        title: "Select a subject",
        description: "Please choose a subject before asking questions",
        variant: "destructive",
      });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      await streamChat(userMessage);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with controls */}
      <div className="border-b bg-card p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">A TETR Way to Study</h1>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPersona} onValueChange={setSelectedPersona}>
              <SelectTrigger>
                <SelectValue placeholder="Teaching Style" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PERSONAS).map((persona) => (
                  <SelectItem key={persona} value={persona}>
                    {persona}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Welcome to TETR AI Tutor</p>
              <p className="text-sm">Select a subject and ask your first question to get started!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatMessage 
                key={idx} 
                role={msg.role} 
                content={msg.content}
                sources={msg.sources}
              />
            ))
          )}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={selectedClass ? "Ask your question..." : "Select a subject first..."}
            disabled={isLoading || !selectedClass}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim() || !selectedClass}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
