import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, MessageSquare, LogOut, MessageCircle, Search, Pin, Archive, Settings, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import personas from "@/data/personas.json";
import { ChatActionsMenu } from "./ChatActionsMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BatchPersonas = Record<string, Record<string, { display_name?: string; professor_name: string }>>;

interface Conversation {
  id: string;
  title: string;
  class_id: string;
  mode: string;
  updated_at: string;
  is_pinned?: boolean;
  is_archived?: boolean;
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

const getInitials = (email: string | undefined, name?: string): string => {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | undefined>();

  // Load user info
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name);
      }
    };
    loadUser();
  }, []);

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

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getDisplayName(c.class_id).toLowerCase().includes(searchQuery.toLowerCase());
      const matchesArchived = showArchived ? c.is_archived : !c.is_archived;
      return matchesSearch && matchesArchived;
    });

    // Sort: pinned first, then by updated_at
    return filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [conversations, searchQuery, showArchived]);

  const pinnedConversations = filteredConversations.filter(c => c.is_pinned);
  const regularConversations = filteredConversations.filter(c => !c.is_pinned);

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

  const handleRename = async (id: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ title: newTitle })
        .eq("id", id);

      if (error) throw error;
      toast.success("Chat renamed");
      loadConversations();
    } catch (error) {
      console.error("Error renaming conversation:", error);
      toast.error("Failed to rename chat");
    }
  };

  const handlePin = async (id: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .update({ is_pinned: isPinned })
        .eq("id", id);

      if (error) throw error;
      toast.success(isPinned ? "Chat pinned" : "Chat unpinned");
      loadConversations();
    } catch (error) {
      console.error("Error pinning conversation:", error);
      toast.error("Failed to update chat");
    }
  };

  const handleArchive = async (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    const newArchiveState = !conversation?.is_archived;

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ is_archived: newArchiveState })
        .eq("id", id);

      if (error) throw error;
      toast.success(newArchiveState ? "Chat archived" : "Chat unarchived");
      loadConversations();
    } catch (error) {
      console.error("Error archiving conversation:", error);
      toast.error("Failed to archive chat");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Chat deleted");
      loadConversations();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete chat");
    }
  };

  const renderConversationItem = (conversation: Conversation) => (
    <div
      key={conversation.id}
      onClick={() => handleSelectConversation(conversation)}
      className={`group/chat w-full text-left p-3 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
        activeConversationId === conversation.id
          ? "bg-primary text-primary-foreground"
          : "hover:bg-secondary/70"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {conversation.is_pinned && (
            <Pin className="h-3 w-3 shrink-0 text-primary" />
          )}
          <span className="font-medium truncate text-sm">
            {conversation.title}
          </span>
        </div>
        <div className={`text-xs mt-0.5 ${
          activeConversationId === conversation.id 
            ? "opacity-80" 
            : "text-muted-foreground"
        }`}>
          {getDisplayName(conversation.class_id)} • {formatDate(conversation.updated_at)}
        </div>
      </div>
      <ChatActionsMenu
        conversationId={conversation.id}
        title={conversation.title}
        isPinned={conversation.is_pinned || false}
        isArchived={conversation.is_archived || false}
        onRename={handleRename}
        onPin={handlePin}
        onArchive={handleArchive}
        onDelete={handleDelete}
      />
    </div>
  );

  const userInitials = getInitials(userEmail, userName);
  const displayName = userName || userEmail?.split('@')[0] || 'User';

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
          left-14
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
        <div className="p-3 space-y-2">
          <Button
            onClick={handleNewChat}
            variant="outline"
            className="w-full justify-start gap-2 bg-secondary/50 hover:bg-secondary border-border/50 h-10"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-secondary/30 border-border/50"
            />
          </div>
        </div>

        {/* Archive Toggle */}
        <div className="px-3 pb-2">
          <Button
            variant={showArchived ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start gap-2 h-8 text-xs"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? "Show Active Chats" : "Show Archived"}
          </Button>
        </div>

        {/* Conversation History */}
        <ScrollArea className="flex-1 px-3">
          <div className="py-2 space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Loading...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? "No chats found" : showArchived ? "No archived chats" : "No conversations yet"}
                </p>
                {!searchQuery && !showArchived && (
                  <p className="text-xs mt-1">Start a new chat to begin</p>
                )}
              </div>
            ) : (
              <>
                {/* Pinned Section */}
                {pinnedConversations.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
                      <Pin className="h-3 w-3" /> Pinned
                    </p>
                    <div className="space-y-1">
                      {pinnedConversations.map(renderConversationItem)}
                    </div>
                  </div>
                )}

                {/* Regular Chats Section */}
                {regularConversations.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      {showArchived ? "Archived" : "Recent Chats"}
                    </p>
                    <div className="space-y-1">
                      {regularConversations.map(renderConversationItem)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* User Profile Footer - ChatGPT Style */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/70 transition-colors text-left">
                {/* User Avatar with Initials */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {userInitials}
                  </span>
                </div>
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {displayName}
                  </p>
                  {userEmail && userName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </p>
                  )}
                </div>
                {/* Chevron */}
                <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-[calc(100%-1.5rem)] mb-1">
              <DropdownMenuItem onClick={onFeedback} className="cursor-pointer">
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Feedback
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onLogout} 
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
};

