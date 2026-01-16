import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProfessorBatchSelection } from "@/components/professor-ai/ProfessorBatchSelection";
import { ProfessorTermSelection } from "@/components/professor-ai/ProfessorTermSelection";
import { ProfessorCourseSelection } from "@/components/professor-ai/ProfessorCourseSelection";
import { ProfessorHeader } from "@/components/professor-ai/ProfessorHeader";
import { ProfessorSidebarNew } from "@/components/professor-ai/ProfessorSidebarNew";
import { QuizView } from "@/components/professor-ai/QuizView";
import { ChatView } from "@/components/professor-ai/ChatView";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { supabase } from "@/integrations/supabase/client";
import { COURSES_BY_BATCH_TERM } from "@/data/courses";
import type { Mode, Lecture } from "@/components/professor-ai/types";
import { useProfessorChat } from "@/hooks/useProfessorChat";
import { useProfessorQuiz } from "@/hooks/useProfessorQuiz";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Feedback dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Get available courses for selected batch and term
  const availableCourses = selectedBatch && selectedTerm 
    ? COURSES_BY_BATCH_TERM[selectedBatch]?.[selectedTerm] || [] 
    : [];
  
  // Filter lectures by selected course (matching class_name to db_key)
  const filteredLectures = selectedCourse 
    ? lectures.filter(lecture => lecture.class_name === selectedCourse)
    : [];

  // Get the display name for selected course
  const getSelectedCourseDisplayName = () => {
    const course = availableCourses.find(c => c.id === selectedCourse);
    return course?.name || selectedCourse;
  };

  // Hooks
  const chat = useProfessorChat({
    selectedCourse,
    selectedBatch,
    selectedLecture,
    mode,
  });

  const quiz = useProfessorQuiz(getSelectedCourseDisplayName() || undefined);

  // Prevent the browser page from scrolling; only the chat areas should scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Fetch lectures when batch is selected
  useEffect(() => {
    if (!selectedBatch) return;

    const fetchLectures = async () => {
      setLecturesLoading(true);
      setLecturesError(false);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-chat?endpoint=lectures&mode=${encodeURIComponent(mode)}`,
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
  }, [selectedBatch, mode]);

  const sendMessage = async (content: string, isHidden = false) => {
    // In Quiz mode, treat the message as a quiz topic request
    if (mode === "Quiz") {
      quiz.generateQuiz(content);
      // Add to messages for display
      if (!isHidden) {
        chat.setMessages(prev => [...prev, { role: "user", content }]);
      }
      return;
    }

    chat.sendMessage(content, isHidden);
  };

  // Handle create notes action (called from ProfessorChat)
  const handleCreateNotes = () => {
    if (selectedCourse && selectedLecture) {
      if (mode === "Notes Creator") {
        sendMessage("Summarize this lecture", true);
      } else if (mode === "Pre-Read") {
        sendMessage("Summarize the pre-reading material for this lecture", true);
      }
    }
  };

  const handleStartQuiz = () => {
    // No longer used - quiz starts when user types a topic
  };

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedLecture(null);
    chat.resetChat();
    quiz.resetQuiz();
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    // Note: useProfessorChat's useEffect will also clear chat when mode changes,
    // but we can be explicit if we want.
    chat.resetChat();
    quiz.resetQuiz();
  };

  const handleBatchSelect = (batchId: string) => {
    localStorage.setItem("professorSelectedBatch", batchId);
    setSelectedBatch(batchId);
    // Clear term when batch changes
    localStorage.removeItem("professorSelectedTerm");
    setSelectedTerm(null);
    setSelectedCourse(null);
    setSelectedLecture(null);
    chat.resetChat();
    quiz.resetQuiz();
  };

  const handleTermSelect = (termId: string) => {
    localStorage.setItem("professorSelectedTerm", termId);
    setSelectedTerm(termId);
    setSelectedCourse(null);
    setSelectedLecture(null);
    chat.resetChat();
    quiz.resetQuiz();
  };

  const handleBackToTermSelection = () => {
    localStorage.removeItem("professorSelectedTerm");
    setSelectedTerm(null);
    setSelectedCourse(null);
    setSelectedLecture(null);
    chat.resetChat();
    quiz.resetQuiz();
  };

  const handleOpenCourseSelection = () => {
    setSelectedCourse(null);
    setSelectedLecture(null);
    chat.resetChat();
    quiz.resetQuiz();
  };

  const handleBackToBatchSelection = () => {
    localStorage.removeItem("professorSelectedBatch");
    localStorage.removeItem("professorSelectedTerm");
    setSelectedBatch(null);
    setSelectedTerm(null);
    setSelectedCourse(null);
    setSelectedLecture(null);
    chat.resetChat();
    quiz.resetQuiz();
  };

  const handleNewChat = () => {
    chat.resetChat();
    quiz.resetQuiz();
  };

  // Handle selecting a conversation from history
  const handleSelectConversation = async (conversation: { id: string; class_id: string; mode: string; title: string }) => {
    try {
      // Set the course and mode based on conversation
      setSelectedCourse(conversation.class_id);
      setMode(conversation.mode as Mode);
      
      // Load messages for this conversation
      await chat.loadConversation(conversation);

      quiz.resetQuiz();
    } catch (error) {
      console.error("Error loading conversation:", error);
      // Toast is handled inside loadConversation? No, useProfessorChat calls toast.
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleFeedback = () => {
    setFeedbackOpen(true);
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

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Collapsible Sidebar */}
      <ProfessorSidebarNew
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        activeConversationId={chat.activeConversationId}
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

        {mode === "Quiz" ? (
          <QuizView
            quizLoading={quiz.quizLoading}
            quizResults={quiz.quizResults}
            currentQuiz={quiz.currentQuiz}
            onRetry={quiz.handleRetryQuiz}
            onNewQuiz={handleNewChat} // Using handleNewChat to reset everything including quiz
            onComplete={quiz.handleQuizComplete}
            onClose={quiz.handleQuizClose}
            messages={chat.messages}
            isLoading={chat.isLoading || quiz.quizLoading}
            streamingContent={chat.streamingContent}
            selectedLecture={selectedLecture}
            selectedCourse={selectedCourse}
            mode={mode}
            onSendMessage={sendMessage}
            onStartQuiz={handleStartQuiz}
            onCreateNotes={handleCreateNotes}
            lectures={filteredLectures}
            onLectureChange={(lecture) => setSelectedLecture(lecture)}
            lecturesLoading={lecturesLoading}
            uploadedFile={chat.uploadedFile}
            onFileUpload={chat.handleFileUpload}
            sessionId={chat.sessionId}
          />
        ) : (
          <ChatView
            messages={chat.messages}
            isLoading={chat.isLoading}
            streamingContent={chat.streamingContent}
            selectedLecture={selectedLecture}
            selectedCourse={selectedCourse}
            mode={mode}
            onSendMessage={sendMessage}
            onStartQuiz={handleStartQuiz}
            onCreateNotes={handleCreateNotes}
            lectures={filteredLectures}
            onLectureChange={(lecture) => setSelectedLecture(lecture)}
            lecturesLoading={lecturesLoading}
            uploadedFile={chat.uploadedFile}
            onFileUpload={chat.handleFileUpload}
            sessionId={chat.sessionId}
          />
        )}

        <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      </div>
    </div>
  );
};

export default ProfessorAI;
