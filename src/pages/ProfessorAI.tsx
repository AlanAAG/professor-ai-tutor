import { useState, useEffect, useRef } from "react";
import { ProfessorSidebar } from "@/components/professor-ai/ProfessorSidebar";
import { ProfessorChat } from "@/components/professor-ai/ProfessorChat";
import { supabase } from "@/integrations/supabase/client";

export type Mode = "Notes Creator" | "Quiz" | "Study";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const ProfessorAI = () => {
  const [mode, setMode] = useState<Mode>("Study");
  const [selectedLecture, setSelectedLecture] = useState<string>("");
  const [lectures, setLectures] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const hasAutoTriggered = useRef(false);

  // Fetch lectures on mount
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("professor-chat", {
          body: {},
          headers: {},
        });

        // Use query param approach for lectures
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-chat?endpoint=lectures`,
          {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          setLectures(result.lectures || []);
        }
      } catch (error) {
        console.error("Failed to fetch lectures:", error);
      } finally {
        setLecturesLoading(false);
      }
    };

    fetchLectures();
  }, []);

  // Clear chat when mode or lecture changes
  useEffect(() => {
    setMessages([]);
    hasAutoTriggered.current = false;
  }, [mode, selectedLecture]);

  // Auto-trigger for Notes Creator mode
  useEffect(() => {
    if (mode === "Notes Creator" && selectedLecture && !hasAutoTriggered.current && !isLoading) {
      hasAutoTriggered.current = true;
      sendMessage("Summarize this lecture", true);
    }
  }, [mode, selectedLecture]);

  const sendMessage = async (content: string, isHidden = false) => {
    if (!selectedLecture) return;

    const userMessage: Message = { role: "user", content };
    
    // Only show user message if not hidden
    if (!isHidden) {
      setMessages(prev => [...prev, userMessage]);
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            mode,
            selectedLecture,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || data.content || "No response received.",
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = () => {
    sendMessage("Start Quiz");
  };

  return (
    <div className="flex h-screen bg-professor-bg text-professor-fg">
      <ProfessorSidebar
        mode={mode}
        setMode={setMode}
        selectedLecture={selectedLecture}
        setSelectedLecture={setSelectedLecture}
        lectures={lectures}
        lecturesLoading={lecturesLoading}
      />
      
      <ProfessorChat
        messages={messages}
        isLoading={isLoading}
        selectedLecture={selectedLecture}
        mode={mode}
        onSendMessage={sendMessage}
        onStartQuiz={handleStartQuiz}
      />
    </div>
  );
};

export default ProfessorAI;