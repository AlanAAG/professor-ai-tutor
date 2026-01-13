import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ArrowLeft } from "lucide-react";
import type { Course } from "@/pages/ProfessorAI";

interface ProfessorCourseSelectionProps {
  batch: string;
  term: string;
  courses: Course[];
  onCourseSelect: (courseId: string) => void;
  onBack: () => void;
}

const TERM_NAMES: Record<string, string> = {
  term1: "Term 1 - Dubai",
  term2: "Term 2 - India",
  term3: "Term 3 - Singapore/Malaysia",
  term4: "Term 4 - Ghana",
};

export const ProfessorCourseSelection = ({
  batch,
  term,
  courses,
  onCourseSelect,
  onBack,
}: ProfessorCourseSelectionProps) => {
  const batchName = batch === "2029" ? "2029 Batch" : "2028 Batch";
  const termName = TERM_NAMES[term] || term;

  return (
    <div className="w-full max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Term Selection
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Select Your Course
        </h1>
        <p className="text-muted-foreground text-lg">
          {batchName} • {termName}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="cursor-pointer transition-all bg-card border-border hover:border-primary hover:shadow-lg group"
            onClick={() => onCourseSelect(course.id)}
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-sm font-medium text-foreground leading-tight">
                  {course.name}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <Button className="w-full" variant="outline" size="sm">
                Select Course
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
