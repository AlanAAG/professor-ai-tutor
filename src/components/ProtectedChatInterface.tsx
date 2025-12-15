import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatInterface } from "./ChatInterface";
import { ConversationSidebar } from "./ConversationSidebar";
import { Button } from "./ui/button";
import { LogOut, MessageSquare, Menu, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { FeedbackDialog } from "./FeedbackDialog";

export const ProtectedChatInterface = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleStartLearning = () => {
    chatRef.current?.handleNewChat();
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
    <>
      <div className="flex flex-col h-screen">
        {/* Minimal header like Gemini/ChatGPT */}
        <div className="bg-background border-b border-border/50 py-2 px-3 md:px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <img 
                src="/asktetr-logo.png" 
                alt="Ask TETR" 
                className="h-8 w-auto"
              />
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={() => setFeedbackDialogOpen(true)}
                title="Send feedback"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <div className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed
            z-50
            w-64 h-full
            transition-transform duration-300 ease-in-out
          `}>
            <ConversationSidebar
              activeConversationId={activeConversationId}
              onSelectConversation={(conversation) => {
                chatRef.current?.loadConversation(conversation.id);
                setSidebarOpen(false);
              }}
              onNewChat={() => {
                handleStartLearning();
                setSidebarOpen(false);
              }}
            />
          </div>
          
          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface 
              ref={chatRef} 
              onConversationChange={setActiveConversationId}
            />
          </div>
        </div>
      </div>

      <FeedbackDialog 
        open={feedbackDialogOpen} 
        onOpenChange={setFeedbackDialogOpen}
      />
    </>
  );
};
