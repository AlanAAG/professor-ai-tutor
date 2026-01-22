import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Mode, Message, ExpertiseLevel } from "@/components/professor-ai/types";

const NO_MATERIALS_FALLBACK_PHRASES = [
  "couldn't find relevant materials",
  "no relevant materials found",
  "content hasn't been uploaded yet",
];

// Pattern to detect expertise level set by AI in response
const EXPERTISE_LEVEL_PATTERN = /USER LEVEL SET:\s*\[?(Novice|Intermediate|Expert)\]?/i;

interface UseProfessorChatProps {
  selectedCourse: string | null;
  selectedBatch: string | null;
  selectedLecture: string | null;
  mode: Mode;
  expertiseLevel: ExpertiseLevel;
  onExpertiseLevelChange?: (level: ExpertiseLevel) => void;
}

export const useProfessorChat = ({
  selectedCourse,
  selectedBatch,
  selectedLecture,
  mode,
  expertiseLevel,
  onExpertiseLevelChange,
}: UseProfessorChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);

  // Session ID for chat persistence - persists for the duration of the user's visit
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  // Debug: Log session ID on initialization
  useEffect(() => {
    console.log("Session ID:", sessionIdRef.current);
  }, []);

  // Clear chat when mode or lecture changes
  useEffect(() => {
    setMessages([]);
    setStreamingContent("");
  }, [mode, selectedLecture]);

  const checkForNoMaterialsFallback = (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    return NO_MATERIALS_FALLBACK_PHRASES.some(phrase => lowerContent.includes(phrase));
  };

  // Parse AI response for expertise level auto-detection
  const parseExpertiseLevelFromResponse = useCallback((content: string) => {
    const match = content.match(EXPERTISE_LEVEL_PATTERN);
    if (match && onExpertiseLevelChange) {
      const detectedLevel = match[1] as ExpertiseLevel;
      console.log("Auto-detected expertise level:", detectedLevel);
      onExpertiseLevelChange(detectedLevel);
    }
  }, [onExpertiseLevelChange]);

  const saveConversationAndMessage = async (userContent: string, assistantContent: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return null;

      const userId = session.session.user.id;
      let conversationId = activeConversationId;

      // Create conversation if it doesn't exist
      if (!conversationId) {
        const title = userContent.slice(0, 50) + (userContent.length > 50 ? "..." : "");
        const { data: newConversation, error: convError } = await supabase
          .from("conversations")
          .insert({
            user_id: userId,
            title,
            class_id: selectedCourse || "",
            mode,
          })
          .select()
          .single();

        if (convError) throw convError;
        conversationId = newConversation.id;
        setActiveConversationId(conversationId);
      }

      // Save user message
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: userContent,
      });

      // Save assistant message and get its ID
      const { data: assistantMsg, error: msgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content: assistantContent,
        })
        .select()
        .single();

      if (msgError) throw msgError;
      return assistantMsg.id;
    } catch (error) {
      console.error("Error saving conversation:", error);
      return null;
    }
  };

  const sendMessage = async (content: string, isHidden = false) => {
    if (!selectedCourse) return;

    const userMessage: Message = { role: "user", content };

    // Only show user message if not hidden
    if (!isHidden) {
      setMessages(prev => [...prev, userMessage]);
    }

    setIsLoading(true);
    setStreamingContent("");

    try {
      // Send selectedLecture as null or empty string if "All Lectures" is selected or not selected
      const lectureToSend = selectedLecture === "__all__" ? null : selectedLecture;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "x-cohort-id": selectedBatch || "2029",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            mode,
            selectedCourse: selectedCourse, // Send the db_key
            selectedLecture: lectureToSend, // The lecture title or null
            session_id: sessionIdRef.current, // Session ID for backend chat persistence
            cohort_id: selectedBatch,
            expertise_level: expertiseLevel, // Adaptive learning - user's expertise level
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Check if streaming response
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream") || contentType?.includes("text/plain")) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            // Parse SSE events
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const msgContent = parsed.choices?.[0]?.delta?.content || parsed.content || parsed.chunk || data;
                  if (typeof msgContent === 'string') {
                    accumulatedContent += msgContent;
                    setStreamingContent(accumulatedContent);
                  }
                } catch {
                  // If not valid JSON, treat as raw text
                  if (data.trim() && data !== '[DONE]') {
                    accumulatedContent += data;
                    setStreamingContent(accumulatedContent);
                  }
                }
              } else if (line.trim() && !line.startsWith(':')) {
                // Handle non-SSE text chunks
                accumulatedContent += line;
                setStreamingContent(accumulatedContent);
              }
            }
          }
        }

        // Finalize streaming message
        if (accumulatedContent) {
          // Check for no materials fallback
          if (checkForNoMaterialsFallback(accumulatedContent)) {
            toast({
              title: "No materials found",
              description: `Check if you're in the correct cohort (currently: ${selectedBatch}). Try switching between 2028 and 2029.`,
              variant: "destructive",
            });
          }

          // Parse for expertise level auto-detection
          parseExpertiseLevelFromResponse(accumulatedContent);

          // Save to database and get message ID
          const messageId = await saveConversationAndMessage(content, accumulatedContent);

          setMessages(prev => [
            ...prev,
            { id: messageId || undefined, role: "assistant", content: accumulatedContent },
          ]);
        }
        setStreamingContent("");
      } else {
        // Handle JSON response
        const data = await response.json();
        const responseContent = data.response || data.content || "No response received.";

        // Check for no materials fallback
        if (checkForNoMaterialsFallback(responseContent)) {
          toast({
            title: "No materials found",
            description: `Check if you're in the correct cohort (currently: ${selectedBatch}). Try switching between 2028 and 2029.`,
            variant: "destructive",
          });
        }

        // Parse for expertise level auto-detection
        parseExpertiseLevelFromResponse(responseContent);

        // Also check if backend returned expertise_level in metadata
        if (data.expertise_level && onExpertiseLevelChange) {
          console.log("Backend returned expertise level:", data.expertise_level);
          onExpertiseLevelChange(data.expertise_level as ExpertiseLevel);
        }

        // Save to database and get message ID
        const messageId = await saveConversationAndMessage(content, responseContent);

        const assistantMessage: Message = {
          id: messageId || undefined,
          role: "assistant",
          content: responseContent,
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  };

  const loadConversation = async (conversation: { id: string; class_id: string; mode: string }) => {
    try {
      setActiveConversationId(conversation.id);

      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const loadedMessages: Message[] = (messagesData || []).map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      setMessages(loadedMessages);
      setStreamingContent("");
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const resetChat = (regenerateSession = false) => {
    setMessages([]);
    setStreamingContent("");
    setActiveConversationId(null);
    
    // Regenerate session ID when switching courses for expertise isolation
    if (regenerateSession) {
      sessionIdRef.current = crypto.randomUUID();
      console.log("New Session ID:", sessionIdRef.current);
    }
  };

  const handleFileUpload = (file: { name: string; content: string } | null) => {
    setUploadedFile(file);
    if (file) {
      toast({
        title: "File loaded",
        description: `${file.name} is ready to use as context`,
      });
    }
  };

  return {
    messages,
    setMessages, // Exposed for external manipulation if needed (e.g. Quiz mode adding user message)
    isLoading,
    streamingContent,
    sessionId: sessionIdRef.current,
    activeConversationId,
    sendMessage,
    loadConversation,
    resetChat,
    uploadedFile,
    handleFileUpload,
  };
};
