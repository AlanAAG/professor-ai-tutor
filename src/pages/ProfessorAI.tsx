import { useState, useEffect, useRef } from "react";
import { ProfessorSidebar } from "@/components/professor-ai/ProfessorSidebar";
import { ProfessorChat } from "@/components/professor-ai/ProfessorChat";
import { ProfessorBatchSelection } from "@/components/professor-ai/ProfessorBatchSelection";
import personas from "@/data/personas.json";

export type Mode = "Notes Creator" | "Quiz" | "Study";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

type Persona = {
  display_name?: string;
  professor_name: string;
  style_prompt: string;
};

type BatchPersonas = Record<string, Record<string, Persona>>;

const ProfessorAI = () => {
  const [mode, setMode] = useState<Mode>("Study");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(() => {
    return localStorage.getItem("professorSelectedBatch");
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoTriggered = useRef(false);

  // Get courses for selected batch
  const batchPersonas = (personas as BatchPersonas)[selectedBatch || "2029"] || {};
  const availableClasses = Object.keys(batchPersonas);

  // Clear chat when mode or class changes
  useEffect(() => {
    setMessages([]);
    hasAutoTriggered.current = false;
  }, [mode, selectedClass]);

  // Auto-trigger for Notes Creator mode
  useEffect(() => {
    if (mode === "Notes Creator" && selectedClass && !hasAutoTriggered.current && !isLoading) {
      hasAutoTriggered.current = true;
      sendMessage("Summarize this lecture", true);
    }
  }, [mode, selectedClass]);

  const sendMessage = async (content: string, isHidden = false) => {
    if (!selectedClass) return;

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
            selectedLecture: selectedClass,
            cohort_id: selectedBatch,
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

  const handleBatchSelect = (batchId: string) => {
    localStorage.setItem("professorSelectedBatch", batchId);
    setSelectedBatch(batchId);
    setSelectedClass(null);
    setMessages([]);
  };

  // Show batch selection if not selected
  if (!selectedBatch) {
    return (
      <div className="flex h-screen items-center justify-center bg-professor-bg">
        <ProfessorBatchSelection onBatchSelect={handleBatchSelect} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-professor-bg text-professor-fg">
      <ProfessorSidebar
        mode={mode}
        setMode={setMode}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedBatch={selectedBatch}
        setSelectedBatch={handleBatchSelect}
        batchPersonas={batchPersonas}
        availableClasses={availableClasses}
      />
      
      <ProfessorChat
        messages={messages}
        isLoading={isLoading}
        selectedClass={selectedClass}
        mode={mode}
        onSendMessage={sendMessage}
        onStartQuiz={handleStartQuiz}
        courseName={selectedClass ? batchPersonas[selectedClass]?.display_name : undefined}
      />
    </div>
  );
};

export default ProfessorAI;