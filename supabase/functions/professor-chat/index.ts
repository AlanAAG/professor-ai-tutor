import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cohort-id",
};

const PROFESSOR_API_URL = "https://professor-agent-platform.onrender.com";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("RENDER_API_KEY");
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");
    
    // Get cohort from header (default to 2029)
    const cohortId = req.headers.get("x-cohort-id") || "2029";

    // Fetch lectures endpoint
    if (endpoint === "lectures") {
      console.log(`Fetching lectures for cohort: ${cohortId}`);

      const fetchLectures = async (cohortHeaderValue: string) => {
        const res = await fetch(`${PROFESSOR_API_URL}/api/lectures`, {
          headers: {
            "x-api-key": apiKey,
            "x-cohort-id": cohortHeaderValue,
            "Accept": "application/json",
          },
        });

        const text = await res.text();
        console.log(
          `Lectures response for x-cohort-id=${cohortHeaderValue}: status=${res.status} bodyPreview=${text.slice(0, 500)}`
        );

        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch (e) {
          console.error("Failed to parse lectures JSON:", e);
        }

        return { res, json, rawText: text };
      };

      // First attempt: pass through cohort as-is
      let { res, json } = await fetchLectures(cohortId);

      // If backend expects a prefixed cohort id, retry once
      const lectures = (json?.lectures ?? []) as unknown[];
      if (res.ok && Array.isArray(lectures) && lectures.length === 0 && !cohortId.startsWith("cohort_")) {
        console.log(`Empty lectures for cohort ${cohortId}; retrying with cohort_${cohortId}`);
        const retry = await fetchLectures(`cohort_${cohortId}`);
        res = retry.res;
        json = retry.json;
      }

      if (!res.ok) {
        console.error("Failed to fetch lectures:", res.status);
        throw new Error(`Backend returned ${res.status}`);
      }

      console.log("Lectures fetched:", JSON.stringify(json));
      return new Response(JSON.stringify(json ?? { lectures: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chat endpoint - POST requests
    const body = await req.json();
    console.log("Chat request:", JSON.stringify(body));
    
    // Map the frontend data to the Python backend expected format
    // IMPORTANT: Send null/empty for selectedLecture if "All Lectures" is selected
    const lectureValue = body.selectedLecture === "__all__" ? null : (body.selectedLecture || null);
    
    const payload = {
      messages: body.messages || [],
      mode: body.mode || "Study",
      selectedCourse: body.selectedCourse || null, // Send the db_key
      selectedLecture: lectureValue, // null or lecture title
      cohort_id: body.cohort_id || cohortId,
    };

    console.log("Sending to backend:", JSON.stringify(payload));

    const response = await fetch(`${PROFESSOR_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-cohort-id": cohortId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      throw new Error(`Backend returned ${response.status}`);
    }

    // Check if response is streaming (text/event-stream)
    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("text/event-stream")) {
      // Forward streaming response directly
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Handle regular JSON response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Professor chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
