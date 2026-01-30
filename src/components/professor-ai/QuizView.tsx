import { Loader2 } from "lucide-react";
import { QuizResults } from "./QuizResults";
import { QuizCard, Quiz } from "./QuizCard";
import { ProfessorChat } from "./ProfessorChat";
import type { Mode, Message, Lecture, DiagnosticQuizData, DiagnosticSubmission } from "./types";
import type { KnowledgeLevel } from "./KnowledgeLevelSelector";

interface CalibrationRequest {
  topic: string;
}

interface QuizViewProps {
  quizLoading: boolean;
  quizResults: { score: number; total: number } | null;
  currentQuiz: Quiz | null;
  onRetry: () => void;
  onNewQuiz: () => void;
  onComplete: (score: number, total: number) => void;
  onClose: () => void;

  // ProfessorChat props
  messages: Message[];
  isLoading: boolean;
  streamingContent: string;
  selectedLecture: string | null;
  selectedCourse: string | null;
  mode: Mode;
  onSendMessage: (content: string, isHidden?: boolean) => void;
  onStartQuiz: () => void;
  onCreateNotes: () => void;
  lectures: Lecture[];
  onLectureChange: (lecture: string) => void;
  lecturesLoading: boolean;
  uploadedFile: { name: string; content: string } | null;
  onFileUpload: (file: { name: string; content: string } | null) => void;
  sessionId: string;
  calibrationRequest?: CalibrationRequest | null;
  onCalibrationSelect?: (level: KnowledgeLevel) => void;
  diagnosticQuiz?: DiagnosticQuizData | null;
  onDiagnosticSubmit?: (payload: DiagnosticSubmission) => Promise<void>;
  onDiagnosticClose?: () => void;
}

export const QuizView = ({
  quizLoading,
  quizResults,
  currentQuiz,
  onRetry,
  onNewQuiz,
  onComplete,
  onClose,
  ...chatProps
}: QuizViewProps) => {
  if (quizLoading) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Generating your quiz...</p>
        </div>
      </div>
    );
  }

  if (quizResults) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <QuizResults
          score={quizResults.score}
          total={quizResults.total}
          onRetry={onRetry}
          onNewQuiz={onNewQuiz}
        />
      </div>
    );
  }

  if (currentQuiz) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-4 overflow-y-auto">
        <QuizCard
          quiz={currentQuiz}
          onComplete={onComplete}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <ProfessorChat {...chatProps} />
    </div>
  );
};
