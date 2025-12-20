import { useState, useEffect, useRef } from "react";
import { ProfessorSidebar } from "@/components/professor-ai/ProfessorSidebar";
import { ProfessorChat } from "@/components/professor-ai/ProfessorChat";

export type Mode = "Notes Creator" | "Quiz" | "Study";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const PROFESSOR_API_URL = import.meta.env.VITE_PROFESSOR_API_URL || "";

const ProfessorAI = () => {
  const [mode, setMode] = useState<Mode>("Study");
  const [selectedLecture, setSelectedLecture] = useState<string>("");
  const [lectures, setLectures] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lecturesLoading, setLecturesLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const hasAutoTriggered = useRef(false);

  // Fetch lectures on mount
  useEffect(() => {
    const fetchLectures = async () => {
      if (!PROFESSOR_API_URL) {
        setLecturesLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${PROFESSOR_API_URL}/api/lectures`, {
          headers: {
            "x-api-key": apiKey,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setLectures(data.lectures || []);
        }
      } catch (error) {
        console.error("Failed to fetch lectures:", error);
      } finally {
        setLecturesLoading(false);
      }
    };

    if (apiKey) {
      fetchLectures();
    } else {
      setLecturesLoading(false);
    }
  }, [apiKey]);

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
    if (!selectedLecture || !PROFESSOR_API_URL) return;

    const userMessage: Message = { role: "user", content };
    
    // Only show user message if not hidden
    if (!isHidden) {
      setMessages(prev => [...prev, userMessage]);
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${PROFESSOR_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          mode,
          selectedLecture,
        }),
      });

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
        apiKey={apiKey}
        setApiKey={setApiKey}
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
