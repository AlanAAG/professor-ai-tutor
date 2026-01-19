import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, ArrowLeft } from "lucide-react";

interface ProfessorTermSelectionProps {
  batch: string;
  onTermSelect: (termId: string) => void;
  onBack: () => void;
}

const TERMS_BY_BATCH: Record<string, { id: string; name: string; description: string; location: string }[]> = {
  "2029": [
    {
      id: "term1",
      name: "Term 1",
      description: "Foundational courses for new cohort",
      location: "Dubai",
    },
    {
      id: "term2",
      name: "Term 2",
      description: "Advanced courses and specializations",
      location: "India",
    },
  ],
  "2028": [
    {
      id: "term3",
      name: "Term 3",
      description: "Innovation and strategy immersion",
      location: "Singapore/Malaysia",
    },
    {
      id: "term4",
      name: "Term 4",
      description: "Social impact and leadership",
      location: "Ghana",
    },
  ],
};

export const ProfessorTermSelection = ({ batch, onTermSelect, onBack }: ProfessorTermSelectionProps) => {
  const terms = TERMS_BY_BATCH[batch] || [];
  const batchName = batch === "2029" ? "2029 Batch" : "2028 Batch";

  return (
    <div className="w-full max-w-2xl px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Select Your Term
        </h1>
        <p className="text-muted-foreground text-lg">
          {batchName} - Choose your current term
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {terms.map((term) => (
          <Card
            key={term.id}
            className="cursor-pointer transition-all bg-card border-border hover:border-primary hover:shadow-lg"
            onClick={() => onTermSelect(term.id)}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl text-foreground">{term.name}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {term.description}
              </CardDescription>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-primary font-medium">
                <MapPin className="h-3.5 w-3.5" />
                {term.location}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full" variant="outline">
                Select {term.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
