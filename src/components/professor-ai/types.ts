export type Mode = "Notes Creator" | "Quiz" | "Study" | "Pre-Read";

export type ExpertiseLevel = "Novice" | "Intermediate" | "Expert" | null;

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

// Diagnostic Quiz types
export interface DiagnosticQuestion {
  q_id: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
}

export interface DiagnosticQuizData {
  topic_slug: string;
  title: string;
  questions: DiagnosticQuestion[];
}

export interface DiagnosticSubmission {
  topic_slug: string;
  answers: Array<{
    q_id: string;
    selected: "A" | "B" | "C" | "D";
    reasoning: string;
  }>;
}

// System Event types
export interface SystemEvent {
  type: "persona_shift" | string;
  persona?: string;
  message?: string;
}
