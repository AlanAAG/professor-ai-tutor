import { Sparkles, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import ReactMarkdown from 'react-markdown';
import type { Message } from "@/pages/ProfessorAI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfessorMessageProps {
  message: Message;
  isStreaming?: boolean;
  messageId?: string;
}

// Reusable markdown components configuration
const getMarkdownComponents = () => ({
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-semibold text-primary mt-6 mb-3">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-lg font-semibold text-primary mt-5 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-base font-semibold text-chat-text mt-4 mb-2">{children}</h3>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-chat-text">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-chat-text-secondary">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="my-3 ml-1 space-y-2">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="my-3 ml-1 space-y-2 list-none counter-reset-item">{children}</ol>
  ),
  li: ({ children, ...props }: { children?: React.ReactNode; ordered?: boolean }) => {
    const isOrdered = props.ordered;
    return (
      <li className="relative pl-6 leading-relaxed text-chat-text">
        <span className={cn(
          "absolute left-0 top-0 flex items-start",
          isOrdered ? "text-primary font-medium" : ""
        )}>
          {isOrdered ? null : (
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
          )}
        </span>
        {children}
      </li>
    );
  },
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-secondary/80 px-1.5 py-0.5 rounded text-sm font-mono text-primary">
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-secondary/60 border border-border/50 p-4 rounded-lg my-4 overflow-x-auto">
        <code className="text-sm font-mono text-chat-text">{children}</code>
      </pre>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-primary/50 pl-4 my-4 text-chat-text-secondary italic">
      {children}
    </blockquote>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a 
      href={href} 
      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
});

// Parse and render content with LaTeX support
const renderContentWithLatex = (content: string) => {
  const parts: React.ReactNode[] = [];

  // Process block math first ($$...$$)
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  let lastIndex = 0;
  let match;

  const segments: { type: 'text' | 'blockMath'; content: string }[] = [];
  
  while ((match = blockMathRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'blockMath', content: match[1] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < content.length) {
    segments.push({ type: 'text', content: content.slice(lastIndex) });
  }

  // Now process each segment
  segments.forEach((segment, segIndex) => {
    if (segment.type === 'blockMath') {
      try {
        parts.push(
          <div key={`block-${segIndex}`} className="my-4 overflow-x-auto flex justify-center">
            <BlockMath math={segment.content} />
          </div>
        );
      } catch {
        parts.push(
          <span key={`block-${segIndex}`} className="text-destructive">{`$$${segment.content}$$`}</span>
        );
      }
    } else {
      // Process inline math ($...$) in text segments
      const inlineParts = processInlineMath(segment.content, segIndex);
      parts.push(...inlineParts);
    }
  });

  return parts;
};

// Process inline math and render markdown
const processInlineMath = (text: string, segmentIndex: number): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  const inlineMathRegex = /\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match;
  let partIndex = 0;

  const markdownComponents = getMarkdownComponents();

  while ((match = inlineMathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textPart = text.slice(lastIndex, match.index);
      parts.push(
        <ReactMarkdown key={`md-${segmentIndex}-${partIndex++}`} components={markdownComponents}>
          {textPart}
        </ReactMarkdown>
      );
    }
    try {
      parts.push(
        <InlineMath key={`inline-${segmentIndex}-${partIndex++}`} math={match[1]} />
      );
    } catch {
      parts.push(<span key={`inline-${segmentIndex}-${partIndex++}`}>{`$${match[1]}$`}</span>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    parts.push(
      <ReactMarkdown key={`md-${segmentIndex}-${partIndex}`} components={markdownComponents}>
        {remainingText}
      </ReactMarkdown>
    );
  }

  return parts;
};

export const ProfessorMessage = ({ message, isStreaming = false, messageId }: ProfessorMessageProps) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing feedback on mount
  useEffect(() => {
    if (!messageId || isUser) return;

    const loadFeedback = async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;

        const { data } = await supabase
          .from("message_feedback")
          .select("feedback_type")
          .eq("message_id", messageId)
          .eq("user_id", session.session.user.id)
          .maybeSingle();

        if (data) {
          setFeedback(data.feedback_type as 'up' | 'down');
        }
      } catch (error) {
        console.error("Error loading feedback:", error);
      }
    };

    loadFeedback();
  }, [messageId, isUser]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = async (type: 'up' | 'down') => {
    if (!messageId || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error("Please sign in to provide feedback");
        return;
      }

      const userId = session.session.user.id;

      if (feedback === type) {
        // Remove feedback
        await supabase
          .from("message_feedback")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", userId);
        setFeedback(null);
      } else {
        // Upsert feedback
        const { error } = await supabase
          .from("message_feedback")
          .upsert(
            {
              message_id: messageId,
              user_id: userId,
              feedback_type: type,
            },
            { onConflict: "message_id,user_id" }
          );

        if (error) throw error;
        setFeedback(type);
        toast.success("Thanks for your feedback!");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  // User message - clean white bubble
  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%] md:max-w-[75%]">
          <div className="bg-foreground text-background px-4 py-3 rounded-2xl rounded-br-sm shadow-md">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // AI message - modern clean layout
  return (
    <div className="flex gap-4 animate-fade-in group">
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
        <Sparkles className="w-4 h-4 text-primary-foreground" />
      </div>
      
      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Content area with proper typography */}
        <div className="text-[15px] leading-7 text-chat-text">
          {renderContentWithLatex(message.content)}
          {isStreaming && (
            <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-blink align-middle" />
          )}
        </div>
        
        {/* Action buttons - show on hover or when feedback exists */}
        {!isStreaming && message.content.length > 0 && (
          <div className="flex items-center gap-0.5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            
            {messageId && (
              <>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-2.5 rounded-lg",
                    feedback === 'up' 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
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
                    "h-8 px-2.5 rounded-lg",
                    feedback === 'down' 
                      ? "text-destructive bg-destructive/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                  onClick={() => handleFeedback('down')}
                  disabled={isSubmitting}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
