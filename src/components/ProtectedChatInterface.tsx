import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatInterface } from "./ChatInterface";
import { ConversationSidebar } from "./ConversationSidebar";
import { Button } from "./ui/button";
import { LogOut, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";
import { FeedbackDialog } from "./FeedbackDialog";
import { FeedbackReminder } from "./FeedbackReminder";

export const ProtectedChatInterface = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
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
    setPendingAction(() => async () => {
      await supabase.auth.signOut().catch(() => {});
      toast({
        title: "Logged out",
        description: "Successfully logged out",
      });
      navigate("/");
    });
    setReminderDialogOpen(true);
  };

  const handleStartLearning = () => {
    setPendingAction(() => () => {
      chatRef.current?.handleNewChat();
    });
    setReminderDialogOpen(true);
  };

  const executePendingAction = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
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
        <div className="bg-card border-b py-3 px-4 md:py-4 md:px-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <img 
                src="/asktetr-logo.png" 
                alt="Ask TETR Logo" 
                className="h-12 md:h-20 w-auto flex-shrink-0"
              />
              <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
                By: Juan Pablo Rocha, Alan Ayala and Samuel Estrada
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFeedbackDialogOpen(true)}
                className="hidden sm:flex"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedback
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setFeedbackDialogOpen(true)}
                className="sm:hidden"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
          <div className="w-full md:w-64 flex-shrink-0">
            <ConversationSidebar
              activeConversationId={activeConversationId}
              onSelectConversation={(conversation) => {
                chatRef.current?.loadConversation(conversation.id);
              }}
              onNewChat={handleStartLearning}
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

      <FeedbackDialog 
        open={feedbackDialogOpen} 
        onOpenChange={setFeedbackDialogOpen}
      />

      <FeedbackReminder
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        onFeedbackClick={() => setFeedbackDialogOpen(true)}
        onContinue={executePendingAction}
      />
    </>
  );
};
