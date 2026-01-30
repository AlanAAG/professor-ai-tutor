import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DiagnosticQuizData, DiagnosticSubmission } from "./types";

interface DiagnosticQuizProps {
  quiz: DiagnosticQuizData;
  onSubmit: (payload: DiagnosticSubmission) => Promise<void>;
  onClose: () => void;
}

interface Answer {
  q_id: string;
  selected: "A" | "B" | "C" | "D" | null;
  reasoning: string;
}

const MIN_REASONING_LENGTH = 20;

export const DiagnosticQuiz = ({ quiz, onSubmit, onClose }: DiagnosticQuizProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(
    quiz.questions.map((q) => ({ q_id: q.q_id, selected: null, reasoning: "" }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];
  const currentAnswer = answers[currentIndex];

  const isCurrentQuestionComplete =
    currentAnswer.selected !== null &&
    currentAnswer.reasoning.trim().length >= MIN_REASONING_LENGTH;

  const allQuestionsComplete = answers.every(
    (a) => a.selected !== null && a.reasoning.trim().length >= MIN_REASONING_LENGTH
  );

  const handleSelectOption = (option: "A" | "B" | "C" | "D") => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentIndex ? { ...a, selected: option } : a))
    );
  };

  const handleReasoningChange = (value: string) => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentIndex ? { ...a, reasoning: value } : a))
    );
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!allQuestionsComplete) return;

    setIsSubmitting(true);
    try {
      const payload: DiagnosticSubmission = {
        topic_slug: quiz.topic_slug,
        answers: answers.map((a) => ({
          q_id: a.q_id,
          selected: a.selected!,
          reasoning: a.reasoning.trim(),
        })),
      };
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  const optionKeys = ["A", "B", "C", "D"] as const;

  return (
    <Card className="bg-card/95 backdrop-blur-xl border-primary/20 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {quiz.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Knowledge Check
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {currentIndex + 1} / {quiz.questions.length}
            </span>
          </div>
        </div>
        
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mt-4">
          {quiz.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-2 rounded-full transition-all",
                idx === currentIndex
                  ? "w-6 bg-primary"
                  : answers[idx].selected !== null && answers[idx].reasoning.trim().length >= MIN_REASONING_LENGTH
                  ? "w-2 bg-primary/60"
                  : "w-2 bg-border hover:bg-border/80"
              )}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Question */}
        <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
          <p className="text-foreground font-medium leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

        {/* Options */}
        <div className="grid gap-2">
          {optionKeys.map((key) => (
            <button
              key={key}
              onClick={() => handleSelectOption(key)}
              className={cn(
                "w-full p-4 rounded-xl border-2 text-left transition-all",
                "hover:border-primary/50 hover:bg-primary/5",
                currentAnswer.selected === key
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border/50 bg-background/50"
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors",
                    currentAnswer.selected === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {key}
                </span>
                <span className="text-foreground text-sm leading-relaxed pt-0.5">
                  {currentQuestion.options[key]}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Reasoning textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Why did you choose this? <span className="text-destructive">*</span>
            </label>
            <span
              className={cn(
                "text-xs transition-colors",
                currentAnswer.reasoning.trim().length >= MIN_REASONING_LENGTH
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {currentAnswer.reasoning.trim().length} / {MIN_REASONING_LENGTH} min
            </span>
          </div>
          <Textarea
            value={currentAnswer.reasoning}
            onChange={(e) => handleReasoningChange(e.target.value)}
            placeholder="Explain your reasoning..."
            className="min-h-[100px] bg-background/50 border-border/50 focus:border-primary/50 resize-none"
          />
          {currentAnswer.selected !== null && currentAnswer.reasoning.trim().length < MIN_REASONING_LENGTH && (
            <p className="text-xs text-muted-foreground">
              Please provide at least {MIN_REASONING_LENGTH} characters explaining your choice.
            </p>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {currentIndex === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!allQuestionsComplete || isSubmitting}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Submit Quiz
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!isCurrentQuestionComplete}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
