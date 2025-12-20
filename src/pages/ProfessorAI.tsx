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

// Define courses per batch (id = class_name key, name = display_name)
const COURSES_BY_BATCH: Record<string, { id: string; name: string }[]> = {
  "2029": [
    { id: "AIML", name: "How do machines see, hear or speak" },
    { id: "Excel", name: "How to get comfortable with excel" },
    { id: "Statistics", name: "How to use statistics to build a better business" },
    { id: "Calculus", name: "Calculus" },
    { id: "Dropshipping", name: "How to build a dropshipping business" },
    { id: "PublicSpeaking", name: "How to own a stage" },
    { id: "Startup", name: "How to validate, shape, and launch a startup" },
    { id: "Networking", name: "How to network effortlessly" },
    { id: "OOP", name: "Object-Oriented Programming" },
    { id: "MarketAnalysis", name: "How to read market for better decision making" },
    { id: "MarketGaps", name: "How to identify gaps in the market" },
    { id: "MetaMarketing", name: "How to execute digital marketing on Meta" },
    { id: "CRO", name: "How to execute CRO and increase AOV" },
    { id: "FinanceBasics", name: "How to understand basic financial terminology" },
    { id: "HowToDecodeGlobalTrendsAndNavigateEconomicTransformations", name: "How to decode global trends and navigate economic transformations" },
  ],
  "2028": [
    { id: "Web3Innovation", name: "How to leverage web3 for entrepreneurial innovation" },
    { id: "BusinessMetrics", name: "How to use business metrics to enhance efficiency and drive innovation" },
    { id: "FundraisingStartups", name: "How can founders raise money for their start-ups" },
    { id: "IPProtection", name: "How to protect your ideas and innovations" },
    { id: "AIPython", name: "How to design AI-powered solutions with Python" },
    { id: "KickstarterCampaign", name: "How to build a Kickstarter campaign?" },
    { id: "ProductDesignKickstarter", name: "How to develop and design a product for kickstarter success?" },
    { id: "FundraisingVideo", name: "How to craft a fundraising video that converts?" },
    { id: "CapstoneHours", name: "Capstone Hours" },
    { id: "PublicSpeakingLevel2", name: "How to own a stage - Level 2" },
    { id: "CopywritingSells", name: "How to craft compelling copy that sells and builds trust" },
    { id: "CompetitiveStrategy", name: "How can my business win against the competition" },
    { id: "NUSImmersion", name: "Strategy and innovation immersion at NUS" },
    { id: "SingaporePolicy", name: "Understanding modern Southeast Asia through Singaporean public policy" },
    { id: "EconomicForces", name: "How to understand economic forces that shape the world" },
    { id: "CustomerInsights", name: "How to uncover what customers really want" },
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

  // Auto-trigger for Notes Creator mode - only when BOTH course AND lecture are selected
  useEffect(() => {
    if (mode === "Notes Creator" && selectedCourse && selectedLecture && !hasAutoTriggered.current && !isLoading) {
      hasAutoTriggered.current = true;
      sendMessage("Summarize this lecture", true);
    }
  }, [mode, selectedCourse, selectedLecture]);

  // Get the display name for selected course
  const getSelectedCourseDisplayName = () => {
    const course = availableCourses.find(c => c.id === selectedCourse);
    return course?.name || selectedCourse;
  };

  const sendMessage = async (content: string, isHidden = false) => {
    if (!selectedLecture || !selectedCourse) return;

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
            selectedCourse: getSelectedCourseDisplayName(), // Send the display name
            selectedLecture, // The lecture title
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