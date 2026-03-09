import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { CohortAnalyticsTopic } from "./types";

interface CohortAnalyticsViewProps {
  selectedBatch: string;
}

const gapRateColor = (rate: number) => {
  if (rate > 60) return "destructive" as const;
  if (rate > 40) return "secondary" as const;
  return "default" as const;
};

const gapRateClass = (rate: number) => {
  if (rate > 60) return "text-destructive font-bold";
  if (rate > 40) return "text-orange-500 font-semibold";
  return "text-green-500";
};

export const CohortAnalyticsView = ({ selectedBatch }: CohortAnalyticsViewProps) => {
  const [data, setData] = useState<CohortAnalyticsTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token || "";

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-chat?endpoint=analytics-cohort&cohort_id=${encodeURIComponent(selectedBatch)}`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${token}`,
              "x-cohort-id": selectedBatch,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch analytics");
        const json = await response.json();
        setData(json.data || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedBatch]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive gap-2">
        <AlertTriangle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  const criticalTopics = data.filter(t => t.gap_rate > 60);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cohort Analytics</h2>
          <p className="text-muted-foreground mt-1">Batch {selectedBatch} — Topic gap analysis</p>
        </div>

        {criticalTopics.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Attention Required</AlertTitle>
            <AlertDescription>
              {criticalTopics.length} topic{criticalTopics.length > 1 ? "s" : ""} with gap rate above 60%:{" "}
              {criticalTopics.map(t => t.topic).join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {data.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Topic Overview</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead className="text-center">Gaps</TableHead>
                    <TableHead className="text-center">Mastery</TableHead>
                    <TableHead className="text-center">Gap Rate</TableHead>
                    <TableHead className="text-center">Avg Attempts</TableHead>
                    <TableHead>Common Bloom Gap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((topic, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{topic.topic}</TableCell>
                      <TableCell className="text-center">{topic.gap_count}</TableCell>
                      <TableCell className="text-center">{topic.mastery_count}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={gapRateColor(topic.gap_rate)}>
                          <span className={gapRateClass(topic.gap_rate)}>
                            {topic.gap_rate.toFixed(1)}%
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{topic.avg_attempts.toFixed(1)}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{topic.most_common_bloom_gap}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No analytics data available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
