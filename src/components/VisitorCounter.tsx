import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

const VisitorCounter = () => {
  const [visitorCount, setVisitorCount] = useState<number>(0);

  useEffect(() => {
    const incrementVisitor = async () => {
      try {
        // Fetch current count
        const { data, error } = await supabase
          .from("visitor_stats")
          .select("visit_count")
          .single();

        if (error) throw error;

        // Increment count by calling the function
        const { data: newCount, error: funcError } = await supabase
          .rpc("increment_visitor_count");

        if (funcError) throw funcError;

        setVisitorCount(newCount || data?.visit_count || 0);
      } catch (error) {
        console.error("Error tracking visitor:", error);
        // Set a fallback count on error
        setVisitorCount(0);
      }
    };

    incrementVisitor();
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
      <Users className="w-4 h-4 text-primary" />
      <span className="text-sm font-semibold text-primary">
        {visitorCount.toLocaleString()} Chats created
      </span>
    </div>
  );
};

export default VisitorCounter;
