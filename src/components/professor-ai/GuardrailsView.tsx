import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { GuardrailsConfig, Mode } from "./types";

interface GuardrailsViewProps {
  selectedBatch: string;
  selectedCourse: string | null;
}

const BLOOM_LEVELS = ["remember", "understand", "apply", "analyze", "evaluate", "create"];
const ALL_MODES: Mode[] = ["Study", "Quiz", "Notes Creator", "Pre-Read"];

export const GuardrailsView = ({ selectedBatch, selectedCourse }: GuardrailsViewProps) => {
  const [config, setConfig] = useState<GuardrailsConfig>({
    professor_id: "",
    course_key: selectedCourse || "",
    cohort_id: selectedBatch,
    max_hints_per_concept: 3,
    socratic_mode_enforced: false,
    direct_answer_bloom_threshold: "analyze",
    restricted_topics: [],
    allowed_modes: ["Study", "Quiz", "Notes Creator"],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restrictedTopicsInput, setRestrictedTopicsInput] = useState("");

  useEffect(() => {
    if (!selectedCourse) {
      setLoading(false);
      return;
    }
    const fetchGuardrails = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token || "";

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-chat?endpoint=guardrails-get&course_key=${encodeURIComponent(selectedCourse)}&cohort_id=${encodeURIComponent(selectedBatch)}`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${token}`,
              "x-cohort-id": selectedBatch,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          setRestrictedTopicsInput((data.restricted_topics || []).join(", "));
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGuardrails();
  }, [selectedCourse, selectedBatch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || "";
      const userId = sessionData.session?.user?.id || "";

      const payload = {
        ...config,
        professor_id: userId,
        course_key: selectedCourse || "",
        cohort_id: selectedBatch,
        restricted_topics: restrictedTopicsInput.split(",").map(s => s.trim()).filter(Boolean),
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/professor-chat?endpoint=guardrails-set`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token}`,
            "x-cohort-id": selectedBatch,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("Failed to save guardrails");
      toast({ title: "Saved", description: "Guardrails updated successfully." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleMode = (mode: string) => {
    setConfig(prev => ({
      ...prev,
      allowed_modes: prev.allowed_modes.includes(mode)
        ? prev.allowed_modes.filter(m => m !== mode)
        : [...prev.allowed_modes, mode],
    }));
  };

  if (!selectedCourse) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a course to configure guardrails
      </div>
    );
  }

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

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Course Guardrails</h2>
          <p className="text-muted-foreground mt-1">Configure how the AI tutors students in this course</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tutoring Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Socratic mode */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Socratic Mode</Label>
                <p className="text-sm text-muted-foreground">Guide students with hints instead of direct answers</p>
              </div>
              <Switch
                checked={config.socratic_mode_enforced}
                onCheckedChange={(v) => setConfig(prev => ({ ...prev, socratic_mode_enforced: v }))}
              />
            </div>

            {/* Max hints */}
            <div className="space-y-2">
              <Label>Max Hints Per Concept</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={config.max_hints_per_concept}
                onChange={(e) => setConfig(prev => ({ ...prev, max_hints_per_concept: parseInt(e.target.value) || 3 }))}
                className="w-32"
              />
            </div>

            {/* Bloom threshold */}
            <div className="space-y-2">
              <Label>Direct Answer Bloom Threshold</Label>
              <p className="text-sm text-muted-foreground">Below this level, provide direct answers instead of Socratic guidance</p>
              <Select
                value={config.direct_answer_bloom_threshold}
                onValueChange={(v) => setConfig(prev => ({ ...prev, direct_answer_bloom_threshold: v }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOM_LEVELS.map(level => (
                    <SelectItem key={level} value={level} className="capitalize">
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Restricted topics */}
            <div className="space-y-2">
              <Label>Restricted Topics</Label>
              <p className="text-sm text-muted-foreground">Comma-separated list of topics the AI should not discuss</p>
              <Input
                value={restrictedTopicsInput}
                onChange={(e) => setRestrictedTopicsInput(e.target.value)}
                placeholder="e.g. exam answers, final project"
              />
            </div>

            {/* Allowed modes */}
            <div className="space-y-3">
              <Label>Allowed Modes</Label>
              <div className="flex flex-wrap gap-4">
                {ALL_MODES.map(mode => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={config.allowed_modes.includes(mode)}
                      onCheckedChange={() => toggleMode(mode)}
                    />
                    <span className="text-sm">{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Guardrails
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
