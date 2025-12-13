import { Bot, User, BookOpen, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Source {
  content: string;
  metadata?: {
    class_name?: string;
    section?: string;
    title?: string;
    source_url?: string;
  };
  similarity?: number;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  messageId?: string;
}

export const ChatMessage = ({ role, content, sources, messageId }: ChatMessageProps) => {
  const isUser = role === "user";
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUser && messageId) {
      loadExistingFeedback();
    }
  }, [messageId, isUser]);

  const loadExistingFeedback = async () => {
    if (!messageId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('message_feedback')
      .select('feedback_type')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setFeedback(data.feedback_type as 'up' | 'down');
    }
  };

  const handleFeedback = async (type: 'up' | 'down') => {
    if (!messageId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in to provide feedback", variant: "destructive" });
        return;
      }

      if (feedback === type) {
        // Remove feedback
        await supabase
          .from('message_feedback')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);
        setFeedback(null);
      } else {
        // Upsert feedback
        await supabase
          .from('message_feedback')
          .upsert({
            message_id: messageId,
            user_id: user.id,
            feedback_type: type
          }, { onConflict: 'message_id,user_id' });
        setFeedback(type);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({ title: "Failed to submit feedback", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg animate-fade-in",
        isUser ? "bg-muted/50 ml-8" : "bg-card mr-8"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <p className="text-sm font-medium">{isUser ? "You" : "AI Tutor"}</p>
        <div className="text-sm text-foreground whitespace-pre-wrap break-words">{content}</div>
        
        {!isUser && sources && sources.length > 0 && (() => {
          // Deduplicate sources by title + class_name
          const uniqueSources = sources.reduce((acc, source) => {
            const key = `${source.metadata?.title || 'Document'}-${source.metadata?.class_name || ''}`;
            if (!acc.some(s => `${s.metadata?.title || 'Document'}-${s.metadata?.class_name || ''}` === key)) {
              acc.push(source);
            }
            return acc;
          }, [] as Source[]);

          return (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Sources from course materials:</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueSources.map((source, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    [{idx + 1}] {source.metadata?.title || 'Document'}
                    {source.metadata?.class_name && ` - ${source.metadata.class_name}`}
                    {source.metadata?.source_url && (
                      <a 
                        href={source.metadata.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-1 underline hover:text-primary"
                      >
                        →
                      </a>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })()}
        
        {!isUser && messageId && (
          <div className="flex items-center gap-1 mt-3 pt-2">
            <span className="text-xs text-muted-foreground mr-2">Was this helpful?</span>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0",
                feedback === 'up' && "text-green-500 bg-green-500/10"
              )}
              onClick={() => handleFeedback('up')}
              disabled={isSubmitting}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 p-0",
                feedback === 'down' && "text-red-500 bg-red-500/10"
              )}
              onClick={() => handleFeedback('down')}
              disabled={isSubmitting}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
