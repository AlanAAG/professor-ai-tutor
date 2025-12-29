import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen } from "lucide-react";

interface ProfessorBatchSelectionProps {
  onBatchSelect: (batchId: string) => void;
}

const BATCHES = [
  {
    id: "2029",
    name: "2029 Batch",
    description: "Current cohort with foundational courses",
    icon: GraduationCap,
  },
  {
    id: "2028",
    name: "2028 Batch",
    description: "Advanced cohort with specialized courses",
    icon: Users,
  },
];

export const ProfessorBatchSelection = ({ onBatchSelect }: ProfessorBatchSelectionProps) => {
  return (
    <div className="w-full max-w-lg px-4">
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Welcome to Professor AI
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Select your batch to access your lectures
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {BATCHES.map((batch) => {
          const Icon = batch.icon;
          return (
            <Card
              key={batch.id}
              className="cursor-pointer transition-all bg-card border-border hover:border-primary hover:shadow-lg active:scale-[0.98]"
              onClick={() => onBatchSelect(batch.id)}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2 sm:pb-3 p-4 sm:p-6">
                <div className="p-2.5 sm:p-3 rounded-full bg-primary/10 flex-shrink-0">
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl text-foreground">{batch.name}</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm mt-0.5">{batch.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4 sm:px-6 sm:pb-6">
                <Button 
                  className="w-full" 
                  variant="outline"
                  size="default"
                >
                  Select {batch.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
