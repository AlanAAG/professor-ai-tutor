import { useEffect, useState, useCallback } from "react";
import { Plus, MessageSquare, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import personas from "@/data/personas.json";

type BatchPersonas = Record<string, Record<string, { display_name?: string; professor_name: string }>>;

interface Conversation {
  id: string;
  title: string;
  class_id: string;
  mode: string;
  updated_at: string;
}

interface ProfessorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectConversation?: (conversation: Conversation) => void;
  activeConversationId?: string | null;
  onLogout: () => void;
  onFeedback: () => void;
}

const getDisplayName = (classId: string): string => {
  const batchPersonas = personas as BatchPersonas;
  for (const batchId of Object.keys(batchPersonas)) {
    if (batchPersonas[batchId][classId]) {
      return batchPersonas[batchId][classId].display_name || classId;
    }
  }
  return classId;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

export const ProfessorDrawer = ({
  isOpen,
  onClose,
  onNewChat,
  onSelectConversation,
  activeConversationId,
  onLogout,
  onFeedback,
}: ProfessorDrawerProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('professor-conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations]);

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const handleSelectConversation = (conversation: Conversation) => {
    if (onSelectConversation) {
      onSelectConversation(conversation);
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          fixed
          z-50
          w-72 md:w-80 h-full
          transition-transform duration-300 ease-in-out
          bg-card border-r border-border
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">AT</span>
            </div>
            <div>
              <h2 className="font-bold text-primary">AskTETR</h2>
              <p className="text-xs text-muted-foreground">Chat History</p>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={handleNewChat}
            variant="outline"
            className="w-full justify-start gap-2 bg-secondary/50 hover:bg-secondary border-border/50 h-10"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Conversation History */}
        <ScrollArea className="flex-1 px-3">
          <div className="py-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Recent Chats
            </p>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Loading...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeConversationId === conversation.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary/70"
                    }`}
                  >
                    <div className="font-medium truncate text-sm mb-1">
                      {conversation.title}
                    </div>
                    <div className={`text-xs ${
                      activeConversationId === conversation.id 
                        ? "opacity-80" 
                        : "text-muted-foreground"
                    }`}>
                      {getDisplayName(conversation.class_id)} • {formatDate(conversation.updated_at)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Feedback and Logout */}
        <div className="p-3 border-t border-border space-y-2">
          <Button
            onClick={onFeedback}
            variant="ghost"
            className="w-full justify-start gap-2 h-10 text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="w-4 h-4" />
            Send Feedback
          </Button>
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start gap-2 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
};
