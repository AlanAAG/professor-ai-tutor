import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "./ChatMessage";
import { Loader2, Send, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import personas from "@/data/personas.json";
import { BatchSelection } from "./BatchSelection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type BatchPersonas = Record<string, Record<string, Persona>>;

type Mode = "balanced" | "study" | "professor" | "socratic";

const MODE_DESCRIPTIONS = {
  balanced: "Balanced tutor - A helpful mix of guidance and explanation",
  study: "Study buddy - Helps you review and reinforce material",
  professor: "Professor mode - Authoritative first-person teaching style",
  socratic: "Socratic method - Guides you to discover answers through questions",
};

interface ChatInterfaceProps {
  onConversationChange?: (conversationId: string | null) => void;
}

export interface ChatInterfaceHandle {
  loadConversation: (conversationId: string) => Promise<void>;
  handleNewChat: () => void;
  activeConversationId: string | null;
}

export const ChatInterface = React.forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(
  function ChatInterface({ onConversationChange }, ref) {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [input, setInput] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [selectedClass, setSelectedClass] = React.useState<string | null>(null);
    const [selectedMode, setSelectedMode] = React.useState<Mode>("balanced");
    const [selectedBatch, setSelectedBatch] = React.useState<string | null>(() => {
      return localStorage.getItem("selectedBatch");
    });
    const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const batchPersonas = (personas as BatchPersonas)[selectedBatch || "2029"] || {};
    const availableClasses = Object.keys(batchPersonas);
    const { toast } = useToast();

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
      scrollToBottom();
    }, [messages]);

    const loadConversation = React.useCallback(async (conversationId: string) => {
      try {
        setIsLoading(true);
        
        const { data: conversation, error: convError } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", conversationId)
          .single();

        if (convError) throw convError;

        const { data: messageData, error: msgError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (msgError) throw msgError;

        setMessages(messageData.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
          sources: msg.sources as Source[] | undefined,
        })));

        setSelectedClass(conversation.class_id);
        setSelectedMode(conversation.mode as Mode);
        setActiveConversationId(conversationId);
        onConversationChange?.(conversationId);
      } catch (error) {
        console.error("Error loading conversation:", error);
        toast({
          title: "Error",
          description: "Failed to load conversation",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, [onConversationChange, toast]);

    const handleNewChat = React.useCallback(() => {
      setMessages([]);
      setActiveConversationId(null);
      setInput("");
      onConversationChange?.(null);
    }, [onConversationChange]);

    React.useImperativeHandle(ref, () => ({
      loadConversation,
      handleNewChat,
      activeConversationId,
    }), [loadConversation, handleNewChat, activeConversationId]);

    const streamChat = async (userMessage: string, conversationId: string) => {
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
          persona: selectedMode,
          cohort_id: selectedBatch,
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
            
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            
            if (parsed.sources) {
              sources = parsed.sources || [];
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
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        const lines = textBuffer.split("\n");
        for (const line of lines) {
          if (line.trim() && line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr !== "[DONE]") {
              try {
                const parsed = JSON.parse(jsonStr);
                
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

      // Save assistant message to database
      if (assistantContent.trim()) {
        await supabase.from("messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantContent,
          sources: sources.length > 0 ? sources : null,
        });
      }

      if (!assistantContent.trim()) {
        throw new Error("The AI didn't send any content. Please try again.");
      }
    };

    const handleSend = async () => {
      if (!input.trim() || isLoading || !selectedClass) return;

      const userMessage = input.trim();
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
      setIsLoading(true);

      try {
        // Create or get conversation
        let conversationId = activeConversationId;
        if (!conversationId) {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error("Not authenticated");

          const title = userMessage.length > 50 
            ? userMessage.substring(0, 50) + "..." 
            : userMessage;

          const { data: newConv, error: convError } = await supabase
            .from("conversations")
            .insert({
              user_id: session.session.user.id,
              title,
              class_id: selectedClass,
              mode: selectedMode,
            })
            .select()
            .single();

          if (convError) throw convError;
          conversationId = newConv.id;
          setActiveConversationId(conversationId);
          onConversationChange?.(conversationId);
        }

        // Save user message
        const { error: userMsgError } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            role: "user",
            content: userMessage,
          });

        if (userMsgError) throw userMsgError;

        // Increment prompt counter
        await supabase.rpc('increment_prompt_count');
        
        await streamChat(userMessage, conversationId);
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

    // Show batch selection if not selected
    if (!selectedBatch) {
      return (
        <div className="flex flex-col h-full items-center justify-center bg-background p-4">
          <BatchSelection onBatchSelect={(batchId) => {
            localStorage.setItem("selectedBatch", batchId);
            setSelectedBatch(batchId);
            setSelectedClass(null); // Reset course when batch changes
          }} />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="border-b bg-card p-3 md:p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap flex-shrink-0">
                    Course:
                  </span>
                  <Select 
                    value={selectedClass || ""} 
                    onValueChange={setSelectedClass}
                    disabled={!!activeConversationId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
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
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap flex-shrink-0">
                    Mode:
                  </span>
                  <Select 
                    value={selectedMode} 
                    onValueChange={async (value) => {
                      const newMode = value as Mode;
                      setSelectedMode(newMode);
                      
                      // Update mode in database if conversation exists
                      if (activeConversationId) {
                        try {
                          await supabase
                            .from("conversations")
                            .update({ mode: newMode })
                            .eq("id", activeConversationId);
                        } catch (error) {
                          console.error("Error updating conversation mode:", error);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-full md:w-[140px]">
                      <span className="capitalize truncate">{selectedMode}</span>
                    </SelectTrigger>
                    <SelectContent className="w-[320px]">
                      {(Object.keys(MODE_DESCRIPTIONS) as Mode[]).map((mode) => (
                        <SelectItem key={mode} value={mode} className="cursor-pointer">
                          <div className="flex flex-col items-start py-1">
                            <span className="font-medium capitalize text-sm mb-0.5">{mode}</span>
                            <span className="text-xs text-muted-foreground whitespace-normal leading-tight max-w-[280px]">
                              {MODE_DESCRIPTIONS[mode]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("selectedBatch");
                    setSelectedBatch(null);
                    setSelectedClass(null);
                    setMessages([]);
                    setActiveConversationId(null);
                    onConversationChange?.(null);
                  }}
                  className="flex-shrink-0"
                >
                  {selectedBatch === "2029" ? "2029" : "2028"} Batch
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Welcome to Ask TETR</p>
                <p className="text-sm">
                  {selectedClass 
                    ? "Ask your first question to get started!" 
                    : "Select a course above to begin"}
                </p>
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
              placeholder={selectedClass ? "Ask your question..." : "Select a course first..."}
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
  }
);

ChatInterface.displayName = "ChatInterface";
