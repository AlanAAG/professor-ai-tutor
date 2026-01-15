import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { Quiz } from "@/components/professor-ai/QuizCard";

export const useProfessorQuiz = (courseName: string | undefined) => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizResults, setQuizResults] = useState<{ score: number; total: number } | null>(null);
  const [lastQuizTopic, setLastQuizTopic] = useState<string>("");

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
            course: courseName || "General",
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

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setQuizResults(null);
    setLastQuizTopic("");
  };

  return {
    currentQuiz,
    quizLoading,
    quizResults,
    lastQuizTopic,
    generateQuiz,
    handleQuizComplete,
    handleQuizClose,
    handleRetryQuiz,
    resetQuiz,
  };
};
