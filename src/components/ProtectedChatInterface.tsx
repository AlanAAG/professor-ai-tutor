import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatInterface } from "./ChatInterface";
import { ConversationSidebar } from "./ConversationSidebar";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

export const ProtectedChatInterface = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const chatRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut().catch(() => {});
    toast({
      title: "Logged out",
      description: "Successfully logged out",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-card border-b py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src="/asktetr-logo.png" 
            alt="Ask TETR Logo" 
            className="h-20 w-auto"
          />
          <p className="text-xs text-muted-foreground">
            By: Juan Pablo Rocha, Alan Ayala and Samuel Estrada
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 flex-shrink-0">
          <ConversationSidebar
            activeConversationId={activeConversationId}
            onSelectConversation={(conversation) => {
              chatRef.current?.loadConversation(conversation.id);
            }}
            onNewChat={() => chatRef.current?.handleNewChat()}
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatInterface 
            ref={chatRef} 
            onConversationChange={setActiveConversationId}
          />
        </div>
      </div>
    </div>
  );
};
