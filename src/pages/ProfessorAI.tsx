import { useState, useEffect, useRef } from "react";
import { ProfessorSidebar } from "@/components/professor-ai/ProfessorSidebar";
import { ProfessorChat } from "@/components/professor-ai/ProfessorChat";
import { ProfessorBatchSelection } from "@/components/professor-ai/ProfessorBatchSelection";

export type Mode = "Notes Creator" | "Quiz" | "Study";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Lecture {
  id: string;
  title: string;
  class_name?: string;
}

// Define courses per batch
const COURSES_BY_BATCH: Record<string, { id: string; name: string }[]> = {
  "2029": [
    { id: "anatomy", name: "Anatomy" },
    { id: "physiology", name: "Physiology" },
    { id: "biochemistry", name: "Biochemistry" },
  ],
  "2028": [
    { id: "pathology", name: "Pathology" },
    { id: "pharmacology", name: "Pharmacology" },
    { id: "microbiology", name: "Microbiology" },
  ],
};

const ProfessorAI = () => {
  const [mode, setMode] = useState<Mode>("Study");
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(() => {
    return localStorage.getItem("professorSelectedBatch");
  });
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [lecturesError, setLecturesError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasAutoTriggered = useRef(false);

  // Get available courses for selected batch
  const availableCourses = selectedBatch ? COURSES_BY_BATCH[selectedBatch] || [] : [];
  
  // Filter lectures by selected course (matching class_name)
  const filteredLectures = selectedCourse 
    ? lectures.filter(lecture => lecture.class_name === selectedCourse)
    : [];

  // Fetch lectures when batch is selected
  useEffect(() => {
    if (!selectedBatch) return;

    const fetchLectures = async () => {
      setLecturesLoading(true);
      setLecturesError(false);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-chat?endpoint=lectures`,
          {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Filter out any lectures with empty or null IDs
          const validLectures = (data.lectures || []).filter(
            (lecture: Lecture) => lecture.id && lecture.id.trim() !== ""
          );
          setLectures(validLectures);
        } else {
          console.error("Failed to fetch lectures:", response.status);
          setLecturesError(true);
          setLectures([]);
        }
      } catch (error) {
        console.error("Failed to fetch lectures:", error);
        setLecturesError(true);
        setLectures([]);
      } finally {
        setLecturesLoading(false);
      }
    };

    fetchLectures();
  }, [selectedBatch]);

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
            selectedLecture, // Pass the lecture title/name as selectedLecture
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

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedLecture(null);
    setMessages([]);
  };

  const handleBatchSelect = (batchId: string) => {
    localStorage.setItem("professorSelectedBatch", batchId);
    setSelectedBatch(batchId);
    setSelectedCourse(null);
    setSelectedLecture(null);
    setMessages([]);
  };

  // Show batch selection if not selected
  if (!selectedBatch) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <ProfessorBatchSelection onBatchSelect={handleBatchSelect} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <ProfessorSidebar
        mode={mode}
        setMode={setMode}
        selectedLecture={selectedLecture}
        setSelectedLecture={setSelectedLecture}
        selectedCourse={selectedCourse}
        setSelectedCourse={handleCourseSelect}
        selectedBatch={selectedBatch}
        setSelectedBatch={handleBatchSelect}
        courses={availableCourses}
        lectures={filteredLectures}
        lecturesLoading={lecturesLoading}
        lecturesError={lecturesError}
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