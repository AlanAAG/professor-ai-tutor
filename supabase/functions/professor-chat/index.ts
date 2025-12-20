import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Fetch lectures endpoint
    if (endpoint === "lectures") {
      console.log("Fetching lectures from backend...");
      const response = await fetch(`${PROFESSOR_API_URL}/api/lectures`, {
        headers: {
          "x-api-key": apiKey,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch lectures:", response.status);
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      console.log("Lectures fetched:", data);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Chat endpoint - POST requests
    const body = await req.json();
    console.log("Chat request:", JSON.stringify(body));
    
    // Map the frontend data to the Python backend expected format
    const payload = {
      messages: body.messages || [],
      mode: body.mode || "Study",
      selectedLecture: body.selectedLecture || "",
      cohort_id: body.cohort_id || "2029",
    };

    const response = await fetch(`${PROFESSOR_API_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      throw new Error(`Backend returned ${response.status}`);
    }

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