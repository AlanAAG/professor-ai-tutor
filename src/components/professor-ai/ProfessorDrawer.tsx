import { Plus, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProfessorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
}

export const ProfessorDrawer = ({
  isOpen,
  onClose,
  onNewChat,
}: ProfessorDrawerProps) => {
  const handleNewChat = () => {
    onNewChat();
    onClose();
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
          w-64 h-full
          transition-transform duration-300 ease-in-out
          bg-card border-r border-border
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Professor AI</h2>
              <p className="text-xs text-muted-foreground">Academic Assistant</p>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={handleNewChat}
            variant="outline"
            className="w-full justify-start gap-2 bg-secondary/50 hover:bg-secondary border-border/50"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Conversation History Placeholder */}
        <ScrollArea className="flex-1 px-3">
          <div className="py-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Recent
            </p>
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Powered by RAG Technology
          </p>
        </div>
      </div>
    </>
  );
};
