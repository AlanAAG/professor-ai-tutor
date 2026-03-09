import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import type { StudentMastery, StudentBlindSpot } from "./types";

interface StudentProgressViewProps {
  selectedBatch: string;
}

export const StudentProgressView = ({ selectedBatch }: StudentProgressViewProps) => {
  const [mastery, setMastery] = useState<StudentMastery[]>([]);
  const [blindSpots, setBlindSpots] = useState<StudentBlindSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        const token = sessionData.session?.access_token || "";
        if (!userId) throw new Error("Not authenticated");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-chat?endpoint=analytics-student&user_id=${encodeURIComponent(userId)}`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${token}`,
              "x-cohort-id": selectedBatch,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch progress");
        const data = await response.json();
        setMastery(data.mastery || []);
        setBlindSpots(data.blind_spots || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
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

  const masteryCount = mastery.filter(m => m.status === "Mastery").length;
  const gapCount = mastery.filter(m => m.status === "Gap").length;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Progress</h2>
          <p className="text-muted-foreground mt-1">Track your mastery across topics</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{mastery.length}</div>
              <p className="text-sm text-muted-foreground">Topics Tracked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold text-green-500">{masteryCount}</span>
              </div>
              <p className="text-sm text-muted-foreground">Mastered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <span className="text-3xl font-bold text-destructive">{gapCount}</span>
              </div>
              <p className="text-sm text-muted-foreground">Gaps</p>
            </CardContent>
          </Card>
        </div>

        {/* Mastery table */}
        {mastery.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Topic Mastery</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bloom Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mastery.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.topic}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "Mastery" ? "default" : "destructive"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">{item.bloom_level_achieved}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Blind spots */}
        {blindSpots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Recurring Weak Spots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {blindSpots.map((spot, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border bg-secondary/30">
                    <div className="font-medium text-foreground">{spot.topic}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Missed {spot.gap_count} time{spot.gap_count !== 1 ? "s" : ""} · Last seen {new Date(spot.last_seen).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {mastery.length === 0 && blindSpots.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No progress data yet</p>
            <p className="text-sm mt-1">Start studying to build your learning profile</p>
          </div>
        )}
      </div>
    </div>
  );
};
