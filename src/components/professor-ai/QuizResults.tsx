import { Trophy, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuizResultsProps {
  score: number;
  total: number;
  onRetry: () => void;
  onNewQuiz: () => void;
}

export const QuizResults = ({ score, total, onRetry, onNewQuiz }: QuizResultsProps) => {
  const percentage = Math.round((score / total) * 100);
  
  const getGrade = () => {
    if (percentage >= 90) return { label: "Excellent!", color: "text-green-500", bg: "bg-green-500/10" };
    if (percentage >= 70) return { label: "Good job!", color: "text-primary", bg: "bg-primary/10" };
    if (percentage >= 50) return { label: "Keep practicing!", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    return { label: "Try again!", color: "text-red-500", bg: "bg-red-500/10" };
  };

  const grade = getGrade();

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto bg-card border border-border rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 animate-fade-in">
      <div className="text-center space-y-4 sm:space-y-6">
        {/* Trophy icon */}
        <div className={cn("inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full", grade.bg)}>
          <Trophy className={cn("w-8 h-8 sm:w-10 sm:h-10", grade.color)} />
        </div>

        {/* Grade message */}
        <div className="space-y-1 sm:space-y-2">
          <h2 className={cn("text-xl sm:text-2xl font-bold", grade.color)}>{grade.label}</h2>
          <p className="text-muted-foreground text-sm sm:text-base">Quiz completed</p>
        </div>

        {/* Score display */}
        <div className="py-4 sm:py-6 border-y border-border/50">
          <div className="text-4xl sm:text-5xl font-bold text-foreground">
            {score}<span className="text-xl sm:text-2xl text-muted-foreground">/{total}</span>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground mt-1.5 sm:mt-2">{percentage}% correct</p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            <span className="text-foreground font-medium text-sm sm:text-base">{score} correct</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            <span className="text-foreground font-medium text-sm sm:text-base">{total - score} wrong</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-4">
          <Button onClick={onRetry} variant="outline" className="w-full gap-2">
            <RotateCcw className="w-4 h-4" />
            Retry Quiz
          </Button>
          <Button onClick={onNewQuiz} className="w-full">
            New Quiz
          </Button>
        </div>
      </div>
    </div>
  );
};
