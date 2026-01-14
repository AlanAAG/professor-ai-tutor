import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";

const VisitorCounter = () => {
  const [messageCount, setMessageCount] = useState<number>(0);

  useEffect(() => {
    const fetchMessageCount = async () => {
      try {
        // Fetch total message count from messages table
        const { count, error } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true });

        if (error) throw error;

        setMessageCount(count || 0);
      } catch (error) {
        console.error("Error fetching message count:", error);
        setMessageCount(0);
      }
    };

    fetchMessageCount();
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
      <MessageSquare className="w-4 h-4 text-primary" />
      <span className="text-sm font-semibold text-primary">
        {messageCount.toLocaleString()} Messages sent
      </span>
    </div>
  );
};

export default VisitorCounter;
