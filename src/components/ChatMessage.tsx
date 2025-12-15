import { Sparkles, ThumbsUp, ThumbsDown, BookOpen, Copy, Check } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

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
        await supabase
          .from('message_feedback')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id);
        setFeedback(null);
      } else {
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%] md:max-w-[70%]">
          <div className="bg-[hsl(var(--chat-user-bg))] text-[hsl(var(--chat-user-fg))] px-4 py-3 rounded-2xl rounded-br-md shadow-md">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 animate-fade-in">
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg">
        <Sparkles className="w-4 h-4 text-primary-foreground" />
      </div>
      
      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
          {content}
        </div>
        
        {/* Sources */}
        {sources && sources.length > 0 && (() => {
          const uniqueSources = sources.reduce((acc, source) => {
            const key = `${source.metadata?.title || 'Document'}-${source.metadata?.class_name || ''}`;
            if (!acc.some(s => `${s.metadata?.title || 'Document'}-${s.metadata?.class_name || ''}` === key)) {
              acc.push(source);
            }
            return acc;
          }, [] as Source[]);

          return (
            <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Sources</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {uniqueSources.map((source, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs bg-background/50 hover:bg-background transition-colors"
                  >
                    <span className="text-primary font-medium mr-1">[{idx + 1}]</span>
                    {source.metadata?.title || 'Document'}
                    {source.metadata?.source_url && (
                      <a 
                        href={source.metadata.source_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-1.5 text-primary hover:underline"
                      >
                        ↗
                      </a>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })()}
        
        {/* Action buttons */}
        {messageId && (
          <div className="flex items-center gap-1 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                feedback === 'up' 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleFeedback('up')}
              disabled={isSubmitting}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2",
                feedback === 'down' 
                  ? "text-destructive bg-destructive/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleFeedback('down')}
              disabled={isSubmitting}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};