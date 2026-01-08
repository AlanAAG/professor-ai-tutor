import { useState } from "react";
import { MoreHorizontal, Pin, Archive, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ChatActionsMenuProps {
  conversationId: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  onRename: (id: string, newTitle: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ChatActionsMenu = ({
  conversationId,
  title,
  isPinned,
  isArchived,
  onRename,
  onPin,
  onArchive,
  onDelete,
}: ChatActionsMenuProps) => {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  const handleRename = () => {
    if (newTitle.trim()) {
      onRename(conversationId, newTitle.trim());
      setRenameDialogOpen(false);
    }
  };

  const handleDelete = () => {
    onDelete(conversationId);
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 hover:bg-secondary/80 md:opacity-0 md:group-hover/chat:opacity-100 md:focus:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setNewTitle(title);
              setRenameDialogOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onPin(conversationId, !isPinned);
            }}
          >
            <Pin className={`h-4 w-4 mr-2 ${isPinned ? "text-primary" : ""}`} />
            {isPinned ? "Unpin" : "Pin chat"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onArchive(conversationId);
            }}
          >
            <Archive className="h-4 w-4 mr-2" />
            {isArchived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialogOpen(true);
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>Enter a new name for this conversation.</DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Chat name"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
