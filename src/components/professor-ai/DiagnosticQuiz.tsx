import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Helper to normalize option format (handles both object and string formats)
const getOptionIdAndText = (opt: any, fallbackKey: string): { id: string; text: string } => {
  if (typeof opt === 'string') {
    return { id: fallbackKey, text: opt };
  }
  if (typeof opt === 'object' && opt !== null) {
    return {
      id: opt.id || opt.key || fallbackKey,
      text: opt.text || opt.label || opt.value || String(opt),
    };
  }
  return { id: fallbackKey, text: String(opt) };
};

// Helper to get options array from question (handles both object and array formats)
const getOptionsArray = (options: any): Array<{ id: string; text: string }> => {
  // If options is already an array (new format)
  if (Array.isArray(options)) {
    return options.map((opt, idx) => getOptionIdAndText(opt, String.fromCharCode(65 + idx)));
  }
  // If options is an object with A, B, C, D keys (old format)
  if (typeof options === 'object' && options !== null) {
    return ['A', 'B', 'C', 'D']
      .filter(key => options[key] !== undefined)
      .map(key => ({ id: key, text: options[key] }));
  }
  return [];
};

export const DiagnosticQuiz = ({ quiz, onSubmit, onClose }: DiagnosticQuizProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(
    quiz.questions.map((q) => ({ q_id: q.q_id || q.id || String(q), selected: null, reasoning: "" }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const optionsArray = getOptionsArray(currentQuestion.options);

  const isCurrentQuestionComplete =
    currentAnswer.selected !== null &&
    currentAnswer.reasoning.trim().length >= MIN_REASONING_LENGTH;

  const allQuestionsComplete = answers.every(
    (a) => a.selected !== null && a.reasoning.trim().length >= MIN_REASONING_LENGTH
  );

  const handleSelectOption = (optionId: string) => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentIndex ? { ...a, selected: optionId as any } : a))
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

  return (
    <Card className="bg-card/95 backdrop-blur-xl border-primary/20 shadow-xl max-h-[70vh] flex flex-col">
      <CardHeader className="pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {quiz.title || "Knowledge Check"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {quiz.topic_slug?.replace(/-/g, ' ') || "Diagnostic Assessment"}
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

      <ScrollArea className="flex-1 min-h-0">
        <CardContent className="space-y-5 pb-6">
          {/* Question */}
          <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
            <p className="text-foreground font-medium leading-relaxed">
              {currentQuestion.question || currentQuestion.text || "Question text not available"}
            </p>
          </div>

          {/* Options */}
          <div className="grid gap-2">
            {optionsArray.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  currentAnswer.selected === opt.id
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border/50 bg-background/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors",
                      currentAnswer.selected === opt.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {opt.id}
                  </span>
                  <span className="text-foreground text-sm leading-relaxed pt-0.5">
                    {opt.text}
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
      </ScrollArea>
    </Card>
  );
};