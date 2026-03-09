import { ProfessorChat } from "./ProfessorChat";
import type { Mode, Message, Lecture, DiagnosticQuizData, DiagnosticSubmission, SocraticState } from "./types";
import type { KnowledgeLevel } from "./KnowledgeLevelSelector";

interface CalibrationRequest {
  topic: string;
}

export interface ChatViewProps {
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
  isGeneratingDiagnostic?: boolean;
  socraticState?: SocraticState | null;
}

export const ChatView = ({
  ...chatProps
}: ChatViewProps) => {
  return (
    <div className="flex-1 overflow-hidden min-h-0">
      <ProfessorChat {...chatProps} />
    </div>
  );
};
