import { useState, useEffect, useRef } from "react";
import { ProfessorChat } from "@/components/professor-ai/ProfessorChat";
import { ProfessorBatchSelection } from "@/components/professor-ai/ProfessorBatchSelection";
import { ProfessorHeader } from "@/components/professor-ai/ProfessorHeader";
import { ProfessorDrawer } from "@/components/professor-ai/ProfessorDrawer";
import { toast } from "@/hooks/use-toast";

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

// Course interface with db_key for backend communication
export interface Course {
  id: string;      // db_key for backend
  name: string;    // display name
}

// Define courses per batch from persona.json (id = db_key, name = display_name)
const COURSES_BY_BATCH: Record<string, Course[]> = {
  "2029": [
    { id: "AIML", name: "How do machines see, hear or speak" },
    { id: "Calculus", name: "Calculus" },
    { id: "Dropshipping", name: "Dropshipping" },
    { id: "PublicSpeaking", name: "How to own a stage" },
    { id: "OOP", name: "OOP" },
    { id: "DRP101", name: "How to build a dropshipping business" },
    { id: "FinanceBasics", name: "How to understand basic financial terminology" },
    { id: "LA101", name: "How to decode global trends and navigate economic transformations" },
    { id: "MarketAnalysis", name: "How to read market for better decision making" },
    { id: "Startup", name: "How to validate, shape, and launch a startup" },
    { id: "Networking", name: "How to network effortlessly" },
    { id: "Excel", name: "How to use excel" },
    { id: "Statistics", name: "How to use statistics to build a better business" },
    { id: "MarketGaps", name: "How to identify gaps in the market" },
    { id: "MetaMarketing", name: "How to execute digital marketing on Meta" },
    { id: "CRO", name: "How to execute CRO and increase AOV" },
  ],
  "2028": [
    { id: "MarketResearch", name: "Market Research" },
    { id: "Kickstarter", name: "Kickstarter Campaign" },
    { id: "Prototyping", name: "Prototyping" },
    { id: "FundraisingVideo", name: "Fundraising Video" },
    { id: "CapstoneHours", name: "Capstone Hours" },
    { id: "PublicSpeaking", name: "Public Speaking" },
    { id: "Copywriting", name: "Copywriting" },
    { id: "Web3", name: "Web3 & Blockchain" },
    { id: "BusinessMetrics", name: "Business Metrics" },
    { id: "VCFundraising", name: "VC Fundraising" },
    { id: "IPLaw", name: "IP Law" },
    { id: "PythonAI", name: "Python for AI" },
    { id: "Strategy", name: "Business Strategy" },
    { id: "InnovationImmersion", name: "Innovation Immersion" },
    { id: "SEAsiaPolicy", name: "SE Asia Policy" },
    { id: "Macroeconomics", name: "Macroeconomics" },
  ],
};

const NO_MATERIALS_FALLBACK_PHRASES = [
  "couldn't find relevant materials",
  "no relevant materials found",
  "content hasn't been uploaded yet",
];

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
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasAutoTriggered = useRef(false);

  // Get available courses for selected batch
  const availableCourses = selectedBatch ? COURSES_BY_BATCH[selectedBatch] || [] : [];
  
  // Filter lectures by selected course (matching class_name to db_key)
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
              "x-cohort-id": selectedBatch,
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
    setStreamingContent("");
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

  // Check if response contains "no materials found" fallback
  const checkForNoMaterialsFallback = (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    return NO_MATERIALS_FALLBACK_PHRASES.some(phrase => lowerContent.includes(phrase));
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
            cohort_id: selectedBatch,
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
                  const content = parsed.choices?.[0]?.delta?.content || parsed.content || parsed.chunk || data;
                  if (typeof content === 'string') {
                    accumulatedContent += content;
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

          setMessages(prev => [
            ...prev,
            { role: "assistant", content: accumulatedContent },
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

        const assistantMessage: Message = {
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

  const handleStartQuiz = () => {
    sendMessage("Start Quiz");
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedLecture(null);
    setMessages([]);
    setStreamingContent("");
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setMessages([]);
    setStreamingContent("");
    hasAutoTriggered.current = false;
  };

  const handleBatchSelect = (batchId: string) => {
    localStorage.setItem("professorSelectedBatch", batchId);
    setSelectedBatch(batchId);
    setSelectedCourse(null);
    setSelectedLecture(null);
    setMessages([]);
    setStreamingContent("");
  };

  const handleNewChat = () => {
    setMessages([]);
    setStreamingContent("");
    hasAutoTriggered.current = false;
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
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header with selectors */}
      <ProfessorHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        selectedCourse={selectedCourse}
        onCourseChange={handleCourseSelect}
        selectedMode={mode}
        onModeChange={handleModeChange}
        selectedBatch={selectedBatch}
        onBatchChange={handleBatchSelect}
        courses={availableCourses}
      />

      {/* Drawer */}
      <ProfessorDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
      />

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ProfessorChat
          messages={messages}
          isLoading={isLoading}
          streamingContent={streamingContent}
          selectedLecture={selectedLecture}
          selectedCourse={selectedCourse}
          mode={mode}
          onSendMessage={sendMessage}
          onStartQuiz={handleStartQuiz}
          lectures={filteredLectures}
          onLectureChange={(lecture) => setSelectedLecture(lecture)}
          lecturesLoading={lecturesLoading}
        />
      </div>
    </div>
  );
};

export default ProfessorAI;
