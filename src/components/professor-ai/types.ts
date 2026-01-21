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
