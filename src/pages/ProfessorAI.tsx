import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ProfessorChat } from "@/components/professor-ai/ProfessorChat";
import { ProfessorBatchSelection } from "@/components/professor-ai/ProfessorBatchSelection";
import { ProfessorTermSelection } from "@/components/professor-ai/ProfessorTermSelection";
import { ProfessorCourseSelection } from "@/components/professor-ai/ProfessorCourseSelection";
import { ProfessorHeader } from "@/components/professor-ai/ProfessorHeader";
import { ProfessorSidebarNew } from "@/components/professor-ai/ProfessorSidebarNew";
import { QuizCard, Quiz } from "@/components/professor-ai/QuizCard";
import { QuizResults } from "@/components/professor-ai/QuizResults";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Generate a UUID for session tracking
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export type Mode = "Notes Creator" | "Quiz" | "Study";

export interface Message {
  id?: string; // Database ID for feedback tracking
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

// Define courses per batch and term (id = db_key, name = display_name)
const COURSES_BY_BATCH_TERM: Record<string, Record<string, Course[]>> = {
  "2029": {
    "term1": [
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
    "term2": [
      { id: "CareerLabs", name: "Career Labs" },
      { id: "OfflineMarket", name: "How to Crack the offline Market" },
      { id: "GlobalStartupEcon", name: "How to understand the Economics for Global Start-up ecosystem" },
      { id: "D2CBusiness", name: "How to build a D2C Business" },
      { id: "CapstoneHours", name: "Capstone Hours" },
      { id: "BusinessMetrics", name: "How to use Business Metrics to Enhance Efficiency and Drive Innovation" },
      { id: "TaxesCompliance", name: "How to understand Taxes and Compliances" },
      { id: "EconomicForces", name: "How to understand Economics Forces that Shape the World" },
      { id: "WorldCultures", name: "How to Connect World Cultures With Business Practices for Competitive Advantage" },
      { id: "AIMarketing", name: "How can AI improve Marketing Strategies" },
      { id: "BillionDollarBrand", name: "How to Influence Consumers to Build a Billion Dollar Brand" },
    ],
  },
  "2028": {
    "term3": [
      { id: "KickstarterCampaign", name: "How to build a Kickstarter campaign?" },
      { id: "ProductDesignKickstarter", name: "How to develop and design a product for kickstarter success?" },
      { id: "FundraisingVideo", name: "How to craft a fundraising video that converts?" },
      { id: "CapstoneHours", name: "Capstone Hours" },
      { id: "Web3Innovation", name: "How to leverage web3 for entrepreneurial innovation" },
      { id: "BusinessMetrics", name: "How to use business metrics to enhance efficiency and drive innovation" },
      { id: "FundraisingStartups", name: "How can founders raise money for their start-ups" },
      { id: "IPProtection", name: "How to protect your ideas and innovations" },
      { id: "AIPython", name: "How to design AI-powered solutions with Python" },
      { id: "PublicSpeakingLevel2", name: "How to own a stage – Level 2" },
      { id: "CopywritingSells", name: "How to craft compelling copy that sells and builds trust" },
      { id: "SingaporePolicy", name: "Understanding modern Southeast Asia through Singaporean public policy" },
      { id: "EconomicForces", name: "How to understand economic forces that shape the world" },
      { id: "CompetitiveStrategy", name: "How can my business win against the competition" },
      { id: "NUSImmersion", name: "Strategy and innovation immersion at NUS" },
      { id: "CustomerInsights", name: "How to uncover what customers really want" },
    ],
    "term4": [
      { id: "NudgeBehavior", name: "How to Nudge to understand human behaviour" },
      { id: "SustainableNudges", name: "How to use nudges to promote sustainable and healthy behaviors" },
      { id: "FinancialModels", name: "How to build Financial Models?" },
      { id: "ImpactInvestor", name: "How to Think Like an Impact Investor: Risk, Return, and SROI" },
      { id: "TalentManagement", name: "How to attract, manage, and retain talent" },
      { id: "CrossCulturalLeadership", name: "How to negotiate and lead across diverse cultures and stakeholders" },
      { id: "NonProfitBrand", name: "How to position & market your non-profit brand" },
      { id: "SocialImpactVentures", name: "How to design and scale ventures delivering social impact with limited resources?" },
    ],
  },
};

const NO_MATERIALS_FALLBACK_PHRASES = [
  "couldn't find relevant materials",
  "no relevant materials found",
  "content hasn't been uploaded yet",
];

const ProfessorAI = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("Study");
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(() => {
    return localStorage.getItem("professorSelectedBatch");
  });
  const [selectedTerm, setSelectedTerm] = useState<string | null>(() => {
    return localStorage.getItem("professorSelectedTerm");
  });
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [lecturesError, setLecturesError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const hasAutoTriggered = useRef(false);
  
  // Session ID for chat persistence - persists for the duration of the user's visit
  const sessionIdRef = useRef<string>(generateUUID());
  
  // Debug: Log session ID on initialization
  useEffect(() => {
    console.log("Session ID:", sessionIdRef.current);
  }, []);

  // Prevent the browser page from scrolling; only the chat areas should scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Quiz-specific state
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizResults, setQuizResults] = useState<{ score: number; total: number } | null>(null);
  const [lastQuizTopic, setLastQuizTopic] = useState<string>("");
  
  // Feedback dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);

  // Get available courses for selected batch and term
  const availableCourses = selectedBatch && selectedTerm 
    ? COURSES_BY_BATCH_TERM[selectedBatch]?.[selectedTerm] || [] 
    : [];
  
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
    // Clear quiz state when mode changes
    if (mode !== "Quiz") {
      setCurrentQuiz(null);
      setQuizResults(null);
      setLastQuizTopic("");
    }
  }, [mode, selectedLecture]);

  // Handle create notes action (called from ProfessorChat)
  const handleCreateNotes = () => {
    if (mode === "Notes Creator" && selectedCourse && selectedLecture) {
      sendMessage("Summarize this lecture", true);
    }
  };

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

  // Generate quiz using Lovable AI
  const generateQuiz = async (topic: string) => {
    setQuizLoading(true);
    setCurrentQuiz(null);
    setQuizResults(null);
    setLastQuizTopic(topic);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            topic,
            course: getSelectedCourseDisplayName(),
            numQuestions: 10,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate quiz");
      }

      const quizData: Quiz = await response.json();
      
      if (!quizData.questions || quizData.questions.length === 0) {
        throw new Error("No questions generated");
      }

      setCurrentQuiz(quizData);
    } catch (error) {
      console.error("Quiz generation error:", error);
      toast({
        title: "Quiz generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setQuizLoading(false);
    }
  };

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
    // In Quiz mode, treat the message as a quiz topic request
    if (mode === "Quiz") {
      generateQuiz(content);
      // Add to messages for display
      if (!isHidden) {
        setMessages(prev => [...prev, { role: "user", content }]);
      }
      return;
    }

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

  const handleStartQuiz = () => {
    // No longer used - quiz starts when user types a topic
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedLecture(null);
    setMessages([]);
    setStreamingContent("");
    setCurrentQuiz(null);
    setQuizResults(null);
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setMessages([]);
    setStreamingContent("");
    hasAutoTriggered.current = false;
    setCurrentQuiz(null);
    setQuizResults(null);
    setLastQuizTopic("");
  };

  const handleBatchSelect = (batchId: string) => {
    localStorage.setItem("professorSelectedBatch", batchId);
    setSelectedBatch(batchId);
    // Clear term when batch changes
    localStorage.removeItem("professorSelectedTerm");
    setSelectedTerm(null);
    setSelectedCourse(null);
    setSelectedLecture(null);
    setMessages([]);
    setStreamingContent("");
    setCurrentQuiz(null);
    setQuizResults(null);
  };

  const handleTermSelect = (termId: string) => {
    localStorage.setItem("professorSelectedTerm", termId);
    setSelectedTerm(termId);
    setSelectedCourse(null);
    setSelectedLecture(null);
    setMessages([]);
    setStreamingContent("");
    setCurrentQuiz(null);
    setQuizResults(null);
  };

  const handleBackToTermSelection = () => {
    localStorage.removeItem("professorSelectedTerm");
    setSelectedTerm(null);
    setSelectedCourse(null);
    setSelectedLecture(null);
    setMessages([]);
    setStreamingContent("");
    setCurrentQuiz(null);
    setQuizResults(null);
  };

  const handleOpenCourseSelection = () => {
    setSelectedCourse(null);
    setSelectedLecture(null);
    setMessages([]);
    setStreamingContent("");
    setCurrentQuiz(null);
    setQuizResults(null);
  };

  const handleBackToBatchSelection = () => {
    localStorage.removeItem("professorSelectedBatch");
    localStorage.removeItem("professorSelectedTerm");
    setSelectedBatch(null);
    setSelectedTerm(null);
    setSelectedCourse(null);
    setSelectedLecture(null);
    setMessages([]);
    setStreamingContent("");
    setCurrentQuiz(null);
    setQuizResults(null);
  };

  const handleNewChat = () => {
    setMessages([]);
    setStreamingContent("");
    hasAutoTriggered.current = false;
    setCurrentQuiz(null);
    setQuizResults(null);
    setLastQuizTopic("");
    setActiveConversationId(null);
  };

  // Handle selecting a conversation from history
  const handleSelectConversation = async (conversation: { id: string; class_id: string; mode: string; title: string }) => {
    try {
      // Set the course and mode based on conversation
      setSelectedCourse(conversation.class_id);
      setMode(conversation.mode as Mode);
      setActiveConversationId(conversation.id);
      
      // Load messages for this conversation
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Convert to Message format with IDs
      const loadedMessages: Message[] = (messagesData || []).map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      setMessages(loadedMessages);
      setStreamingContent("");
      setCurrentQuiz(null);
      setQuizResults(null);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const handleQuizComplete = (score: number, total: number) => {
    setQuizResults({ score, total });
    setCurrentQuiz(null);
  };

  const handleQuizClose = () => {
    setCurrentQuiz(null);
    setQuizResults(null);
  };

  const handleRetryQuiz = () => {
    if (lastQuizTopic) {
      setQuizResults(null);
      generateQuiz(lastQuizTopic);
    }
  };

  const handleNewQuiz = () => {
    setCurrentQuiz(null);
    setQuizResults(null);
    setMessages([]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleFeedback = () => {
    setFeedbackOpen(true);
  };

  const handleSearchFromToolbar = () => {
    setSidebarOpen(true);
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

  if (!selectedBatch) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <ProfessorBatchSelection onBatchSelect={handleBatchSelect} />
      </div>
    );
  }

  // Show term selection after batch is selected
  if (!selectedTerm) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <ProfessorTermSelection 
          batch={selectedBatch} 
          onTermSelect={handleTermSelect} 
          onBack={handleBackToBatchSelection}
        />
      </div>
    );
  }

  // Show course selection after term is selected
  if (!selectedCourse) {
    return (
      <div className="flex h-screen items-center justify-center bg-background overflow-y-auto">
        <ProfessorCourseSelection
          batch={selectedBatch}
          term={selectedTerm}
          courses={availableCourses}
          onCourseSelect={handleCourseSelect}
          onBack={handleBackToTermSelection}
        />
      </div>
    );
  }

  // Quiz mode rendering
  if (mode === "Quiz") {
    // Show quiz loading
    if (quizLoading) {
      return (
        <div className="flex h-screen bg-background text-foreground">
          <ProfessorSidebarNew
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            activeConversationId={activeConversationId}
            onLogout={handleLogout}
            onFeedback={handleFeedback}
          />
          <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-80" : "lg:ml-14"}`}>
            <ProfessorHeader
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              selectedCourse={selectedCourse}
              onCourseChange={handleCourseSelect}
              selectedMode={mode}
              onModeChange={handleModeChange}
              selectedBatch={selectedBatch}
              onBatchChange={handleBatchSelect}
              selectedTerm={selectedTerm}
              onTermChange={handleTermSelect}
              courses={availableCourses}
              onOpenCourseSelection={handleOpenCourseSelection}
            />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Generating your quiz...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show quiz results
    if (quizResults) {
      return (
        <div className="flex h-screen bg-background text-foreground">
          <ProfessorSidebarNew
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            activeConversationId={activeConversationId}
            onLogout={handleLogout}
            onFeedback={handleFeedback}
          />
          <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-80" : "lg:ml-14"}`}>
            <ProfessorHeader
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              selectedCourse={selectedCourse}
              onCourseChange={handleCourseSelect}
              selectedMode={mode}
              onModeChange={handleModeChange}
              selectedBatch={selectedBatch}
              onBatchChange={handleBatchSelect}
              selectedTerm={selectedTerm}
              onTermChange={handleTermSelect}
              courses={availableCourses}
              onOpenCourseSelection={handleOpenCourseSelection}
            />
            <div className="flex-1 flex items-center justify-center p-4">
              <QuizResults
                score={quizResults.score}
                total={quizResults.total}
                onRetry={handleRetryQuiz}
                onNewQuiz={handleNewQuiz}
              />
            </div>
          </div>
        </div>
      );
    }

    // Show active quiz
    if (currentQuiz) {
      return (
        <div className="flex h-screen bg-background text-foreground">
          <ProfessorSidebarNew
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onNewChat={handleNewChat}
            onSelectConversation={handleSelectConversation}
            activeConversationId={activeConversationId}
            onLogout={handleLogout}
            onFeedback={handleFeedback}
          />
          <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-80" : "lg:ml-14"}`}>
            <ProfessorHeader
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              selectedCourse={selectedCourse}
              onCourseChange={handleCourseSelect}
              selectedMode={mode}
              onModeChange={handleModeChange}
              selectedBatch={selectedBatch}
              onBatchChange={handleBatchSelect}
              selectedTerm={selectedTerm}
              onTermChange={handleTermSelect}
              courses={availableCourses}
              onOpenCourseSelection={handleOpenCourseSelection}
            />
            <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
              <QuizCard
                quiz={currentQuiz}
                onComplete={handleQuizComplete}
                onClose={handleQuizClose}
              />
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Collapsible Sidebar */}
      <ProfessorSidebarNew
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        activeConversationId={activeConversationId}
        onLogout={handleLogout}
        onFeedback={handleFeedback}
      />

      {/* Main content area - offset by sidebar width */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarOpen ? "lg:ml-80" : "lg:ml-14"}`}>
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
          selectedTerm={selectedTerm}
          onTermChange={handleTermSelect}
          courses={availableCourses}
          onOpenCourseSelection={handleOpenCourseSelection}
        />

        {/* Chat area */}
        <div className="flex-1 overflow-hidden">
          <ProfessorChat
            messages={messages}
            isLoading={isLoading || quizLoading}
            streamingContent={streamingContent}
            selectedLecture={selectedLecture}
            selectedCourse={selectedCourse}
            mode={mode}
            onSendMessage={sendMessage}
            onStartQuiz={handleStartQuiz}
            onCreateNotes={handleCreateNotes}
            lectures={filteredLectures}
            onLectureChange={(lecture) => setSelectedLecture(lecture)}
            lecturesLoading={lecturesLoading}
            uploadedFile={uploadedFile}
            onFileUpload={handleFileUpload}
            sessionId={sessionIdRef.current}
          />
        </div>

        {/* Feedback Dialog */}
        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      </div>
    </div>
  );
};

export default ProfessorAI;
