import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "./ChatMessage";
import { Loader2, Send, BookOpen, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import personas from "@/data/personas.json";

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

type Persona = {
  display_name?: string;
  professor_name: string;
  style_prompt: string;
};


export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableClasses = Object.keys(personas) as string[];
  const selectedPersona = selectedClass ? (personas as Record<string, Persona>)[selectedClass] : null;
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    const CHAT_URL = "https://professor-agent-platform.onrender.com/api/chat";
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_API_KEY,
      },
      body: JSON.stringify({
        messages: [...messages.map(({ role, content }) => ({ role, content })), { role: "user", content: userMessage }],
        class_id: selectedClass,
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
        console.debug("[SSE line]", line);
        
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          console.debug("[SSE parsed]", parsed);
          
          // Check for server error
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          
          // Check for sources in the first chunk
          if (parsed.sources) {
            sources = parsed.sources || [];
          }
          
          // Accept multiple token shapes
          const content = parsed?.choices?.[0]?.delta?.content || parsed?.content || parsed?.text;
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
        } catch (e) {
          // If it's an error from backend, re-throw it
          if (e instanceof Error && e.message !== "Unexpected token") {
            throw e;
          }
          // Otherwise it's a JSON parse error, keep the line in buffer
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Process any remaining buffer after stream ends
    if (textBuffer.trim()) {
      const lines = textBuffer.split("\n");
      for (const line of lines) {
        if (line.trim() && line.startsWith("data: ")) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr !== "[DONE]") {
            try {
              const parsed = JSON.parse(jsonStr);
              console.debug("[SSE final buffer]", parsed);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              if (parsed.sources && !sources.length) {
                sources = parsed.sources;
              }
              
              const content = parsed?.choices?.[0]?.delta?.content || parsed?.content || parsed?.text;
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
            } catch (e) {
              if (e instanceof Error && e.message !== "Unexpected token") {
                throw e;
              }
            }
          }
        }
      }
    }

    // Check if we got any content
    if (!assistantContent.trim()) {
      throw new Error("The AI didn't send any content. Please try again.");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Increment prompt counter
      await supabase.rpc('increment_prompt_count');
      
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

  // Show class selection if no class is selected
  if (!selectedClass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-2xl p-8 max-h-[90vh] flex flex-col">
          <h1 className="text-3xl font-bold text-center mb-2">🎓 Professor AI Tutor</h1>
          <p className="text-center text-muted-foreground mb-8">
            Select a course to start chatting with your AI professor
          </p>
          <div className="overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableClasses.map((classId) => {
                const persona = (personas as Record<string, Persona>)[classId];
                return (
                  <Button
                    key={classId}
                    onClick={() => setSelectedClass(classId)}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-primary/10"
                  >
                    <span className="font-semibold text-lg">{persona.display_name || classId}</span>
                    <span className="text-sm text-muted-foreground">
                      Faculty: {persona.professor_name}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">{selectedClass} - AI Tutor</h1>
                <p className="text-sm text-muted-foreground">
                  Professor: {selectedPersona?.professor_name}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedClass(null);
                setMessages([]);
              }}
            >
              Change Class
            </Button>
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
            placeholder="Ask your question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
