import { useEffect, useState, useCallback } from "react";
import { Plus, MessageSquare, Sparkles, X } from "lucide-react";
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const ProfessorDrawer = ({
  isOpen,
  onClose,
  onNewChat,
  onSelectConversation,
  activeConversationId,
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
          w-[280px] sm:w-72 h-full
          transition-transform duration-300 ease-in-out
          bg-card border-r border-border
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm sm:text-base">Professor AI</h2>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Chat History</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:hidden"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-2 sm:p-3">
          <Button
            onClick={handleNewChat}
            variant="outline"
            className="w-full justify-start gap-2 bg-secondary/50 hover:bg-secondary border-border/50 h-9 sm:h-10 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Conversation History */}
        <ScrollArea className="flex-1 px-2 sm:px-3">
          <div className="py-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Recent Chats
            </p>
            {loading ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <p className="text-sm">Loading...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">No conversations yet</p>
                <p className="text-[10px] sm:text-xs mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-lg transition-colors ${
                      activeConversationId === conversation.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary/70 active:bg-secondary"
                    }`}
                  >
                    <div className="font-medium truncate text-xs sm:text-sm mb-0.5 sm:mb-1">
                      {conversation.title}
                    </div>
                    <div className={`text-[10px] sm:text-xs ${
                      activeConversationId === conversation.id 
                        ? "opacity-80" 
                        : "text-muted-foreground"
                    }`}>
                      <span className="truncate inline-block max-w-[120px] sm:max-w-[150px] align-bottom">
                        {getDisplayName(conversation.class_id)}
                      </span>
                      <span> • {formatDate(conversation.updated_at)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 sm:p-3 border-t border-border">
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
            Powered by RAG Technology
          </p>
        </div>
      </div>
    </>
  );
};
