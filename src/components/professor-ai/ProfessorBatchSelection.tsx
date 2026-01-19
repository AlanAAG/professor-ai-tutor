import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (alive) {
          setUserEmail(user?.email || null);
        }
      } catch (e) {
        console.error("Error fetching user", e);
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };
    fetchUser();
    return () => { alive = false; };
  }, []);

  const getFilteredBatches = () => {
    if (!userEmail) return [];
    const email = userEmail.toLowerCase();

    // Developer/Admin override
    if (email.includes("tetr")) {
      return BATCHES;
    }

    // 2029 Access
    if (email.includes("2029")) {
      return BATCHES.filter(batch => batch.id === "2029");
    }

    // 2028 Access
    if (email.includes("2028")) {
      return BATCHES.filter(batch => batch.id === "2028");
    }

    // Default: No access if no match found
    return [];
  };

  const filteredBatches = getFilteredBatches();

  if (loading) {
    return (
      <div className="w-full max-w-2xl px-4 flex justify-center items-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading access permissions...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl px-4">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome to Professor AI
        </h1>
        <p className="text-muted-foreground text-lg">
          Select your batch to access your lectures
        </p>
      </div>

      {filteredBatches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredBatches.map((batch) => {
            const Icon = batch.icon;
            return (
              <Card
                key={batch.id}
                className="cursor-pointer transition-all bg-card border-border hover:border-primary hover:shadow-lg"
                onClick={() => onBatchSelect(batch.id)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{batch.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{batch.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    className="w-full"
                    variant="outline"
                  >
                    Select {batch.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 border border-dashed border-border rounded-lg bg-card/50">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Batch Access</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your account ({userEmail}) does not have access to any specific batch content. Please contact support if you believe this is an error.
          </p>
        </div>
      )}
    </div>
  );
};
