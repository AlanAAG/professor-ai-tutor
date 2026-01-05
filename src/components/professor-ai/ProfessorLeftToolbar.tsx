import { useState, useEffect } from "react";
import { Menu, Plus, Search, ChevronUp, MessageCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";

interface ProfessorLeftToolbarProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onSearch: () => void;
  onLogout: () => void;
  onFeedback: () => void;
}

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

export const ProfessorLeftToolbar = ({
  onToggleSidebar,
  onNewChat,
  onSearch,
  onLogout,
  onFeedback,
}: ProfessorLeftToolbarProps) => {
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | undefined>();

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

  const userInitials = getInitials(userEmail, userName);
  const displayName = userName || userEmail?.split('@')[0] || 'User';

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed left-0 top-0 bottom-0 w-14 bg-card border-r border-border flex flex-col items-center py-3 z-30">
        {/* Top section */}
        <div className="flex flex-col items-center gap-2">
          {/* Toggle Sidebar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                className="h-10 w-10 hover:bg-secondary"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Open sidebar</p>
            </TooltipContent>
          </Tooltip>

          {/* New Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNewChat}
                className="h-10 w-10 hover:bg-secondary"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>New chat</p>
            </TooltipContent>
          </Tooltip>

          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onSearch}
                className="h-10 w-10 hover:bg-secondary"
              >
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Search chats</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom section - User */}
        <div className="mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center hover:opacity-90 transition-opacity">
                <span className="text-primary-foreground font-semibold text-sm">
                  {userInitials}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {userEmail && (
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                )}
              </div>
              <DropdownMenuSeparator />
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
    </TooltipProvider>
  );
};
