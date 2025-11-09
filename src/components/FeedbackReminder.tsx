import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FeedbackReminderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedbackClick: () => void;
  onContinue: () => void;
}

export const FeedbackReminder = ({ 
  open, 
  onOpenChange, 
  onFeedbackClick,
  onContinue 
}: FeedbackReminderProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Before you go...</AlertDialogTitle>
          <AlertDialogDescription>
            We'd love to hear your thoughts! Your feedback helps us make the learning experience better for everyone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onContinue}>
            Maybe later
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            onOpenChange(false);
            onFeedbackClick();
          }}>
            Share Feedback
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
